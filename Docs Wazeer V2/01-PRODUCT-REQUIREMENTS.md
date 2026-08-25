# 𓂀 Wazeer OS (وزير OS) v2.0.0-Rewrite — Product Requirements Document

> **Document Version:** 2.0.0  
> **Date:** 2025-07-13  
> **Author:** 100MillionDEV / العرآب  
> **Classification:** Enterprise Edition  
> **Agent Name:** Amoun (أمون)  

---

## Table of Contents

1. [Product Vision (الرؤية)](#1-product-vision)  
2. [Problem Statement (المشكلة)](#2-problem-statement)  
3. [Target Audience (الجمهور المستهدف)](#3-target-audience)  
4. [User Stories (قصص المستخدمين)](#4-user-stories)  
5. [Success Metrics (مقاييس النجاح)](#5-success-metrics)  
6. [Out of Scope for v2.0 (خارج النطاق)](#6-out-of-scope-for-v20)  
7. [Competitive Analysis (التحليل التنافسي)](#7-competitive-analysis)  
8. [Guiding Principles (المبادئ التوجيهية)](#8-guiding-principles)  

---

## 1. Product Vision

### الرؤية — Vision Statement

> **"Your personal AI minister that lives on your device, learns from every conversation, and runs your digital life."**

Wazeer OS (وزير OS) is a Progressive Web Application that embodies the ancient Egyptian principle of a *vizier* — a trusted minister who manages the affairs of the kingdom. In the modern context, **Amoun (أمون)** serves as that vizier for every user: a deeply personal AI assistant that never sends data to any server except the LLM proxy, remembers everything, and takes autonomous action on the user's behalf.

The system follows five mandatory principles:

| Principle | Arabic | Application to Wazeer OS |
|-----------|--------|--------------------------|
| Green Code | الكود الأخضر | Minimal bundle, efficient resource usage, no wasted compute |
| Security as Mindset | الأمان كعقلية | SHA-256 auth, HorusGuard AST scanning, Excommunicado IP banning |
| Separation of Concerns | فصل المسؤوليات | UI, state, services, and data layers are strictly isolated |
| Scalable Architecture | بنية قابلة للتوسع | Registry pattern for providers, modular service layer |
| Enterprise Edition | نسخة المؤسسة | Production-grade error handling, persistence, and observability |

---

## 2. Problem Statement

### المشكلة — The Three Fatal Flaws of Existing AI Assistants

Existing AI assistants (ChatGPT, Claude Desktop, Gemini App) suffer from three fundamental architectural flaws that Wazeer OS was designed to eliminate:

### Flaw 1: No Persistent Memory (لا ذاكرة دائمة)

```
Current AI:  "I don't remember what we discussed yesterday."
Wazeer OS: "Last Tuesday you asked me to track your budget.
             Here are the 3 tasks I extracted and their current status."
```

- **Root cause:** Stateless conversations with no cumulative context
- **Impact:** Users must re-explain context every session; AI cannot build on prior knowledge
- **Wazeer OS solution:** MemoryEngine stores extracted memories in the `userMemory` IndexedDB store, injected into every system prompt with a 90-day TTL

### Flaw 2: Data Leaves the Device (البيانات تغادر الجهاز)

```
Current AI:  Chat history → Cloud servers → Training data → Who knows where
Wazeer OS:  Chat history → IndexedDB (on-device) → LLM proxy (BYOK) → Only inference leaves
```

- **Root cause:** Server-side storage of conversations, metadata, and user preferences
- **Impact:** Privacy violations, vendor lock-in, regulatory non-compliance (GDPR, CCPA)
- **Wazeer OS solution:** All persistent data in IndexedDB "Monmamar" v4. Only LLM API calls traverse the network, and users bring their own keys (BYOK)

### Flaw 3: No Autonomous Action (لا عمل مستقل)

```
Current AI:  "Here's a plan for your day..."  (user must manually execute)
Wazeer OS: "I extracted 3 tasks from our conversation, scheduled one for 3pm,
             and already executed the other two. Here are the results."
```

- **Root cause:** Output-only systems with no action loop
- **Impact:** AI becomes a fancy search engine, not an assistant
- **Wazeer OS solution:** LearningEngine extracts tasks from conversations, TaskScheduler auto-executes on schedule, results stored in enriched task schema

### Summary Matrix

| Flaw | ChatGPT | Claude | Gemini | Wazeer OS 𓂀 |
|------|---------|--------|--------|---------------|
| Persistent Memory | ❌ | ❌ (limited) | ❌ | ✅ MemoryEngine |
| On-Device Storage | ❌ | ❌ | ❌ | ✅ IndexedDB |
| Autonomous Tasks | ❌ | ❌ | ❌ | ✅ TaskScheduler |
| BYOK Multi-Provider | ❌ | ❌ | ❌ | ✅ 15 providers |
| No Cloud Dependency | ❌ | ❌ | ❌ | ✅ PWA + Proxy-only |

---

## 3. Target Audience

### الجمهور المستهدف — Three-Phase Go-to-Market

#### Phase 1: Launch — "The Believers" (العارفين)

| Attribute | Detail |
|-----------|--------|
| **Size** | 200 – 1,000 users |
| **Channel** | Product Hunt, Reddit r/LocalLLaMA, Twitter/X, Arabic tech communities |
| **Profile** | Privacy-conscious developers, AI power users, BYOK enthusiasts |
| **Pricing** | Free (open-source) |
| **Key Value** | Privacy + Multi-provider BYOK + On-device storage |

#### Phase 2: Growth — "The Professionals" (المحترفين)

| Attribute | Detail |
|-----------|--------|
| **Size** | 1,000 – 100,000 users |
| **Channel** | Word of mouth, tech press, App Store/PWA discovery |
| **Profile** | Knowledge workers, bilingual (AR/EN) professionals, project managers |
| **Pricing** | Freemium (free core + premium features) |
| **Key Value** | Task management, voice I/O, cumulative memory, bilingual support |

#### Phase 3: SaaS — "The Enterprise" (المؤسسات)

| Attribute | Detail |
|-----------|--------|
| **Size** | 100,000+ users |
| **Channel** | Enterprise sales, API marketplace, OEM partnerships |
| **Profile** | Teams, organizations, regulated industries (healthcare, legal, finance) |
| **Pricing** | SaaS tiers with team features |
| **Key Value** | Zero-knowledge architecture, compliance, custom deployments |

---

## 4. User Stories

### قصص المستخدمين — Gherkin Format

All user stories follow the **Given / When / Then** format and are tied to specific functional areas.

---

#### US-001: Chat with Any LLM Provider

```gherkin
Feature: Multi-Provider LLM Chat
  As a user who has API keys for multiple LLM providers
  I want to seamlessly switch between providers mid-conversation
  So that I can leverage the best model for each task

  Scenario: Switch from Gemini to Claude mid-conversation
    Given I am authenticated and have a chat session with 5 messages using Gemini
    And I have a Claude API key stored in my config
    When I select "Claude" from the provider dropdown
    And I send a new message "Summarize the above using Claude"
    Then the message should be routed through the Claude provider via BYOK proxy
    And the response should be streamed in real-time
    And the conversation history should include messages from both providers
```

#### US-002: All Data Stays On-Device

```gherkin
Feature: On-Device Data Storage
  As a privacy-conscious user
  I want all my data stored locally on my device
  So that no one except me (and the LLM I choose) can access it

  Scenario: Verify no data leaves device except LLM calls
    Given I have created 3 chat sessions with 50 messages total
    And I have 10 tasks and 5 artifacts
    When I disconnect from the internet
    Then I can still view all my chat sessions, tasks, and artifacts
    And I can create new tasks and edit existing ones
    And my data persists across browser restarts
```

#### US-003: Cumulative Memory Across Sessions

```gherkin
Feature: Cumulative Memory (MemoryEngine)
  As a user who has conversations over weeks
  I want Amoun to remember important details from past conversations
  So that I don't have to repeat myself

  Scenario: Memory persists across sessions
    Given I had a conversation 3 days ago where I mentioned "I work at ACME Corp"
    And that fact was extracted into the userMemory store
    When I start a new chat session and ask "Where do I work?"
    Then Amoun should respond with "You work at ACME Corp"
    And the response should indicate it came from stored memory

  Scenario: Memory expires after TTL
    Given a memory entry was created 91 days ago
    When the MemoryEngine runs its cleanup pass
    Then that memory entry should be marked for deletion
    And it should no longer appear in system prompts
```

#### US-004: Automatic Task Extraction

```gherkin
Feature: AI Task Extraction (LearningEngine)
  As a busy professional
  I want Amoun to automatically detect actionable items in our conversations
  So that I never miss a to-do item

  Scenario: Task extracted from conversation
    Given I am chatting with Amoun about my weekly plan
    And I say "I need to send the report by Friday and call Ahmed tomorrow"
    When the AI response is received
    Then the LearningEngine should analyze the response
    And with 50% probability, extract 2 tasks:
      | Task | Due Date |
      | Send the report | Friday |
      | Call Ahmed | Tomorrow |
    And both tasks should appear in my task list with source="ai_extraction"
```

#### US-005: Add Custom LLM Model (4-Field Form)

```gherkin
Feature: Custom Model Addition
  As an advanced user with a self-hosted or niche LLM
  I want to add a custom model using a simple 4-field form
  So that I can use any LLM that exposes an OpenAI-compatible API

  Scenario: Add a custom Ollama model
    Given I am on the model settings page
    When I fill in:
      | Field | Value |
      | Provider | ollama |
      | Model ID | llama3:70b |
      | API Key | (empty for local) |
      | Endpoint | http://localhost:11434/v1 |
    And I click "Add Model"
    Then the model should be saved to IndexedDB config
    And "ollama/llama3:70b" should appear in the model dropdown
    And I can select it and chat with it immediately
```

#### US-006: Real Web Search via Gemini Grounding

```gherkin
Feature: Real Web Search
  As a user who needs current information
  I want Amoun to search the web in real-time
  So that I get accurate, up-to-date answers

  Scenario: Gemini provides grounded search results
    Given I am using Gemini as my active provider
    When I ask "What is the latest news about React 19?"
    Then Amoun should invoke Gemini's grounding tool
    And the response should include real web search results with citations
    And the grounding metadata should be displayed in the message UI

  Scenario: Graceful degradation for non-Gemini providers
    Given I am using Claude as my active provider
    When I ask a question that would benefit from web search
    Then Amoun should respond normally without web results
    And no error should be shown for missing web search capability
```

#### US-007: Scheduled Task Auto-Execution

```gherkin
Feature: Task Auto-Execution (TaskScheduler)
  As a user with recurring tasks
  I want tasks to execute automatically at their scheduled time
  So that I don't have to manually trigger every action

  Scenario: Task auto-executes at scheduled time
    Given I have a task "Generate weekly summary" with dueDate set to 2:00 PM today
    And autoExecute is set to true
    When the TaskScheduler runs its 5-minute check
    And the current time is 2:00 PM or later
    Then the task should be automatically sent to the LLM
    And the execution result should be stored in task.executionResult
    And I should receive a notification with the result
```

#### US-008: PWA Installation

```gherkin
Feature: Installable PWA
  As a user who wants quick access
  I want to install Wazeer OS as a native app
  So that I can launch it from my home screen like any other app

  Scenario: Install from browser
    Given I am using a Chromium-based browser
    When I visit the Wazeer OS URL
    Then the browser should show an install prompt (or install icon in address bar)
    When I click "Install"
    Then Wazeer OS should appear as a standalone app
    And it should work offline for all local features (view chats, tasks, artifacts)
    And the app icon should display the 𓂀 Eye of Horus logo
```

#### US-009: Voice Input/Output in Arabic and English

```gherkin
Feature: Bilingual Voice I/O
  As a bilingual Arabic/English user
  I want to speak to Amoun in either language
  So that I can use the assistant hands-free in my preferred language

  Scenario: Voice input in Arabic
    Given I am in a chat session
    When I click the microphone button and speak in Arabic
    Then the speech should be transcribed to Arabic text
    And the text should be sent to the LLM
    And the LLM response should be in Arabic

  Scenario: Voice output via TTS
    Given I have enabled text-to-speech
    When Amoun responds with a message
    Then the response should be spoken aloud in the same language as the text
    And the TTS should use a natural-sounding voice
```

#### US-010: Enhanced Dashboard with Real Metrics

```gherkin
Feature: Enhanced Dashboard
  As a user who wants to understand my usage patterns
  I want a dashboard with real metrics
  So that I can optimize how I use Amoun

  Scenario: Dashboard shows accurate metrics
    Given I have used Wazeer OS for 1 week
    And I have created 15 tasks, 3 artifacts, and 200 messages
    When I navigate to the dashboard
    Then I should see:
      | Metric | Value |
      | Total Messages | 200 |
      | Active Tasks | 15 |
      | Artifacts Created | 3 |
      | Memories Stored | 42 |
      | Provider Usage (chart) | Gemini: 60%, Claude: 40% |
    And each metric should be calculated from actual IndexedDB data via useEventLogger
    And per-agent cards should show individual agent statistics
```

#### US-011: Prompt Templates

```gherkin
Feature: Prompt Templates
  As a power user who frequently uses similar prompts
  I want to save and reuse prompt templates
  So that I don't have to rewrite complex instructions

  Scenario: Use a saved template
    Given I have saved a prompt template named "Code Review"
    With content "Review this code for security vulnerabilities: {code}"
    When I select the "Code Review" template from the chat input
    Then the template content should be inserted into the chat input
    And I can fill in the {code} placeholder
    And send the complete prompt to the LLM
```

#### US-012: IP Banning (Excommunicado Protocol)

```gherkin
Feature: Excommunicado Protocol
  As a system administrator
  I want malicious IPs to be automatically banned
  So that the proxy is protected from abuse

  Scenario: Excessive requests trigger ban
    Given a client IP has made 100 requests in 1 minute
    When the rate limiter detects the threshold breach
    Then the IP should be added to the banned_nodes store
    And all future requests from that IP should return 403
    And an auth_log entry should be created with reason="rate_limit_exceeded"
```

---

## 5. Success Metrics

### مقاييس النجاح — Product Hunt Launch Criteria

Wazeer OS v2.0 launch will be considered successful if the following metrics are achieved within **30 days** of Product Hunt launch:

| Metric | Target | Measurement Method | Priority |
|--------|--------|--------------------|----------|
| **PWA Install Rate** | > 30% of visitors | `beforeinstallprompt` events / total visitors | 🔴 Critical |
| **Day-1 Retention** | > 40% | Users who return within 24h / total signups | 🔴 Critical |
| **Tasks Created/User** | > 2 avg | Total tasks / active users in period | 🟡 High |
| **Provider Diversity** | > 60% use 2+ providers | Users with keys for 2+ providers / total | 🟡 High |
| **Memory Entries/User** | > 5 avg by Day 7 | Total userMemory entries / active users | 🟡 High |
| **Zero Critical Bugs** | 0 | Crash reports, unhandled rejections, data loss | 🔴 Critical |
| **Auto-Execution Rate** | > 10% of tasks | Tasks auto-executed / total scheduled tasks | 🟢 Medium |
| **Voice Usage** | > 15% of users | Users who use voice I/O at least once / total | 🟢 Medium |
| **Arabic UI Adoption** | > 20% of users | Users who switch to AR locale / total | 🟢 Medium |
| **Lighthouse PWA Score** | > 90 | Chrome Lighthouse audit | 🟡 High |

### Tracking Dashboard

All metrics will be tracked locally via the `useEventLogger` hook and the `logs` IndexedDB store. No external analytics services are used, in keeping with the **Green Code** and **Security as Mindset** principles.

---

## 6. Out of Scope for v2.0

### خارج النطاق — What v2.0 Will NOT Include

The following features are explicitly out of scope for v2.0 and are candidates for v2.1 or v3.0:

| Feature | Reason | Target Version |
|---------|--------|---------------|
| **Multi-user Collaboration** | Requires server-side state sync; contradicts on-device principle | v3.0 |
| **Mobile Native Apps (iOS/Android)** | PWA covers installable use case; native apps are future work | v3.0 |
| **Plugin/Extension System** | Architecture must stabilize first | v2.5 |
| **RAG (Retrieval-Augmented Generation)** | Needs vector DB; too heavy for v2.0 scope | v2.5 |
| **Image Generation** | Out of scope for AI assistant MVP | v2.5 |
| **File System Access API** | Browser support too limited | v3.0 |
| **Email/Calendar Integration** | Requires OAuth2 to external services beyond Google Auth | v2.5 |
| **End-to-End Encryption for LLM Calls** | Provider-side limitation; requires local inference fallback | v3.0 |
| **Multi-language UI (beyond AR/EN)** | Internationalization framework needed | v2.5 |
| **Automated Testing CI/CD** | Testing infrastructure planned separately | v2.1 |
| **White-label / Theming Engine** | Enterprise feature for later | v3.0 |
| **Agent-to-Agent Communication** | Advanced autonomous features | v3.0 |

---

## 7. Competitive Analysis

### التحليل التنافسي — Wazeer OS vs. The Giants

```
┌─────────────────────┬──────────┬──────────┬──────────┬──────────────────┐
│ Feature             │ ChatGPT  │ Claude   │ Gemini   │ Wazeer OS 𓂀     │
├─────────────────────┼──────────┼──────────┼──────────┼──────────────────┤
│ On-Device Storage   │    ❌     │    ❌     │    ❌     │    ✅ IndexedDB  │
│ BYOK                │    ❌     │    ❌     │    ❌     │    ✅ 15+ prov.  │
│ Multi-Provider      │    ❌     │    ❌     │    ❌     │    ✅ Unified    │
│ Persistent Memory   │    ❌     │  Limited  │    ❌     │    ✅ 90-day TTL │
│ Auto Task Extract   │    ❌     │    ❌     │    ❌     │    ✅ 50% prob.  │
│ Scheduled Execution │    ❌     │    ❌     │    ❌     │    ✅ 5-min check│
│ PWA Installable     │    ❌     │    ❌     │    ❌     │    ✅            │
│ Voice AR/EN         │    ❌     │    ❌     │  Limited  │    ✅            │
│ Web Search          │    ✅     │  Limited  │    ✅     │    ✅ (Gemini)   │
│ Open Source         │    ❌     │    ❌     │    ❌     │    ✅            │
│ No Server Deps      │    ❌     │    ❌     │    ❌     │    ✅ Proxy-only │
│ AST Security Scan   │    N/A    │    N/A    │    N/A    │    ✅ HorusGuard │
│ Prompt Sanitizer    │    ✅     │    ✅     │    ✅     │    ✅            │
│ Arabic UI (完整)     │    ❌     │    ❌     │  Partial  │    ✅            │
│ Custom Models       │    ❌     │    ❌     │    ❌     │    ✅ 4-field    │
│ Artifact Extraction │    ✅*    │    ✅*    │    ❌     │    ✅            │
└─────────────────────┴──────────┴──────────┴──────────┴──────────────────┘
* Limited to code artifacts within their own ecosystems
```

### Differentiation Strategy

Wazeer OS does not compete on model quality — it competes on **architecture**:

1. **Privacy by Design:** No server-side storage. Period. The Express proxy only forwards requests.
2. **Provider Agnosticism:** Users are not locked into any single LLM vendor. Switch providers with one click.
3. **Autonomous Action:** Tasks are extracted, scheduled, and executed — turning conversation into action.
4. **Cultural Identity:** Egyptian Cyberpunk design with Arabic/English bilingual support. Built by an Arab developer for a global audience.
5. **Extensibility:** 4-field custom model addition means any OpenAI-compatible API works instantly.

### Pricing Advantage

| Product | Monthly Cost | Data Ownership | Provider Choice |
|---------|-------------|----------------|-----------------|
| ChatGPT Plus | $20/month | OpenAI servers | GPT-4o only |
| Claude Pro | $20/month | Anthropic servers | Claude 3.5 only |
| Gemini Advanced | $20/month | Google servers | Gemini only |
| **Wazeer OS** | **$0 (BYOK)** | **Your device** | **15+ providers** |

---

## 8. Guiding Principles

### المبادئ التوجيهية — The Five Pillars

#### 8.1 Green Code (الكود الأخضر)

- Bundle size must remain under 500KB gzip
- No unnecessary dependencies; every import must justify its weight
- Lazy-load heavy modules (Monaco Editor, xterm.js) on demand
- Use `vite-plugin-pwa` with aggressive caching strategies
- Performance budgets enforced in CI

#### 8.2 Security as Mindset (الأمان كعقلية)

- HorusGuard (@babel/parser) scans all AI-generated code before rendering
- Prompt sanitizer strips injection attempts before sending to LLM
- Excommunicado Protocol bans abusive IPs at the proxy level
- SHA-256 password hashing on the client before transmission
- API keys stored in IndexedDB, never transmitted to our server
- Firebase Auth for OAuth; custom auth for email/password

#### 8.3 Separation of Concerns (فصل المسؤوليات)

```
Presentation Layer    → React Components (UI only, no business logic)
State Layer           → Zustand Stores (state shape + sync to IndexedDB)
Service Layer         → Pure functions + AIGateway (routing, transformation)
Data Layer            → IndexedDB via idb-keyval (persistence only)
Network Layer         → Express Proxy (forward-only, no business logic)
```

#### 8.4 Scalable Architecture (بنية قابلة للتوسع)

- Registry pattern for LLM providers (add new provider = add one file)
- 4-field custom model form enables infinite provider extensibility
- IndexedDB schema versioned (currently v4) with migration paths
- Service functions are pure and testable

#### 8.5 Enterprise Edition (نسخة المؤسسة)

- Comprehensive error handling with retry, circuit breaker, and graceful degradation
- Full TypeScript strictness (no `any` types)
- Event logging for audit trail
- Auth persistence across sessions
- Professional documentation (these very docs)

---

## Appendix A: Glossary

| Term | Arabic | Definition |
|------|--------|------------|
| Wazeer | وزير | Minister/Vizier — the AI operating system |
| Amoun | أمون | The AI agent name (after Amun, king of Egyptian gods) |
| Monmamar | منمار | The IndexedDB database name |
| HorusGuard | حورس جارد | AST-based security scanner for AI code |
| Excommunicado | | IP banning protocol for abusive clients |
| BYOK | | Bring Your Own Key — user provides their own API keys |
| AIGateway | | Unified LLM routing system (v2.0) |
| MemoryEngine | | Cumulative memory extraction and injection system |
| LearningEngine | | Lesson-to-task extraction from AI responses |
| TaskScheduler | | Auto-execution scheduler running every 5 minutes |

---

## Appendix B: Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024-12-01 | 100MillionDEV | Initial PRD for v1 |
| 2.0.0 | 2025-07-13 | 100MillionDEV / العرآب | Complete rewrite for v2.0.0-Rewrite |

---

> صُنع بـ ❤️ بواسطة العرآب | حقوق النشر 100MillionDEV.com  
> 𓂀 Wazeer OS — Enterprise Edition v2.0.0-Rewrite