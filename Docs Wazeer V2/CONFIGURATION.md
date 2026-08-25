# Configuration / الإعدادات

> Wazeer OS / وزير OS v2.0.0-Rewrite | 𓂀 Amoun / أمون
> Author: 100MillionDEV / العرآب
> Principle: **Separation of Concerns** — Config is data, not logic

---

## 1. Configuration Architecture / بنية الإعدادات

### Storage Hierarchy

```
Priority (highest → lowest)

┌───────────────────────────────────┐
│  1. Runtime User Preferences      │  ← IndexedDB config store
│     (set via Settings UI)          │     Persisted, per-browser
├───────────────────────────────────┤
│  2. Feature Flags                  │  ← IndexedDB config store
│     (can be toggled at runtime)    │     Key: 'feature_flags'
├───────────────────────────────────┤
│  3. Build-Time Environment         │  ← VITE_* env vars
│     (baked into JS at build)       │     Immutable after build
├───────────────────────────────────┤
│  4. Code Defaults                  │  ← Source code
│     (hardcoded fallbacks)          │     Always available
└───────────────────────────────────┘
```

### Configuration Flow

```
User changes setting in UI
       │
       ▼
Zustand store updates immediately (reactive UI)
       │
       ▼
Zustand persist middleware triggers
       │
       ▼
IndexedDB config store written via idb-keyval
       │
       ▼
On next app load: IndexedDB → Zustand → UI
```

---

## 2. App Configuration / إعدادات التطبيق

### Theme Configuration

| Property | Type | Default | Options |
----------|------|---------|----------|
| `theme.active` | `string` | `'egyptian-cyberpunk'` | `egyptian-cyberpunk`, `light`, `high-contrast` |
| `theme.primaryBg` | `string` | `'#0a0a0f'` | Any CSS color |
| `theme.accentGold` | `string` | `'#d4af37'` | Any CSS color |
| `theme.accentTeal` | `string` | `'#00d4aa'` | Any CSS color |
| `theme.accentRuby` | `string` | `'#e74c3c'` | Any CSS color |
| `theme.glowEnabled` | `boolean` | `true` | Neon glow effects |
| `theme.glyphWatermark` | `boolean` | `true` | Hieroglyph background patterns |
| `theme.animationSpeed` | `number` | `1.0` | Framer Motion speed multiplier (0.5–2.0) |

### Egyptian Cyberpunk Theme Palette

```
┌────────────────────────────────────────────────────┐
│  DEEP SPACE BLACK    #0a0a0f  ████████████████    │
│  PHARAOH GOLD        #d4af37  ████████████████    │
│  NILE TEAL           #00d4aa  ████████████████    │
│  DESERT RUBY         #e74c3c  ████████████████    │
│  PYRAMID STONE       #8B7355  ████████████████    │
│  PAPYRUS LIGHT       #F5E6CC  ████████████████    │
│  OBELISK GRAY        #2C2C3A  ████████████████    │
│  SCARAB GREEN        #27AE60  ████████████████    │
└────────────────────────────────────────────────────┘
```

### Language Configuration

| Property | Type | Default | Options |
----------|------|---------|----------|
| `language.active` | `string` | `'ar'` | `ar`, `en` |
| `language.direction` | `string` | Auto | `rtl` (ar), `ltr` (en) |
| `language.fallback` | `string` | `'en'` | `en` |

### Translation Loading

```typescript
// src/lib/i18n/index.ts
const ar = () => import('./locales/ar.json');
const en = () => import('./locales/en.json');

export const locales = {
  ar: { loader: ar, dir: 'rtl', label: 'العربية' },
  en: { loader: en, dir: 'ltr', label: 'English' },
};
```

### Voice / TTS Configuration

| Property | Type | Default | Options |
----------|------|---------|----------|
| `voice.enabled` | `boolean` | `false` | Toggle TTS |
| `voice.rate` | `number` | `1.0` | Speech speed (0.5–2.0) |
| `voice.pitch` | `number` | `1.0` | Speech pitch (0.5–2.0) |
| `voice.volume` | `number` | `0.8` | Speech volume (0.0–1.0) |
| `voice.preferredVoice` | `string` | Auto | Browser TTS voice name |

