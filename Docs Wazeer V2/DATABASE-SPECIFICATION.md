# Database Specification — IndexedDB Monmamar v4

> Wazeer OS / وزير OS v2.0.0-Rewrite | 𓂀 Amoun / أمون
> Author: 100MillionDEV / العرآب
> Database Name: **Monmamar** (مُنَمَّر — meaning: "organized, structured")
> Version: **v4** (upgraded from v3)
> Principle: **Separation of Concerns** — Each store has a single responsibility

---

## 1. Database Overview / نظرة عامة

### Why IndexedDB?

| Requirement | IndexedDB | localStorage | SQLite (WASM) | Remote DB |
|-------------|-----------|-------------|---------------|----------|
| Large storage (>5MB) | ✅ | ❌ | ✅ | ✅ |
| Structured queries | ✅ | ❌ | ✅ | ✅ |
| Offline-first | ✅ | ✅ | ✅ | ❌ |
| No server needed | ✅ | ✅ | ✅ | ❌ |
| Complex objects | ✅ | ❌ (JSON only) | ✅ | ✅ |
| Transaction support | ✅ | ❌ | ✅ | ✅ |
| Bundle size impact | 0KB (native) | 0KB (native) | ~500KB | 0KB (server) |
| Browser support | 97%+ | 99%+ | 95%+ | N/A |

### Database Identity

```typescript
const DB_NAME = 'monmamar';
const DB_VERSION = 4;
```

### Store Inventory

| # | Store Name | Version Added | Purpose | Primary Key |
|---|-----------|---------------|---------|-------------|
| 1 | `config` | v1 | App configuration, LLM keys, preferences | `key` (string) |
| 2 | `state` | v1 | Persisted UI state (panel positions, etc.) | `key` (string) |
| 3 | `logs` | v1 | Application event log | `id` (autoIncrement) |
| 4 | `artifacts` | v2 | Generated code, images, documents | `id` (autoIncrement) |
| 5 | `auth_logs` | v3 | Authentication event records | `id` (autoIncrement) |
| 6 | `banned_nodes` | v3 | IP ban records (Excommunicado) | `ip_hash` (string) |
| 7 | `userMemory` | v4 | Persistent user memories (NEW) | `id` (autoIncrement) |

### Schema Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                 IndexedDB: monmamar v4                      │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ config   │  │ state    │  │  logs    │  │artifacts │  │
│  │ key(PK)  │  │ key(PK)  │  │ id(PK)   │  │ id(PK)   │  │
│  │ value    │  │ value    │  │ ts(idx)  │  │ type(idx)│  │
│  │ ts(idx)  │  │          │  │ level(idx)│ │ ts(idx)  │  │
│  │          │  │          │  │ agent(idx)│ │ agent(idx)│  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │auth_logs │  │ banned_nodes │  │ userMemory   │         │
│  │ id(PK)   │  │ ip_hash(PK)  │  │ id(PK)       │         │
│  │ ts(idx)  │  │ bannedAt(idx)│  │ key(idx)     │         │
│  │ type(idx)│  │ reason(idx)  │  │ ts(idx)      │         │
│  │ uid(idx) │  │              │  │ category(idx)│         │
│  └──────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Store Specifications / مواصفات المخازن

### 2.1 `config` Store

**Purpose:** Key-value store for application configuration. Stores LLM API keys (BYOK), user preferences, theme settings, and feature flags.

**Key Path:** `key` (out-of-line)

**Indexes:**

| Index Name | Key Path | Unique | Options | Use Case |
|------------|----------|--------|---------|----------|
| `by_timestamp` | `updatedAt` | No | — | Find recently updated configs |

**Record Shape:**

```typescript
interface ConfigRecord {
  key: string;           // Primary key — e.g., 'theme', 'language', 'llm_keys'
  value: unknown;        // Any JSON-serializable value
  updatedAt: number;     // Unix timestamp — last modification
  createdAt: number;     // Unix timestamp — creation time
}
```

**Known Keys:**

| Key | Value Type | Description |
|-----|-----------|-------------|
| `theme` | `'egyptian-cyberpunk' \| 'light' \| 'high-contrast'` | Active theme |
| `language` | `'ar' \| 'en'` | UI language |
| `voice_enabled` | `boolean` | TTS voice output |
| `llm_keys` | `LLMKeyConfig[]` | Array of provider key configs |
| `default_provider` | `string` | Active LLM provider ID |
| `default_model` | `string` | Active model ID |
| `feature_flags` | `Record<string, boolean>` | Feature toggle states |
| `dashboard_layout` | `DashboardLayoutConfig` | Saved dashboard arrangement |

