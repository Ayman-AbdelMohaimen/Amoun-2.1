/**
 * Wazeer OS v2.1 — Importers (lib/importers.ts)
 * One-click task import: JSON / CSV (Todoist or generic) / Markdown checklists.
 * Pure functions — returns Task-like drafts for the caller to persist.
 */

export interface ImportedTaskDraft {
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  tags: string[];
}

export type ImportFormat = 'json' | 'csv' | 'markdown';

/** Detects format from filename extension, falling back to content sniffing. */
export function detectImportFormat(filename: string, content: string): ImportFormat {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown';
  if (content.trimStart().startsWith('[') || content.trimStart().startsWith('{')) return 'json';
  if (content.includes(',')) return 'csv';
  return 'markdown';
}

/** Parses any supported format into task drafts. Throws with an Arabic message on failure. */
export function importTasks(filename: string, content: string): ImportedTaskDraft[] {
  const format = detectImportFormat(filename, content);
  const tasks =
    format === 'json' ? parseJson(content)
    : format === 'csv' ? parseCsv(content)
    : parseMarkdown(content);

  // Dedup by normalized text
  const seen = new Set<string>();
  return tasks.filter((t) => {
    const key = t.text.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── JSON ────────────────────────────────────────────────────────────

function parseJson(content: string): ImportedTaskDraft[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('الملف مش JSON صالح');
  }
  const arr = Array.isArray(parsed) ? parsed : [parsed];
  return arr
    .filter((item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null && typeof (item as Record<string, unknown>).text === 'string')
    .map((item) => normalize({
      text: String(item.text),
      completed: item.completed === true,
      priority: typeof item.priority === 'string' ? item.priority : undefined,
      dueDate: typeof item.dueDate === 'string' ? item.dueDate : undefined,
      tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    }));
}

// ── CSV (Todoist format or generic) ────────────────────────────────

function parseCsv(content: string): ImportedTaskDraft[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error('ملف الـ CSV فاضي أو ناقص');

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const isTodoist = header.includes('type') && header.includes('content');
  const textIdx = header.findIndex((h) => h === 'content' || h === 'text');
  if (textIdx === -1) throw new Error('مفيش عمود نصوص في الـ CSV');

  const completedIdx = header.findIndex((h) => h === 'completed');
  const priorityIdx = header.findIndex((h) => h === 'priority');
  const dateIdx = header.findIndex((h) => h === 'date' || h === 'duedate');
  const labelsIdx = header.findIndex((h) => h === 'labels' || h === 'tags');

  const tasks: ImportedTaskDraft[] = [];
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const text = (cells[textIdx] ?? '').trim();
    if (!text) continue;
    if (isTodoist && (cells[0] ?? '').trim().toLowerCase() === 'note') continue; // skip notes

    const priorityRaw = priorityIdx >= 0 ? cells[priorityIdx]?.trim() : '';
    tasks.push(normalize({
      text,
      completed: completedIdx >= 0 && /^(true|1|x|yes)$/i.test(cells[completedIdx]?.trim() ?? ''),
      // Todoist: 4=urgent(critical) 3=high 2=medium 1=low
      priority:
        priorityRaw === '4' || priorityRaw === 'critical' ? 'critical'
        : priorityRaw === '3' || priorityRaw === 'high' ? 'high'
        : priorityRaw === '1' || priorityRaw === 'low' ? 'low'
        : 'medium',
      dueDate: dateIdx >= 0 ? cells[dateIdx]?.trim() || undefined : undefined,
      tags: labelsIdx >= 0 ? (cells[labelsIdx] ?? '').split(/\s+/).filter(Boolean) : [],
    }));
  }
  return tasks;
}

/** RFC-4180-ish splitter: respects double-quoted cells. */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

// ── Markdown checklist ─────────────────────────────────────────────

function parseMarkdown(content: string): ImportedTaskDraft[] {
  const tasks: ImportedTaskDraft[] = [];
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (!m) continue;
    let text = m[2].trim();
    // Strip emoji date/tags markers commonly exported by task apps
    const due = text.match(/📅\s*(\d{4}-\d{2}-\d{2})/)?.[1];
    const tags = [...text.matchAll(/#([\p{L}\p{N}_-]+)/gu)].map((t) => t[1]);
    text = text.replace(/📅\s*\d{4}-\d{2}-\d{2}/g, '').replace(/#[\p{L}\p{N}_-]+/gu, '').trim();
    tasks.push(normalize({ text, completed: m[1].toLowerCase() === 'x', dueDate: due, tags }));
  }
  if (tasks.length === 0) throw new Error('مفيش مهام (checkboxes) في ملف الـ Markdown');
  return tasks;
}

// ── Shared normalizer ──────────────────────────────────────────────

function normalize(draft: {
  text: string;
  completed: boolean;
  priority?: string;
  dueDate?: string;
  tags: string[];
}): ImportedTaskDraft {
  const validPriorities = ['critical', 'high', 'medium', 'low'];
  return {
    text: draft.text.slice(0, 300),
    completed: draft.completed,
    priority: (draft.priority && validPriorities.includes(draft.priority)
      ? draft.priority
      : 'medium') as ImportedTaskDraft['priority'],
    dueDate: draft.dueDate && /^\d{4}-\d{2}-\d{2}/.test(draft.dueDate) ? draft.dueDate.slice(0, 10) : undefined,
    tags: draft.tags.map((t) => t.replace(/^#/, '').toLowerCase()).filter(Boolean).slice(0, 5),
  };
}