---

## 3. Model Registry / سجل النماذج

### Supported Providers & Models

The model registry defines all 15 supported LLM providers and their available models. This is the source of truth for the Settings UI dropdown and AIGateway routing.

```typescript
// src/lib/ai/model-registry.ts
export interface ModelEntry {
  id: string;              // Unique model identifier
  provider: string;        // Provider ID
  name: string;            // Display name
  contextWindow: number;   // Max input tokens
  supportsStreaming: boolean;
  supportsVision: boolean;
 supportsGrounding: boolean; // Gemini search grounding
  maxOutputTokens: number;
  costPer1kInput?: number;  // USD (for display)
  costPer1kOutput?: number; // USD (for display)
}

export const MODEL_REGISTRY: ModelEntry[] = [
  // Google Gemini
  {
    id: 'gemini-2.5-flash',
    provider: 'gemini',
    name: 'Gemini 2.5 Flash',
    contextWindow: 1048576,
    supportsStreaming: true,
    supportsVision: true,
    supportsGrounding: true,
    maxOutputTokens: 65536,
    costPer1kInput: 0.0,
    costPer1kOutput: 0.0,
  },
  {
    id: 'gemini-2.0-flash',
    provider: 'gemini',
    name: 'Gemini 2.0 Flash',
    contextWindow: 1048576,
    supportsStreaming: true,
    supportsVision: true,
    supportsGrounding: true,
    maxOutputTokens: 8192,
  },

  // OpenAI
  {
    id: 'gpt-4o',
    provider: 'openai',
    name: 'GPT-4o',
    contextWindow: 128000,
    supportsStreaming: true,
    supportsVision: true,
    supportsGrounding: false,
    maxOutputTokens: 16384,
    costPer1kInput: 2.50,
    costPer1kOutput: 10.00,
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    name: 'GPT-4o Mini',
    contextWindow: 128000,
    supportsStreaming: true,
    supportsVision: true,
    supportsGrounding: false,
    maxOutputTokens: 16384,
    costPer1kInput: 0.15,
    costPer1kOutput: 0.60,
  },

  // Anthropic Claude
  {
    id: 'claude-4-sonnet',
    provider: 'anthropic',
    name: 'Claude 4 Sonnet',
    contextWindow: 200000,
    supportsStreaming: true,
    supportsVision: true,
    supportsGrounding: false,
    maxOutputTokens: 16384,
    costPer1kInput: 3.0,
    costPer1kOutput: 15.0,
  },

  // ... 12 more providers (Mistral, Groq, Cohere, Perplexity,
  //     DeepSeek, Ollama, Together, OpenRouter, HuggingFace,
  //     Replicate, fireworks.ai)
];
```

### Provider Adapter Mapping

| Provider ID | Adapter File | Base URL | Auth Header |
-------------|-------------|----------|-------------|
| `gemini` | `adapters/gemini.ts` | `generativelanguage.googleapis.com` | `?key=` query param |
| `openai` | `adapters/openai.ts` | `api.openai.com` | `Authorization: Bearer` |
| `anthropic` | `adapters/anthropic.ts` | `api.anthropic.com` | `x-api-key` header |
| `mistral` | `adapters/mistral.ts` | `api.mistral.ai` | `Authorization: Bearer` |
| `groq` | `adapters/groq.ts` | `api.groq.com` | `Authorization: Bearer` |
| `ollama` | `adapters/ollama.ts` | `localhost:11434` | None (local) |
| `together` | `adapters/together.ts` | `api.together.xyz` | `Authorization: Bearer` |
| `openrouter` | `adapters/openrouter.ts` | `openrouter.ai/api` | `Authorization: Bearer` |
| `huggingface` | `adapters/huggingface.ts` | `api-inference.huggingface.co` | `Authorization: Bearer` |
| `replicate` | `adapters/replicate.ts` | `api.replicate.com` | `Authorization: Bearer` |
| `fireworks` | `adapters/fireworks.ts` | `api.fireworks.ai/inference` | `Authorization: Bearer` |
| `cohere` | `adapters/cohere.ts` | `api.cohere.ai` | `Authorization: Bearer` |
| `perplexity` | `adapters/perplexity.ts` | `api.perplexity.ai` | `Authorization: Bearer` |
| `deepseek` | `adapters/deepseek.ts` | `api.deepseek.com` | `Authorization: Bearer` |

