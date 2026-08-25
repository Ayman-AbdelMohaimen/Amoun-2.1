# 𓂀 Tasks Module — Technical Reference

> **Module ID:** `tasks`
> **Owner:** Productivity
> **Status:** Active (CRUD) + Enhanced (v2.0: AI extraction, auto-execution)
> **Complexity:** Medium

---

## Table of Contents

1. [Module Overview](#module-overview)
2. [Task Schema](#task-schema)
3. [Manual CRUD Operations](#manual-crud-operations)
4. [AI Extraction Pipeline](#ai-extraction-pipeline)
5. [TaskScheduler (Auto-Execution)](#taskscheduler-auto-execution)
6. [Tasks HUD UI Component](#tasks-hud-ui-component)
7. [Task Prioritization and Filtering](#task-prioritization-and-filtering)
8. [Scheduled Task Lifecycle](#scheduled-task-lifecycle)

---

## Module Overview

The Tasks module provides a lightweight task management system integrated with the AI chat experience. Tasks can be created manually by the user, automatically extracted from AI responses, or scheduled for auto-execution.

### Key Features

| Feature | Version | Description |
|---------|---------|-------------|
| Manual CRUD | v0.x | User creates, edits, toggles, deletes tasks |
| AI Extraction | v2.0 | Heuristic-based extraction from AI responses |
| Task Scheduler | v2.0 | Auto-executes due tasks via AI every 5 minutes |
| Enriched Schema | v2.0 | Priority, due dates, tags, source tracking |
| Tasks HUD | v0.x | Collapsible accordion on HomeView |

### Storage

Tasks are stored in the `workspaceStore` Zustand store and **persisted to IndexedDB** via store middleware:

```typescript
// In workspaceStore:
interface WorkspaceState {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  clearCompletedTasks: () => void;
}
```

---

## Task Schema

### v0.x Schema (Legacy)

```typescript
// DEPRECATED — still supported for migration
interface TaskV0 {
  id: string;
  text: string;
  completed: boolean;
}
```

Too simple — no tracking of where the task came from, when it's due, or its importance.

### v2.0 Enriched Schema

```typescript
interface Task {
  id: string;                     // UUID
  text: string;                   // Task description
  completed: boolean;             // Completion status
  source: TaskSource;             // Where the task came from
  priority: TaskPriority;         // Importance level
  dueDate: number | null;         // Timestamp, null = no due date
  tags: string[];                 // User or AI-assigned tags
  createdAt: number;              // Creation timestamp
  completedAt: number | null;     // When marked complete
  executionResult: string | null; // Auto-execution result (scheduled tasks)
  sourceSessionId: string | null; // Chat session that created this task
}

type TaskSource =
  | 'manual'      // User created manually
  | 'ai'          // Extracted from AI response
  | 'scheduled';  // Created by the TaskScheduler

type TaskPriority =
  | 'low'
  | 'medium'
  | 'high';
```

### Schema Migration

```typescript
function migrateTaskV0toV2(task: TaskV0): Task {
  return {
    id: task.id,
    text: task.text,
    completed: task.completed,
    source: 'manual',
    priority: 'medium',
    dueDate: null,
    tags: [],
    createdAt: Date.now(),
    completedAt: task.completed ? Date.now() : null,
    executionResult: null,
    sourceSessionId: null,
  };
}
```

---

## Manual CRUD Operations

### Add Task

```typescript
// User clicks "Add Task" in Tasks HUD
function handleAddTask(text: string) {
  const task: Task = {
    id: crypto.randomUUID(),
    text: text.trim(),
    completed: false,
    source: 'manual',
    priority: 'medium',
    dueDate: null,
    tags: [],
    createdAt: Date.now(),
    completedAt: null,
    executionResult: null,
    sourceSessionId: null,
  };
  workspaceStore.addTask(task);
}
```

### Edit Task

```typescript
// User edits task text or priority
function handleEditTask(id: string, updates: Partial<Task>) {
  workspaceStore.updateTask(id, updates);
}
```

### Toggle Task

```typescript
// User clicks checkbox
function handleToggleTask(id: string) {
  const task = workspaceStore.tasks.find(t => t.id === id);
  if (!task) return;

  workspaceStore.updateTask(id, {
    completed: !task.completed,
    completedAt: !task.completed ? Date.now() : null,
  });
}
```

### Delete Task

```typescript
// User clicks delete button
function handleDeleteTask(id: string) {
  workspaceStore.deleteTask(id);
}
```

### Clear Completed

```typescriptn
// Bulk action: remove all completed tasks
function handleClearCompleted() {
  workspaceStore.clearCompletedTasks();
}
```

---

## AI Extraction Pipeline

### Trigger

After every AI response, with **50% probability**, the `LearningEngine.extractTasks()` is called:

```typescript
// In AIGateway post-processing:
if (Math.random() < TASK_EXTRACTION_PROBABILITY) {
  const extracted = await LearningEngine.extractTasks(
    aiMessage.content,
    { sessionId: currentSessionId, source: 'ai' }
  );
  for (const task of extracted) {
    workspaceStore.addTask(task);
  }
}

const TASK_EXTRACTION_PROBABILITY = 0.5;
```

### Extraction Heuristics (Summary)

The extraction scans for:
- **English:** "don't forget to", "need to", "should", "must", markdown checkboxes, numbered lists, "TODO:", "ACTION ITEM:", imperative verbs
- **Arabic:** "يجب", "لا تنسَ", "تذكر", "من الضروري", "نحتاج", "علينا"

See `module-learning.md` for the full pattern list.

### Extraction Example

```
AI Response:
"Here's your implementation plan:
1. Set up the database schema first
2. Create the API endpoints
3. Write tests for the critical paths
4. Deploy to staging environment
You should also update the README with the new API documentation."

Extracted Tasks:
- { text: "Set up the database schema first", source: 'ai', priority: 'medium' }
- { text: "Create the API endpoints", source: 'ai', priority: 'medium' }
- { text: "Write tests for the critical paths", source: 'ai', priority: 'medium' }
- { text: "Deploy to staging environment", source: 'ai', priority: 'medium' }
- { text: "Update the README with the new API documentation", source: 'ai', priority: 'medium' }
```

### User Notification

When tasks are extracted, a subtle toast notification appears:

```
📋 3 tasks extracted from Amoun's response
```

Clicking the notification opens the Tasks HUD.

---

## TaskScheduler (Auto-Execution)

### Overview

The TaskScheduler is a **new v2.0 feature** that automatically executes scheduled tasks when their due date arrives.

### Architecture

```
TaskScheduler (setInterval every 5 minutes)
    │
    ▼
getDueTasks() — tasks where dueDate <= now AND !completed AND !executionResult
    │
    ├──► No due tasks → sleep 5 minutes
    │
    └──► Due task found
            │
            ├──► Update status: currentTask = `Executing: {task.text}`
            │
            ├──► Send to AIGateway:
            │       prompt = `Execute this scheduled task: ${task.text}
            │                 Context: ${task.tags.join(', ')}
            │                 Original session: ${task.sourceSessionId}`
            │
            ├──► Store result:
            │       task.executionResult = aiResponse
            │       task.completed = true
            │       task.completedAt = Date.now()
            │
            └──► Notify user (if available):
                    Toast: "📋 Scheduled task completed: {task.text}"
```

### Scheduler Implementation

```typescript
// client/src/services/taskScheduler.ts

const SCHEDULER_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

class TaskScheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start(): void {
    if (this.intervalId !== null) return;

    // Run immediately on start
    void this.checkDueTasks();

    // Then every 5 minutes
    this.intervalId = setInterval(() => {
      void this.checkDueTasks();
    }, SCHEDULER_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async checkDueTasks(): Promise<void> {
    const now = Date.now();
    const tasks = useWorkspaceStore.getState().tasks;

    const dueTasks = tasks.filter(
      t =>
        !t.completed &&
        t.dueDate !== null &&
        t.dueDate <= now &&
        t.executionResult === null
    );

    for (const task of dueTasks) {
      await this.executeTask(task);
    }
  }

  private async executeTask(task: Task): Promise<void> {
    const store = useWorkspaceStore.getState();

    // Update task status to in-progress
    store.updateTask(task.id, { executionResult: 'executing...' });

    try {
      // Build execution prompt
      const prompt = this.buildExecutionPrompt(task);

      // Execute via AIGateway (non-interactive)
      const result = await aiGateway.executeSinglePrompt(prompt, {
        mode: 'general',
        enableTools: false,
        enableExtraction: false, // Don't extract tasks from task execution
      });

      // Mark complete with result
      store.updateTask(task.id, {
        completed: true,
        completedAt: Date.now(),
        executionResult: result,
      });

      // Notify user
      toast.success(`📋 Scheduled task completed: ${task.text}`);
    } catch (error) {
      store.updateTask(task.id, {
        executionResult: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  private buildExecutionPrompt(task: Task): string {
    const parts = [
      `Execute this scheduled task: ${task.text}`,
    ];

    if (task.tags.length > 0) {
      parts.push(`Context/Tags: ${task.tags.join(', ')}`);
    }

    if (task.sourceSessionId) {
      parts.push(`This task was created during a previous conversation.`);
    }

    parts.push('Provide a concise execution result.');

    return parts.join('\n');
  }
}

export const taskScheduler = new TaskScheduler();
```

### Lifecycle

```typescript
// Start on app mount (only if authenticated)
useEffect(() => {
  if (isAuthenticated) {
    taskScheduler.start();
  }
  return () => {
    taskScheduler.stop();
  };
}, [isAuthenticated]);
```

---

## Tasks HUD UI Component

### Location

The Tasks HUD is a **collapsible accordion** on the `HomeView`, positioned below the chat area.

### Layout

```
┌──────────────────────────────────────────┐
│ 📋 Tasks (5)                    [▼/▲]    │  ← Accordion header with count badge
├──────────────────────────────────────────┤
│                                          │
│ ┌─ ☐ Set up database schema ──────────┐ │  ← Uncompleted, source=ai
│ │   🟡 medium  │  📎 from chat        │ │
│ │   🕐 Due: Tomorrow                 │ │
│ └────────────────────────────────────┘ │
│                                          │
│ ┌─ ☑ Create API endpoints ────────────┐ │  ← Completed (strikethrough)
│ │   ✅ Done at 2:30 PM               │ │
│ └────────────────────────────────────┘ │
│                                          │
│ ┌─ ☐ Deploy to staging ──────────────┐  │  ← High priority (red accent)
│ │   🔴 high  │  ⏰ Auto-exec at 5 PM  │ │
│ └────────────────────────────────────┘ │
│                                          │
│ [+ Add Task]  [Clear Completed (2)]      │  ← Action buttons
└──────────────────────────────────────────┘
```

### Visual Indicators

| Element | Color | Meaning |
|---------|-------|---------|
| ☐ Checkbox | Gray border | Not completed |
| ☑ Checkbox | Green (#00ff88) filled | Completed |
| 🟡 Priority badge | Yellow | Low/Medium priority |
| 🔴 Priority badge | Red (#ff3366) | High priority |
| 📎 Source tag | Blue | Extracted from AI |
| ⏰ Due date | Orange (if overdue) | Scheduled task |
| ✅ Result tag | Green | Auto-execution completed |

### Task Item Component

```typescript
interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
}
```

---

## Task Prioritization and Filtering

### Default Sort Order

```typescript
function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // 1. Incomplete first
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    // 2. By due date (soonest first)
    if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;

    // 3. By priority (high > medium > low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (a.priority !== b.priority) return priorityOrder[a.priority] - priorityOrder[b.priority];

    // 4. By creation date (newest first)
    return b.createdAt - a.createdAt;
  });
}
```

### Filter Options

| Filter | Show | Hide |
|--------|------|------|
| All | Everything | Nothing |
| Active | Not completed | Completed |
| Completed | Completed | Not completed |
| High Priority | priority='high' | Others |
| Scheduled | dueDate !== null | No-due-date tasks |
| From AI | source='ai' | Manual tasks |

---

## Scheduled Task Lifecycle

### Creation

```
User says: "Remind me to review the PR by 5 PM"
    │
    ▼
AI extracts task:
    {
      text: "Review the PR",
      source: 'ai',
      priority: 'medium',
      dueDate: parseTime('5 PM today'),
    }
    │
    ▼
Task appears in Tasks HUD with ⏰ indicator
```

### Waiting

- Task sits in the list, visible with countdown.
- If due date passes by 1 hour, the priority is auto-upgraded to 'high'.
- If due date passes by 24 hours without execution, a notification appears.

### Execution

```
5:00 PM arrives
    │
    ▼
TaskScheduler.checkDueTasks() finds the task
    │
    ├──► Sends to AIGateway: "Execute: Review the PR"
    │
    ├──► AI responds with review notes
    │
    ├──► Result stored in task.executionResult
    │
    ├──► Task marked as completed
    │
    └──► User sees toast: "📋 Scheduled task completed: Review the PR"
```

### Failure Handling

If execution fails:
1. Error is stored in `executionResult`.
2. Task remains uncompleted.
3. Retry happens on the next scheduler cycle (5 min later).
4. After 3 failed attempts, task is marked with a ⛔ indicator.

---

> صُنع بـ ❤️ بواسطة العرآب | حقوق النشر 100MillionDEV.com
>
> 𓂀 Wazeer OS — Egyptian Cyberpunk AI Assistant