/**
 * Wazeer OS v2.1 — Learning Engine
 * Dual extraction:
 * 1. AI-powered structured JSON extraction (from tasks_extracted: block in AI response)
 * 2. Heuristic fallback (regex patterns for Arabic/English imperative sentences)
 */

import type { Task, TaskPriority } from '@/types';

// ═══════════════════════════════════════════════════════════════════
// AI-POWERED EXTRACTION (from tasks_extracted: JSON block)
// ═══════════════════════════════════════════════════════════════════

interface ExtractedTaskJSON {
  text: string;
  priority?: string;
  dueDate?: string;
  tags?: string[];
}

/**
 * Parses the tasks_extracted: JSON block from AI responses.
 * This is the PRIMARY extraction method — the AI is instructed to output
 * tasks in this format via the system prompt.
 */
function extractTasksFromJSON(aiMessage: string, sessionId: string): Task[] {
  const tasks: Task[] = [];

  const patterns = [
    /tasks_extracted:\s*\n?(\[[\s\S]*?\])/g,
    /tasks_extracted:\s*(\[[^\]]*\])/g,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(aiMessage)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (!Array.isArray(parsed)) continue;

        for (const item of parsed) {
          if (!item || typeof item !== 'object' || !item.text) continue;

          const validPriorities: TaskPriority[] = ['critical', 'high', 'medium', 'low'];
          const priority = validPriorities.includes(item.priority)
            ? (item.priority as TaskPriority)
            : 'medium';

          tasks.push({
            id: crypto.randomUUID(),
            text: String(item.text).slice(0, 300),
            completed: false,
            source: 'ai',
            priority,
            dueDate: item.dueDate || undefined,
            tags: Array.isArray(item.tags) ? item.tags.map(String).slice(0, 5) : [],
            createdAt: new Date().toISOString(),
            sourceSessionId: sessionId,
          });
        }
      } catch {
        // JSON parse failed — skip this block
      }
    }

    if (tasks.length > 0) return tasks;
  }

  return tasks;
}

/**
 * Strips the tasks_extracted: block from the AI response
 * so it doesn't show in the chat UI.
 */
export function stripTaskJSONFromResponse(text: string): string {
  return text
    .replace(/tasks_extracted:\s*\n?\[[\s\S]*?\]\s*/g, '')
    .replace(/tasks_extracted:\s*\[[^\]]*\]\s*/g, '')
    .trim();
}

// ═══════════════════════════════════════════════════════════════════
// HEURISTIC FALLBACK (regex patterns)
// ═══════════════════════════════════════════════════════════════════

const ARABIC_TRIGGERS = [
  'يجب', 'سنقوم', 'لنفعل', 'ينبغي', 'عليك', 'يجدر',
  'لا تنس', 'تأكد من', 'قُم بـ', 'قم ب', 'أنشئ', 'أضف', 'عدّل', 'راجع', 'اختبر',
];

const ENGLISH_TRIGGERS = [
  'you should', 'we need to', 'make sure', 'todo', "don't forget",
  'remember to', 'create a', 'add a', 'update the', 'review the',
  'test the', 'implement', 'refactor', 'fix the', 'set up',
];

const BULLET_PATTERN = /^[\s]*[-•*▪▸▶➤\d+[.)]]\s*/;
const IMPERATIVE_STARTS = /^(create|add|update|remove|delete|fix|implement|refactor|write|read|test|review|check|configure|set up|run|build|deploy|install|verify|ensure|migrate|optimize)\b/i;

function hasArabicTrigger(line: string): boolean {
  const lower = line.toLowerCase();
  return ARABIC_TRIGGERS.some((trigger) => lower.includes(trigger));
}

function hasEnglishTrigger(line: string): boolean {
  const lower = line.toLowerCase();
  return ENGLISH_TRIGGERS.some((trigger) => lower.includes(trigger));
}

function cleanBulletLine(line: string): string {
  return line
    .replace(BULLET_PATTERN, '')
    .replace(/^\s*[\[({]/, '')
    .replace(/[\])}]:.]$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isValidTask(text: string): boolean {
  if (text.length < 5) return false;
  if (text.length > 300) return false;
  if (/^#{1,6}\s/.test(text)) return false;
  if (/^```/.test(text)) return false;
  return true;
}

function inferPriority(text: string): Task['priority'] {
  const lower = text.toLowerCase();
  if (/\b(critical|urgent|immediately|فوراً|حالاً|عاجل|حرج)\b/.test(lower)) return 'high';
  if (/\b(important|priority|مهم|أساسي|رئيسي)\b/.test(lower)) return 'high';
  if (/\b(optional|nice.?to.?have|could|might|اختياري|ممكن)\b/.test(lower)) return 'low';
  return 'medium';
}

function extractTags(text: string): string[] {
  const tags: string[] = [];
  const hashtagMatches = text.match(/#(\w+)/g);
  if (hashtagMatches) {
    tags.push(...hashtagMatches.map((t) => t.slice(1).toLowerCase()));
  }
  return [...new Set(tags)];
}

// ═══════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════

/**
 * Extracts actionable tasks from an AI message.
 * Strategy 1: AI-powered JSON extraction (tasks_extracted: block) — PRIMARY
 * Strategy 2: Heuristic regex fallback — for when AI doesn't output JSON
 */
export function extractTasks(
  aiMessage: string,
  sessionId: string,
): Task[] {
  // Strategy 1: AI-powered JSON extraction
  const jsonTasks = extractTasksFromJSON(aiMessage, sessionId);
  if (jsonTasks.length > 0) return jsonTasks;

  // Strategy 2: Heuristic fallback
  const lines = aiMessage.split('\n');
  const tasks: Task[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const isBullet = BULLET_PATTERN.test(line);
    const cleaned = cleanBulletLine(line);

    if (!isValidTask(cleaned)) continue;

    const isArabicTrigger = hasArabicTrigger(line);
    const isEnglishTrigger = hasEnglishTrigger(line);
    const isImperative = IMPERATIVE_STARTS.test(cleaned);

    const isTask = isBullet
      ? (isArabicTrigger || isEnglishTrigger)
      : (isArabicTrigger || isEnglishTrigger || isImperative);

    if (!isTask) continue;

    const normalized = cleaned.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    tasks.push({
      id: crypto.randomUUID(),
      text: cleaned,
      completed: false,
      source: 'ai',
      priority: inferPriority(cleaned),
      tags: extractTags(cleaned),
      createdAt: new Date().toISOString(),
      sourceSessionId: sessionId,
    });
  }

  return tasks;
}
