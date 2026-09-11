/**
 * Wazeer OS v2.0 — Master Type Definitions
 * Single Source of Truth for ALL TypeScript interfaces.
 * Green Code: Every type here MUST be consumed by at least one module.
 * Security as Mindset: Sensitive fields marked with @sensitive JSDoc.
 */

// ═══════════════════════════════════════════════════════════════════
// ENUMS & LITERALS
// ═══════════════════════════════════════════════════════════════════

/** Chat modes that modify system prompt behavior — exactly 4 (unified with Home Command Center) */
export type ChatMode = 'minister' | 'research' | 'education' | 'coding';

/** Available LLM provider identifiers */
export type LLMProviderId =
  | 'gemini'
  | 'claude'
  | 'glm'
  | 'nvidia'
  | 'deepseek'
  | 'kimi'
  | 'openrouter'
  | 'openai'
  | 'groq'
  | 'mistral'
  | 'xai'
  | 'cerebras'
  | 'custom';

/** Theme preset identifiers */
export type ThemePreset = 'emerald' | 'cyber-blue' | 'crimson' | 'purple' | 'custom';

/** App theme (dark/light base) */
export type AppTheme = 'dark' | 'light';

/** Full theme selection persisted in the store: base mode OR accent preset */
export type AppThemeSelection = AppTheme | ThemePreset;

/** App language */
export type AppLanguage = 'ar' | 'en';

/** Voice gender for TTS */
export type VoiceGender = 'male' | 'female';

/** All navigable views in the app */
export type ViewType =
  | 'home'
  | 'workspace'
  | 'projects'
  | 'settings'
  | 'admin'
  | 'agents'
  | 'templates'
  | 'kings-tools'
  | 'history'
  | 'landing'
  | 'compute'
  | 'storage'
  | 'integrated'
  | 'skills'
  | 'reports'
  | 'about';

export interface Contributor {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  bio?: string;
  linkedin?: string;
  facebook?: string;
  twitter?: string;
  github?: string;
  order?: number;
}

/** Agent status in the swarm */
export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'executing'
  | 'error'
  | 'intercepting';

/** Task priority levels */
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

/** Task source tracking */
export type TaskSource = 'manual' | 'ai' | 'scheduled';

/** Memory category for cumulative learning */
export type MemoryCategory =
  | 'preference'
  | 'fact'
  | 'decision'
  | 'skill'
  | 'context';

/** Artifact content types */
export type ArtifactType =
  | 'code'
  | 'html'
  | 'svg'
  | 'markdown'
  | 'json'
  | 'image';

/** Event types for the event logger */
export type EventType =
  | 'message_sent'
  | 'message_received'
  | 'error'
  | 'tool_call'
  | 'task_created'
  | 'memory_extracted'
  | 'auth_event'
  | 'model_switched'
  | 'session_created'
  | 'artifact_created';

// ═══════════════════════════════════════════════════════════════════
// USER & AUTH
// ═══════════════════════════════════════════════════════════════════

export interface UserPreferences {
  language: AppLanguage;
  theme: AppTheme;
  accentColor: string;
  voiceEnabled: boolean;
  voiceGender: VoiceGender;
}

export type UserRole = 'admin' | 'user' | 'banned';

export interface User {
  id: string;
  name: string;
  email: string;
  /** @sensitive SHA-256 hashed. Absent for OAuth users. */
  passwordHash?: string;
  avatarUrl?: string;
  role: UserRole;
  preferences: UserPreferences;
  createdAt: string;
  lastLogin: string;
  /** Server-side only — never sent to client */
  loginCount?: number;
  /** Server-side only */
  lastIp?: string;
}

export interface AuthLog {
  id: string;
  userId: string;
  event: 'login' | 'logout' | 'register' | 'oauth_login' | 'failed_login' | 'role_change' | 'user_banned' | 'user_unbanned' | 'honeypot_trigger';
  email: string;
  timestamp: string;
  ip?: string;
  details?: string;
}

