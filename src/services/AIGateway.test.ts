import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const geminiChat = vi.hoisted(() => vi.fn());
const getApiKeys = vi.hoisted(() => vi.fn());

vi.mock('@/lib/db', () => ({ wazeerDB: { getApiKeys } }));
vi.mock('@/services/providers/geminiProvider', () => ({ chat: geminiChat }));

import { processPrompt, testModel } from './AIGateway';
import type { GatewayRequest, CustomModel } from '@/types';

const KEYS = {
  gemini: 'g-key',
  claude: 'c-key',
  glm: 'glm-id.glm-secret',
  openai: 'o-key',
};

function baseRequest(overrides: Partial<GatewayRequest> = {}): GatewayRequest {
  return {
    providerId: 'openai',
    modelId: 'gpt-4o-mini',
    systemPrompt: 'You are Wazeer',
    messages: [
      { id: 'm1', role: 'user', content: 'hello', timestamp: new Date().toISOString() },
    ],
    ...overrides,
  };
}

function sseResponse(chunks: string[], usage?: { input: number; output: number }): Response {
  const parts = chunks.map(
    (c) => `data: ${JSON.stringify({ choices: [{ delta: { content: c } }] })}\n\n`,
  );
  if (usage) {
    parts.push(
      `data: ${JSON.stringify({
        choices: [{}],
        usage: { prompt_tokens: usage.input, completion_tokens: usage.output },
      })}\n\n`,
    );
  }
  parts.push('data: [DONE]\n\n');
  return new Response(parts.join(''), { headers: { 'content-type': 'text/event-stream' } });
}

beforeEach(() => {
  getApiKeys.mockReset();
  getApiKeys.mockResolvedValue({ ...KEYS });
  geminiChat.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AIGateway — routing', () => {
  it('routes a default provider (openai) through the proxy with Bearer auth', async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse(['Hel', 'lo'], { input: 12, output: 2 }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await processPrompt(baseRequest());

    expect(res.content).toBe('Hello');
    expect(res.provider).toBe('openai');
    expect(res.model).toBe('gpt-4o-mini');
    expect(res.tokensUsed).toEqual({ input: 12, output: 2 });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/proxy/openai/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer o-key');
  });

  it('throws a human message when the provider key is not configured', async () => {
    getApiKeys.mockResolvedValue({});
    vi.stubGlobal('fetch', vi.fn());

    await expect(processPrompt(baseRequest())).rejects.toThrow('OpenAI API key not configured');
  });

  it('routes claude with x-api-key + anthropic-version headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse(['مرحبا']));
    vi.stubGlobal('fetch', fetchMock);

    const res = await processPrompt(baseRequest({ providerId: 'claude', modelId: 'claude-3.5' }));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/proxy/claude/v1/messages',
      expect.objectContaining({ method: 'POST' }),
    );
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers['x-api-key']).toBe('c-key');
    expect(init.headers['anthropic-version']).toBe('2023-06-01');
    expect(res.model).toBe('claude-3-5-sonnet-20241022');
  });

  it('routes gemini through the direct SDK', async () => {
    geminiChat.mockResolvedValue({
      content: 'اهلا بيك',
      tokensUsed: { input: 3, output: 4 },
      toolCalls: [],
      groundingMetadata: undefined,
    });

    const res = await processPrompt(baseRequest({ providerId: 'gemini', modelId: 'gemini-3.6-flash' }));

    expect(geminiChat).toHaveBeenCalledTimes(1);
    expect(res.content).toBe('اهلا بيك');
    expect(res.provider).toBe('gemini');
  });

  it('routes glm by signing a JWT and calling the direct endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse(['رد GLM']));
    vi.stubGlobal('fetch', fetchMock);

    const res = await processPrompt(baseRequest({ providerId: 'glm', modelId: 'glm-4-flash' }));

    expect(res.content).toBe('رد GLM');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      expect.anything(),
    );
    const auth = fetchMock.mock.calls[0][1].headers.Authorization as string;
    expect(auth.startsWith('Bearer ey')).toBe(true);

    // Decode the signed JWT payload
    const [header, payload] = auth.replace('Bearer ', '').split('.');
    expect(JSON.parse(atob(header)).alg).toBe('HS256');
    const decoded = JSON.parse(atob(payload));
    expect(decoded.api_key).toBe('glm-id');
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('routes custom models with their own endpoint + key', async () => {
    const customModel: CustomModel = {
      id: 'c1',
      providerName: 'Local',
      modelId: 'llama3',
      endpoint: 'http://localhost:11434/v1/chat/completions',
      apiKeyConfigKey: 'openai',
      hasVision: false,
      hasStreaming: true,
      createdAt: new Date().toISOString(),
    };
    const fetchMock = vi.fn().mockResolvedValue(sseResponse(['من الموديل المخصص']));
    vi.stubGlobal('fetch', fetchMock);

    const res = await processPrompt(baseRequest({ providerId: 'custom', customModel }));

    expect(res.content).toBe('من الموديل المخصص');
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:11434/v1/chat/completions', expect.anything());
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer o-key');
  });

  it('requires a customModel for providerId=custom', async () => {
    await expect(processPrompt(baseRequest({ providerId: 'custom' }))).rejects.toThrow(
      'Custom model not found',
    );
  });
});

