# 10 — Changelog / سجل التغييرات
> Wazeer OS / وزير OS — All notable changes documented here
> Format: [Conventional Commits](https://www.conventionalcommits.org/)
> 𓂀 Amoun / أمون — 100MillionDEV / العرآب

---
## [Unreleased] — v2.0.0-Rewrite
> **Codename:** «البعث» (The Resurrection)
> **Status:** In Development — Pre-Rewrite
> **Target:** Complete architectural rewrite from v0.2.0

### Added (جديد)
- **AIGateway v2.0** — Unified gateway with `ProviderAdapter` interface for all 15 LLM providers
- **Gemini Grounding Search** — Real web search via `@google/genai` v2.4 with `SearchGrounding` enabled
- **LearningEngine** — Analyzes task outcomes and conversation patterns to improve agent behavior over time
- **MemoryEngine** — Persistent user memory system using new `userMemory` IndexedDB store
- **TaskScheduler** — Priority-based task execution engine with `scheduledFor` ISO 8601 timestamps
- **4-Field Task Model** — Tasks now include `title`, `description`, `priority`, `scheduledFor`
- **Per-Agent Dashboard Cards** — Individual agent status, load, and performance metrics on the main dashboard
- **HorusGuard AST Scanner** — Babel-based AST analysis for `eval`, `innerHTML`, `fetch http://`, `require child_process`, `document.cookie`
- **Prompt Sanitizer** — Automatic redaction of API keys, Bearer tokens, passwords, and environment variables from prompts and logs
- **Excommunicado Protocol** — IP-based banning system with `banned_nodes` IndexedDB store
- **IndexedDB Monmamar v4** — New `userMemory` store added (total: 7 stores)
- **Security Headers** — Full CSP, COEP, COOP, CORP, HSTS via Helmet middleware
- **Brotli + Gzip Compression** — Dual compression on Express proxy
- **Graceful Shutdown** — Server handles SIGTERM/SIGINT with connection draining
- **Zustand 5 State Management** — Replaced React Context with Zustand + IndexedDB persistence
- **Framer Motion 12** — Animation system for Egyptian Cyberpunk transitions
- **SHA-256 Client Password Hashing** — Web Crypto API for local device trust auth
- **Feature Flags System** — Runtime toggles for new/experimental features

### Changed (تم التعديل)
- **Architecture** — Complete rewrite from mixed client/server to client-side-first with proxy-only server
- **State Management** — Migrated from React Context hooks to Zustand 5 with `persist` middleware
- **Database** — IndexedDB Monmamar upgraded from v3 (6 stores) to v4 (7 stores)
- **LLM Integration** — All 15 providers now implement `ProviderAdapter` interface via AIGateway
- **Search** — Replaced simulated search with real Gemini grounding (Breaking: requires Gemini key)
- **Authentication** — Fixed Firebase Auth 12 integration; added local device trust layer
- **Build System** — Upgraded to Vite 6 with React 19 and Tailwind CSS 4
- **UI Framework** — Migrated to Framer Motion 12 from legacy CSS transitions
- **PWA** — Updated Service Worker with Workbox 7 for improved offline caching
- **Design System** — Full Egyptian Cyberpunk theme with Arabic RTL first-class support

### Fixed (تم الإصلاح)
- **Firebase Auth** — Resolved token refresh race condition causing intermittent 401 errors
- **IndexedDB Transactions** — Fixed transaction abort on concurrent writes to same store
- **CORS** — Resolved preflight failures on cross-origin LLM API calls via Express proxy
- **Memory Leaks** — Fixed Zustand subscriber cleanup on component unmount
- **Service Worker** — Fixed cache staleness issue where old assets served after update
- **RTL Layout** — Fixed Arabic text overflow in sidebar and dashboard cards
- **Streaming** — Fixed SSE parser dropping chunks on slow network connections

### Removed (تم الحذف)
- **Redux** — Removed entirely in favor of Zustand 5
- **Simulated Search** — Removed fake web search; replaced with Gemini grounding or no results
- **Server-Side State** — Removed all server-side session/state management
- **Custom Regex Sanitizer** — Replaced by HorusGuard AST scanner
- **Context Providers** — Removed React Context wrappers for global state
- **v0.x Task Format** — Old 2-field tasks incompatible with v2.0 4-field model

### Security (الأمان)
- **HorusGuard** — New AST-based code scanner prevents execution of dangerous patterns
- **Prompt Sanitizer** — Redacts sensitive data before logging, display, or storage
- **COEP/COOP/CORP** — Cross-origin isolation headers prevent Spectre-class attacks
- **CSP** — Strict Content-Security-Policy blocks inline scripts and unauthorized origins
- **Rate Limiting** — 100 requests/minute/IP enforced at Express proxy level
- **Body Size Limit** — 5MB max request body to prevent payload abuse
- **Timeout** — 120s server timeout prevents resource exhaustion

### Breaking Changes (تغييرات جذرية)
| Area | v0.2.0 | v2.0.0 | Migration |
|------|--------|--------|-----------|
| State | React Context | Zustand 5 | Full rewrite required |
| Tasks | `{title, description}` | `{title, description, priority, scheduledFor}` | Data migration script in v4 upgrade |
| DB Version | Monmamar v3 (6 stores) | Monmamar v4 (7 stores) | Auto-migration on open |
| Search | Simulated | Gemini Grounding | Requires Gemini API key |
| Auth | Firebase only | Firebase + local trust | Re-auth required |

---
## [v0.2.0] — 2025-01-15
> **Codename:** «التحديث» (The Update)

### Added
- Multi-provider LLM support (Gemini, OpenAI, Claude, Mistral, Groq, Cohere, Perplexity, DeepSeek, Ollama, Together, OpenRouter, Anthropic, HuggingFace, Replicate, fireworks.ai)
- Basic chat interface with conversation history
- IndexedDB Monmamar v3 with 6 stores (config, state, logs, artifacts, auth_logs, banned_nodes)
- Firebase Authentication (email/password, Google sign-in)
- PWA support with Service Worker and Web App Manifest
- Express proxy server with Helmet security headers
- Simulated web search functionality
- Artifact generation and storage
- Basic agent system (create, configure, chat)
- Arabic/English bilingual UI
- Tailwind CSS styling with dark theme
- Rate limiting (100 req/min/IP)

### Changed
- Upgraded from Vite 5 to Vite 6
- Updated React 18 to React 19 (RC)
- Migrated Tailwind CSS 3 to Tailwind CSS 4
- Improved mobile responsive layout
- Updated Firebase SDK to v12

### Fixed
- Fixed IndexedDB transaction timeout on large writes
- Resolved Firebase auth persistence issue across tabs
- Fixed chat message ordering on rapid sends
- Corrected RTL layout inconsistencies in Arabic mode
- Fixed Service Worker not caching dynamic routes

### Security
- Added Helmet middleware for security headers
- Implemented basic input sanitization on chat input
- Added CORS configuration for Express proxy
- Rate limiting per IP address

---
## [v0.1.0] — 2024-12-01
> **Codename:** «الميلاد» (The Birth)

### Added
- Initial Wazeer OS / وزير OS release
- Single-provider LLM chat (Gemini only)
- Basic React SPA with Vite
- Firebase Auth (email/password only)
- IndexedDB v1 with basic config and logs stores
- Dark theme UI
- English language only
- Express proxy server (basic)

### Known Limitations
- Single LLM provider
- No offline support
- No Arabic support
- No agent system
- No task management
- No search functionality
- Limited security hardening

---
## Version Scheme / مخطط الإصدارات
Wazeer OS follows [Semantic Versioning 2.0.0](https://semver.org/):
```
MAJOR.MINOR.PATCH[-PRERELEASE]

v2.0.0-Rewrite  ← Major rewrite, prerelease tag
v0.2.0          ← Minor feature release (current stable)
v0.1.0          ← Initial release
```

| Bump | Criteria | مثال |
|------|----------|-------|
| MAJOR | Breaking changes, architectural rewrite | New IndexedDB schema, state manager swap |
| MINOR | New features, backward-compatible | New LLM provider, new engine |
| PATCH | Bug fixes, security patches | Auth fix, HorusGuard pattern update |

---
## Commit Message Convention
All commits to Wazeer OS follow [Conventional Commits](https://www.conventionalcommits.org/):
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

| Type | Purpose | Example |
|------|---------|---------|
| `feat` | New feature | `feat(aigateway): add Gemini grounding search` |
| `fix` | Bug fix | `fix(auth): resolve Firebase token refresh race` |
| `sec` | Security | `sec(horusguard): add document.cookie pattern` |
| `refactor` | Code change (no feature/fix) | `refactor(state): migrate Context to Zustand` |
| `perf` | Performance | `perf(db): batch IndexedDB writes` |
| `docs` | Documentation | `docs(api): update AIGateway v2 spec` |
| `chore` | Maintenance | `chore(deps): bump Vite to 6.0` |
| `break` | Breaking change | `break(tasks): migrate to 4-field model` |

---
> 𓂀 *Every change is recorded. Every decision is traceable. This is the way of Amoun.* — Wazeer OS

## [v2.0.0] — 2026-08-05

> **Codename:** «الإنتاج» (Production)

### Added
- Production readiness insights document (`PRODUCTION_READINESS_INSIGHTS.md`).
- Updated deployment guide (`DEPLOYMENT_GUIDEv2.md`) with backup/rollback, scaling path, and Cloudflare rate‑limiting.