---

## 4. Proxy Server Configuration / إعدادات خادم الوكيل

### Express Server Config

```typescript
// server/config.ts
export const serverConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // CORS
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim()),

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  // Body
  bodySizeLimit: process.env.BODY_SIZE_LIMIT || '5mb',

  // Timeout
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '120000', 10),

  // Proxy
  trustProxy: parseInt(process.env.TRUST_PROXY || '0', 10),

  // Logging
  logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
};
```

### LLM Proxy Routes

| Route | Method | Proxied To | Description |
|-------|--------|-----------|-------------|
| `/api/ai/gemini/*` | POST | `generativelanguage.googleapis.com` | Google Gemini API |
| `/api/ai/openai/*` | POST | `api.openai.com` | OpenAI API |
| `/api/ai/anthropic/*` | POST | `api.anthropic.com` | Anthropic Claude API |
| `/api/ai/mistral/*` | POST | `api.mistral.ai` | Mistral API |
| `/api/ai/groq/*` | POST | `api.groq.com` | Groq API |
| `/api/ai/ollama/*` | POST | `localhost:11434` | Ollama (local) |
| `/api/ai/together/*` | POST | `api.together.xyz` | Together AI |
| `/api/ai/openrouter/*` | POST | `openrouter.ai` | OpenRouter |
| `/api/ai/huggingface/*` | POST | `api-inference.huggingface.co` | HuggingFace |
| `/api/ai/replicate/*` | POST | `api.replicate.com` | Replicate |
| `/api/ai/fireworks/*` | POST | `api.fireworks.ai` | Fireworks AI |
| `/api/ai/cohere/*` | POST | `api.cohere.ai` | Cohere |
| `/api/ai/perplexity/*` | POST | `api.perplexity.ai` | Perplexity |
| `/api/ai/deepseek/*` | POST | `api.deepseek.com` | DeepSeek |
| `/api/health` | GET | — | Health check (no proxy) |

---

## 5. PWA Configuration / إعدادات التطبيق التقدمي

### Manifest

```json
{
  "name": "Wazeer OS / وزير OS",
  "short_name": "وزير",
  "description": "AI Operating System — 𓂀 Amoun / أمون",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#d4af37",
  "orientation": "any",
  "scope": "/",
  "dir": "auto",
  "lang": "ar",
  "categories": ["productivity", "utilities"],
  "icons": [
    {
      "src": "/icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### Service Worker Strategy

| Asset Type | Strategy | Max Age | Rationale |
-------------|----------|---------|-----------|
| HTML (`index.html`) | NetworkFirst | — | Always try fresh, fall back to cache |
| JS/CSS (content-hashed) | CacheFirst | 1 year | Immutable filenames, safe to cache long |
| Images/PNG/SVG | CacheFirst | 30 days | Static assets, rarely change |
| Fonts | StaleWhileRevalidate | 30 days | Don't block render, update in background |
| API responses | NetworkOnly | — | Never cache API calls |
| LLM responses | NetworkOnly | — | Real-time data, never cache |

---

## 6. Security Configuration / إعدادات الأمان

### Content Security Policy (CSP)

```typescript
// server/middleware/security.ts
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],  // Tailwind CSS needs inline
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'connect-src': ["'self'", 'https:'],             // LLM APIs are HTTPS
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};
```

### CORS Configuration

```typescript
// server/middleware/cors.ts
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowed = serverConfig.allowedOrigins;
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: false,  // No cookies for cross-origin
  maxAge: 86400,       // Preflight cache: 24 hours
};
```

### COEP/COOP/CORP Configuration

| Header | Value | Effect |
|--------|-------|--------|
| `Cross-Origin-Embedder-Policy` | `require-corp` | All cross-origin resources need CORS headers; enables SharedArrayBuffer |
| `Cross-Origin-Opener-Policy` | `same-origin` | Prevents cross-origin windows from sharing browsing context |
| `Cross-Origin-Resource-Policy` | `same-origin` | Blocks cross-origin loading of same-origin resources |

### HorusGuard Configuration

```typescript
// src/lib/security/horusguard/config.ts
export const horusGuardConfig = {
  enabled: true,
  maxBlockSize: 500,           // Max lines to scan (performance guard)
  defaultAction: {
    critical: 'block',         // Block execution entirely
    high: 'block',             // Block execution
    medium: 'warn',            // Warn user, allow with confirmation
    low: 'log',                // Log only
  },
  customPatterns: [           // User can add custom rules
    // { name: 'custom_rule', severity: 'high', ... }
  ],
};
```

---

## 7. Zustand Persistence Configuration / إعدادات استمرار الحالة

### Store Configuration

```typescript
// src/stores/appStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

