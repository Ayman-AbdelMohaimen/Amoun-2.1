# \u0000\u0000\u0000 Wazeer OS \u2014 Implementation Plan | خطة التنفيذ

> **Version:** 2.0.0-Rewrite \u00b7 **Status:** Pre-Rewrite \u00b7 **Classification:** Enterprise Edition
> **Last Updated:** 2025-07-13 \u00b7 **Author:** 100MillionDEV / العر\u0622\u0628

---

## Table of Contents

1. [Overview](#1-overview)
2. [Sprint 1: Foundation \u2014 \u0623\u0633\u0627\u0633](#2-sprint-1-foundation--\u0623\u0633\u0627\u0633)
3. [Sprint 2: Intelligence \u2014 \u0630\u0643\u0627\u0621](#3-sprint-2-intelligence--\u0630\u0643\u0627\u0621)
4. [Sprint 3: Polish \u2014 \u062a\u062c\u0645\u064a\u0644](#4-sprint-3-polish--\u062a\u062c\u0645\u064a\u0644)
5. [Sprint 4: Launch \u2014 \u0625\u0637\u0644\u0627\u0642](#5-sprint-4-launch--\u0625\u0637\u0644\u0627\u0642)
6. [Dependency Map](#6-dependency-map)
7. [Effort Summary](#7-effort-summary)
8. [Risk Register](#8-risk-register)

---

## 1. Overview

This implementation plan covers the full rewrite from v0.2.0 to v2.0.0-Rewrite of Wazeer OS (\u0648\u0632\u064a\u0631 OS). The plan is organized into **4 sprints**, each targeting a specific milestone with clear deliverables and acceptance criteria.

### Timeline

```
Sprint 1: Foundation    [====]  2 weeks   Jun 30 \u2013 Jul 13
Sprint 2: Intelligence  [====]  2 weeks   Jul 14 \u2013 Jul 27
Sprint 3: Polish        [====]  2 weeks   Jul 28 \u2013 Aug 10
Sprint 4: Launch        [====]  1.5 weeks Aug 11 \u2013 Aug 22
                                  Total: 7.5 weeks
```

### Team

| Role | Responsibility | Sprint Focus |
|------|---------------|--------------|
| **100MillionDEV** | Full-stack development, architecture | All sprints |
| **QA (self)** | Testing, code review | Sprint 3-4 |

### Velocity Assumptions

- Solo developer, ~40 hours/week available
- Each sprint includes 10% buffer for unknowns
- External dependencies (Firebase config) tracked as blockers

---

## 2. Sprint 1: Foundation \u2014 \u0623\u0633\u0627\u0633

> **Goal:** Fix critical issues, unify the AI system, remove dead code, implement real web search.
> **Duration:** 2 weeks (80 hours) · **Buffer:** 8 hours

### Task Breakdown

#### T1.1: Authentication Persistence Fix

| Field | Value |
|-------|-------|
| **Description** | Fix Firebase Auth session persistence across PWA relaunch. Currently, sessions are lost on reload because `silentReAuth()` doesn't restore the IndexedDB user record. |
| **Effort** | 8 hours |
| **Priority** | Critical (P0) |
| **Dependencies** | Firebase config (env vars) |
| **Deliverable** | Users stay logged in after closing and reopening the PWA |

**Acceptance Criteria:**
- [ ] User logs in via email/password \u2192 closes PWA \u2192 reopens \u2192 still logged in
- [ ] User logs in via Google OAuth \u2192 closes PWA \u2192 reopens \u2192 still logged in
- [ ] `silentReAuth()` restores full `WazirUser` object from IndexedDB
- [ ] Auth state reflected in Zustand store within 500ms of app load
- [ ] Failed re-auth redirects to login screen with toast notification
- [ ] Auth logs written to `auth_logs` store on every auth event

**Implementation Steps:**
1. Verify Firebase `persistence` is set to `browserLocalPersistence`
2. Wire `onAuthStateChanged` listener in app bootstrap
3. On auth state change, upsert `WazirUser` into IndexedDB `config` store under key `wazir_user`
4. In `silentReAuth()`, read from IndexedDB first, then confirm with Firebase
5. Update Zustand `useAuthStore` with restored user
6. Add comprehensive error handling for expired/revoked sessions

---

#### T1.2: Unified AIGateway

| Field | Value |
|-------|-------|
| **Description** | Replace the dual LLM system (old Gemini-only + new multi-provider) with a single unified `AIGateway` that routes to any of the 15 configured providers. |
| **Effort** | 16 hours |
| **Priority** | Critical (P0) |
| **Dependencies** | None |
| **Deliverable** | Single `AIGateway.processPrompt()` entry point for all AI interactions |

**Acceptance Criteria:**
- [ ] `AIGateway.processPrompt()` accepts `providerId` and `modelId` parameters
- [ ] Supports streaming responses via SSE for all providers
- [ ] Correctly maps auth headers per provider (see API spec)
- [ ] Routes through `/api/proxy/{providerId}/*` endpoint
- [ ] Handles provider-specific request/response format differences
- [ ] Old dual system code is completely removed
- [ ] Error responses are normalized to Wazeer error format

**Provider Adapter Pattern:**

```
AIGateway.processPrompt(params)
    \
     ├── GeminiAdapter    → x-goog-api-key, contents[] format
     ├── OpenAIAdapter    → Authorization: Bearer, messages[] format
     ├── ClaudeAdapter    → x-api-key + anthropic-version
     ├── OllamaAdapter    → No auth, localhost
     └── DefaultAdapter   → Authorization: Bearer (covers 10 providers)
```

---

#### T1.3: Dead Code Removal

| Field | Value |
|-------|-------|
| **Description** | Remove all unused components, services, and files from v0.2.0 that are no longer needed in v2.0. |
| **Effort** | 6 hours |
| **Priority** | High (P1) |
| **Dependencies** | T1.2 (AIGateway must be done first) |
| **Deliverable** | Clean codebase with zero dead code |

**Known Dead Code Targets:**

| File/Component | Reason for Removal |
|----------------|-------------------|
| Old `GeminiService` | Replaced by AIGateway |
| Old `LLMService` | Replaced by AIGateway |
| `BottomBar` component | Dead, not rendered |
| Mock search functions | Replaced by real Gemini Grounding |
| Stub `LearningEngine` | Replaced by real implementation (Sprint 2) |
| Stub `MemoryEngine` | Replaced by real implementation (Sprint 2) |
| Decorative dashboard metrics | Replaced by real metrics (Sprint 2) |
| Unused CSS modules | Consolidated into Tailwind 4 |
| Old model config files | Replaced by 4-field form |

---

#### T1.4: Real Web Search (Gemini Grounding)

| Field | Value |
|-------|-------|
| **Description** | Replace mock search with real web search using Gemini's Grounding with Google Search capability. |
| **Effort** | 10 hours |
| **Priority** | High (P1) |
| **Dependencies** | T1.2 (AIGateway) |
| **Deliverable** | Amoun can search the web in real-time when using Gemini models |

**Acceptance Criteria:**
- [ ] When `enableSearch: true`, Gemini requests include `tools: [{ google_search: {} }]`
- [ ] Search grounding metadata (citations, links) parsed from response
- [ ] Citations rendered as clickable footnotes in chat UI
- [ ] Search toggle visible in chat input area
- [ ] Non-Gemini providers gracefully disable search toggle with tooltip
- [ ] Search results stored in `artifacts` store with type `search_result`

**Gemini Grounding Request:**

```json
{
  "contents": [{"parts": [{"text": "What is the latest news about AI?"}]}],
  "tools": [{"google_search": {}}],
  "generationConfig": {
    "groundingConfig": {
      "groundingMode": "GROUNDING_MODE_ENHANCED"
    }
  }
}
```

---

#### T1.5: Proxy Server Hardening

| Field | Value |
|-------|-------|
| **Description** | Review and harden the Express proxy server: ensure all 15 providers are correctly mounted, error rewriting works, rate limits are enforced. |
| **Effort** | 8 hours |
| **Priority** | Medium (P1) |
| **Dependencies** | None |
| **Deliverable** | Production-ready proxy server |

**Acceptance Criteria:**
- [ ] All 15 providers respond correctly to health checks
- [ ] Error codes 401/403/429 are rewritten to Wazeer format
- [ ] Rate limit headers (`X-RateLimit-*`) present in all responses
- [ ] NVIDIA has separate 200 req/min limit
- [ ] 5MB body limit enforced with proper 413 error
- [ ] 120s upstream timeout with graceful 502 response
- [ ] Brotli compression working for JSON responses
- [ ] Graceful shutdown: stop accepting, finish in-flight, then exit

---

### Sprint 1 Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 5 |
| **Total Effort** | 48 hours |
| **Buffer** | 8 hours |
| **Sprint Capacity** | 80 hours |
| **Utilization** | 60% |
| **Critical Path** | T1.2 (AIGateway) blocks T1.3 and T1.4 |

---

## 3. Sprint 2: Intelligence \u2014 \u0630\u0643\u0627\u0621

> **Goal:** Implement the core intelligence engines that make Amoun proactive and memory-aware.
> **Duration:** 2 weeks (80 hours) · **Buffer:** 8 hours

### Task Breakdown

#### T2.1: LearningEngine \u2014 Task Extraction

| Field | Value |
|-------|-------|
| **Description** | Implement AI-powered task extraction from conversation responses. When Amoun suggests or discusses tasks, they are automatically captured. |
| **Effort** | 12 hours |
| **Priority** | High (P1) |
| **Dependencies** | T1.2 (AIGateway) |
| **Deliverable** | Tasks automatically extracted from AI responses |

**Acceptance Criteria:**
- [ ] `extractTasks(text, sessionId)` returns structured `Task[]` array
- [ ] Tasks have: title, source, priority, status, tags, dueDate
- [ ] Extracted tasks stored in IndexedDB `state` store
- [ ] UI notification when new tasks are extracted
- [ ] User can confirm/dismiss extracted tasks
- [ ] Duplicate task detection (same title within 24h)
- [ ] Maximum 5 tasks extracted per response to prevent spam

**Extraction Prompt Strategy:**

```typescript
const TASK_EXTRACTION_PROMPT = `
Analyze the following AI response and extract actionable tasks.
Return JSON array of tasks with: title, priority (low/medium/high/critical),
dueDate (ISO 8601 or null), tags (array of strings).

If no tasks are mentioned, return [].
Only extract tasks that a human would need to act on.

Response text:
${text}
`;
```

---

#### T2.2: LearningEngine \u2014 Memory Extraction

| Field | Value |
|-------|-------|
| **Description** | Implement AI-powered memory extraction. Amoun learns user preferences, facts, and instructions from conversations. |
| **Effort** | 12 hours |
| **Priority** | High (P1) |
| **Dependencies** | T1.2 (AIGateway) |
| **Deliverable** | Memories automatically extracted and stored |

**Acceptance Criteria:**
- [ ] `extractMemories(text, sessionId)` returns structured `Memory[]` array
- [ ] Memories categorized: preference, fact, instruction, context
- [ ] Memories stored in IndexedDB `userMemory` store (NEW in v4)
- [ ] Confidence score (0.0-1.0) assigned to each memory
- [ ] User can view, edit, and delete memories in settings
- [ ] Low-confidence memories (< 0.5) flagged for user review
- [ ] Maximum 3 memories extracted per response

---

#### T2.3: MemoryEngine \u2014 Contextual Retrieval

| Field | Value |
|-------|-------|
| **Description** | Implement the memory retrieval and injection system. Relevant memories are pulled from IndexedDB and injected into the system prompt. |
| **Effort** | 10 hours |
| **Priority** | High (P1) |
| **Dependencies** | T2.2 (Memory store must exist) |
| **Deliverable** | Amoun remembers user context across conversations |

**Acceptance Criteria:**
- [ ] `getRelevantMemories(prompt, limit)` performs keyword/semantic matching
- [ ] Returns top N memories sorted by relevance
- [ ] `injectMemories(systemPrompt, memories)` appends memory context
- [ ] Memory injection does not exceed 20% of system prompt length
- [ ] No duplicate memories injected
- [ ] Memory injection is transparent (user can see what was injected)

**Memory Injection Format:**

```
--- User Memories (auto-injected) ---
1. [preference] User prefers Arabic responses when writing in Arabic
2. [fact] User is a full-stack developer
3. [instruction] Always format code with proper syntax highlighting
--- End Memories ---
```

---

#### T2.4: TaskScheduler \u2014 Automated Execution

| Field | Value |
|-------|-------|
| **Description** | Implement the background task scheduler that checks for due tasks every 5 minutes and can trigger AI actions. |
| **Effort** | 8 hours |
| **Priority** | Medium (P2) |
| **Dependencies** | T2.1 (Tasks must exist) |
| **Deliverable** | Background scheduler with task execution |

**Acceptance Criteria:**
- [ ] `checkAndExecute()` runs every 5 minutes via `setInterval`
- [ ] Checks all pending tasks with `dueDate <= now`
- [ ] Skips tasks without `dueDate` or with future dates
- [ ] Logs execution results to `logs` store
- [ ] Scheduler pauses when app is in background (Page Visibility API)
- [ ] Scheduler resumes when app returns to foreground
- [ ] Manual "Check Now" button in task panel

---

#### T2.5: Dashboard Metrics (Real Data)

| Field | Value |
|-------|-------|
| **Description** | Replace decorative/placeholder dashboard metrics with real data from IndexedDB. |
| **Effort** | 10 hours |
| **Priority** | Medium (P2) |
| **Dependencies** | T2.1, T2.2 (data sources) |
| **Deliverable** | Dashboard shows live statistics |

**Metrics to Implement:**

| Metric | Source | Calculation |
|--------|--------|-------------|
| Total Chats | `artifacts` store | Count where `type === 'chat'` |
| Messages Today | `artifacts` store | Count where `createdAt >= today` |
| Tasks Completed | `state` store | Count where `status === 'completed'` |
| Tasks Pending | `state` store | Count where `status === 'pending'` |
| Memories Stored | `userMemory` store | Total count |
| Tokens Used | `logs` store | Sum of `usage.totalTokens` |
| Active Streak | `logs` store | Consecutive days with activity |
| Favorite Model | `state` store | Most-used model in last 30 days |

---

#### T2.6: IndexedDB v4 Migration

| Field | Value |
|-------|-------|
| **Description** | Upgrade IndexedDB from v3 to v4, adding the new `userMemory` store and required indexes. |
| **Effort** | 6 hours |
| **Priority** | High (P1) |
| **Dependencies** | None |
| **Deliverable** | IndexedDB v4 schema with migration from v3 |

**Acceptance Criteria:**
- [ ] `userMemory` store created with autoIncrement key
- [ ] Indexes: `category`, `createdAt`, `sourceSession`
- [ ] Existing data preserved during upgrade
- [ ] Version number set to 4
- [ ] Migration tested with v3 data present

### Sprint 2 Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 6 |
| **Total Effort** | 58 hours |
| **Buffer** | 8 hours |
| **Sprint Capacity** | 80 hours |
| **Utilization** | 73% |
| **Critical Path** | T2.2 \u2192 T2.3 (memories must be extracted before retrieval) |

---

## 4. Sprint 3: Polish \u2014 \u062a\u062c\u0645\u064a\u0644

> **Goal:** UI refinements, performance optimization, and PWA polish for production quality.
> **Duration:** 2 weeks (80 hours) · **Buffer:** 8 hours

### Task Breakdown

#### T3.1: 4-Field Model Configuration Form

| Field | Value |
|-------|-------|
| **Description** | Replace the complex model configuration UI with a simple 4-field form: Provider, Model, API Key, Display Name. |
| **Effort** | 8 hours |
| **Priority** | High (P1) |
| **Dependencies** | T1.2 (AIGateway) |
| **Deliverable** | Simple, intuitive model setup |

**Form Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Provider | Select dropdown | Yes | Must be from 15 mounted providers |
| Model | Text input with autocomplete | Yes | Non-empty, max 100 chars |
| API Key | Password input | Yes | Min 10 chars, masked |
| Display Name | Text input | No | Max 50 chars, defaults to model name |

**Acceptance Criteria:**
- [ ] Form validates all fields before submission
- [ ] API key stored in IndexedDB (never sent to our server)
- [ ] Provider dropdown populated from `/api/proxy` endpoint
- [ ] Model field shows autocomplete from known models per provider
- [ ] Test connection button verifies key validity
- [ ] Existing model configs migrated to new format

---

#### T3.2: Per-Agent Cards

| Field | Value |
|-------|-------|
| **Description** | Create dedicated UI cards/panels for different AI agents (Amoun primary, future agents). |
| **Effort** | 12 hours |
| **Priority** | Medium (P2) |
| **Dependencies** | T1.2 (AIGateway) |
| **Deliverable** | Agent selection and switching UI |

**Acceptance Criteria:**
- [ ] Agent card shows: name, avatar, description, capabilities
- [ ] User can switch between agents in chat
- [ ] Each agent has its own system prompt and personality
- [ ] Agent state persisted in IndexedDB
- [ ] Smooth transition animation (Framer Motion)
- [ ] Amoun (\u0623\u0645\u0648\u0646) is the default and primary agent

---

#### T3.3: PWA Optimization

| Field | Value |
|-------|-------|
| **Description** | Optimize the PWA for production: service worker caching, offline support, install prompt, performance. |
| **Effort** | 14 hours |
| **Priority** | High (P1) |
| **Dependencies** | All features complete |
| **Deliverable** | Production-ready PWA |

**Acceptance Criteria:**
- [ ] Service worker caches app shell (HTML, CSS, JS bundles)
- [ ] Offline fallback page shows when network unavailable
- [ ] Install prompt ("Add to Home Screen") triggers correctly
- [ ] App manifest includes all required fields
- [ ] Icons: 192x192 and 512x512 with 𓂀 Eye of Horus
- [ ] Push notification permission (for future task reminders)
- [ ] Background sync for pending operations (when supported)

---

#### T3.4: Performance Audit

| Field | Value |
|-------|-------|
| **Description** | Conduct a full performance audit and optimization pass. Target Lighthouse score >90. |
| **Effort** | 10 hours |
| **Priority** | High (P1) |
| **Dependencies** | T3.3 (PWA optimization) |
| **Deliverable** | Lighthouse report with >90 all categories |

**Optimization Targets:**

| Metric | Target | Current Est. |
|--------|--------|-------------|
| Performance | > 90 | ~65 |
| Accessibility | > 90 | ~75 |
| Best Practices | > 90 | ~80 |
| SEO | > 90 | ~85 |
| PWA | 100 | ~60 |

**Key Optimizations:**
- Code splitting with React.lazy() for routes
- Image optimization (WebP, lazy loading)
- Bundle analysis and tree shaking
- Font preloading and display:swap
- Reduce unused CSS (Tailwind purge)
- Defer non-critical scripts

---

#### T3.5: Name Consistency Fix

| Field | Value |
|-------|-------|
| **Description** | Audit and fix all instances where the app name is inconsistent ("Wazeer", "وزير", "Wazir", "Monmamar"). |
| **Effort** | 4 hours |
| **Priority** | Low (P3) |
| **Dependencies** | None |
| **Deliverable** | Consistent naming throughout |

**Naming Convention:**

| Context | Name |
|---------|------|
| Product (English) | Wazeer OS |
| Product (Arabic) | وزير OS |
| AI Agent | Amoun (أمون) |
| Database | Monmamar (منمار) |
| Developer | 100MillionDEV / العرآب |
| Code/Internal | `wazeer` (kebab-case), `WazeerOS` (PascalCase) |

---

### Sprint 3 Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 5 |
| **Total Effort** | 48 hours |
| **Buffer** | 8 hours |
| **Sprint Capacity** | 80 hours |
| **Utilization** | 60% |
| **Critical Path** | T3.3 \u2192 T3.4 (PWA must be optimized before audit) |

---

## 5. Sprint 4: Launch \u2014 \u0625\u0637\u0644\u0627\u0642

> **Goal:** Quality assurance, security audit, Product Hunt preparation, and production launch.
> **Duration:** 1.5 weeks (60 hours) · **Buffer:** 6 hours

### Task Breakdown

#### T4.1: Security Audit

| Field | Value |
|-------|-------|
| **Description** | Complete security review: HorusGuard testing, prompt sanitizer validation, CSP verification, BYOK flow audit. |
| **Effort** | 10 hours |
| **Priority** | Critical (P0) |
| **Dependencies** | All features complete |
| **Deliverable** | Security audit report with all findings resolved |

**Audit Checklist:**
- [ ] HorusGuard blocks `eval()`, `Function()`, `import()` in scanned code
- [ ] Prompt sanitizer redacts API keys, Bearer tokens, passwords
- [ ] CSP headers block all unauthorized script sources
- [ ] BYOK keys are never logged, stored on server, or sent in URL
- [ ] Firebase Auth config is minimal (no unnecessary scopes)
- [ ] IndexedDB data is accessible only to same-origin
- [ ] No console.log() with sensitive data in production
- [ ] Rate limiting prevents abuse scenarios

---

#### T4.2: QA Testing

| Field | Value |
|-------|-------|
| **Description** | Full QA pass: unit tests, component tests, integration tests, E2E smoke tests. |
| **Effort** | 12 hours |
| **Priority** | Critical (P0) |
| **Dependencies** | All features complete |
| **Deliverable** | >80% unit, >70% component test coverage |

**Test Categories:**

| Category | Target | Tool |
|----------|--------|------|
| Unit Tests | >80% | Vitest |
| Component Tests | >70% | React Testing Library |
| Integration Tests | Key flows | Vitest + MSW |
| E2E Smoke Tests | 5 critical paths | Playwright |
| Security Tests | HorusGuard patterns | Vitest |
| Lighthouse CI | >90 all | Lighthouse |

---

#### T4.3: Product Hunt Preparation

| Field | Value |
|-------|-------|
| **Description** | Prepare all Product Hunt launch materials. |
| **Effort** | 8 hours |
| **Priority** | High (P1) |
| **Dependencies** | T4.1, T4.2 |
| **Deliverable** | Launch-ready PH listing |

**Deliverables:**
- [ ] Tagline (60 chars max): "Your private AI assistant. Your keys. Your data."
- [ ] Description with feature highlights
- [ ] Gallery: 5+ screenshots and 1 demo video
- [ ] First comment (maker's story in Arabic + English)
- [ ] Upcoming page created 7 days before launch
- [ ] Launch day social media assets

---

#### T4.4: Production Deployment

| Field | Value |
|-------|-------|
| **Description** | Deploy v2.0.0-Rewrite to production with Cloudflare CDN. |
| **Effort** | 6 hours |
| **Priority** | Critical (P0) |
| **Dependencies** | T4.1, T4.2 |
| **Deliverable** | Live production deployment |

**Deployment Steps:**
1. Build: `npm run build` \u2192 `dist/`
2. Upload to Hostinger
3. Configure Cloudflare DNS, SSL, caching
4. Verify all 15 proxy providers work in production
5. Test PWA install from production URL
6. Set up PM2 with graceful restart
7. Configure Cloudflare rate limiting and DDoS protection
8. Final health check and monitoring setup

---

#### T4.5: Launch + Monitoring

| Field | Value |
|-------|-------|
| **Description** | Launch day operations and first-week monitoring. |
| **Effort** | 8 hours |
| **Priority** | High (P1) |
| **Dependencies** | T4.4 |
| **Deliverable** | Successful launch with monitoring in place |

**Launch Day Checklist:**
- [ ] Final pre-launch checklist signed off
- [ ] Deploy at target time
- [ ] Post Product Hunt listing
- [ ] Monitor error rates for first 4 hours
- [ ] Respond to user feedback within 1 hour
- [ ] Track Product Hunt ranking
- [ ] Fix any critical bugs discovered

---

### Sprint 4 Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 5 |
| **Total Effort** | 44 hours |
| **Buffer** | 6 hours |
| **Sprint Capacity** | 60 hours |
| **Utilization** | 73% |
| **Critical Path** | T4.1 \u2192 T4.3, T4.4 (security must pass before launch) |

---

## 6. Dependency Map

```
Sprint 1                    Sprint 2                    Sprint 3                    Sprint 4
\u250c\u2500\u2500\u2500\u2500\u2510                 \u250c\u2500\u2500\u2500\u2500\u2510                 \u250c\u2500\u2500\u2500\u2500\u2510                 \u250c\u2500\u2500\u2500\u2500\u2510
T1.1 Auth Fix             T2.1 Task Extraction         T3.1 Model Form             T4.1 Security Audit
T1.2 AIGateway \u25bc\u2514\u2510\u2510\u2510\u2502              T3.2 Agent Cards             T4.2 QA Testing
T1.3 Dead Code   \u2514\u2510   \u2502   \u2502              T3.3 PWA Optimization  \u2514\u2510\u2510\u2510\u2510\u2502   T4.3 PH Prep
T1.4 Real Search \u2510\u2502   \u2502   \u2502              T3.4 Perf Audit   \u2510\u2502   \u2502   T4.4 Deploy
T1.5 Proxy       \u2502   \u2502   \u2502              T3.5 Name Fix     \u2502   \u2502   T4.5 Launch
                \u2502   \u2502   \u2502                            \u2502   \u2502
                \u2502   \u2514\u2500\u2500\u2510\u2502                            \u2502   \u2502
                \u2502      \u2502\u2502                            \u2502   \u2502
T1.2 blocks \u2500\u2500\u2518      \u251C\u2500\u2500 T2.3 MemoryEngine         \u251C\u2500\u2500 T3.4 Perf Audit  \u251C\u2500\u2500 T4.4 Deploy
T1.2 blocks \u2500\u2500\u2510      \u2502                              \u2502                     \u2502
             \u2502      \u2514\u2500\u2500 T2.4 TaskScheduler            \u251C\u2500\u2500 T4.3 PH Prep
             \u2502      \u2502                              \u2502                     \u2502
             \u2502      \u2514\u2500\u2500 T2.5 Dashboard Metrics        \u251C\u2500\u2500 T4.5 Launch
             \u2502                                     \u2502                     \u2502
             \u2502   T2.2 Memory Extract \u2514\u2500\u2500 T2.3 MemoryEngine  \u2502                     \u2502
             \u2502                                     \u2502                     \u2502
             \u2514\u2500\u2500 T1.3 Dead Code (needs T1.2)      \u2514\u2500\u2500 T4.1 Security Audit blocks all
             \u2514\u2500\u2500 T1.4 Real Search (needs T1.2)      \u2514\u2500\u2500 T4.2 QA blocks all
```

### Critical Path Summary

```
T1.2 (AIGateway) → T2.2 (Memory Extraction) → T2.3 (Memory Retrieval)
                                                      \
T4.1 (Security) → T4.3 (PH Prep) → T4.5 (Launch)
T4.1 (Security) → T4.2 (QA) → T4.4 (Deploy) → T4.5 (Launch)
```

---

## 7. Effort Summary

### By Sprint

| Sprint | Tasks | Hours | Buffer | Total | % of Project |
|--------|-------|-------|--------|-------|-------------|
| Sprint 1: Foundation | 5 | 48 | 8 | 56 | 26% |
| Sprint 2: Intelligence | 6 | 58 | 8 | 66 | 30% |
| Sprint 3: Polish | 5 | 48 | 8 | 56 | 26% |
| Sprint 4: Launch | 5 | 44 | 6 | 50 | 18% |
| **Total** | **21** | **198** | **30** | **228** | **100%** |

### By Category

| Category | Hours | % |
|----------|-------|---|
| Core AI / Intelligence | 72 | 32% |
| UI / UX / PWA | 48 | 21% |
| Security | 18 | 8% |
| Testing / QA | 12 | 5% |
| Infrastructure / DevOps | 18 | 8% |
| Cleanup / Polish | 22 | 10% |
| Launch / Marketing | 8 | 4% |
| Buffer / Risk | 30 | 13% |

---

## 8. Risk Register

| # | Risk | Probability | Impact | Sprint | Mitigation |
|---|------|------------|--------|--------|------------|
| R1 | Firebase config not available | Medium | High | S1 | Use mock auth fallback; escalate to developer |
| R2 | Provider API format changes | Low | Medium | S1-S2 | Adapter pattern isolates provider differences |
| R3 | Gemini Grounding API changes | Medium | Medium | S1 | Abstract search behind interface; mock fallback |
| R4 | IndexedDB migration data loss | Low | Critical | S2 | Backup before migration; test with real v3 data |
| R5 | PWA install fails on iOS | Medium | Low | S3 | Known iOS limitation; graceful degradation |
| R6 | Lighthouse score <90 | Medium | Medium | S3 | Reserve extra optimization time in buffer |
| R7 | Security vulnerability discovered | Low | Critical | S4 | Dedicated security sprint; responsible disclosure plan |
| R8 | Hostinger shared hosting limits | Medium | High | S4 | Cloudflare CDN offloads; plan VPS migration |
| R9 | Product Hunt launch timing conflict | Low | Low | S4 | Flexible launch date; monitor PH calendar |
| R10 | Scope creep during sprints | High | Medium | All | Strict sprint boundaries; defer to roadmap |

### Sprint-Specific Risk Mitigations

**Sprint 1 Risks:**
- R1 (Firebase): Create `.env.example` with placeholder values; test with Firebase emulator
- R2 (Provider formats): Build adapters one at a time, test each independently
- R3 (Grounding): Have mock search response ready as fallback

**Sprint 2 Risks:**
- R4 (Migration): Write migration test with seeded v3 data before implementing
- LLM extraction quality: Start with rule-based extraction, add AI extraction as enhancement

**Sprint 3 Risks:**
- R5 (iOS PWA): Document limitations; focus on Android/Desktop first
- R6 (Lighthouse): Weekly Lighthouse runs to catch regressions early

**Sprint 4 Risks:**
- R7 (Security): Allocate full day for security review before any launch activity
- R8 (Hosting): Have VPS migration plan ready if shared hosting is insufficient

---

*\u0000\u0000\u0000 Wazeer OS v2.0.0-Rewrite \u2014 Implementation Plan \u2014 100MillionDEV / العر\u0622\u0628*