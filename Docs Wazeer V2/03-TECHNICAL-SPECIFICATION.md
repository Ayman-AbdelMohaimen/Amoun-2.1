# 𓂀 Wazeer OS (وزير OS) v2.0.0-Rewrite — Technical Specification

> **Document Version:** 2.0.0  
> **Date:** 2025-07-13  
> **Author:** 100MillionDEV / العرآب  
> **Classification:** Enterprise Edition  
> **Agent Name:** Amoun (أمون)  

---

## Table of Contents

1. [Technology Stack (المكدس التقني)](#1-technology-stack)
2. [Development Constraints (قيود التطوير)](#2-development-constraints)
3. [Browser Support (دعم المتصفحات)](#3-browser-support)
4. [Performance Budgets (ميزانيات الأداء)](#4-performance-budgets)
5. [Error Handling Strategy (استراتيجية معالجة الأخطاء)](#5-error-handling-strategy)
6. [State Management Patterns (أنماط إدارة الحالة)](#6-state-management-patterns)
7. [Code Organization Rules (قواعد تنظيم الكود)](#7-code-organization-rules)
8. [Build & Deployment (البناء والنشر)](#8-build--deployment)

---

## 1. Technology Stack

### المكدس التقني — Full Dependency Table

#### Frontend — Client Application

| Package | Version | Purpose | Principle |
|---------|---------|---------|----------|
| `react` | 19.x | UI library (concurrent features, use() hook) | Scalable Architecture |
| `react-dom` | 19.x | DOM rendering | Scalable Architecture |
| `vite` | 6.x | Build tool (HMR, tree-shaking, native ESM) | Green Code |
| `@vitejs/plugin-react` | 4.x | React Fast Refresh in Vite | Green Code |
| `tailwindcss` | 4.x | Utility-first CSS framework | Green Code |
| `zustand` | 5.x | State management (minimal, type-safe) | Separation of Concerns |
| `idb-keyval` | 6.x | IndexedDB wrapper (lightweight key-value) | Separation of Concerns |
| `framer-motion` | 12.x | Animation library (page transitions, micro-interactions) | Enterprise Edition |
| `@monaco-editor/react` | 4.x | Code editor for artifacts and terminal | Enterprise Edition |
| `xterm.js` | 5.x | Terminal emulator component | Enterprise Edition |
| `@xterm/addon-fit` | 0.10.x | Terminal auto-fit addon | Enterprise Edition |
| `lucide-react` | latest | Icon library (consistent, tree-shakable) | Green Code |
| `@google/genai` | 2.4.x | Google Generative AI SDK (Gemini direct + grounding) | Scalable Architecture |
| `@babel/parser` | 7.x | AST parser for HorusGuard security scanner | Security as Mindset |
| `firebase` | 12.x | Authentication (Google OAuth, email/password) | Security as Mindset |
| `vite-plugin-pwa` | latest | PWA manifest, service worker, offline caching | Green Code |

#### Backend — Express Proxy (Minimal)

| Package | Version | Purpose | Principle |
|---------|---------|---------|----------|
| `express` | 4.x | HTTP server (proxy-only, no business logic) | Separation of Concerns |
| `cors` | 2.x | CORS headers for cross-origin API calls | Security as Mindset |
| `helmet` | 8.x | Security headers (CSP, HSTS, X-Frame) | Security as Mindset |
| `express-rate-limit` | 7.x | Rate limiting (triggers Excommunicado Protocol) | Security as Mindset |
| `http-proxy-middleware` | 3.x | Proxy LLM API requests | Separation of Concerns |

#### Development Tools

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | 5.x | Type safety (strict mode) |
| `eslint` | 9.x | Code quality and style enforcement |
| `@typescript-eslint/*` | latest | TypeScript-specific ESLint rules |
| `prettier` | 3.x | Code formatting |
| `vitest` | latest | Unit and integration testing |

#### Version Policy

| Category | Strategy |
|----------|----------|
| React/Vite/TypeScript | Lock to latest stable minor, upgrade monthly |
| LLM SDKs (`@google/genai`) | Pin to exact minor, upgrade quarterly |
| Utilities (idb-keyval, zustand) | Lock to latest, upgrade with CI tests |
| Express ecosystem | Lock to latest 4.x, no v5 migration until stable |

---

## 2. Development Constraints

### قيود التطوير — Hard Rules (Non-Negotiable)

#### TC-001: No `any` Types

```typescript
// ❌ FORBIDDEN
const data: any = response.data;
function process(input: any): any { ... }

// ✅ REQUIRED
const data: unknown = response.data;
function process(input: ChatMessage): ProcessedMessage { ... }
// Use type guards for unknown:
if (isChatMessage(data)) { /* safe */ }
```

- **Enforcement:** `@typescript-eslint/no-explicit-any` set to `"error"` in ESLint
- **Rationale:** Type safety is the foundation of **Enterprise Edition** quality

#### TC-002: No `console.log` in Production

```typescript
// ❌ FORBIDDEN in production code
console.log('User logged in:', user);
console.debug('API response:', data);

// ✅ REQUIRED: Use the event logger
import { useEventLogger } from '@/hooks/useEventLogger';
const { log } = useEventLogger();
log('user_login', { userId: user.id }); // Stored in IndexedDB logs store
```

- **Enforcement:** ESLint rule `no-console` set to `"warn"`, build-time strip via `vite-plugin-remove-console`
- **Rationale:** Prevents data leakage in production; all logs go to IndexedDB for user control

#### TC-003: No Environment Variables for API Keys

```typescript
// ❌ FORBIDDEN
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ✅ REQUIRED: Keys stored in IndexedDB by user (BYOK)
const config = await get< AppConfig>('config');
const apiKey = config.apiKeys['gemini'];
```

- **Rationale:** **Security as Mindset** — keys never in source code or build artifacts
- **Exception:** Firebase config values (public, non-secret) may use env vars

#### TC-004: No Business Logic on the Server

```javascript
// ❌ FORBIDDEN: Business logic in Express
app.post('/api/chat', (req, res) => {
  // This is FORBIDDEN: processing, transformation, routing
  const modifiedMessages = req.body.messages.map(m => ({...m, role: 'user'}));
});

// ✅ REQUIRED: Express is proxy-only
app.use('/api/chat/:provider', createProxyMiddleware({
  target: 'https://api.example.com',
  changeOrigin: true,
  pathRewrite: { '^/api/chat/gemini': '/v1beta/models' },
}));
```

- **Rationale:** **Separation of Concerns** — the Express server is a dumb pipe
- **Server Responsibilities (allowed):** Rate limiting, IP banning (Excommunicado), CORS, security headers
- **Server Responsibilities (forbidden):** Message transformation, provider routing, prompt building, authentication logic

#### TC-005: No Circular Dependencies

```javascript
// eslint.config.js
{
  rules: {
    'import/no-cycle': 'error',
    'import/no-self-import': 'error',
  }
}
```

- **Enforcement:** `eslint-plugin-import` with `no-cycle` rule
- **Detection:** `madge --circular src/` in CI pipeline

#### TC-006: File Size Limits

| Limit | Value | Rationale |
|-------|-------|----------|
| Max lines per file | 500 | Forces modular decomposition |
| Max lines per component | 300 | Components should be composable, not monolithic |
| Max lines per function | 50 | Complex functions need extraction |
| Max function parameters | 4 | Use options object pattern beyond 3 |

#### TC-007: No STUB or MOCK Implementations

```typescript
// ❌ FORBIDDEN
export function processArtifact(artifact: Artifact): void {
  // TODO: STUB - implement later
  console.warn('Not implemented');
}

// ✅ REQUIRED: Real implementation or explicit feature flag
export function processArtifact(artifact: Artifact): ProcessedArtifact {
  if (!FEATURE_FLAGS.artifactProcessing) {
    throw new NotImplementedError('Artifact processing');
  }
  // ... real implementation
}
```

- **Rationale:** **Enterprise Edition** — no dead code or placeholder functions in production

---

## 3. Browser Support

### دعم المتصفحات

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| **Google Chrome** | 90+ | Primary target, full feature support |
| **Microsoft Edge** | 90+ | Chromium-based, full feature support |
| **Safari** | 16.4+ | IndexedDB, Service Worker, Speech API |
| **Firefox** | 90+ | Full feature support, except PWA install prompt |
| **Mobile Chrome** | 90+ | PWA install, voice, responsive layout |
| **Mobile Safari** | 16.4+ | PWA install, voice (with limitations) |

#### Feature Support Matrix

| Feature | Chrome 90+ | Edge 90+ | Safari 16.4+ | Firefox 90+ |
|---------|-----------|---------|-------------|-------------|
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Web Speech API | ✅ | ✅ | ⚠️ Partial | ❌ |
| Web Speech Synthesis | ✅ | ✅ | ✅ | ✅ |
| File System Access | ✅ | ✅ | ❌ | ❌ |
| CSS `backdrop-filter` | ✅ | ✅ | ✅ | ✅ |
| `crypto.subtle` (SHA-256) | ✅ | ✅ | ✅ | ✅ |
| `structuredClone` | ✅ | ✅ | ✅ | ✅ |
| `top-level await` | ✅ | ✅ | ✅ | ✅ |
| Before Install Prompt | ✅ | ✅ | ✅ | ❌ |

#### Browserslist Configuration

```json
{
  "browserslist": [
    "> 0.5%",
    "not dead",
    "Chrome >= 90",
    "Edge >= 90",
    "Safari >= 16.4",
    "Firefox >= 90"
  ]
}
```

---

## 4. Performance Budgets

### ميزانيات الأداء

#### Core Web Vitals Targets

| Metric | Target | Threshold | Measurement |
|--------|--------|-----------|-------------|
| **FCP** (First Contentful Paint) | < 1.5s | 2.0s alert | Lighthouse CI |
| **LCP** (Largest Contentful Paint) | < 2.5s | 3.0s alert | Lighthouse CI |
| **TTI** (Time to Interactive) | < 3.0s | 4.0s alert | Lighthouse CI |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 0.2 alert | Lighthouse CI |
| **INP** (Interaction to Next Paint) | < 200ms | 300ms alert | Lighthouse CI |

#### Bundle Size Budget

| Category | Budget (gzip) | Current Strategy |
|----------|--------------|-----------------|
| **Total JS** | < 500KB | Tree-shaking, dynamic imports |
| **Initial Chunk** | < 200KB | Core app shell only |
| **React + ReactDOM** | ~45KB | Via ESM, shared chunk |
| **Tailwind CSS** | < 15KB | Purged unused utilities |
| **Monaco Editor** | 0KB initial | Lazy-loaded on artifact open |
| **xterm.js** | 0KB initial | Lazy-loaded on terminal open |
| **Framer Motion** | < 30KB | Tree-shaken to used features |
| **Total CSS** | < 20KB | Tailwind purged + custom minimal |

#### Runtime Performance

| Operation | Target | Strategy |
|-----------|--------|----------|
| IndexedDB Read | < 50ms | Single key lookups via idb-keyval |
| IndexedDB Write | < 100ms | Batch writes where possible |
| System Prompt Assembly | < 200ms | Memoized memory injection |
| Provider Adapter Resolution | < 10ms | Map lookup |
| First Streaming Token | < 2.0s (after network) | Pre-warm connection |
| Message Render | < 16ms (60fps) | Virtualized list for 100+ messages |
| Dashboard Metric Calc | < 300ms | Cached aggregates, refresh on interval |

#### Lazy Loading Strategy

```typescript
// Heavy modules loaded on demand
const MonacoEditor = lazy(() => import('@/components/MonacoEditor'));
const Terminal = lazy(() => import('@/components/Terminal'));
const SettingsPage = lazy(() => import('@/pages/Settings'));
const DashboardCharts = lazy(() => import('@/components/DashboardCharts'));
```

---

## 5. Error Handling Strategy

### استراتيجية معالجة الأخطاء

#### 5.1 Error Boundary Architecture

```
┌──────────────────────────────────────────┐
│         App-level Error Boundary          │  ← Catches all unhandled errors
│  ┌────────────────────────────────────┐  │
│  │       Page-level Error Boundary     │  │  ← Per-route recovery
│  │  ┌──────────────────────────────┐  │  │
│  │  │    Component Error Boundary    │  │  │  ← Feature-specific recovery
│  │  └──────────────────────────────┘  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

#### 5.2 Error Classification

| Level | Type | Handling | User Feedback |
|-------|------|----------|---------------|
| **L1** | Network | Retry with exponential backoff | "Retrying... (attempt 2/3)" |
| **L2** | Provider API | Fallback to alternate provider | Toast: "Switched to Claude" |
| **L3** | Data Corruption | Re-create IndexedDB store | "Data reset. Some history may be lost." |
| **L4** | Auth Failure | Re-authenticate | Redirect to login with message |
| **L5** | Critical | Error boundary + report | Full-screen error with reload button |

#### 5.3 Retry with Exponential Backoff

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number; maxDelay?: number } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options;
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxRetries) break;

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = delay * 0.1 * Math.random();
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }
  throw lastError!;
}
```

#### 5.4 Circuit Breaker Pattern

```typescript
interface CircuitBreaker {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: number;
  threshold: number;      // e.g., 5 failures
  resetTimeout: number;   // e.g., 30000ms
}

// Applied per-provider in AIGateway:
// - closed: normal operation
// - open: all requests fail fast (no network call)
// - half-open: allow 1 test request to check recovery
```

#### 5.5 Graceful Degradation Matrix

| Feature Fails | Degradation | User Experience |
|---------------|-------------|-----------------|
| LLM Provider down | Fallback or error message | "Gemini unavailable. Using Claude." or "All providers down." |
| IndexedDB unavailable | In-memory fallback (session only) | Warning: "Data won't persist this session." |
| Voice API unavailable | Hide microphone button | No error, feature simply absent |
| Web Speech Synthesis unavailable | Text-only responses | No TTS, no error shown |
| PWA install unsupported | Hide install button | No prompt, app works in browser |
| Monaco Editor fails | Show code in `<pre>` block | Functional but no syntax highlighting |
| Gemini grounding unavailable | Respond without search | No citations, no error |

---

## 6. State Management Patterns

### أنماط إدارة الحالة

#### 6.1 Zustand Store Architecture

```
src/stores/
├── workspaceStore.ts      # Active session, messages, UI state
├── configStore.ts         # User config, API keys, custom models
├── taskStore.ts           # Tasks CRUD, filtering, sorting
├── artifactStore.ts       # Artifacts list, active artifact
├── memoryStore.ts         # User memory access (read-only for components)
├── authStore.ts           # Auth state, user info
└── index.ts               # Barrel export
```

#### 6.2 Store Design Rules

| Rule | Specification |
|------|-------------|
| **No Business Logic** | Stores hold state and sync to IndexedDB. All logic in services. |
| **Persistence** | Each store subscribes to changes via Zustand `subscribe` → writes to IndexedDB |
| **Hydration** | On app boot, stores read from IndexedDB and hydrate |
| **Selectors** | Components use `useStore(selector)` to minimize re-renders |
| **Actions** | Stores expose setter actions; components call actions, not direct `set` |

#### 6.3 IndexedDB Persistence Pattern

```typescript
// Sync Zustand → IndexedDB
const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  sessions: [],
  activeSessionId: null,

  addSession: (session) => {
    set((state) => ({
      sessions: [...state.sessions, session],
      activeSessionId: session.id,
    }));
    // Persist to IndexedDB
    set('state', get());
  },
}));

// Hydrate IndexedDB → Zustand on boot
async function hydrateStores() {
  const state = await get<StateData>('state');
  if (state) {
    useWorkspaceStore.setState(state);
  }
}
```

#### 6.4 Store Data Flow

```
┌─────────────┐     Action      ┌─────────────┐    Subscribe     ┌─────────────┐
│  Component  │ ──────────────→ │  Zustand    │ ───────────────→ │  IndexedDB  │
│  (React)    │ ←────────────── │  Store      │ ←─────────────── │  (idb-keyval)│
└─────────────┘    Selector     └─────────────┘    Hydrate       └─────────────┘
```

---

## 7. Code Organization Rules

### قواعد تنظيم الكود

#### 7.1 Directory Structure

```
src/
├── components/           # React components (UI only)
│   ├── chat/             # Chat-related components
│   ├── dashboard/        # Dashboard widgets and cards
│   ├── tasks/            # Task management UI
│   ├── settings/         # Settings forms and panels
│   ├── auth/             # Login, register, OAuth
│   ├── layout/           # Navbar, sidebar, footer
│   └── shared/           # Buttons, modals, toasts, inputs
├── pages/                # Route-level page components
├── stores/               # Zustand state stores
├── services/             # Business logic layer
│   ├── ai/               # AIGateway + provider adapters
│   ├── auth/             # Authentication service
│   ├── memory/           # MemoryEngine
│   ├── learning/         # LearningEngine (task extraction)
│   ├── scheduler/        # TaskScheduler
│   ├── security/         # HorusGuard, prompt sanitizer
│   └── events/           # Event logging service
├── hooks/                # Custom React hooks
├── types/                # TypeScript interfaces and types
├── utils/                # Pure utility functions
├── constants/            # App-wide constants
├── assets/               # Images, fonts, icons
├── styles/               # Global CSS, Tailwind config
└── app/                  # App entry, routing, providers
```

#### 7.2 Import Rules

| Rule | Specification |
|------|-------------|
| **Absolute Imports** | Use `@/` alias, never relative `../../` imports |
| **Barrel Exports** | Every directory has an `index.ts` that re-exports public API |
| **Import Order** | 1. React/libraries, 2. Internal modules, 3. Types, 4. Styles |
| **No Deep Imports** | Import from barrel exports, not internal files of other modules |

```typescript
// ✅ Correct import order
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useWorkspaceStore } from '@/stores';
import { AIGateway } from '@/services/ai';
import type { ChatMessage } from '@/types';

// ❌ Forbidden
import { Something } from '../../../components/chat/Something';
```

#### 7.3 Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Components | PascalCase | `ChatInput.tsx`, `TaskCard.tsx` |
| Hooks | camelCase with `use` prefix | `useEventLogger.ts`, `useMemory.ts` |
| Stores | camelCase with `Store` suffix | `workspaceStore.ts`, `configStore.ts` |
| Services | PascalCase | `AIGateway.ts`, `MemoryEngine.ts`, `HorusGuard.ts` |
| Types/Interfaces | PascalCase | `ChatMessage`, `Task`, `UserMemory` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRIES`, `MEMORY_TTL_DAYS` |
| Utils | camelCase | `formatDate.ts`, `hashPassword.ts` |
| CSS Classes | Tailwind utilities (no custom classes except `@apply`) | — |

#### 7.4 Co-Located Tests

```
src/
├── services/
│   ├── ai/
│   │   ├── AIGateway.ts
│   │   ├── AIGateway.test.ts    # ← Co-located test
│   │   ├── providers/
│   │   │   ├── gemini.ts
│   │   │   ├── gemini.test.ts   # ← Co-located test
│   │   │   └── ...
│   │   └── index.ts
│   └── ...
```

- Test files use `.test.ts` or `.test.tsx` suffix
- Co-located with the module they test
- Test utilities in `src/test/` for shared fixtures

#### 7.5 TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": false,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 8. Build & Deployment

### البناء والنشر

#### 8.1 Vite Configuration Highlights

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        runtimeCaching: [
          { urlPattern: /\.(?:png|jpg|svg|woff2)$/, handler: 'CacheFirst' },
          { urlPattern: /\/api\//, handler: 'NetworkOnly' }, // Never cache API
        ],
      },
      manifest: {
        name: 'Wazeer OS',
        short_name: 'وزير',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        icons: [{ src: '/favicon.svg', sizes: '192x192', type: 'image/svg+xml' }],
      },
    }),
  ],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ai-vendor': ['@google/genai'],
        },
      },
    },
  },
});
```

#### 8.2 Environment Variables (Non-Secret Only)

| Variable | Purpose | Required |
|----------|---------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase public config | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Yes |
| `VITE_PROXY_URL` | Express proxy base URL | Yes |
| `VITE_APP_VERSION` | Current version for display | Yes |

> **Note:** No API keys for LLM providers are in environment variables. Users provide their own keys via BYOK (FR-003).

#### 8.3 Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│                CDN / Static Hosting               │
│         (Vercel / Netlify / Cloudflare Pages)     │
│                                                  │
│    index.html + JS bundles + CSS + assets        │
│    Service Worker (vite-plugin-pwa)               │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              Express Proxy Server                 │
│            (Node.js / Docker)                    │
│                                                  │
│    /api/chat/:provider → LLM Provider APIs       │
│    Rate Limiting + Excommunicado Protocol        │
│    CORS + Helmet Security Headers                │
└──────────────────────┬──────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
     ┌────────┐  ┌────────┐  ┌──────────┐
     │ Gemini  │  │ Claude  │  │ NVIDIA   │  ... (15 providers)
     │  API   │  │  API   │  │   API    │
     └────────┘  └────────┘  └──────────┘
```

#### 8.4 CI Quality Gates

| Gate | Threshold | Tool |
|------|-----------|------|
| TypeScript compilation | Zero errors | `tsc --noEmit` |
| ESLint | Zero errors | `eslint src/` |
| Circular dependencies | Zero | `madge --circular` |
| Bundle size | < 500KB gzip | `vite build` output check |
| Lighthouse PWA | > 90 | `lighthouseci` |
| Test coverage (services) | > 80% | `vitest --coverage` |

---

> صُنع بـ ❤️ بواسطة العرآب | حقوق النشر 100MillionDEV.com  
> 𓂀 Wazeer OS — Enterprise Edition v2.0.0-Rewrite