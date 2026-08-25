# 𓂀 Wazeer OS (وزير OS) v2.0.0-Rewrite — System Architecture

> **Document Version:** 2.0.0  
> **Date:** 2025-07-13  
> **Author:** 100MillionDEV / العرآب  
> **Classification:** Enterprise Edition  
> **Agent Name:** Amoun (أمون)  

---

## Table of Contents

1. [High-Level System Architecture (الهيكل العام)](#1-high-level-system-architecture)
2. [Unified AIGateway Architecture (بوابة الذكاء الاصطناعي)](#2-unified-aigateway-architecture)
3. [Data Flow: Chat Message (تدفق الرسائل)](#3-data-flow-chat-message)
4. [Data Flow: Authentication (تدفق المصادقة)](#4-data-flow-authentication)
5. [Data Flow: Learning Pipeline (خط أنابيب التعلم)](#5-data-flow-learning-pipeline)
6. [Data Flow: Task Auto-Execution (التنفيذ المجدول)](#6-data-flow-task-auto-execution)
7. [Data Flow: Model Addition (إضافة نموذج)](#7-data-flow-model-addition)
8. [Component Dependency Graph (رتبة المكونات)](#8-component-dependency-graph)
9. [Module Boundaries & Interaction Rules (حدود الوحدات)](#9-module-boundaries--interaction-rules)

---

## 1. High-Level System Architecture

### الهيكل العام — Layered Architecture

Wazeer OS follows a strict **5-layer architecture**. Each layer communicates only with its adjacent layers, enforcing **Separation of Concerns**.

```
╔══════════════════════════════════════════════════════════════════════╗
║                    LAYER 1: PRESENTATION                          ║
║  React Components (UI Only — No Business Logic)                   ║
║  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            ║
║  │ ChatUI   │ │ TaskUI   │ │ DashUI   │ │ AuthUI   │            ║
║  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘            ║
╠══════╪════════════╪══════════╪══════════╪═══════════════════════╣
║      ▼            ▼            ▼            ▼   LAYER 2: STATE   ║
║  ┌──────────────────────────────────────────────────────┐         ║
║  │              Zustand Stores (Shape + Sync)            │         ║
║  │  workspaceStore │ configStore │ taskStore │ authStore  │         ║
║  └──────────────────────────┬───────────────────────────┘         ║
╠═════════════════════════════╪════════════════════════════════════╣
║                              ▼          LAYER 3: SERVICE         ║
║  ┌──────────────────────────────────────────────────────┐         ║
║  │            Business Logic Layer (Pure Functions)      │         ║
║  │  AIGateway │ MemoryEngine │ LearningEngine │ Scheduler  │         ║
║  │  HorusGuard │ PromptSanitizer │ EventLogger              │         ║
║  └───────┬──────────────────────┬──────────────────────────┘         ║
╠═════════╪══════════════════════╪══════════════════════════════════╣
║           ▼                    ▼         LAYER 4: DATA           ║
║  ┌─────────────────┐  ┌──────────────────────┐                     ║
║  │   IndexedDB     │  │    Express Proxy     │                     ║
║  │   "Monmamar"   │  │  (Forward-Only Pipe)  │                     ║
║  │   v4 (7 stores) │  │  Rate Limit + Ban    │                     ║
║  └────────┬────────┘  └──────────┬───────────┘                     ║
╠══════════╪══════════════════════╪══════════════════════════════════╣
║          │                       ▼      LAYER 5: EXTERNAL        ║
║    (On-Device)         ┌─────────────────────────┐                  ║
║                         │   LLM Provider APIs     │                  ║
║                         │ Gemini│Claude│NVIDIA│...  │                  ║
║                         │ (15 providers + custom) │                  ║
║                         └─────────────────────────┘                  ║
╚══════════════════════════════════════════════════════════════════════╝
```

### Layer Interaction Rules

| From | To | Method | Constraint |
|------|----|--------|------------|
| Presentation | State | Zustand hooks (`useStore`) | Read via selectors, write via actions only |
| State | Data (IndexedDB) | `idb-keyval` `get`/`set` | Automatic on state change |
| State | Service | Import and call | Never import services from components |
| Service | Data (IndexedDB) | `idb-keyval` `get`/`set` | Services read/write directly |
| Service | External (Express) | `fetch` / SSE | Through BYOK proxy endpoint |
| Presentation | Service | **FORBIDDEN** | Components never call services directly |

---

## 2. Unified AIGateway Architecture

### بوابة الذكاء الاصطناعي — v2.0 Single System

The v2.0 rewrite eliminates the dual-system architecture. There is now **one** `AIGateway` class that handles all LLM communication.

#### File Tree: `src/services/ai/`

```
src/services/ai/
├── AIGateway.ts              # Central gateway (registry + routing)
├── types.ts                  # ProviderAdapter interface, Stream types
├── index.ts                  # Barrel export
├── providers/
│   ├── index.ts              # Provider registry registration
│   ├── base.ts               # Abstract BaseProviderAdapter
│   ├── gemini.ts             # Gemini adapter (with grounding support)
│   ├── claude.ts             # Claude/Anthropic adapter
│   ├── nvidia.ts             # NVIDIA NIM adapter
│   ├── glm.ts                # GLM (Zhipu) adapter
│   ├── openrouter.ts         # OpenRouter adapter
│   ├── openai.ts             # OpenAI adapter
│   ├── groq.ts               # Groq adapter
│   ├── mistral.ts            # Mistral adapter
│   ├── xai.ts                # xAI (Grok) adapter
│   ├── cerebras.ts           # Cerebras adapter
│   ├── ollama.ts             # Ollama (local) adapter
│   ├── deepseek.ts           # DeepSeek adapter
│   ├── kimi.ts               # Kimi (Moonshot) adapter
│   ├── minimax.ts            # MiniMax adapter
│   └── qwen.ts               # Qwen (Alibaba) adapter
└── utils/
    ├── streamParser.ts       # SSE stream parsing utilities
    ├── messageFormatter.ts   # Convert internal messages to provider formats
    └── responseParser.ts     # Parse provider responses to internal format
```

#### AIGateway Class Design

```typescript
// src/services/ai/AIGateway.ts

interface ProviderAdapter {
  name: string;
  formatMessages(messages: ChatMessage[]): ProviderMessage[];
  buildRequest(model: string, messages: ProviderMessage[], options: ChatOptions): RequestInit;
  parseStream(chunk: string): StreamChunk | null;
  parseResponse(response: Response): AIResponse;
  supportsGrounding: boolean;
  supportsToolCalling: boolean;
  maxTokens: number;
}

class AIGateway {
  private providers: Map<string, ProviderAdapter>;
  private customProviders: Map<string, ProviderAdapter>;

  // Register a built-in provider
  register(name: string, adapter: ProviderAdapter): void;

  // Register a user-added custom model
  registerCustom(model: CustomModel): void;

  // Route a chat request to the appropriate provider
  async route(
    provider: string,
    model: string,
    messages: ChatMessage[],
    options: ChatOptions,
    onChunk: (chunk: StreamChunk) => void,
    onComplete: (response: AIResponse) => void,
    onError: (error: Error) => void
  ): Promise<void>;

  // Get all available providers (built-in + custom)
  getAvailableProviders(): ProviderInfo[];

  // Check if a provider supports a specific capability
  hasCapability(provider: string, capability: 'grounding' | 'toolCalling' | 'streaming'): boolean;
}
```

#### Provider Adapter Registration

```typescript
// src/services/ai/providers/index.ts
import { AIGateway } from '../AIGateway';
import { GeminiAdapter } from './gemini';
import { ClaudeAdapter } from './claude';
import { NvidiaAdapter } from './nvidia';
// ... all 15 providers

export function registerProviders(gateway: AIGateway): void {
  gateway.register('gemini', new GeminiAdapter());
  gateway.register('claude', new ClaudeAdapter());
  gateway.register('nvidia', new NvidiaAdapter());
  gateway.register('glm', new GLMAdapter());
  gateway.register('openrouter', new OpenRouterAdapter());
  gateway.register('openai', new OpenAIAdapter());
  gateway.register('groq', new GroqAdapter());
  gateway.register('mistral', new MistralAdapter());
  gateway.register('xai', new XAIAdapter());
  gateway.register('cerebras', new CerebrasAdapter());
  gateway.register('ollama', new OllamaAdapter());
  gateway.register('deepseek', new DeepSeekAdapter());
  gateway.register('kimi', new KimiAdapter());
  gateway.register('minimax', new MiniMaxAdapter());
  gateway.register('qwen', new QwenAdapter());
}
```

---

## 3. Data Flow: Chat Message

### تدفق الرسائل — End-to-End Message Lifecycle

```
User Types Message
       │
       ▼
┌──────────────┐    onChange     ┌──────────────────┐
│  ChatInput   │ ─────────────→ │ workspaceStore   │
│  Component   │                │ (optimistic add) │
└──────────────┘                └────────┬─────────┘
       │                                │
       │    User clicks Send            │ sendMessage action
       ▼                                ▼
┌──────────────┐              ┌──────────────────┐
│  ChatInput   │ ──────────→  │  AIGateway       │
│  (submit)    │  route()     │  .route()        │
└──────────────┘              └────────┬─────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
            ┌─────────────┐  ┌──────────────┐  ┌─────────────┐
            │ Provider    │  │ System       │  │ API Key     │
            │ Adapter     │  │ Prompt       │  │ from IDB    │
            │ (format)    │  │ (assemble)   │  │ (BYOK)      │
            └──────┬──────┘  └──────┬───────┘  └──────┬──────┘
                   │                │                  │
                   └────────────────┼──────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Express Proxy      │
                         │   /api/chat/:provider│
                         │   (forward-only)     │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   LLM Provider API   │
                         │   (Gemini, Claude…)   │
                         └──────────┬───────────┘
                                    │
                         SSE Stream │
                                    ▼
                         ┌──────────────────────┐
                         │   Stream Parser      │
                         │   (chunk → text)     │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
             ┌────────────┐  ┌───────────┐  ┌────────────┐
             │ Chat UI    │  │ Artifacts │  │ Event Log  │
             │ (streaming│  │ Extract   │  │ (latency, │
             │  display) │  │ (post-    │  │  tokens)  │
             └────────────┘  │  stream)  │  └────────────┘
                            └─────┬─────┘
                                  │
                    Stream Complete ↓
                    ┌─────────────────────────────────┐
                    │     Post-Stream Pipeline         │
                    ├──────────┬──────────┬────────────┤
                    ▼          ▼          ▼            ▼
             ┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
             │Learning  │ │Memory  │ │TTS     │ │Metrics   │
             │Engine    │ │Engine  │ │(voice) │ │(counter) │
             │(tasks?)  │ │(mems?) │ │        │ │          │
             └──────────┘ └────────┘ └────────┘ └──────────┘
```

### Step-by-Step

| Step | Component | Action |
|------|-----------|--------|
| 1 | `ChatInput` | User types and submits message |
| 2 | `workspaceStore` | Optimistically adds user message to state + IndexedDB |
| 3 | `AIGateway.route()` | Resolves provider adapter, fetches API key from IndexedDB config |
| 4 | `ProviderAdapter` | Formats messages to provider-specific format |
| 5 | `PromptBuilder` | Assembles system prompt (base + memory context + agent config) |
| 6 | Express Proxy | Forwards request to LLM provider API |
| 7 | LLM Provider | Processes and streams response |
| 8 | `StreamParser` | Parses SSE chunks into text |
| 9 | `ChatUI` | Renders streaming tokens in real-time |
| 10 | `ArtifactExtractor` | Post-stream: extracts code blocks, tables, structured data |
| 11 | `LearningEngine` | 50% chance: extracts tasks from response |
| 12 | `MemoryEngine` | Extracts factual memories, deduplicates, stores |
| 13 | `EventLogger` | Logs message count, latency, token usage |
| 14 | TTS (if enabled) | Speaks the completed response |

---

## 4. Data Flow: Authentication

### تدفق المصادقة — Bootstrap and Session Lifecycle

```
App Boot (index.tsx)
       │
       ▼
┌──────────────────────┐
│  Bootstrap Sequence  │
│  1. Hydrate stores   │
│  2. Init Firebase    │
│  3. silentReAuth()   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐     Found      ┌──────────────────┐
│  Check IndexedDB     │ ─────────────→ │ Restore Session   │
│  auth_logs store     │               │ (authStore)       │
│  for existing session│               │ → Dashboard       │
└──────────┬───────────┘               └──────────────────┘
           │
       No session found
           │
           ▼
┌──────────────────────────────────────────────────┐
│                   Login Page                       │
│                                                    │
│  ┌──────────────────┐    ┌────────────────────┐   │
│  │  Email/Password  │    │  Google OAuth      │   │
│  │  ┌────────────┐  │    │  ┌──────────────┐  │   │
│  │  │ SHA-256    │  │    │  │ Firebase      │  │   │
│  │  │ hash then  │  │    │  │ GoogleAuth    │  │   │
│  │  │ Firebase   │  │    │  │ Provider     │  │   │
│  │  │ createUser │  │    │  │ signInWith   │  │   │
│  │  └────────────┘  │    │  │ Popup        │  │   │
│  └──────────────────┘    └────────────────────┘   │
└──────────────────────┬───────────────────────────┘
                       │
                  Auth Success
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│              Session Persistence                  │
│  1. Store session in auth_logs (IndexedDB)       │
│  2. Update authStore (Zustand)                   │
│  3. If first user → mark as admin                │
│  4. Log event to logs store                      │
│  5. Redirect to dashboard                        │
└──────────────────────────────────────────────────┘
```

### Auth Flow Details

| Step | Action | Storage |
|------|--------|---------|
| 1 | User submits email + password | — |
| 2 | Client hashes password with SHA-256 (Web Crypto API) | — |
| 3 | Hashed password sent to Firebase Auth | Firebase servers |
| 4 | Firebase returns user token + UID | Firebase servers |
| 5 | Session stored in `auth_logs` IndexedDB store | IndexedDB (on-device) |
| 6 | User info stored in `authStore` | Zustand (memory) |
| 7 | On next boot: `onAuthStateChanged` listener fires | Firebase SDK |
| 8 | If valid token → restore session, skip login | — |
| 9 | If expired → `signInAnonymously` then re-auth | Firebase SDK |

---

## 5. Data Flow: Learning Pipeline

### خط أنابيب التعلم — Post-Response Intelligence

```
AI Response Complete (full text available)
       │
       ▼
┌──────────────────────────────────────────────────┐
│           LearningEngine.trigger(response)         │
│                                                    │
│  Probability Check: Math.random() < 0.5 (50%)      │
└──────────┬───────────────────────┬─────────────────┘
           │ YES (50%)             │ NO (50%)
           ▼                       ▼
┌──────────────────┐         ┌──────────────┐
│  Extraction LLM  │         │   Skip       │
│  Call (same      │         │   Pipeline   │
│  provider)       │         └──────────────┘
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  Extraction Prompt:                               │
│  "Analyze this AI response and extract:           │
│   1. Actionable tasks (title, due date, priority) │
│   2. Factual memories (key-value pairs)            │
│   Return JSON."                                   │
└────────┬──────────────────┬───────────────────────┘
         │                  │
         ▼                  ▼
┌──────────────────┐ ┌──────────────────┐
│ extractTasks()   │ │ extractMemories()│
│ → Task[]         │ │ → UserMemory[]   │
└────────┬─────────┘ └────────┬─────────┘
         │                    │
         ▼                    ▼
┌──────────────────┐ ┌──────────────────┐
│ taskStore        │ │ userMemory store │
│ .addTasks()      │ │ (IndexedDB)      │
│ (with dedup)     │ │ (with dedup by   │
│                  │ │  key)            │
└────────┬─────────┘ └────────┬─────────┘
         │                    │
         ▼                    ▼
┌──────────────────────────────────────────┐
│  updateMetrics()                          │
│  Log task extraction event                │
│  Log memory extraction event              │
│  Increment counters for dashboard         │
└──────────────────────────────────────────┘
```

---

## 6. Data Flow: Task Auto-Execution

### التنفيذ المجدول — TaskScheduler Pipeline

```
setInterval(every 5 minutes)
       │
       ▼
┌──────────────────────────────────────────────────┐
│              TaskScheduler.tick()                  │
│                                                    │
│  Query: taskStore.getTasks({                      │
│    status: 'pending',                              │
│    autoExecute: true,                              │
│    dueDate: { $lte: now() }                       │
│  })                                               │
└──────────┬───────────────────────────────────────┘
           │
      Tasks Found?
      ┌────┴────┐
      │ YES     │ NO → Exit
      ▼         │
┌──────────────┐
│ Rate Limit   │
│ Check:       │
│ Last exec    │
│ > 1 min ago? │
└──────┬───────┘
       │ YES
       ▼
┌──────────────────────────────────────────────────┐
│  For each due task (one at a time, queued):       │
│                                                    │
│  1. Generate auto-prompt:                         │
│     "Execute this task: {title}.                   │
│      Context: {description}.                      │
│      Current date: {now}."                        │
│                                                    │
│  2. Send to AIGateway (current provider)          │
│                                                    │
│  3. Await response                                │
└──────────┬───────────────────────────────────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
┌──────────┐ ┌──────────────┐
│ Success  │ │ Failure      │
│          │ │              │
│ status:  │ │ status:      │
│ 'completed'│ │ 'failed'     │
│          │ │              │
│ result:  │ │ result:      │
│ response │ │ error msg    │
└────┬─────┘ └──────┬───────┘
     │               │
     └───────┬───────┘
             ▼
┌──────────────────────────────────────────────────┐
│  1. Update task in taskStore + IndexedDB          │
│  2. Store execution timestamp                      │
│  3. Show notification toast to user                │
│  4. Log execution event to logs store              │
│  5. Wait 1 minute before next task                 │
└──────────────────────────────────────────────────┘
```

---

## 7. Data Flow: Model Addition

### إضافة نموذج — 4-Field Custom Model Flow

```
User Opens Settings → Model Management
       │
       ▼
┌──────────────────────────────────────────────────┐
│              4-Field Addition Form                 │
│                                                    │
│  ┌──────────────────────────────────────────┐     │
│  │ Provider:  [ollama          ▼]           │     │
│  │ Model ID:  [llama3:70b                ]  │     │
│  │ API Key:   [                    ] (opt)  │     │
│  │ Endpoint:  [http://localhost:11434/v1  ]  │     │
│  └──────────────────────────────────────────┘     │
│                                                    │
│  [Cancel]                          [Add Model]     │
└──────────┬───────────────────────────────────────┘
           │
      User clicks [Add Model]
           │
           ▼
┌──────────────────────────────────────────────────┐
│              Client-Side Validation                │
│                                                    │
│  ✓ Provider is in supported list or 'custom'      │
│  ✓ Model ID is non-empty, valid chars             │
│  ✓ API Key required (unless provider=ollama)       │
│  ✓ Endpoint is valid URL, HTTPS preferred          │
└──────────┬───────────────────────────────────────┘
           │
      Validation Passes
           │
           ▼
┌──────────────────────────────────────────────────┐
│           Persist to IndexedDB                     │
│                                                    │
│  1. configStore.setApiKey(provider, apiKey)        │
│     → config.apiKeys['ollama'] = '...'             │
│     → saved to 'config' IndexedDB store            │
│                                                    │
│  2. configStore.addCustomModel({                   │
│       provider: 'ollama',                          │
│       modelId: 'llama3:70b',                       │
│       endpoint: 'http://localhost:11434/v1'        │
│     })                                            │
│     → saved to 'config' IndexedDB store            │
└──────────┬───────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────┐
│         Register with AIGateway                    │
│                                                    │
│  AIGateway.registerCustom({                        │
│    provider: 'ollama',                             │
│    modelId: 'llama3:70b',                          │
│    endpoint: 'http://localhost:11434/v1',           │
│    apiKey: '...'                                   │
│  })                                                │
│  → Creates OpenAI-compatible adapter               │
│  → Adds to customProviders Map                     │
│  → Model now appears in provider dropdown          │
└──────────┬───────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────┐
│  Success Toast: "Model ollama/llama3:70b added!"   │
│  Form resets, dropdown refreshes                  │
└──────────────────────────────────────────────────┘
```

---

## 8. Component Dependency Graph

### رتبة المكونات — What Imports What

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PAGES (Route Level)                          │
│  DashboardPage  │  ChatPage  │  TasksPage  │  SettingsPage  │  Auth  │
└──┬──────────┬───┴──────┬─────┴──────┬─────────┴───────┬────────────┘
   │          │          │            │                 │
   ▼          ▼          ▼            ▼                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                     COMPONENTS (UI Layer)                         │
│                                                                   │
│  ChatInput ──imports──→ useWorkspaceStore                         │
│  ChatMessage ──imports──→ useWorkspaceStore                       │
│  TaskCard ──imports──→ useTaskStore                               │
│  TaskForm ──imports──→ useTaskStore                               │
│  ModelForm ──imports──→ useConfigStore                            │
│  DashboardCharts ──imports──→ useEventLogger                      │
│  AgentCard ──imports──→ useWorkspaceStore                         │
│  VoiceButton ──imports──→ useVoiceIO (hook)                       │
│  ArtifactPanel ──imports──→ useArtifactStore                      │
│  TemplatePicker ──imports──→ useConfigStore                       │
│  CodeBlock ──imports──→ HorusGuard (for rendering)                │
└──────────────────────────────────────────────────────────────────┘
                          │
                          │ Components MAY import hooks only
                          │ Components MUST NOT import services
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                       HOOKS (Bridge Layer)                        │
│                                                                   │
│  useChat() ──imports──→ AIGateway, workspaceStore                 │
│  useEventLogger() ──imports──→ eventLogger service                │
│  useMemory() ──imports──→ MemoryEngine                            │
│  useVoiceIO() ──imports──→ Web Speech API (direct)                │
│  useAuth() ──imports──→ authService, authStore                    │
│  useTaskScheduler() ──imports──→ TaskScheduler                    │
└──────────────────────────────────────────────────────────────────┘
                          │
                          │ Hooks are the ONLY bridge
                          │ between components and services
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                      SERVICES (Logic Layer)                       │
│                                                                   │
│  AIGateway ──imports──→ Provider Adapters                         │
│  MemoryEngine ──imports──→ idb-keyval (userMemory store)          │
│  LearningEngine ──imports──→ AIGateway, idb-keyval                │
│  TaskScheduler ──imports──→ AIGateway, taskStore                  │
│  HorusGuard ──imports──→ @babel/parser                            │
│  PromptSanitizer ──imports──→ (pure, no deps)                     │
│  EventLogger ──imports──→ idb-keyval (logs store)                 │
│  AuthService ──imports──→ Firebase Auth                           │
└──────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                       STORES (State Layer)                        │
│                                                                   │
│  workspaceStore │ configStore │ taskStore │ artifactStore         │
│  authStore │ memoryStore                              │
│                                                                   │
│  Each store: reads/writes to IndexedDB via idb-keyval             │
└──────────────────────────────────────────────────────────────────┘
```

### Import Direction Rules

```
Pages → Components → Hooks → Services → Stores → IndexedDB
  ↓         ↓           ↓          ↓          ↓
 NEVER    NEVER       NEVER     NEVER    NEVER
 import   import     import   import   import
 from     from       from     from     from
 services components  stores   services components
```

---

## 9. Module Boundaries & Interaction Rules

### حدود الوحدات — Enforced Boundaries

#### Boundary Matrix

| Module | May Import From | May NOT Import From | Notes |
|--------|----------------|---------------------|-------|
| `components/` | `hooks/`, `stores/`, `types/`, `constants/`, `utils/` | `services/`, other components' internals | Components are UI-only |
| `hooks/` | `services/`, `stores/`, `types/`, `utils/` | `components/` | Hooks bridge UI and logic |
| `services/` | `types/`, `utils/`, `constants/`, `idb-keyval` | `components/`, `hooks/`, `stores/` | Services are pure logic |
| `stores/` | `types/`, `utils/`, `idb-keyval` | `services/`, `hooks/`, `components/` | Stores hold state only |
| `types/` | Nothing (leaf module) | Everything | Pure type definitions |
| `utils/` | `types/` | `stores/`, `services/`, `hooks/`, `components/` | Pure utility functions |
| `constants/` | Nothing (leaf module) | Everything | Static values |
| `pages/` | `components/`, `hooks/`, `stores/` | `services/` (use hooks instead) | Route-level composition |

#### Cross-Boundary Communication

| From → To | Mechanism | Example |
|-----------|-----------|---------|
| Component → Store | Zustand hook | `useConfigStore(s => s.apiKeys)` |
| Component → Service | Via custom hook | `const { sendMessage } = useChat()` |
| Hook → Service | Direct import | `AIGateway.route(...)` |
| Service → Store | Via hook or direct | `useTaskStore.getState().addTask()` |
| Service → IndexedDB | Direct (idb-keyval) | `set('userMemory', memories)` |
| Store → IndexedDB | Automatic on change | `subscribe(() => set('state', get()))` |
| Service → External | fetch/SSE via proxy | `fetch('/api/chat/gemini', ...)` |

#### External Boundary: Express Proxy

```
Client (Browser)                    Express Proxy                     LLM Provider
       │                                  │                               │
       │── POST /api/chat/gemini ────────→│── POST /v1beta/... ──────────→│
       │   Headers:                       │   Headers:                     │
       │   Authorization: Bearer KEY       │   Authorization: Bearer KEY   │
       │   (user's BYOK key)              │   (forwarded from client)     │
       │                                  │                               │
       │←── SSE stream ──────────────────│←── SSE stream ───────────────│
       │                                  │                               │
       │  ⚠️  Proxy NEVER reads body        │                               │
       │  ⚠️  Proxy NEVER modifies headers   │                               │
       │  ⚠️  Proxy ONLY checks rate limit   │                               │
       │  ⚠️  Proxy ONLY checks IP ban list  │                               │
```

> **Separation of Concerns:** The Express proxy is a **dumb pipe**. It does not understand, modify, or log message content. Its only jobs are: forward requests, enforce rate limits, and enforce IP bans (Excommunicado Protocol).

---
> صُنع بـ ❤️ بواسطة العرآب | حقوق النشر 100MillionDEV.com  
> 𓂀 Wazeer OS — Enterprise Edition v2.0.0-Rewrite