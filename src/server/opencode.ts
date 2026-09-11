/**
 * Wazeer OS v2.1 — opencode Integration Bridge
 * Optional adapter: routes chat requests to the `opencode` CLI running on the
 * Wazeer server. Users select the "تلقائي (Auto)" model without any API key —
 * opencode resolves the best model from its own server-side config.
 *
 * Security: execFile (no shell) → zero injection surface. Hard timeout.
 * Rate limit: 6 requests/minute per IP (server-side, on top of the global 100/min).
 * Green Code: availability is cached for 60s — no repeated spawn on every ping.
 */

import { execFile, execFileSync } from 'child_process';
import rateLimit from 'express-rate-limit';
import type { Express, Request, Response } from 'express';

// ═══════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════

const OPENCODE_BIN = process.env.OPENCODE_BIN || 'opencode';
const AVAILABILITY_TTL_MS = 60_000;
const RUN_TIMEOUT_MS = 120_000;
const LIMIT_PER_MINUTE = 6;

/** Free no-key models exposed by the opencode CLI (verified on v1.18.30). */
export const OPENCODE_FREE_MODELS: string[] = [
  'opencode/big-pickle',
  'opencode/ling-3.0-flash-fin-free',
  'opencode/mimo-v2.5-free',
  'opencode/muse-spark-1.2-contributor-free',
  'opencode/muse-spark-1.3-contributor-free',
  'opencode/nemotron-3-ultra-free',
  'opencode/nemotron-3.5-lightning-free',
];

// ═══════════════════════════════════════════════════════════════════
// PROMPT BUILDER (pure — unit-tested)
// ═══════════════════════════════════════════════════════════════════

/**
 * Flattens OpenAI-style messages + system prompt into a single text prompt
 * for `opencode run`. Keeps content boundaries so the CLI sees the full
 * conversation shape without any shell escaping risk.
 */
export function buildOpencodePrompt(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
): string {
  const parts: string[] = [];

  if (systemPrompt.trim()) {
    parts.push(`[التعليمات]\n${systemPrompt.trim()}`);
  }

  for (const m of messages) {
    if (m.role === 'system') continue; // already injected above
    const label = m.role === 'user' ? '[المستخدم]' : '[الأداء]';
    parts.push(`${label}\n${m.content.trim()}`);
  }

  return parts.join('\n\n').trim();
}

// ═══════════════════════════════════════════════════════════════════
// AVAILABILITY (cached)
// ═══════════════════════════════════════════════════════════════════

let cachedAvailable: boolean | null = null;
let cachedAt = 0;

/** True when the `opencode` CLI responds. Cache is short-lived (60s). */
export function isOpencodeAvailable(): boolean {
  if (cachedAvailable !== null && Date.now() - cachedAt < AVAILABILITY_TTL_MS) {
    return cachedAvailable;
  }

  try {
    execFileSync(OPENCODE_BIN, ['--version'], { timeout: 10_000, stdio: 'pipe', windowsHide: true });
    cachedAvailable = true;
  } catch {
    cachedAvailable = false;
  }
  cachedAt = Date.now();
  return cachedAvailable;
}

// ═══════════════════════════════════════════════════════════════════
// MODELS — dynamic when available, sane fallback otherwise
// ═══════════════════════════════════════════════════════════════════

/** Lists models known to opencode. Falls back to the verified free list on any failure. */
export function getOpencodeModels(): string[] {
  try {
    const out = execFileSync(OPENCODE_BIN, ['models'], {
      timeout: 15_000,
      stdio: 'pipe',
      windowsHide: true,
    }).toString();
    const models = out
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return models.length > 0 ? models : [...OPENCODE_FREE_MODELS];
  } catch {
    return [...OPENCODE_FREE_MODELS];
  }
}

// ═══════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════

export interface OpencodeRunResult {
  content: string;
  exitCode: number | null;
}

/**
 * Strips the CLI's progress/status lines (e.g. "> build · big-pickle")
 * from the captured stdout so only the assistant reply is returned.
 */
export function stripOpencodeProgress(raw: string): string {
  return raw
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith('>'))
    .join('\n')
    .trim();
}

/**
 * Runs `opencode run -m <modelId> "<prompt>"` via execFile (no shell).
 * Resolves with the clean reply; nonzero exit without a reply rejects.
 */
export function runOpencode(prompt: string, modelId: string, timeoutMs = RUN_TIMEOUT_MS): Promise<OpencodeRunResult> {
  return new Promise((resolve, reject) => {
    execFile(
      OPENCODE_BIN,
      ['run', '-m', modelId, prompt],
      { timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024, windowsHide: true },
      (error, stdout, stderr) => {
        const content = stripOpencodeProgress(stdout || '');
        const stderrText = (stderr || '').trim();

        if (error && !content) {
          reject(new Error(stderrText || error.message || 'opencode returned no output'));
          return;
        }

        const exitCode =
          error && typeof error === 'object' && 'code' in error && typeof (error as { code?: unknown }).code === 'number'
            ? ((error as { code: number }).code ?? null)
            : null;

        resolve({ content, exitCode });
      },
    );
  });
}

// ═══════════════════════════════════════════════════════════════════
// EXPRESS ROUTES
// ═══════════════════════════════════════════════════════════════════

/** Mounts /api/opencode/status + /api/opencode/chat behind a strict per-IP limiter. */
export function bindOpencodeRoutes(app: Express): void {
  const opencodeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: LIMIT_PER_MINUTE,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: `Opencode limit: ${LIMIT_PER_MINUTE} requests/minute per user` },
  });

  app.get('/api/opencode/status', (_req: Request, res: Response) => {
    const opAvailable = isOpencodeAvailable();
    res.json({
      available: opAvailable,
      models: opAvailable ? getOpencodeModels() : [],
      limitPerMinute: LIMIT_PER_MINUTE,
    });
  });

  app.post('/api/opencode/chat', opencodeLimiter, (req: Request, res: Response) => {
    if (!isOpencodeAvailable()) {
      return res.status(503).json({
        error: 'OPENCODE_UNAVAILABLE',
        message: 'opencode CLI is not installed on this server',
      });
    }

    const { model, messages, systemPrompt } = (req.body ?? {}) as {
      model?: string;
      messages?: Array<{ role: string; content: string }>;
      systemPrompt?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages[] is required' });
    }

    // Allow-list: only free models exposed by this CLI may be invoked.
    const modelId = typeof model === 'string' && model.startsWith('opencode/') ? model : 'opencode/big-pickle';
    if (!getOpencodeModels().includes(modelId)) {
      return res.status(400).json({ error: 'model not in the opencode free list' });
    }

    const prompt = buildOpencodePrompt(
      messages,
      typeof systemPrompt === 'string' ? systemPrompt : '',
    );

    runOpencode(prompt, modelId)
      .then(({ content }) => {
        // OpenAI-compatible shape so AIGateway's proxyChat parses it directly
        res.json({
          choices: [{ message: { content } }],
          usage: { prompt_tokens: 0, completion_tokens: 0 },
        });
      })
      .catch((err: Error) => {
        console.warn('[opencode] run failed:', err.message);
        res.status(500).json({ error: 'OPENCODE_FAILED', message: err.message });
      });
  });
}