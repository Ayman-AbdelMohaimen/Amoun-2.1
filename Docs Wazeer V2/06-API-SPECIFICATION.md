# 𓂀 Wazeer OS — API Specification | مواصفات الواجهة البرمجية

> **Version:** 2.0.0-Rewrite · **Status:** Pre-Release · **Classification:** Enterprise Edition
> **Last Updated:** 2025-07-13 · **Author:** 100MillionDEV / العرآب

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Server-Side Routes (Express Proxy)](#2-server-side-routes-express-proxy)
3. [Provider Registry — 15 Mounted Providers](#3-provider-registry--15-mounted-providers)
4. [Client-Side Service Interfaces](#4-client-side-service-interfaces)
5. [Error Response Format](#5-error-response-format)
6. [Rate Limiting Rules](#6-rate-limiting-rules)
7. [Security Headers](#7-security-headers)
8. [WebSocket & Streaming Protocol](#8-websocket--streaming-protocol)
9. [Authentication Flow](#9-authentication-flow)

---

## 1. Architecture Overview

Wazeer OS follows a **proxy-only server architecture**. The Express server holds **zero business logic** — it is a transparent BYOK (Bring Your Own Key) reverse proxy. All intelligence lives on the client.

```
┌─────────────────────────────────────────────────────────────┐
│                    Wazeer OS Client (PWA)                    │
│  ┌──────────┐ ┌──────────────┐ ┌────────────┐ ┌───────────┐  │
│  │AIGateway │ │AuthService   │ │MemoryEngine│ │HorusGuard │  │
│  └────┬─────┘ └──────┬───────┘ └────────────┘ └───────────┘  │
│       │              │                                      │
│       ▼              ▼                                      │
│  ┌─────────────────────────────┐                            │
│  │   IndexedDB "Monmamar" v4   │                            │
│  │   (All user data on-device)  │                            │
│  └─────────────────────────────┘                            │
└──────────────────────┬──────────────────────────────────────┘
                       │ BYOK headers (user's own keys)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Express Proxy Server (No Business Logic)        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐   │
│  │ /health  │  │ /proxy   │  │ /proxy/{providerId}/*   │   │
│  └──────────┘  └──────────┘  └──────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Helmet │ Rate Limit │ Brotli │ BYOK Pass-Through     │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ Transparent forward
                       ▼
        ┌──────────────┼──────────────┐
        │              │              │
   Gemini API    OpenAI API    15 Providers...
```

### Key Principles

| Principle | Implementation |
|-----------|---------------|
| **Separation of Concerns** | Server = proxy only; Client = all logic |
| **Zero Knowledge** | Server never sees, stores, or logs API keys |
| **Green Code** | Minimal server footprint — no ORM, no sessions, no DB |
| **BYOK** | Users bring their own provider API keys |

---

## 2. Server-Side Routes (Express Proxy)

### 2.1 Health Check

**`GET /api/health`**

Returns server health status and version information.

#### Request

```http
GET /api/health HTTP/1.1
Host: wazeer.os
Accept: application/json
```

#### Response — `200 OK`

```json
{
  "status": "ok",
  "version": "2.0.0-rewrite",
  "codename": "Monmamar",
  "timestamp": "2025-07-13T12:00:00.000Z",
  "uptime": 86400,
  "providers": 15,
  "mode": "proxy-only"
}
```

#### Response — `503 Service Unavailable`

```json
{
  "status": "degraded",
  "error": "proxy_initialization_failed",
  "message": "Some providers failed to mount",
  "timestamp": "2025-07-13T12:00:00.000Z"
}
```

---

### 2.2 Proxy Provider Listing

**`GET /api/proxy`**

Returns all mounted BYOK proxy providers with their identifiers and target base URLs.

#### Request

```http
GET /api/proxy HTTP/1.1
Host: wazeer.os
Accept: application/json
```

#### Response — `200 OK`

```json
{
  "status": "ok",
  "count": 15,
  "providers": [
    {
      "id": "gemini",
      "name": "Google Gemini",
      "baseUrl": "https://generativelanguage.googleapis.com",
      "authType": "header",
      "authHeader": "x-goog-api-key"
    },
    {
      "id": "openai",
      "name": "OpenAI",
      "baseUrl": "https://api.openai.com",
      "authType": "header",
      "authHeader": "Authorization"
    }
  ]
}
```

---

### 2.3 BYOK Proxy Pass-Through

**`ALL /api/proxy/{providerId}/*`**

Transparently forwards all requests to the target LLM provider. The client sends the user's own API key; the server **never stores** it.

#### Request Flow

```
Client Request                    Server                      Provider
     │                              │                            │
     │  POST /api/proxy/gemini/v1/  │                            │
     │  models/gemini-2.5-pro:      │                            │
     │  generateContent             │                            │
     │  Header: x-goog-api-key:     │                            │
     │    {USER_KEY}                │                            │
     │─────────────────────────────▶│                            │
     │                              │  POST /v1/models/          │
     │                              │  gemini-2.5-pro:           │
     │                              │  generateContent           │
     │                              │  Header: x-goog-api-key:   │
     │                              │    {USER_KEY}              │
     │                              │───────────────────────────▶│
     │                              │                            │
     │                              │  200 OK (streaming SSE)    │
     │                              │◀───────────────────────────│
     │  200 OK (streaming SSE)      │                            │
     │◀─────────────────────────────│                            │
     ▼                              ▼                            ▼
```

#### Example: Gemini Chat Completion

```http
POST /api/proxy/gemini/v1beta/models/gemini-2.5-pro:generateContent HTTP/1.1
Host: wazeer.os
Content-Type: application/json
x-goog-api-key: AIzaSyYourOwnKeyHere

{
  "contents": [{
    "parts": [{"text": "مرحباً أمون"}]
  }],
  "systemInstruction": {
    "parts": [{"text": "You are Amoun, the AI assistant of Wazeer OS."}]
  },
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 8192
  }
}
```

#### Example: OpenAI Chat Completion

```http
POST /api/proxy/openai/v1/chat/completions HTTP/1.1
Host: wazeer.os
Content-Type: application/json
Authorization: Bearer sk-your-own-key-here

{
  "model": "gpt-4o",
  "messages": [
    {"role": "system", "content": "You are Amoun."},
    {"role": "user", "content": "Hello Amoun"}
  ],
  "stream": true,
  "temperature": 0.7
}
```

#### Supported HTTP Methods

| Method | Usage |
|--------|-------|
| `GET` | Model listing, retrieval |
| `POST` | Chat completions, embeddings, image generation |
| `PUT` | Fine-tuning jobs (where supported) |
| `DELETE` | File/model deletion (where supported) |
| `PATCH` | Model configuration updates (where supported) |

#### Path Rewriting

The `{providerId}` segment is stripped. Everything after it is appended to the provider's base URL:

```
/api/proxy/gemini/v1beta/models/gemini-2.5-pro:generateContent
                    ↓ strip providerId
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent
```

---

### 2.4 SPA Fallback

All non-`/api/` routes serve `dist/index.html` for client-side routing:

```javascript
// Express SPA fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});
```

---

## 3. Provider Registry — 15 Mounted Providers

| # | Provider ID | Name | Base URL | Auth Header | Auth Type | Special Notes |
|---|------------|------|----------|-------------|-----------|---------------|
| 1 | `nvidia` | NVIDIA NIM | `https://integrate.api.nvidia.com` | `Authorization: Bearer` | Bearer | Custom rate limit: 200 req/min |
| 2 | `gemini` | Google Gemini | `https://generativelanguage.googleapis.com` | `x-goog-api-key` | Raw Key | Supports Grounding (web search) |
| 3 | `claude` | Anthropic Claude | `https://api.anthropic.com` | `x-api-key` | Raw Key | Requires `anthropic-version` header |
| 4 | `glm` | Zhipu GLM | `https://open.bigmodel.cn/api/paas` | `Authorization: Bearer` | Bearer | Chinese AI provider |
| 5 | `deepseek` | DeepSeek | `https://api.deepseek.com` | `Authorization: Bearer` | Bearer | Cost-effective reasoning |
| 6 | `kimi` | Moonshot AI (Kimi) | `https://api.moonshot.cn` | `Authorization: Bearer` | Bearer | Long context (200K) |
| 7 | `minimax` | MiniMax | `https://api.minimax.chat` | `Authorization: Bearer` | Bearer | Multi-modal support |
| 8 | `qwen` | Alibaba Qwen | `https://dashscope.aliyuncs.com/compatible-mode` | `Authorization: Bearer` | Bearer | OpenAI-compatible endpoint |
| 9 | `openrouter` | OpenRouter | `https://openrouter.ai/api` | `Authorization: Bearer` | Bearer | Meta-router for multiple models |
| 10 | `openai` | OpenAI | `https://api.openai.com` | `Authorization: Bearer` | Bearer | GPT-4o, o1, o3 series |
| 11 | `groq` | Groq | `https://api.groq.com` | `Authorization: Bearer` | Bearer | Ultra-fast inference (LPU) |
| 12 | `mistral` | Mistral AI | `https://api.mistral.ai` | `Authorization: Bearer` | Bearer | European AI provider |
| 13 | `xai` | xAI (Grok) | `https://api.x.ai` | `Authorization: Bearer` | Bearer | Elon Musk's AI |
| 14 | `cerebras` | Cerebras | `https://api.cerebras.ai` | `Authorization: Bearer` | Bearer | Wafer-scale chip inference |
| 15 | `ollama` | Ollama (Local) | `http://localhost:11434` | None | None | Local models, no key needed |

### Provider Auth Header Injection Rules

```
┌────────────────────────────────────────────────────────────┐
│                 Auth Header Decision Tree                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Client sends key via header?                              │
│    ├── YES → Extract key, forward to provider              │
│    │         (key NEVER stored/logged)                     │
│    │                                                       │
│    └── NO → Return 401 { error: "missing_api_key" }       │
│                                                            │
│  Provider-specific header mapping:                         │
│    gemini  → x-goog-api-key: {key}                         │
│    claude  → x-api-key: {key} + anthropic-version: 2024-01 │
│    ollama  → No auth header (local)                        │
│    all others → Authorization: Bearer {key}                 │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Claude-Specific Header Pass-Through

Claude requires an additional version header that must be forwarded:

```http
POST /api/proxy/claude/v1/messages HTTP/1.1
x-api-key: sk-ant-your-key
anthropic-version: 2023-06-01
anthropic-dangerous-direct-browser-access: true
Content-Type: application/json
```

---

## 4. Client-Side Service Interfaces

> **Note:** These are internal JavaScript/TypeScript interfaces — they do NOT correspond to HTTP routes. All data flows through `AIGateway.processPrompt()` or direct IndexedDB access.

### 4.1 AIGateway — Central AI Router

The unified intelligence hub that routes prompts to configured providers.

```typescript
interface AIGateway {
  /**
   * Process a user prompt through the configured LLM provider.
   * Streams response chunks via callback.
   */
  processPrompt(params: ProcessPromptParams): Promise<AIResponse>;

  /**
   * Abort an in-flight streaming request.
   */
  abortRequest(requestId: string): void;

  /**
   * Get the list of available models for a provider.
   */
  listModels(providerId: string): Promise<ModelInfo[]>;
}

interface ProcessPromptParams {
  prompt: string;                    // User's message text
  systemPrompt?: string;             // System instruction (Amoun's personality + injected memories)
  providerId: string;                // e.g. 'gemini', 'openai'
  modelId: string;                   // e.g. 'gemini-2.5-pro', 'gpt-4o'
  apiKey: string;                    // User's BYOK key (from IndexedDB, never sent to our server body)
  chatHistory?: Message[];           // Conversation context
  temperature?: number;              // 0.0 - 2.0 (default: 0.7)
  maxTokens?: number;                // Max output tokens
  enableSearch?: boolean;            // Enable Gemini Grounding (web search)
  tools?: ToolDefinition[];          // Function calling tools
  onChunk?: (chunk: string) => void; // Streaming callback
  signal?: AbortSignal;              // Cancellation signal
}

interface AIResponse {
  id: string;                        // Unique response ID
  text: string;                      // Full assembled text
  providerId: string;                // Which provider was used
  modelId: string;                   // Which model was used
  usage?: {                          // Token usage (if reported)
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  searchResults?: SearchResult[];    // Grounding citations (Gemini only)
  toolCalls?: ToolCallResult[];      // Function call results
  timestamp: string;                 // ISO 8601
  duration: number;                  // Response time in ms
}
```

### 4.2 AuthService — Authentication

```typescript
interface AuthService {
  /** Register a new user with email/password (SHA-256 hashed client-side) */
  registerUser(email: string, password: string, displayName: string): Promise<AuthResult>;

  /** Login with email/password */
  loginUser(email: string, password: string): Promise<AuthResult>;

  /** Login via OAuth provider (Google, GitHub) */
  loginOAuth(provider: 'google' | 'github'): Promise<AuthResult>;

  /** Silent re-authentication on app relaunch (from IndexedDB session) */
  silentReAuth(): Promise<AuthResult | null>;

  /** Logout and clear all session data */
  logoutUser(): Promise<void>;

  /** Get current authenticated user */
  getCurrentUser(): WazirUser | null;
}

interface AuthResult {
  success: boolean;
  user?: WazirUser;
  error?: string;
  isNewUser?: boolean;
}

interface WazirUser {
  uid: string;                       // Firebase UID
  email: string;
  displayName: string;
  photoURL?: string;
  provider: 'email' | 'google' | 'github';
  createdAt: string;                 // ISO 8601
  lastLogin: string;                 // ISO 8601
}
```

### 4.3 LearningEngine — Intelligence Extraction

```typescript
interface LearningEngine {
  /** Extract actionable tasks from AI response text */
  extractTasks(text: string, sessionId: string): Promise<Task[]>;

  /** Extract memorable facts/preferences from conversation */
  extractMemories(text: string, sessionId: string): Promise<Memory[]>;
}

interface Task {
  id: string;                        // UUID
  title: string;                     // Task description
  source: 'ai_suggestion' | 'user_explicit' | 'system_generated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: string;                  // ISO 8601
  tags: string[];
  sessionId: string;                 // Originating chat session
  createdAt: string;
  updatedAt: string;
}

interface Memory {
  id: string;                        // Auto-increment from store
  content: string;                   // The fact/preference
  category: 'preference' | 'fact' | 'instruction' | 'context';
  sourceSession: string;             // Chat session ID where learned
  createdAt: string;
  confidence: number;                // 0.0 - 1.0
}
```

### 4.4 MemoryEngine — Contextual Memory

```typescript
interface MemoryEngine {
  /** Retrieve memories relevant to the current prompt */
  getRelevantMemories(prompt: string, limit?: number): Promise<Memory[]>;

  /** Inject relevant memories into the system prompt */
  injectMemories(systemPrompt: string, memories: Memory[]): string;

  /** Store a new memory */
  storeMemory(memory: Omit<Memory, 'id' | 'createdAt'>): Promise<number>;

  /** Delete a memory by ID */
  deleteMemory(memoryId: number): Promise<void>;
}
```

### 4.5 TaskScheduler — Automated Execution

```typescript
interface TaskScheduler {
  /** Check for due tasks and execute AI-driven actions */
  checkAndExecute(): Promise<SchedulerResult>;

  /** Start the scheduler interval (every 5 minutes) */
  start(): void;

  /** Stop the scheduler */
  stop(): void;
}

interface SchedulerResult {
  checked: number;                   // Total tasks checked
  executed: number;                  // Tasks acted upon
  skipped: number;                   // Tasks not yet due
  errors: number;                    // Execution failures
  timestamp: string;
}
```

### 4.6 HorusGuard — AST Security Scanner

```typescript
interface HorusGuard {
  /** Scan code string for security threats using AST analysis */
  scanCode(code: string, options?: ScanOptions): ScanResult;
}

interface ScanOptions {
  language?: 'javascript' | 'typescript' | 'python';
  strict?: boolean;                  // Treat MEDIUM as HIGH
  allowNetwork?: boolean;            // Permit fetch/XHR
  allowDOM?: boolean;                // Permit DOM access
}

interface ScanResult {
  safe: boolean;                     // true = no threats found
  severity: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  findings: Finding[];               // Individual threat detections
  scanTime: number;                  // Parse + analyze time in ms
}

interface Finding {
  type: string;                      // e.g. 'eval_usage', 'prototype_pollution'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  line: number;
  column: number;
  node: string;                      // AST node type
  description: string;               // Human-readable explanation
  recommendation: string;            // How to fix
}
```

### 4.7 ToolRegistry — Function Calling Dispatcher

```typescript
interface ToolRegistry {
  /** Execute a tool call from AI function calling */
  executeToolCall(call: ToolCall): Promise<ToolResult>;

  /** Register a new tool definition */
  registerTool(tool: ToolDefinition): void;

  /** List all available tools */
  listTools(): ToolDefinition[];
}

interface ToolCall {
  id: string;                        // Tool call ID from LLM
  name: string;                      // Function name
  arguments: Record<string, unknown>; // Parsed arguments
}

interface ToolResult {
  toolCallId: string;
  result: unknown;                   // Tool output (serialized to JSON for LLM)
  error?: string;
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: JSONSchema;            // JSON Schema for arguments
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}
```

---

## 5. Error Response Format

All errors (server and client) follow a unified, sanitized JSON format. **No stack traces, no internal paths, no server details are ever leaked.**

```typescript
interface ErrorResponseBody {
  error: {
    code: string;                    // Machine-readable error code
    message: string;                 // User-friendly message
    status: number;                  // HTTP status code
    details?: Record<string, unknown>; // Optional extra context
    requestId?: string;              // For correlation (if logged client-side)
  };
}
```

### Error Code Catalog

| HTTP Status | Error Code | Description | Rewritten From |
|-------------|-----------|-------------|----------------|
| `401` | `AUTH_REQUIRED` | API key missing from request | Provider's 401 |
| `401` | `AUTH_INVALID` | API key is invalid or expired | Provider's 401 |
| `403` | `PROVIDER_FORBIDDEN` | Key lacks permission for this model | Provider's 403 |
| `403` | `CONTENT_BLOCKED` | Provider blocked the content | Provider's 403 |
| `429` | `RATE_LIMIT_PROXY` | Wazeer proxy rate limit exceeded | Our rate limiter |
| `429` | `RATE_LIMIT_PROVIDER` | Upstream provider rate limit hit | Provider's 429 |
| `429` | `RATE_LIMIT_NVIDIA` | NVIDIA-specific 200 req/min exceeded | NVIDIA's 429 |
| `413` | `PAYLOAD_TOO_LARGE` | Request body exceeds 5MB | Our body parser |
| `404` | `PROVIDER_NOT_FOUND` | Unknown provider ID | Our router |
| `405` | `METHOD_NOT_ALLOWED` | HTTP method not supported | Our router |
| `500` | `PROXY_ERROR` | Upstream provider returned 5xx | Provider's 5xx |
| `502` | `UPSTREAM_TIMEOUT` | Provider did not respond in 120s | Our timeout |
| `503` | `SERVICE_UNAVAILABLE` | Server is shutting down or unhealthy | Our health check |

### Example Error Responses

```json
// Missing API key
{
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "API key is required. Please configure your provider key in settings.",
    "status": 401
  }
}

// Rate limited by Wazeer proxy
{
  "error": {
    "code": "RATE_LIMIT_PROXY",
    "message": "Rate limit exceeded. Maximum 100 requests per minute.",
    "status": 429,
    "details": {
      "limit": 100,
      "window": "60s",
      "retryAfter": 45
    }
  }
}

// Upstream provider error (sanitized)
{
  "error": {
    "code": "PROXY_ERROR",
    "message": "The AI provider returned an error. Please try again.",
    "status": 500,
    "details": {
      "provider": "openai",
      "originalStatus": 500
    }
  }
}
```

---

## 6. Rate Limiting Rules

Rate limiting operates at **two levels**: Wazeer proxy (our infrastructure protection) and upstream providers (their limits).

### 6.1 Wazeer Proxy Rate Limits

| Scope | Limit | Window | Strategy |
|-------|-------|--------|----------|
| Global (per IP) | 100 requests | 60 seconds | Sliding window, `X-RateLimit-*` headers |
| NVIDIA provider | 200 requests | 60 seconds | Provider-specific override |
| Request body | 5 MB | Per request | Hard reject with 413 |
| Upstream timeout | 120 seconds | Per request | Abort with 502 |

### 6.2 Rate Limit Response Headers

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 1720867200
```

### 6.3 Upstream Provider Limits (Reference)

| Provider | Known Limits | Notes |
|----------|-------------|-------|
| OpenAI | Tier-dependent (RPM/TPM) | Free: 3 RPM, Tier 1: 500 RPM |
| Gemini | 15 RPM (free), 1000+ (paid) | Per project quota |
| Claude | 40 RPM (Tier 1), 1000 (Tier 3) | Per API key |
| Groq | 30 RPM (free), varies (paid) | Very fast, strict limits |
| NVIDIA | 200 RPM | Enforced at proxy level |

> **Note:** Wazeer OS does not enforce upstream limits — users are responsible for their own API key quotas. We only protect our proxy infrastructure.

---

## 7. Security Headers

All responses from the Express proxy include the following security headers, configured via Helmet and custom middleware:

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | See CSP Details below | Prevents XSS, data injection |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS for 1 year |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `X-XSS-Protection` | `0` | Disabled (CSP is superior) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(self), geolocation=()` | Restricts browser features |
| `Cross-Origin-Embedder-Policy` | `require-corp` | Isolates cross-origin resources |
| `Cross-Origin-Opener-Policy` | `same-origin` | Enables `SharedArrayBuffer` protection |
| `Cross-Origin-Resource-Policy` | `same-origin` | Restricts cross-origin resource sharing |

### Content Security Policy (CSP) — Detailed

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://*.googleusercontent.com;
  connect-src 'self' https://*.googleapis.com https://api.openai.com
              https://api.anthropic.com https://integrate.api.nvidia.com
              https://open.bigmodel.cn https://api.deepseek.com
              https://api.moonshot.cn https://api.minimax.chat
              https://dashscope.aliyuncs.com https://openrouter.ai
              https://api.groq.com https://api.mistral.ai
              https://api.x.ai https://api.cerebras.ai
              https://www.googleapis.com https://securetoken.google.com
              https://identitytoolkit.googleapis.com
              https://firestore.googleapis.com https://localhost:11434;
  frame-src 'self' https://accounts.google.com;
  worker-src 'self' blob:;
  child-src 'self' blob:;
```

### COEP/COOP/CORP Isolation Model

```
┌─────────────────────────────────────────────┐
│           Cross-Origin Isolation            │
├─────────────────────────────────────────────┤
│                                             │
│  COEP: require-corp                         │
│  ├── All cross-origin resources must opt-in │
│  ├── OR use crossorigin="anonymous"         │
│  └── Protects against Spectre-style attacks │
│                                             │
│  COOP: same-origin                          │
│  ├── Isolates window.opener access          │
│  └── Enables SharedArrayBuffer safely       │
│                                             │
│  CORP: same-origin                          │
│  ├── Blocks cross-origin resource loading   │
│  └── Complements COEP enforcement           │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 8. WebSocket & Streaming Protocol

Wazeer OS uses **Server-Sent Events (SSE)** streaming via the BYOK proxy. The proxy does not terminate or interpret the stream — it passes chunks through transparently.

### SSE Stream Format (OpenAI-compatible)

```
data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1720867200,"choices":[{"index":0,"delta":{"role":"assistant","content":"مر"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1720867200,"choices":[{"index":0,"delta":{"content":"حباً"},"finish_reason":null}]}

data: [DONE]
```

### SSE Stream Format (Gemini-compatible)

```
data: {"candidates":[{"content":{"parts":[{"text":"مر"}],"role":"model"},"finishReason":"STOP","index":0}]}
```

### Client-Side Stream Handling

```typescript
// AIGateway internal streaming implementation
async function* streamResponse(response: Response): AsyncGenerator<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        const json = JSON.parse(line.slice(6));
        // Extract text based on provider format
        const text = json.choices?.[0]?.delta?.content
                  || json.candidates?.[0]?.content?.parts?.[0]?.text
                  || '';
        if (text) yield text;
      }
    }
  }
}
```

---

## 9. Authentication Flow

Wazeer OS uses Firebase Auth 12 for identity management. All auth operations happen **client-to-Firebase directly** — the Express proxy is not involved.

```
┌──────────┐         ┌──────────────┐         ┌─────────────┐
│  Client   │         │  Express     │         │  Firebase   │
│  (PWA)    │         │  Proxy       │         │  Auth       │
└────┬─────┘         └──────────────┘         └──────┬──────┘
     │                                              │
     │  1. registerUser(email, password)            │
     │─────────────────────────────────────────────▶│
     │                                              │
     │  2. createUserWithEmailAndPassword()          │
     │◀─────────────────────────────────────────────│
     │                                              │
     │  3. Store WazirUser in IndexedDB             │
     │  (uid, email, displayName, provider)         │
     │                                              │
     │  4. Log auth_logs to IndexedDB               │
     │                                              │
     │  5. Navigate to dashboard                    │
     │                                              │
     │  === On App Relaunch ===                     │
     │                                              │
     │  6. silentReAuth()                           │
     │─────────────────────────────────────────────▶│
     │                                              │
     │  7. onAuthStateChanged(user)                 │
     │◀─────────────────────────────────────────────│
     │                                              │
     │  8. Restore session from IndexedDB           │
     │                                              │
     ▼                                              ▼
```

### Password Handling

```
User enters password
       │
       ▼
SHA-256 hash (client-side, Web Crypto API)
       │
       ▼
Send hash to Firebase Auth
       │
       ▼
Firebase stores hash (their responsibility)
       │
       ▼
Express proxy NEVER sees the password or hash
```

> **Security Note:** See ADR-009 for the full rationale behind SHA-256 instead of bcrypt. The key insight: passwords are hashed client-side and sent to Firebase — there is no server-side password storage, making bcrypt unnecessary.

---

## Appendix A: Full Request/Response Cycle

```
1. User types message in chat
      │
2. Client reads API key from IndexedDB (config store)
      │
3. AIGateway.processPrompt() called
      │
4. MemoryEngine.getRelevantMemories(prompt) → inject into system prompt
      │
5. HorusGuard.scanCode(prompt) → check for injection (if code detected)
      │
6. Client constructs provider-specific request body
      │
7. Client sends POST /api/proxy/{providerId}/... with user's API key
      │
8. Express proxy validates rate limit → forwards to provider
      │
9. Provider processes → streams response back through proxy
      │
10. Client receives SSE chunks → renders in real-time
      │
11. LearningEngine.extractTasks(response) → store in IndexedDB
      │
12. LearningEngine.extractMemories(response) → store in IndexedDB
      │
13. Full conversation saved to IndexedDB (artifacts store)
      │
14. Token usage logged to IndexedDB (logs store)
```

---

*𓂀 Wazeer OS v2.0.0-Rewrite — API Specification — 100MillionDEV / العرآب*
