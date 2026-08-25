/**
 * Wazeer OS v2.0 — Event Logger
 * Zustand hook-based store for tracking app events and computing metrics.
 * Events are persisted to IndexedDB config store.
 */

import { create } from 'zustand';
import type { AmounEvent, EventMetrics, EventType } from '@/types';
import { wazeerDB } from '@/lib/db';
import { LIMITS } from '@/constants';

// ═══════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════

interface EventLoggerState {
  events: AmounEvent[];
  log: (type: EventType, metadata: Record<string, unknown>) => void;
  getMetrics: () => EventMetrics;
  clearOldEvents: () => void;
  _load: () => Promise<void>;
  _save: () => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════

export const useEventLogger = create<EventLoggerState>((set, get) => ({
  events: [],

  log: (type, metadata) => {
    const event: AmounEvent = {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      metadata,
    };

    set((s) => {
      const updated = [event, ...s.events];
      // Trim to max events
      if (updated.length > LIMITS.MAX_EVENTS) {
        updated.length = LIMITS.MAX_EVENTS;
      }
      return { events: updated };
    });

    // Persist (fire-and-forget)
    get()._save();
  },

  getMetrics: () => {
    const { events } = get();

    const totalOperations = events.length;
    const errorEvents = events.filter((e) => e.type === 'error');
    const totalErrors = errorEvents.length;
    const errorRate = totalOperations > 0 ? totalErrors / totalOperations : 0;

    // Total tokens
    let totalTokens = 0;
    for (const e of events) {
      if (e.metadata.tokens && typeof e.metadata.tokens === 'number') {
        totalTokens += e.metadata.tokens as number;
      }
    }

    // Active sessions (unique session IDs)
    const sessionIds = new Set<string>();
    let tasksCreated = 0;
    let memoriesExtracted = 0;

    for (const e of events) {
      if (e.metadata.sessionId) sessionIds.add(e.metadata.sessionId as string);
      if (e.type === 'task_created') tasksCreated++;
      if (e.type === 'memory_extracted') memoriesExtracted++;
    }

    // Model usage
    const modelUsage: Record<string, number> = {};
    for (const e of events) {
      const model = e.metadata.model as string;
      if (model) {
        modelUsage[model] = (modelUsage[model] ?? 0) + 1;
      }
    }

    // 7-day token trend
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const dayBuckets: Record<string, number> = {};

    for (const e of events) {
      const ts = new Date(e.timestamp).getTime();
      if (ts >= sevenDaysAgo) {
        const day = e.timestamp.slice(0, 10); // YYYY-MM-DD
        const tokens = (e.metadata.tokens as number) ?? 0;
        dayBuckets[day] = (dayBuckets[day] ?? 0) + tokens;
      }
    }

    const tokensOverTime = Object.entries(dayBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, tokens]) => ({ date, tokens }));

    // Errors over time (7 days)
    const errorDayBuckets: Record<string, number> = {};
    for (const e of errorEvents) {
      const ts = new Date(e.timestamp).getTime();
      if (ts >= sevenDaysAgo) {
        const day = e.timestamp.slice(0, 10);
        errorDayBuckets[day] = (errorDayBuckets[day] ?? 0) + 1;
      }
    }

    const errorsOverTime = Object.entries(errorDayBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    return {
      totalOperations,
      totalTokens,
      totalErrors,
      errorRate,
      activeSessions: sessionIds.size,
      tasksCreated,
      memoriesExtracted,
      modelUsage,
      tokensOverTime,
      errorsOverTime,
    };
  },

  clearOldEvents: () => {
    const cutoff = Date.now() - LIMITS.EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    set((s) => ({
      events: s.events.filter((e) => new Date(e.timestamp).getTime() >= cutoff),
    }));
    get()._save();
  },

  _load: async () => {
    try {
      await wazeerDB.init();
      const raw = await wazeerDB.getEvents();
      set({ events: (raw as AmounEvent[]) ?? [] });
    } catch {
      // Ignore
    }
  },

  _save: async () => {
    try {
      await wazeerDB.init();
      await wazeerDB.saveEvents(get().events);
    } catch {
      // Ignore
    }
  },
}));

// ═══════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORT (non-hook usage from stores)
// ═══════════════════════════════════════════════════════════════════

/** Log an event without a React hook (for use in stores/services). */
export function logEvent(type: EventType, metadata: Record<string, unknown>): void {
  useEventLogger.getState().log(type, metadata);
}

// Boot: load events from IndexedDB
wazeerDB.init().then(() => {
  useEventLogger.getState()._load();
}).catch(() => {});
