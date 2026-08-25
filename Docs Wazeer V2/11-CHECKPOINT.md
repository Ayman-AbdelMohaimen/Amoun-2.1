# 11 — Pre-Rewrite Checkpoint / نقطة التفتيش قبل إعادة الكتابة

> Wazeer OS / وزير OS — v0.2.0 → v2.0.0-Rewrite
> 𓂀 Amoun / أمون — 100MillionDEV / العرآب
> Date: 2025-02-15
> Status: 🔴 Pre-Rewrite Assessment Complete

---

## Executive Summary / ملخص تنفيذي

This document captures the exact state of Wazeer OS v0.2.0 before the v2.0.0-Rewrite begins. It serves as:
1. **Baseline** — what exists and is confirmed working
2. **Defect inventory** — what is broken and must be fixed
3. **Scope definition** — what is NEW for v2.0 and must be built from scratch
4. **Action plan** — ordered steps to execute the rewrite

---

## 1. What EXISTS and is WORKING ✅

### Core Infrastructure

| Component | Status | Version | Notes |
|-----------|--------|---------|-------|
| React SPA | ✅ Working | 19 | Renders, routes, components load |
| Vite Build | ✅ Working | 6 | Builds successfully, HMR works |
| Tailwind CSS | ✅ Working | 4 | Styles compile, RTL support functional |
| Express Proxy | ✅ Working | 4 | Proxies LLM requests, returns responses |
| Firebase Auth | ⚠️ Partial | 12 | Login works, token refresh has race condition |
| IndexedDB v3 | ✅ Working | Monmamar v3 | 6 stores operational |
| PWA Manifest | ✅ Working | — | Installable on Chrome/Edge |
| Service Worker | ⚠️ Partial | Workbox | Caches static assets, misses dynamic routes |

### LLM Providers (Confirmed Working)

| Provider | Status | Models Tested |
|----------|--------|---------------|
| Google Gemini | ✅ Working | gemini-2.0-flash, gemini-1.5-pro |
| OpenAI | ✅ Working | gpt-4o, gpt-4o-mini |
| Anthropic Claude | ✅ Working | claude-3.5-sonnet, claude-3-haiku |
| Mistral | ✅ Working | mistral-large, mistral-medium |
| Groq | ✅ Working | llama-3.1-70b, mixtral-8x7b |
| Ollama (local) | ✅ Working | llama3.1, codellama |

### UI Components (Working)

```
✅ Login/Registration screen
✅ Main dashboard layout (sidebar + content area)
✅ Chat interface (send/receive messages)
✅ Agent creation form (basic)
✅ Settings panel (theme, language)
✅ Mobile responsive sidebar toggle
✅ Dark theme (Egyptian Cyberpunk base)
✅ Arabic RTL layout
```

### Data Stores (Monmamar v3)

```
✅ config    — App configuration, LLM keys, preferences
✅ state     — Persisted UI state (collapsed panels, etc.)
✅ logs      — Application event logs
✅ artifacts — Generated code, images, documents
✅ auth_logs — Authentication event records
✅ banned_nodes — IP ban records
```

---

## 2. What is BROKEN 🔴

### Critical Issues

| # | Issue | Severity | Impact | Root Cause |
|---|-------|----------|--------|------------|
| 1 | **Firebase Auth token refresh race** | 🔴 Critical | Users logged out mid-session | Concurrent token refresh calls overwrite each other |
| 2 | **SSE streaming chunk drops** | 🔴 Critical | Incomplete AI responses on slow networks | Parser doesn't buffer partial chunks |
| 3 | **IndexedDB concurrent write abort** | 🔴 Critical | Lost configuration changes | Multiple tabs writing to same store without coordination |
| 4 | **Context state memory leak** | 🟡 High | Browser tab consumes 500MB+ RAM after 30min | Subscriptions not cleaned up on unmount |
| 5 | **Service Worker stale cache** | 🟡 High | Users see old UI after update | SW cache not invalidated on new deploy |
| 6 | **Simulated search returns fake data** | 🟡 High | Users trust fabricated search results | Search is hardcoded, not connected to any API |
| 7 | **Arabic text overflow in cards** | 🟠 Medium | Dashboard cards break layout in AR mode | CSS `word-break` not set for Arabic text |
| 8 | **No input sanitization on code execution** | 🔴 Critical | Arbitrary code execution possible | AI-generated code runs without any scanning |
| 9 | **CORS preflight failures on some providers** | 🟠 Medium | Some LLM providers fail on first request | Express proxy doesn't handle all CORS preflight methods |

