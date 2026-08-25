/**
 * Wazeer OS v2.0 — API Proxy Factory
 * Creates an http-proxy-middleware instance for a given provider config.
 * Rewrites paths, handles errors, passes through auth headers.
 */

import { createProxyMiddleware } from 'http-proxy-middleware';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface ProxyFactoryConfig {
  target: string;
  pathRewrite: Record<string, string>;
  rateLimitPerMinute: number;
}

// ═══════════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════════

/**
 * Create an API proxy middleware with path rewriting,
 * error sanitization, auth header pass-through, and 120s timeout.
 * Uses http-proxy-middleware v3 event API (`on: { error, proxyReq }`).
 */
export function createApiProxy(config: ProxyFactoryConfig) {
  return createProxyMiddleware({
    target: config.target,
    changeOrigin: true,
    pathRewrite: config.pathRewrite,
    timeout: 120_000,
    proxyTimeout: 120_000,

    on: {
      error: (err, _req, res) => {
        const status = (err as NodeJS.ErrnoException & { status?: number }).status ?? 502;
        const statusCode = typeof status === 'number' ? status : 502;

        // Sanitize known error codes to clean JSON
        const messages: Record<number, string> = {
          401: 'Authentication failed. Check your API key.',
          403: 'Access denied. Your API key does not have permission.',
          429: 'Rate limit exceeded. Please slow down and retry.',
          502: 'Upstream provider is unreachable.',
          504: 'Upstream provider timed out.',
        };

        const message = messages[statusCode] ?? 'Proxy error occurred';

        // In v3 the error handler may receive a ServerResponse or a plain response object
        const resWithSend = res as { headersSent?: boolean; writeHead?: (code: number, headers?: Record<string, string>) => unknown; end?: (data?: string) => unknown };
        if (typeof resWithSend.end === 'function' && !resWithSend.headersSent) {
          resWithSend.writeHead?.(statusCode, { 'Content-Type': 'application/json' });
          resWithSend.end(JSON.stringify({
            error: {
              message,
              type: 'proxy_error',
              code: statusCode,
            },
          }));
        }
      },

      proxyReq: (proxyReq, req) => {
        // Pass through auth headers from the client
        const authHeaders = [
          'authorization',
          'x-api-key',
          'x-goog-api-key',
          'anthropic-version',
        ];

        for (const header of authHeaders) {
          const value = req.headers[header];
          if (value) {
            proxyReq.setHeader(header, value);
          }
        }

        // Ensure content-type is set for POST bodies
        if (!proxyReq.getHeader('content-type') && req.method === 'POST') {
          proxyReq.setHeader('content-type', 'application/json');
        }
      },
    },
  });
}
