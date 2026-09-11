import { describe, it, expect } from 'vitest';
import { buildOpencodePrompt, isOpencodeAvailable, stripOpencodeProgress, OPENCODE_FREE_MODELS } from './opencode';

describe('opencode — buildOpencodePrompt', () => {
  it('builds a flat prompt with system instructions first', () => {
    const out = buildOpencodePrompt(
      [
        { role: 'user', content: 'hatcher the plan' },
        { role: 'assistant', content: 'ok' },
        { role: 'user', content: 'proceed' },
      ],
      'You are Wazeer.',
    );

    expect(out).toContain('[التعليمات]');
    expect(out).toContain('You are Wazeer.');
    expect(out).toContain('[المستخدم]\nhatcher the plan');
    expect(out).toContain('[الأداء]\nok');
    expect(out.indexOf('[التعليمات]')).toBeLessThan(out.indexOf('[المستخدم]'));
  });

  it('skips system-prefixed messages (already injected)', () => {
    const out = buildOpencodePrompt([{ role: 'system', content: 'inner system' }], '');
    expect(out).not.toContain('inner system');
    expect(out).toBe('');
  });

  it('strips the single trailing newline but keeps inner structure', () => {
    const out = buildOpencodePrompt([{ role: 'user', content: '  hi  ' }], 'sys  ');
    expect(out).toBe('[التعليمات]\nsys\n\n[المستخدم]\nhi');
  });
});

describe('opencode — availability helper (no CLI required)', () => {
  it('returns a boolean without throwing', () => {
    const result = isOpencodeAvailable();
    expect(typeof result).toBe('boolean');
  });
});

describe('opencode — stripOpencodeProgress', () => {
  it('drops status lines but keeps the reply', () => {
    const out = stripOpencodeProgress('> build · big-pickle\n\nأنا المساعد.\n');
    expect(out).toBe('أنا المساعد.');
  });

  it('keeps normal content untouched', () => {
    expect(stripOpencodeProgress('  hello  ')).toBe('hello');
  });
});

describe('opencode — free model list', () => {
  it('contains the 7 verified no-key models with full ids', () => {
    expect(OPENCODE_FREE_MODELS).toHaveLength(7);
    for (const id of OPENCODE_FREE_MODELS) {
      expect(id).toMatch(/^opencode\//);
    }
  });
});