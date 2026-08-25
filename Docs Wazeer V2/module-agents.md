# 𓂀 Agents Module — Technical Reference

> **Module ID:** `agents`
> **Owner:** AI Orchestration
> **Status:** Partial (Amoun active, Hermes stub, 7orus passive)
> **Future:** Full multi-agent delegation

---

## Table of Contents

1. [Module Overview](#module-overview)
2. [Agent Architecture](#agent-architecture)
3. [Amoun Agent — Primary (أمون)](#amoun-agent--primary-أمون)
4. [Hermes Agent — Coding Specialist (هيرمس)](#hermes-agent--coding-specialist-هيرمس)
5. [7orus Agent — Security Guard](#7orus-agent--security-guard)
6. [How to Add a New Agent](#how-to-add-a-new-agent)
7. [Agent Dashboard Cards (v2.0)](#agent-dashboard-cards-v20)
8. [Agent Communication Patterns](#agent-communication-patterns)
9. [Task Delegation (Future)](#task-delegation-future)

---

## Module Overview

The Agents module manages a lightweight **agent swarm** — a collection of AI agents, each with a specialized role. Currently, only Amoun is fully functional. Hermes and 7orus are defined but have minimal or no implementation.

### Current Agent Roster

| Agent | Arabic | Status | Role | Implementation |
|-------|--------|--------|------|---------------|
| Amoun | أمون | 🟢 Active | Primary chat agent | Fully functional |
| Hermes | هيرمس | 🟡 Stub | Coding specialist | Name in store only |
| 7orus | ٧ورس | 🟡 Passive | Security guard | Status updates only |

### Design Principles

- **Single active agent:** Currently, all user interaction goes through Amoun. Other agents are observers or future participants.
- **Circuit breaker:** Any agent that fails 3 consecutive times is tripped into a "broken" state.
- **Metric tracking:** Each agent tracks tokens used, tasks completed, and last activity.
- **Swarm visibility:** The TopBar shows a SWARM indicator with live status of all agents.

---

## Agent Architecture

### Swarm Store

**File:** `client/src/stores/swarmStore.ts`

```typescript
interface SwarmState {
  agents: Record<string, AgentState>;
  updateAgentStatus: (agentId: string, status: AgentStatus) => void;
  updateAgentTask: (agentId: string, task: string) => void;
  incrementAgentRetry: (agentId: string) => void;
  resetAgentRetry: (agentId: string) => void;
  recordAgentTokens: (agentId: string, tokens: number) => void;
  incrementAgentTasks: (agentId: string) => void;
  getAgent: (agentId: string) => AgentState | undefined;
}
```

### AgentState Interface

```typescript
interface AgentState {
  id: string;                    // Unique identifier: 'amoun', 'hermes', '7orus'
  displayName: string;           // 'Amoun' or 'أمون'
  displayNameAr: string;         // Arabic name
  description: string;           // Agent's role description
  status: AgentStatus;           // Current status
  currentTask: string | null;    // What the agent is currently doing
  retryCount: number;            // Consecutive failure count
  maxRetries: number;            // Threshold for circuit breaker (default: 3)
  lastActivity: number;          // Timestamp of last activity
  tokensUsed: number;            // Total tokens consumed (input + output)
  tasksCompleted: number;        // Total tasks successfully completed
  capabilities: AgentCapability[];
}

type AgentStatus =
  | 'idle'       // Ready for work
  | 'working'    // Currently processing
  | 'waiting'    // Waiting for external input
  | 'success'    // Just completed a task (transient)
  | 'error'      // Just failed (transient)
  | 'broken';    // Circuit breaker tripped — needs manual reset

type AgentCapability =
  | 'chat'
  | 'code'
  | 'research'
  | 'scheduling'
  | 'security'
  | 'file_management'
  | 'web_search'
  | 'data_analysis';
```

### Circuit Breaker Pattern

``n
Agent fails task
    │
    ▼
swarmStore.incrementAgentRetry(agentId)
    │
    ├──► retryCount < maxRetries?
    │       ├── YES → Agent stays in 'error' status, can retry
    │       └── NO  → Agent tripped to 'broken' status
    │
    ▼
Agent succeeds
    │
    ▼
swarmStore.resetAgentRetry(agentId)
    │
    └──► retryCount reset to 0, status set to 'success' (then 'idle')
```

### Initial Agent Definitions

```typescript
const INITIAL_AGENTS: Record<string, AgentState> = {
  amoun: {
    id: 'amoun',
    displayName: 'Amoun',
    displayNameAr: 'أمون',
    description: 'Primary AI assistant — handles all chat interactions, code generation, research, and scheduling.',
    status: 'idle',
    currentTask: null,
    retryCount: 0,
    maxRetries: 3,
    lastActivity: Date.now(),
    tokensUsed: 0,
    tasksCompleted: 0,
    capabilities: ['chat', 'code', 'research', 'scheduling'],
  },
  hermes: {
    id: 'hermes',
    displayName: 'Hermes',
    displayNameAr: 'هيرمس',
    description: 'Coding specialist — handles complex code generation, refactoring, and debugging tasks.',
    status: 'idle',
    currentTask: null,
    retryCount: 0,
    maxRetries: 3,
    lastActivity: Date.now(),
    tokensUsed: 0,
    tasksCompleted: 0,
    capabilities: ['code', 'file_management'],
  },
  '7orus': {
    id: '7orus',
    displayName: '7orus',
    displayNameAr: '٧ورس',
    description: 'Security guard — monitors AI responses for security threats and code vulnerabilities.',
    status: 'idle',
    currentTask: null,
    retryCount: 0,
    maxRetries: 3,
    lastActivity: Date.now(),
    tokensUsed: 0,
    tasksCompleted: 0,
    capabilities: ['security'],
  },
};
```

---

## Amoun Agent — Primary (أمون)

### Role

Amoun is the **sole interactive agent** in v2.0. Every user message goes through Amoun. It is the face and brain of Wazeer OS.

### Capabilities

| Capability | Description | Implementation |
------------|-------------|---------------|
| `chat` | General conversation, bilingual (AR/EN) | AIGateway + all providers |
| `code` | Code generation, explanation, debugging | Coding mode + tool calling |
| `research` | Web search via Gemini grounding | Google Search grounding |
| `scheduling` | Task management, reminders | LearningEngine + TaskScheduler |

### Execution Flow

```
User sends message
    │
    ▼
swarmStore.updateAgentStatus('amoun', 'working')
swarmStore.updateAgentTask('amoun', 'Responding to user')
    │
    ▼
AIGateway.processPrompt(message, sessionId, options)
    │
    ├──► On each stream chunk:
    │       swarmStore.recordAgentTokens('amoun', chunk.tokenCount)
    │
    ├──► On tool call:
    │       swarmStore.updateAgentTask('amoun', `Executing tool: ${toolName}`)
    │
    ├──► On success:
    │       swarmStore.incrementAgentTasks('amoun')
    │       swarmStore.updateAgentStatus('amoun', 'success')
    │       swarmStore.resetAgentRetry('amoun')
    │
    └──► On error:
        swarmStore.updateAgentStatus('amoun', 'error')
        swarmStore.incrementAgentRetry('amoun')
        if (retryCount >= 3):
            swarmStore.updateAgentStatus('amoun', 'broken')
```

### Metric Tracking

| Metric | When Updated | Stored In |
|--------|-------------|-----------|
| `tokensUsed` | Each streaming chunk | `swarmStore.agents.amoun.tokensUsed` |
| `tasksCompleted` | Each successful response | `swarmStore.agents.amoun.tasksCompleted` |
| `lastActivity` | Start of each interaction | `swarmStore.agents.amoun.lastActivity` |
| `retryCount` | On error / success | `swarmStore.agents.amoun.retryCount` |
| `status` | State transitions | `swarmStore.agents.amoun.status` |

---

## Hermes Agent — Coding Specialist (هيرمس)

### Current State: 🟡 Stub

Hermes exists only as a name and initial state in the swarm store. It has **no implementation** — no service, no prompt, no execution flow.

### Planned Capabilities

| Capability | Description |
------------|-------------|
| `code` | Complex multi-file code generation |
| `file_management` | File system operations, project scaffolding |

### Future Implementation

When Hermes is implemented, it will:
1. Receive coding tasks delegated by Amoun.
2. Use a specialized coding system prompt (expert programmer, emphasis on architecture).
3. Have its own streaming response pipeline.
4. Update its own metrics in the swarm store.
5. Report results back to Amoun for presentation to the user.

---

## 7orus Agent — Security Guard

### Current State: 🟡 Passive

7orus has a status in the swarm store and updates when security events occur, but it does **not** proactively scan. It receives status updates from:

1. **HorusGuard** — When the AST scanner detects a security issue in AI output.
2. **Tool execution** — When a tool call is executed (as an audit log).
3. **File operations** — When artifacts are created or modified.

### Status Update Triggers

```
HorusGuard scan completes
    │
    ├──► No issues found:
    │       swarmStore.updateAgentStatus('7orus', 'success')
    │       swarmStore.updateAgentTask('7orus', 'Scan clean')
    │
    └── Issues found:
        swarmStore.updateAgentStatus('7orus', 'working')
        swarmStore.updateAgentTask('7orus', `${count} security issues detected`)
        // 7orus does NOT fix issues — it only reports
```

### Planned Capabilities

| Capability | Description | Status |
------------|-------------|--------|
| `security` | Monitor for XSS, injection, prototype pollution | Passive monitoring only |

---

## How to Add a New Agent

### Step 1: Define the Agent State

In `swarmStore.ts`, add to `INITIAL_AGENTS`:

```typescript
const INITIAL_AGENTS: Record<string, AgentState> = {
  // ... existing agents
  isis: {
    id: 'isis',
    displayName: 'Isis',
    displayNameAr: 'إيزيس',
    description: 'Research specialist — deep web research and data synthesis.',
    status: 'idle',
    currentTask: null,
    retryCount: 0,
    maxRetries: 3,
    lastActivity: Date.now(),
    tokensUsed: 0,
    tasksCompleted: 0,
    capabilities: ['research', 'web_search', 'data_analysis'],
  },
};
```

### Step 2: Create Agent Service (if active)

```typescript
// client/src/services/isisAgent.ts
export const isisAgent = {
  async executeResearch(query: string): Promise<ResearchResult> {
    swarmStore.updateAgentStatus('isis', 'working');
    swarmStore.updateAgentTask('isis', `Researching: ${query}`);

    try {
      // ... research implementation
      swarmStore.incrementAgentTasks('isis');
      swarmStore.updateAgentStatus('isis', 'success');
      swarmStore.resetAgentRetry('isis');
      return result;
    } catch (error) {
      swarmStore.updateAgentStatus('isis', 'error');
      swarmStore.incrementAgentRetry('isis');
      throw error;
    }
  },
};
```

### Step 3: Create Agent System Prompt

```typescript
const ISIS_SYSTEM_PROMPT = `
You are Isis (إيزيس), the research specialist of Wazeer OS.

Your role:
- Conduct thorough web research using available tools
- Synthesize information from multiple sources
- Provide structured, cited research reports

Guidelines:
- Always cite sources with URLs
- Distinguish between facts and opinions
- Present findings in a clear, organized format
`;
```

### Step 4: Integrate with Swarm UI

The SWARM indicator in the TopBar automatically picks up new agents from the store. No UI changes needed for the basic indicator.

For the dashboard cards (v2.0), add a card entry:

```typescript
const AGENT_CARD_CONFIG = {
  isis: {
    icon: '🔍',
    color: 'text-blue-400',
    accentColor: 'border-blue-400/30',
    quickActions: ['Start Research', 'Search Web', 'View History'],
  },
};
```

---

## Agent Dashboard Cards (v2.0)

### Overview

v2.0 introduces per-agent dashboard cards showing real metrics and quick actions. These appear in a dedicated Agents view or as an expandable panel.

### Card Layout

```
┌──────────────────────────────────────────┐
│ 𓂀 Amoun (أمون)              [idle/working] │
│ Primary AI assistant                       │
├──────────────────────────────────────────┤
│ 📊 Metrics                                │
│   Tokens Used:     1,234,567              │
│   Tasks Completed: 42                     │
│   Last Active:     2 min ago             │
│   Retries:         0/3                    │
├──────────────────────────────────────────┤
│ 🎯 Capabilities: [chat] [code] [research]  │
├──────────────────────────────────────────┤
│ ⚡ Quick Actions                           │
│   [New Chat] [Summarize] [View History]    │
└──────────────────────────────────────────┘
```

### Metrics Display

| Metric | Format | Color Coding |
|--------|--------|-------------|
| Status | Pill badge | 🟢 idle, 🔵 working, 🟡 waiting, ✅ success, 🔴 error, ⛔ broken |
| Tokens | Formatted number | White text |
| Tasks | Integer | White text |
| Last Active | Relative time | Gray text |
| Retries | Fraction (current/max) | 🟢 0-1, 🟡 2, 🔴 3 (tripped) |

---

## Agent Communication Patterns

### Current Pattern: Hub and Spoke

```
         ┌──────────┐
         │  User    │
         └────┬─────┘
              │
              ▼
         ┌──────────┐
         │  Amoun   │◄──── Status updates from 7orus
         │  (Hub)   │
         └──────────┘
         /    |    \
        /     |     \
       ▼      ▼      ▼
   ┌───────┐ ┌─────┐ ┌───────┐
   │Hermes│ │7orus│ │Search │
   │(stub)│ │(obs)│ │(Gemini)│
   └───────┘ └─────┘ └───────┘
```

### Future Pattern: Agent Mesh

In future versions, agents will communicate directly:

- **Amoun** delegates coding tasks to **Hermes**.
- **Hermes** returns results to **Amoun** for presentation.
- **7orus** scans output from any agent, reports to **Amoun**.
- **Isis** (future) receives research requests, returns to **Amoun**.

---

## Task Delegation (Future)

### Proposed Delegation Flow

```
Amoun receives: "Build me a REST API for a todo app"
    │
    ├──► Amoun identifies this as a coding task
    │
    ├──► Amoun delegates to Hermes:
    │       { task: 'Generate REST API code', context: 'todo app, Node.js, Express' }
    │
    ├──► Hermes executes:
    │       - Generates code using coding system prompt
    │       - May use file writing tools
    │       - Returns: { files: [...], summary: '...' }
    │
    ├──► 7orus scans Hermes output for vulnerabilities
    │
    └──► Amoun presents result to user
```

### Delegation Interface (Planned)

```typescript
interface AgentDelegation {
  fromAgent: string;
  toAgent: string;
  task: string;
  context: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: number;
}

interface AgentResult {
  delegationId: string;
  agentId: string;
  success: boolean;
  result: unknown;
  duration: number;
  tokensUsed: number;
}
```

---

> صُنع بـ ❤️ بواسطة العرآب | حقوق النشر 100MillionDEV.com
>
> 𓂀 Wazeer OS — Egyptian Cyberpunk AI Assistant