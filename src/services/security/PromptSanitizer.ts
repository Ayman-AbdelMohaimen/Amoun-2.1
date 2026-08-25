/**
 * Wazeer OS v2.0 — Prompt Sanitizer
 * Security as Mindset: Redacts sensitive data BEFORE sending to any LLM.
 * Runs on every outgoing prompt to prevent credential leakage.
 */

// ═══════════════════════════════════════════════════════════════════
// SANITIZATION PATTERNS
// ═══════════════════════════════════════════════════════════════════

const PATTERNS: Array<{ regex: RegExp; replacement: string }> = [
  // API keys: sk-..., nvapi-..., AIza..., ghp_...
  {
    regex: /(?:sk-|nvapi-|AIza|ghp_)[\w-]{20,}/g,
    replacement: '[REDACTED_API_KEY]',
  },
  // Bearer tokens in Authorization headers or standalone
  {
    regex: /Bearer\s+[\w\-._~+/]+=*/g,
    replacement: 'Bearer [REDACTED_TOKEN]',
  },
  // Password/credential patterns: "password = xxx", "password: xxx"
  {
    regex: /(?:(?:password|passwd|pwd)\s*[:=]\s*)(.+)/gi,
    replacement: '$1[REDACTED_CREDENTIAL]',
  },
  // Environment variable assignments: API_KEY=xxx, SECRET_TOKEN=xxx
  {
    regex: /(?:(?:API_KEY|SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE_KEY|ACCESS_KEY)\s*=\s*)(.+)/gi,
    replacement: '$1[REDACTED]',
  },
  // MongoDB / database connection strings
  {
    regex: /mongodb(?:\+srv)?:\/\/[\w:]+@/g,
    replacement: '[REDACTED_CONNECTION_STRING]',
  },
  // PostgreSQL connection strings
  {
    regex: /postgres(?:ql)?:\/\/[\w:]+@/g,
    replacement: '[REDACTED_CONNECTION_STRING]',
  },
  // MySQL connection strings
  {
    regex: /mysql:\/\/[\w:]+@/g,
    replacement: '[REDACTED_CONNECTION_STRING]',
  },
  // Private keys (PEM-like blocks)
  {
    regex: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA )?PRIVATE KEY-----/g,
    replacement: '[REDACTED_PRIVATE_KEY]',
  },
];

// ═══════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════

/**
 * Sanitizes a prompt by redacting all sensitive patterns.
 * @param input - The raw user input / prompt text.
 * @returns The sanitized string with secrets replaced by placeholders.
 */
export function sanitizePrompt(input: string): string {
  let sanitized = input;
  for (const { regex, replacement } of PATTERNS) {
    sanitized = sanitized.replace(regex, replacement);
  }
  return sanitized;
}