const STORAGE_PREFIX = 'wazeer:';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // --- Theme ---
      theme: 'egyptian-cyberpunk' as string,
      setTheme: (theme: string) => set({ theme }),

      // --- Language ---
      language: 'ar' as 'ar' | 'en',
      setLanguage: (language: 'ar' | 'en') => set({ language }),

      // --- Voice ---
      voiceEnabled: false,
      setVoiceEnabled: (enabled: boolean) => set({ voiceEnabled: enabled }),

      // --- Active Agent ---
      activeAgentId: null as string | null,
      setActiveAgentId: (id: string | null) => set({ activeAgentId: id }),

      // --- Sidebar ---
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      // --- Active Panel ---
      activePanel: 'chat' as string,
      setActivePanel: (panel: string) => set({ activePanel: panel }),
    }),
    {
      name: 'wazeer-state',
      storage: createJSONStorage(() => ({
        getItem: async (name: string) => {
          const val = await get(STORAGE_PREFIX + name);
          return val ? JSON.stringify(val) : null;
        },
        setItem: async (name: string, value: string) => {
          await set(STORAGE_PREFIX + name, JSON.parse(value));
        },
        removeItem: async (name: string) => {
          await del(STORAGE_PREFIX + name);
        },
      })),
      partialize: (state) => ({
        // Only persist these fields (exclude transient state)
        theme: state.theme,
        language: state.language,
        voiceEnabled: state.voiceEnabled,
        activeAgentId: state.activeAgentId,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      version: 1,
      migrate: (persisted, version) => {
        // Handle future state migrations
        return persisted as typeof persisted;
      },
    }
  )
);
```

### Persisted vs. Non-Persisted State

| State | Persisted? | Reason |
|-------|-----------|--------|
| Theme | ✅ Yes | User preference |
| Language | ✅ Yes | User preference |
| Voice enabled | ✅ Yes | User preference |
| Active agent ID | ✅ Yes | Resume where user left off |
| Sidebar collapsed | ✅ Yes | Layout preference |
| Chat messages | ❌ No | Stored in IndexedDB `logs` store |
| Current typing text | ❌ No | Transient input |
| Modal open/close | ❌ No | Transient UI state |
| Loading spinners | ❌ No | Transient UI state |
| Error toasts | ❌ No | Transient UI state |

---

## 8. Feature Flags / أعلام الميزات

### Flag Registry

```typescript
// src/lib/feature-flags.ts
export interface FeatureFlag {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  defaultValue: boolean;
  category: 'ai' | 'security' | 'ui' | 'experimental';
  requiresVersion: string;  // Minimum version required
}