// ═══════════════════════════════════════════════════════════════════
// CHAT
// ═══════════════════════════════════════════════════════════════════

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  textContent?: string;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  result?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: string;
  tokensUsed?: number;
  attachments?: Attachment[];
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
  /** User feedback — 👎 شبشب / 😍 قلوب */
  rating?: 'up' | 'down';
  ratingTags?: string[];
  /** ⏱ Persisted generation transparency — stays on the record after completion (not volatile UI) */
  generationSeconds?: number;
  generationFinalStatus?: string;
  /** 🔑 True when the failure was an API-key problem — shows the Settings CTA on the error bubble */
  apiKeyError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  date: string;
  projectId?: string;
  modelId: string;
  summary?: string;
  isFavorite?: boolean;
}

/**
 * Append-only session event (DSH Event-Sourced Log pattern, write-side).
 * Stored in IndexedDB `session_events`; "model-visible means logged".
 */
export interface SessionEvent {
  /** Auto-increment key — assigned by IndexedDB */
  id?: number;
  sessionId: string;
  type: 'user/message' | 'assistant/message' | 'error';
  timestamp: string;
  payload: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════
// TASKS
// ═══════════════════════════════════════════════════════════════════

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  source: TaskSource;
  priority: TaskPriority;
  dueDate?: string;
  tags: string[];
  createdAt: string;
  completedAt?: string;
  executionResult?: string;
  sourceSessionId?: string;
}

// ═══════════════════════════════════════════════════════════════════
// ARTIFACTS
// ═══════════════════════════════════════════════════════════════════

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  language?: string;
  chatId: string;
  messageId: string;
  createdAt: string;
  pinned: boolean;
  tags: string[];
  projectId?: string;
}

// ═══════════════════════════════════════════════════════════════════
// CUSTOM MODELS
// ═══════════════════════════════════════════════════════════════════

