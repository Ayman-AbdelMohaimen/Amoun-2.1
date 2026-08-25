/**
 * Wazeer OS v2.0 — Provider Proxy Registry
 * Defines all LLM provider proxy configurations.
 * Binds each to /api/proxy/{id} via the proxyFactory.
 */

import type { Express } from 'express';
import { createApiProxy } from './proxyFactory';

// ═══════════════════════════════════════════════════════════════════
// PROVIDER CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════

interface ProviderProxyConfig {
  id: string;
  target: string;
  pathRewrite: Record<string, string>;
  rateLimitPerMinute: number;
}

const PROVIDER_ROUTES: ProviderProxyConfig[] = [
  { id: 'claude',    target: 'https://api.anthropic.com',       pathRewrite: { '^/api/proxy/claude': '/' },    rateLimitPerMinute: 100 },
  { id: 'glm',      target: 'https://open.bigmodel.cn',        pathRewrite: { '^/api/proxy/glm': '/' },      rateLimitPerMinute: 100 },
  { id: 'nvidia',   target: 'https://integrate.api.nvidia.com', pathRewrite: { '^/api/proxy/nvidia': '/' },   rateLimitPerMinute: 200 },
  { id: 'deepseek', target: 'https://api.deepseek.com',         pathRewrite: { '^/api/proxy/deepseek': '/' }, rateLimitPerMinute: 100 },
  { id: 'kimi',     target: 'https://api.moonshot.cn',          pathRewrite: { '^/api/proxy/kimi': '/' },     rateLimitPerMinute: 100 },
  { id: 'openrouter',target: 'https://openrouter.ai/api',      pathRewrite: { '^/api/proxy/openrouter': '/' },rateLimitPerMinute: 100 },
  { id: 'openai',   target: 'https://api.openai.com',           pathRewrite: { '^/api/proxy/openai': '/' },   rateLimitPerMinute: 100 },
  { id: 'groq',     target: 'https://api.groq.com',             pathRewrite: { '^/api/proxy/groq': '/' },     rateLimitPerMinute: 100 },
  { id: 'mistral',  target: 'https://api.mistral.ai',           pathRewrite: { '^/api/proxy/mistral': '/' },  rateLimitPerMinute: 100 },
  { id: 'xai',      target: 'https://api.x.ai',                 pathRewrite: { '^/api/proxy/xai': '/' },      rateLimitPerMinute: 100 },
  { id: 'cerebras', target: 'https://api.cerebras.ai',          pathRewrite: { '^/api/proxy/cerebras': '/' }, rateLimitPerMinute: 100 },
];

// ═══════════════════════════════════════════════════════════════════
// BIND
// ═══════════════════════════════════════════════════════════════════

/**
 * Bind all LLM proxy routers to the Express app.
 * Each provider is mounted at /api/proxy/{id}.
 */
export function bindLlmRouters(app: Express): void {
  for (const config of PROVIDER_ROUTES) {
    const proxy = createApiProxy({
      target: config.target,
      pathRewrite: config.pathRewrite,
      rateLimitPerMinute: config.rateLimitPerMinute,
    });

    app.use(`/api/proxy/${config.id}`, proxy);
    console.log(`[Providers] Mounted /api/proxy/${config.id} → ${config.target} (${config.rateLimitPerMinute} req/min)`);
  }
}
