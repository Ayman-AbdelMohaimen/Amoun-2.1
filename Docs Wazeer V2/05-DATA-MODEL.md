# 𓂀 Wazeer OS (وزير OS) v2.0.0-Rewrite — Data Model

> **Document Version:** 2.0.0  
> **Date:** 2025-07-13  
> **Author:** 100MillionDEV / العرآب  
> **Classification:** Enterprise Edition  
> **Agent Name:** Amoun (أمون)  

---

## Table of Contents

1. [IndexedDB Schema (مخطط قاعدة البيانات)](#1-indexedb-schema)
2. [TypeScript Interfaces (واجهات الأنواع)](#2-typescript-interfaces)
3. [Relationship Diagram (رسم العلاقات)](#3-relationship-diagram)
4. [Data Lifecycle (دورة حياة البيانات)](#4-data-lifecycle)
5. [Migration Strategy (استراتيجية الترحيل)](#5-migration-strategy)
6. [Data Validation Rules (قواعد التحقق)](#6-data-validation-rules)
7. [Storage Quota Management (إدارة حصة التخزين)](#7-storage-quota-management)

---

## 1. IndexedDB Schema

### مخطط قاعدة البيانات — Database "Monmamar" v4

Wazeer OS uses a single IndexedDB database named **"Monmamar"** (منمار), currently at **version 4**. The database contains 7 object stores. All persistence is handled via the `idb-keyval` library, which provides a lightweight key-value abstraction over IndexedDB.

#### Store Overview Table

| Store Name | Key | Value Type | Description | v Added |
|-----------|-----|-----------|-------------|---------|
| `config` | `"config"` (singleton) | `AppConfig` | User configuration, API keys, custom models, templates | v1 |
| `state` | `"state"` (singleton) | `AppState` | Full application state (sessions, messages, active selections) | v1 |
| `logs` | Auto-generated UUID | `EventLog` | Event log entries for metrics, auditing, debugging | v1 |
| `artifacts` | Auto-generated UUID | `Artifact` | Extracted artifacts (code, markdown, tables, JSON) | v2 |
| `auth_logs` | Auto-generated UUID | `AuthLogEntry` | Authentication events (login, logout, ban, OAuth) | v3 |
| `banned_nodes` | IP address (string) | `BannedNode` | Excommunicado Protocol banned IP records | v3 |
| `userMemory` | Auto-generated UUID | `UserMemory` | **NEW** — Cumulative memory entries extracted from conversations | **v4** |

#### Store Detail Tables

##### `config` Store

| Field (in AppConfig) | Type | Default | Encrypted | Description |
|----------------------|------|---------|-----------|-------------|
| `apiKeys` | `Record<string, string>` | `{}` | Yes | Per-provider API keys (BYOK) |
| `customModels` | `CustomModel[]` | `[]` | No | User-added custom model definitions |
| `promptTemplates` | `PromptTemplate[]` | `[]` | No | Saved prompt templates |
| `locale` | `"ar" \| "en"` | `"en"` | No | UI language preference |
| `theme` | `"dark"` | `"dark"` | No | Theme (currently dark-only) |
| `defaultProvider` | `string` | `"gemini"` | No | Default LLM provider |
| `defaultModel` | `string` | `"gemini-2.0-flash"` | No | Default model ID |
| `autoExtractTasks` | `boolean` | `true` | No | Enable LearningEngine task extraction |
| `autoExtractMemories` | `boolean` | `true` | No | Enable MemoryEngine memory extraction |
| `autoExecuteTasks` | `boolean` | `false` | No | Enable TaskScheduler auto-execution |
| `voiceEnabled` | `boolean` | `false` | No | Enable voice input/output |
| `ttsEnabled` | `boolean` | `false` | No | Enable text-to-speech output |
| `chatMode` | `"chat" \| "agent" \| "code" \| "research"` | `"chat"` | No | Default chat mode |

##### `state` Store

| Field (in AppState) | Type | Default | Description |
|---------------------|------|---------|-------------|
| `sessions` | `ChatSession[]` | `[]` | All chat sessions |
| `activeSessionId` | `string \| null` | `null` | Currently active session ID |
| `tasks` | `Task[]` | `[]` | All tasks |
| `activeAgentId` | `string \| null` | `null` | Currently selected agent |
| `agents` | `AgentState[]` | `[]` | Configured agents |
| `projects` | `Project[]` | `[]` | User projects |

##### `logs` Store (Key-Value: UUID → EventLog)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique log entry ID |
| See full `EventLog` interface below | | |

##### `artifacts` Store (Key-Value: UUID → Artifact)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique artifact ID |
| See full `Artifact` interface below | | |

##### `auth_logs` Store (Key-Value: UUID → AuthLogEntry)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique auth log ID |
| See full `AuthLogEntry` interface below | | |

##### `banned_nodes` Store (Key-Value: IP → BannedNode)

| Field | Type | Description |
|-------|------|-------------|
| `id` | IP address | The banned IP (used as key) |
| See full `BannedNode` interface below | | |

##### `userMemory` Store (NEW in v4) (Key-Value: UUID → UserMemory)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique memory ID |
| See full `UserMemory` interface below | | |

---

## 2. TypeScript Interfaces

### واجهات الأنواع — Complete Entity Definitions

---

#### 2.1 User

```typescript
/**
 * Represents an authenticated user.
 * Sourced from Firebase Auth, enriched locally.
 */
interface User {
  /** Firebase UID */
  uid: string;
  /** User's email address */
  email: string;
  /** Display name (from Firebase profile or set by user) */
  displayName: string;
  /** Profile photo URL */
  photoURL?: string;
  /** User role: first registered user becomes admin */
  role: 'admin' | 'user';
  /** Authentication provider used */
  provider: 'email' | 'google';
  /** Account creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last login timestamp (ISO 8601) */
  lastLoginAt: string;
}
```

---

#### 2.2 ChatSession

```typescript
/**
 * A conversation session between the user and Amoun.
 * Contains messages and metadata about the conversation.
 */
interface ChatSession {
  /** Unique session identifier (UUID) */
  id: string;
  /** Session title (auto-generated from first message or user-set) */
  title: string;
  /** LLM provider used for this session */
  provider: string;
  /** Model ID used for this session */
  model: string;
  /** Chat mode: chat, agent, code, or research */
  mode: 'chat' | 'agent' | 'code' | 'research';
  /** Ordered list of messages in this session */
  messages: ChatMessage[];
  /** Session creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last message timestamp (ISO 8601) */
  updatedAt: string;
  /** Agent ID if this session is tied to a specific agent */
  agentId?: string;
  /** Tags for categorization */
  tags: string[];
  /** Whether the session has been archived */
  archived: boolean;
  /** Total token count across all messages */
  totalTokens: number;
}
```

---

#### 2.3 ChatMessage

```typescript
/**
 * A single message within a ChatSession.
 */
interface ChatMessage {
  /** Unique message identifier (UUID) */
  id: string;
  /** Who sent the message */
  role: 'user' | 'assistant' | 'system' | 'tool';
  /** The text content of the message */
  content: string;
  /** Timestamp (ISO 8601) */
  timestamp: string;
  /** LLM provider that generated this response (assistant only) */
  provider?: string;
  /** Model ID used (assistant only) */
  model?: string;
  /** Token count for this message */
  tokenCount?: number;
  /** Latency in milliseconds (assistant only) */
  latencyMs?: number;
  /** File attachments */
  attachments?: Attachment[];
  /** Tool calls made during this message (agent mode) */
  toolCalls?: ToolCall[];
  /** IDs of artifacts extracted from this message */
  artifactIds?: string[];
  /** Whether this message was auto-executed by TaskScheduler */
  isAutoExecuted?: boolean;
  /** Grounding metadata from Gemini search (research mode) */
  groundingMetadata?: GroundingMetadata;
}

/**
 * Grounding metadata from Gemini's Google Search retrieval.
 */
interface GroundingMetadata {
  /** Search queries used for grounding */
  searchQueries?: string[];
  /** Web source chunks used */
  groundingChunks?: {
    web?: {
      uri: string;
      title: string;
    }[];
  };
  /** Confidence score of grounding */
  groundingScore?: number;
}
```

---

#### 2.4 Task (Enriched)

```typescript
/**
 * A task — either manually created or AI-extracted.
 * Enriched schema for v2.0 with source tracking and auto-execution.
 */
interface Task {
  /** Unique task identifier (UUID) */
  id: string;
  /** Task title (required) */
  title: string;
  /** Detailed description */
  description?: string;
  /** Current task status */
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  /** Task priority level */
  priority: 'low' | 'medium' | 'high' | 'urgent';
  /** Due date for execution (ISO 8601 datetime) */
  dueDate?: string;
  /** Tags for categorization and filtering */
  tags: string[];
  /** How this task was created */
  source: 'manual' | 'ai_extraction';
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
  /** Completion timestamp (ISO 8601) */
  completedAt?: string;
  /** Whether this task should auto-execute when due */
  autoExecute: boolean;
  /** Result of auto-execution (LLM response or error message) */
  executionResult?: string;
  /** ID of the chat session where this task originated */
  sessionId?: string;
  /** ID of the specific message that triggered extraction */
  messageId?: string;
  /** Number of auto-execution retry attempts */
  retryCount: number;
  /** Maximum allowed retries */
  maxRetries: number;
}
```

---

#### 2.5 Artifact

```typescript
/**
 * An extracted artifact from an AI response.
 * Artifacts are structured content (code, data, documents) that
 * can be viewed, edited, and downloaded independently.
 */
interface Artifact {
  /** Unique artifact identifier (UUID) */
  id: string;
  /** Artifact type */
  type: 'code' | 'markdown' | 'table' | 'json' | 'mermaid';
  /** The artifact content */
  content: string;
  /** Programming language (for code type) */
  language?: string;
  /** Human-readable title */
  title: string;
  /** ID of the chat message this was extracted from */
  messageId: string;
  /** ID of the chat session */
  sessionId: string;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** File extension for download */
  fileExtension?: string;
  /** Number of lines (for code artifacts) */
  lineCount?: number;
  /** Whether this artifact has been starred/bookmarked */
  starred: boolean;
}
```

---

#### 2.6 CustomModel

```typescript
/**
 * A user-added custom LLM model via the 4-field form.
 * Stored in the config store's customModels array.
 */
interface CustomModel {
  /** Unique identifier (auto-generated) */
  id: string;
  /** Provider name (must match registry or 'custom') */
  provider: string;
  /** Model identifier string */
  modelId: string;
  /** API endpoint URL (required for custom/self-hosted) */
  endpoint: string;
  /** Display label for the model */
  label: string;
  /** Whether this model supports streaming */
  supportsStreaming: boolean;
  /** Whether this model supports tool calling */
  supportsToolCalling: boolean;
  /** Maximum context window (tokens) */
  maxContextTokens: number;
  /** Creation timestamp (ISO 8601) */
  addedAt: string;
}
```

---

#### 2.7 UserMemory (NEW in v4)

```typescript
/**
 * A cumulative memory entry extracted from conversations.
 * Stored in the dedicated userMemory IndexedDB store.
 * Injected into system prompts as context for future conversations.
 */
interface UserMemory {
  /** Unique memory identifier (UUID) */
  id: string;
  /** Descriptive key for the memory (e.g., 'user_workplace', 'preferred_language') */
  key: string;
  /** The factual value being remembered */
  value: string;
  /** Auto-classified category */
  category: 'personal' | 'work' | 'preference' | 'fact' | 'project';
  /** Confidence score of extraction (0-1) */
  confidence: number;
  /** ID of the chat session where this memory was extracted */
  sessionId: string;
  /** ID of the message that contained this information */
  messageId: string;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Expiration timestamp (createdAt + 90 days) */
  expiresAt: string;
  /** Last time this memory was accessed/injected into a prompt */
  lastAccessedAt?: string;
  /** Number of times this memory was injected into system prompts */
  accessCount: number;
  /** Whether this memory is currently active (not expired, not disabled) */
  active: boolean;
}
```

---

#### 2.8 AgentState

```typescript
/**
 * Configuration for a specific AI agent persona.
 * Users can create multiple agents with different system prompts and models.
 */
interface AgentState {
  /** Unique agent identifier (UUID) */
  id: string;
  /** Agent display name */
  name: string;
  /** Agent description / purpose */
  description: string;
  /** Custom system prompt for this agent */
  systemPrompt: string;
  /** Default LLM provider for this agent */
  provider: string;
  /** Default model ID for this agent */
  model: string;
  /** Agent avatar (emoji or URL) */
  avatar?: string;
  /** Temperature setting (0-2) */
  temperature: number;
  /** Maximum tokens for responses */
  maxTokens: number;
  /** Whether this agent is enabled */
  enabled: boolean;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
}
```

---

#### 2.9 Project

```typescript
/**
 * A project that groups related chat sessions and tasks.
 */
interface Project {
  /** Unique project identifier (UUID) */
  id: string;
  /** Project name */
  name: string;
  /** Project description */
  description?: string;
  /** IDs of chat sessions belonging to this project */
  sessionIds: string[];
  /** IDs of tasks belonging to this project */
  taskIds: string[];
  /** Project color for visual identification */
  color: string;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
}
```

---

#### 2.10 PromptTemplate

```typescript
/**
 * A reusable prompt template with variable placeholders.
 */
interface PromptTemplate {
  /** Unique template identifier (UUID) */
  id: string;
  /** Template display name */
  name: string;
  /** Template content with {variable} placeholders */
  content: string;
  /** Description of what this template does */
  description?: string;
  /** Detected variable names from content */
  variables: string[];
  /** Category for organization */
  category: 'coding' | 'writing' | 'analysis' | 'creative' | 'custom';
  /** Whether this is a built-in template (cannot be deleted) */
  isBuiltin: boolean;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
}
```

---

#### 2.11 EventLog

```typescript
/**
 * An event log entry for metrics, auditing, and debugging.
 * Stored in the 'logs' IndexedDB store.
 */
interface EventLog {
  /** Unique log identifier (UUID) */
  id: string;
  /** Event type/category */
  type: 'message_sent' | 'message_received' | 'task_created' | 'task_completed'
       | 'artifact_created' | 'memory_extracted' | 'auth_event' | 'error'
       | 'provider_switch' | 'auto_execution' | 'app_boot' | 'model_added';
  /** Event timestamp (ISO 8601) */
  timestamp: string;
  /** ID of the associated session (if applicable) */
  sessionId?: string;
  /** ID of the associated message (if applicable) */
  messageId?: string;
  /** ID of the associated task (if applicable) */
  taskId?: string;
  /** Provider name (for LLM-related events) */
  provider?: string;
  /** Model ID (for LLM-related events) */
  model?: string;
  /** Numeric value (e.g., token count, latency ms) */
  value?: number;
  /** Additional metadata (structured) */
  metadata?: Record<string, unknown>;
  /** Human-readable description */
  description?: string;
}
```

---

#### 2.12 Attachment

```typescript
/**
 * A file attachment on a chat message.
 */
interface Attachment {
  /** Unique attachment identifier (UUID) */
  id: string;
  /** Original file name */
  name: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Base64-encoded file content (for multimodal sending) */
  data: string;
  /** Whether this is an image */
  isImage: boolean;
  /** Thumbnail data URL (for images) */
  thumbnail?: string;
}
```

---

#### 2.13 ToolCall

```typescript
/**
 * A tool call made during an agent-mode ReAct loop.
 */
interface ToolCall {
  /** Unique tool call identifier */
  id: string;
  /** Tool name (e.g., 'google_search_retrieval', 'code_execution') */
  name: string;
  /** Tool input arguments (JSON string) */
  input: string;
  /** Tool output result (JSON string) */
  output?: string;
  /** Whether the tool call succeeded */
  success: boolean;
  /** Execution time in milliseconds */
  durationMs?: number;
}
```

---

#### 2.14 AuthLogEntry

```typescript
/**
 * An authentication event log entry.
 */
interface AuthLogEntry {
  /** Unique log identifier (UUID) */
  id: string;
  /** Event type */
  type: 'login' | 'logout' | 'register' | 'oauth_start' | 'oauth_complete'
       | 'session_restore' | 'session_expired' | 'admin_promoted';
  /** Timestamp (ISO 8601) */
  timestamp: string;
  /** User ID (if authenticated) */
  userId?: string;
  /** Auth provider used */
  provider?: 'email' | 'google';
  /** Client IP address (logged server-side for security) */
  ipAddress?: string;
  /** Whether the event was successful */
  success: boolean;
  /** Error message if failed */
  errorMessage?: string;
}
```

---

#### 2.15 BannedNode

```typescript
/**
 * A banned IP address record (Excommunicado Protocol).
 */
interface BannedNode {
  /** The banned IP address (also used as IndexedDB key) */
  id: string;
  /** Reason for banning */
  reason: 'rate_limit_exceeded' | 'malicious_request' | 'manual_ban';
  /** Timestamp of ban (ISO 8601) */
  bannedAt: string;
  /** Request count that triggered the ban */
  requestCount: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Whether this ban is permanent */
  permanent: boolean;
  /** Auto-lift timestamp (if not permanent, ISO 8601) */
  expiresAt?: string;
}
```

---

#### 2.16 AppConfig (Composite)

```typescript
/**
 * Root configuration object stored as singleton in 'config' store.
 */
interface AppConfig {
  apiKeys: Record<string, string>;
  customModels: CustomModel[];
  promptTemplates: PromptTemplate[];
  locale: 'ar' | 'en';
  theme: 'dark';
  defaultProvider: string;
  defaultModel: string;
  autoExtractTasks: boolean;
  autoExtractMemories: boolean;
  autoExecuteTasks: boolean;
  voiceEnabled: boolean;
  ttsEnabled: boolean;
  chatMode: 'chat' | 'agent' | 'code' | 'research';
}
```

---

#### 2.17 AppState (Composite)

```typescript
/**
 * Root application state stored as singleton in 'state' store.
 */
interface AppState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  tasks: Task[];
  activeAgentId: string | null;
  agents: AgentState[];
  projects: Project[];
}
```

---

## 3. Relationship Diagram

### رسم العلاقات — Entity References

```
┌─────────────┐       1:N        ┌──────────────┐
│  User       │────────────────→│ ChatSession  │
│             │  (user creates  │              │
└─────────────┘   sessions)     └──────┬───────┘
                                          │
                               1:N        │
                                          ▼
                                   ┌──────────────┐
                                   │ ChatMessage  │
                                   │              │
                                   └──┬───┬───┬───┘
                                      │   │   │
                         0:N          │   │   │          0:N
                    ┌─────────────────┘   │   └─────────────────┐
                    ▼                     ▼                       ▼
             ┌──────────────┐     ┌──────────────┐        ┌──────────────┐
             │  Artifact    │     │   ToolCall   │        │ UserMemory   │
             │              │     │              │        │  (NEW v4)    │
             └──────────────┘     └──────────────┘        └──────────────┘
                                                                    │
                                                              References
n                                                                    │
                                                              ┌─────┴──────┐
                                                              │ChatSession │
                                                              │ChatMessage │
                                                              └────────────┘

┌──────────────┐       0:N        ┌──────────────┐
│ ChatSession  │────────────────→│    Task      │
│              │  (tasks can be  │  (Enriched)  │
└──────────────┘   linked to     └──────────────┘
                    sessions)          │
                                        │ autoExecute
                                        ▼
                                 ┌──────────────┐
                                 │ TaskScheduler│
                                 │ (runtime)    │
                                 └──────────────┘

┌──────────────┐       0:N        ┌──────────────┐
│    User      │────────────────→│  AgentState  │
│              │  (user configs  │              │
└──────────────┘   agents)       └──────────────┘

┌──────────────┐       0:N        ┌──────────────┐
│    User      │────────────────→│   Project    │
│              │                  │              │
└──────────────┘                  └──────────────┘

┌──────────────┐  (logs anything)  ┌──────────────┐
│  EventLog    │←──────────────────│  Any Entity  │
│              │                   │              │
└──────────────┘                   └──────────────┘

┌──────────────┐  (auth events)    ┌──────────────┐
│ AuthLogEntry │←──────────────────│    User      │
│              │                   │              │
└──────────────┘                   └──────────────┘
```

### Reference Summary Table

| Source Entity | References | Field | Relationship |
|--------------|------------|-------|-------------|
| `ChatSession` | `ChatMessage` | `sessions.messages[]` | 1:N (embedded) |
| `ChatMessage` | `Attachment` | `attachments[]` | 0:N (embedded) |
| `ChatMessage` | `ToolCall` | `toolCalls[]` | 0:N (embedded) |
| `ChatMessage` | `Artifact` | `artifactIds[]` | 0:N (by ID) |
| `ChatMessage` | `ChatSession` | `sessionId` | N:1 |
| `Task` | `ChatSession` | `sessionId` | N:1 (optional) |
| `Task` | `ChatMessage` | `messageId` | N:1 (optional) |
| `Artifact` | `ChatMessage` | `messageId` | N:1 |
| `Artifact` | `ChatSession` | `sessionId` | N:1 |
| `UserMemory` | `ChatSession` | `sessionId` | N:1 |
| `UserMemory` | `ChatMessage` | `messageId` | N:1 |
| `Project` | `ChatSession` | `sessionIds[]` | 1:N (by ID) |
| `Project` | `Task` | `taskIds[]` | 1:N (by ID) |
| `EventLog` | `ChatSession` | `sessionId` | N:1 (optional) |
| `EventLog` | `ChatMessage` | `messageId` | N:1 (optional) |
| `EventLog` | `Task` | `taskId` | N:1 (optional) |

---

## 4. Data Lifecycle

### دورة حياة البيانات — Creation, Update, Deletion Triggers

#### 4.1 Creation Triggers

| Entity | Trigger | Creator | Store |
|--------|---------|---------|-------|
| `ChatSession` | User starts new chat | `workspaceStore.addSession()` | `state` |
| `ChatMessage` (user) | User sends message | `workspaceStore.addMessage()` | `state` (embedded) |
| `ChatMessage` (assistant) | LLM response complete | `useChat()` hook | `state` (embedded) |
| `Task` (manual) | User creates via form | `taskStore.addTask()` | `state` |
| `Task` (AI) | LearningEngine extraction (50% prob) | `LearningEngine.extractTasks()` | `state` |
| `Artifact` | Post-stream extraction | `ArtifactExtractor` | `artifacts` |
| `UserMemory` | MemoryEngine extraction | `MemoryEngine.extractMemories()` | `userMemory` |
| `EventLog` | Any significant action | `EventLogger.log()` | `logs` |
| `AuthLogEntry` | Auth event | `AuthService` | `auth_logs` |
| `BannedNode` | Rate limit breach | Express proxy middleware | `banned_nodes` |
| `CustomModel` | User adds via 4-field form | `configStore.addCustomModel()` | `config` |
| `PromptTemplate` | User saves template | `configStore.addTemplate()` | `config` |
| `AgentState` | User creates agent | `workspaceStore.addAgent()` | `state` |
| `Project` | User creates project | `workspaceStore.addProject()` | `state` |

#### 4.2 Update Triggers

| Entity | Trigger | Updater |
|--------|---------|---------|
| `ChatSession` | New message, title change, archive toggle | `workspaceStore` |
| `Task` | Status change, execution result, priority update | `taskStore` or `TaskScheduler` |
| `UserMemory` | accessCount increment on prompt injection | `MemoryEngine` |
| `EventLog` | Not updated (append-only) | — |
| `AppConfig` | Any settings change | `configStore` |

#### 4.3 Deletion Triggers

| Entity | Trigger | Deleter | Cascade |
|--------|---------|---------|---------|
| `ChatSession` | User deletes session | `workspaceStore.deleteSession()` | Messages deleted (embedded) |
| `Task` | User deletes task | `taskStore.deleteTask()` | None |
| `Artifact` | User deletes artifact | `artifactStore.deleteArtifact()` | None |
| `UserMemory` | TTL expired (>90 days) | `MemoryEngine.cleanup()` | None |
| `UserMemory` | User manually deletes | `MemoryEngine.deleteMemory()` | None |
| `CustomModel` | User removes model | `configStore.removeCustomModel()` | API key retained until removed |
| `BannedNode` | Ban expires or admin unbans | Express proxy | None |
| `EventLog` | User clears logs / auto-prune (>1000 entries) | `EventLogger.prune()` | None |

---

## 5. Migration Strategy

### استراتيجية الترحيل — IndexedDB Version Migrations

IndexedDB uses versioned schema upgrades. When the database version changes, the `onupgradeneeded` callback fires, allowing schema modifications.

#### Migration History

| Version | Change | Stores Affected |
|---------|--------|----------------|
| v1 | Initial schema | `config`, `state`, `logs` |
| v2 | Added artifacts | `artifacts` (new) |
| v3 | Added auth tracking + IP banning | `auth_logs` (new), `banned_nodes` (new) |
| **v4** | **Added cumulative memory** | **`userMemory` (new)** |

#### v3 → v4 Migration (Current)

```typescript
/**
 * IndexedDB upgrade handler for Monmamar database.
 * Called automatically when version number increases.
 */
function upgradeMonmamar(
  db: IDBDatabase,
  oldVersion: number,
  newVersion: number,
  transaction: IDBTransaction
): void {
  // v1: Create initial stores
  if (oldVersion < 1) {
    db.createObjectStore('config');
    db.createObjectStore('state');
    db.createObjectStore('logs');
  }

  // v2: Add artifacts store
  if (oldVersion < 2) {
    db.createObjectStore('artifacts');
  }

  // v3: Add auth and security stores
  if (oldVersion < 3) {
    db.createObjectStore('auth_logs');
    db.createObjectStore('banned_nodes');
  }

  // v4: Add userMemory store (NEW in v2.0.0-Rewrite)
  if (oldVersion < 4) {
    const memoryStore = db.createObjectStore('userMemory');
    // Create index for efficient TTL cleanup queries
    memoryStore.createIndex('expiresAt', 'expiresAt', { unique: false });
    memoryStore.createIndex('category', 'category', { unique: false });
    memoryStore.createIndex('key', 'key', { unique: false });
  }
}
```

#### Future Migration Planning

| Target Version | Planned Change | Impact |
|---------------|---------------|--------|
| v5 | Add `embeddings` store for RAG | New store, optional feature flag |
| v6 | Migrate messages from embedded to separate store | Data restructuring, bulk operation |
| v7 | Add `workflows` store for agent-to-agent | New store |

#### Rollback Strategy

IndexedDB does not support downgrading version numbers. If a migration fails:

1. **Detection:** Catch error in `onupgradeneeded`
2. **Fallback:** Delete the entire database and re-create at target version
3. **Data Loss Warning:** Show user notification: "Database upgraded. Some data may need to be re-entered."
4. **Prevention:** Always back up critical stores (`config`, `state`) before migration

---

## 6. Data Validation Rules

### قواعد التحقق — Field-Level Validation

#### User

| Field | Rule | Error Message (EN) | Error Message (AR) |
|-------|------|-------------------|-------------------|
| `email` | Valid email format (RFC 5322) | "Invalid email format" | "صيغة البريد الإلكتروني غير صالحة" |
| `displayName` | 1-50 characters | "Name must be 1-50 characters" | "يجب أن يكون الاسم 1-50 حرفاً" |

#### ChatSession

| Field | Rule | Error Message (EN) | Error Message (AR) |
|-------|------|-------------------|-------------------|
| `title` | 1-200 characters | "Title required (max 200 chars)" | "العنوان مطلوب (200 حرف كحد أقصى)" |
| `provider` | Must be in provider registry | "Unknown provider" | "مزود غير معروف" |
| `mode` | One of: chat, agent, code, research | "Invalid chat mode" | "وضع محادثة غير صالح" |

#### ChatMessage

| Field | Rule | Error Message (EN) | Error Message (AR) |
|-------|------|-------------------|-------------------|
| `content` | Required, non-empty string | "Message cannot be empty" | "لا يمكن أن تكون الرسالة فارغة" |
| `content` | Max 100,000 characters | "Message too long (max 100K chars)" | "الرسالة طويلة جداً (100K حرف كحد أقصى)" |
| `role` | One of: user, assistant, system, tool | "Invalid message role" | "دور رسالة غير صالح" |

#### Task

| Field | Rule | Error Message (EN) | Error Message (AR) |
|-------|------|-------------------|-------------------|
| `title` | Required, 1-200 characters | "Task title required (max 200 chars)" | "عنوان المهمة مطلوب (200 حرف كحد أقصى)" |
| `priority` | One of: low, medium, high, urgent | "Invalid priority" | "أولوية غير صالحة" |
| `status` | One of: pending, in_progress, completed, failed | "Invalid status" | "حالة غير صالحة" |
| `dueDate` | Valid ISO 8601 datetime, not in past (for creation) | "Due date must be in the future" | "يجب أن يكون تاريخ الاستحقاق في المستقبل" |
| `retryCount` | >= 0, <= maxRetries | "Retry count exceeded" | "تجاوز عدد المحاولات" |

#### CustomModel (4-Field Form)

| Field | Rule | Error Message (EN) | Error Message (AR) |
|-------|------|-------------------|-------------------|
| `provider` | Non-empty, valid identifier | "Provider is required" | "المزود مطلوب" |
| `modelId` | Non-empty, alphanumeric + `.:_-` | "Invalid model ID format" | "صيغة معرف النموذج غير صالحة" |
| `endpoint` | Valid URL (http/https) | "Invalid endpoint URL" | "رابط غير صالح" |
| `endpoint` | HTTPS preferred (warn on HTTP) | "HTTPS recommended for security" | "يُوصى باستخدام HTTPS للأمان" |
| `apiKeys[provider]` | Required unless provider = 'ollama' | "API key required for this provider" | "مفتاح API مطلوب لهذا المزود" |

#### UserMemory

| Field | Rule | Validation |
|-------|------|------------|
| `key` | Non-empty, max 100 chars, unique (dedup) | Dedup by key on insert |
| `value` | Non-empty, max 2000 chars | Truncate if longer |
| `category` | One of: personal, work, preference, fact, project | Enum validation |
| `confidence` | 0.0 - 1.0 | Clamped on insert |
| `expiresAt` | Must be > createdAt | Auto-calculated: createdAt + 90 days |

#### Attachment

| Field | Rule | Validation |
|-------|------|------------|
| `size` | Max 10MB (10,485,760 bytes) | Reject with error |
| `mimeType` | Allowed: image/*, application/pdf, text/*, application/json | Reject unsupported types |
| `data` | Valid base64 | Decode and re-encode to validate |

---

## 7. Storage Quota Management

### إدارة حصة التخزين

IndexedDB shares storage with the browser's origin quota. Wazeer OS must manage this responsibly per the **Green Code** principle.

#### Storage Estimates

| Store | Avg Entry Size | Typical Count | Estimated Total |
|-------|---------------|---------------|----------------|
| `config` | ~5KB (singleton) | 1 | 5KB |
| `state` | ~50-500KB (grows with sessions) | 1 | 50-500KB |
| `logs` | ~0.5KB | 1,000 | 500KB |
| `artifacts` | ~5-50KB | 100 | 500KB-5MB |
| `auth_logs` | ~0.3KB | 200 | 60KB |
| `banned_nodes` | ~0.2KB | 50 | 10KB |
| `userMemory` | ~0.3KB | 500 | 150KB |
| **Total** | | | **~1-6MB typical** |

#### Quota Strategy

| Strategy | Implementation |
|----------|---------------|
| **Monitor** | Use `navigator.storage.estimate()` to track usage vs quota |
| **Warn at 75%** | Show toast: "Storage is 75% full. Consider clearing old data." |
| **Warn at 90%** | Show modal: "Storage critically low. Auto-cleanup recommended." |
| **Auto-Cleanup** | Prune `logs` entries older than 30 days when >90% full |
| **Memory TTL** | `userMemory` entries auto-expire at 90 days, cleanup on boot |
| **Log Pruning** | Keep max 1,000 log entries, delete oldest beyond that |
| **User Control** | Settings page: "Clear All Data", "Export Data", individual store cleanup |

#### Storage Monitoring Hook

```typescript
/**
 * Hook to monitor IndexedDB storage usage.
 * Warns user when approaching quota limits.
 */
function useStorageMonitor(): {
  usage: number;       // Bytes used
  quota: number;       // Bytes available
  percentage: number;  // Usage percentage
  warningLevel: 'none' | 'caution' | 'warning' | 'critical';
} {
  // Uses navigator.storage.estimate()
  // Polls every 60 seconds
  // Triggers warnings at 75% and 90%
  // Auto-cleanup at 90% (logs only)
}
```

---

> صُنع بـ ❤️ بواسطة العرآب | حقوق النشر 100MillionDEV.com  
> 𓂀 Wazeer OS — Enterprise Edition v2.0.0-Rewrite