export interface CustomModel {
  id: string;
  providerName: string;
  /** When set → user-added model INSIDE a built-in provider group
   *  (routes through that provider's endpoint + key from Settings).
   *  When absent → fully custom endpoint with its own stored key. */
  providerId?: LLMProviderId;
  /** Real API model slug (e.g. "z-ai/glm-5.2:free") */
  modelId: string;
  /** Dropdown label — defaults to "providerName / modelId" */
  displayName?: string;
  /** Only for fully custom endpoints */
  endpoint?: string;
  /** @sensitive Masked in UI — key lookup name; only for fully custom endpoints */
  apiKeyConfigKey?: string;
  hasVision: boolean;
  hasStreaming: boolean;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// CUMULATIVE MEMORY (v2.0 NEW)
// ═══════════════════════════════════════════════════════════════════

export interface UserMemory {
  id: string;
  category: MemoryCategory;
  content: string;
  confidence: number;
  sourceSessionId?: string;
  createdAt: string;
  expiresAt?: string;
  accessCount: number;
  lastAccessedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════
// AGENTS / SWARM
// ═══════════════════════════════════════════════════════════════════

export interface AgentState {
  id: string;
  displayName: string;
  description: string;
  status: AgentStatus;
  currentTask?: string;
  retryCount: number;
  maxRetries: number;
  lastActivity: string;
  tokensUsed: number;
  tasksCompleted: number;
  capabilities: string[];
}

// ═══════════════════════════════════════════════════════════════════
// SKILLS (CUSTOM & SYSTEM)
// ═══════════════════════════════════════════════════════════════════

export interface CustomSkill {
  id: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  promptSnippet: string;
  icon?: string;
  enabled: boolean;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════════════════════════════

export interface Project {
  id: string;
  name: string;
  summary: string;
  links: string[];
  hasDocs: boolean;
  createdAt: string;
  chats: string[];
  files: string[];
  icon?: string;
}

// ═══════════════════════════════════════════════════════════════════
// PROMPT TEMPLATES
// ═══════════════════════════════════════════════════════════════════

export interface PromptTemplate {
  id: string;
  name: string;
  nameEn: string;
  content: string;
  icon: string;
  color: string;
  isBuiltIn: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// EVENT LOGGING
// ═══════════════════════════════════════════════════════════════════

export interface AmounEvent {
  id: string;
  type: EventType;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface EventMetrics {
  totalOperations: number;
  totalTokens: number;
  totalErrors: number;
  errorRate: number;
  activeSessions: number;
  tasksCreated: number;
  memoriesExtracted: number;
  modelUsage: Record<string, number>;
  tokensOverTime: Array<{ date: string; tokens: number }>;
  errorsOverTime: Array<{ date: string; count: number }>;
}

// ═══════════════════════════════════════════════════════════════════
// LLM / GATEWAY
// ═══════════════════════════════════════════════════════════════════

export interface ModelInfo {
  id: string;
  providerId: LLMProviderId;
  displayName: string;
  modelId: string;
  capabilities: {
    vision: boolean;
    streaming: boolean;
    tools: boolean;
    grounding: boolean;
    maxTokens: number;
  };
  pricing: { input: number; output: number };
}

export interface ProviderConfig {
  id: LLMProviderId;
  displayName: string;
  target: string;
  authHeader: string;
  pathPrefix: string;
  models: ModelInfo[];
}

export interface GatewayRequest {
  messages: ChatMessage[];
  modelId: string;
  providerId: LLMProviderId;
  systemPrompt: string;
  attachments?: Attachment[];
  /** Resolved custom model config — REQUIRED when providerId is 'custom' */
  customModel?: CustomModel;
  signal?: AbortSignal;
  onChunk?: (text: string) => void;
  onToolCall?: (toolCall: ToolCall) => void;
}

export interface GatewayResponse {
  content: string;
  model: string;
  provider: LLMProviderId;
  tokensUsed: { input: number; output: number };
  duration: number;
  toolCalls?: ToolCall[];
  groundingMetadata?: unknown;
}

// ═══════════════════════════════════════════════════════════════════
// SECURITY
// ═══════════════════════════════════════════════════════════════════

export interface SecurityScanResult {
  safe: boolean;
  threats: SecurityThreat[];
  sanitizedCode?: string;
}

export interface SecurityThreat {
  pattern: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  line: number;
  description: string;
}

export interface BannedNode {
  ip: string;
  userId?: string;
  email?: string;
  reason: string;
  timestamp: string;
  permanent: boolean;
  bannedBy?: string;
}

// ═══════════════════════════════════════════════════════════════════
// API KEY STORAGE
// ═══════════════════════════════════════════════════════════════════

/** @sensitive Stored in IndexedDB, never sent to our server */
export interface ApiKeys {
  gemini?: string;
  claude?: string;
  glm?: string;
  nvidia?: string;
  deepseek?: string;
  kimi?: string;
  openrouter?: string;
  openai?: string;
  groq?: string;
  mistral?: string;
  xai?: string;
  cerebras?: string;
  ollama?: string;
  [key: string]: string | undefined;
}

// ═══════════════════════════════════════════════════════════════════
// ADMIN & FIRESTORE (v2.1 — Enterprise)
// ═══════════════════════════════════════════════════════════════════

/** Server-side admin metrics aggregated from Firestore */
export interface AdminMetrics {
  totalUsers: number;
  activeToday: number;
  activeThisWeek: number;
  bannedUsers: number;
  totalLogins24h: number;
  failedLogins24h: number;
  recentAuthLogs: AuthLog[];
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
    lastLogin: string;
    createdAt: string;
    avatarUrl?: string;
  }>;
  topModels: Array<{ modelId: string; count: number }>;
}

/** Admin action request body */
export interface AdminActionRequest {
  targetUserId: string;
  action: 'ban' | 'unban' | 'promote' | 'demote' | 'delete';
  reason?: string;
}

/** Add user request (admin creates account) */
export interface AdminCreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}
