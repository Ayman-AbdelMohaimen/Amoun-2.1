/**
 * Wazeer OS v2.0 — HorusGuard Security Scanner
 * Scans ALL AI-generated code using Babel AST traversal.
 * Categorizes threats: CRITICAL, HIGH, MEDIUM, LOW.
 */

import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import type { NodePath } from '@babel/traverse';
import type { SecurityScanResult, SecurityThreat } from '@/types';

// ═══════════════════════════════════════════════════════════════════
// THREAT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

interface ThreatRule {
  pattern: string;
  severity: SecurityThreat['severity'];
  description: string;
  /** Check function returns true if this node is a threat. */
  check: (path: NodePath) => boolean;
}

const THREAT_RULES: ThreatRule[] = [
  // ── CRITICAL ──────────────────────────────────────────────────
  {
    pattern: 'eval()',
    severity: 'critical',
    description: 'eval() can execute arbitrary code — extreme security risk.',
    check: (path) => {
      if (path.isCallExpression()) {
        const callee = path.node.callee;
        return (
          (callee.type === 'Identifier' && callee.name === 'eval') ||
          (callee.type === 'MemberExpression' &&
            callee.property.type === 'Identifier' &&
            callee.property.name === 'eval')
        );
      }
      return false;
    },
  },
  {
    pattern: 'new Function()',
    severity: 'critical',
    description: 'new Function() is equivalent to eval() — arbitrary code execution.',
    check: (path) => {
      if (path.isNewExpression()) {
        const callee = path.node.callee;
        return callee.type === 'Identifier' && callee.name === 'Function';
      }
      return false;
    },
  },
  {
    pattern: 'require(child_process)',
    severity: 'critical',
    description: 'child_process allows system-level command execution.',
    check: (path) => {
      if (path.isCallExpression() && path.node.callee.type === 'Identifier' && path.node.callee.name === 'require') {
        const firstArg = path.node.arguments[0];
        if (firstArg && firstArg.type === 'StringLiteral') {
          return firstArg.value === 'child_process';
        }
      }
      return false;
    },
  },
  {
    pattern: 'child_process.*',
    severity: 'critical',
    description: 'Direct child_process usage — system command execution.',
    check: (path) => {
      if (path.isMemberExpression()) {
        const obj = path.node.object;
        return (
          obj.type === 'Identifier' && obj.name === 'child_process'
        );
      }
      return false;
    },
  },

  // ── HIGH ──────────────────────────────────────────────────────
  {
    pattern: 'document.cookie',
    severity: 'high',
    description: 'Accessing document.cookie may expose or steal session data.',
    check: (path) => {
      if (path.isMemberExpression()) {
        const obj = path.node.object;
        const prop = path.node.property;
        return (
          obj.type === 'Identifier' && obj.name === 'document' &&
          prop.type === 'Identifier' && prop.name === 'cookie'
        );
      }
      return false;
    },
  },
  {
    pattern: 'localStorage',
    severity: 'high',
    description: 'Direct localStorage access in generated code may leak data.',
    check: (path) => {
      if (path.isIdentifier()) {
        return path.node.name === 'localStorage';
      }
      return false;
    },
  },
  {
    pattern: 'sessionStorage',
    severity: 'high',
    description: 'Direct sessionStorage access in generated code may leak data.',
    check: (path) => {
      if (path.isIdentifier()) {
        return path.node.name === 'sessionStorage';
      }
      return false;
    },
  },
  {
    pattern: 'fetch(http://)',
    severity: 'high',
    description: 'Insecure HTTP request — data transmitted in plaintext.',
    check: (path) => {
      if (path.isCallExpression() && path.node.callee.type === 'Identifier' && path.node.callee.name === 'fetch') {
        const firstArg = path.node.arguments[0];
        if (firstArg && firstArg.type === 'StringLiteral') {
          return firstArg.value.startsWith('http://');
        }
      }
      return false;
    },
  },
  {
    pattern: 'innerHTML',
    severity: 'high',
    description: 'innerHTML allows XSS — use textContent instead.',
    check: (path) => {
      if (path.isMemberExpression() && path.node.property.type === 'Identifier') {
        return path.node.property.name === 'innerHTML';
      }
      return false;
    },
  },
  {
    pattern: 'outerHTML',
    severity: 'high',
    description: 'outerHTML allows XSS — unsafe DOM manipulation.',
    check: (path) => {
      if (path.isMemberExpression() && path.node.property.type === 'Identifier') {
        return path.node.property.name === 'outerHTML';
      }
      return false;
    },
  },
  {
    pattern: 'insertAdjacentHTML',
    severity: 'high',
    description: 'insertAdjacentHTML allows XSS — unsafe HTML insertion.',
    check: (path) => {
      if (path.isCallExpression() && path.node.callee.type === 'MemberExpression') {
        return (
          path.node.callee.property.type === 'Identifier' &&
          path.node.callee.property.name === 'insertAdjacentHTML'
        );
      }
      return false;
    },
  },

  // ── MEDIUM ────────────────────────────────────────────────────
  {
    pattern: 'WebSocket (non-localhost)',
    severity: 'medium',
    description: 'WebSocket connection to external host — potential data exfiltration.',
    check: (path) => {
      if (path.isNewExpression() && path.node.callee.type === 'Identifier' && path.node.callee.name === 'WebSocket') {
        const firstArg = path.node.arguments[0];
        if (firstArg && firstArg.type === 'StringLiteral') {
          return !firstArg.value.includes('localhost') && !firstArg.value.includes('127.0.0.1');
        }
      }
      return false;
    },
  },
  {
    pattern: 'window.location',
    severity: 'medium',
    description: 'Direct window.location manipulation may redirect users unexpectedly.',
    check: (path) => {
      if (path.isMemberExpression()) {
        const obj = path.node.object;
        return (
          obj.type === 'Identifier' && obj.name === 'window' &&
          path.node.property.type === 'Identifier' &&
          path.node.property.name === 'location'
        );
      }
      return false;
    },
  },
  {
    pattern: 'window.open',
    severity: 'medium',
    description: 'window.open can open untrusted URLs or be used for phishing.',
    check: (path) => {
      if (path.isCallExpression() && path.node.callee.type === 'MemberExpression') {
        const obj = path.node.callee.object;
        const prop = path.node.callee.property;
        return (
          obj.type === 'Identifier' && obj.name === 'window' &&
          prop.type === 'Identifier' && prop.name === 'open'
        );
      }
      return false;
    },
  },
  {
    pattern: 'postMessage',
    severity: 'medium',
    description: 'postMessage can send data to other origins — verify targetOrigin.',
    check: (path) => {
      if (path.isCallExpression() && path.node.callee.type === 'MemberExpression') {
        return (
          path.node.callee.property.type === 'Identifier' &&
          path.node.callee.property.name === 'postMessage'
        );
      }
      return false;
    },
  },

  // ── LOW ───────────────────────────────────────────────────────
  {
    pattern: 'console.log',
    severity: 'low',
    description: 'console.log in generated code — remove before production.',
    check: (path) => {
      if (path.isCallExpression() && path.node.callee.type === 'MemberExpression') {
        const obj = path.node.callee.object;
        const prop = path.node.callee.property;
        return (
          obj.type === 'Identifier' && obj.name === 'console' &&
          prop.type === 'Identifier' && prop.name === 'log'
        );
      }
      return false;
    },
  },
  {
    pattern: 'debugger',
    severity: 'low',
    description: 'debugger statement — should not be in production code.',
    check: (path) => {
      return path.isDebuggerStatement();
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════

/**
 * Scans code for security threats using Babel AST traversal.
 * Tries TypeScript parsing first, falls back to JavaScript.
 * Never throws — returns safe:true on parse failure.
 */
export function scanCode(code: string): SecurityScanResult {
  const threats: SecurityThreat[] = [];

  let ast: ReturnType<typeof parse> | null = null;

  // Try TypeScript first, then JavaScript
  for (const plugins of [['typescript'] as const, [] as const]) {
    try {
      ast = parse(code, {
        sourceType: 'module',
        plugins: plugins as unknown as [],
      });
      break;
    } catch {
      // Try next parser variant
    }
  }

  if (!ast) {
    // Unparseable code — don't block, but flag it
    return {
      safe: true,
      threats: [{
        pattern: 'unparseable',
        severity: 'low',
        line: 0,
        description: 'Code could not be parsed for security scanning.',
      }],
    };
  }

  // Traverse AST and collect threats
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    traverse(ast as any, {
      // Visit every node
      enter(path) {
        for (const rule of THREAT_RULES) {
          try {
            if (rule.check(path)) {
              const loc = path.node.loc;
              threats.push({
                pattern: rule.pattern,
                severity: rule.severity,
                line: loc?.start.line ?? 0,
                description: rule.description,
              });
            }
          } catch {
            // Skip individual rule failures
          }
        }
      },
    });
  } catch {
    // Traversal failure — don't crash
  }

  // Deduplicate by (pattern, line) to avoid duplicate reports
  const seen = new Set<string>();
  const unique: SecurityThreat[] = [];
  for (const t of threats) {
    const key = `${t.pattern}:${t.line}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(t);
    }
  }

  const hasCriticalOrHigh = unique.some(
    (t) => t.severity === 'critical' || t.severity === 'high',
  );

  return {
    safe: !hasCriticalOrHigh,
    threats: unique,
  };
}