### Issue Severity Distribution

```
Critical  ████████████░░░░░░░░░░  4/9 (44%)
High     ████████████████░░░░░  3/9 (33%)
Medium   ████████░░░░░░░░░░░░░  2/9 (22%)
Low      ░░░░░░░░░░░░░░░░░░░░  0/9 (0%)
```

### Issue Impact Flow

```
Issue #8 (No code sanitization)
    │
    ├──→ User asks agent to run code
       │       │
    │       ├──→ AI returns malicious eval() call
       │       │       │
    │       │       └──→ EXECUTED → Session hijack / data theft
    │       │
    │       └──→ AI returns innerHTML injection
       │               │
    │               └──→ EXECUTED → XSS / cookie theft
    │
Issue #1 (Auth race condition)
    │
    ├──→ Token expires during active session
    │       │
    │       ├──→ Two components trigger refresh simultaneously
    │       │       │
    │       │       ├──→ Refresh A gets token X
    │       │       ├──→ Refresh B gets token Y
    │       │       └──→ Token X overwrites Y → Y is invalid → 401
    │       │
    │       └──→ User sees auth error mid-conversation
```

---

## 3. What is NEW for v2.0 🆕

| # | Feature | Component | Priority | Est. Effort |
|---|---------|-----------|----------|-------------|
| 1 | **Unified AIGateway v2.0** | `src/lib/ai/` | P0 — Critical | 3 days |
| 2 | **Gemini Grounding Web Search** | `src/lib/ai/providers/gemini.ts` | P0 — Critical | 1 day |
| 3 | **LearningEngine** | `src/lib/learning/` | P1 — High | 3 days |
| 4 | **MemoryEngine + userMemory store** | `src/lib/memory/` + IndexedDB | P1 — High | 2 days |
| 5 | **TaskScheduler** | `src/lib/scheduler/` | P1 — High | 2 days |
| 6 | **4-Field Task Model** | `src/types/task.ts` + DB migration | P0 — Critical | 1 day |
| 7 | **Per-Agent Dashboard Cards** | `src/components/dashboard/` | P2 — Medium | 2 days |
| 8 | **HorusGuard AST Scanner** | `src/lib/security/horusguard.ts` | P0 — Critical | 2 days |
| 9 | **Prompt Sanitizer** | `src/lib/security/sanitizer.ts` | P0 — Critical | 1 day |
| 10 | **Excommunicado IP Banning** | `src/lib/security/excommunicado.ts` | P1 — High | 1 day |

### New Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    v2.0 Architecture                     │
│                                                          │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────┐  │
│  │ AIGateway   │◄───│ TaskScheduler│    │ Learning   │  │
│  │   v2.0      │    │   (NEW)      │    │ Engine     │  │
│  │ 15 providers│    │ 4-field model│    │  (NEW)     │  │
│  └──────┬──────┘    └──────┬───────┘    └─────┬──────┘  │
│         │                  │                   │         │
│  ┌──────┴──────────────────┴───────────────────┴──────┐  │
│  │              Zustand 5 State Layer                  │  │
│  │         (persisted to IndexedDB Monmamar v4)        │  │
│  └──────────────────────┬─────────────────────────────┘  │
│                         │                                │
│  ┌──────────────────────┴─────────────────────────────┐  │
│  │           Security Layer (NEW)                      │  │
│  │  ┌─────────────┐ ┌───────────┐ ┌───────────────┐  │  │
│  │  │ HorusGuard  │ │  Prompt   │ │ Excommunicado │  │  │
│  │  │ AST Scanner │ │ Sanitizer │ │  IP Banning   │  │  │
│  │  └─────────────┘ └───────────┘ └───────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │           Memory Engine (NEW)                       │  │
│  │        userMemory IndexedDB store                   │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Next Actions / الإجراءات القادمة

### Phase 1: Foundation (Days 1–5)

