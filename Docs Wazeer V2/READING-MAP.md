# Reading Map — Wazeer OS v2.0.0-Rewrite

> 𓂀 Wazeer OS (وزير OS) — Developer Onboarding Reading Guide  
> Document Owner: Engineering Lead | Last Updated: 2025-01  
> Classification: Internal — Engineering (New Developer Guide)

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Understanding (The Big Picture)](#phase-1-understanding-the-big-picture)
3. [Phase 2: Technical Deep-Dive](#phase-2-technical-deep-dive)
4. [Phase 3: Execution (Building the Product)](#phase-3-execution-building-the-product)
5. [Phase 4: Operations (Running & Maintaining)](#phase-4-operations-running--maintaining)
6. [Phase 5: AI & Product (Understanding Amoun)](#phase-5-ai--product-understanding-amoun)
7. [Reading Time Estimates](#reading-time-estimates)
8. [Prerequisites by Phase](#prerequisites-by-phase)
9. [Quick Start Path (1-Day)](#quick-start-path-1-day)

---

## Overview

### Purpose

This reading map provides a structured, ordered path through Wazeer OS documentation for new developers. Rather than reading 17 documents randomly, follow this guide to build understanding progressively — from high-level concepts to implementation details.

### Audience

- New developers joining the Wazeer OS project
- Contributors wanting to understand the codebase before making changes
- QA engineers needing technical context for testing
- Anyone curious about the architecture and design decisions

### Total Documentation

| Metric | Value |
|---|---|
| Total documents | 17 files |
| Estimated total reading time | ~8-10 hours (focused) |
| Recommended completion time | 1-2 weeks (part-time) |
| Critical path (minimum) | ~3 hours |

---

## Phase 1: Understanding (The Big Picture)

**Goal:** Understand what Wazeer OS is, why it exists, and how it's organized. No code yet — just context.

### Phase Duration: 2-3 hours

### Reading Order

| Order | Document | Why First | Key Takeaways |
|---|---|---|---|
| 1.1 | **README.md** | Project overview, quick start, visual introduction | What Wazeer OS does, how to run it, what it looks like |
| 1.2 | **ARCHITECTURE.md** | System design, component relationships | How the app is structured, data flow, store architecture |
| 1.3 | **DATA-MODEL.md** | Data structures, schemas, relationships | What data lives where, IndexedDB schema, event types |

### What You'll Know After Phase 1

- ✅ What Wazeer OS is and who it's for
- ✅ The tech stack and why each technology was chosen
- ✅ How components, stores, and services relate
- ✅ What data models exist and how they connect
- ✅ The Egyptian Cyberpunk design philosophy
- ✅ The role of Amoun as the AI agent

### Questions You Should Be Able to Answer

1. What is Wazeer OS in one sentence?
2. What are the 5 key Zustand stores and what do they manage?
3. How does data flow from user input → LLM → response → display?
4. What is the difference between `useConfigStore` and `useEventLogger`?
5. Why is this project called "2.0.0-Rewrite"?

---

## Phase 2: Technical Deep-Dive

**Goal:** Understand the technical specifications, security model, and API design. Start thinking about implementation.

### Phase Duration: 2-3 hours

### Reading Order

| Order | Document | Why Here | Key Takeaways |
|---|---|---|---|
| 2.1 | **API-SPEC.md** | API contracts, endpoints, data formats | How the LLM API layer works, request/response schemas |
| 2.2 | **SECURITY.md** | Security architecture, threat model | HorusGuard, input sanitization, auth security, CSP |
| 2.3 | **TECHNICAL-SPEC.md** | Implementation details, performance targets | Component specs, rendering strategy, performance budgets |
| 2.4 | **DESIGN-SYSTEM.md** | Visual language, tokens, components | Colors, typography, spacing, glassmorphism, animations |
| 2.5 | **ACCESSIBILITY.md** | WCAG compliance, keyboard nav, ARIA | How the app supports all users, screen reader support |

### What You'll Know After Phase 2

- ✅ How LLM API calls are structured and routed
- ✅ The security threat model and mitigations
- ✅ How HorusGuard scans generated code
- ✅ The complete design token system
- ✅ Animation and motion guidelines
- ✅ WCAG 2.1 AA compliance requirements
- ✅ Performance targets (FCP, LCP, CLS)

### Questions You Should Be Able to Answer

1. How does `llm.ts` route messages to different providers?
2. What does HorusGuard check for in generated code?
3. What are the 5 theme accent color presets?
4. What is the glassmorphism recipe (blur, opacity, border)?
5. How does the app handle `prefers-reduced-motion`?
6. What keyboard shortcut opens the command palette?

---

## Phase 3: Execution (Building the Product)

**Goal:** Understand how to build, test, and ship features. Practical knowledge for contributing.

### Phase Duration: 2-3 hours

### Reading Order

| Order | Document | Why Here | Key Takeaways |
|---|---|---|---|
| 3.1 | **IMPLEMENTATION-PLAN.md** | Sprint plan, feature breakdown, milestones | What's being built when, sprint scope, acceptance criteria |
| 3.2 | **CHECKPOINT.md** | Quality gates, review checklists | What must be true before merging/deploying |
| 3.3 | **CHANGELOG.md** | Version history, change log | What's been done, breaking changes, migration notes |
| 3.4 | **PHASE-CHECKPOINTS.md** | Sprint checkpoint criteria | Go/No-Go decisions per sprint |
| 3.5 | **EXECUTION-RULES.md** | Coding standards, naming, file organization | How to write code that passes review |
| 3.6 | **PROJECT-CONTEXT.md** | Quick reference, gotchas, how-to guides | Practical: add provider, add view, add store |

### What You'll Know After Phase 3

- ✅ The sprint plan and current milestone
- ✅ What quality gates exist and when they apply
- ✅ Coding standards (naming, files, imports, error handling)
- ✅ How to add a new LLM provider, view, or IndexedDB store
- ✅ Common gotchas and how to avoid them
- ✅ The PR review checklist
- ✅ Go/No-Go decision framework

### Questions You Should Be Able to Answer

1. What is the current sprint and what features are in scope?
2. What are the 3 key acceptance criteria for Sprint 1?
3. What file naming convention is used for components vs services?
4. How do you add a new view to Wazeer OS? (Name the 4 steps)
5. What is the maximum line count for a component file?
6. What must happen before a PR can be merged?

---

## Phase 4: Operations (Running & Maintaining)

**Goal:** Understand deployment, monitoring, issue management, and long-term maintenance.

### Phase Duration: 1-2 hours

### Reading Order

| Order | Document | Why Here | Key Takeaways |
|---|---|---|---|
| 4.1 | **DEPLOYMENT.md** | Hosting, build, deploy pipeline | How to deploy to Hostinger, environment setup |
| 4.2 | **TESTING.md** | Test strategy, tools, coverage | What to test, how to test, test types |
| 4.3 | **CONTRIBUTING.md** | Contribution workflow, PR process | How to contribute, PR template, code of conduct |
| 4.4 | **VERSIONING.md** | SemVer policy, branching, releases | How versions are managed, branching strategy |
| 4.5 | **RELEASE-PLAN.md** | Launch strategy, rollout, monitoring | How v2.0.0 will launch, post-launch plan |
| 4.6 | **BUG-TRIAGE.md** | Bug severity, triage process, SLAs | How bugs are classified, response times |
| 4.7 | **ISSUE-TEMPLATE.md** | Issue templates for all types | How to file proper bug reports and feature requests |
| 4.8 | **RISK-REGISTER.md** | Risk identification, mitigation | Known risks, probability/impact, mitigations |

### What You'll Know After Phase 4

- ✅ How to build and deploy Wazeer OS
- ✅ The testing strategy and tools
- ✅ How to contribute a PR successfully
- ✅ How semantic versioning works for this project
- ✅ The v2.0.0 launch plan and rollout phases
- ✅ How bugs are triaged and prioritized
- ✅ How to file proper issues
- ✅ What risks are being tracked and mitigated

### Questions You Should Be Able to Answer

1. How do you deploy Wazeer OS to production?
2. What are the 3 severity levels that block a release?
3. What is the branch strategy (main, develop, feature/*)?
4. What are the 3 phases of the v2.0.0 rollout?
5. How do you file a P0 bug report?
6. What is the #1 risk for the project?

---

## Phase 5: AI & Product (Understanding Amoun)

**Goal:** Deep understanding of the AI agent, product guidelines, and UX principles. Essential for anyone working on Amoun's behavior or the user experience.

### Phase Duration: 1-2 hours

### Reading Order

| Order | Document | Why Here | Key Takeaways |
|---|---|---|---|
| 5.1 | **AI-INSTRUCTIONS.md** | Amoun's system prompt, personality | How Amoun behaves, what it can/can't do |
| 5.2 | **CONTENT-GUIDELINES.md** | Voice, tone, naming, UI copy | How to write UI text, bilingual rules |
| 5.3 | **UX-SPECIFICATION.md** | User journeys, interactions, animations | How users experience the product |
| 5.4 | **ANALYTICS.md** | Event tracking, metrics, dashboard | How on-device analytics work |
| 5.5 | **SEO.md** | PWA optimization, meta tags, structured data | How the app is discoverable |
| 5.6 | **RETROSPECTIVE.md** | Lessons from v0.x, technical debt | What went wrong, what we fixed, what we learned |

### What You'll Know After Phase 5

- ✅ Amoun's personality, capabilities, and boundaries
- ✅ How to write bilingual UI text
- ✅ The complete user journey for first-time and power users
- ✅ How the event logger works and what metrics are tracked
- ✅ PWA optimization strategies
- ✅ Technical debt inherited from v0.x and how it was addressed

### Questions You Should Be Able to Answer

1. What is Amoun's personality in 5 adjectives?
2. When should Amoun extract a task vs a memory?
3. What are the 3 user personas for Wazeer OS?
4. How long are analytics events retained?
5. What is the Lighthouse performance target?
6. What was the biggest mistake in v0.x?

---

## Reading Time Estimates

### Per Document

| Document | Pages (est.) | Reading Time | Priority |
|---|---|---|---|
| README.md | 15 | 15 min | Critical |
| ARCHITECTURE.md | 25 | 30 min | Critical |
| DATA-MODEL.md | 20 | 25 min | Critical |
| API-SPEC.md | 20 | 25 min | High |
| SECURITY.md | 20 | 25 min | High |
| TECHNICAL-SPEC.md | 25 | 30 min | High |
| DESIGN-SYSTEM.md | 30 | 35 min | High |
| ACCESSIBILITY.md | 25 | 30 min | High |
| IMPLEMENTATION-PLAN.md | 20 | 25 min | Medium |
| EXECUTION-RULES.md | 15 | 20 min | Medium |
| PROJECT-CONTEXT.md | 20 | 25 min | Medium |
| AI-INSTRUCTIONS.md | 20 | 25 min | Medium |
| CONTENT-GUIDELINES.md | 20 | 25 min | Medium |
| UX-SPECIFICATION.md | 25 | 30 min | Medium |
| VERSIONING.md | 15 | 20 min | Low |
| RELEASE-PLAN.md | 15 | 20 min | Low |
| BUG-TRIAGE.md | 15 | 20 min | Low |
| ISSUE-TEMPLATE.md | 15 | 15 min | Low |
| ANALYTICS.md | 15 | 20 min | Low |
| SEO.md | 15 | 20 min | Low |
| RISK-REGISTER.md | 15 | 20 min | Low |
| RETROSPECTIVE.md | 15 | 20 min | Low |
| PHASE-CHECKPOINTS.md | 15 | 20 min | Low |
| CHANGELOG.md | 10 | 10 min | Low |
| CHECKPOINT.md | 10 | 15 min | Low |
| DEPLOYMENT.md | 10 | 15 min | Low |
| TESTING.md | 10 | 15 min | Low |
| CONTRIBUTING.md | 10 | 15 min | Low |

### Per Phase Summary

| Phase | Documents | Total Time | Priority |
|---|---|---|---|
| Phase 1: Understanding | 3 | ~70 min | Critical |
| Phase 2: Technical | 5 | ~145 min | High |
| Phase 3: Execution | 6 | ~145 min | Medium |
| Phase 4: Operations | 8 | ~200 min | Medium |
| Phase 5: AI & Product | 6 | ~155 min | Medium |
| **Total** | **28** | **~715 min (~12h)** | — |

---

## Prerequisites by Phase

### Phase 1 Prerequisites

| Requirement | Level | Notes |
|---|---|---|
| React fundamentals | Intermediate | Components, props, hooks, state |
| TypeScript basics | Intermediate | Interfaces, types, generics |
| General web concepts | Intermediate | HTTP, REST, browser APIs, PWA concept |
| Git basics | Beginner | Clone, branch, commit, push |

### Phase 2 Prerequisites

| Requirement | Level | Notes |
|---|---|---|
| Phase 1 complete | — | Must understand architecture first |
| Zustand (or Redux) | Beginner | State management concept |
| Tailwind CSS | Beginner | Utility classes, responsive design |
| IndexedDB | Conceptual | Know what it is, don't need deep experience |
| Web security basics | Conceptual | XSS, CSRF, CORS concepts |

### Phase 3 Prerequisites

| Requirement | Level | Notes |
|---|---|---|
| Phase 2 complete | — | Must understand technical spec first |
| Vite | Beginner | Build tool concept |
| Framer Motion | Conceptual | Animation library concept |
| Monaco Editor | Conceptual | Code editor component |
| Firebase Auth | Conceptual | Authentication provider |

### Phase 4 Prerequisites

| Requirement | Level | Notes |
|---|---|---|
| Phase 3 complete | — | Must understand execution rules first |
| Node.js | Intermediate | npm, scripts, environment |
| Docker (optional) | Beginner | Container concepts |
| CI/CD concepts | Conceptual | Build pipelines, automated testing |

### Phase 5 Prerequisites

| Requirement | Level | Notes |
|---|---|---|
| Phase 1 complete | — | Must understand product first |
| LLM concepts | Conceptual | Tokens, prompts, system instructions |
| UX principles | Beginner | User journeys, interaction patterns |
| Arabic language | Helpful (not required) | For understanding bilingual content |

---

## Quick Start Path (1-Day)

If you need to get productive **today**, read only these documents in this order:

| # | Document | Time | Why |
|---|---|---|---|
| 1 | README.md | 15 min | Get it running locally |
| 2 | PROJECT-CONTEXT.md | 25 min | Architecture overview + key files |
| 3 | EXECUTION-RULES.md | 20 min | Know the coding standards |
| 4 | ARCHITECTURE.md | 30 min | Understand the system design |
| 5 | AI-INSTRUCTIONS.md | 25 min | Understand Amoun's behavior |
| **Total** | | **~115 min** | **Enough to start contributing** |

### After Quick Start, You Can:

- ✅ Run the app locally
- ✅ Navigate the codebase
- ✅ Understand the architecture
- ✅ Write code that follows conventions
- ✅ Understand what Amoun does
- ❌ Deploy (need Phase 4)
- ❌ File proper issues (need Phase 4)
- ❌ Design new components (need Phase 2)

---

*Document 𓂀 Wazeer OS Reading Map v2.0.0-Rewrite*  
*© 2025 100MillionDEV / العرآب — All Rights Reserved*
