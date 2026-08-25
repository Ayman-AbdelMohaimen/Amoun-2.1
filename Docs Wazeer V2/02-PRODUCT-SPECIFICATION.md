# 𓂀 Wazeer OS (وزير OS) v2.0.0-Rewrite — Product Specification

> **Document Version:** 2.0.0  
> **Date:** 2025-07-13  
> **Author:** 100MillionDEV / العرآب  
> **Classification:** Enterprise Edition  
> **Agent Name:** Amoun (أمون)  

---

## Table of Contents

1. [Introduction (المقدمة)](#1-introduction)
2. [Functional Requirements — المتطلبات الوظيفية](#2-functional-requirements)
3. [Non-Functional Requirements — المتطلبات غير الوظيفية](#3-non-functional-requirements)
4. [UI/UX Specifications](#4-uiux-specifications)

---

## 1. Introduction

This document specifies **how** Wazeer OS v2.0 should work from the user's perspective. It defines 11 Functional Requirements (FR) with detailed acceptance criteria, and 14 Non-Functional Requirements (NFR). Every requirement traces back to the PRD user stories and the five mandatory principles: Green Code, Security as Mindset, Separation of Concerns, Scalable Architecture, Enterprise Edition.

---

## 2. Functional Requirements

### FR-001: Authentication and Session Management (المصادقة)

| Attribute | Detail |
|-----------|--------|
| **ID** | FR-001 |
| **Priority** | P0 — Critical |
| **Principle** | Security as Mindset |

#### FR-001.1: Email/Password Registration

| Criterion | Specification |
|-----------|--------------|
| Password Hashing | SHA-256 on the **client** before transmission. Never send plaintext. |
| Validation | Email format validation, password min 8 chars, 1 uppercase, 1 number |
| Storage | Firebase Auth for credential management |
| Post-Registration | Auto-login, redirect to dashboard, store session in IndexedDB |
| Admin Detection | If first user registered → mark as `role: 'admin'` in auth_logs |
| Error States | Email already in use → "هذا البريد مسجل مسبقاً" / "Email already registered" |

#### FR-001.2: Login Persistence

| Criterion | Specification |
|-----------|--------------|
| Session Store | `auth_logs` IndexedDB store |
| Auto-Reauth | On app boot: check IndexedDB → attempt silent Firebase reauth → restore session |
| Timeout | Session valid until explicit logout or Firebase token expiry |
| Logout | Clear IndexedDB session, Firebase signOut, redirect to login |
| Multi-Tab | All open tabs share session state via `storage` event listener |

#### FR-001.3: Google OAuth

| Criterion | Specification |
|-----------|--------------|
| Provider | Firebase Auth GoogleAuthProvider |
| Flow | Pop-up OAuth → Firebase token → store session → redirect |
| Fallback | If pop-up blocked → redirect-based OAuth flow |
| Account Linking | If user previously registered with same email, link accounts |

#### Acceptance Criteria

| # | Given | When | Then |
|---|-------|------|------|
| AC-001-1 | Unregistered user on login page | Registers with valid email/password | Account created, auto-logged in, redirected to dashboard |
| AC-001-2 | Registered user on login page | Logs in with correct credentials | Session stored, dashboard displayed |
| AC-001-3 | User refreshes browser | App reloads | Session restored silently, no login prompt |
| AC-001-4 | User clicks "Sign in with Google" | Google OAuth completes | Session created, same UX as email login |
| AC-001-5 | First ever user registers | Registration completes | User marked as admin in auth_logs |
| AC-001-6 | User enters weak password | Submits registration form | Error shown: password requirements listed |

---

### FR-002: Multi-Provider LLM Chat (المحادثة)

| Attribute | Detail |
|-----------|--------|
| **ID** | FR-002 |
| **Priority** | P0 — Critical |
| **Principle** | Scalable Architecture, Separation of Concerns |

#### FR-002.1: Provider Routing via AIGateway

All LLM communication flows through the **unified AIGateway** (v2.0). There is no dual system.

| Criterion | Specification |
|-----------|--------------|
| Architecture | Single `AIGateway` class with provider registry |
| Routing | `AIGateway.route(provider, model, messages, options)` |
| Supported Providers | nvidia, gemini, claude, glm, deepseek, kimi, minimax, qwen, openrouter, openai, groq, mistral, xai, cerebras, ollama |
| Custom Models | Registered via 4-field form, stored in `config` IndexedDB store |
| BYOK | API keys stored per-provider in IndexedDB `config` store |
| Proxy | All requests go through Express proxy at `/api/chat/:provider` |

#### FR-002.2: Streaming Responses

| Criterion | Specification |
|-----------|--------------|
| Protocol | Server-Sent Events (SSE) via Express proxy |
| Client | `EventSource` or `fetch` with `ReadableStream` |
| Display | Characters appear progressively in the chat UI |
| Artifacts | Extracted from completed stream (not partial) |
| Tasks/Memories | Extracted from completed stream (not partial) |

#### FR-002.3: Auto-Fallback

| Criterion | Specification |
|-----------|--------------|
| Trigger | Provider returns 5xx error or timeout (>30s) |
| Action | Automatically retry with next available provider (if configured) |
| User Notification | Toast: "Fallback to [provider] due to [provider] error" |
| Limit | Max 1 fallback attempt per message |

#### FR-002.4: Error Handling

| Error Type | User Message | System Action |
|-------------|-------------|---------------|
| 401 Invalid Key | "API key for [provider] is invalid. Please update in settings." | Log to `logs` store |
| 429 Rate Limit | "Rate limited by [provider]. Please wait before retrying." | Enable retry button |
| 500 Server Error | "[Provider] is experiencing issues. Try again later." | Log error, offer fallback |
| Network Error | "No internet connection. Messages are saved locally." | Queue message for later |
| Timeout | "Response timed out. The provider may be slow." | Retry with extended timeout |

#### FR-002.5: File Attachments

| Criterion | Specification |
|-----------|--------------|
| Supported Types | Images (PNG, JPG, GIF, WebP), PDF, Text, Code files |
| Max Size | 10MB per file, 5 files per message |
| Processing | Read as base64, sent as part of multimodal message content |
| Display | Thumbnail preview in chat bubble |
| Storage | File reference stored in message metadata, not full content |

#### FR-002.6: Four Chat Modes

| Mode | Behavior | System Prompt Modifier |
|------|----------|---------------------|
| **Chat** | Standard conversation | Default Amoun system prompt |
| **Agent** | Autonomous mode with tool use | + tool definitions + ReAct instructions |
| **Code** | Code-focused with syntax highlighting | + coding best practices + language detection |
| **Research** | Web search enabled, citation format | + citation requirements + grounding instructions |

#### FR-002.7: Voice I/O

| Criterion | Specification |
|-----------|--------------|
| Input | Web Speech API (`SpeechRecognition`) |
| Languages | `ar-SA`, `en-US` (auto-detect from UI locale) |
| Output | Web Speech API (`SpeechSynthesis`) or provider TTS |
| Activation | Microphone button in chat input |
| Visual Feedback | Pulsing animation while listening |
| Auto-Detect | Language detected from first 2 seconds of speech |

#### FR-002.8: Gemini Tool Calling (ReAct Loop)

| Criterion | Specification |
|-----------|--------------|
| Pattern | ReAct (Reason + Act) loop for Gemini in Agent mode |
| Max Iterations | 3 tool calls per user message |
| Tool: Web Search | Gemini grounding with Google Search |
| Tool: Code Execution | Gemini code execution sandbox |
| Loop Termination | Max iterations reached OR model emits final answer |
| Display | Each tool call shown as collapsible step in message |

#### Acceptance Criteria

| # | Given | When | Then |
|---|-------|------|------|
| AC-002-1 | User has Gemini key configured | Sends message | Response streamed via AIGateway → Gemini |
| AC-002-2 | User has Claude and Gemini keys | Gemini returns 500 | Auto-fallback to Claude, user notified |
| AC-003-3 | User in Agent mode with Gemini | Asks to search web | ReAct loop invokes grounding tool, max 3 iterations |
| AC-002-4 | User attaches image | Sends with text message | Image sent as base64 in multimodal content |
| AC-002-5 | User clicks microphone | Speaks in Arabic | Speech transcribed to Arabic text, sent to LLM |
| AC-002-6 | User switches chat mode to Code | Sends coding question | Response with code formatting and syntax highlighting |

---

### FR-003: Custom Model Addition (إضافة نموذج مخصص)

| Attribute | Detail |
|-----------|--------|
| **ID** | FR-003 |
| **Priority** | P1 — High |
| **Principle** | Scalable Architecture |

#### 4-Field Model Addition Form

| Field | Type | Validation | Example |
|-------|------|------------|--------|
| **Provider** | Select dropdown | Must be from supported list or "custom" | `ollama`, `openrouter` |
| **Model ID** | Text input | Non-empty, alphanumeric + dots/colons/hyphens | `llama3:70b`, `gpt-4o-mini` |
| **API Key** | Password input | Required unless provider is `ollama` (local) | `sk-...` or empty for local |
| **Endpoint** | URL input | Must be valid URL, HTTPS preferred | `http://localhost:11434/v1` |

#### Behavior

```
User fills form → validate all 4 fields → save API key to config store
  → add model to customModels array in config → refresh dropdown
  → model immediately available in provider selector → success toast
```

#### Auto-Populate Dropdown

When a provider is selected from the dropdown:
- If the provider has known models, show them as suggestions
- User can accept suggestion or type custom model ID
- Known models list is embedded in the provider registry, not fetched externally

#### Persistence

| Storage | Location | Schema |
|---------|----------|--------|
| API Key | `config` IndexedDB store | `config.apiKeys[provider] = key` |
| Custom Model | `config` IndexedDB store | `config.customModels.push({ provider, modelId, endpoint })` |

#### Acceptance Criteria

| # | Given | When | Then |
|---|-------|------|------|
| AC-003-1 | User on settings page | Fills 4 fields with valid Ollama local model | Model saved, appears in dropdown, chat works |
| AC-003-2 | User selects "openrouter" provider | Types model ID | Known OpenRouter models suggested as autocomplete |
| AC-003-3 | User submits with empty Model ID | Form does not submit, error highlighted |
| AC-003-4 | User selects ollama | API Key field shows "Optional (local)" placeholder |
| AC-003-5 | User adds 3 custom models | All 3 appear in model selector dropdown |

---

### FR-004: Task Management (إدارة المهام)

| Attribute | Detail |
|-----------|--------|
| **ID** | FR-004 |
| **Priority** | P0 — Critical |
| **Principle** | Separation of Concerns |

#### FR-004.1: Manual Task CRUD

| Operation | Specification |
|-----------|-------------|
| **Create** | Click "+" button → form with title, description, priority, dueDate, tags |
| **Read** | Task list with sort/filter (by priority, dueDate, status, tags) |
| **Update** | Click task → edit form → save changes |
| **Delete** | Click delete → confirmation dialog → remove from store |

#### FR-004.2: AI Task Extraction (LearningEngine)

| Criterion | Specification |
|-----------|--------------|
| Trigger | After every AI response completion |
| Probability | 50% chance of extraction attempt per response |
| Method | Send response to LLM with extraction prompt |
| Output | Array of task objects or empty array |
| Source | `source: 'ai_extraction'` |
| User Control | Toggle in settings: "Auto-extract tasks from conversations" |

#### FR-004.3: Enriched Task Schema

```typescript
interface Task {
  id: string;                  // UUID
  title: string;               // Required
  description?: string;        // Optional
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;            // ISO 8601 datetime
  tags: string[];              // User or AI-assigned tags
  source: 'manual' | 'ai_extraction';
  createdAt: string;           // ISO 8601
  updatedAt: string;           // ISO 8601
  completedAt?: string;        // ISO 8601
  autoExecute: boolean;        // Enable scheduled execution
  executionResult?: string;    // LLM output from auto-execution
  sessionId?: string;          // Originating chat session
}
```

#### FR-004.4: Scheduled Auto-Execution

| Criterion | Specification |
|-----------|--------------|
| Scheduler | `TaskScheduler` class, runs every 5 minutes via `setInterval` |
| Check Logic | Find tasks where `dueDate <= now && autoExecute === true && status === 'pending'` |
| Execution | Generate prompt from task context → send to LLM via AIGateway → store result |
| Status Update | On success: `status = 'completed'`, `executionResult = response` |
| On Failure | `status = 'failed'`, `executionResult = error.message` |
| Notification | Show toast with execution result summary |

#### Acceptance Criteria

| # | Given | When | Then |
|---|-------|------|------|
| AC-004-1 | User creates task manually | Fills title and clicks save | Task appears in list with status "pending" |
| AC-004-2 | AI response mentions actionable items | LearningEngine runs (50% chance) | Tasks extracted and added to list |
| AC-004-3 | Task has dueDate in past + autoExecute | TaskScheduler runs | Task auto-executed, result stored |
| AC-004-4 | User filters tasks by tag "work" | Filter applied | Only tasks with "work" tag shown |
| AC-004-5 | User deletes a task | Confirms deletion | Task removed from IndexedDB |

---

### FR-005: Cumulative Memory (الذاكرة التراكمية)

| Attribute | Detail |
|-----------|--------|
| **ID** | FR-005 |
| **Priority** | P1 — High |
| **Principle** | Enterprise Edition |

#### MemoryEngine Pipeline

```
AI Response Complete
    ↓
Extraction Pass (50% probability, same LLM call as task extraction)
    ↓
Extract memories as key-value facts: { key: "user_workplace", value: "ACME Corp" }
    ↓
Deduplicate against existing userMemory store (by key)
    ↓
Store new/updated memories in userMemory IndexedDB store
    ↓
TTL: 90 days from createdAt
    ↓
On next chat: inject all active memories into system prompt as context
```

#### Memory Store Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID |
| `key` | string | Descriptive key (e.g., "user_name", "project_deadline") |
| `value` | string | The remembered fact |
| `category` | string | Auto-classified: "personal", "work", "preference", "fact" |
| `sessionId` | string | Originating conversation |
| `createdAt` | string | ISO 8601 timestamp |
| `expiresAt` | string | createdAt + 90 days |
| `accessCount` | number | Times this memory was injected into prompts |

#### System Prompt Injection Format

```
[Memory Context]
The user has shared the following information in previous conversations:
- Name: Ahmed
- Workplace: ACME Corp
- Preferred Language: Arabic
- Current Project: Wazeer OS v2.0
[End Memory Context]
```

#### Acceptance Criteria

| # | Given | When | Then |
|---|-------|------|------|
| AC-005-1 | User mentions their name in conversation | MemoryEngine runs | Name stored in userMemory |
| AC-005-2 | User starts new chat session | System prompt assembled | Memory context injected |
| AC-005-3 | Memory is 91 days old | Cleanup runs | Memory marked for deletion |
| AC-005-4 | Same fact mentioned twice | Second extraction | Existing memory updated, not duplicated |

---

### FR-006: Real Web Search (البحث الحقيقي)

| Attribute | Detail |
|-----------|--------|
| **ID** | FR-006 |
| **Priority** | P1 — High |

| Criterion | Specification |
|-----------|--------------|
| Provider | Gemini only (via `google_search_retrieval` grounding) |
| Mode | Available in "Agent" and "Research" chat modes |
| Trigger | User question implies need for current information, or explicit request |
| Display | Grounding chunks shown as expandable citations below response |
| Graceful Degradation | Non-Gemini providers: respond normally, no search, no error |

---

### FR-007: Scheduled Auto-Execution (التنفيذ المجدول)

Covered in FR-004.4. Additional specification:

| Criterion | Specification |
|-----------|--------------|
| Auto-Prompt Generation | `"Execute this task: {title}. Context: {description}. Current date: {now}."` |
| Concurrency | Only 1 task executed at a time (queue subsequent) |
| Rate Limit | Minimum 1 minute between auto-executions |
| Visibility | "Last executed" timestamp shown on dashboard |

---

### FR-008: Unified LLM Gateway (بوابة LLM الموحدة)

| Attribute | Detail |
|-----------|--------|
| **ID** | FR-008 |
| **Priority** | P0 — Critical |
| **Principle** | Scalable Architecture |

#### Registry Pattern

```typescript
class AIGateway {
  private providers: Map<string, ProviderAdapter> = new Map();

  register(name: string, adapter: ProviderAdapter): void { ... }
  async route(provider: string, model: string, messages, options): Promise<Stream> { ... }
  getAvailableProviders(): ProviderInfo[] { ... }
}
```

| Criterion | Specification |
|-----------|--------------|
| Single System | One AIGateway instance, no legacy/dual systems |
| Provider Adapters | Each provider implements `ProviderAdapter` interface |
| BYOK Resolution | API keys fetched from IndexedDB `config` store at request time |
| Capability Routing | Some features only available for certain providers (e.g., grounding = Gemini only) |
| Custom Models | Registered dynamically via FR-003 form |

---

### FR-009: Enhanced Dashboard (لوحة المعلومات المحسّنة)

| Attribute | Detail |
|-----------|--------|
| **ID** | FR-009 |
| **Priority** | P1 — High |

#### Real Metrics (via useEventLogger)

| Metric | Source | Display |
|--------|--------|---------|
| Total Messages | `logs` store count | Number card |
| Active Tasks | `state` store filtered count | Number card |
| Artifacts Created | `artifacts` store count | Number card |
| Memories Stored | `userMemory` store count | Number card |
| Provider Usage | Aggregated from `logs` | Pie/bar chart |
| Daily Activity | Aggregated from `logs` by date | Line chart |
| Sessions This Week | `logs` distinct session count | Number card |

#### Per-Agent Cards

| Card | Contents |
|------|----------|
| Agent Name + Avatar | Configured agent identity |
| Messages Sent | Count for this agent |
| Tasks Created | Count for this agent |
| Last Active | Timestamp of last interaction |
| Model Used | Current provider/model pairing |

---

### FR-010: Prompt Templates (قوالب المطالبات)

| Attribute | Detail |
|-----------|--------|
| **ID** | FR-010 |
| **Priority** | P2 — Medium |

| Criterion | Specification |
|-----------|--------------|
| CRUD | Create, edit, delete, and use templates |
| Variables | Templates support `{variable}` placeholders |
| Storage | `config` IndexedDB store under `config.promptTemplates` |
| Insertion | Click template → inserted into ChatInput with cursor at first `{...}` |
| Pre-built | Ship with 5 default templates (Code Review, Translation, Summary, Debug, Explain) |

---

### FR-011: Artifact Extraction (استخراج الاصطناعات)

| Attribute | Detail |
|-----------|--------|
| **ID** | FR-011 |
| **Priority** | P1 — High |

| Criterion | Specification |
|-----------|--------------|
| Trigger | AI response contains code blocks, tables, or structured data |
| Extraction | Post-processing of completed response |
| Types | `code`, `markdown`, `table`, `json`, `mermaid` |
| Storage | `artifacts` IndexedDB store |
| Display | Separate artifact panel with syntax highlighting (Monaco Editor for code) |
| Actions | Copy, download, open in Monaco, insert into chat |

---

## 3. Non-Functional Requirements

### NFR-001: Performance (الأداء)

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| NFR-001-1 | First Contentful Paint | < 1.5s | Lighthouse CI |
| NFR-001-2 | Time to Interactive | < 3.0s | Lighthouse CI |
| NFR-001-3 | Bundle Size (gzip) | < 500KB | Vite build output |
| NFR-001-4 | Time to First Token | < 2.0s | Client-side timer (after network) |
| NFR-001-5 | IndexedDB Read | < 50ms | Performance API |
| NFR-001-6 | IndexedDB Write | < 100ms | Performance API |

### NFR-002: Reliability (الموثوقية)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-002-1 | Crash-free Rate | > 99.5% |
| NFR-002-2 | Data Persistence | Zero data loss on normal exit |
| NFR-002-3 | Offline Functionality | All local features work offline |
| NFR-002-4 | Recovery | Auto-recovery from IndexedDB corruption (re-create on version mismatch) |

### NFR-003: Security (الأمان)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-003-1 | No `any` Types | 100% TypeScript strict mode |
| NFR-003-2 | HorusGuard Scanning | All AI-generated code scanned before rendering |
| NFR-003-3 | Prompt Sanitization | All user inputs sanitized before LLM transmission |
| NFR-003-4 | Excommunicado Protocol | IP banning after threshold breach |
| NFR-003-5 | API Key Storage | Encrypted in IndexedDB, never sent to Wazeer server |
| NFR-003-6 | No Keys in Network | API keys only sent to respective LLM provider endpoints |
| NFR-003-7 | Content Security Policy | Strict CSP headers on Express proxy |

### NFR-004: Usability (سهولة الاستخدام)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-004-1 | Onboarding | < 3 steps to first chat |
| NFR-004-2 | Language Switch | One-click AR ↔ EN toggle |
| NFR-004-3 | Empty States | Every empty list/view has helpful guidance |
| NFR-004-4 | Error Messages | Human-readable, bilingual, actionable |
| NFR-004-5 | Keyboard Shortcuts | All primary actions accessible via keyboard |

### NFR-005: Accessibility (إمكانية الوصول)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-005-1 | WCAG Compliance | Level AA |
| NFR-005-2 | Screen Reader | All interactive elements labeled |
| NFR-005-3 | Focus Management | Visible focus indicators, logical tab order |
| NFR-005-4 | Color Contrast | Minimum 4.5:1 ratio |
| NFR-005-5 | RTL Support | Full right-to-left layout for Arabic |

### NFR-006: Scalability (قابلية التوسع)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-006-1 | Provider Addition | New provider = 1 adapter file + 1 registry call |
| NFR-006-2 | Custom Models | Unlimited custom models via 4-field form |
| NFR-006-3 | Chat History | No hard limit; paginated loading |
| NFR-006-4 | Concurrent Sessions | Multiple chat sessions open simultaneously |

### NFR-007: Maintainability (قابلية الصيانة)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-007-1 | File Size Limit | < 500 lines per file |
| NFR-007-2 | Component Size | < 300 lines per component |
| NFR-007-3 | No Circular Dependencies | Enforced via ESLint rule |
| NFR-007-4 | Documentation | Every public function JSDoc'd |
| NFR-007-5 | Test Coverage | > 80% for service layer |

---

## 4. UI/UX Specifications

### Design System: Egyptian Cyberpunk

| Element | Specification |
|---------|-------------|
| **Theme** | Dark mode primary, glassmorphic panels |
| **Colors** | Deep black (#0a0a0f) base, electric blue (#00d4ff) accent, gold (#ffd700) highlight |
| **Glass Effect** | `backdrop-blur-xl bg-white/5 border border-white/10` |
| **Glow Accents** | `shadow-[0_0_15px_rgba(0,212,255,0.3)]` on active elements |
| **Typography** | Inter for English, Cairo for Arabic |
| **Animations** | Framer Motion 12 for transitions, page switches, and micro-interactions |
| **Iconography** | lucide-react icon set throughout |
| **Logo** | 𓂀 (Eye of Horus) — displayed in navbar, PWA icon, and loading states |

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  𓂀 Wazeer OS    [Dashboard] [Chat] [Tasks] [Settings]  │  ← Navbar
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│   Sidebar    │           Main Content Area              │
│   (Sessions  │                                          │
│    + Agents) │    (Chat / Tasks / Dashboard / etc.)     │
│              │                                          │
│              │                                          │
├──────────────┴──────────────────────────────────────────┤
│  صُنع بـ ❤️ بواسطة العرآب | حقوق النشر 100MillionDEV.com  │  ← Footer
└─────────────────────────────────────────────────────────┘
```

---

> صُنع بـ ❤️ بواسطة العرآب | حقوق النشر 100MillionDEV.com  
> 𓂀 Wazeer OS — Enterprise Edition v2.0.0-Rewrite