**Data Access Patterns:**

```typescript
// Read
const theme = await db.get('config', 'theme');

// Write
await db.put('config', { key: 'theme', value: 'egyptian-cyberpunk', updatedAt: Date.now(), createdAt: Date.now() });

// Update LLM keys (read-modify-write)
const tx = db.transaction('config', 'readwrite');
const store = tx.objectStore('config');
const current = await store.get('llm_keys');
current.value.push(newKeyConfig);
await store.put(current);
await tx.done;
```

---

### 2.2 `state` Store

**Purpose:** Persisted UI state that survives page reload. Panel collapse states, sidebar width, scroll positions, and other transient-but-persistent UI state.

**Key Path:** `key` (out-of-line)

**Record Shape:**

```typescript
interface StateRecord {
  key: string;           // e.g., 'sidebar_collapsed', 'active_panel', 'scroll_pos'
  value: unknown;
  updatedAt: number;
}
```

**Known Keys:**

| Key | Value Type | Default | Description |
|-----|-----------|---------|-------------|
| `sidebar_collapsed` | `boolean` | `false` | Mobile sidebar state |
| `active_panel` | `string` | `'chat'` | Currently visible panel |
| `chat_scroll_pos` | `number` | `0` | Chat scroll position |
| `last_agent_id` | `string` | `null` | Last active agent |

---

### 2.3 `logs` Store

**Purpose:** Application-wide event log. All significant events (errors, warnings, info) are recorded for debugging and the LearningEngine.

**Key Path:** `id` (autoIncrement)

**Indexes:**

| Index Name | Key Path | Unique | Options | Use Case |
|------------|----------|--------|---------|----------|
| `by_timestamp` | `timestamp` | No | `{ unique: false }` | Query logs by time range |
| `by_level` | `level` | No | `{ unique: false }` | Query all errors/warnings |
| `by_agent` | `agentId` | No | `{ unique: false }` | Query logs for specific agent |

**Record Shape:**

```typescript
interface LogRecord {
  id?: number;           // Auto-incremented primary key
  timestamp: number;     // Unix timestamp (ms)
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  source: string;        // Module name — e.g., 'AIGateway', 'HorusGuard'
  message: string;       // Log message (sanitized)
  agentId?: string;      // Associated agent ID (if applicable)
  data?: unknown;        // Additional structured data
  sanitized: boolean;    // Whether prompt sanitizer was applied
}
```

**Data Access Patterns:**

```typescript
// Get last 100 logs
const tx = db.transaction('logs', 'readonly');
const index = tx.store.index('by_timestamp');
const logs = await index.getAll(null, 100);
// Note: iterate in reverse for newest first

// Get all errors
const errorLogs = await db.getAllFromIndex('logs', 'by_level', 'error');

// Get logs for specific agent
const agentLogs = await db.getAllFromIndex('logs', 'by_agent', 'agent-uuid-here');
```

---

### 2.4 `artifacts` Store

**Purpose:** Stores generated artifacts — code blocks, documents, images, and any output produced by AI agents.

**Key Path:** `id` (autoIncrement)

**Indexes:**

| Index Name | Key Path | Unique | Options | Use Case |
|------------|----------|--------|---------|----------|
| `by_type` | `type` | No | `{ unique: false }` | Filter by artifact type |
| `by_timestamp` | `createdAt` | No | `{ unique: false }` | Chronological listing |
| `by_agent` | `agentId` | No | `{ unique: false }` | Agent's output history |

**Record Shape:**

```typescript
interface ArtifactRecord {
  id?: number;
  type: 'code' | 'document' | 'image' | 'data' | 'html';
  title: string;
  content: string;         // The actual artifact content
  mimeType: string;        // e.g., 'text/plain', 'text/html', 'image/png'
  agentId: string;         // Agent that generated it
  conversationId?: string; // Associated conversation
  createdAt: number;
  sizeBytes: number;       // For storage quota tracking
  metadata?: Record<string, string>; // Language, framework, etc.
}
```

---

### 2.5 `auth_logs` Store

**Purpose:** Records all authentication events for security auditing and the local device trust system.

**Key Path:** `id` (autoIncrement)

**Indexes:**

