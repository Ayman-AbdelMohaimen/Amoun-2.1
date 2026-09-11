import { describe, it, expect } from 'vitest';
import { estimateTokens, estimateContextTokens, getModelMaxTokens, compactMessages } from './TokenManager';
import type { ChatMessage } from '@/types';

function msg(content: string, role: ChatMessage['role'] = 'user'): ChatMessage {
  return { id: crypto.randomUUID(), role, content, timestamp: new Date().toISOString() };
}

describe('TokenManager — estimateTokens', () => {
  it('returns 0 for empty input', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('estimates more tokens for Arabic than English of same length', () => {
    const arabic = estimateTokens('ا'.repeat(100));
    const english = estimateTokens('a'.repeat(100));
    expect(arabic).toBeGreaterThan(english);
  });

  it('never returns 0 for non-empty text', () => {
    expect(estimateTokens('x')).toBeGreaterThanOrEqual(1);
  });
});

describe('TokenManager — getModelMaxTokens', () => {
  it('resolves a known provider model limit', () => {
    expect(getModelMaxTokens('gemini-3.6-flash')).toBe(65536);
  });

  it('falls back to a safe default for unknown models', () => {
    expect(getModelMaxTokens('model-does-not-exist')).toBe(8192);
  });
});

describe('TokenManager — estimateContextTokens', () => {
  it('adds per-message metadata overhead', () => {
    const one = estimateContextTokens([msg('hello')]);
    const two = estimateContextTokens([msg('hello'), msg('world')]);
    expect(two).toBeGreaterThan(one);
  });

  it('includes system prompt tokens', () => {
    const base = estimateContextTokens([], '');
    const sys = estimateContextTokens([], 'أنت الوزير — مساعدك الذكي الشخصي');
    expect(sys).toBeGreaterThan(base);
  });
});

describe('TokenManager — compactMessages', () => {
  it('does not compact small histories', () => {
    const messages = Array.from({ length: 6 }, (_, i) => msg(`message number ${i}`));
    const result = compactMessages(messages, 'model-does-not-exist', 0.7);
    expect(result.compactedCount).toBe(0);
    expect(result.compactedMessages).toHaveLength(messages.length);
  });

  it('compacts long histories into a summary block', () => {
    const longText = 'مهمة رقم '.repeat(40); // ~360 Arabic chars per message
    const messages = Array.from({ length: 100 }, (_, i) => msg(`${longText}${i}`));
    const result = compactMessages(messages, 'model-does-not-exist', 0.7);
    expect(result.compactedCount).toBeGreaterThan(0);
    expect(result.savedTokens).toBeGreaterThan(0);
    // Keeps first 2 anchor messages
    expect(result.compactedMessages[0].content).toBe(messages[0].content);
    // Inserted a system summary block
    expect(result.compactedMessages.some((m) => m.role === 'system')).toBe(true);
  });
});