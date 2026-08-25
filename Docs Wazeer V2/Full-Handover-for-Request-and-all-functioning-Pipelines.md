# 𓂀 Wazeer OS v2.0.0-Rewrite — Full Handover Document

> **MASTER REFERENCE** — This document is the single source of truth for the entire Wazeer OS codebase.
> Every pipeline, store, service, component, and known issue is documented here.

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [All Functioning Pipelines](#2-all-functioning-pipelines)
3. [Complete File Inventory](#3-complete-file-inventory)
4. [Store API Reference](#4-store-api-reference)
5. [Service API Reference](#5-service-api-reference)
6. [Integration Map](#6-integration-map)
7. [Known Issues from v0.x](#7-known-issues-from-v0x)
8. [v2.0 Changes Summary](#8-v20-changes-summary)
9. [How to Extend](#9-how-to-extend)
10. [Green Code Compliance Checklist](#10-green-code-compliance-checklist)

---

## 1. Project Summary

### What is Wazeer OS?

Wazeer OS (وزير OS) is a **Progressive Web App (PWA)** personal AI assistant. It features an AI agent named **Amoun (أمون)** who handles chat, code generation, web search, task management, and learning. The design follows an **Egyptian Cyberpunk** aesthetic — dark theme with neon green/gold accents and hieroglyphic branding (𓂀).

### Core Identity

| Field | Value |
|-------|-------|
| App Name | Wazeer OS / وزير OS |
| AI Agent Name | Amoun / أمون |
| Logo | 𓂀 (Eye of Horus, U+13080) |
| Developer | 100MillionDEV / العرآب |
| Footer | "صُنع بـ ❤️ بواسطة العرآب \| حقوق النشر 100MillionDEV.com" |
| Internal Codename | Amoun (code comments/docs only) |
| Lore Names | Zomra, Archon (README lore section only) |
| Design | Egyptian Cyberpunk |
| License | Proprietary © 100MillionDEV.com |

### Current State (v0.x → v2.0)

| Area | v0.x State | v2.0 Target |
|------|-----------|-------------|
| Chat | ✅ Working (7 providers, streaming) | Enhanced (grounding, better errors) |
| Auth | ⚠️ Partial (login works, session doesn't persist) | Fixed (silentReAuth, registration UI) |
| Search | ⚠️ Mocked (fake results) | Real (Gemini grounding) |
| Learning | ❌ Not implemented | NEW (task + memory extraction) |
| Agents | ⚠️ Partial (Amoun active, others stub) | Enhanced (dashboard cards, Hermes planned) |
| Tasks | ✅ Basic CRUD | Enhanced (AI extraction, scheduling, enriched schema) |
| Security | ⚠️ Basic HorusGuard | Enhanced (broader AST patterns) |
| PWA | ✅ Working | Enhanced (better offline, sync) |

---

## 2. All Functioning Pipelines

### Pipeline 1: Chat Pipeline

**The primary pipeline. Every user message flows through this.**

```
USER TYPES MESSAGE IN CHAT INPUT
│
├──► ChatInput.handleSend(text)
│   ├──► Create user Message { id, role:'user', content, timestamp, attachments? }
│   ├──► workspaceStore.addMessage(message)
│   ├──► Set workspaceStore.isGenerating = true
│   └──► swarmStore.updateAgentStatus('amoun', 'working')
│       swarmStore.updateAgentTask('amoun', 'Responding to user')
│
├──► PROCESS FILE ATTACHMENTS (if any)
│   ├──► Image files → base64 encode → VLM content part
│   ├──► .docx files → mammoth.js → plain text content part
│   └──► Text files → UTF-8 decode → text content part
│
├──► AI GATEWAY PROCESSING
│   │
│   ├──► 1. BUILD SYSTEM PROMPT
│   │   ├── Base: Amoun persona (bilingual AR/EN, Egyptian Cyberpunk tone)
│   │   ├── Mode: general | coding | brainstorm | files prefix
│   │   └── Memories: MemoryEngine.getRelevantMemories(userMessage, 10)
│   │       └── MemoryEngine.injectMemories(systemPrompt, memories)
│   │
│   ├──► 2. BUILD MESSAGE HISTORY
│   │   └── Last N messages from workspaceStore + current user message
│   │
│   ├──► 3. RESOLVE PROVIDER
│   │   ├── Read workspaceStore.activeModel (e.g., 'gemini-2.0-flash')
│   │   ├── Match to PROVIDER_CONFIG registry
│   │   └── Get API key from env vars or user config
│   │
│   ├──► 4. ROUTE TO PROVIDER
│   │   ├── gemini → streamViaGeminiSDK() (native SDK streaming)
│   │   ├── claude → fetchViaClaudeAPI() (JSON, non-streaming)
│   │   └── others → streamViaProxy() (SSE via Express /api/proxy/{id})
│   │
│   ├──► 5. STREAM RESPONSE TO UI
│   │   ├── Create assistant Message (initially empty)
│   │   ├── For each chunk: workspaceStore.updateMessage(id, content + chunk)
│   │   └── swarmStore.recordAgentTokens('amoun', chunk.tokenCount)
│   │
│   ├──► 6. TOOL CALLING (Gemini only)
│   │   ├── Parse tool_use from response
│   │   ├── Execute tool: write_file | read_file | list_dir | run_command | search_web
│   │   ├── Send tool_result back to model
│   │   └── Loop max 3 iterations (ReAct)
│   │
│   └──► 7. POST-PROCESSING (after full response)
│       │
│       ├──► ARTIFACT EXTRACTION
│       │   ├── Regex scan: /```(\w+)\n([\s\S]*?)```/g
│       │   ├── Filter: skip < 20 chars, skip text/markdown blocks
│       │   ├── Generate filename: artifact_1.ts, artifact_2.py
│       │   └── Save to IndexedDB 'wazir-artifacts' store
│       │
│       ├──► TASK EXTRACTION (50% probability)
│       │   ├── LearningEngine.extractTasks(aiMessage.content, context)
│       │   ├── Heuristic patterns: "need to", "يجب", TODO:, checkboxes
│       │   ├── Infer priority from keywords
│       │   └── workspaceStore.addTask(task) for each extracted
│       │
│       ├──► MEMORY EXTRACTION (30% probability)
│       │   ├── LearningEngine.extractMemories(messages, sessionId)
│       │   ├── Send conversation to AI with extraction prompt
│       │   ├── Parse structured JSON: preferences, facts, decisions, skills
│       │   ├── Deduplicate against existing memories (85% similarity)
│       │   └── MemoryEngine.saveMemory(candidate) for each unique
│       │
│       └──► AGENT METRICS UPDATE
│           ├── swarmStore.incrementAgentTasks('amoun')
│           ├── swarmStore.updateAgentStatus('amoun', 'success')
│           └── swarmStore.resetAgentRetry('amoun')
│
└──► CLEANUP
    ├── workspaceStore.isGenerating = false
    ├── swarmStore.updateAgentTask('amoun', null)
    └── Auto-scroll to bottom of chat
```

### Pipeline 2: Auth Pipeline

```
APP BOOTSTRAP (main.tsx)
│
├──► 1. SILENT RE-AUTH
│   ├── Read localStorage('wazir_session_token')
│   ├── No token → return null → show LoginModal
│   ├── Read IndexedDB 'wazir_user' from configStore
│   ├── No user → clear token → return null
│   ├── Token matches → return AuthenticatedUser
│   └── Mismatch → clear token → return null
│
├──► 2. LOGIN (EMAIL/PASSWORD)
│   ├── User fills email + password in LoginModal
│   ├── AuthService.loginUser(email, password)
│   │   ├── Find user in IndexedDB 'users' store by email
│   │   ├── SHA-256 hash provided password
│   │   ├── Compare with stored passwordHash
│   │   ├── Generate UUID session token → localStorage
│   │   ├── Save as 'wazir_user' in configStore
│   │   └── Log to 'auth_logs' store
│   └── Close modal, show TopBar avatar
│
├──► 3. REGISTER (v2.0 — NEW)
│   ├── User fills email + password + name in LoginModal registration tab
│   ├── AuthService.registerUser(email, password, name)
│   │   ├── Validate email format, password length
│   │   ├── Check duplicate in 'users' store
│   │   ├── SHA-256 hash password
│   │   ├── Create User record, save to 'users' store
│   │   ├── Set as 'wazir_user' in configStore
│   │   ├── If first user ever → isAdmin = true
│   │   ├── Generate UUID token → localStorage
│   │   └── Log to 'auth_logs'
│   └── Auto-login, close modal
│
├──► 4. GOOGLE OAUTH
│   ├── User clicks Google button in LoginModal
│   ├── AuthService.loginOAuth()
│   │   ├── new GoogleAuthProvider({ prompt: 'select_account' })
│   │   ├── signInWithPopup(firebaseAuth, provider)
│   │   ├── Extract email, displayName, photoURL
│   │   ├── Check local user record, create if missing
│   │   ├── Generate token → localStorage
│   │   ├── Save as 'wazir_user'
│   │   └── Log to 'auth_logs'
│   └── Close modal, show avatar
│
└──► 5. LOGOUT
    ├── User clicks logout in TopBar menu
    ├── AuthService.logoutUser()
    │   ├── Remove localStorage('wazir_session_token')
    │   ├── Remove 'wazir_user' from configStore
    │   └── Log to 'auth_logs'
    └── Reset UI state, show LoginModal
```

### Pipeline 3: Learning Pipeline

```
AI RESPONSE FULLY RECEIVED
│
├──► 1. TASK EXTRACTION (50% probability)
│   ├── LearningEngine.extractTasks(aiMessage.content, { sessionId, source:'ai' })
│   ├── Scan each line against TASK_PATTERNS:
│   │   EN: "don't forget to", "need to", "should", TODO:, checkboxes, imperative verbs
│   │   AR: "يجب", "لا تنسَ", "تذكر", "من الضروري", "نحتاج"
│   ├── For each match → create Task object:
│   │   { id, text, completed:false, source:'ai', priority:inferred, dueDate:null, tags:[],
│   │     createdAt, completedAt:null, executionResult:null, sourceSessionId }
│   └── workspaceStore.addTask(task) for each
│
├──► 2. MEMORY EXTRACTION (30% probability)
│   ├── Get last 10 messages from current session
│   ├── LearningEngine.extractMemories(messages, sessionId)
│   │   ├── Send conversation to fast extraction model with structured prompt
│   │   ├── Parse JSON response: { preferences, facts, decisions, skills, relationships, goals }
│   │   └── Return MemoryCandidate[] with confidence scores
│   ├── For each candidate:
│   │   ├── Compute similarity against all existing memories (Jaccard)
│   │   ├── If similarity > 85% → update existing (if higher confidence), skip new
│   │   ├── If confidence < 0.5 → discard
│   │   └── Else → save to 'userMemory' IndexedDB store
│   └── Toast notification: "3 tasks extracted" / memories are silent
│
└──► 3. METRICS UPDATE
    ├── No explicit metrics for learning (it's a background benefit)
    └── Future: track extraction accuracy, memory count, hit rate
```

### Pipeline 4: Task Auto-Execution Pipeline

```
TASK SCHEDULER (runs every 5 minutes)
│
├──► 1. CHECK FOR DUE TASKS
│   ├── Get all tasks from workspaceStore
│   ├── Filter: !completed AND dueDate !== null AND dueDate <= now AND executionResult === null
│   └── No due tasks → return, sleep 5 minutes
│
├──► 2. EXECUTE EACH DUE TASK
│   ├── For each due task:
│   │   ├── workspaceStore.updateTask(id, { executionResult: 'executing...' })
│   │   │
│   │   ├── Build prompt:
│   │   │   "Execute this scheduled task: {task.text}
│   │   │    Context: {task.tags.join(', ')}
│   │   │    Provide a concise execution result."
│   │   │
│   │   ├── aiGateway.executeSinglePrompt(prompt, { enableTools:false, enableExtraction:false })
│   │   │
│   │   ├── On success:
│   │   │   ├── workspaceStore.updateTask(id, {
│   │   │   │     completed: true,
│   │   │   │     completedAt: Date.now(),
│   │   │   │     executionResult: result
│   │   │   │   })
│   │   │   └── Toast: "📋 Scheduled task completed: {task.text}"
│   │   │
│   │   └── On error:
│   │       └── workspaceStore.updateTask(id, {
│   │           executionResult: `Error: ${error.message}`
│   │         })
│   │         // Task remains uncompleted, will retry next cycle
│   └── Sleep 5 minutes until next check
│
└──► 3. FAILURE HANDLING
    ├── 3 failed attempts → task gets ⛔ indicator
    └── User must manually intervene or delete
```

### Pipeline 5: Model Addition Pipeline

```
USER OPENS SETTINGS → MODEL MANAGEMENT
│
├──► 1. USER FILLS ADD MODEL FORM (4 fields)
│   ├── Model ID: "my-custom-model" (unique identifier)
│   ├── Display Name: "My Custom Model" (shown in dropdown)
│   ├── Provider: "custom" (from dropdown of registered providers)
│   └── API Key: "sk-..." (stored in user config, NOT IndexedDB)
│
├──► 2. VALIDATION
│   ├── Model ID: non-empty, no spaces, unique in user's model list
│   ├── Display Name: non-empty, max 50 chars
│   ├── Provider: must exist in PROVIDER_CONFIG registry
│   └── API Key: non-empty (if provider requires one)
│
├──► 3. SAVE
│   ├── Add to user's models array in configStore
│   ├── Persist to IndexedDB
│   └── Available immediately in model dropdown
│
├──► 4. USE
│   ├── User selects model from dropdown in ChatInput
│   ├── workspaceStore.setActiveModel(modelId)
│   └── Next chat message routes to the selected provider/model
│
└──► 5. CHAT
    └── AIGateway resolves model → provider → streams response
```

### Pipeline 6: Search Pipeline (v2.0 — Gemini Grounding)

```
USER ASKS SOMETHING REQUIRING CURRENT INFO
(e.g., "What is the latest version of Node.js?")
│
├──► 1. MODEL CHECK
│   ├── Active provider is Gemini?
│   │   ├── YES → enable googleSearchRetrieval in model tools
│   │   └── NO  → search unavailable, no tool declared
│
├──► 2. GEMINI PROCESSES WITH GROUNDING
│   ├── Gemini model receives the prompt with googleSearchRetrieval: {} enabled
│   ├── Model internally decides to search Google
│   ├── Model queries Google Search (transparent to Wazeer OS)
│   ├── Model generates response using search results
│   └── Response includes groundingMetadata:
│       { groundingChunks: [{ web: { uri, title } }],
│         groundingSupports: [{ segment, confidenceScores }] }
│
├──► 3. RESPONSE STREAMED TO UI
│   ├── Text content streamed as usual
│   └── Grounding metadata attached to the ChatMessage object
│
└──► 4. UI RENDERS SOURCES
    ├── MessageBubble detects groundingMetadata
    └── Renders GroundingSources component below the response:
        "𓂀 Sources: [🔗 Node.js Blog] [🔗 GitHub Releases]"
```

### Pipeline 7: Security Pipeline (HorusGuard)

```
AI RESPONSE RECEIVED (full text)
│
├──► 1. INPUT SANITIZATION (before AI call)
│   ├── User message trimmed
│   ├── Dangerous HTML tags stripped
│   └── File attachment names sanitized
│
├──► 2. LLM PROCESSES (external — cannot control)
│   └── AI generates response (may contain malicious code)
│
├──► 3. OUTPUT SCAN — HORUSGUARD AST
│   ├── Parse response with @babel/parser (JS/JSX/TSX)
│   ├── Traverse AST with @babel/traverse
│   ├── CHECK 1: Prototype Pollution
│   │   └── Detect: Object.assign(target, userProvided), __proto__, constructor[
│   ├── CHECK 2: XSS Patterns
│   │   └── Detect: innerHTML, document.write, eval(), new Function()
│   ├── CHECK 3: Dangerous Globals
│   │   └── Detect: window.location manipulation, cookie access
│   └── CHECK 4: Import/Require Injection
│       └── Detect: dynamic imports with user input, require(variable)
│
├──► 4. SCAN RESULT
│   ├── No issues → Render response normally
│   ├── Issues found →
│   │   ├── 7orus agent status updated: 'working', task: "X issues detected"
│   │   ├── Strip or warn about dangerous code blocks
│   │   └── Add warning banner to message:
│   │       "⚠️ HorusGuard detected potential security issues in this response"
│   └── Fatal issue (prototype pollution) →
│       └── Replace code block with warning, do not execute
│
├──► 5. RENDER
│   ├── Safe text rendered in MessageBubble
│   ├── Code blocks rendered in syntax-highlighted preview (not executed)
│   └── Artifact code only runs when user explicitly opens in editor
│
└──► 6. TOOL EXECUTION SECURITY
    ├── Tool calls from Gemini are validated before execution
    ├── run_command tool: command text scanned by HorusGuard
    └── write_file tool: content scanned before saving
```

### Pipeline 8: Artifact Pipeline

```
AI RESPONSE CONTAINS CODE BLOCKS
│
├──► 1. EXTRACT (post-response processing)
│   ├── Regex: /```(\w+)\n([\s\S]*?)```/g
│   ├── For each match:
│   │   ├── language = match[1] (e.g., 'typescript', 'python')
│   │   ├── code = match[2].trim()
│   │   ├── Skip if code.length < 20
│   │   ├── Skip if language is 'text' or 'markdown'
│   │   └── Create Artifact:
│   │       { id: uuid(), sessionId, language, filename, code, createdAt, messageId }
│   └── Collect all artifacts
│
├──► 2. SAVE TO INDEXEDDB
│   ├── Store: 'wazir-artifacts'
│   ├── Key: artifact.id
│   └── Value: full Artifact object
│
├──► 3. UI DISPLAY
│   ├── Below the message, artifact cards appear:
│   │   ┌─────────────────────────────┐
│   │   │ 📄 artifact_1.ts  [Open]  │
│   │   │ TypeScript • 42 lines     │
│   │   └─────────────────────────────┘
│   └── Clicking "Open" → opens in AmounEditor
│
├──► 4. PREVIEW / EDIT (AmounEditor)
│   ├── Monaco Editor opens with the artifact code
│   ├── User can edit the code
│   ├── User can rename the file
│   └── User can download the file
│
└──► 5. DELETE
    ├── User clicks delete on artifact card
    ├── Confirm dialog
    └── del(artifact.id, artifactsStore) from IndexedDB
```

### Pipeline 9: Memory Pipeline

```
CONVERSATION HAPPENS
│
├──► PHASE 1: EXTRACTION (after AI response)
│   ├── 30% probability trigger
│   ├── Send last 10 messages to AI with extraction prompt
│   ├── AI returns structured JSON:
│   │   { preferences: [...], facts: [...], decisions: [...],
│   │     skills: [...], relationships: [...], goals: [...] }
│   └── Parse into MemoryCandidate[]
│
├──► PHASE 2: CATEGORIZE
│   ├── Each candidate already has a category from AI
│   └── Categories: preference, fact, decision, skill, relationship, goal
│
├──► PHASE 3: DEDUPLICATE
│   ├── For each candidate:
│   │   ├── Compute Jaccard similarity against all existing memories
│   │   ├── similarity > 85% → duplicate
│   │   │   ├── If new confidence > existing → update existing
│   │   │   └── Else → skip
│   │   └── similarity <= 85% → unique → continue to save
│
├──► PHASE 4: STORE
│   ├── IndexedDB store: 'wazir-user-memory'
│   ├── Schema: autoIncrement ID, indexes on category, createdAt, sourceSession
│   └── Save Memory { category, content, confidence, sourceSessionId, createdAt, lastAccessedAt, accessCount }
│
├──► PHASE 5: INJECT (on NEXT chat message)
│   ├── Before sending to AI:
│   │   ├── MemoryEngine.getRelevantMemories(userMessage, 10)
│   │   │   ├── Score all memories: 50% text similarity + 20% recency + 20% confidence + 10% access frequency
│   │   │   ├── Filter: score > 0.15
│   │   │   └── Sort by score, take top 10
│   │   ├── MemoryEngine.injectMemories(systemPrompt, memories)
│   │   │   └── Append: "## What you know about this user:\n[preference] User prefers...\n[fact] User lives in..."
│   │   └── AI receives augmented system prompt
│   └── Update accessCount and lastAccessedAt on injected memories
│
├──► PHASE 6: EXPIRATION
│   ├── Default TTL: 90 days
│   ├── Recency scoring naturally deprioritizes old memories
│   ├── Cleanup (on startup or every 24h):
│   │   └── Delete memories older than TTL that were never accessed (accessCount === 0)
│   └── Accessed memories are kept regardless of age
│
└──► PHASE 7: USER MANAGEMENT (future)
    ├── View all memories in a settings panel
    ├── Delete individual memories
    ├── Clear all memories
    └── Adjust TTL
```

### Pipeline 10: Agent Swarm Pipeline

```
ANY AGENT-AFFECTING EVENT
│
├──► 1. STATUS UPDATES
│   ├── Chat starts → swarmStore.updateAgentStatus('amoun', 'working')
│   ├── Chat ends (success) →
│   │   ├── swarmStore.incrementAgentTasks('amoun')
│   │   ├── swarmStore.updateAgentStatus('amoun', 'success')
│   │   └── swarmStore.resetAgentRetry('amoun')
│   ├── Chat ends (error) →
│   │   ├── swarmStore.updateAgentStatus('amoun', 'error')
│   │   ├── swarmStore.incrementAgentRetry('amoun')
│   │   └── If retryCount >= 3:
│   │       └── swarmStore.updateAgentStatus('amoun', 'broken') // Circuit breaker tripped
│   ├── Security scan → swarmStore.updateAgentTask('7orus', 'X issues detected')
│   └── Token tracking → swarmStore.recordAgentTokens('amoun', chunkTokens)
│
├──► 2. CIRCUIT BREAKER
│   ├── Each agent has maxRetries: 3
│   ├── On error: retryCount++
│   ├── On success: retryCount = 0
│   ├── retryCount >= maxRetries → status = 'broken'
│   └── 'broken' agent requires manual reset or app restart
│
├──► 3. SWARM UI (TopBar)
│   ├── SWARM pill shows colored dot:
│   │   ├── 🟢 All agents idle/success
│   │   └── 🔴 Any agent error/broken
│   ├── Hover reveals all agents with status
│   └── Click opens agent dashboard (v2.0)
│
└──► 4. DASHBOARD CARDS (v2.0)
    ├── Each agent gets a card showing:
    │   ├── Name (EN + AR), description, status
    │   ├── Metrics: tokens used, tasks completed, last active, retries
    │   ├── Capabilities as badges
    │   └── Quick actions (varies by agent)
    └── Cards update in real-time via Zustand reactivity
```

---

## 3. Complete File Inventory

### Client — `client/src/`

#### Entry Points
| File | Purpose |
|------|---------|
| `main.tsx` | App bootstrap, React root, silentReAuth call, TaskScheduler start |
| `App.tsx` | Root component, React Router, layout, lazy-loaded views |

#### Components
| File | Purpose |
|------|---------|
| `components/auth/LoginModal.tsx` | Email/password login + Google OAuth modal (v2.0: + registration tab) |
| `components/chat/ChatInput.tsx` | Text input, voice button, file upload, mode selector, send |
| `components/chat/MessageBubble.tsx` | Single chat message with markdown, code blocks, grounding sources |
| `components/chat/MessageList.tsx` | Scrollable list of messages, auto-scroll |
| `components/chat/ModelSelector.tsx` | Dropdown to select active AI model |
| `components/chat/ModeSelector.tsx` | Chat mode toggle (general/coding/brainstorm/files) |
| `components/editor/AmounEditor.tsx` | Monaco Editor wrapper for artifact preview/edit |
| `components/layout/TopBar.tsx` | App header with logo, SWARM indicator, login avatar, settings |
| `components/layout/Sidebar.tsx` | Navigation sidebar |
| `components/layout/Footer.tsx` | Footer with branding: "صُنع بـ ❤️ بواسطة العرآب" |
| `components/modals/SummaryModal.tsx` | Conversation summarization modal |
| `components/modals/SettingsModal.tsx` | App settings: model management, preferences |
| `components/tasks/TasksHUD.tsx` | Collapsible accordion task list on HomeView |
| `components/tasks/TaskItem.tsx` | Single task row with checkbox, priority, actions |

#### Services
| File | Purpose |
|------|---------|
| `services/authService.ts` | registerUser, loginUser, loginOAuth, silentReAuth, logoutUser, getCurrentUser, updateUserPreferences |
| `services/aiGateway.ts` | processPrompt (main router), provider configs, streaming implementations, tool calling |
| `services/learningEngine.ts` | extractTasks (heuristics), extractMemories (AI-powered) |
| `services/memoryEngine.ts` | getRelevantMemories, injectMemories, saveMemory, deleteMemory, cleanupExpiredMemories |
| `services/taskScheduler.ts` | TaskScheduler class: start, stop, checkDueTasks, executeTask |
| `services/horusGuard.ts` | AST parsing (Babel), security pattern detection, sanitization |

#### Stores
| File | Purpose |
|------|---------|
| `stores/workspaceStore.ts` | Chat sessions, messages, tasks, models, active model, isGenerating |
| `stores/swarmStore.ts` | Agent states (amoun, hermes, 7orus), status updates, circuit breaker |
| `stores/configStore.ts` | User preferences, theme, language, default model |
| `stores/uiStore.ts` | Modal open states, sidebar toggle, layout state |

#### Database
| File | Purpose |
|------|---------|
| `db/stores.ts` | IndexedDB store definitions (idb-keyval createStore), all store names |
| `db/migrations.ts` | Schema versioning, data migration from v0.x to v2.0 |

#### Types
| File | Purpose |
|------|---------|
| `types/chat.ts` | ChatMessage, ChatSession, ProviderConfig, ProcessOptions, Attachment, GroundingMetadata |
| `types/auth.ts` | User, AuthenticatedUser, UserPreferences, AuthLog, AuthError |
| `types/task.ts` | Task, TaskPriority, TaskSource, TaskV0 |
| `types/agent.ts` | AgentState, AgentStatus, AgentCapability |
| `types/memory.ts` | Memory, MemoryCandidate, MemoryCategory, ExtractionResult |

#### Utilities
| File | Purpose |
|------|---------|
| `utils/hash.ts` | SHA-256 password hashing via crypto.subtle.digest |
| `utils/token.ts` | UUID session token generation via crypto.randomUUID |
| `utils/format.ts` | Date formatting, text truncation, file size formatting |

#### Views
| File | Purpose |
|------|---------|
| `views/HomeView.tsx` | Main view: chat area + Tasks HUD |
| `views/EditorView.tsx` | Full-screen AmounEditor view |
| `views/SettingsView.tsx` | Full settings page |
| `views/AgentsView.tsx` | Agent dashboard with per-agent cards (v2.0) |

#### Styles
| File | Purpose |
|------|---------|
| `styles/animations.css` | Custom keyframe animations (horus-glow, scan-line, egyptian-fade-in) |
| `styles/scrollbar.css` | Custom scrollbar styling for dark theme |

#### Config
| File | Purpose |
|------|---------|
| `tailwind.config.ts` | Theme tokens (wazeer-dark, wazeer-accent, wazeer-gold, etc.), fonts |
| `vite.config.ts` | Vite config: React plugin, path aliases, PWA plugin, proxy |
| `tsconfig.json` | TypeScript strict config, path aliases |
| `index.html` | HTML shell, PWA meta tags, Cairo font |

#### PWA
| File | Purpose |
|------|---------|
| `public/manifest.json` | PWA manifest: name, icons, theme, display |
| `public/sw.js` | Service worker: caching, offline support |
| `public/icons/icon-192.png` | PWA icon (192x192) |
| `public/icons/icon-512.png` | PWA icon (512x512) |

### Server — `server/src/`

| File | Purpose |
|------|---------|
| `index.ts` | Express app creation, middleware mounting, SPA fallback, graceful shutdown |
| `proxy/registry.ts` | Provider registry: 15 providers, URL mapping, auth header config |
| `proxy/handlers.ts` | Proxy request handler factory, response streaming |
| `middleware/security.ts` | Helmet, COEP/COOP/CORP headers, Brotli/Gzip compression |
| `middleware/rateLimit.ts` | Rate limiter: 100 requests/minute/IP |
| `middleware/errorHandler.ts` | Error rewriting: 401/403/429 → clean JSON |
| `utils/shutdown.ts` | Graceful shutdown: 10s drain on SIGTERM/SIGINT |

### Shared

| File | Purpose |
|------|---------|
| `shared/types/proxy.ts` | Shared types between client and server (proxy request/response) |

### Root

| File | Purpose |
|------|---------|
| `package.json` | Root package.json (workspaces), scripts |
| `tsconfig.base.json` | Shared TypeScript config |
| `.env.example` | Template for all required environment variables |
| `.eslintrc.cjs` | ESLint config (React, TypeScript, import rules) |
| `.prettierrc` | Prettier config |
| `README.md` | Project readme |

---

## 4. Store API Reference

### workspaceStore

**File:** `client/src/stores/workspaceStore.ts`

| State/Action | Type | Description |
|-------------|------|-------------|
| `chatSessions` | `ChatSession[]` | All chat sessions |
| `currentSessionId` | `string \| null` | Active session ID |
| `messages` | `ChatMessage[]` | Messages in current session |
| `isGenerating` | `boolean` | Is AI currently responding |
| `activeModel` | `string` | Currently selected model ID |
| `models` | `ModelConfig[]` | User's configured models |
| `tasks` | `Task[]` | All tasks |
| `addSession` | `(session) => void` | Create new chat session |
| `deleteSession` | `(id) => void` | Delete a session and its messages |
| `setCurrentSession` | `(id) => void` | Switch active session |
| `addMessage` | `(msg) => void` | Add message to current session |
| `updateMessage` | `(id, updates) => void` | Update message content (streaming) |
| `appendChunk` | `(text) => void` | Append streaming chunk to last assistant message |
| `setFullResponse` | `(text) => void` | Set full response at once (Claude) |
| `clearMessages` | `() => void` | Clear current session messages |
| `setActiveModel` | `(id) => void` | Change active model |
| `addModel` | `(model) => void` | Add user-configured model |
| `removeModel` | `(id) => void` | Remove user model |
| `addTask` | `(task) => void` | Add a task |
| `updateTask` | `(id, updates) => void` | Update a task |
| `toggleTask` | `(id) => void` | Toggle task completion |
| `deleteTask` | `(id) => void` | Delete a task |
| `clearCompletedTasks` | `() => void` | Remove all completed tasks |

### swarmStore

**File:** `client/src/stores/swarmStore.ts`

| State/Action | Type | Description |
|-------------|------|-------------|
| `agents` | `Record<string, AgentState>` | All agent states |
| `updateAgentStatus` | `(id, status) => void` | Update agent status |
| `updateAgentTask` | `(id, task) => void` | Update current task description |
| `incrementAgentRetry` | `(id) => void` | Increment failure count |
| `resetAgentRetry` | `(id) => void` | Reset failure count to 0 |
| `recordAgentTokens` | `(id, tokens) => void` | Add to token counter |
| `incrementAgentTasks` | `(id) => void` | Increment completed tasks |
| `getAgent` | `(id) => AgentState` | Get agent state by ID |

### configStore

**File:** `client/src/stores/configStore.ts`

| State/Action | Type | Description |
|-------------|------|-------------|
| `user` | `User \| null` | Current authenticated user |
| `isAuthenticated` | `boolean` | Auth state flag |
| `preferences` | `UserPreferences` | Theme, language, model, voice |
| `setUser` | `(user) => void` | Set current user |
| `clearUser` | `() => void` | Clear user (logout) |
| `updatePreferences` | `(updates) => void` | Update user preferences |

### uiStore

**File:** `client/src/stores/uiStore.ts`

| State/Action | Type | Description |
|-------------|------|-------------|
| `isLoginModalOpen` | `boolean` | Login modal visibility |
| `isSummaryModalOpen` | `boolean` | Summary modal visibility |
| `isSettingsModalOpen` | `boolean` | Settings modal visibility |
| `isSidebarOpen` | `boolean` | Sidebar collapsed/expanded |
| `activeView` | `string` | Current view name |
| `setLoginModalOpen` | `(open) => void` | Toggle login modal |
| `setSummaryModalOpen` | `(open) => void` | Toggle summary modal |
| `setSettingsModalOpen` | `(open) => void` | Toggle settings modal |
| `toggleSidebar` | `() => void` | Toggle sidebar |
| `setActiveView` | `(view) => void` | Navigate to view |

---

## 5. Service API Reference

### AuthService

**File:** `client/src/services/authService.ts`

| Method | Signature | Returns |
|--------|-----------|---------|
| `registerUser` | `(email: string, rawPassword: string, displayName: string) => Promise<AuthenticatedUser>` | Created user with session |
| `loginUser` | `(email: string, rawPassword: string) => Promise<AuthenticatedUser>` | Authenticated user |
| `loginOAuth` | `() => Promise<AuthenticatedUser>` | Google-authenticated user |
| `silentReAuth` | `() => Promise<AuthenticatedUser \| null>` | Restored user or null |
| `logoutUser` | `() => Promise<void>` | — |
| `getCurrentUser` | `() => Promise<User \| null>` | Current user or null |
| `updateUserPreferences` | `(updates: Partial<UserPreferences>) => Promise<void>` | — |

### AIGateway

**File:** `client/src/services/aiGateway.ts`

| Method | Signature | Returns |
|--------|-----------|---------|
| `processPrompt` | `(prompt: string, sessionId: string, options?: ProcessOptions) => Promise<void>` | Streams to store |
| `executeSinglePrompt` | `(prompt: string, options?: ProcessOptions) => Promise<string>` | Full response text |
| `streamViaGeminiSDK` | `(modelId, messages, apiKey, options) => Promise<void>` | Streams to store |
| `streamViaProxy` | `(providerId, modelId, messages, apiKey, options) => Promise<void>` | Streams via SSE |
| `fetchViaClaudeAPI` | `(modelId, messages, apiKey, options) => Promise<void>` | Sets full response |
| `extractArtifacts` | `(content: string, sessionId: string) => Artifact[]` | Extracted artifacts |
| `buildSystemPrompt` | `(mode: ChatMode, providerId?: string) => string` | System prompt string |

### LearningEngine

**File:** `client/src/services/learningEngine.ts`

| Method | Signature | Returns |
|--------|-----------|---------|
| `extractTasks` | `(aiMessage: string, context: ExtractionContext) => Promise<Task[]>` | Extracted tasks |
| `extractMemories` | `(messages: ChatMessage[], sessionId: string) => Promise<MemoryCandidate[]>` | Memory candidates |

### MemoryEngine

**File:** `client/src/services/memoryEngine.ts`

| Method | Signature | Returns |
|--------|-----------|---------|
| `getRelevantMemories` | `(query: string, limit?: number) => Promise<Memory[]>` | Top N relevant memories |
| `injectMemories` | `(systemPrompt: string, memories: Memory[]) => string` | Augmented prompt |
| `saveMemory` | `(candidate: MemoryCandidate) => Promise<Memory \| null>` | Saved memory or null (dup) |
| `getAllMemories` | `() => Promise<Memory[]>` | All memories |
| `deleteMemory` | `(id: number) => Promise<void>` | — |
| `clearAllMemories` | `() => Promise<void>` | — |
| `cleanupExpiredMemories` | `() => Promise<number>` | Count deleted |

### TaskScheduler

**File:** `client/src/services/taskScheduler.ts`

| Method | Signature | Returns |
|--------|-----------|---------|
| `start` | `() => void` | Starts the 5-min interval |
| `stop` | `() => void` | Stops the interval |
| `checkDueTasks` | `() => Promise<void>` | Checks and executes due tasks |

### HorusGuard

**File:** `client/src/services/horusGuard.ts`

| Method | Signature | Returns |
|--------|-----------|---------|
| `scan` | `(code: string) => SecurityScanResult` | Scan result with issues |
| `sanitizeInput` | `(text: string) => string` | Sanitized text |
| `isSafe` | `(code: string) => boolean` | Quick safety check |

---

## 6. Integration Map

### Components → Services

| Component | Service | Method(s) |
|-----------|---------|----------|
| `LoginModal` | `AuthService` | `loginUser`, `loginOAuth`, `registerUser` |
| `ChatInput` | `AIGateway` | `processPrompt` |
| `ChatInput` | (Web Speech API) | `SpeechRecognition`, `SpeechSynthesis` |
| `SummaryModal` | `AIGateway` | `executeSinglePrompt` (for summarization) |
| `TasksHUD` | (workspaceStore) | `addTask`, `toggleTask`, `deleteTask` directly |
| `ArtifactCard` | (IndexedDB) | Reads/writes via artifactsStore |
| `AmounEditor` | (IndexedDB) | Reads/writes via artifactsStore |
| `ModelSelector` | (workspaceStore) | `setActiveModel` directly |
| `SettingsModal` | `AuthService` | `updateUserPreferences` |
| `TopBar` | `AuthService` | `logoutUser`, `getCurrentUser` |

### Components → Stores

| Component | Store | State Read |
|-----------|-------|-------------|
| `ChatInput` | `workspaceStore` | `isGenerating`, `activeModel` |
| `ChatInput` | `configStore` | `preferences.language` |
| `MessageList` | `workspaceStore` | `messages`, `isGenerating` |
| `ModelSelector` | `workspaceStore` | `activeModel`, `models` |
| `TasksHUD` | `workspaceStore` | `tasks` |
| `TopBar` | `configStore` | `user`, `isAuthenticated` |
| `TopBar` | `swarmStore` | `agents` (for SWARM pill) |
| `HomeView` | `workspaceStore` | `currentSessionId`, `messages`, `tasks` |
| `Sidebar` | `workspaceStore` | `chatSessions`, `currentSessionId` |

### Services → Stores

| Service | Store | Action |
|---------|-------|--------|
| `AIGateway` | `workspaceStore` | `addMessage`, `updateMessage`, `appendChunk`, `setFullResponse`, `setIsGenerating` |
| `AIGateway` | `swarmStore` | `updateAgentStatus`, `updateAgentTask`, `recordAgentTokens`, `incrementAgentTasks` |
| `AIGateway` | `LearningEngine` | Calls for extraction (post-processing) |
| `LearningEngine` | `workspaceStore` | `addTask` (for extracted tasks) |
| `LearningEngine` | `MemoryEngine` | `saveMemory` (for extracted memories) |
| `MemoryEngine` | (IndexedDB) | Reads/writes userMemory store |
| `TaskScheduler` | `workspaceStore` | `updateTask` (for auto-execution results) |
| `TaskScheduler` | `AIGateway` | `executeSinglePrompt` (for scheduled task execution) |
| `AuthService` | `configStore` | `setUser`, `clearUser` |
| `AuthService` | (IndexedDB) | Reads/writes users store, auth_logs store |

---

## 7. Known Issues from v0.x

| # | Issue | Severity | Status | Resolution |
|---|-------|----------|--------|------------|
| 1 | Login doesn't persist after page reload — `silentReAuth` runs but doesn't restore session | 🔴 Critical | Known | v2.0: Fix silentReAuth to properly read configStore and set auth state |
| 2 | No registration flow in LoginModal UI — `registerUser` service exists but has no UI | 🔴 High | Known | v2.0: Add registration tab to LoginModal |
| 3 | `search_web` tool is mocked — returns fake results after 1s delay | 🟡 Medium | Resolved | v2.0: Replaced with Gemini Google Search grounding |
| 4 | Hermes agent has no implementation — only a name in swarmStore | 🟡 Low | Deferred | v3.0: Full Hermes coding specialist implementation |
| 5 | 7orus agent is passive — only updates status, no proactive scanning | 🟡 Low | Deferred | v2.1: Add periodic output scanning |
| 6 | Task schema too simple in v0.x — only id, text, completed | 🟡 Medium | Resolved | v2.0: Enriched schema with source, priority, dueDate, tags |
| 7 | No memory/learning system in v0.x | 🟡 Medium | Resolved | v2.0: Full LearningEngine + MemoryEngine |
| 8 | HorusGuard limited patterns — may miss some attack vectors | 🟡 Medium | In Progress | v2.0: Expanded AST patterns for prototype pollution, import injection |
| 9 | No error recovery for streaming — interrupted streams leave partial messages | 🟡 Medium | Deferred | v2.1: Add stream resume or cleanup on disconnect |
| 10 | Voice recognition may not work on all browsers (Web Speech API) | 🟠 Info | Known | Document browser support, no code fix needed |
| 11 | No rate limiting feedback to user — 429 errors not clearly communicated | 🟡 Low | Resolved | v2.0: Clean error messages with retry countdown |
| 12 | Artifact extraction may false-positive on non-code fenced blocks | 🟡 Low | Deferred | v2.1: More robust language detection |
| 13 | Memory extraction uses a separate AI call (extra cost/latency) | 🟡 Low | Accepted | By design — uses fast/cheap model, runs in background |

---

## 8. v2.0 Changes Summary

### What's New

| Feature | Description |
|---------|-------------|
| **Memory System** | Full learning pipeline: extraction, categorization, deduplication, injection, TTL cleanup |
| **Task AI Extraction** | Heuristic-based task extraction from AI responses (50% probability) |
| **Task Scheduler** | Auto-execution of due tasks every 5 minutes via AI |
| **Enriched Task Schema** | source, priority, dueDate, tags, executionResult, sourceSessionId |
| **Gemini Search Grounding** | Real web search replacing mocked `search_web` tool |
| **Grounding UI** | Source links displayed below AI responses |
| **Registration UI** | Registration tab in LoginModal |
| **Session Persistence Fix** | silentReAuth properly restores session on reload |
| **Agent Dashboard Cards** | Per-agent cards with real metrics |
| **Enhanced Error Messages** | Clean, bilingual error messages for all failure modes |
| **Expanded HorusGuard** | Broader AST security patterns |

### What's Removed

| Item | Reason |
|------|--------|
| `searchWeb` mock function | Replaced by Gemini grounding |
| `search_web` tool declaration | No longer a function tool — model-level feature |
| v0.x Task schema (id, text, completed only) | Migrated to enriched schema |
| Mock search results | Replaced by real results |

### What's Changed

| Item | Before | After |
|------|--------|-------|
| Search | Mocked, all providers | Real, Gemini only (graceful degradation) |
| Task schema | `{id, text, completed}` | 10-field enriched schema |
| Auth persistence | Broken | Fixed via proper silentReAuth |
| Login modal | Login + OAuth only | Login + Register + OAuth |
| System prompt | Static | Dynamic (mode + memories + search availability) |
| Agent metrics | Basic | Full tracking (tokens, tasks, retries) |

---

## 9. How to Extend

### Add a New LLM Provider

1. Add entry to `PROVIDER_CONFIG` in `aiGateway.ts` (7 fields)
2. Add Express proxy route in `server/src/proxy/registry.ts`
3. If response format differs from OpenAI: add adapter function
4. Model appears in dropdown when user configures it
5. See `15-CONTRIBUTING.md` → "Adding a New LLM Provider" for full guide

### Add a New Chat Mode

1. Add mode string to `ChatMode` type in `types/chat.ts`
2. Add mode prefix function in `aiGateway.ts`:
   ```typescript
   case 'my-mode': return 'You are now in my-mode. Be concise.';
   ```
3. Add button/icon to `ModeSelector.tsx`
4. Test by selecting mode and sending a message

### Add a New Tool (for Gemini)

1. Add tool declaration to `TOOL_DECLARATIONS` in `aiGateway.ts`
2. Add execution handler in the tool switch:
   ```typescript
   case 'my_tool': return executeMyTool(params);
   ```
3. Implement the handler function
4. Update `module-chat.md` documentation

### Add a New Agent

1. Add to `INITIAL_AGENTS` in `swarmStore.ts` (10 fields)
2. Create service file: `services/myAgent.ts`
3. Create system prompt constant
4. Add card config for dashboard
5. See `module-agents.md` → "How to Add a New Agent" for full guide

### Add a New Memory Category

1. Add to `MemoryCategory` type in `types/memory.ts`
2. Add to `MEMORY_CATEGORIES` array in `learningEngine.ts`
3. Add extraction instruction in `MEMORY_EXTRACTION_PROMPT`
4. Update `module-learning.md` documentation

### Add a New IndexedDB Store

1. Define store: `const myStore = createStore('wazeer-mydata', 'mydata')` in `db/stores.ts`
2. Create types in `types/`
3. Create service functions for CRUD
4. See `15-CONTRIBUTING.md` → "Adding a New IndexedDB Store" for full guide

---

## 10. Green Code Compliance Checklist

### No Dead Code
- [ ] All imported functions/modules are used
- [ ] No commented-out code blocks
- [ ] No unused variables or parameters (enforced by `noUnusedLocals: true`)
- [ ] No unreachable code paths
- [ ] All exported functions are called somewhere

### No Stubs in Production
- [ ] `searchWeb` mock is REMOVED — replaced by Gemini grounding
- [ ] Hermes agent stub is either implemented or clearly marked as future (v3.0) with issue reference
- [ ] No `// TODO` without an issue number
- [ ] No `// FIXME` without a PR reference
- [ ] All functions have real implementations (not `return null` or `throw new Error('Not implemented')`)

### No Mocks in Production
- [ ] `search_web` tool mock removed from toolRegistry
- [ ] No fake data generators in production code
- [ ] Test mocks only in `tests/` directory
- [ ] No `setTimeout` delays simulating API calls in production

### No `any` Types
- [ ] `noImplicitAny: true` in tsconfig
- [ ] All function parameters explicitly typed
- [ ] All function return types explicitly declared (public functions)
- [ ] `unknown` used instead of `any` for truly unknown data
- [ ] Proper type narrowing after `unknown` checks

### No `console.log` in Production
- [ ] All `console.log` wrapped in `if (import.meta.env.DEV)` guards
- [ ] No `console.debug` in production code
- [ ] Error logging uses `console.error` (acceptable for error paths)
- [ ] No `console.log` left from debugging sessions

### File Size Limits
- [ ] No service file exceeds 500 lines
- [ ] No component file exceeds 300 lines
- [ ] Files exceeding limits are split into focused modules

### Security
- [ ] No API keys in source code (all in `.env`)
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] HorusGuard scanning on all AI-generated code
- [ ] SHA-256 password hashing (never raw passwords)
- [ ] No raw secrets in IndexedDB

### Separation of Concerns
- [ ] Components do not contain business logic
- [ ] Services do not import React or components
- [ ] Stores only manage state, no complex logic
- [ ] Types are pure interfaces/type aliases, no logic

---

> **End of Handover Document**
>
> صُنع بـ ❤️ بواسطة العرآب | حقوق النشر 100MillionDEV.com
>
> 𓂀 Wazeer OS v2.0.0-Rewrite — Egyptian Cyberpunk AI Assistant
