/**
 * Wazeer OS v2.0 — AI Gateway
 * Single entry point for all LLM requests.
 * Routes by provider, builds system prompts, handles SSE streaming,
 * retries, fallbacks, and error sanitization.
 */

import type {
  GatewayRequest,
  GatewayResponse,
  LLMProviderId,
  ChatMessage,
  ModelInfo,
  CustomModel,
} from '@/types';
import { wazeerDB } from '@/lib/db';
import { PROVIDERS, LIMITS } from '@/constants';
import { sanitizePrompt } from '@/services/security/PromptSanitizer';
import { humanizeError, unwrapErrorMessage } from '@/lib/errorHumanize';
import { chat as geminiChat } from '@/services/providers/geminiProvider';

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Strip HTML tags from error strings to prevent XSS in UI toasts. */
function sanitizeErrorHtml(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-zA-Z]+;/g, '')
    .trim();
}

/** Look up a ModelInfo by its id across all providers. */
function findModel(modelId: string): ModelInfo | undefined {
  for (const provider of PROVIDERS) {
    const found = provider.models.find((m) => m.id === modelId);
    if (found) return found;
  }
  return undefined;
}

/** Look up a ProviderConfig by id. */
function findProvider(providerId: LLMProviderId) {
  return PROVIDERS.find((p) => p.id === providerId);
}

/** Convert ChatMessage[] to the OpenAI-compatible messages array. */
function toOpenAIMessages(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));
}

// ═══════════════════════════════════════════════════════════════════
// GLM JWT GENERATION
// ═══════════════════════════════════════════════════════════════════

