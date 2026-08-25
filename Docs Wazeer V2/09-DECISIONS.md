# 09 — Architecture Decision Records (ADRs)

> Wazeer OS / وزير OS v2.0.0-Rewrite | 𓂀 Amoun / أمون
> Author: 100MillionDEV / العرآب
> Status: Living Document — Updated per sprint

---

## ADR Index

| # | Decision | Status | Date |
|---|----------|--------|------|
| ADR-001 | Client-Side-First Architecture | ✅ Accepted | 2025-01-15 |
| ADR-002 | BYOK (Bring Your Own Key) Model | ✅ Accepted | 2025-01-15 |
| ADR-003 | Unified AIGateway v2.0 | ✅ Accepted | 2025-02-01 |
| ADR-004 | Gemini Grounding for Web Search | ✅ Accepted | 2025-02-01 |
| ADR-005 | Task Schema Enrichment (4-Field Model) | ✅ Accepted | 2025-02-10 |
| ADR-006 | PWA Over Native Application | ✅ Accepted | 2025-01-20 |
| ADR-007 | Zustand over Redux | ✅ Accepted | 2025-01-15 |
| ADR-008 | HorusGuard AST Scanner | ✅ Accepted | 2025-02-05 |
| ADR-009 | SHA-256 Client-Side Password Hashing | ✅ Accepted | 2025-02-05 |
| ADR-010 | Egyptian Cyberpunk Design System | ✅ Accepted | 2025-01-10 |

---

## ADR-001: Client-Side-First Architecture

**Date:** 2025-01-15
**Status:** ✅ Accepted
**Deciders:** 100MillionDEV

### Context

Wazeer OS is an AI-powered operating system interface that must function as a PWA on shared hosting (Hostinger) with no backend compute budget. The application handles 15+ LLM provider integrations, real-time chat, task scheduling, and artifact generation — all primarily on the client.

### Decision

All business logic, AI orchestration, state management, and data persistence reside on the client side. The Express server acts as a **proxy-only** layer to:
- Bypass CORS restrictions for LLM API calls
- Attach security headers (COEP, COOP, CORP, CSP, HSTS)
- Apply rate limiting (100 req/min/IP) and body size limits (5MB)

### Consequences

| Positive | Negative |
|----------|----------|
| Zero server-side compute cost | API keys must be managed client-side (BYOK) |
| Works on any static host | Larger initial bundle size (~250KB gzip) |
| Offline-capable via Service Worker | IndexedDB storage limits (~50MB–unlimited) |
| Instant UI response | Complex client-side security required |
| Privacy-first (data stays local) | No server-side validation fallback |

```
┌──────────────────────────────────────────────────┐
│                   Browser (PWA)                   │
│  ┌─────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ React 19│  │ Zustand 5│  │ IndexedDB v4  │  │
│  │   UI    │  │  State   │  │   Monmamar    │  │
│  └────┬────┘  └────┬─────┘  └───────┬────────┘  │
│       │            │                │            │
│       └────────────┼────────────────┘            │
│                    │                             │
│            ┌───────┴───────┐                     │
│            │  AIGateway v2 │                     │
│            │  15 Providers │                     │
│            └───────┬───────┘                     │
└────────────────────┼────────────────────────────┘
                     │ fetch (proxy)
┌────────────────────┼────────────────────────────┐
│           Express 4 Proxy Server                 │
│    Helmet │ Rate Limit │ COEP/COOP/CORP          │
└────────────┼────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │   LLM Providers  │
    │  Gemini, Claude, │
    │  OpenAI, etc.    │
    └─────────────────┘
```

---

## ADR-002: BYOK (Bring Your Own Key)

**Date:** 2025-01-15
**Status:** ✅ Accepted

### Context

Wazeer OS integrates 15 LLM providers. Hosting on shared hosting with a proxy-only server means we cannot securely store API keys server-side. A SaaS billing model is out of scope for v2.0.

### Decision

Users provide their own API keys, stored exclusively in IndexedDB (`config` store, field `llm_keys`). Keys are **never** transmitted to our server — only to the respective LLM provider endpoints via the Express proxy. The prompt sanitizer redacts any keys that appear in user messages before logging or display.

### Consequences

- **Green Code:** No server-side key storage = zero key-leak attack surface
- **Scalable Architecture:** Adding a new provider requires zero server changes — just a client-side provider adapter
- **Enterprise:** Teams can use organization keys without centralized billing
- **Risk:** Users must manage their own key rotation and quotas

```typescript
// Key storage shape in IndexedDB config store
interface LLMKeyConfig {
  provider: string;       // 'gemini' | 'openai' | 'claude' | ...
  apiKey: string;         // encrypted at rest via SHA-256 hash for verification
  model: string;          // 'gemini-2.5-flash' | 'claude-4-sonnet' | ...
  isActive: boolean;
  rateLimitPerMin: number;
  addedAt: number;        // Unix timestamp
}
```

---

## ADR-003: Unified AIGateway v2.0

**Date:** 2025-02-01
**Status:** ✅ Accepted

### Context

