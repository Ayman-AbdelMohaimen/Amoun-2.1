/**
 * Wazeer OS v2.0 — Memory Engine
 * Extracts, stores, retrieves, and formats cumulative user memories.
 * Extraction uses Gemini 2.0 Flash for semantic understanding.
 * Retrieval uses fast keyword matching with relevance scoring.
 */

import type { ChatMessage, UserMemory, MemoryCategory } from '@/types';
import { wazeerDB } from '@/lib/db';
import { LIMITS } from '@/constants';
import { GoogleGenAI } from '@google/genai';

// ═══════════════════════════════════════════════════════════════════
// EXTRACTION PROMPT
// ═══════════════════════════════════════════════════════════════════

const EXTRACTION_SYSTEM_PROMPT = `You are a memory extraction agent. Analyze the conversation and extract lasting facts, preferences, decisions, skills, and context about the user.

Return a JSON array of objects. Each object must have:
- "category": one of "preference", "fact", "decision", "skill", "context"
- "content": concise statement (max 200 chars)
- "confidence": number 0.0-1.0

Rules:
- Only extract NEW information that is durable (not ephemeral chat).
- Skip greetings, pleasantries, and one-off questions.
- Focus on: name, language preference, coding style, project details, tool preferences, recurring topics.
- If nothing worth remembering, return an empty array: []
- Return ONLY the JSON array, no markdown, no explanation.

Example output:
[{"category":"preference","content":"User prefers dark theme and Arabic language","confidence":0.95},{"category":"skill","content":"User works with React and TypeScript daily","confidence":0.9}]`;

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Tokenize a string into lowercase word shingles (unigrams + bigrams). */
function tokenize(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[\p{P}\s]+/gu, ' ')
    .split(' ')
    .filter((w) => w.length > 1);

  const unigrams = words;
  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`);
  }
  return [...unigrams, ...bigrams];
}

/** Compute a relevance score between a query and a memory based on token overlap. */
function computeRelevance(queryTokens: string[], memoryContent: string): number {
  const memoryTokens = new Set(tokenize(memoryContent));
  let matches = 0;
  for (const token of queryTokens) {
    if (memoryTokens.has(token)) matches++;
  }
  // Normalize by query length to avoid bias toward long queries
  return queryTokens.length > 0 ? matches / queryTokens.length : 0;
}

/** Parse the JSON array from the LLM response, tolerating markdown fences. */
function parseExtractionResponse(raw: string): Array<{ category: string; content: string; confidence: number }> {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.category === 'string' &&
        typeof item.content === 'string' &&
        typeof item.confidence === 'number',
    );
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════

/**
 * Sends recent messages to Gemini 2.0 Flash for memory extraction.
 * Saves new memories to the userMemory store.
 *
 * @param messages - Recent chat messages to analyze.
 * @param sessionId - Source session for provenance tracking.
 * @returns Array of newly extracted and persisted UserMemory objects.
 */
export async function extractMemories(
  messages: ChatMessage[],
  sessionId: string,
): Promise<UserMemory[]> {
  if (messages.length === 0) return [];

  // Get the Gemini API key
  const apiKeys = await wazeerDB.getApiKeys();
  const apiKey = apiKeys.gemini ?? apiKeys.google;
  if (!apiKey) return [];

  // Build conversation summary for the extraction model
  const conversationText = messages
    .slice(-10) // Last 10 messages for context
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const genAI = new GoogleGenAI({ apiKey });

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [{ role: 'user', parts: [{ text: conversationText }] }],
      config: {
        systemInstruction: EXTRACTION_SYSTEM_PROMPT,
        maxOutputTokens: 2048,
        temperature: 0.1, // Low temperature for factual extraction
      },
    });

    const raw = response.text;
    if (!raw) return [];

    const extracted = parseExtractionResponse(raw);
    const newMemories: UserMemory[] = [];

    for (const item of extracted) {
      // Skip low-confidence extractions
      if (item.confidence < 0.5) continue;

      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + LIMITS.MEMORY_DEFAULT_TTL_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();

      const memory: UserMemory = {
        id: crypto.randomUUID(),
        category: item.category as MemoryCategory,
        content: item.content.slice(0, 200),
        confidence: Math.min(1, Math.max(0, item.confidence)),
        sourceSessionId: sessionId,
        createdAt: now.toISOString(),
        expiresAt,
        accessCount: 0,
      };

      await wazeerDB.put('userMemory', memory);
      newMemories.push(memory);
    }

    return newMemories;
  } catch (error) {
    console.warn('[MemoryEngine] Extraction failed:', error);
    return [];
  }
}

/**
 * Retrieves relevant memories for a query using keyword matching.
 * Excludes expired memories. Sorts by relevance score.
 *
 * @param query - The user's current query or topic.
 * @param limit - Maximum number of memories to return.
 * @returns Array of relevant UserMemory objects, sorted by relevance descending.
 */
export async function getRelevantMemories(
  query: string,
  limit: number = 10,
): Promise<UserMemory[]> {
  const allMemories = await wazeerDB.getAll<UserMemory>('userMemory');
  const now = new Date().toISOString();
  const queryTokens = tokenize(query);

  // Filter out expired memories
  const activeMemories = allMemories.filter((m) => {
    if (m.expiresAt && m.expiresAt < now) return false;
    return true;
  });

  if (activeMemories.length === 0) return [];

  // Score and sort by relevance
  const scored = activeMemories.map((memory) => ({
    memory,
    score: computeRelevance(queryTokens, memory.content),
  }));

  scored.sort((a, b) => b.score - a.score);

  // Update access count for returned memories
  const results = scored.slice(0, limit);
  const nowIso = new Date().toISOString();

  for (const { memory } of results) {
    await wazeerDB.put('userMemory', {
      ...memory,
      accessCount: memory.accessCount + 1,
      lastAccessedAt: nowIso,
    });
  }

  return results.map((r) => r.memory);
}

/**
 * Formats memories into a string suitable for injection into system prompts.
 * Groups by category for readability.
 *
 * @param memories - Array of UserMemory objects to format.
 * @returns Formatted string for system prompt context injection.
 */
export function formatMemoriesAsContext(memories: UserMemory[]): string {
  if (memories.length === 0) return '';

  // Group by category
  const groups: Record<string, string[]> = {};
  for (const memory of memories) {
    const cat = memory.category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(`- ${memory.content}`);
  }

  const categoryLabels: Record<string, string> = {
    preference: 'Preferences',
    fact: 'Facts',
    decision: 'Decisions',
    skill: 'Skills',
    context: 'Context',
  };

  const sections: string[] = [];
  for (const [category, items] of Object.entries(groups)) {
 const label = categoryLabels[category] ?? category;
    sections.push(`${label}:
${items.join('\n')}`);
  }

  return `\n\n[User Memory — reference these naturally when relevant]\n${sections.join('\n\n')}`;
}