describe('AIGateway — security', () => {
  it('redacts secrets from user messages before they reach the provider', async () => {
    geminiChat.mockResolvedValue({
      content: 'ok',
      tokensUsed: { input: 1, output: 1 },
      toolCalls: [],
      groundingMetadata: undefined,
    });

    await processPrompt(
      baseRequest({
        providerId: 'gemini',
        modelId: 'gemini-3.6-flash',
        messages: [
          {
            id: 'm1',
            role: 'user',
            content: 'use sk-abcdefghijklmnopqrstuvwx for the API',
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    );

    const sent = geminiChat.mock.calls[0][0] as Array<{ content: string }>;
    expect(sent[0].content).toContain('[REDACTED_API_KEY]');
    expect(sent[0].content).not.toContain('sk-abcdefghijklmnopqrstuvwx');
  });

  it('strips HTML from provider error messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<b>boom</b> &amp; <script>evil()</script>', {
        status: 500,
        statusText: 'Internal Server Error',
      })),
    );

    let caught: unknown;
    try {
      await processPrompt(baseRequest());
    } catch (err) {
      caught = err;
    }

    const message = caught instanceof Error ? caught.message : String(caught);
    expect(message).toContain('boom');
    expect(message).not.toMatch(/<[^>]+>/);
  });

  it('retries once on 504 Gateway Timeout', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('gateway timeout', { status: 504, statusText: 'Gateway Timeout' }))
      .mockResolvedValueOnce(sseResponse(['تعافى']));
    vi.stubGlobal('fetch', fetchMock);

    const res = await processPrompt(baseRequest());

    expect(res.content).toBe('تعافى');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls back from gemini-3.6-flash to gemini-3.5-flash on 503', async () => {
    geminiChat
      .mockRejectedValueOnce(new Error('503 Service Unavailable'))
      .mockResolvedValueOnce({
        content: 'المساعدة بعد الفشل',
        tokensUsed: { input: 1, output: 1 },
        toolCalls: [],
        groundingMetadata: undefined,
      });

    const res = await processPrompt(baseRequest({ providerId: 'gemini', modelId: 'gemini-3.6-flash' }));

    expect(geminiChat).toHaveBeenCalledTimes(2);
    expect(geminiChat.mock.calls[1][2]).toBe('gemini-3.5-flash');
    expect(res.content).toBe('المساعدة بعد الفشل');
  });
});

describe('AIGateway — testModel (فاحص الموديلات)', () => {
  it('reports success when the provider answers', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sseResponse(['pong'])));

    const result = await testModel('openai', 'gpt-4o-mini');
    expect(result.ok).toBe(true);
    expect(result.message).toContain('متاح');
  });

  it('reports a friendly failure when the provider rejects', async () => {
    geminiChat.mockRejectedValue(new Error('401 Unauthorized: Invalid API key'));

    const result = await testModel('gemini', 'gemini-3.6-flash');
    expect(result.ok).toBe(false);
    expect(result.message.startsWith('❌')).toBe(true);
  });
});