In v0.2.0, each LLM provider had its own adapter with inconsistent interfaces. Adding a provider required touching 5+ files. Error handling, retry logic, and streaming were duplicated across providers.

### Decision

A single `AIGateway` class acts as the unified entry point. Each provider implements a common `ProviderAdapter` interface. The gateway handles:
- Provider selection based on user config
- Request/response normalization
- Streaming (SSE) via a single abstraction
- Automatic failover to next configured provider
- Rate limit tracking per provider

### Consequences

```
┌──────────────────────────────┐
│        AIGateway v2.0        │
│  ┌────────────────────────┐  │
│  │   Route Request        │  │
│  │   ┌──────────────────┐ │  │
│  │   │ Provider Registry │ │  │
│  │   │ ┌──────┐┌──────┐ │ │  │
│  │   │ │Gemini││Claude│ │ │  │
│  │   │ └──────┘└──────┘ │ │  │
│  │   │ ┌──────┐┌──────┐ │ │  │
│  │   │ │OpenAI││Mistral│ │ │  │
│  │   │ └──────┘└──────┘ │ │  │
│  │   │      ... 11 more  │ │  │
│  │   └──────────────────┘ │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  Stream Abstraction    │  │
│  │  Retry / Failover      │  │
│  │  Rate Limit Tracker    │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

| Before (v0.2) | After (v2.0) |
|----------------|--------------|
| 15 separate adapters | 1 gateway + 15 adapters |
| Duplicate streaming code | Single stream abstraction |
| Manual provider selection | Automatic routing + failover |
| Inconsistent error types | Unified `AIError` hierarchy |

---

## ADR-004: Gemini Grounding for Web Search

**Date:** 2025-02-01
**Status:** ✅ Accepted

### Context

v0.2.0 used a simulated web search that generated fake results. Users need real, up-to-date information from the web. Building a custom search crawler is outside scope and violates Green Code principles.

### Decision

Use Google Gemini's built-in grounding with Google Search (`@google/genai` SDK v2.4+) as the primary web search mechanism. When a user's query requires real-time data, the system routes through Gemini with `SearchGrounding` enabled, returning sourced, real web results.

### Consequences

- **Real results** from Google Search with citations
- **Zero infrastructure** — no search API to maintain
- **Dependency on Gemini** — search requires a valid Gemini API key
- **Fallback:** If Gemini is unavailable, display a clear "search unavailable" message (no fake results)

```typescript
// AIGateway search integration
const searchResponse = await gateway.generate({
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  grounding: { search: true },  // Enables real web search
  prompt: userQuery,
});
// Returns: { text: string, sources: SearchResult[] }
```

---

## ADR-005: Task Schema Enrichment (4-Field Model)

**Date:** 2025-02-10
**Status:** ✅ Accepted

### Context

v0.2.0 tasks had only `title` and `description`. This was insufficient for the TaskScheduler, LearningEngine, and agent orchestration. Agents couldn't prioritize, schedule, or learn from tasks effectively.

### Decision

Tasks use a 4-field model:

| Field | Type | Description | مثال (Example) |
|-------|------|-------------|----------------|
| `title` | `string` | Short task name | "تحليل السوق المصري" |
| `description` | `string` | Detailed requirements | Full prompt/context |
| `priority` | `"critical" \| "high" \| "medium" \| "low"` | Scheduling priority | "high" |
| `scheduledFor` | `ISO 8601 \| null` | When to execute | "2025-03-01T09:00:00Z" |

### Consequences

- TaskScheduler can auto-sort and execute by priority/time
- LearningEngine can correlate task outcomes with priority levels
- Per-agent dashboard cards can display task load
- Backward-incompatible with v0.2.0 task format (Breaking Change)

---

## ADR-006: PWA Over Native Application

**Date:** 2025-01-20
**Status:** ✅ Accepted

### Context

Wazeer OS needs to work on desktop, mobile, and tablets. Building separate native apps (iOS/Android) would triple development effort and violate the single-developer constraint.

### Decision

Build as a Progressive Web App with:
- Service Worker for offline caching (Workbox)
- Web App Manifest for installability
- IndexedDB for persistent local storage
- `beforeinstallprompt` for native-like install UX

### Consequences

- **Single codebase** for all platforms
- **No app store review** process
- **Limited access** to native APIs (no Bluetooth, limited push on iOS)
- **Installable** on Android, ChromeOS, desktop Chrome/Edge
- **Lighthouse PWA score** is a quality gate (>90)

---

## ADR-007: Zustand over Redux

**Date:** 2025-01-15
**Status:** ✅ Accepted

### Context

State management in v0.2.0 used React Context with custom hooks, leading to prop drilling and unnecessary re-renders. Redux was considered but deemed too heavy for a client-side-first PWA.

### Decision

Use Zustand 5 as the primary state manager:
- Minimal boilerplate (~2KB gzip)
- Built-in `persist` middleware with IndexedDB backend via `idb-keyval`
- No providers, no actions/reducers boilerplate
- Selector-based subscriptions prevent unnecessary renders
- Middleware support for logging, devtools, and analytics

### Consequences

```typescript
// Zustand store with IndexedDB persistence
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { get, set } from 'idb-keyval';

