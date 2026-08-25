# Analytics — Wazeer OS v2.0.0-Rewrite

> 𓂀 Wazeer OS (وزير OS) — Event Logging & Analytics System  
> Document Owner: Backend & Product Team | Last Updated: 2025-01  
> Classification: Internal — Engineering & Product

---

## Table of Contents

1. [Overview & Privacy Foundation](#overview--privacy-foundation)
2. [Event Taxonomy](#event-taxonomy)
3. [Event Schemas](#event-schemas)
4. [useEventLogger Implementation](#useeventlogger-implementation)
5. [Dashboard Metrics Definitions](#dashboard-metrics-definitions)
6. [7-Day Retention Data Model](#7-day-retention-data-model)
7. [Agent-Specific Analytics](#agent-specific-analytics)
8. [Privacy Considerations](#privacy-considerations)
9. [Appendix: Event Flow Diagram](#appendix-event-flow-diagram)

---

## Overview & Privacy Foundation

### Design Philosophy

Wazeer OS analytics are **100% on-device**. No telemetry, no tracking pixels, no analytics servers. All event data lives in the user's browser IndexedDB and is never transmitted externally. This is not a feature we bolted on — it's a fundamental architectural decision aligned with the "Security as Mindset" principle.

### Why We Track Anything

Even on-device analytics serve critical purposes:
1. **User insight** — The LlmDashboard helps users understand their own AI usage patterns
2. **System health** — Error rate trends help diagnose issues without needing external monitoring
3. **Optimization** — Token usage data helps users choose the most efficient models
4. **Agent performance** — Per-agent metrics help users evaluate swarm effectiveness

### Data Lifecycle

```
Event Created → Stored in useEventLogger (Zustand, in-memory)
              → Persisted to CONFIG store (IndexedDB)
              → Displayed in LlmDashboard (real-time)
              → Pruned after 7 days (automatic)
              → User can manually export (JSON) or clear all data
```

---

## Event Taxonomy

### Categories

| Category | Prefix | Description | Examples |
|---|---|---|---|
| **Authentication** | `auth` | User sign-in, sign-out, session events | `auth.login`, `auth.logout`, `auth.session_restore` |
| **Chat** | `chat` | Message send/receive, conversation lifecycle | `chat.message_sent`, `chat.message_received` |
| **Task** | `task` | Task creation, completion, modification | `task.created`, `task.completed`, `task.deleted` |
| **Memory** | `memory` | Memory extraction and management | `memory.extracted`, `memory.cleared` |
| **Model** | `model` | Model configuration and switching | `model.switched`, `model.added`, `model.error` |
| **Tool** | `tool` | Agent tool usage | `tool.call`, `tool.result`, `tool.error` |
| **Error** | `error` | System and model errors | `error.api`, `error.network`, `error.validation` |
| **System** | `system` | App lifecycle, PWA, performance | `system.startup`, `system.pwa_install`, `system.theme_change` |

### Event Severity Levels

| Level | Usage | Dashboard Impact |
|---|---|---|
| `info` | Normal operations (message sent, model switched) | Counted in operations metrics |
| `warn` | Non-critical issues (rate limited, slow response) | Counted in warnings, not errors |
| `error` | Failures requiring attention (API error, timeout) | Counted in error rate |

---

## Event Schemas

### Base Event Schema

Every event shares this base structure:

```typescript
interface BaseEvent {
  id: string;           // UUID v4
  type: string;         // Event type (e.g., "chat.message_sent")
  category: string;     // Event category (e.g., "chat")
  timestamp: number;    // Unix timestamp (ms)
  severity: 'info' | 'warn' | 'error';
  metadata: Record<string, unknown>;  // Event-specific data
}
```

### Authentication Events

#### `auth.login`
```typescript
interface AuthLoginEvent extends BaseEvent {
  type: 'auth.login';
  category: 'auth';
  metadata: {
    provider: 'google' | 'email' | 'anonymous';
    userId?: string;       // Hashed, not raw
    sessionId: string;
  };
}
```

#### `auth.logout`
```typescript
interface AuthLogoutEvent extends BaseEvent {
  type: 'auth.logout';
  category: 'auth';
  metadata: {
    sessionId: string;
    duration: number;     // Session duration in seconds
  };
}
```

#### `auth.session_restore`
```typescript
interface AuthSessionRestoreEvent extends BaseEvent {
  type: 'auth.session_restore';
  category: 'auth';
  metadata: {
    sessionId: string;
    lastActive: number;    // Timestamp of last activity
  };
}
```

### Chat Events

#### `chat.message_sent`
```typescript
interface ChatMessageSentEvent extends BaseEvent {
  type: 'chat.message_sent';
  category: 'chat';
  metadata: {
    conversationId: string;
    messageLength: number;    // Character count
    hasAttachment: boolean;
    hasCodeBlock: boolean;
    model: string;            // Active model name
    language: 'ar' | 'en' | 'mixed';
  };
}
```

#### `chat.message_received`
```typescript
interface ChatMessageReceivedEvent extends BaseEvent {
  type: 'chat.message_received';
  category: 'chat';
  metadata: {
    conversationId: string;
    responseLength: number;
    tokensUsed: number;
    model: string;
    latency: number;          // Response time in ms
    hasCodeBlock: boolean;
    hasArtifact: boolean;
    taskExtracted: boolean;
    memoryExtracted: boolean;
  };
}
```

### Task Events

#### `task.created`
```typescript
interface TaskCreatedEvent extends BaseEvent {
  type: 'task.created';
  category: 'task';
  metadata: {
    taskId: string;
    title: string;           // Max 100 chars, sanitized
    source: 'chat' | 'manual' | 'editor';
    priority: 'critical' | 'high' | 'medium' | 'low';
    model: string;           // Which model extracted/created it
  };
}
```

#### `task.completed`
```typescript
interface TaskCompletedEvent extends BaseEvent {
  type: 'task.completed';
  category: 'task';
  metadata: {
    taskId: string;
    duration: number;        // Time from creation to completion (ms)
    completedBy: 'user' | 'agent';
  };
}
```

#### `task.deleted`
```typescript
interface TaskDeletedEvent extends BaseEvent {
  type: 'task.deleted';
  category: 'task';
  metadata: {
    taskId: string;
    reason: 'manual' | 'auto';
  };
}
```

### Memory Events

#### `memory.extracted`
```typescript
interface MemoryExtractedEvent extends BaseEvent {
  type: 'memory.extracted';
  category: 'memory';
  metadata: {
    memoryId: string;
    category: string;        // 'preference' | 'fact' | 'context' | 'instruction'
    source: string;          // Conversation ID
    model: string;
  };
}
```

### Model Events

#### `model.switched`
```typescript
interface ModelSwitchedEvent extends BaseEvent {
  type: 'model.switched';
  category: 'model';
  metadata: {
    from: string;            // Previous model name
    to: string;              // New model name
    reason: 'user' | 'auto' | 'error_fallback';
  };
}
```

#### `model.error`
```typescript
interface ModelErrorEvent extends BaseEvent {
  type: 'model.error';
  category: 'model';
  severity: 'error';
  metadata: {
    model: string;
    errorCode: string;      // API error code or 'timeout' | 'rate_limited'
    errorMessage: string;    // Sanitized for display
    retryAttempt?: number;
  };
}
```

### Tool Events

#### `tool.call`
```typescript
interface ToolCallEvent extends BaseEvent {
  type: 'tool.call';
  category: 'tool';
  metadata: {
    toolName: string;        // 'search', 'code_execute', 'file_read', etc.
    agent: string;           // 'amoun', 'hermes', '7orus'
    conversationId: string;
  };
}
```

### Error Events

#### `error.api`
```typescript
interface ErrorApiEvent extends BaseEvent {
  type: 'error.api';
  category: 'error';
  severity: 'error';
  metadata: {
    endpoint: string;        // Sanitized endpoint path
    statusCode: number;
    model: string;
    recoverable: boolean;
  };
}
```

#### `error.network`
```typescript
interface ErrorNetworkEvent extends BaseEvent {
  type: 'error.network';
  category: 'error';
  severity: 'warn';
  metadata: {
    action: string;          // What was attempted
    offline: boolean;
  };
}
```

### System Events

#### `system.startup`
```typescript
interface SystemStartupEvent extends BaseEvent {
  type: 'system.startup';
  category: 'system';
  metadata: {
    loadTime: number;        // App startup time in ms
    hasSavedState: boolean;
    version: string;
  };
}
```

#### `system.pwa_install`
```typescript
interface SystemPwaInstallEvent extends BaseEvent {
  type: 'system.pwa_install';
  category: 'system';
  metadata: {
    platform: string;        // 'ios', 'android', 'desktop'
    browser: string;
  };
}
```

---

## useEventLogger Implementation

### Architecture

```typescript
// useEventLogger.ts — Zustand store

interface EventLoggerState {
  events: BaseEvent[];
  isInitialized: boolean;
  
  // Actions
  initialize: () => void;
  logEvent: (event: Omit<BaseEvent, 'id' | 'timestamp' | 'severity'>) => void;
  logError: (event: Omit<BaseEvent, 'id' | 'timestamp' | 'severity'>) => void;
  getEvents: (category?: string, since?: number) => BaseEvent[];
  getMetrics: () => MetricsSnapshot;
  clearEvents: () => void;
  exportEvents: () => string;  // JSON export
  pruneOldEvents: () => void;
}
```

### Core Methods

#### `logEvent`
```typescript
logEvent: (event) => {
  const newEvent: BaseEvent = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    severity: event.type.startsWith('error') ? 'error' : 'info',
    ...event,
  };
  
  set((state) => ({
    events: [...state.events, newEvent].slice(-200),  // Max 200 events
  }));
  
  // Persist to CONFIG store (debounced)
  persistDebounced(newEvent);
}
```

#### `getMetrics`
```typescript
getMetrics: () => {
  const events = get().events;
  const now = Date.now();
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  const recentEvents = events.filter(e => e.timestamp >= sevenDaysAgo);
  
  return {
    totalOperations: recentEvents.filter(e => e.severity !== 'error').length,
    tokensProcessed: recentEvents
      .filter(e => e.type === 'chat.message_received')
      .reduce((sum, e) => sum + (e.metadata.tokensUsed as number || 0), 0),
    errorRate: recentEvents.length > 0
      ? (recentEvents.filter(e => e.severity === 'error').length / recentEvents.length) * 100
      : 0,
    activeSessions: new Set(
      recentEvents.filter(e => e.category === 'auth').map(e => e.metadata.sessionId)
    ).size,
    tasksCreated: recentEvents.filter(e => e.type === 'task.created').length,
    memoriesExtracted: recentEvents.filter(e => e.type === 'memory.extracted').length,
    uniqueModels: new Set(
      recentEvents.filter(e => e.metadata.model).map(e => e.metadata.model as string)
    ).size,
  };
}
```

#### `pruneOldEvents`
```typescript
pruneOldEvents: () => {
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  set((state) => ({
    events: state.events.filter(e => e.timestamp >= sevenDaysAgo),
  }));
}
```

### Storage Constraints

| Constraint | Value | Rationale |
|---|---|---|
| Max events in memory | 200 | Prevent memory bloat |
| Max events in IndexedDB | 200 (same) | Mirrors in-memory store |
| Retention period | 7 days | Balance between insight and storage |
| Auto-prune frequency | On app startup + every 6 hours | Keeps store lean |
| Export format | JSON (full event objects) | Human-readable, re-importable |

### Event Persistence

Events are persisted to the CONFIG IndexedDB store (not a separate analytics database). This simplifies the architecture:

```
IndexedDB: wazeer_os_db
  └── Object Store: config
       └── Key: 'eventLog'
            └── Value: BaseEvent[]
```

Persistence is **debounced** (500ms) to avoid excessive IndexedDB writes during rapid events (e.g., streaming token counts).

---

## Dashboard Metrics Definitions

### LlmDashboard v2.0 Metrics

All dashboard metrics are derived from `useEventLogger.getMetrics()` using real event data. No decorative or placeholder numbers.

#### Metric 1: Total Operations

| Attribute | Definition |
|---|---|
| **Display name** | "Total Operations" / "إجمالي العمليات" |
| **Calculation** | Count of all events with `severity !== 'error'` in 7-day window |
| **Includes** | Messages sent/received, tasks created/completed, model switches, tool calls, memory extractions, auth events |
| **Excludes** | Error events (counted separately) |
| **Card display** | Numeric value with comma formatting |
| **Trend** | Sparkline or "+/- N" compared to previous 7 days |

#### Metric 2: Tokens Processed

| Attribute | Definition |
|---|---|
| **Display name** | "Tokens Processed" / "الرموز المُعالجة" |
| **Calculation** | Sum of `metadata.tokensUsed` from all `chat.message_received` events in 7-day window |
| **Source** | Each API response includes token count from model provider |
| **Fallback** | If `tokensUsed` not available, estimate: `responseLength / 4` (rough char-to-token ratio) |
| **Card display** | Numeric value with "K" suffix if > 999 |
| **Chart** | 7-day line chart, one point per day |

#### Metric 3: Error Rate

| Attribute | Definition |
|---|---|
| **Display name** | "Error Rate" / "معدل الأخطاء" |
| **Calculation** | `(error events / total events) × 100` in 7-day window |
| **Threshold** | > 5% triggers warning state (card border turns amber, glow-warning) |
| **Card display** | Percentage with one decimal |
| **Chart** | 7-day trend line with threshold indicator at 5% |
| **Breakdown** | Click to see error distribution by type |

#### Metric 4: Active Sessions

| Attribute | Definition |
|---|---|
| **Display name** | "Active Sessions" / "الجلسات النشطة" |
| **Calculation** | Count of unique `sessionIds` from auth events in 7-day window |
| **Card display** | Numeric value |
| **Note** | In anonymous mode, session count is always 1 (local) |

#### Metric 5: Tasks Created

| Attribute | Definition |
|---|---|
| **Display name** | "Tasks Created" / "المهام المُنشأة" |
| **Calculation** | Count of `task.created` events in 7-day window |
| **Card display** | Numeric value |
| **Breakdown** | By priority (critical/high/medium/low) |

#### Metric 6: Memories Extracted

| Attribute | Definition |
|---|---|
| **Display name** | "Memories Extracted" / "الذكريات المُستخرجة" |
| **Calculation** | Count of `memory.extracted` events in 7-day window |
| **Card display** | Numeric value |
| **Breakdown** | By memory category |

### Per-Agent Cards

Three agent cards on the dashboard:

#### Amoun Card
```typescript
interface AgentCard {
  name: 'Amoun';
  nameAr: 'أمون';
  status: 'active' | 'idle' | 'error';
  tasksCount: number;       // From task events where agent === 'amoun'
  tokensUsed: number;      // From chat events where agent === 'amoun'
  lastActivity: number;     // Timestamp of most recent amoun event
  errorsCount: number;     // Error events attributed to amoun
}
```

#### Hermes Card
```typescript
interface AgentCard {
  name: 'Hermes';
  nameAr: 'هرمس';
  status: 'idle' | 'error';  // Hermes is not yet implemented
  tasksCount: 0;
  tokensUsed: 0;
  lastActivity: null;       // No activity
  errorsCount: 0;
  badge: 'Coming Soon';     // Shown as not yet available
}
```

#### 7orus Card
```typescript
interface AgentCard {
  name: '7orus';
  nameAr: 'حورس';
  status: 'active' | 'idle' | 'error';
  tasksCount: number;       // From tool.call events where agent === '7orus'
  scansRun: number;         // Security scans performed
  lastActivity: number;
  errorsCount: number;
}
```

### Chart Specifications

#### 7-Day Token Usage (Line Chart)

| Attribute | Value |
|---|---|
| Type | Line chart (area fill optional) |
| X-axis | Day labels (Mon, Tue, Wed...) in current locale |
| Y-axis | Token count (auto-scale) |
| Data source | Sum of `tokensUsed` per day from 7-day window |
| Interaction | Hover → tooltip with exact value |
| Color | Accent-400 line, accent-400/20 fill |
| Threshold | None |

#### Operations by Model (Bar Chart)

| Attribute | Value |
|---|---|
| Type | Vertical bar chart |
| X-axis | Model names (Gemini, GPT, Claude, Ollama) |
| Y-axis | Operation count |
| Data source | Count of events with each `metadata.model` value |
| Interaction | Hover → tooltip with exact count |
| Colors | Accent-400 bars (single color), different opacity per model |
| No data | "No operations recorded" empty state |

#### Error Rate Trend (Line Chart)

| Attribute | Value |
|---|---|
| Type | Line chart |
| X-axis | Day labels |
| Y-axis | Error rate percentage (0-100%) |
| Data source | Daily error rate calculated from events |
| Interaction | Hover → tooltip with percentage |
| Color | Accent-400 line, with red marker for days > 5% |
| Threshold | Horizontal dashed line at 5% (warning threshold) |
| Spike indicator | Red circle marker on days exceeding threshold |

---

## 7-Day Retention Data Model

### Retention Policy

| Parameter | Value | Rationale |
|---|---|---|
| **Retention period** | 7 days (168 hours) | Balance between useful insight and storage efficiency |
| **Pruning trigger** | App startup + interval (every 6 hours) | Ensures events don't accumulate |
| **Max event count** | 200 events | Hard cap prevents memory exhaustion |
| **User control** | Manual clear + export in Settings → Data Management | Users own their data |

### Why 7 Days?

1. **Meaningful patterns** — 7 days captures weekly usage patterns (weekday vs weekend)
2. **Storage efficiency** — At ~500 bytes per event, 200 events ≈ 100KB (negligible)
3. **Privacy** — Short retention minimizes sensitive data exposure
4. **Performance** — Small dataset means fast metric calculations

### Data Flow

```
[Event Created]
      │
      ├──► Added to Zustand state (in-memory)
      │       │
      │       ├── If length > 200 → Remove oldest event
      │       └── Update derived metrics
      │
      ├──► Debounced persist to IndexedDB (500ms)
      │       │
      │       └── Store: config → eventLog → BaseEvent[]
      │
      └── Dashboard subscription (real-time)
              │
              └── Re-render metrics cards + charts
```

### Export Format

```json
{
  "exportVersion": "2.0.0",
  "exportedAt": "2025-01-15T10:30:00Z",
  "totalEvents": 187,
  "events": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "chat.message_sent",
      "category": "chat",
      "timestamp": 1736932000000,
      "severity": "info",
      "metadata": {
        "conversationId": "conv_abc123",
        "messageLength": 42,
        "hasAttachment": false,
        "hasCodeBlock": false,
        "model": "gemini-pro",
        "language": "en"
      }
    }
  ]
}
```

---

## Agent-Specific Analytics

### Amoun Analytics

| Metric | Source | Purpose |
|---|---|---|
| Messages handled | `chat.*` events where Amoun is active | Primary agent workload |
| Tasks extracted | `task.created` with `source: 'chat'` | Task extraction accuracy |
| Memories extracted | `memory.extracted` with `source` from Amoun chat | Memory extraction rate |
| Avg response time | `chat.message_received` latency | Performance indicator |
| Error rate | `error.api` + `model.error` for Amoun | Reliability metric |

### Hermes Analytics (Future)

| Metric | Source | Status |
|---|---|---|
| Code generated | `tool.call` where agent === 'hermes' | Planned for v2.1 |
| Files processed | Future Hermes-specific events | Planned for v2.1 |
| Code quality score | Future HorusGuard integration | Planned for v2.2 |

### 7orus Analytics

| Metric | Source | Purpose |
|---|---|---|
| Security scans run | `tool.call` where `toolName === 'security_scan'` | Scan frequency |
| Issues found | `tool.result` from security scans | Vulnerability detection |
| False positives | User-marked false positives | Scanner accuracy |
| Active threats | Unresolved security findings | Current risk level |

---

## Privacy Considerations

### Data Sovereignty

| Principle | Implementation |
|---|---|
| **All data on-device** | Events stored only in browser IndexedDB, never transmitted |
| **No analytics server** | No telemetry endpoint, no tracking pixel, no third-party analytics |
| **No user identification** | Events use session IDs, not personal identifiers |
| **User controls retention** | Clear data button in Settings; export before clearing |
| **Transparent logging** | Users can view all raw events in Settings → Advanced → Event Log |
| **Minimal collection** | Only events necessary for dashboard metrics are logged |

### What We Do NOT Collect

- ❌ Personal information (name, email, IP address)
- ❌ Message content (only metadata: length, language, model)
- ❌ Code content (only whether code blocks exist)
- ❌ File contents or artifacts
- ❌ Browser fingerprints or device identifiers
- ❌ Usage patterns beyond the defined event types
- ❌ Click tracking or heat maps
- ❌ Page view duration or scroll depth

### What We DO Collect

- ✅ Event type and timestamp
- ✅ Event metadata (model name, token count, response time)
- ✅ Aggregate counts (tasks created, memories extracted)
- ✅ Error types and frequencies
- ✅ Session lifecycle events

### GDPR & Privacy Compliance

Since all data is on-device:
- **No data controller/processor relationship** — data never leaves the user's device
- **No consent banner needed** — there's nothing to consent to
- **Right to deletion** — Clear Data button provides instant deletion
- **Right to access** — Event Log viewer + Export provide full access
- **Data portability** — JSON export format for easy transfer

---

## Appendix: Event Flow Diagram

```
┌─────────────────────────────────────────────────┐
│                  User Action                     │
│  (sends message, switches model, creates task)   │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              Event Logger (Zustand)              │
│                                                   │
│  1. Generate UUID                                 │
│  2. Set timestamp                                 │
│  3. Determine severity                            │
│  4. Append to events array (max 200)              │
│  5. Trigger debounced persist (500ms)             │
└──────────┬──────────────────────┬────────────────┘
           │                      │
           ▼                      ▼
┌──────────────────┐  ┌───────────────────────────┐
│   IndexedDB       │  │   Dashboard (Real-time)    │
│   CONFIG store    │  │                               │
│   Key: eventLog   │  │   ┌─ Metric Cards (4)       │
│   Value: Event[]  │  │   ├─ Agent Cards (3)        │
│                    │  │   ├─ Token Chart            │
│   Auto-prune:     │  │   ├─ Operations Chart       │
│   7-day window    │  │   └─ Error Rate Chart       │
└──────────────────┘  └───────────────────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │   User Views      │
              │   LlmDashboard   │
              └──────────────────┘
```

---

*Document 𓂀 Wazeer OS Analytics System v2.0.0-Rewrite*  
*© 2025 100MillionDEV / العرآب — All Rights Reserved*