| Index Name | Key Path | Unique | Options | Use Case |
|------------|----------|--------|---------|----------|
| `by_timestamp` | `timestamp` | No | — | Chronological auth events |
| `by_type` | `type` | No | — | Filter by event type |
| `by_uid` | `uid` | No | — | All events for a user |

**Record Shape:**

```typescript
interface AuthLogRecord {
  id?: number;
  timestamp: number;
  type: 'login' | 'logout' | 'token_refresh' | 'device_trust' | 'trust_fail' | 'signup';
  uid: string;            // Firebase UID (or 'anonymous')
  provider: 'email' | 'google' | 'anonymous';
  ipHash?: string;        // SHA-256 of IP (privacy)
  deviceFingerprint: string;
  success: boolean;
  errorMessage?: string;
}
```

---

### 2.6 `banned_nodes` Store

**Purpose:** Excommunicado Protocol — stores IP ban records for malicious or abusive clients.

**Key Path:** `ip_hash` (string — SHA-256 hash of IP address)

**Indexes:**

| Index Name | Key Path | Unique | Options | Use Case |
|------------|----------|--------|---------|----------|
| `by_banned_at` | `bannedAt` | No | — | Find recent bans |
| `by_reason` | `reason` | No | — | Filter by ban reason |

**Record Shape:**

```typescript
interface BannedNodeRecord {
  ip_hash: string;        // Primary key — SHA-256 of IP address
  reason: 'rate_limit' | 'malicious_payload' | 'manual' | 'brute_force';
  bannedAt: number;       // Unix timestamp
  bannedBy: 'system' | 'user';
  expiresAt: number | null; // null = permanent ban
  offenseCount: number;
  lastOffenseAt: number;
  notes?: string;
}
```

---

### 2.7 `userMemory` Store (NEW in v4) 🆕

**Purpose:** Persistent memory for the MemoryEngine. Stores user preferences, facts, and context that persist across conversations and sessions. Enables personalized AI interactions.

**Key Path:** `id` (autoIncrement)

**Indexes:**

| Index Name | Key Path | Unique | Options | Use Case |
|------------|----------|--------|---------|----------|
| `by_key` | `key` | Yes | `{ unique: true }` | Look up memory by semantic key |
| `by_timestamp` | `updatedAt` | No | — | Find recently updated memories |
| `by_category` | `category` | No | — | Filter by memory type |

**Record Shape:**

```typescript
interface UserMemoryRecord {
  id?: number;
  key: string;            // Semantic key — e.g., 'user_name', 'preferred_language'
  value: string;          // Memory value
  category: 'preference' | 'fact' | 'context' | 'instruction' | 'skill';
  confidence: number;     // 0.0–1.0 — how certain is this memory
  source: 'user_stated' | 'inferred' | 'system';
  conversationId?: string; // Origin conversation
  createdAt: number;
  updatedAt: number;
  accessCount: number;    // How often this memory is used
  lastAccessedAt: number;
}
```

**Category Definitions:**

| Category | Arabic | Description | Example |
|----------|--------|-------------|---------|
| `preference` | تفضيل | User's stated preferences | "I prefer dark theme", "أحب الوضع الداكن" |
| `fact` | حقيقة | Factual information about user | Name, job, location |
| `context` | سياق | Session/conversation context | Current project, active task |
| `instruction` | تعليمات | User's explicit instructions | "Always respond in Arabic" |
| `skill` | مهارة | User's skills/abilities | "Knows Python", "مهندس برمجيات" |

**Data Access Patterns:**

```typescript
// Store a new memory
await db.put('userMemory', {
  key: 'user_name',
  value: 'أحمد',
  category: 'fact',
  confidence: 1.0,
  source: 'user_stated',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  accessCount: 0,
  lastAccessedAt: Date.now(),
});

// Look up specific memory
const nameMemory = await db.getFromIndex('userMemory', 'by_key', 'user_name');

// Get all preferences
const preferences = await db.getAllFromIndex('userMemory', 'by_category', 'preference');

// Get recent memories (for context injection)
const recentIndex = db.transaction('userMemory').store.index('by_timestamp');
const recent = await recentIndex.getAll(null, 20); // Last 20 memories
```

---

## 3. Data Access Layer / طبقة الوصول للبيانات

### Using `idb-keyval`

Wazeer OS uses `idb-keyval` for simple key-value operations on `config` and `state` stores, and the raw `idb` (indexedDB) API for complex queries on indexed stores.

