# Bug Triage — Wazeer OS v2.0.0-Rewrite

> 𓂀 Wazeer OS (وزير OS) — Bug Classification & Triage Process  
> Document Owner: QA & Engineering Lead | Last Updated: 2025-01  
> Classification: Internal — Engineering & QA

---

## Table of Contents

1. [Overview](#overview)
2. [Severity Levels](#severity-levels)
3. [Triage Process](#triage-process)
4. [Response Time SLAs](#response-time-slas)
5. [Known Bugs Inventory](#known-bugs-inventory)
6. [Escalation Matrix](#escalation-matrix)
7. [Bug Lifecycle](#bug-lifecycle)
8. [Bug Metrics & Tracking](#bug-metrics--tracking)

---

## Overview

### Triage Philosophy

Wazeer OS bug triage follows a structured process to ensure every reported issue is:
1. **Classified** — Assigned severity and priority
2. **Owned** — Assigned to a responsible developer
3. **Resolved** — Fixed, verified, and closed
4. **Learned from** — Root cause analyzed to prevent recurrence

### Triage Cadence

| Activity | Frequency | Duration | Attendees |
|---|---|---|---|
| New bug review | Daily (during sprints) | 15 min | Engineering lead + QA |
| Bug backlog grooming | Weekly | 30 min | All engineers |
| Pre-release triage | Before each release | 1 hour | All team |
| Hot triage (P0) | As needed | Immediate | On-call engineer |

---

## Severity Levels

### P0 — Critical

**Definition:** The application is completely broken for a significant portion of users, or there is an active security/data loss incident.

| Criteria | Examples |
|---|---|
| App crashes on launch | White screen of death, unhandled exception |
| Data loss | IndexedDB corruption, chat history deleted |
| Security breach | API key exposure, XSS being exploited |
| Core feature completely broken | Chat doesn't work, auth doesn't work |
| Payment/credential theft | Firebase auth bypass |
| > 50% of users affected | Server error on login |

**Response:** Immediate (within 15 minutes). Drop everything.

### P1 — High

**Definition:** A major feature is broken with no workaround, significantly impacting user experience.

| Criteria | Examples |
|---|---|
| Feature completely broken | Model switching doesn't work, no responses from Amoun |
| Broken on a major platform | App doesn't work on Chrome, broken on mobile |
| Auth issues | Session doesn't persist, can't sign in |
| Performance degradation | Page takes > 10s to load, CPU at 100% |
| Broken in one language | Arabic RTL completely broken |

**Response:** Fix within current sprint (within 48 hours).

### P2 — Medium

**Definition:** A feature is partially broken or there is a workaround available.

| Criteria | Examples |
|---|---|
| Feature partially broken | Code copy button doesn't work, but select + copy does |
| Broken on minor platform | Issue on Safari only, works on Chrome |
| Visual regression | Layout shift, wrong color, alignment issue |
| Minor auth issue | Auto-login works, but manual login requires retry |
| Performance concern | LCP > 3s but < 5s |

**Response:** Fix within next sprint (within 1 week).

### P3 — Low

**Definition:** Minor issues that don't significantly impact functionality.

| Criteria | Examples |
|---|---|
| Cosmetic issue | Wrong icon, typo in tooltip |
| Edge case | Error when very long message (>10,000 chars) |
| Minor inconvenience | Button doesn't have hover state |
| Non-critical animation | Animation glitch on page transition |
| Documentation gap | Missing tooltip on settings option |

**Response:** Fix when convenient, within 2 sprints.

### P4 — Cosmetic

**Definition:** Visual-only issues with zero functional impact.

| Criteria | Examples |
|---|---|
| Pixel misalignment | 1px border offset |
| Color shade off | Teal is #2dd4bf instead of #2dd4bf (imperceptible) |
| Font weight | Slightly wrong weight on secondary heading |
| Whitespace | Extra margin on mobile card |

**Response:** Track as backlog, fix opportunistically.

---

## Triage Process

### Step 1: Report

| Action | Details |
|---|---|
| Who | Anyone (developer, tester, user via GitHub Issue) |
| How | Use Bug Report Template (see ISSUE-TEMPLATE.md) |
| Required | Description, steps to reproduce, environment, severity estimate |

### Step 2: Classify

| Action | Details |
|---|---|
| Who | Triage lead (Engineering Lead or QA) |
| When | Within 4 hours of report |
| Actions | Verify reproduction → Assign actual severity → Set priority → Add labels |

### Step 3: Assign

| Action | Details |
|---|---|
| Who | Triage lead |
| When | Within 4 hours of classification |
| Criteria | Assign to developer with relevant expertise + available capacity |
| Output | Issue assigned, status changed to `in-progress` |

### Step 4: Fix

| Action | Details |
|---|---|
| Who | Assigned developer |
| When | Within SLA for severity |
| Actions | Reproduce → Root cause → Fix → Unit test → PR |
| Output | Pull request opened with fix + test |

### Step 5: Verify

| Action | Details |
|---|---|
| Who | QA or another developer (not the fixer) |
| When | Within 24h of PR merge |
| Actions | Verify fix → Cross-browser check → Regression check |
| Output | Verification comment on issue |

### Step 6: Close

| Action | Details |
|---|---|
| Who | Issue reporter or triage lead |
| When | After verification passes |
| Actions | Close issue → Update metrics → Add to changelog (if applicable) |

### Triage Decision Tree

```
[New Bug Report]
      │
      ▼
[Can reproduce?]
      ├── NO → Request more info → Wait 48h → Close if no response
      │
      └── YES → [What's the severity?]
                │
                ├── P0 → Page on-call → Hot fix → Deploy → Post-mortem
                │
                ├── P1 → Assign → Fix in current sprint → Test → Close
                │
                ├── P2 → Assign → Add to sprint backlog → Fix next sprint
                │
                ├── P3 → Assign → Add to backlog → Fix when convenient
                │
                └── P4 → Label → Add to backlog → Fix opportunistically
```

---

## Response Time SLAs

### By Severity

| Severity | Acknowledge | Assign | Fix | Verify | Close |
|---|---|---|---|---|---|
| **P0 — Critical** | 15 min | 30 min | 4h | 1h | 2h |
| **P1 — High** | 4h | 4h | 48h | 24h | 24h |
| **P2 — Medium** | 24h | 48h | 1 week | 24h | 48h |
| **P3 — Low** | 72h | 1 week | 2 weeks | 48h | 48h |
| **P4 — Cosmetic** | 1 week | Backlog | Backlog | — | — |

### By Phase

| Phase | P0 Response | P1 Response | P2 Response |
|---|---|---|---|
| **Alpha** | 4h | 24h | 1 week |
| **Beta** | 2h | 12h | 3 days |
| **Launch Day** | 15 min | 2h | 24h |
| **Post-Launch** | 1h | 24h | 1 week |

---

## Known Bugs Inventory

### From v0.x — Pre-existing Issues (Inherited)

These bugs existed in v0.x and must be resolved in v2.0.0-Rewrite:

#### KB-001: Auth Persistence Failure

| Field | Value |
|---|---|
| **ID** | KB-001 |
| **Description** | Firebase Auth session doesn't persist across page reloads. Users are logged out every time they close and reopen the browser tab. |
| **Severity** | P1 (High) |
| **Status** | 🟡 In Progress — v2.0 uses Zustand persist for auth state |
| **Root Cause** | v0.x didn't implement Firebase Auth state persistence observer |
| **Fix in v2.0** | `onAuthStateChanged` listener + Zustand persist to IndexedDB |

#### KB-002: Dual LLM System Confusion

| Field | Value |
|---|---|
| **ID** | KB-002 |
| **Description** | v0.x had both OpenAI and Google AI integrations running simultaneously. Users were confused about which model was active, and context was lost when switching. |
| **Severity** | P1 (High) |
| **Status** | 🟢 Resolved — v2.0 uses unified @google/genai with multi-model selector |
| **Root Cause** | Two separate service files (`openai.ts` + `google.ts`) with independent state |
| **Fix in v2.0** | Single `useModelStore` with unified model interface |

#### KB-003: Mock Search Implementation

| Field | Value |
|---|---|
| **ID** | KB-003 |
| **Description** | Search feature in v0.x used mock/placeholder results instead of real API calls. "Searching the web" returned hardcoded responses. |
| **Severity** | P2 (Medium) |
| **Status** | 🟡 In Progress — v2.0 implements Gemini grounding |
| **Root Cause** | Gemini grounding API wasn't available at v0.x development time |
| **Fix in v2.0** | Gemini grounding with search tool enabled |

#### KB-004: Stub Engine Services

| Field | Value |
|---|---|
| **ID** | KB-004 |
| **Description** | Multiple services in v0.x were stubs (empty functions returning empty arrays or placeholder data). STUB comments scattered throughout codebase. |
| **Severity** | P2 (Medium) |
| **Status** | 🟡 In Progress — v2.0 implements real services |
| **Root Cause** | Features planned but not implemented in v0.x |
| **Fix in v2.0** | Full implementation per "Green Code" principle |

#### KB-005: Decorative Metrics

| Field | Value |
|---|---|
| **ID** | KB-005 |
| **Description** | LlmDashboard in v0.x showed hardcoded metric values (e.g., "1,234 operations") that didn't reflect actual usage. Decorative numbers. |
| **Severity** | P2 (Medium) |
| **Status** | 🟢 Resolved — v2.0 uses real useEventLogger data |
| **Root Cause** | Dashboard was UI-only, no analytics backend |
| **Fix in v2.0** | `useEventLogger` provides real metrics to dashboard |

#### KB-006: Missing Firebase Configuration

| Field | Value |
|---|---|
| **ID** | KB-006 |
| **Description** | Firebase configuration was missing or using test credentials in v0.x. Auth features didn't work in production. |
| **Severity** | P1 (High) |
| **Status** | 🟡 In Progress — v2.0 uses proper env var configuration |
| **Root Cause** | Firebase project not properly set up, config not committed to env |
| **Fix in v2.0** | `.env` file with all Firebase keys, build-time validation |

#### KB-007: Dead BottomBar Component

| Field | Value |
|---|---|
| **ID** | KB-007 |
| **Description** | v0.x had a `BottomBar` component that was rendered but non-functional (no click handlers, no navigation). Dead code. |
| **Severity** | P3 (Low) |
| **Status** | 🟢 Resolved — v2.0 replaces with MobileBottomNav (functional) |
| **Root Cause** | Component created but never wired up |
| **Fix in v2.0** | Removed BottomBar, added functional MobileBottomNav |

#### KB-008: Name Inconsistency

| Field | Value |
|---|---|
| **ID** | KB-008 |
| **Description** | v0.x used multiple names interchangeably: "Zomra", "Amoun OS", "Wazeer", "وزير". Code, UI, and docs had different names. |
| **Severity** | P3 (Low) |
| **Status** | 🟢 Resolved — v2.0 enforces "Wazeer OS" / "Amoun" via CONTENT-GUIDELINES |
| **Root Cause** | No naming convention established in v0.x |
| **Fix in v2.0** | CONTENT-GUIDELINES.md with strict naming rules + grep enforcement |

### New Bugs (v2.0.0-Rewrite)

To be populated during alpha and beta testing. Use the Bug Report template for each.

---

## Escalation Matrix

### Escalation Levels

| Level | Trigger | Escalate To | Action |
|---|---|---|---|
| **L1 — Developer** | Bug assigned to developer | Developer self-resolves | Fix + test |
| **L2 — Lead** | Developer stuck > 4h, or P0/P1 | Engineering Lead | Pair programming, design review |
| **L3 — Product** | Impact on release timeline, scope change needed | Product Lead | Scope decision, timeline adjustment |
| **L4 — Director** | Security incident, data loss, public-facing issue | 100MillionDEV | Executive decision, external communication |

### Escalation Triggers

| Trigger | Level | Timeframe |
|---|---|---|
| P0 bug not fixed in 4h | L2 → L3 | Immediately |
| P1 bug not fixed in 48h | L2 → L3 | After 48h |
| Developer blocked | L1 → L2 | After 4h |
| Security vulnerability discovered | L1 → L2 → L3 → L4 | Immediately |
| Multiple P0s discovered | L2 → L3 → L4 | Immediately (consider halt) |
| Bug count exceeds sprint capacity | L2 → L3 | Sprint planning |
| Regression from fix | L1 → L2 | Immediately |

### Communication During Escalation

| Severity | Internal Communication | External Communication |
|---|---|---|
| P0 | Slack/ Discord: "#incidents" channel | Status page update within 30 min |
| P1 | Slack/ Discord: "#bugs" channel | No external communication |
| P2 | GitHub issue comment | No external communication |
| P3/P4 | GitHub issue label | No external communication |

---

## Bug Lifecycle

### State Machine

```
[Reported] → [Triaged] → [Assigned] → [In Progress] → [In Review] → [Verified] → [Closed]
                  │            │                           │
                  │            │                           └──→ [Reopened] → [In Progress]
                  │            └──→ [Blocked] ──────────────────────────────→ [Assigned]
                  └──→ [Duplicate] → [Closed]
                  └──→ [Won't Fix] → [Closed]
                  └──→ [Can't Reproduce] → [Needs Info] → [Triaged] / [Closed]
```

### State Definitions

| State | Meaning | Exit Criteria |
|---|---|---|
| **Reported** | Issue filed, not yet reviewed | Triage lead reviews |
| **Triaged** | Severity + priority assigned | Developer assigned |
| **Assigned** | Developer owns the issue | Developer starts work |
| **In Progress** | Fix is being developed | PR opened |
| **In Review** | PR is open, awaiting review | Review approved + merged |
| **Blocked** | Waiting on dependency | Dependency resolved |
| **Verified** | Fix confirmed working | Issue closed |
| **Reopened** | Fix didn't work or regression | Re-assigned to developer |
| **Duplicate** | Same issue already exists | Linked + closed |
| **Won't Fix** | Accepted as-is | Approved by lead |
| **Needs Info** | Can't reproduce | Reporter provides info |
| **Closed** | Issue resolved | — |

---

## Bug Metrics & Tracking

### Dashboard Metrics

| Metric | Target | Formula |
|---|---|---|
| **Open bug count** | < 10 (pre-launch) | Count of open issues with `type: bug` |
| **P0 bug count** | 0 | Count of open P0 issues |
| **Bug resolution time (avg)** | < 5 days | Avg(verified_date - assigned_date) |
| **Bug reopen rate** | < 10% | Reopened bugs / Total closed bugs |
| **Bug discovery rate** | Decreasing | New bugs per week over time |
| **Fix verification rate** | 100% | Verified bugs / Closed bugs |

### Sprint Bug Tracking

| Sprint | P0 | P1 | P2 | P3 | P4 | Total Open | Total Closed |
|---|---|---|---|---|---|---|---|
| Sprint 1 | 0 | 2 | 5 | 8 | 3 | 18 | — |
| Sprint 2 | 0 | 1 | 3 | 5 | 2 | 29 | 11 |
| Sprint 3 | 0 | 0 | 2 | 4 | 1 | 36 | 18 |
| Sprint 4 | 0 | 0 | 1 | 2 | 0 | 39 | 30 |
| **Pre-launch** | **0** | **0** | **0** | **< 5** | **< 5** | **< 10** | **> 30** |

### Bug Taxonomy

Track bugs by category for root cause analysis:

| Category | Common Issues | Prevention |
|---|---|---|
| **Auth** | Session persistence, token expiry | Auth state observer tests |
| **RTL** | Arabic layout breaks | RTL test cases for every PR |
| **State** | Zustand store sync issues | Store unit tests |
| **Performance** | Bundle size, render cycles | Performance budgets in CI |
| **Network** | API errors, timeouts | Error handling tests |
| **Rendering** | Markdown, code highlighting | Visual regression tests |
| **Mobile** | Touch, viewport, bottom nav | Mobile-specific test suite |
| **PWA** | Service worker, install | PWA audit in CI |

---

*Document 𓂀 Wazeer OS Bug Triage v2.0.0-Rewrite*  
*© 2025 100MillionDEV / العرآب — All Rights Reserved*
