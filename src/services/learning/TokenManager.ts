/**
 * Wazeer OS v2.1 — Token Manager & Context Compactor
 * Handles token estimation, context threshold budgeting, and automatic compaction.
 *
 * Rules:
 * - English/Code: ~4 chars per token
 * - Arabic: ~2.5 chars per token
 * - Threshold: 70% of maxTokens triggers auto-compaction
 */

import type { ChatMessage } from '@/types';
import { PROVIDERS } from '@/constants';

// ═══════════════════════════════════════════════════════════════════
// TOKEN ESTIMATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Heuristic token estimation supporting mixed Arabic, English, and Code.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;

  let arabicChars = 0;
  let otherChars = 0;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Arabic unicode block 0x0600 - 0x06FF
    if (code >= 0x0600 && code <= 0x06ff) {
      arabicChars++;
    } else {
      otherChars++;
    }
  }

  // ~2.5 chars per Arabic token, ~4 chars per English/code token
  const arabicTokens = Math.ceil(arabicChars / 2.5);
  const otherTokens = Math.ceil(otherChars / 4.0);

  return Math.max(1, arabicTokens + otherTokens);
}

/**
 * Calculates total estimated tokens for an array of chat messages plus system prompt.
 */
export function estimateContextTokens(
  messages: ChatMessage[],
  systemPrompt: string = '',
): number {
  let total = estimateTokens(systemPrompt);

  for (const m of messages) {
    total += estimateTokens(m.content);
    // Add small overhead for message metadata/role
    total += 4;
  }

  return total;
}

/**
 * Retrieves the maximum context token limit for a given model.
 */
export function getModelMaxTokens(modelId: string): number {
  for (const provider of PROVIDERS) {
    const found = provider.models.find((m) => m.id === modelId || m.modelId === modelId);
    if (found?.capabilities?.maxTokens) {
      return found.capabilities.maxTokens;
    }
  }
  // Default safe context limit
  return 8192;
}

// ═══════════════════════════════════════════════════════════════════
// CONTEXT COMPACTION
// ═══════════════════════════════════════════════════════════════════

export interface CompactionResult {
  compactedMessages: ChatMessage[];
  compactedCount: number;
  savedTokens: number;
  summaryBlock?: string;
}

/**
 * Compacts conversation history when it crosses the threshold (e.g. 70% of max context).
 * Preserves the first 2 messages (context anchor) and the most recent N messages,
 * summarizing the middle history into a structured context block.
 */
export function compactMessages(
  messages: ChatMessage[],
  modelId: string,
  thresholdRatio: number = 0.7,
  keepRecentCount: number = 6,
): CompactionResult {
  const maxTokens = getModelMaxTokens(modelId);
  const currentTokens = estimateContextTokens(messages);
  const threshold = maxTokens * thresholdRatio;

  if (currentTokens <= threshold || messages.length <= keepRecentCount + 2) {
    return {
      compactedMessages: messages,
      compactedCount: 0,
      savedTokens: 0,
    };
  }

  // Separate messages to preserve vs compact
  const firstMessages = messages.slice(0, 2); // Initial setup / user intent
  const middleMessages = messages.slice(2, -keepRecentCount);
  const recentMessages = messages.slice(-keepRecentCount);

  if (middleMessages.length === 0) {
    return {
      compactedMessages: messages,
      compactedCount: 0,
      savedTokens: 0,
    };
  }

  // Build condensed summary of middle messages
  const summaryPoints = middleMessages.map((m) => {
    const roleLabel = m.role === 'user' ? 'المستخدم' : 'أمون';
    const preview = m.content.length > 160 ? m.content.slice(0, 160) + '…' : m.content;
    return `• [${roleLabel}]: ${preview.replace(/\n+/g, ' ')}`;
  });

  const summaryContent = [
    '📦 [ملخص سياق المحادثة السابقة المدمج آلياً لحفظ الذاكرة والسرعة]:',
    ...summaryPoints,
  ].join('\n');

  const summaryMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'system',
    content: summaryContent,
    timestamp: new Date().toISOString(),
  };

  const compactedMessages = [...firstMessages, summaryMessage, ...recentMessages];
  const newTokens = estimateContextTokens(compactedMessages);
  const savedTokens = Math.max(0, currentTokens - newTokens);

  return {
    compactedMessages,
    compactedCount: middleMessages.length,
    savedTokens,
    summaryBlock: summaryContent,
  };
}