```typescript
// src/lib/db/index.ts
import { openDB, type IDBPDatabase } from 'idb';
import { get, set, del } from 'idb-keyval';

const DB_NAME = 'monmamar';
const DB_VERSION = 4;

let dbInstance: IDBPDatabase | null = null;

export async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // v1 stores
      if (oldVersion < 1) {
        const config = db.createObjectStore('config', { keyPath: 'key' });
        config.createIndex('by_timestamp', 'updatedAt');

        db.createObjectStore('state', { keyPath: 'key' });

        const logs = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
        logs.createIndex('by_timestamp', 'timestamp');
        logs.createIndex('by_level', 'level');
        logs.createIndex('by_agent', 'agentId');
      }

      // v2 stores
      if (oldVersion < 2) {
        const artifacts = db.createObjectStore('artifacts', { keyPath: 'id', autoIncrement: true });
        artifacts.createIndex('by_type', 'type');
        artifacts.createIndex('by_timestamp', 'createdAt');
        artifacts.createIndex('by_agent', 'agentId');
      }

      // v3 stores
      if (oldVersion < 3) {
        const authLogs = db.createObjectStore('auth_logs', { keyPath: 'id', autoIncrement: true });
        authLogs.createIndex('by_timestamp', 'timestamp');
        authLogs.createIndex('by_type', 'type');
        authLogs.createIndex('by_uid', 'uid');

        const bannedNodes = db.createObjectStore('banned_nodes', { keyPath: 'ip_hash' });
        bannedNodes.createIndex('by_banned_at', 'bannedAt');
        bannedNodes.createIndex('by_reason', 'reason');
      }

      // v4 stores (NEW)
      if (oldVersion < 4) {
        const userMemory = db.createObjectStore('userMemory', { keyPath: 'id', autoIncrement: true });
        userMemory.createIndex('by_key', 'key', { unique: true });
        userMemory.createIndex('by_timestamp', 'updatedAt');
        userMemory.createIndex('by_category', 'category');
      }
    },
  });

  return dbInstance;
}

// Simple key-value shortcuts for config/state
export const configDB = {
  get: (key: string) => get<ConfigRecord>(`config:${key}`),
  set: (key: string, value: unknown) => set(`config:${key}`, value),
  delete: (key: string) => del(`config:${key}`),
};
```

---

## 4. Transaction Isolation / عزل المعاملات

IndexedDB uses **snapshot isolation** by default. Each transaction sees a consistent snapshot of the database as it existed when the transaction started.

### Transaction Rules for Wazeer OS

| Rule | Implementation | Reason |
|------|---------------|--------|
| One writer at a time per store | Single `readwrite` transaction | IndexedDB enforces this |
| Batch writes in single transaction | Group `put()`/`delete()` calls | Prevents deadlocks, improves performance |
| Never hold transactions open across `await` | Complete all ops before `await tx.done` | Prevents auto-commit issues |
| Use `idb-keyval` for simple reads | `get()`/`set()` are auto-transacted | Simpler API for non-indexed stores |

### Anti-Pattern (AVOID)

```typescript
// ❌ BAD — Transaction auto-commits before second write
const tx = db.transaction('config', 'readwrite');
const store = tx.objectStore('config');
await store.get('theme');        // Transaction may commit here
await store.put(newTheme);       // Too late! Transaction already committed
```

### Correct Pattern

```typescript
// ✅ GOOD — All operations before any await
const tx = db.transaction('config', 'readwrite');
const store = tx.objectStore('config');
const current = store.get('theme');         // No await
store.put({ key: 'theme', value: 'light', ... }); // Sync call
const result = await current;               // Now await
await tx.done;                              // Explicit completion
```

---

## 5. Migration v3 → v4 / الترحيل

### What Changes

| Aspect | v3 | v4 |
|--------|-----|-----|
| Number of stores | 6 | **7** (added `userMemory`) |
| `config` schema | Unchanged | Unchanged |
| `userMemory` | Does not exist | **NEW** — auto-created on upgrade |

### Migration is Automatic

The `upgrade` callback in `openDB()` handles migration automatically. When a user opens Wazeer OS with v4 for the first time:

1. IndexedDB opens with version number 4
2. `upgrade(db, 3)` is called (oldVersion=3, newVersion=4)
3. `userMemory` store and its indexes are created
4. All existing data (v3 stores) is preserved untouched
5. Database opens successfully

### No Data Loss

- v3 stores are **not modified** during the upgrade
- Only a new store is added
- This is the safest type of migration (additive only)

---

## 6. Storage Quota Management / إدارة حصة التخزين

