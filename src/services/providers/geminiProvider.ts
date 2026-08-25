/**
 * Wazeer OS v2.0 — Gemini Provider
 * Direct browser SDK via @google/genai.
 * Supports: streaming, grounding (googleSearchRetrieval), tool calling (ReAct max 3).
 */

import { GoogleGenAI } from '@google/genai';
import type { ChatMessage, ToolCall } from '@/types';
import { LIMITS } from '@/constants';
import {
  TOOL_DECLARATIONS,
  executeToolCall,
  buildFunctionResponsePart,
  hasFunctionCalls,
  extractFunctionCalls,
} from '@/services/tools/ToolRegistry';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface GeminiProviderOptions {
  signal?: AbortSignal;
  onChunk?: (text: string) => void;
  onToolCall?: (toolCall: ToolCall) => void;
  hasGrounding?: boolean;
  hasTools?: boolean;
}

export interface GeminiProviderResult {
  content: string;
  tokensUsed: { input: number; output: number };
  toolCalls?: ToolCall[];
  groundingMetadata?: unknown;
}

// ═══════════════════════════════════════════════════════════════════
// MESSAGE CONVERSION
// ═══════════════════════════════════════════════════════════════════

/** Convert ChatMessage[] to Gemini Content[] format. */
function toGeminiContents(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
}

// ═══════════════════════════════════════════════════════════════════
// MAIN CHAT FUNCTION
// ═══════════════════════════════════════════════════════════════════

export async function chat(
  messages: ChatMessage[],
  systemPrompt: string,
  model: string,
  apiKey: string,
  options: GeminiProviderOptions = {},
): Promise<GeminiProviderResult> {
  const genAI = new GoogleGenAI({ apiKey });
  const contents = toGeminiContents(messages);

  // Build generation config for the new @google/genai v2 SDK
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: Record<string, any> = {
    maxOutputTokens: 65536,
    systemInstruction: systemPrompt,
  };

  // Add tool declarations or grounding (Gemini API prohibits combining googleSearch and functionDeclarations)
  if (options.hasTools) {
    config.tools = [{ functionDeclarations: TOOL_DECLARATIONS }];
  } else if (options.hasGrounding) {
    config.tools = [{ googleSearch: {} }];
  }

  // If no tools, simple single-pass stream
  if (!options.hasTools) {
    return streamSinglePass(genAI, model, contents, config, options);
  }

  // ReAct loop with tool calling (max 3 iterations)
  return reactLoop(genAI, model, contents, config, options);
}

// ═══════════════════════════════════════════════════════════════════
// SINGLE-PASS STREAM (no tools)
// ═══════════════════════════════════════════════════════════════════

async function streamSinglePass(
  genAI: GoogleGenAI,
  modelName: string,
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: Record<string, any>,
  options: GeminiProviderOptions,
): Promise<GeminiProviderResult> {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), LIMITS.ABORT_TIMEOUT);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const stream = await genAI.models.generateContentStream({
      model: modelName,
      contents,
      config: { ...config, abortSignal: signal },
    });

    let fullContent = '';
    let inputTokens = 0;
    let outputTokens = 0;
    let groundingMetadata: unknown = undefined;

    for await (const chunk of stream) {
      // Check abort
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

      const text = chunk.text;
      if (text) {
        fullContent += text;
        options.onChunk?.(text);
      }

      // Extract grounding metadata from response
      if (chunk.candidates?.[0]?.groundingMetadata) {
        groundingMetadata = chunk.candidates[0].groundingMetadata;
      }

      // Extract usage metadata
      if (chunk.usageMetadata) {
        inputTokens = chunk.usageMetadata.promptTokenCount ?? 0;
        outputTokens = chunk.usageMetadata.candidatesTokenCount ?? 0;
      }
    }

    return { content: fullContent, tokensUsed: { input: inputTokens, output: outputTokens }, groundingMetadata };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ═══════════════════════════════════════════════════════════════════
// REACT LOOP (with tool calling)
// ═══════════════════════════════════════════════════════════════════

async function reactLoop(
  genAI: GoogleGenAI,
  modelName: string,
  initialContents: Array<{ role: string; parts: Array<{ text: string }> }>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: Record<string, any>,
  options: GeminiProviderOptions,
): Promise<GeminiProviderResult> {
  const maxIterations = LIMITS.GEMINI_REACT_MAX_ITERATIONS;
  const allToolCalls: ToolCall[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let contents: any[] = [...initialContents];
  let fullContent = '';
  let inputTokens = 0;
  let outputTokens = 0;
  let groundingMetadata: unknown = undefined;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), LIMITS.ABORT_TIMEOUT);
    const signal = options.signal
      ? AbortSignal.any([options.signal, timeoutController.signal])
      : timeoutController.signal;

    try {
      const stream = await genAI.models.generateContentStream({
        model: modelName,
        contents,
        config: { ...config, abortSignal: signal },
      });

      let iterationContent = '';
      let iterationParts: unknown[] = [];

      for await (const chunk of stream) {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

        const text = chunk.text;
        if (text) {
          iterationContent += text;
          options.onChunk?.(text);
        }

        if (chunk.candidates?.[0]?.groundingMetadata) {
          groundingMetadata = chunk.candidates[0].groundingMetadata;
        }

        // Extract usage metadata
        if (chunk.usageMetadata) {
          inputTokens += chunk.usageMetadata.promptTokenCount ?? 0;
          outputTokens += chunk.usageMetadata.candidatesTokenCount ?? 0;
        }

        // Collect parts from chunks for tool call detection
        if (chunk.candidates?.[0]?.content?.parts) {
          iterationParts = chunk.candidates[0].content.parts;
        }
      }

      fullContent += iterationContent;

      // Check for function calls in the response
      if (iterationParts.length > 0 && hasFunctionCalls(iterationParts as Array<{ functionCall?: unknown }>)) {
        const calls = extractFunctionCalls(iterationParts as Array<{ functionCall?: unknown }>);

        // Append model's response (with function calls) to conversation
        contents.push({
          role: 'model',
          parts: iterationParts,
        });

        // Execute each tool call and build function response parts
        const functionResponseParts = [];
        for (const call of calls) {
          const resultText = await executeToolCall(call.name, call.args);
          functionResponseParts.push(
            buildFunctionResponsePart(call.id, call.name, resultText),
          );

          const toolCall: ToolCall = {
            name: call.name,
            args: call.args,
            result: resultText,
          };
          allToolCalls.push(toolCall);
          options.onToolCall?.(toolCall);
        }

        // Append function responses to conversation
        contents.push({
          role: 'user',
          parts: functionResponseParts,
        });

        // Continue loop — the model will see tool results
        continue;
      }

      // No function calls — we're done
      break;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return {
    content: fullContent,
    tokensUsed: { input: inputTokens, output: outputTokens },
    toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
    groundingMetadata,
  };
}
