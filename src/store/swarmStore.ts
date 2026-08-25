/**
 * Wazeer OS v2.0 — Swarm Store
 * Manages the agent swarm state: statuses, retries, circuit breaker.
 */

import { create } from 'zustand';
import type { AgentState, AgentStatus } from '@/types';
import { DEFAULT_AGENTS } from '@/constants';

// ═══════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════

interface SwarmState {
  agents: Record<string, AgentState>;
  circuitBreakerTripped: boolean;
  circuitBreakerReason: string;
  activeAgentId: string;

  // Actions
  updateAgent: (id: string, patch: Partial<AgentState>) => void;
  setActiveAgent: (id: string) => void;
  incrementRetry: (id: string) => void;
  resetAgent: (id: string) => void;
  tripCircuitBreaker: (reason: string) => void;
  resetCircuitBreaker: () => void;
}

// ═══════════════════════════════════════════════════════════════════
// INIT AGENTS FROM DEFAULTS
// ═══════════════════════════════════════════════════════════════════

function initAgents(): Record<string, AgentState> {
  const record: Record<string, AgentState> = {};
  for (const agent of DEFAULT_AGENTS) {
    record[agent.id] = { ...agent };
  }
  return record;
}

// ═══════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════

export const useSwarmStore = create<SwarmState>((set, get) => ({
  agents: initAgents(),
  circuitBreakerTripped: false,
  circuitBreakerReason: '',
  activeAgentId: 'amoun',

  updateAgent: (id, patch) => {
    set((s) => ({
      agents: {
        ...s.agents,
        [id]: { ...s.agents[id], ...patch },
      },
    }));
  },

  setActiveAgent: (id) => {
    set({ activeAgentId: id });
    // Reset the agent to idle when switching
    get().updateAgent(id, { status: 'idle' as AgentStatus });
  },

  incrementRetry: (id) => {
    const agent = get().agents[id];
    if (!agent) return;

    const newRetryCount = agent.retryCount + 1;
    const isMaxReached = newRetryCount >= agent.maxRetries;

    set((s) => ({
      agents: {
        ...s.agents,
        [id]: {
          ...s.agents[id],
          retryCount: newRetryCount,
          status: isMaxReached ? ('error' as AgentStatus) : s.agents[id].status,
        },
      },
    }));

    if (isMaxReached) {
      get().tripCircuitBreaker(
        `Agent "${agent.displayName}" exceeded max retries (${agent.maxRetries})`,
      );
    }
  },

  resetAgent: (id) => {
    const defaults = DEFAULT_AGENTS.find((a) => a.id === id);
    if (!defaults) return;

    set((s) => ({
      agents: {
        ...s.agents,
        [id]: {
          ...defaults,
          retryCount: 0,
          status: 'idle' as AgentStatus,
          lastActivity: '',
        },
      },
    }));
  },

  tripCircuitBreaker: (reason) => {
    console.warn(`[SwarmStore] Circuit breaker tripped: ${reason}`);
    set({
      circuitBreakerTripped: true,
      circuitBreakerReason: reason,
    });
  },

  resetCircuitBreaker: () => {
    set({
      circuitBreakerTripped: false,
      circuitBreakerReason: '',
    });
    // Reset all errored agents
    const current = get().agents;
    const updated = { ...current };
    for (const [id, agent] of Object.entries(current)) {
      if (agent.status === 'error') {
        updated[id] = {
          ...agent,
          status: 'idle' as AgentStatus,
          retryCount: 0,
        };
      }
    }
    set({ agents: updated });
  },
}));
