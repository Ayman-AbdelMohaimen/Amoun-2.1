/**
 * Wazeer OS v2.1 — Exporters (lib/exporters.ts)
 * One-click file exports: Markdown (Notion/Obsidian importable),
 * CSV (Todoist importable), HTML, JSON. Pure functions + download helper.
 */

// ═══════════════════════════════════════════════════════════════════
// DOWNLOAD HELPER
// ═══════════════════════════════════════════════════════════════════

/** Triggers a client-side file download (no server involved). */
export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════
// ARTIFACT EXPORTS
// ═══════════════════════════════════════════════════════════════════

export interface ExportableArtifact {
  title: string;
  content: string;
  type: string;
  language?: string;
  createdAt: string;
}

/** Wrap any content as an importable Markdown document (Notion/Obsidian friendly). */
export function toMarkdownDoc(a: ExportableArtifact): string {
  const date = new Date(a.createdAt).toISOString().slice(0, 10);
  const lang = a.language || a.type;
  return `# ${a.title}\n\n> Exported from Wazeer OS · ${date}\n\n\`\`\`${lang}\n${a.content}\n\`\`\`\n`;
}

export function exportArtifactAs(a: ExportableArtifact, format: 'md' | 'html' | 'json' | 'txt'): void {
  const safeName = a.title.replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^-+|-+$/g, '') || 'artifact';
  switch (format) {
    case 'md':
      downloadFile(`${safeName}.md`, toMarkdownDoc(a), 'text/markdown');
      break;
    case 'html': {
      const html = a.type === 'html'
        ? a.content
        : `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${a.title}</title></head><body><pre style="white-space:pre-wrap;font-family:monospace">${escapeHtml(a.content)}</pre></body></html>`;
      downloadFile(`${safeName}.html`, html, 'text/html');
      break;
    }
    case 'json':
      downloadFile(`${safeName}.json`, JSON.stringify(a, null, 2), 'application/json');
      break;
    case 'txt':
      downloadFile(`${safeName}.txt`, a.content, 'text/plain');
      break;
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ═══════════════════════════════════════════════════════════════════
// TASKS EXPORTS (CSV — Todoist importable)
// ═══════════════════════════════════════════════════════════════════

export interface ExportableTask {
  text: string;
  completed: boolean;
  priority: string;
  dueDate?: string;
  tags: string[];
  createdAt: string;
}

/** CSV with the columns Todoist understands: TYPE,CONTENT,PRIORITY,INDENT,AUTHOR,RESPONSIBLE,DATE,... */
export function tasksToTodoistCsv(tasks: ExportableTask[]): string {
  const header = 'TYPE,CONTENT,PRIORITY,INDENT,AUTHOR,RESPONSIBLE,DATE,LABELS';
  const rows = tasks.map((t) => {
    const priorityMap: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    const p = priorityMap[t.priority] ?? 2;
    const content = `"${t.text.replace(/"/g, '""')}"`;
    const date = t.dueDate ?? '';
    const labels = t.tags.length > 0 ? `"${t.tags.join(' ')}"` : '';
    return `task,${content},${p},1,,,${date},${labels}`;
  });
  return [header, ...rows].join('\n');
}

/** Generic tasks CSV (Excel/Sheets friendly). */
export function tasksToGenericCsv(tasks: ExportableTask[]): string {
  const header = 'Text,Completed,Priority,DueDate,Tags,CreatedAt';
  const rows = tasks.map((t) => {
    const content = `"${t.text.replace(/"/g, '""')}"`;
    const tags = `"${t.tags.join(' ')}"`;
    return `${content},${t.completed},${t.priority},${t.dueDate ?? ''},${tags},${t.createdAt}`;
  });
  return [header, ...rows].join('\n');
}

export function exportTasksAs(
  tasks: ExportableTask[],
  format: 'todoist-csv' | 'csv' | 'md' | 'json',
): void {
  const date = new Date().toISOString().slice(0, 10);
  switch (format) {
    case 'todoist-csv':
      downloadFile(`wazeer-tasks-todoist-${date}.csv`, tasksToTodoistCsv(tasks), 'text/csv');
      break;
    case 'csv':
      downloadFile(`wazeer-tasks-${date}.csv`, tasksToGenericCsv(tasks), 'text/csv');
      break;
    case 'md': {
      const md = tasks
        .map((t) => `- [${t.completed ? 'x' : ' '}] ${t.text}${t.dueDate ? ` 📅 ${t.dueDate}` : ''}${t.tags.length ? ` ${t.tags.map((tag) => `#${tag}`).join(' ')}` : ''}`)
        .join('\n');
      downloadFile(`wazeer-tasks-${date}.md`, `# Tasks\n\n${md}\n`, 'text/markdown');
      break;
    }
    case 'json':
      downloadFile(`wazeer-tasks-${date}.json`, JSON.stringify(tasks, null, 2), 'application/json');
      break;
  }
}