export const FEATURE_FLAGS: FeatureFlag[] = [
  {
    id: 'memory_engine',
    name: 'Memory Engine',
    nameAr: 'محرك الذاكرة',
    description: 'Persistent user memory across conversations',
    descriptionAr: 'ذاكرة المستخدم المستمرة عبر المحادثات',
    defaultValue: true,
    category: 'ai',
    requiresVersion: '2.0.0',
  },
  {
    id: 'learning_engine',
    name: 'Learning Engine',
    nameAr: 'محرك التعلم',
    description: 'Agent learning from task outcomes',
    descriptionAr: 'تعلم الوكيل من نتائج المهام',
    defaultValue: true,
    category: 'ai',
    requiresVersion: '2.0.0',
  },
  {
    id: 'gemini_grounding',
    name: 'Gemini Grounding Search',
    nameAr: 'بحث Gemini الجذري',
    description: 'Real web search via Google Gemini grounding',
    descriptionAr: 'بحث ويب حقيقي عبر Gemini',
    defaultValue: true,
    category: 'ai',
    requiresVersion: '2.0.0',
  },
  {
    id: 'task_scheduler',
    name: 'Task Scheduler',
    nameAr: 'جدولة المهام',
    description: 'Priority-based task scheduling and execution',
    descriptionAr: 'جدولة المهام وتنفيذها بالأولوية',
    defaultValue: true,
    category: 'ai',
    requiresVersion: '2.0.0',
  },
  {
    id: 'horusguard',
    name: 'HorusGuard AST Scanner',
    nameAr: 'فاحص HorusGuard',
    description: 'AST-based security scanning of generated code',
    descriptionAr: 'فحص أمني للكود المُولّد عبر AST',
    defaultValue: true,
    category: 'security',
    requiresVersion: '2.0.0',
  },
  {
    id: 'excommunicado',
    name: 'Excommunicado Protocol',
    nameAr: 'بروتوكول النفي',
    description: 'IP-based banning for malicious requests',
    descriptionAr: 'حظر IPs المشبوهة',
    defaultValue: true,
    category: 'security',
    requiresVersion: '2.0.0',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    nameAr: 'التحليلات',
    description: 'Anonymous usage analytics',
    descriptionAr: 'تحليلات استخدام مجهولة',
    defaultValue: false,
    category: 'experimental',
    requiresVersion: '2.0.0',
  },
  {
    id: 'agent_dashboard_cards',
    name: 'Per-Agent Dashboard Cards',
    nameAr: 'بطاقات لوحة التحكم',
    description: 'Individual agent status cards on dashboard',
    descriptionAr: 'بطاقات حالة الوكلاء',
    defaultValue: true,
    category: 'ui',
    requiresVersion: '2.0.0',
  },
];
```

### Usage in Components

```typescript
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

function SearchButton() {
  const searchEnabled = useFeatureFlag('gemini_grounding');

  if (!searchEnabled) return null;

  return <button>بحث الويب</button>;
}
```

---

## 9. Configuration Validation / التحقق من الإعدادات

### Zod Schemas for Config

```typescript
import { z } from 'zod';

export const AppConfigSchema = z.object({
  theme: z.enum(['egyptian-cyberpunk', 'light', 'high-contrast']),
  language: z.enum(['ar', 'en']),
  voiceEnabled: z.boolean(),
  defaultProvider: z.string().min(1),
  defaultModel: z.string().min(1),
  llmKeys: z.array(z.object({
    provider: z.string().min(1),
    apiKey: z.string().min(10),
    model: z.string().min(1),
    isActive: z.boolean(),
  })),
  featureFlags: z.record(z.boolean()),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
```

### Validation on Load

```typescript
// On app startup, validate stored config
const stored = await configDB.get('app_config');
const result = AppConfigSchema.safeParse(stored);

if (!result.success) {
  console.warn('Invalid config, resetting to defaults:', result.error);
  await configDB.set('app_config', getDefaultConfig());
}
```

---

> 𓂀 *Configuration is the nervous system of the application. Every setting has a purpose, every default is intentional.* — Wazeer OS Engineering
