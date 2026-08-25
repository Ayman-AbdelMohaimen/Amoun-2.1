/**
 * Wazeer OS v2.0 — Task Scheduler
 * Periodically checks for due AI-generated tasks and auto-executes them.
 * Runs every 5 minutes. Only processes tasks with dueDate set,
 * not completed, and not manually created.
 */

import type { Task, GatewayRequest, LLMProviderId } from '@/types';
import { wazeerDB } from '@/lib/db';
import { PROVIDERS, LIMITS } from '@/constants';
import { processPrompt } from '@/services/AIGateway';
import { useWorkspaceStore } from '@/store/workspaceStore';

// ═══════════════════════════════════════════════════════════════════
// TASK PERSISTENCE (via config store)
// ═══════════════════════════════════════════════════════════════════

async function getAllTasks(): Promise<Task[]> {
  const config = await wazeerDB.get<Record<string, Task[]>>('config', 'tasks');
  return config?.tasks ?? [];
}

async function saveTasks(tasks: Task[]): Promise<void> {
  await wazeerDB.put('config', { id: 'tasks', tasks });
}

async function updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
  const tasks = await getAllTasks();
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx >= 0) {
    tasks[idx] = { ...tasks[idx], ...updates };
    await saveTasks(tasks);
  }
}

// ═══════════════════════════════════════════════════════════════════
// SCHEDULER
// ═══════════════════════════════════════════════════════════════════

let schedulerHandle: ReturnType<typeof setInterval> | null = null;

/**
 * Single tick: find due tasks and auto-execute them one at a time.
 */
async function tick(): Promise<void> {
  const tasks = await getAllTasks();
  const now = new Date().toISOString();

  const dueTasks = tasks.filter(
    (t) =>
      !t.completed &&
      t.source !== 'manual' &&
      t.dueDate !== undefined &&
      t.dueDate <= now,
  );

  if (dueTasks.length === 0) return;

  // Resolve provider via the registry (same logic as workspaceStore.sendMessage)
  const store = useWorkspaceStore.getState();
  const modelId = store.activeModel;

  let providerId: LLMProviderId | undefined;
  for (const p of PROVIDERS) {
    if (p.models.some((m) => m.id === modelId)) {
      providerId = p.id;
      break;
    }
  }
  const customModel = providerId
    ? undefined
    : store.customModels.find((cm) => cm.id === modelId);
  if (customModel) providerId = 'custom';

  if (!providerId) {
    console.warn(`[TaskScheduler] Active model "${modelId}" not found in registry or custom models — skipping tick`);
    return;
  }

  for (const task of dueTasks) {
    try {
      const request: GatewayRequest = {
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'user',
            content: `Auto-execute scheduled task: ${task.text}`,
            timestamp: new Date().toISOString(),
          },
        ],
        modelId,
        providerId,
        customModel,
        systemPrompt: 'You are executing a scheduled task autonomously. Perform the action and report the result concisely.',
      };

      const result = await processPrompt(request);

      await updateTask(task.id, {
        completed: true,
        completedAt: new Date().toISOString(),
        executionResult: result.content,
      });

      console.info(`[TaskScheduler] Completed task: ${task.text}`);
    } catch (error) {
 const message = error instanceof Error ? error.message : String(error);
      console.warn(`[TaskScheduler] Failed task "${task.text}": ${message}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════

/**
 * Starts the task scheduler. Safe to call multiple times — will not
 * create duplicate intervals.
 */
export function startScheduler(): void {
  if (schedulerHandle !== null) return;

  console.info('[TaskScheduler] Starting (interval:', LIMITS.TASK_SCHEDULER_INTERVAL_MS, 'ms)');

  // Run immediately on start, then on interval
  tick().catch(() => {});
  schedulerHandle = setInterval(() => {
    tick().catch(() => {});
  }, LIMITS.TASK_SCHEDULER_INTERVAL_MS);
}

/**
 * Stops the task scheduler and clears the interval.
 */
export function stopScheduler(): void {
  if (schedulerHandle !== null) {
    clearInterval(schedulerHandle);
    schedulerHandle = null;
    console.info('[TaskScheduler] Stopped');
  }
}
