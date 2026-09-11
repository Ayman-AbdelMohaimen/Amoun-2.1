import { describe, it, expect } from 'vitest';
import { toMarkdownDoc, tasksToTodoistCsv, tasksToGenericCsv } from './exporters';
import type { ExportableArtifact, ExportableTask } from './exporters';

const artifact: ExportableArtifact = {
  title: 'Login Page',
  content: 'const a = 1;',
  type: 'code',
  language: 'tsx',
  createdAt: '2026-09-11T00:00:00Z',
};

describe('exporters — toMarkdownDoc', () => {
  it('wraps content as an importable markdown document', () => {
    const md = toMarkdownDoc(artifact);
    expect(md).toContain('# Login Page');
    expect(md).toContain('```tsx');
    expect(md).toContain('const a = 1;');
  });
});

describe('exporters — CSV', () => {
  const task: ExportableTask = {
    text: 'Task with "quotes"',
    completed: false,
    priority: 'high',
    dueDate: '2026-09-20',
    tags: ['amoun', 'dev'],
    createdAt: '2026-09-11T00:00:00Z',
  };

  it('produces Todoist-compatible CSV with header', () => {
    const csv = tasksToTodoistCsv([task]);
    expect(csv.split('\n')[0]).toBe('TYPE,CONTENT,PRIORITY,INDENT,AUTHOR,RESPONSIBLE,DATE,LABELS');
    expect(csv).toContain('task,"Task with ""quotes""",3,1,,,2026-09-20,"amoun dev"');
  });

  it('produces generic CSV safely escaping quotes', () => {
    const csv = tasksToGenericCsv([task]);
    expect(csv.split('\n')[0]).toBe('Text,Completed,Priority,DueDate,Tags,CreatedAt');
    expect(csv).toContain('"Task with ""quotes"""');
  });
});