export const useAppStore = create(
  persist(
    (set, get) => ({
      theme: 'egyptian-cyberpunk',
      language: 'ar',
      // ... state
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'wazeer-state',
      storage: {
        getItem: (key) => get(key),
        setItem: (key, val) => set(key, val),
        removeItem: (key) => del(key),
      },
    }
  )
);
```

| Criteria | Zustand 5 | Redux Toolkit |
|----------|-----------|---------------|
| Bundle size | ~2KB | ~11KB |
| Boilerplate | Minimal | Moderate |
| Persist middleware | Built-in (custom storage) | redux-persist (extra dep) |
| Devtools | Yes | Yes |
| Learning curve | Low | Moderate |

---

## ADR-008: HorusGuard AST Scanner

**Date:** 2025-02-05
**Status:** ✅ Accepted

### Context

Wazeer OS executes AI-generated code snippets and renders AI-produced HTML. This creates injection vectors: `eval()`, `innerHTML`, `fetch('http://...')`, `require('child_process')`, `document.cookie` access. Traditional regex sanitization is insufficient — AST-based analysis is required for structural detection.

### Decision

Implement **HorusGuard** — a client-side AST scanner using `@babel/parser`:

| Pattern | Severity | Detection |
|---------|----------|-----------|
| `eval()`, `Function()` | 🔴 Critical | AST: CallExpression with eval/Function callee |
| `innerHTML`, `outerHTML` | 🔴 Critical | AST: Assignment to innerHTML/outerHTML |
| `fetch('http://')` | 🟡 High | AST: CallExpression fetch with non-HTTPS arg |
| `require('child_process')` | 🔴 Critical | AST: CallExpression require with dangerous modules |
| `document.cookie` | 🟡 High | AST: MemberExpression on document.cookie |

### Consequences

- **Zero false-negatives** for known dangerous patterns (AST-level)
- **~5ms scan time** per average code block
- **Block-first, allow-list** approach — flagged code is never executed
- **Extensible:** New patterns added as AST visitor rules
- **Naming:** Horus (حورس) — the all-seeing eye of Egyptian mythology, 𓂀

---

## ADR-009: SHA-256 Client-Side Password Hashing

**Date:** 2025-02-05
**Status:** ✅ Accepted

### Context

Firebase Auth 12 handles authentication, but Wazeer OS needs a secondary local authentication layer for offline access and device trust. Storing plaintext passwords in IndexedDB violates Security as Mindset.

### Decision

All local authentication uses SHA-256 hashing via the Web Crypto API:

```typescript
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

- Passwords are **never stored** in plaintext in IndexedDB
- Salt is generated per-user via `crypto.getRandomValues()`
- The hash is stored in `auth_logs` store for verification
- Firebase remains the primary auth; SHA-256 is for local device trust

### Consequences

- **Offline auth** possible without Firebase
- **No server-side** password storage
- **SHA-256** is sufficient for local device trust (not for server-side password storage where bcrypt/argon2 would be required)
- **Web Crypto API** is available in all modern browsers and Service Workers

---

## ADR-010: Egyptian Cyberpunk Design System

**Date:** 2025-01-10
**Status:** ✅ Accepted

### Context

Wazeer OS needs a distinctive visual identity that reflects its Egyptian origins while projecting a futuristic, high-tech aesthetic. Generic blue/purple themes would not differentiate the product.

### Decision

Adopt an **Egyptian Cyberpunk** design language:

| Element | Value | Description |
|---------|-------|-------------|
| Primary BG | `#0a0a0f` | Deep space black |
| Accent Gold | `#d4af37` | Pharaoh gold |
| Accent Teal | `#00d4aa` | Nile teal |
| Accent Ruby | `#e74c3c` | Desert ruby |
| hieroglyph font | Noto Sans Egyptian Hieroglyphs | 𓂀 𓁹 𓃭 𓆣 |
| UI font | IBM Plex Sans Arabic + English | Bilingual support |
| Glow effects | `box-shadow` neon | Cyberpunk neon aesthetics |
| Motifs | Pyramid grids, Eye of Horus | SVG background patterns |

### Consequences

- **Strong brand identity** — instantly recognizable
- **Cultural pride** — celebrates Egyptian heritage in tech
- **Accessibility considerations** — high-contrast mode for gold-on-dark
- **Arabic RTL** is a first-class concern, not an afterthought
- **Framer Motion 12** animations for transitions (pyramid unfolds, glyph reveals)

---

## Decision Log Template

For future ADRs, use this template:

```markdown
## ADR-XXX: [Title]

**Date:** YYYY-MM-DD
**Status:** ✅ Accepted | ◀️ Deprecated | ❌ Rejected | 🔄 Superseded by ADR-YYY
**Deciders:** [Names]

### Context
[Why is this decision needed? What forces are at play?]

### Decision
[What was decided?]

### Consequences
[What are the positive and negative outcomes?]
```

---

> 𓂀 *Decisions are not permanent. They are the best choice given the context at the time. When context changes, revisit and record the evolution.* — Wazeer OS Engineering
