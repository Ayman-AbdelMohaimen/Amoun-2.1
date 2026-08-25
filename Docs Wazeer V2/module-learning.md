# 𓂀 Learning Module — Technical Reference (NEW v2.0)

> **Module ID:** `learning`
> **Owner:** AI Intelligence
> **Status:** New in v2.0
> **Complexity:** Medium-High

---

## Table of Contents

1. [Module Overview](#module-overview)
2. [Task Extraction Pipeline](#task-extraction-pipeline)
3. [Memory Extraction Pipeline](#memory-extraction-pipeline)
4. [Memory Injection Pipeline](#memory-injection-pipeline)
5. [Memory Lifecycle](#memory-lifecycle)
6. [MemoryEngine API Reference](#memoryengine-api-reference)
7. [LearningEngine API Reference](#learningengine-api-reference)
8. [Performance Considerations](#performance-considerations)

---

## Module Overview

The Learning module is the intelligence layer of Wazeer OS. It watches every AI response and extracts two types of structured knowledge:

1. **Tasks** — Action items the user or AI mentioned ("don't forget to...", "we need to...")
2. **Memories** — Long-term knowledge about the user (preferences, facts, decisions, skills, relationships, goals)

These are stored in IndexedDB and used to make Amoun smarter over time — remembering what the user likes, what they've decided, and what they need to do.

### Design Philosophy

| Principle | Implementation |
|-----------|---------------|
| **Passive Learning** | Extraction happens automatically after every AI response — no user action needed |
| **Probabilistic** | Task extraction has a 50% probability trigger to avoid over-extraction |
| **Deduplication** | Memories are checked against existing records before saving |
| **TTL-based** | Memories expire after 90 days (configurable) to keep knowledge fresh |
| **Privacy-first** | All learning data stays in IndexedDB on the user's device |

### Architecture Diagram

``
AI Response received
    │
    ├──► LearningEngine.extractTasks() ──► workspaceStore.tasks
    │       Heuristics-based, 50% probability
    │
    └──► LearningEngine.extractMemories() ──► userMemory store
            AI-powered, always runs
                │
                ▼
        MemoryEngine.getRelevantMemories() ──► System prompt augmentation
            Used on NEXT chat message
```

---

## Task Extraction Pipeline

### Trigger

Task extraction runs **after every AI response** with a **50% probability** check:

```typescript
// In AIGateway, post-processing after full AI response:
if (Math.random() < EXTRACTION_PROBABILITY) {
  const extractedTasks = await LearningEngine.extractTasks(
    aiMessage.content,
    { sessionId, source: 'ai' }
  );
  for (const task of extractedTasks) {
    workspaceStore.addTask(task);
  }
}

const EXTRACTION_PROBABILITY = 0.5;
```

### Extraction Heuristics

The `extractTasks` function uses pattern matching to identify action items:

```typescript
const TASK_PATTERNS: TaskPattern[] = [
  // English patterns
  { regex: /(?:don'?t forget to|remember to|need to|should|must|have to)\s+(.+)/i, lang: 'en' },
  { regex: /^-\s+\[(?: |x)]\s+(.+)/im, lang: 'en' },           // Markdown checkboxes
  { regex: /^\d+\.\s+(.+)/im, lang: 'en' },                     // Numbered lists
  { regex: /TODO:?\s+(.+)/i, lang: 'en' },                       // TODO keyword
  { regex: /ACTION ITEM:?\s+(.+)/i, lang: 'en' },                // Action item keyword

  // Arabic patterns
  { regex: /(?:يجب|لا تنسَ|تذكر|يجب أن|من الضروري)\s+(.+)/i, lang: 'ar' },
  { regex: /(?:مطلوب|مهم|ضروري|أولوية)\s*:?\s*(.+)/i, lang: 'ar' },
  { regex: /(?:نحتاج|علينا|ينبغي)\s+(.+)/i, lang: 'ar' },

  // Imperative verbs (English)
  { regex: /^(?:create|build|implement|fix|update|refactor|write|add|remove|deploy|test|review)\s+(.+)/im, lang: 'en' },
];
```

### Extraction Logic

```typescript
export async function extractTasks(
  aiMessage: string,
  context: ExtractionContext
): Promise<Task[]> {
  const tasks: Task[] = [];
  const lines = aiMessage.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 5) continue;

    for (const pattern of TASK_PATTERNS) {
      const match = trimmed.match(pattern.regex);
      if (match?.[1]) {
        const taskText = match[1].trim();
        if (taskText.length < 3) continue;

        tasks.push({
          id: crypto.randomUUID(),
          text: taskText,
          completed: false,
          source: 'ai',
          priority: inferPriority(taskText),
          dueDate: null,
          tags: [],
          createdAt: Date.now(),
          completedAt: null,
          executionResult: null,
          sourceSessionId: context.sessionId,
        });
        break; // One match per line
      }
    }
  }

  return tasks;
}
```

### Priority Inference

```typescript
function inferPriority(text: string): TaskPriority {
  const highKeywords = ['urgent', 'critical', 'immediately', 'عاجل', 'حرج', 'فوراً'];
  const lowKeywords = ['optional', 'nice to have', 'later', 'اختياري', 'لاحقاً'];

  const lower = text.toLowerCase();

  if (highKeywords.some(kw => lower.includes(kw))) return 'high';
  if (lowKeywords.some(kw => lower.includes(kw))) return 'low';
  return 'medium';
}
```

---

## Memory Extraction Pipeline

### Trigger

Memory extraction runs **after every AI response** with a lower probability (separate from task extraction):

```typescript
// In AIGateway, post-processing:
if (Math.random() < MEMORY_EXTRACTION_PROBABILITY) {
  const conversationContext = getLastMessages(currentSessionId, 10);
  const memories = await LearningEngine.extractMemories(
    conversationContext,
    currentSessionId
  );

  for (const memory of memories) {
    await MemoryEngine.saveMemory(memory);
  }
}

const MEMORY_EXTRACTION_PROBABILITY = 0.3;
```

### AI-Powered Extraction

Unlike task extraction (which uses heuristics), memory extraction sends the conversation to the AI with a structured extraction prompt:

```typescript
const MEMORY_EXTRACTION_PROMPT = `
Analyze the following conversation and extract lasting knowledge about the user.
Return ONLY a JSON object with this structure (no markdown, no explanation):

{
  "preferences": [
    { "category": "preference", "content": "User prefers dark theme", "confidence": 0.9 }
  ],
  "facts": [
    { "category": "fact", "content": "User is a software developer in Egypt", "confidence": 0.95 }
  ],
  "decisions": [
    { "category": "decision", "content": "User decided to use React for the project", "confidence": 0.85 }
  ],
  "skills": [
    { "category": "skill", "content": "User knows TypeScript and Python", "confidence": 0.9 }
  ],
  "relationships": [
    { "category": "relationship", "content": "User works with a team of 5", "confidence": 0.7 }
  ],
  "goals": [
    { "category": "goal", "content": "User wants to build a SaaS product by Q2", "confidence": 0.8 }
  ]
}

Rules:
- Only extract information that seems like a lasting preference, fact, or decision.
- Do NOT extract one-time questions or temporary context.
- Set confidence between 0.5 (uncertain) and 1.0 (very certain).
- Return empty arrays for categories with no extractable information.
- If nothing worth remembering, return {"preferences":[],"facts":[],"decisions":[],"skills":[],"relationships":[],"goals":[]}

Conversation:
{conversation}
`;
```

### Extraction Process

```typescript
export async function extractMemories(
  messages: ChatMessage[],
  sessionId: string
): Promise<MemoryCandidate[]> {
  const conversation = messages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  const prompt = MEMORY_EXTRACTION_PROMPT.replace('{conversation}', conversation);

  // Use a fast, cheap model for extraction (not the user's active model)
  const extraction = await callExtractionModel(prompt);

  const parsed = JSON.parse(extraction) as ExtractionResult;
  const candidates: MemoryCandidate[] = [];

  for (const category of MEMORY_CATEGORIES) {
    const items = parsed[category] ?? [];
    for (const item of items) {
      candidates.push({
        category: item.category as MemoryCategory,
        content: item.content,
        confidence: item.confidence,
        sourceSessionId: sessionId,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        accessCount: 0,
      });
    }
  }

  return candidates;
}
```

### Categorization

| Category | Description | Example |
|----------|-------------|---------|
| `preference` | User's likes and dislikes | "Prefers Vim over VS Code" |
| `fact` | Objective information about the user | "Lives in Cairo, Egypt" |
| `decision` | Decisions the user has made | "Chose PostgreSQL over MongoDB" |
| `skill` | Skills and expertise | "Knows Rust, learning Zig" |
| `relationship` | People and connections | "Has a colleague named Ahmed" |
| `goal` | Aspirations and objectives | "Wants to launch by March" |

### Deduplication

Before saving, each candidate is checked against existing memories:

```typescript
async function deduplicate(candidate: MemoryCandidate): Promise<MemoryCandidate | null> {
  const existingMemories = await MemoryEngine.getAllMemories();

  for (const existing of existingMemories) {
    const similarity = computeSimilarity(
      candidate.content,
      existing.content
    );

    if (similarity > DEDUP_THRESHOLD) {
      // Update existing memory instead of creating new one
      if (candidate.confidence > existing.confidence) {
        await MemoryEngine.updateMemory(existing.id, {
          content: candidate.content,
          confidence: candidate.confidence,
          lastAccessedAt: Date.now(),
        });
      }
      return null; // Don't create new memory
    }
  }

  return candidate; // Safe to create
}

const DEDUP_THRESHOLD = 0.85; // 85% similarity = duplicate
```

### Similarity Computation

Uses a simple word-overlap Jaccard similarity (no embedding model needed for v2.0):

```typescript
function computeSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));

  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}
```

---

## Memory Injection Pipeline

### When Injection Happens

Before every chat message is sent to the AI, relevant memories are injected into the system prompt:

```
User sends message
    │
    ▼
AIGateway.processPrompt()
    │
    ├──► MemoryEngine.getRelevantMemories(userMessage, 10)
    │       Returns top 10 most relevant memories
    │
    ├──► MemoryEngine.injectMemories(systemPrompt, memories)
    │       Appends memory context to system prompt
    │
    └──► Send augmented system prompt + message to AI
```

### Relevance Scoring

```typescript
export async function getRelevantMemories(
  query: string,
  limit: number = 10
): Promise<Memory[]> {
  const allMemories = await getAllMemories();

  const scored = allMemories
    .map(memory => ({
      memory,
      score: computeRelevance(query, memory),
    }))
    .filter(item => item.score > MIN_RELEVANCE_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Update access metadata
  for (const item of scored) {
    await updateMemory(item.memory.id, {
      lastAccessedAt: Date.now(),
      accessCount: (item.memory.accessCount ?? 0) + 1,
    });
  }

  return scored.map(item => item.memory);
}

function computeRelevance(query: string, memory: Memory): number {
  const textSimilarity = computeSimilarity(query, memory.content);
  const recency = 1 - (Date.now() - memory.lastAccessedAt) / (MEMORY_TTL_MS);
  const confidence = memory.confidence ?? 0.5;
  const accessBonus = Math.min((memory.accessCount ?? 0) * 0.05, 0.2);

  return (
    textSimilarity * 0.5 +
    Math.max(0, recency) * 0.2 +
    confidence * 0.2 +
    accessBonus * 0.1
  );
}

const MIN_RELEVANCE_SCORE = 0.15;
```

### System Prompt Augmentation

```typescript
export function injectMemories(
  systemPrompt: string,
  memories: Memory[]
): string {
  if (memories.length === 0) return systemPrompt;

  const memoryBlock = memories
    .map(m => `[${m.category}] ${m.content}`)
    .join('\n');

  return `${systemPrompt}

---
## What you know about this user:
${memoryBlock}
---
Use this context to personalize your responses. Do NOT explicitly mention that you remember things unless the user asks.`;
}
```

---

## Memory Lifecycle

### Creation

```
AI response received
    │
    ▼
LearningEngine.extractMemories(conversation, sessionId)
    │
    ├──► AI returns structured JSON
    │
    ├──► Parse into MemoryCandidate[]
    │
    ├──► Deduplicate against existing memories
    │       ├── Duplicate → update existing, skip new
    │       └── Unique → continue
    │
    ├──► Confidence check (min 0.5)
    │       └── Below threshold → discard
    │
    └──► Save to userMemory IndexedDB store
```

### Access (Read)

- Triggered before every chat message.
- `getRelevantMemories()` scores all memories against the query.
- Updates `lastAccessedAt` and `accessCount` on accessed memories.
- Used to augment the system prompt.

### Expiration (TTL)

```typescript
const DEFAULT_MEMORY_TTL_DAYS = 90;
const MEMORY_TTL_MS = DEFAULT_MEMORY_TTL_DAYS * 24 * 60 * 60 * 1000;
```

Memories older than 90 days are not automatically deleted but are:
- Penalized in relevance scoring (recency factor drops to 0 or negative).
- Effectively filtered out by `MIN_RELEVANCE_SCORE`.

### Cleanup

```typescriptn
// Runs periodically (on app startup or every 24 hours)
export async function cleanupExpiredMemories(): Promise<number> {
  const allMemories = await getAllMemories();
  const cutoff = Date.now() - MEMORY_TTL_MS;
  let deleted = 0;

  for (const memory of allMemories) {
    if (memory.createdAt < cutoff && (memory.accessCount ?? 0) === 0) {
      await MemoryEngine.deleteMemory(memory.id);
      deleted++;
    }
  }

  return deleted;
}

// Never-accessed memories older than TTL are hard-deleted.
// Accessed memories are kept regardless of age (recency penalty handles relevance).
```

### Deletion

```typescriptn
// Manual deletion (user clears a specific memory)
export async function deleteMemory(id: number): Promise<void> {
  await del(id, userMemoryStore);
}

// Bulk deletion (user clears all memories)
export async function clearAllMemories(): Promise<void> {
  await clear(userMemoryStore);
}
```

---

## MemoryEngine API Reference

**File:** `client/src/services/memoryEngine.ts`

### `getRelevantMemories(query, limit?)`

```typescriptn
/**
 * Retrieves memories most relevant to the given query.
 *
 * Scores all memories using text similarity, recency, confidence,
 * and access frequency. Returns top N results.
 *
 * @param query - The user's current message text.
 * @param limit - Maximum number of memories to return (default: 10).
 * @returns Array of relevant memories, sorted by relevance score.
 */
async function getRelevantMemories(
  query: string,
  limit?: number
): Promise<Memory[]>
```

### `injectMemories(systemPrompt, memories)`

```typescriptn
/**
 * Appends relevant memories to the system prompt.
 *
 * Formats memories as a structured block with category labels.
 * Includes instructions for the AI to use the context naturally.
 *
 * @param systemPrompt - The base system prompt.
 * @param memories - Array of memories to inject.
 * @returns The augmented system prompt.
 */
function injectMemories(
  systemPrompt: string,
  memories: Memory[]
): string
```

### `saveMemory(candidate)`

```typescriptn
/**
 * Saves a memory candidate after deduplication check.
 *
 * @param candidate - The memory to save.
 * @returns The saved memory with assigned ID, or null if duplicate.
 */
async function saveMemory(
  candidate: MemoryCandidate
): Promise<Memory | null>
```

### `getAllMemories()`

```typescriptn
/**
 * Retrieves all stored memories.
 *
 * @returns Array of all memories, sorted by creation date (newest first).
 */
async function getAllMemories(): Promise<Memory[]>
```

### `deleteMemory(id)` / `clearAllMemories()`

```typescriptn
/**
 * Deletes a specific memory by ID.
 */
async function deleteMemory(id: number): Promise<void>

/**
 * Clears all stored memories.
 */
async function clearAllMemories(): Promise<void>
```

### `cleanupExpiredMemories()`

```typescriptn
/**
 * Removes never-accessed memories older than TTL.
 *
 * @returns Number of memories deleted.
 */
async function cleanupExpiredMemories(): Promise<number>
```

---

## LearningEngine API Reference

**File:** `client/src/services/learningEngine.ts`

### `extractTasks(aiMessage, context)`

```typescriptn
/**
 * Extracts action items from an AI response using heuristic patterns.
 *
 * Scans for bullet points, TODO keywords, imperative verbs,
 * and Arabic action phrases.
 *
 * @param aiMessage - The AI's response text.
 * @param context - Extraction context (sessionId, source).
 * @returns Array of extracted Task objects.
 */
async function extractTasks(
  aiMessage: string,
  context: ExtractionContext
): Promise<Task[]>
```

### `extractMemories(messages, sessionId)`

```typescriptn
/**
 * Extracts lasting knowledge from a conversation using AI analysis.
 *
 * Sends the conversation to a fast model with an extraction prompt.
 * Returns structured memories categorized by type.
 *
 * @param messages - Recent conversation messages.
 * @param sessionId - The session to attribute memories to.
 * @returns Array of memory candidates (not yet saved).
 */
async function extractMemories(
  messages: ChatMessage[],
  sessionId: string
): Promise<MemoryCandidate[]>
```

### Types

```typescriptn
interface Memory {
  id?: number;             // autoIncrement from IndexedDB
  category: MemoryCategory;
  content: string;
  confidence: number;      // 0.0 to 1.0
  sourceSessionId: string;
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
}

type MemoryCategory =
  | 'preference'
  | 'fact'
  | 'decision'
  | 'skill'
  | 'relationship'
  | 'goal';

interface MemoryCandidate {
  category: MemoryCategory;
  content: string;
  confidence: number;
  sourceSessionId: string;
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
}

interface ExtractionContext {
  sessionId: string;
  source: 'manual' | 'ai' | 'scheduled';
}
```

---

## Performance Considerations

### Background Processing

Extraction runs **after** the response is fully streamed to the user. It does not block the UI:

```typescriptn
// Non-blocking extraction
void (async () => {
  try {
    await extractAndSaveTasks(aiMessage, context);
    await extractAndSaveMemories(messages, sessionId);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Learning] Extraction failed:', error);
    }
    // Silent failure — extraction is a bonus, not a requirement
  }
})();
```

### Batching

When multiple memories are extracted from a single conversation:

```typescriptn
// Batch IndexedDB writes to avoid hammering the database
const BATCH_SIZE = 20;

for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
  const batch = candidates.slice(i, i + BATCH_SIZE);
  const writePromises = batch.map(c => saveMemory(c));
  await Promise.allSettled(writePromises);

  // Yield to the event loop between batches
  await new Promise(resolve => setTimeout(resolve, 0));
}
```

### Memory Scoring Performance

- `computeSimilarity()` is O(n) where n = total word count of both strings.
- `getRelevantMemories()` is O(M × N) where M = number of memories and N = query word count.
- **Threshold:** If memory count exceeds 1000, switch to pre-computed embeddings (future).
- **Current mitigation:** TTL cleanup keeps the active set small.

### Extraction Model Choice

Memory extraction uses a **separate, fast, cheap model** (e.g., `gemini-2.0-flash`):

- Not the user's active model (which may be expensive or slow).
- Not stored as a chat message.
- No streaming needed — the extraction response is small JSON.

---

> صُنع بـ ❤️ بواسطة العرآب | حقوق النشر 100MillionDEV.com
>
> 𓂀 Wazeer OS — Egyptian Cyberpunk AI Assistant