/** Create a JWT for Zhipu GLM (HS256, client-side signing). */
async function generateGLMJWT(apiKey: string): Promise<string> {
  const [id, secret] = apiKey.split('.');
  if (!id || !secret) throw new Error('Invalid GLM API key format');

  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: 'HS256', sign_type: 'SIGN' }));
  const payload = btoa(
    JSON.stringify({
      api_key: id,
      exp: now + 3600,
      timestamp: now,
    }),
  );

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(`${header}.${payload}`),
  );
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${header}.${payload}.${sigB64}`;
}

// ═══════════════════════════════════════════════════════════════════
// SSE STREAMING PROXY
// ═══════════════════════════════════════════════════════════════════

interface ProxyChatResult {
  content: string;
  tokensUsed: { input: number; output: number };
}

/**
 * Generic SSE proxy call. Splits by \n, filters "data: ", parses JSON,
 * extracts choices[0].delta.content.
 */
async function proxyChat(
  url: string,
  body: Record<string, unknown>,
  headers: Record<string, string>,
  signal?: AbortSignal,
  onChunk?: (text: string) => void,
): Promise<ProxyChatResult> {
  const controller = new AbortController();
  const mergedSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;

  const timeout = setTimeout(() => controller.abort(), LIMITS.ABORT_TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: mergedSignal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(
        `${response.status} ${response.statusText}: ${sanitizeErrorHtml(errorBody)}`,
      );
    }

    // Check if response is SSE (text/event-stream) or JSON
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('text/event-stream') || contentType.includes('text/plain')) {
      // SSE streaming
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body for streaming');

      const decoder = new TextDecoder();
      let fullContent = '';
      let inputTokens = 0;
      let outputTokens = 0;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              onChunk?.(delta);
            }
            // Token usage from final chunk
            if (parsed.usage) {
              inputTokens = parsed.usage.prompt_tokens ?? 0;
              outputTokens = parsed.usage.completion_tokens ?? 0;
            }
          } catch {
            // Skip unparseable SSE lines
          }
        }
      }

      return { content: fullContent, tokensUsed: { input: inputTokens, output: outputTokens } };
    }

    // Non-streaming JSON response
    const json = await response.json();
    const content = json.choices?.[0]?.message?.content ?? '';
    const inputTokens = json.usage?.prompt_tokens ?? 0;
    const outputTokens = json.usage?.completion_tokens ?? 0;
    return { content, tokensUsed: { input: inputTokens, output: outputTokens } };
  } finally {
    clearTimeout(timeout);
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN GATEWAY
// ═══════════════════════════════════════════════════════════════════

export async function processPrompt(
  request: GatewayRequest,
): Promise<GatewayResponse> {
  const startTime = performance.now();

  // Sanitize all user messages
  const sanitizedMessages: ChatMessage[] = request.messages.map((m) => ({
    ...m,
    content: m.role === 'user' ? sanitizePrompt(m.content) : m.content,
  }));

  // Use the system prompt AS-IS from the caller (workspaceStore builds it with full context)
  const systemPrompt = request.systemPrompt;
  const apiKeys = await wazeerDB.getApiKeys();
  const modelInfo = findModel(request.modelId);
  const modelId = modelInfo?.modelId ?? request.modelId;

  // Prepare attachment text for context
  let attachmentContext = '';
  if (request.attachments?.length) {
    const parts = request.attachments
      .filter((a) => a.textContent)
      .map((a) => `[File: ${a.name}]\n${a.textContent}`);
    if (parts.length > 0) {
      attachmentContext = '\n\n---\nAttached Files:\n' + parts.join('\n\n');
    }
  }

  try {
    switch (request.providerId) {
      // ── Gemini: direct SDK from browser ───────────────────────
      case 'gemini': {
        const apiKey = apiKeys.gemini;
        if (!apiKey) throw new Error('Gemini API key not configured');

        const result = await geminiChat(
          sanitizedMessages,
          systemPrompt + attachmentContext,
          modelId,
          apiKey,
          {
            signal: request.signal,
            onChunk: request.onChunk,
            onToolCall: request.onToolCall,
            hasGrounding: modelInfo?.capabilities.grounding ?? false,
            hasTools: modelInfo?.capabilities.tools ?? false,
          },
        );

        return {
          content: result.content,
          model: modelId,
          provider: 'gemini',
          tokensUsed: result.tokensUsed,
          duration: performance.now() - startTime,
          toolCalls: result.toolCalls,
          groundingMetadata: result.groundingMetadata,
        };
      }

      // ── Claude: x-api-key, anthropic-version, SSE ─────────────
      case 'claude': {
        const apiKey = apiKeys.claude;
        if (!apiKey) throw new Error('Claude API key not configured');
        const provider = findProvider('claude');
        if (!provider) throw new Error('Claude provider not found');

        const claudeMessages = sanitizedMessages
          .filter((m) => m.role !== 'system')
          .map((m) => ({ role: m.role, content: m.content }));

        const claudeBody: Record<string, unknown> = {
          model: modelId,
          max_tokens: modelInfo?.capabilities.maxTokens ?? 8192,
          system: systemPrompt + attachmentContext,
          messages: claudeMessages,
          stream: true,
        };

        const endpointUrl = `/api/proxy/claude${provider.pathPrefix}`;

        const result = await proxyChat(
          endpointUrl,
          claudeBody,
          {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          request.signal,
          request.onChunk,
        );

        return {
          content: result.content,
          model: modelId,
          provider: 'claude',
          tokensUsed: result.tokensUsed,
          duration: performance.now() - startTime,
        };
      }

      // ── GLM: client JWT → Bearer via proxy ────────────────────
      case 'glm': {
        const apiKey = apiKeys.glm;
        if (!apiKey) throw new Error('GLM API key not configured');
        const provider = findProvider('glm');
        if (!provider) throw new Error('GLM provider not found');

        const jwt = await generateGLMJWT(apiKey);
        const endpointUrl = provider.target
          ? `${provider.target}${provider.pathPrefix}`
          : `/api/proxy/glm${provider.pathPrefix}`;

        const result = await proxyChat(
          endpointUrl,
          {
            model: modelId,
            messages: [
              { role: 'system', content: systemPrompt + attachmentContext },
              ...toOpenAIMessages(sanitizedMessages),
            ],
            stream: true,
          },
          { 'Authorization': `Bearer ${jwt}` },
          request.signal,
          request.onChunk,
        );

        return {
          content: result.content,
          model: modelId,
          provider: 'glm',
          tokensUsed: result.tokensUsed,
          duration: performance.now() - startTime,
        };
      }

      // ── Custom: user-defined endpoint + key from IndexedDB ────
      case 'custom': {
        // Custom model config is resolved by the caller (workspaceStore) — activeModel
        // holds the CustomModel.id (UUID), so a gateway-side lookup by modelId is impossible.
        const customModel = request.customModel;
        if (!customModel) throw new Error('Custom model not found — re-select it from the model dropdown');
        if (!customModel.endpoint) throw new Error('Custom model endpoint not configured');

        const customKey = customModel.apiKeyConfigKey
          ? apiKeys[customModel.apiKeyConfigKey] ?? ''
          : '';
        if (!customKey) {
          throw new Error(`API key not configured for "${customModel.providerName}" — re-add the model or update its key`);
        }
        const headers: Record<string, string> = {
          'Authorization': `Bearer ${customKey}`,
        };

        const result = await proxyChat(
          customModel.endpoint,
          {
            model: customModel.modelId,
            messages: [
              { role: 'system', content: systemPrompt + attachmentContext },
              ...toOpenAIMessages(sanitizedMessages),
            ],
            stream: customModel.hasStreaming,
          },
          headers,
          request.signal,
          request.onChunk,
        );

        return {
          content: result.content,
          model: customModel.modelId,
          provider: 'custom',
          tokensUsed: result.tokensUsed,
          duration: performance.now() - startTime,
        };
      }

      // ── opencode: runs on the Wazeer server via the CLI — no user key ─
      case 'opencode': {
        const result = await proxyChat(
          '/api/opencode/chat',
          {
            model: modelId,
            messages: [
              { role: 'system', content: systemPrompt + attachmentContext },
              ...toOpenAIMessages(sanitizedMessages),
            ],
            systemPrompt: systemPrompt + attachmentContext,
          },
          {},
          request.signal,
          request.onChunk,
        );

        return {
          content: result.content,
          model: modelId,
          provider: 'opencode',
          tokensUsed: result.tokensUsed,
          duration: performance.now() - startTime,
        };
      }

      // ── All other providers: Bearer token via proxy ────────────
      default: {
        const provider = findProvider(request.providerId);
        if (!provider) throw new Error(`Provider not found: ${request.providerId}`);

        const apiKey = apiKeys[request.providerId];
        if (!apiKey) throw new Error(`${provider.displayName} API key not configured`);

        const endpointUrl = `/api/proxy/${request.providerId}${provider.pathPrefix}`;

        const result = await proxyChat(
          endpointUrl,
          {
            model: modelId,
            messages: [
              { role: 'system', content: systemPrompt + attachmentContext },
              ...toOpenAIMessages(sanitizedMessages),
            ],
            stream: true,
          },
          { 'Authorization': `Bearer ${apiKey}` },
          request.signal,
          request.onChunk,
        );

        return {
          content: result.content,
          model: modelId,
          provider: request.providerId,
          tokensUsed: result.tokensUsed,
          duration: performance.now() - startTime,
        };
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const sanitized = sanitizeErrorHtml(message);

    // Retry once on 504 Gateway Timeout
    if (sanitized.includes('504')) {
      console.warn('[AIGateway] 504 detected, retrying...');
      try {
        // Recursive retry — only one level deep
        return await processPrompt({ ...request, signal: undefined });
      } catch (retryError) {
        throw new Error(sanitizeErrorHtml(retryError instanceof Error ? retryError.message : String(retryError)));
      }
    }

    // Auto-fallback: Gemini 3.6 Flash → 3.5 Flash on 503
    if (
      request.providerId === 'gemini' &&
      (sanitized.includes('503') || sanitized.includes('resource_exhausted')) &&
      modelId !== 'gemini-3.5-flash'
    ) {
      console.warn('[AIGateway] 503 on Gemini, falling back to gemini-3.5-flash...');
      try {
        return await processPrompt({
          ...request,
          modelId: 'gemini-3.5-flash',
        });
      } catch (fallbackError) {
        throw new Error(sanitizeErrorHtml(fallbackError instanceof Error ? fallbackError.message : String(fallbackError)));
      }
    }

    throw new Error(sanitized);
  }
}

// ═══════════════════════════════════════════════════════════════════
// MODEL TESTER (فاحص الموديلات)
// ═══════════════════════════════════════════════════════════════════

export interface ModelTestResult {
  ok: boolean;
  latencyMs: number;
  /** Arabic humanized message ready for display */
  message: string;
}

/**
 * Sends a minimal "ping" request to a specific model and reports
 * availability with the REAL provider error on failure (Arabic).
 * Used by the Settings ⚡ connection-tester — never touches chat state.
 * Acceptance: any result within 10s — a dead provider must never hang the tester.
 */
export async function testModel(
  providerId: LLMProviderId,
  modelId: string,
  customModel?: CustomModel,
  isRtl: boolean = true,
): Promise<ModelTestResult> {
  const startTime = performance.now();
  // 10s hard cap (Plan 1.1) — LIMITS.ABORT_TIMEOUT (120s) is too generous for a ping
  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), 10_000);
  try {
    await processPrompt({
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: 'ping',
          timestamp: new Date().toISOString(),
        },
      ],
      modelId,
      providerId,
      systemPrompt: 'Reply with exactly one word: pong',
      customModel,
      signal: timeoutController.signal,
    });
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      ok: true,
      latencyMs,
      message: isRtl
        ? `✅ متاح — استجاب في ${latencyMs}ms`
        : `✅ Available — responded in ${latencyMs}ms`,
    };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startTime);
    const raw = error instanceof Error ? error.message : String(error);
    // Our own 10s cap fired — friendlier than a raw abort error
    if (timeoutController.signal.aborted) {
      return {
        ok: false,
        latencyMs,
        message: isRtl
          ? '⏱ مجابش في 10 ثواني — غالباً الموديل مش متاح دلوقتي'
          : '⏱ No response within 10s — likely unavailable',
      };
    }
    // For the tester show the humanized reason WITHOUT the technical wall —
    // the raw detail goes to the console for debugging.
    console.warn(`[ModelTester] ${providerId}/${modelId} failed:`, raw);
    const unwrapped = unwrapErrorMessage(raw);
    const humanized = humanizeError(unwrapped, isRtl);
    const short = humanized.split('\n')[0]; // first line only — no tech detail block
    return { ok: false, latencyMs, message: `❌ ${short.replace(/^❌/, '').trim() || short}` };
  } finally {
    clearTimeout(timer);
  }
}
