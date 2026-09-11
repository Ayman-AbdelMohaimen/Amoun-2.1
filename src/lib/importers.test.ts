import { describe, it, expect } from 'vitest';
import { detectImportFormat, importTasks } from './importers';

describe('importers — detectImportFormat', () => {
  it('detects JSON by extension and by content', () => {
    expect(detectImportFormat('tasks.json', '[]')).toBe('json');
    expect(detectImportFormat('unknown.txt', '[{"text":"a"}]')).toBe('json');
  });

  it('detects CSV by extension', () => {
    expect(detectImportFormat('tasks.csv', '')).toBe('csv');
  });

  it('detects markdown by extension', () => {
    expect(detectImportFormat('checklist.md', '')).toBe('markdown');
    expect(detectImportFormat('checklist.markdown', '')).toBe('markdown');
  });
});

describe('importers — importTasks', () => {
  it('parses JSON task arrays', () => {
    const drafts = importTasks('tasks.json', JSON.stringify([
      { text: 'First task', priority: 'high' },
      { text: 'Second task' },
    ]));
    expect(drafts).toHaveLength(2);
    expect(drafts[0]).toMatchObject({ text: 'First task', priority: 'high' });
  });

  it('deduplicates by normalized text', () => {
    const drafts = importTasks('tasks.json', JSON.stringify([
      { text: '  Repeat Task  ' },
      { text: 'repeat task' },
      { text: 'Unique' },
    ]));
    expect(drafts).toHaveLength(2);
  });

  it('parses markdown checklists', () => {
    const drafts = importTasks('list.md', '- [ ] Write docs\n- [x] Ship beta\n- plain line');
    expect(drafts.some((d) => d.text === 'Write docs' && !d.completed)).toBe(true);
    expect(drafts.some((d) => d.text === 'Ship beta' && d.completed)).toBe(true);
  });
});