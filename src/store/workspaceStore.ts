/**
 * Wazeer OS v2.0 — Workspace Store
 * Full Zustand store with IndexedDB persistence.
 * Central state hub for the entire application.
 */

import { create } from 'zustand';
import type {
  AppLanguage,
  AppThemeSelection,
  Artifact,
  Attachment,
  ChatMessage,
  ChatSession,
  ChatMode,
  CustomModel,
  CustomSkill,
  LLMProviderId,
  Project,
  PromptTemplate,
  SessionEvent,
  Task,
  User,
  VoiceGender,
  ViewType,
} from '@/types';
import { wazeerDB } from '@/lib/db';
import { DEFAULT_TEMPLATES, CHAT_MODES, BASE_SYSTEM_PROMPT, PROVIDERS, LIMITS } from '@/constants';
import { processPrompt } from '@/services/AIGateway';
import { extractTasks, stripTaskJSONFromResponse } from '@/services/learning/LearningEngine';
import { extractMemories } from '@/services/learning/MemoryEngine';
import { buildContextualPrompt } from '@/services/learning/ContextBuilder';
import { compactMessages } from '@/services/learning/TokenManager';
import { humanizeError, unwrapErrorMessage, isApiKeyError } from '@/lib/errorHumanize';
import type { ImportedTaskDraft } from '@/lib/importers';

// ═══════════════════════════════════════════════════════════════════
// PERSISTENCE HELPERS
// ═══════════════════════════════════════════════════════════════════

const PERSIST_KEY = 'workspace_state';

interface PersistedState {
  currentLanguage: AppLanguage;
  theme: AppThemeSelection;
  accentColor: string;
  activeView: ViewType;
  voiceEnabled: boolean;
  voiceGender: VoiceGender;
  activeModel: string;
  activeProviderId: LLMProviderId;
  chatMode: ChatMode;
  customModels: CustomModel[];
  projects: Project[];
  tasks: Task[];
  promptTemplates: PromptTemplate[];
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  currentProjectId: string | null;
  isSidebarCollapsed: boolean;
  showAddModelModal: boolean;
  hasCompletedOnboarding: boolean;
  /** Built-in registry model ids hidden by the user (restorable) */
  hiddenModelIds: string[];
  /** Local activity days (yyyy-mm-dd) — drives streak + weekday rings */
  activityDates: string[];
  /** Amoun's daily suggestion (generated once per day) */
  dailySuggestion: { text: string; reason: string; date: string } | null;
  /** User-created custom skills */
  customSkills: CustomSkill[];
  /** IDs of skills that are currently enabled (both built-in and custom) */
  enabledSkillIds: string[];
}

const SETTINGS_KEY = 'global_settings';

async function loadPersistedState(): Promise<Partial<PersistedState>> {
  try {
    await wazeerDB.init();

    // 1. Check for modern granular settings
    const settingsRaw = await wazeerDB.get<Record<string, unknown>>('state', SETTINGS_KEY);
    const globalSettings = (settingsRaw?.[SETTINGS_KEY] as Partial<PersistedState>) ?? {};

    // 2. Load individual sessions if present in new granular format
    const sessionIndexRecords = await wazeerDB.get<{ id: string; sessionIds: string[] }>('state', 'session_index');
    let loadedSessions: ChatSession[] = [];

    if (sessionIndexRecords?.sessionIds && sessionIndexRecords.sessionIds.length > 0) {
      for (const sId of sessionIndexRecords.sessionIds) {
        const sMeta = await wazeerDB.get<{ id: string; meta: Omit<ChatSession, 'messages'> }>('state', `session_meta_${sId}`);
        const sMsgs = await wazeerDB.get<{ id: string; messages: ChatMessage[] }>('state', `session_msgs_${sId}`);
        if (sMeta?.meta) {
          loadedSessions.push({
            ...sMeta.meta,
            messages: sMsgs?.messages ?? [],
          });
        }
      }
    }

    // 3. Fallback / Migration: check legacy single blob
    if (loadedSessions.length === 0) {
      const legacyRaw = await wazeerDB.get<Record<string, PersistedState>>('state', PERSIST_KEY);
      const legacyState = legacyRaw?.[PERSIST_KEY];
      if (legacyState) {
        // Return full legacy state for rehydration and auto-migration on next save
        return {
          ...legacyState,
          ...globalSettings,
          chatSessions: legacyState.chatSessions ?? [],
        };
      }
    }

    return {
      ...globalSettings,
      chatSessions: loadedSessions,
    };
  } catch (err) {
    console.warn('[workspaceStore] Failed to load persisted state:', err);
    return {};
  }
}