### Browser Quotas

| Browser | Typical Quota | With Prompt | Notes |
|---------|--------------|-------------|-------|
| Chrome (desktop) | 80% of free disk | "Store site data" | Can be unlimited with prompt |
| Firefox | 50% of free disk | — | No unlimited option |
| Safari | 1 GB | — | Strictest limit |
| Mobile Chrome | 10% of free disk | — | Much smaller |

### Wazeer OS Storage Budget

| Store | Estimated Size | Growth Rate | Purge Policy |
|-------|---------------|-------------|-------------|
| `config` | ~5 KB | Very slow | Never (user data) |
| `state` | ~2 KB | None | Never (UI state) |
| `logs` | ~100 KB/month | High | Keep last 10,000 entries |
| `artifacts` | ~500 KB/month | High | Keep last 500, LRU eviction |
| `auth_logs` | ~10 KB/month | Low | Keep last 1,000 entries |
| `banned_nodes` | ~1 KB | Very slow | Keep all |
| `userMemory` | ~20 KB | Slow | Keep all (user memories) |

### Quota Check

```typescript
// src/lib/db/quota.ts
export async function checkStorageQuota(): Promise<{ usage: number; quota: number; percent: number }> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage ?? 0;
    const quota = estimate.quota ?? 0;
    return {
      usage,
      quota,
      percent: quota > 0 ? (usage / quota) * 100 : 0,
    };
  }
  return { usage: 0, quota: 0, percent: 0 };
}

// Request persistent storage (prompt user for permission)
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    return await navigator.storage.persist();
  }
  return false;
}
```

---

## 7. Fallback: In-Memory Store / الاحتياطي: الذاكرة المؤقتة

### When IndexedDB is Unavailable

In rare cases (private browsing in some browsers, corrupted database, storage disabled), IndexedDB may be unavailable. Wazeer OS falls back to an in-memory store.

```typescript
// src/lib/db/fallback.ts
export class InMemoryDB {
  private stores = new Map<string, Map<unknown, unknown>>();

  private getStore(name: string): Map<unknown, unknown> {
    if (!this.stores.has(name)) {
      this.stores.set(name, new Map());
    }
    return this.stores.get(name)!;
  }

  async get(storeName: string, key: unknown): Promise<unknown> {
    return this.getStore(storeName).get(key);
  }

  async put(storeName: string, value: unknown): Promise<unknown> {
    const record = value as Record<string, unknown>;
    const key = record['key'] ?? record['id'];
    this.getStore(storeName).set(key, value);
    return key;
  }

  async delete(storeName: string, key: unknown): Promise<void> {
    this.getStore(storeName).delete(key);
  }

  async clear(storeName: string): Promise<void> {
    this.getStore(storeName).clear();
  }

  // ⚠️ WARNING: Data is lost on page reload
  isPersistent = false;
}
```

### Fallback Behavior

| Scenario | Detection | Behavior | User Notification |
|----------|-----------|----------|-------------------|
| IndexedDB unavailable | `openDB()` throws | Fall back to `InMemoryDB` | Banner: "التخزين المؤقت — البيانات لن تُحفظ" |
| Quota exceeded | Write throws `QuotaExceededError` | Purge old logs/artifacts | Banner: "مساحة التخزين منخفضة" |
| Corrupted database | Version upgrade fails | Delete and recreate | Banner: "تم إعادة تعيين قاعدة البيانات" |

---

## 8. Performance Optimization / تحسين الأداء

### Index Usage Guidelines

| Pattern | Use Index | Avoid |
|---------|-----------|-------|
| Get single record by key | `store.get(key)` | Scanning all records |
| Get records by time range | `index.getAll(lowerBound, upperBound)` | `store.getAll()` + filter |
| Get records by category | `index.getAll(category)` | Full table scan |
| Count records | `index.count()` | `getAll().length` |
| Check existence | `store.getKey(key)` (faster) | `store.get(key)` (loads full record) |

### Batch Operations

```typescript
// Batch insert multiple artifacts in a single transaction
async function batchInsertArtifacts(artifacts: ArtifactRecord[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('artifacts', 'readwrite');
  const store = tx.objectStore('artifacts');

  for (const artifact of artifacts) {
    store.add(artifact);  // Sync call within transaction
  }

  await tx.done;  // Commits all at once
}
```

---

> 𓂀 *Monmamar — every byte organized, every record purposeful. The database is the memory of the system.* — Wazeer OS Data Engineering
