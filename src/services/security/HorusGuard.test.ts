import { describe, it, expect } from 'vitest';
import { scanCode } from './HorusGuard';

describe('HorusGuard — scanCode', () => {
  it('flags eval() as unsafe (critical)', () => {
    const result = scanCode('eval("alert(1)");');
    expect(result.safe).toBe(false);
    expect(result.threats.some((t) => t.severity === 'critical' && t.pattern === 'eval()')).toBe(true);
  });

  it('flags new Function() as unsafe (critical)', () => {
    const result = scanCode('const f = new Function("return process");');
    expect(result.safe).toBe(false);
    expect(result.threats.some((t) => t.severity === 'critical')).toBe(true);
  });

  it('flags document.cookie access as unsafe (high)', () => {
    const result = scanCode('const c = document.cookie;');
    expect(result.safe).toBe(false);
    expect(result.threats.some((t) => t.pattern === 'document.cookie' && t.severity === 'high')).toBe(true);
  });

  it('allows clean code', () => {
    const result = scanCode('export function add(a: number, b: number) { return a + b; }');
    expect(result.safe).toBe(true);
  });

  it('does not hard-fail on unparseable input', () => {
    const result = scanCode('{ invalid syntax here ((');
    expect(result.safe).toBe(true);
  });
});