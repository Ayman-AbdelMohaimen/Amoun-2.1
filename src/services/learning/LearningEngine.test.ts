import { describe, it, expect } from 'vitest';
import { extractTasks, stripTaskJSONFromResponse } from './LearningEngine';

describe('LearningEngine — AI JSON extraction (primary)', () => {
  const sessionId = 'sess-1';

  it('parses a tasks_extracted: JSON block and validates priorities', () => {
    const message = [
      'خطة التنفيذ:',
      'tasks_extracted:',
      '[',
      '  {"text": "إصلاح الخلل الحرج", "priority": "high", "dueDate": "2026-09-15"},',
      '  {"text": "مهمة بدون أولوية"}',
      ']',
      'نهاية الخطة',
    ].join('\n');

    const tasks = extractTasks(message, sessionId);
    expect(tasks).toHaveLength(2);
    expect(tasks[0]).toMatchObject({
      text: 'إصلاح الخلل الحرج',
      priority: 'high',
      dueDate: '2026-09-15',
      tags: [],
      source: 'ai',
      sourceSessionId: sessionId,
    });
    expect(tasks[1].priority).toBe('medium');
  });

  it('coerces invalid priorities to medium', () => {
    const tasks = extractTasks(
      'tasks_extracted:\n[{"text": "مهمة أولوية غريبة", "priority": "someday"}]',
      sessionId,
    );
    expect(tasks[0].priority).toBe('medium');
  });

  it('caps text length at 300 chars', () => {
    const longText = 'ن'.repeat(400);
    const tasks = extractTasks(
      `tasks_extracted:\n[{"text": "${longText}"}]`,
      sessionId,
    );
    expect(tasks).toHaveLength(1);
    expect(tasks[0].text.length).toBe(300);
  });

  it('prefers JSON extraction over heuristics when both are present', () => {
    const message =
      'tasks_extracted:\n[{"text": "مهمة من الJSON", "priority": "critical"}]\n- create a task from bullets too';
    const tasks = extractTasks(message, sessionId);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].text).toBe('مهمة من الJSON');
    expect(tasks[0].priority).toBe('critical');
  });

  it('skips malformed JSON blocks silently', () => {
    const tasks = extractTasks('tasks_extracted:\n[{ invalid ]]', sessionId);
    expect(tasks).toHaveLength(0);
  });
});

describe('LearningEngine — heuristic fallback', () => {
  const sessionId = 'sess-2';

  it('extracts Arabic trigger bullets', () => {
    const tasks = extractTasks('- تأكد من تحديث ملف الإعدادات #dev', sessionId);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].text).toContain('تأكد من تحديث ملف الإعدادات');
    expect(tasks[0].tags).toContain('dev');
  });

  it('extracts English imperative sentences (non-bullet)', () => {
    const tasks = extractTasks('create a test for the AI gateway #testing', sessionId);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].tags).toContain('testing');
  });

  it('ignores plain prose without triggers', () => {
    const tasks = extractTasks('هذا مجرد نص عادي بدون أي محفزات للمهام', sessionId);
    expect(tasks).toHaveLength(0);
  });

  it('skips markdown headings and code fences', () => {
    const tasks = extractTasks('# عنوان رئيسي\n```\ncode block\n```', sessionId);
    expect(tasks).toHaveLength(0);
  });

  it('deduplicates repeated bullets by normalized text', () => {
    const tasks = extractTasks('- remember to deploy the patch\n- REMEMBER TO DEPLOY THE PATCH', sessionId);
    expect(tasks).toHaveLength(1);
  });

  it('infers high priority from English urgent markers', () => {
    const tasks = extractTasks('- fix the server — urgent #ops', sessionId);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].priority).toBe('high');
  });
});

describe('LearningEngine — stripTaskJSONFromResponse', () => {
  it('removes the tasks_extracted block from the visible response', () => {
    const visible = stripTaskJSONFromResponse(
      'مفيش مشاكل.\ntasks_extracted:\n[{"text": "مهمة مخفية"}]\n\nتمت المهمة',
    );
    expect(visible).not.toContain('tasks_extracted');
    expect(visible).toContain('مفيش مشاكل');
    expect(visible).toContain('تمت المهمة');
  });

  it('leaves plain responses untouched', () => {
    expect(stripTaskJSONFromResponse('رد عادي بدون مهام')).toBe('رد عادي بدون مهام');
  });
});