async function savePersistedState(state: Partial<PersistedState>): Promise<void> {
  try {
    const { chatSessions, ...globalSettings } = state;

    // 1. Save global settings record
    await wazeerDB.put('state', { id: SETTINGS_KEY, [SETTINGS_KEY]: globalSettings });

    // 2. Granular session save (sessions/{sessionId}/metadata & messages)
    if (chatSessions) {
      const sessionIds: string[] = [];

      for (const session of chatSessions) {
        sessionIds.push(session.id);
        const { messages, ...meta } = session;
        // Save metadata record
        await wazeerDB.put('state', { id: `session_meta_${session.id}`, meta });
        // Save messages record
        await wazeerDB.put('state', { id: `session_msgs_${session.id}`, messages });
      }

      // Save index of session IDs
      await wazeerDB.put('state', { id: 'session_index', sessionIds });
    }

    // 3. Keep backward-compatible legacy snapshot for fallback safety
    await wazeerDB.put('state', { id: PERSIST_KEY, [PERSIST_KEY]: state });
  } catch (err) {
    console.warn('[workspaceStore] Failed to persist state:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════
// ARTIFACT EXTRACTION
// ═══════════════════════════════════════════════════════════════════

const CODE_BLOCK_REGEX = /```(\w*)\n([\s\S]*?)```/g;

/** Derives a professional kebab-case filename from artifact content. */
function deriveArtifactTitle(type: Artifact['type'], lang: string, code: string): string {
  // HTML → <title>
  if (type === 'html') {
    const t = code.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
    if (t) return slugify(t);
  }
  // Markdown → first H1
  if (type === 'markdown') {
    const h1 = code.match(/^#\s+(.+)$/m)?.[1]?.trim();
    if (h1) return slugify(h1);
  }
  // SVG → title/desc element
  if (type === 'svg') {
    const t = code.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
    if (t) return slugify(t);
  }
  // Code → infer purpose from content signals
  const signals: Array<[RegExp, string]> = [
    [/export\s+default\s+function|function\s+App|<App\s*\/>/i, 'app'],
    [/login|signin|sign-in/i, 'login'],
    [/signup|register/i, 'signup'],
    [/dashboard/i, 'dashboard'],
    [/fetch\(|axios|api/i, 'api'],
    [/class\s+\w+|interface\s+\w+/i, 'model'],
    [/test|spec/i, 'test'],
    [/script|cli/i, 'script'],
    [/style|css/i, 'styles'],
    [/config|env/i, 'config'],
    [/readme/i, 'readme'],
  ];
  const base = signals.find(([re]) => re.test(code))?.[1] ?? 'snippet';
  const ext = type === 'json' ? 'json' : (lang && lang !== 'text' ? lang : 'txt');
  return `${base}.${ext}`;
}

/** Arabic/English friendly text → kebab-case slug (max 40 chars). */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '') || 'untitled';
}

function extractArtifactsFromResponse(
  content: string,
  chatId: string,
  messageId: string,
  projectId?: string,
): Artifact[] {
  const artifacts: Artifact[] = [];
  let match: RegExpExecArray | null;

  while ((match = CODE_BLOCK_REGEX.exec(content)) !== null) {
    const lang = (match[1] || 'text').toLowerCase();
    const code = match[2];
    let type: Artifact['type'] = 'code';

    if (lang === 'html' || lang === 'htm') type = 'html';
    else if (lang === 'svg') type = 'svg';
    else if (lang === 'md' || lang === 'markdown') type = 'markdown';
    else if (lang === 'json') type = 'json';

    // Only create artifacts for substantial code blocks
    if (code.trim().length < 20) continue;

    const title = deriveArtifactTitle(type, lang, code.trim());

    artifacts.push({
      id: crypto.randomUUID(),
      type,
      title,
      content: code.trim(),
      language: lang,
      chatId,
      messageId,
      createdAt: new Date().toISOString(),
      pinned: false,
      tags: [lang],
      projectId,
    });
  }

  return artifacts;
}

/** Local (not UTC) yyyy-mm-dd — streak days follow the user's clock. */
function localDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Appends a session event to the IndexedDB event log (DSH Event-Sourced Log,
 * write-side). Fire-and-forget — logging failures never break the chat flow.
 */
function appendSessionEvent(
  sessionId: string,
  type: SessionEvent['type'],
  payload: Record<string, unknown>,
): void {
  const event: SessionEvent = {
    sessionId,
    type,
    timestamp: new Date().toISOString(),
    payload,
  };
  wazeerDB.put('session_events', event).catch(() => {
    // Event log is non-critical — skip on failure
  });
}

// ═══════════════════════════════════════════════════════════════════
// STORE INTERFACE
// ═══════════════════════════════════════════════════════════════════

interface WorkspaceState extends PersistedState {
  // Transient state (not persisted)
  isArtifactPanelOpen: boolean;
  selectedArtifactId: string | null;
  showLoginModal: boolean;
  showOnboardingWizard: boolean;
  user: User | null;
  isGenerating: boolean;
  /** Live Arabic status line shown under the streaming bubble */
  generationStatus: string;
  /** Timestamp (ms) when the current generation started — drives the seconds counter */
  generationStartedAt: number | null;
  abortController: AbortController | null;
  deferredPrompt: unknown;

  // Navigation & UI
  setActiveView: (v: ViewType) => void;
  setTheme: (t: AppThemeSelection) => void;
  setAccentColor: (c: string) => void;
  setLanguage: (l: AppLanguage) => void;
  toggleVoice: () => void;
  setVoiceGender: (g: VoiceGender) => void;
  setChatMode: (m: ChatMode) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;

  // Models
  setActiveModel: (modelId: string, providerId?: LLMProviderId) => void;
  setActiveProvider: (p: LLMProviderId) => void;
  addCustomModel: (m: CustomModel) => void;
  removeCustomModel: (id: string) => void;
  /** Hide a built-in registry model from the picker (restorable) */
  hideModel: (id: string) => void;
  /** Restore all hidden built-in models */
  unhideAllModels: () => void;
  setShowAddModelModal: (v: boolean) => void;

  // Sessions
  createNewSession: (projectId?: string) => string;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  setCurrentSession: (id: string) => void;
  /** Toggle favorite/pinned status on session (Manus mini-menu) */
  toggleFavoriteSession: (id: string) => void;

  // Skills Management
  addCustomSkill: (skill: Omit<CustomSkill, 'id' | 'createdAt'>) => void;
  deleteCustomSkill: (id: string) => void;
  toggleSkill: (skillId: string) => void;

  // Chat — the main action
  sendMessage: (text: string, attachment?: Attachment) => Promise<void>;
  stopGeneration: () => void;
  deleteMessage: (messageId: string) => void;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  /** 👎 شبشب / 😍 قلوب — saves feedback + corrective memory on 👎 */
  rateMessage: (messageId: string, rating: 'up' | 'down', tags?: string[]) => void;

  // Prompt Templates — CRUD (Templates view)
  addTemplate: (t: Omit<PromptTemplate, 'id' | 'isBuiltIn'>) => void;
  updateTemplate: (id: string, patch: Partial<PromptTemplate>) => void;
  deleteTemplate: (id: string) => void;
  /** ▶️ Use a template — fresh session + send its content + open the workspace */
  useTemplate: (id: string) => Promise<void>;

  // Tasks
  addTask: (text: string, source?: Task['source']) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  editTask: (id: string, text: string) => void;
  /** Bulk import from JSON/CSV/Markdown drafts. Returns imported count. */
  importTasks: (drafts: ImportedTaskDraft[]) => number;
  /** ▶️ RUN — sends the task to chat for immediate full-tool execution */
  runTask: (id: string) => void;

  // Projects
  addProject: (name: string, summary?: string, links?: string[], hasDocs?: boolean) => Promise<string>;
  deleteProject: (id: string) => void;
  setCurrentProject: (projectId: string | null) => void;

  // Governance Council (Memory Purification) — progressive resets
  /** Level 1: delete general (non-project) chat sessions. Returns removed count. */
  purgeGeneralChats: () => number;
  /** Level 2: destroy all projects + their isolated sessions. Returns removed count. */
  purgeProjects: () => number;
  /** Level 3: wipe all artifacts/code files from IndexedDB. Returns removed count. */
  purgeArtifacts: () => Promise<number>;
  /** Max level: factory reset — new-user state, keeps login data + API keys. */
  factoryReset: () => Promise<void>;

  // User
  setUser: (user: User | null) => void;
  logout: () => void;
  loginOAuth: (name: string, email: string, avatarUrl?: string) => void;
  setShowLoginModal: (v: boolean) => void;

  // Onboarding
  setShowOnboardingWizard: (v: boolean) => void;
  completeOnboarding: () => void;

  // Artifact panel
  setSelectedArtifactId: (id: string | null) => void;
  toggleArtifactPanel: () => void;

  // PWA
  setDeferredPrompt: (p: unknown) => void;

  // Command Center — activity streak + daily suggestion
  /** Registers today as an active day (streak tracking). No-op if already marked. */
  markActivityToday: () => void;
  /** Generates today's Amoun suggestion once per day (force=true regenerates). */
  generateDailySuggestion: (force?: boolean) => Promise<void>;

  // Persistence
  _persist: () => Promise<void>;
  _rehydrate: () => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════════════════════════════

const DEFAULTS: PersistedState = {
  currentLanguage: 'ar',
  theme: 'dark',
  accentColor: 'theme-emerald',
  activeView: 'home',
  voiceEnabled: false,
  voiceGender: 'male',
  activeModel: 'gemini-3.6-flash',
  activeProviderId: 'gemini',
  chatMode: 'minister' as ChatMode,
  customModels: [],
  projects: [],
  tasks: [],
  promptTemplates: DEFAULT_TEMPLATES as unknown as PromptTemplate[],
  chatSessions: [],
  currentSessionId: null,
  currentProjectId: null,
  isSidebarCollapsed: false,
  showAddModelModal: false,
  hasCompletedOnboarding: false,
  hiddenModelIds: [],
  activityDates: [],
  dailySuggestion: null,
  customSkills: [],
  enabledSkillIds: [
    'horus-guard', 'amoun-memory', 'task-extraction', 'task-scheduler',
    'voice-tts', 'append-event-log', 'model-tester', 'corrective-learning'
  ],
};

// ═══════════════════════════════════════════════════════════════════
// CREATE STORE
// ═══════════════════════════════════════════════════════════════════

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  ...DEFAULTS,

  // Transient
  isArtifactPanelOpen: false,
  selectedArtifactId: null,
  showLoginModal: false,
  showOnboardingWizard: false,
  user: null,
  isGenerating: false,
  generationStatus: '',
  generationStartedAt: null,
  abortController: null,
  deferredPrompt: null,

  // ── Navigation & UI ──────────────────────────────────────────────

  setActiveView: (v) => set({ activeView: v }),

  setTheme: (t) => {
    set({ theme: t });
    get()._persist();
  },

  setAccentColor: (c) => {
    set({ accentColor: c });
    get()._persist();
  },

  setLanguage: (l) => {
    set({ currentLanguage: l });
    if (typeof document !== 'undefined') {
      document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = l;
    }
    get()._persist();
  },

  toggleVoice: () => {
    set((s) => ({ voiceEnabled: !s.voiceEnabled }));
    get()._persist();
  },

  setVoiceGender: (g) => {
    set({ voiceGender: g });
    get()._persist();
  },

  setChatMode: (m) => {
    set({ chatMode: m });
    get()._persist();
  },

  toggleSidebar: () => {
    set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed }));
    get()._persist();
  },

  setSidebarCollapsed: (v) => {
    set({ isSidebarCollapsed: v });
    get()._persist();
  },

  // ── Models ──────────────────────────────────────────────────────

  setActiveModel: (modelId, providerId) => {
    let resolvedProviderId = providerId;
    if (!resolvedProviderId) {
      for (const p of PROVIDERS) {
        if (p.models.some((m) => m.id === modelId)) {
          resolvedProviderId = p.id;
          break;
        }
      }
    }
    const update: Partial<WorkspaceState> = { activeModel: modelId };
    if (resolvedProviderId) update.activeProviderId = resolvedProviderId;
    set(update);
    get()._persist();
  },

  setActiveProvider: (p) => {
    set({ activeProviderId: p });
    get()._persist();
  },

  addCustomModel: (m) => {
    set((s) => ({ customModels: [...s.customModels, m] }));
    get()._persist();
  },

  removeCustomModel: (id) => {
    set((s) => ({ customModels: s.customModels.filter((m) => m.id !== id) }));
    get()._persist();
  },

  hideModel: (id) => {
    set((s) => {
      const hiddenModelIds = s.hiddenModelIds.includes(id)
        ? s.hiddenModelIds
        : [...s.hiddenModelIds, id];
      // If the hidden model was active, fall back to the first visible one
      let activeModel = s.activeModel;
      if (activeModel === id) {
        const customFallback = s.customModels.find(
          (cm) => cm.id !== id && !hiddenModelIds.includes(cm.id),
        );
        const registryFallback = PROVIDERS.flatMap((p) => p.models).find(
          (m) => !hiddenModelIds.includes(m.id),
        );
        const next = customFallback?.id ?? registryFallback?.id;
        if (next) activeModel = next;
      }
      return { hiddenModelIds, activeModel };
    });
    get()._persist();
  },

  unhideAllModels: () => {
    set({ hiddenModelIds: [] });
    get()._persist();
  },

  setShowAddModelModal: (v) => set({ showAddModelModal: v }),

  // ── Sessions ────────────────────────────────────────────────────

  createNewSession: (projectId) => {
    const sessionId = crypto.randomUUID();
    const targetProjectId = projectId !== undefined ? projectId : (get().currentProjectId ?? undefined);
    const session: ChatSession = {
      id: sessionId,
      title: 'محادثة جديدة',
      messages: [],
      date: new Date().toISOString(),
      projectId: targetProjectId,
      modelId: get().activeModel,
    };
    set((s) => ({
      chatSessions: [session, ...s.chatSessions],
      currentSessionId: sessionId,
      currentProjectId: targetProjectId ?? null,
      activeView: 'workspace',
    }));
    get()._persist();
    return sessionId;
  },

  deleteSession: (id) => {
    set((s) => ({
      chatSessions: s.chatSessions.filter((cs) => cs.id !== id),
      currentSessionId: s.currentSessionId === id ? null : s.currentSessionId,
    }));
    get()._persist();
  },

  renameSession: (id, title) => {
    set((s) => ({
      chatSessions: s.chatSessions.map((cs) =>
        cs.id === id ? { ...cs, title } : cs,
      ),
    }));
    get()._persist();
  },

  setCurrentSession: (id) => {
    set({ currentSessionId: id, activeView: 'workspace' });
    get()._persist();
  },

  toggleFavoriteSession: (id) => {
    set((s) => ({
      chatSessions: s.chatSessions.map((cs) =>
        cs.id === id ? { ...cs, isFavorite: !cs.isFavorite } : cs,
      ),
    }));
    get()._persist();
  },

  // ── Skills Management ───────────────────────────────────────────

  addCustomSkill: (skill) => {
    const newSkill: CustomSkill = {
      ...skill,
      id: crypto.randomUUID(),
      enabled: skill.enabled ?? true,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      customSkills: [...s.customSkills, newSkill],
      enabledSkillIds: newSkill.enabled ? [...s.enabledSkillIds, newSkill.id] : s.enabledSkillIds,
    }));
    get()._persist();
  },

  deleteCustomSkill: (id) => {
    set((s) => ({
      customSkills: s.customSkills.filter((sk) => sk.id !== id),
      enabledSkillIds: s.enabledSkillIds.filter((skId) => skId !== id),
    }));
    get()._persist();
  },

  toggleSkill: (skillId) => {
    set((s) => {
      const isEnabled = s.enabledSkillIds.includes(skillId);
      const nextEnabled = isEnabled
        ? s.enabledSkillIds.filter((id) => id !== skillId)
        : [...s.enabledSkillIds, skillId];
      const nextCustom = s.customSkills.map((sk) =>
        sk.id === skillId ? { ...sk, enabled: !isEnabled } : sk,
      );
      return {
        enabledSkillIds: nextEnabled,
        customSkills: nextCustom,
      };
    });
    get()._persist();
  },

  // ── SEND MESSAGE (core action) ─────────────────────────────────

  sendMessage: async (text, attachment) => {
    const state = get();
    if (state.isGenerating) return;

    // Ensure we have a session
    let sessionId = state.currentSessionId;
    if (!sessionId) {
      sessionId = get().createNewSession();
    }

    const currentSessionId = sessionId;

    // Build user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      attachments: attachment ? [attachment] : undefined,
    };

    // Build assistant placeholder
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      model: state.activeModel,
      isStreaming: true,
    };

    // Update session with user message + assistant placeholder
    const sessionsBefore = [...get().chatSessions];
    const updatedSessions = sessionsBefore.map((cs) => {
      if (cs.id !== currentSessionId) return cs;
      return {
        ...cs,
        messages: [...cs.messages, userMessage, assistantMessage],
        modelId: state.activeModel,
      };
    });

    const abortController = new AbortController();
    const isRtl = state.currentLanguage === 'ar';
    set({
      chatSessions: updatedSessions,
      isGenerating: true,
      generationStatus: isRtl ? '⏳ جاري تجهيز السياق والذاكرة…' : '⏳ Building context & memory…',
      generationStartedAt: Date.now(),
      abortController,
    });

    /** Updates the live status line (no-op text change if identical). */
    const setGenStatus = (status: string) => {
      if (get().generationStatus !== status) set({ generationStatus: status });
    };
    const clearGenStatus = () => set({ generationStatus: '', generationStartedAt: null });

    // Event log: user message (source-of-truth append)
    appendSessionEvent(currentSessionId, 'user/message', {
      messageId: userMessage.id,
      content: text,
      attachment: attachment?.name ?? null,
      model: state.activeModel,
    });

    // Collect streamed content
    let streamedContent = '';

    // Throttled stream flush — batch re-renders (~50ms) instead of per-token
    // (every set() re-renders the whole message tree — painful on mobile)
    let flushTimer: ReturnType<typeof setTimeout> | null = null;
    const flushStream = () => {
      flushTimer = null;
      set((s) => ({
        chatSessions: s.chatSessions.map((cs) => {
          if (cs.id !== currentSessionId) return cs;
          return {
            ...cs,
            messages: cs.messages.map((m) =>
              m.id === assistantMessage.id ? { ...m, content: streamedContent } : m,
            ),
          };
        }),
      }));
    };
    const cancelFlush = () => {
      if (flushTimer !== null) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
    };

    // Resolve the current session for the handler & apply automatic context compaction if needed
    const getSessionMessages = () => {
      const s = get().chatSessions.find((cs) => cs.id === currentSessionId);
      const raw = s?.messages.filter((m) => m.role !== 'system') ?? [];
      const { compactedMessages, compactedCount } = compactMessages(raw, state.activeModel, 0.7);
      if (compactedCount > 0) {
        console.info(`[workspaceStore] Auto-compacted ${compactedCount} earlier messages to prevent token overflow.`);
      }
      return compactedMessages;
    };

    // Build system prompt with context injection (async)
    const modeConfig = CHAT_MODES.find((m) => m.id === state.chatMode);
    const systemPrompt = await buildContextualPrompt({
      basePrompt: BASE_SYSTEM_PROMPT,
      modePrefix: modeConfig?.systemPrefix ?? '',
      tasks: state.tasks,
      projects: state.projects,
      currentProjectId: state.currentProjectId,
      userQuery: text,
      customSkills: state.customSkills,
      enabledSkillIds: state.enabledSkillIds,
    });

    // Auto-resolve correct providerId for the active model
    let resolvedProviderId = state.activeProviderId;
    for (const p of PROVIDERS) {
      if (p.models.some((m) => m.id === state.activeModel)) {
        resolvedProviderId = p.id;
        break;
      }
    }

    // Resolve user-added models — activeModel holds the CustomModel.id (UUID).
    // Checked unconditionally so a stale activeProviderId can never misroute.
    const customModel = state.customModels.find((cm) => cm.id === state.activeModel);
    let requestModelId = state.activeModel;
    let requestCustomModel: CustomModel | undefined;
    if (customModel) {
      if (customModel.providerId) {
        // Model added inside a built-in provider group → that provider's endpoint + key
        resolvedProviderId = customModel.providerId;
        requestModelId = customModel.modelId; // real API slug
      } else {
        // Fully custom endpoint
        resolvedProviderId = 'custom';
        requestCustomModel = customModel;
      }
    }

    // Live status: which provider are we dialing?
    const providerDisplayName =
      customModel?.providerName ??
      PROVIDERS.find((p) => p.id === resolvedProviderId)?.displayName ??
      resolvedProviderId;
    setGenStatus(
      isRtl
        ? `🛰 جاري الاتصال بـ ${providerDisplayName} (${requestModelId})…`
        : `🛰 Contacting ${providerDisplayName} (${requestModelId})…`,
    );

    let receivedFirstChunk = false;

    try {
      const response = await processPrompt({
        messages: getSessionMessages(),
        modelId: requestModelId,
        providerId: resolvedProviderId,
        systemPrompt,
        customModel: requestCustomModel,
        attachments: attachment ? [attachment] : undefined,
        signal: abortController.signal,
        onChunk: (chunk) => {
          streamedContent += chunk;
          // First chunk: switch status from "dialing" to "writing"
          if (!receivedFirstChunk) {
            receivedFirstChunk = true;
            setGenStatus(isRtl ? '✍️ جاري الاستلام والكتابة…' : '✍️ Receiving & writing…');
          }
          // Schedule a batched UI update instead of re-rendering per token
          if (flushTimer === null) {
            flushTimer = setTimeout(flushStream, 50);
          }
        },
      });

      // Finalize assistant message — strip task JSON from displayed content
      cancelFlush();
      const rawContent = response.content || streamedContent;
      const displayContent = stripTaskJSONFromResponse(rawContent);
      const totalTokens = response.tokensUsed.input + response.tokensUsed.output;

      set((s) => {
        // Persist generation transparency onto the message record — the counter
        // and final Arabic status outlive the volatile GenerationIndicator (UX)
        const genSeconds = s.generationStartedAt
          ? Math.max(1, Math.round((Date.now() - s.generationStartedAt) / 1000))
          : undefined;
        const finalStatus = isRtl ? '✅ اكتمل' : '✅ Done';
        return {
          chatSessions: s.chatSessions.map((cs) => {
            if (cs.id !== currentSessionId) return cs;
            return {
              ...cs,
              messages: cs.messages.map((m) =>
                m.id === assistantMessage.id
                  ? {
                      ...m,
                      content: displayContent,
                      isStreaming: false,
                      tokensUsed: totalTokens,
                      toolCalls: response.toolCalls,
                      generationSeconds: genSeconds,
                      generationFinalStatus: finalStatus,
                    }
                  : m,
              ),
            };
          }),
          isGenerating: false,
          abortController: null,
          generationStatus: '',
          generationStartedAt: null,
        };
      });

      // ── Extract artifacts from code blocks ──
      if (rawContent) {
        get().markActivityToday();
        const artifacts = extractArtifactsFromResponse(
          rawContent,
          currentSessionId,
          assistantMessage.id,
          get().currentProjectId ?? undefined,
        );
        for (const artifact of artifacts) {
          await wazeerDB.put('artifacts', artifact);
        }
      }

      // ── Extract tasks from RAW AI response (before stripping) ──
      const extractedTasks = extractTasks(rawContent, currentSessionId);
      if (extractedTasks.length > 0) {
        set((s) => ({ tasks: [...s.tasks, ...extractedTasks] }));
        get()._persist();
      }

      // ── Extract memories (fire-and-forget) ──
      const sessionMessages = get().chatSessions.find(
        (cs) => cs.id === currentSessionId,
      )?.messages;
      if (sessionMessages) {
        extractMemories(sessionMessages, currentSessionId).catch(() => {
          // Memory extraction failures are non-critical
        });
      }

      // ── Log event ──
      appendSessionEvent(currentSessionId, 'assistant/message', {
        messageId: assistantMessage.id,
        model: response.model,
        provider: response.provider,
        tokens: totalTokens,
        durationMs: Math.round(response.duration),
        content: rawContent,
      });
      try {
        const { logEvent } = await import('@/hooks/useEventLogger');
        logEvent('message_received', {
          model: response.model,
          provider: response.provider,
          tokens: totalTokens,
          sessionId: currentSessionId,
          duration: response.duration,
        });
      } catch {
        // Event logger not available — non-critical
      }

      get()._persist();
    } catch (error) {
      // Broad abort detection: DOM AbortError OR SDK-specific abort messages
      // ("signal is aborted without reason", "BodyStreamBuffer was aborted", …)
      const rawMessage = error instanceof Error ? error.message : String(error);
      const isAbort =
        (error instanceof DOMException && error.name === 'AbortError') ||
        /abort/i.test(rawMessage);

      // Check if aborted
      if (isAbort) {
        cancelFlush();
        const stoppedSeconds = get().generationStartedAt
          ? Math.max(1, Math.round((Date.now() - get().generationStartedAt!) / 1000))
          : undefined;
        clearGenStatus();
        set((s) => ({
          chatSessions: s.chatSessions.map((cs) => {
            if (cs.id !== currentSessionId) return cs;
            return {
              ...cs,
              messages: cs.messages.map((m) =>
                m.id === assistantMessage.id
                  ? {
                      ...m,
                      content: streamedContent || (isRtl ? '⏹ تم الإيقاف' : '⏹ Stopped'),
                      isStreaming: false,
                      generationSeconds: stoppedSeconds,
                      generationFinalStatus: isRtl ? '⏹ اتوقف' : '⏹ Stopped',
                    }
                  : m,
              ),
            };
          }),
          isGenerating: false,
          abortController: null,
        }));
        return;
      }

      // Real error — show a humanized message in the assistant bubble
      cancelFlush();
      const failedSeconds = get().generationStartedAt
        ? Math.max(1, Math.round((Date.now() - get().generationStartedAt!) / 1000))
        : undefined;
      clearGenStatus();
      const errorMessage = humanizeError(unwrapErrorMessage(rawMessage), isRtl);
      const apiKeyError = isApiKeyError(rawMessage);
      console.error('[workspaceStore] sendMessage error:', rawMessage);

      set((s) => ({
        chatSessions: s.chatSessions.map((cs) => {
          if (cs.id !== currentSessionId) return cs;
          return {
            ...cs,
            messages: cs.messages.map((m) =>
              m.id === assistantMessage.id
                ? {
                    ...m,
                    content: `❌ ${errorMessage}`,
                    isStreaming: false,
                    generationSeconds: failedSeconds,
                    generationFinalStatus: isRtl ? '⛔ فشل' : '⛔ Failed',
                    apiKeyError,
                  }
                : m,
            ),
          };
        }),
        isGenerating: false,
        abortController: null,
      }));

      try {
        const { logEvent } = await import('@/hooks/useEventLogger');
        logEvent('error', {
          type: 'llm_error',
          message: errorMessage,
          sessionId: currentSessionId,
        });
      } catch {
        // Non-critical
      }

      // Event log: error
      appendSessionEvent(currentSessionId, 'error', {
        messageId: assistantMessage.id,
        message: errorMessage,
        model: state.activeModel,
      });

      get()._persist();
    }
  },

  stopGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
  },

  addTemplate: (t) => {
    set((s) => ({
      promptTemplates: [
        ...s.promptTemplates,
        { ...t, id: crypto.randomUUID(), isBuiltIn: false },
      ],
    }));
    get()._persist();
  },

  updateTemplate: (id, patch) => {
    set((s) => ({
      promptTemplates: s.promptTemplates.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
    get()._persist();
  },

  deleteTemplate: (id) => {
    set((s) => ({ promptTemplates: s.promptTemplates.filter((t) => t.id !== id || t.isBuiltIn) }));
    get()._persist();
  },

  useTemplate: async (id) => {
    const t = get().promptTemplates.find((x) => x.id === id);
    if (!t) return;
    if (!get().currentSessionId) get().createNewSession();
    set({ activeView: 'workspace' });
    await get().sendMessage(t.content);
  },

  rateMessage: (messageId, rating, tags) => {
    const { chatSessions, currentSessionId } = get();
    if (!currentSessionId) return;
    set({
      chatSessions: chatSessions.map((cs) => {
        if (cs.id !== currentSessionId) return cs;
        return {
          ...cs,
          messages: cs.messages.map((m) =>
            m.id === messageId
              ? { ...m, rating, ratingTags: tags ?? (rating === 'up' ? undefined : m.ratingTags) }
              : m,
          ),
        };
      }),
    });
    get()._persist();

    // 👎 → corrective memory so Amoun learns from the feedback (fire-and-forget)
    if (rating === 'down') {
      const TAG_AR: Record<string, string> = {
        wrong: 'غلط علمي',
        long: 'رد طويل',
        unclear: 'مش فاهم',
        'broken-code': 'كود مكسور',
      };
      const labelsAr = (tags ?? []).map((t) => TAG_AR[t] ?? t).join('، ');
      const memory = {
        id: crypto.randomUUID(),
        category: 'preference' as const,
        content: labelsAr
          ? `تغذية راجعة: المستخدم لم يعجبه رد سابق (${labelsAr}). تجنّب هذه المشاكل في إجاباتك القادمة.`
          : 'تغذية راجعة: المستخدم لم يعجبه رد سابق. حسّن جودة الإجابات.',
        confidence: 0.9,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + LIMITS.MEMORY_DEFAULT_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        accessCount: 0,
      };
      wazeerDB.put('userMemory', memory).catch(() => {
        // Feedback memory is non-critical
      });
    }
  },

  deleteMessage: (messageId: string) => {
    const { chatSessions, currentSessionId, _persist } = get();
    if (!currentSessionId) return;

    const session = chatSessions.find((cs) => cs.id === currentSessionId);
    if (!session) return;

    const targetIdx = session.messages.findIndex((m) => m.id === messageId);
    if (targetIdx === -1) return;

    const targetMsg = session.messages[targetIdx];
    const idsToRemove = new Set<string>([messageId]);

    // If user message, also delete the subsequent assistant response if present
    if (targetMsg.role === 'user') {
      const nextMsg = session.messages[targetIdx + 1];
      if (nextMsg && nextMsg.role === 'assistant') {
        idsToRemove.add(nextMsg.id);
      }
    }

    set({
      chatSessions: chatSessions.map((cs) => {
        if (cs.id !== currentSessionId) return cs;
        return {
          ...cs,
          messages: cs.messages.filter((m) => !idsToRemove.has(m.id)),
        };
      }),
    });
    _persist();
  },

  editMessage: async (messageId: string, newContent: string) => {
    const { chatSessions, currentSessionId, _persist, sendMessage } = get();
    if (!currentSessionId) return;

    const session = chatSessions.find((cs) => cs.id === currentSessionId);
    if (!session) return;

    const msgIndex = session.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    // Keep messages before this target message, update message content, discard remaining responses
    const preservedMessages = session.messages.slice(0, msgIndex);
    
    set({
      chatSessions: chatSessions.map((cs) => {
        if (cs.id !== currentSessionId) return cs;
        return { ...cs, messages: preservedMessages };
      }),
    });
    _persist();

    // Re-send the edited message
    await sendMessage(newContent);
  },

  retryMessage: async (messageId: string) => {
    const { chatSessions, currentSessionId, _persist, sendMessage } = get();
    if (!currentSessionId) return;

    const session = chatSessions.find((cs) => cs.id === currentSessionId);
    if (!session) return;

    const msgIndex = session.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const targetMsg = session.messages[msgIndex];

    if (targetMsg.role === 'user') {
      // Re-trigger from user message
      const preservedMessages = session.messages.slice(0, msgIndex);
      set({
        chatSessions: chatSessions.map((cs) => {
          if (cs.id !== currentSessionId) return cs;
          return { ...cs, messages: preservedMessages };
        }),
      });
      _persist();
      await sendMessage(targetMsg.content);
    } else {
      // Re-trigger assistant response (find preceding user message)
      const sliced = session.messages.slice(0, msgIndex);
      let prevUserMsgIndex = -1;
      for (let i = sliced.length - 1; i >= 0; i--) {
        if (sliced[i].role === 'user') {
          prevUserMsgIndex = i;
          break;
        }
      }

      if (prevUserMsgIndex !== -1) {
        const prevUserMsg = session.messages[prevUserMsgIndex];
        const preservedMessages = session.messages.slice(0, prevUserMsgIndex);
        set({
          chatSessions: chatSessions.map((cs) => {
            if (cs.id !== currentSessionId) return cs;
            return { ...cs, messages: preservedMessages };
          }),
        });
        _persist();
        await sendMessage(prevUserMsg.content);
      }
    }
  },

  // ── Tasks ───────────────────────────────────────────────────────

  addTask: (text, source = 'manual') => {
    const task: Task = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      source,
      priority: 'medium',
      tags: [],
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ tasks: [...s.tasks, task] }));
    get()._persist();
  },

  toggleTask: (id) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? new Date().toISOString() : undefined,
            }
          : t,
      ),
    }));
    get()._persist();
  },

  removeTask: (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    get()._persist();
  },

  editTask: (id, text) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, text } : t)),
    }));
    get()._persist();
  },

  importTasks: (drafts) => {
    const tasks: Task[] = drafts.map((d) => ({
      id: crypto.randomUUID(),
      text: d.text,
      completed: d.completed,
      source: 'manual',
      priority: d.priority,
      dueDate: d.dueDate,
      tags: d.tags,
      createdAt: new Date().toISOString(),
    }));
    set((s) => ({ tasks: [...s.tasks, ...tasks] }));
    get()._persist();
    return tasks.length;
  },

  runTask: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task || get().isGenerating) return;
    const isRtl = get().currentLanguage === 'ar';
    const due = task.dueDate ? (isRtl ? ` — الموعد النهائي: ${task.dueDate}` : ` — Deadline: ${task.dueDate}`) : '';
    const prompt = isRtl
      ? `▶️ نفّذ هذه المهمة الآن بالكامل وسلّم مخرج نهائي جاهز: «${task.text}»${due}. استخدم كل الأدوات اللازمة، ولو المخرج ملف أو كود سلّمه كبردية كاملة.`
      : `▶️ Execute this task now end-to-end and deliver a final ready output: "${task.text}"${due}. Use every tool you need — if the output is a file or code, deliver it as a complete artifact.`;
    // Switch to workspace + fire the execution
    set({ activeView: 'workspace' });
    void get().sendMessage(prompt);
  },

  // ── Projects ────────────────────────────────────────────────────

  addProject: async (name, summary = '', links = [], hasDocs = false) => {
    const projectId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    const initialFiles: string[] = [];

    // If hasDocs is enabled, generate real SDD Architecture docs & files as artifacts in IndexedDB
    if (hasDocs) {
      const sddDoc: Artifact = {
        id: crypto.randomUUID(),
        type: 'markdown',
        title: `${name.toLowerCase().replace(/\s+/g, '-')}-sdd-architecture.md`,
        content: `# 🏗️ ${name} — System Design Document (SDD)\n\n## 1. Executive Summary & Vision\n${summary || 'Comprehensive architecture specification and engineering roadmap.'}\n\n## 2. Architectural Layers\n- **Presentation Layer**: Client UI & reactive state management\n- **Service Orchestration**: AI Gateway & tool pipeline\n- **Data Storage**: IndexedDB persistence & local caching\n\n## 3. Core Requirements & Milestones\n- [ ] MVP Setup & Core Data Pipeline\n- [ ] Multi-Agent Coordination\n- [ ] Validation & Test Automation\n\n${links.length > 0 ? `## 4. References & External Endpoints\n${links.map((l) => `- ${l}`).join('\n')}\n` : ''}`,
        language: 'markdown',
        chatId: sessionId,
        messageId: 'system-init',
        createdAt: new Date().toISOString(),
        pinned: true,
        tags: ['sdd', 'architecture', 'docs'],
        projectId,
      };

      const planDoc: Artifact = {
        id: crypto.randomUUID(),
        type: 'markdown',
        title: `${name.toLowerCase().replace(/\s+/g, '-')}-execution-plan.md`,
        content: `# 📋 ${name} — Execution Plan & Roadmap\n\n### Phase 1: MVP Core\n- [x] Initial Architecture & SDD generated\n- [ ] Setup base contracts and schema\n\n### Phase 2: Feature Development\n- [ ] Implement core workflows and integrations\n- [ ] Connect multi-agent swarm routines\n\n### Phase 3: Production Polish\n- [ ] End-to-end testing and performance audits\n- [ ] Deployment and continuous verification`,
        language: 'markdown',
        chatId: sessionId,
        messageId: 'system-init',
        createdAt: new Date().toISOString(),
        pinned: true,
        tags: ['plan', 'roadmap', 'docs'],
        projectId,
      };

      await wazeerDB.put('artifacts', sddDoc).catch(() => {});
      await wazeerDB.put('artifacts', planDoc).catch(() => {});

      initialFiles.push(sddDoc.title, planDoc.title);
    }

    const initialSession: ChatSession = {
      id: sessionId,
      title: `${name} — جلسة البدء`,
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `👑 **أهلاً بك في بيئة عمل مشروع: ${name}**\n\n${summary ? `> ${summary}\n\n` : ''}${hasDocs ? '✅ **تم تأسيس وتوليد ملفات الـ SDD والمخططات المعمارية بنجاح:**\n- ' + initialFiles.join('\n- ') + '\n\nيمكنك الاطلاع عليها وتعديلها من لوحة البرديات أو طلب أي تعديلات معمارية مني مباشرة.' : 'جاهز لمساعدتك في بناء وتطوير المشروع وتخطيط مهامه.'}`,
          timestamp: new Date().toISOString(),
          model: get().activeModel,
        },
      ],
      date: new Date().toISOString(),
      projectId,
      modelId: get().activeModel,
    };

    const project: Project = {
      id: projectId,
      name,
      summary,
      links,
      hasDocs,
      createdAt: new Date().toISOString(),
      chats: [sessionId],
      files: initialFiles,
      icon: '📁',
    };

    set((s) => ({
      projects: [...s.projects, project],
      chatSessions: [initialSession, ...s.chatSessions],
      currentProjectId: projectId,
      currentSessionId: sessionId,
      activeView: 'workspace',
    }));

    await get()._persist();
    return projectId;
  },

  setCurrentProject: (projectId) => {
    if (!projectId) {
      set({ currentProjectId: null });
      get()._persist();
      return;
    }

    const state = get();
    // Find latest chat for this project, or create one
    const existingSession = state.chatSessions.find((cs) => cs.projectId === projectId);
    if (existingSession) {
      set({
        currentProjectId: projectId,
        currentSessionId: existingSession.id,
        activeView: 'workspace',
      });
    } else {
      const sessionId = crypto.randomUUID();
      const project = state.projects.find((p) => p.id === projectId);
      const newSession: ChatSession = {
        id: sessionId,
        title: project ? `${project.name} — محادثة` : 'جلسة مشروع',
        messages: [],
        date: new Date().toISOString(),
        projectId,
        modelId: state.activeModel,
      };
      set((s) => ({
        projects: s.projects.map((p) => (p.id === projectId ? { ...p, chats: [...p.chats, sessionId] } : p)),
        chatSessions: [newSession, ...s.chatSessions],
        currentProjectId: projectId,
        currentSessionId: sessionId,
        activeView: 'workspace',
      }));
    }
    get()._persist();
  },

  deleteProject: (id) => {
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      currentProjectId: s.currentProjectId === id ? null : s.currentProjectId,
    }));
    get()._persist();
  },

  // ── Governance Council (Memory Purification) ────────────────────

  purgeGeneralChats: () => {
    let removed = 0;
    set((s) => {
      // Keep only project-linked sessions — project environments are fully isolated
      const kept = s.chatSessions.filter((cs) => cs.projectId);
      removed = s.chatSessions.length - kept.length;
      const currentSessionId = kept.some((cs) => cs.id === s.currentSessionId)
        ? s.currentSessionId
        : kept[0]?.id ?? null;
      return { chatSessions: kept, currentSessionId };
    });
    get()._persist();
    return removed;
  },

  purgeProjects: () => {
    let removed = 0;
    set((s) => {
      removed = s.projects.length;
      // Keep only general sessions — project sessions are destroyed with their matrix
      const kept = s.chatSessions.filter((cs) => !cs.projectId);
      const currentSessionId = kept.some((cs) => cs.id === s.currentSessionId)
        ? s.currentSessionId
        : kept[0]?.id ?? null;
      return { projects: [], chatSessions: kept, currentProjectId: null, currentSessionId };
    });
    get()._persist();
    return removed;
  },

  purgeArtifacts: async () => {
    const all = await wazeerDB.getAll<Artifact>('artifacts');
    await wazeerDB.clear('artifacts');
    set({ isArtifactPanelOpen: false, selectedArtifactId: null });
    return all.length;
  },

  factoryReset: async () => {
    // Wipe generated data stores
    await wazeerDB.clear('artifacts').catch(() => {});
    await wazeerDB.clear('session_events').catch(() => {});
    await wazeerDB.clear('userMemory').catch(() => {});
    // Legacy config keys (events log + old task storage)
    await wazeerDB.delete('config', 'events').catch(() => {});
    await wazeerDB.delete('config', 'tasks').catch(() => {});
    // Reset to new-user state — login data (users/wazir_user/auth_logs) and API keys are preserved
    set({ ...DEFAULTS, user: get().user, isGenerating: false, generationStatus: '', generationStartedAt: null });
    await get()._persist();
  },

  // ── User ────────────────────────────────────────────────────────

  setShowLoginModal: (v) => set({ showLoginModal: v }),

  // ── Onboarding ────────────────────────────────────────────────────

  setShowOnboardingWizard: (v) => set({ showOnboardingWizard: v }),

  completeOnboarding: () => {
    set({ hasCompletedOnboarding: true, showOnboardingWizard: false });
    get()._persist();
  },

  setUser: (user) => set({ user }),

  logout: () => {
    set({ user: null, currentSessionId: null });
    try {
      localStorage.removeItem('wazir_session_token');
    } catch {
      // localStorage unavailable
    }
    wazeerDB.put('config', { id: 'wazir_user' } as Record<string, unknown>).catch(() => {});
  },

  loginOAuth: (name, email, avatarUrl) => {
    import('@/services/AuthService').then(({ loginOAuth }) => {
      loginOAuth(name, email, avatarUrl).then((user) => {
        set({ user });
      }).catch((err) => {
        console.error('[workspaceStore] OAuth login failed:', err);
      });
    });
  },

  // ── Artifact panel ─────────────────────────────────────────────

  setSelectedArtifactId: (id) => set({ selectedArtifactId: id }),

  toggleArtifactPanel: () =>
    set((s) => ({ isArtifactPanelOpen: !s.isArtifactPanelOpen })),

  // ── PWA ─────────────────────────────────────────────────────────

  setDeferredPrompt: (p) => set({ deferredPrompt: p }),

  // ── Command Center — streak + daily suggestion ─────────────────

  markActivityToday: () => {
    const today = localDateString(new Date());
    const dates = get().activityDates;
    if (dates.includes(today)) return;
    set({ activityDates: [...dates.slice(-59), today] });
    get()._persist();
  },

  generateDailySuggestion: async (force) => {
    const s = get();
    const today = localDateString(new Date());
    if (!force && s.dailySuggestion?.date === today) return;
    if (s.isGenerating) return;
    try {
      const pending = s.tasks.filter((t) => !t.completed).slice(0, 5);
      const projectNames = s.projects.slice(0, 3).map((p) => p.name);
      const prompt = [
        'أنت مخطط يومي ذكي داخل وزير OS.',
        `المهام المعلقة: ${pending.length ? pending.map((t) => t.text).join(' | ') : 'لا يوجد'}`,
        `المشاريع: ${projectNames.length ? projectNames.join(' | ') : 'لا يوجد'}`,
        'اقترح مهمة واحدة عملية عالية القيمة تبدأ بها الآن (من مهامك أو فكرة جديدة مناسبة).',
        'أعد فقط JSON بالشكل: {"task": "نص المهمة", "reason": "سبب مختصر في سطر"}',
      ].join('\n');
      const { processPrompt } = await import('@/services/AIGateway');
      const response = await processPrompt({
        messages: [{ id: crypto.randomUUID(), role: 'user', content: prompt, timestamp: new Date().toISOString() }],
        modelId: s.activeModel,
        providerId: s.activeProviderId,
        systemPrompt: 'You are a daily planner. Reply with ONLY the JSON object, no markdown.',
      });
      const match = response.content.match(/\{[\s\S]*\}/);
      if (!match) return;
      const parsed = JSON.parse(match[0]) as { task?: unknown; reason?: unknown };
      if (typeof parsed.task !== 'string' || !parsed.task.trim()) return;
      set({
        dailySuggestion: {
          text: parsed.task.trim().slice(0, 200),
          reason: typeof parsed.reason === 'string' ? parsed.reason.trim().slice(0, 160) : '',
          date: today,
        },
      });
      get()._persist();
    } catch {
      // Suggestion is optional — silently skip (no key / provider down)
    }
  },

  // ── Persistence ────────────────────────────────────────────────

  _persist: async () => {
    const state = get();
    const toSave: PersistedState = {
      currentLanguage: state.currentLanguage,
      theme: state.theme,
      accentColor: state.accentColor,
      activeView: state.activeView,
      voiceEnabled: state.voiceEnabled,
      voiceGender: state.voiceGender,
      activeModel: state.activeModel,
      activeProviderId: state.activeProviderId,
      chatMode: state.chatMode,
      customModels: state.customModels,
      projects: state.projects,
      tasks: state.tasks,
      promptTemplates: state.promptTemplates,
      chatSessions: state.chatSessions,
      currentSessionId: state.currentSessionId,
      currentProjectId: state.currentProjectId,
      isSidebarCollapsed: state.isSidebarCollapsed,
      showAddModelModal: state.showAddModelModal,
      hasCompletedOnboarding: state.hasCompletedOnboarding,
      hiddenModelIds: state.hiddenModelIds,
      activityDates: state.activityDates,
      dailySuggestion: state.dailySuggestion,
      customSkills: state.customSkills,
      enabledSkillIds: state.enabledSkillIds,
    };
    await savePersistedState(toSave);
  },

  _rehydrate: async () => {
    const saved = await loadPersistedState();
    if (Object.keys(saved).length > 0) {
      // Migration: gemini-2.5-flash was retired by Google (404 for new keys) → 3.6
      if (saved.activeModel === 'gemini-2.5-flash') {
        saved.activeModel = 'gemini-3.6-flash';
        saved.activeProviderId = 'gemini';
      }
      // Migration: chat modes were unified to exactly 4 (minister/coding/research/education)
      // — stale persisted values (general/brainstorm/files) fall back to minister
      if (!CHAT_MODES.some((m) => m.id === saved.chatMode)) {
        saved.chatMode = 'minister' as ChatMode;
      }
      // Guarantee skill arrays exist
      if (!saved.enabledSkillIds) {
        saved.enabledSkillIds = DEFAULTS.enabledSkillIds;
      }
      if (!saved.customSkills) {
        saved.customSkills = [];
      }
      set({ ...DEFAULTS, ...saved });
      if (typeof document !== 'undefined') {
        const lang = saved.currentLanguage || DEFAULTS.currentLanguage;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
      }
    }
  },
}));

// ═══════════════════════════════════════════════════════════════════
// BOOT: rehydrate on import
// ═══════════════════════════════════════════════════════════════════

wazeerDB.init().then(() => {
  useWorkspaceStore.getState()._rehydrate();
}).catch(() => {
  console.warn('[workspaceStore] IndexedDB init failed, using defaults');
});