| Step | Action | Dependency | Deliverable |
|------|--------|------------|-------------|
| 1.1 | Set up Zustand 5 stores with IndexedDB persistence | None | Store files, types |
| 1.2 | Implement Monmamar v4 migration (v3→v4) | None | DB upgrade handler |
| 1.3 | Build HorusGuard AST scanner | None | Scanner module + tests |
| 1.4 | Build Prompt Sanitizer | None | Sanitizer module + tests |
| 1.5 | Fix Firebase Auth token refresh | None | Auth fix + tests |

### Phase 2: Core Engines (Days 6–12)

| Step | Action | Dependency | Deliverable |
|------|--------|------------|-------------|
| 2.1 | Build AIGateway v2.0 with ProviderAdapter | Step 1.1 | Gateway + 15 adapters |
| 2.2 | Implement Gemini Grounding search | Step 2.1 | Search integration |
| 2.3 | Build 4-field task model + migration | Step 1.2 | Task types + DB migration |
| 2.4 | Build TaskScheduler | Step 2.3 | Scheduler engine |
| 2.5 | Build MemoryEngine + userMemory store | Step 1.2 | Memory system |

### Phase 3: Intelligence (Days 13–16)

| Step | Action | Dependency | Deliverable |
|------|--------|------------|-------------|
| 3.1 | Build LearningEngine | Step 2.1, 2.4 | Learning module |
| 3.2 | Implement Excommunicado Protocol | Step 1.3 | IP banning system |
| 3.3 | Per-agent dashboard cards | Step 2.1 | Dashboard UI components |

### Phase 4: Polish & Deploy (Days 17–20)

| Step | Action | Dependency | Deliverable |
|------|--------|------------|-------------|
| 4.1 | Fix all 9 broken items | All above | All issues resolved |
| 4.2 | Full test suite (unit, component, E2E) | All above | >80% coverage |
| 4.3 | Security audit | Step 1.3, 1.4 | Audit report |
| 4.4 | Build + deploy to Hostinger | All above | Production release |

---

## 5. Blockers / العقبات

| Blocker | Type | Resolution | Owner |
|---------|------|------------|-------|
| Gemini Grounding requires `@google/genai` v2.4+ | Dependency | Verify SDK availability, pin version | Dev |
| Hostinger shared hosting has no WebSocket upgrade | Infrastructure | SSE only for streaming (already planned) | DevOps |
| IndexedDB storage limit varies by browser | Constraint | Implement quota check + graceful fallback to in-memory | Dev |
| Framer Motion 12 may not support React 19 fully | Dependency | Test early, fallback to v11 if needed | Dev |
| Tailwind CSS 4 has breaking config changes | Dependency | Migrate config to CSS-based approach | Dev |
| Single developer — 20-day timeline is aggressive | Resource | Prioritize P0 items, defer P2 to v2.1 | PM |

---

## 6. Risk Assessment / تقييم المخاطر

```
              Impact
              ▲
     High  │  ┌─────────┐          ┌──────────┐
           │  │ #8 Code │          │ #1 Auth  │
           │  │ Exec    │          │ Race     │
     Med   │  └─────────┘          └──────────┘
           │         ┌──────────┐              ┌──────────┐
           │         │ #3 DB    │              │ #2 Stream│
           │         │ Abort    │              │ Drops    │
     Low   │         └──────────┘              └──────────┘
           └──────────────────────────────────────────────► Likelihood
                 Low          Med           High
```

---

## 7. Success Criteria for v2.0

| Metric | Target | Measurement |
|--------|--------|-------------|
| Unit test coverage | >80% | Vitest `--coverage` |
| Component test coverage | >70% | RTL `--coverage` |
| Lighthouse PWA score | >90 | Chrome DevTools Lighthouse |
| Lighthouse Security score | >95 | Chrome DevTools Lighthouse |
| HorusGuard scan time | <10ms/block | Performance test |
| AIGateway response time | <500ms first token | Benchmark |
| All 9 broken items | 0 open | Manual verification |
| All 10 NEW items | Implemented | Feature checklist |

---

> 𓂀 *Before we build the future, we must honestly face the present. This checkpoint is our mirror.* — Wazeer OS Engineering
