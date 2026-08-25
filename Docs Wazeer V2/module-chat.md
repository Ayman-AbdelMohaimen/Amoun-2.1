# 𓂀 Chat Module — Technical Reference

> **Module ID:** `chat`
> **Owner:** Core Features
> **Status:** Active
> **Complexity:** High — routes to 7 providers, streaming, tools, voice, artifacts

---

## Table of Contents

1. [Module Overview](#module-overview)
2. [Chat Flow: End-to-End](#chat-flow-end-to-end)
3. [Provider Routing Logic](#provider-routing-logic)
4. [Streaming Implementation](#streaming-implementation)
5. [Tool Calling Flow (ReAct Loop)](#tool-calling-flow-react-loop)
6. [File Attachment Handling](#file-attachment-handling)
7. [Voice I/O Integration](#voice-io-integration)
8. [Summarization Flow](#summarization-flow)
9. [Artifact Extraction Pipeline](#artifact-extraction-pipeline)
10. [Error Handling Per Provider](#error-handling-per-provider)

---

## Module Overview

The Chat module is the primary interaction surface between the user and the AI agent Amoun (أمون). It handles message routing, multi-provider support, streaming responses, tool execution, file attachments, voice input/output, conversation summarization, and artifact extraction.

### Key Responsibilities

| Responsibility | Owner |
|----------------|-------|
| Message routing to 7 LLM providers | `AIGateway` |
| Streaming responses to UI | `AIGateway` + `workspaceStore` |
| Tool calling (Gemini ReAct loop) | `AIGateway` |
| File attachment processing | `ChatInput` → `AIGateway` |
| Voice recognition and synthesis | `ChatInput` (Web Speech API) |
| Chat session management | `workspaceStore` |
| Artifact extraction and storage | `AIGateway` → IndexedDB |
| Conversation summarization | `SummaryModal` → `AIGateway` |
| Chat mode system prompts | `AIGateway` |

---

## Chat Flow: End-to-End

```
User types message in ChatInput
    │
    ▼
ChatInput.handleSend()
    │
    ├──► Create user Message object { id, role:'user', content, timestamp, attachments? }
    │
    ├──► Add to workspaceStore.messages
    │
    ├──► If has attachments → processFileAttachments(attachments)
    │       ├── Image → base64 encode → VLM content part
    │       ├── .docx → mammoth.js → plain text → content part
    │       └── Text file → base64 decode → content part
    │
    ├──► Set workspaceStore.isGenerating = true
    │
    ├──► Update Amoun agent status: currentTask = 'Responding to user'
    │
    ▼
AIGateway.processPrompt(prompt, sessionId, options)
    │
    ├──► 1. Build system prompt
    │       ├── Base system prompt (Amoun persona)
    │       ├── Chat mode prefix (general/coding/brainstorm/files)
    │       └── Relevant memories injected (from MemoryEngine)
    │
    ├──► 2. Build message history
    │       ├── Load last N messages from workspaceStore
    │       └── Append current user message
    │
    ├──► 3. Determine provider + model
    │       ├── Read workspaceStore.activeModel
    │       ├── Match to provider registry
    │       └── Get API key from env or user config
    │
    ├──► 4. Route to provider
    │       ├── Gemini → SDK streaming (native)
    │       ├── Claude → JSON request/response
    │       └── Others → SSE via Express proxy
    │
    ├──► 5. Stream response to UI
    │       ├── Create assistant Message (empty initially)
    │       ├── Append chunks to message.content
    │       └── workspaceStore.updateMessage(id, content)
    │
    ├──► 6. Tool calling (Gemini only, if tools are declared)
    │       ├── Parse tool_use response
    │       ├── Execute tool function
    │       ├── Send tool result back to LLM
    │       └── Loop (max 3 iterations)
    │
    ├──► 7. Post-processing (after full response received)
    │       ├── extractArtifacts(fullResponse) → save to IndexedDB
    │       ├── extractTasks(aiMessage, context) → add to workspaceStore.tasks
    │       ├── extractMemories(messages, sessionId) → save to memory store
    │       └── Update swarmStore Amoun metrics
    │
    └──► 8. Cleanup
            ├── workspaceStore.isGenerating = false
            ├── Amoun agent: tasksCompleted++, lastActivity = now
            └── Scroll to bottom of chat
```

---

## Provider Routing Logic

### Supported Providers

| Provider ID | Name | Routing Method | Streaming | Tool Calling |
|-------------|------|---------------|-----------|-------------|
| `gemini` | Google Gemini | Native SDK | ✅ Yes (native) | ✅ Yes (ReAct) |
| `claude` | Anthropic Claude | Direct API | ❌ JSON only | ❌ No |
| `glm` | Zhipu GLM | Express proxy | ✅ SSE | ❌ No |
| `nvidia` | NVIDIA NIM | Express proxy | ✅ SSE | ❌ No |
| `openRouter` | OpenRouter | Express proxy | ✅ SSE | ❌ No |
| `openCode` | OpenCode | Express proxy | ✅ SSE | ❌ No |
| `custom` | Custom Provider | Express proxy | ✅ SSE | ❌ No |

### Routing Algorithm

```typescript
async function routeToProvider(
  modelId: string,
  messages: ChatMessage[],
  options: ProcessOptions
): Promise<void> {
  const provider = resolveProvider(modelId);
  const apiKey = getApiKey(provider.id);

  switch (provider.id) {
    case 'gemini':
      return streamViaGeminiSDK(modelId, messages, apiKey, options);
    case 'claude':
      return fetchViaClaudeAPI(modelId, messages, apiKey, options);
    default:
      return streamViaProxy(provider.id, modelId, messages, apiKey, options);
  }
}
```

### Provider Config Structure

```typescript
interface ProviderConfig {
  id: string;                  // 'gemini', 'claude', etc.
  name: string;                // Display name
  baseUrl: string;             // API base URL
  streamPath: string;          // Path for chat completions
  authHeader: string;          // 'Authorization', 'x-api-key', etc.
  authPrefix: string;          // 'Bearer ', 'API-KEY ', etc.
  supportsStreaming: boolean;
  supportsTools: boolean;      // Only Gemini: true
  maxTokens: number;
  models: string[];            // Available model IDs
}
```

---

## Streaming Implementation

### Gemini SDK Streaming (Native)

```typescript
async function streamViaGeminiSDK(
  modelId: string,
  messages: ChatMessage[],
  apiKey: string,
  options: ProcessOptions
): Promise<void> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: buildSystemPrompt(options.mode),
  });

  const chat = model.startChat({
    history: mapToGeminiHistory(messages),
    tools: options.enableTools ? TOOL_DECLARATIONS : undefined,
  });

  const result = await chat.sendMessageStream(
    buildGeminiContent(messages[messages.length - 1])
  );

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      workspaceStore.appendChunk(text);
    }
  }
}
```

### SSE Streaming (Proxy Providers)

```typescript
async function streamViaProxy(
  providerId: string,
  modelId: string,
  messages: ChatMessage[],
  apiKey: string,
  options: ProcessOptions
): Promise<void> {
  const config = PROVIDER_CONFIG[providerId];
  const response = await fetch(
    `${PROXY_BASE_URL}/api/proxy/${providerId}${config.streamPath}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [config.authHeader]: `${config.authPrefix}${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: mapToOpenAIFormat(messages),
        stream: true,
        max_tokens: config.maxTokens,
      }),
    }
  );

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6);
      if (data === '[DONE]') return;

      const parsed = JSON.parse(data);
      const content = parsed.choices?.[0]?.delta?.content ?? '';
      if (content) {
        workspaceStore.appendChunk(content);
      }
    }
  }
}
```

### Claude JSON (Non-Streaming)

```typescript
async function fetchViaClaudeAPI(
  modelId: string,
  messages: ChatMessage[],
  apiKey: string,
  options: ProcessOptions
): Promise<void> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 8192,
      system: buildSystemPrompt(options.mode),
      messages: mapToClaudeFormat(messages),
    }),
  });

  const data = await response.json();
  const content = data.content?.[0]?.text ?? '';
  workspaceStore.setFullResponse(content);
}
```

---

## Tool Calling Flow (ReAct Loop)

Gemini is the **only provider** with tool calling support. The implementation uses a ReAct (Reasoning + Acting) loop.

### Available Tools

| Tool Name | Description | Parameters | Returns |
|-----------|-------------|------------|---------|
| `write_file` | Write content to a virtual file system | `{ path: string, content: string }` | Success/error message |
| `read_file` | Read file content from virtual FS | `{ path: string }` | File content or error |
| `list_dir` | List directory contents | `{ path: string }` | Directory listing |
| `run_command` | Execute a shell command (sandboxed) | `{ command: string }` | Command output |
| `search_web` | Search the web (Gemini grounding) | `{ query: string }` | Search results |

### ReAct Loop Flow

```
AI response received
    │
    ├──► Contains tool_use? ── NO ──► Return response to user
    │
    └── YES
        │
        ▼
    Parse tool calls from response
        │
        ├──► Validate tool name is in TOOL_DECLARATIONS
        │
        ├──► Execute tool function
        │       └── e.g., writeFile(params.path, params.content)
        │
        ├──► Capture tool result
        │
        ├──► Send tool result back to AI as tool_response message
        │
        ├──► Increment iteration counter
        │
        ├──► iteration >= MAX_TOOL_ITERATIONS (3)?
        │       ├── YES ──► Stop loop, return last AI response
        │       └── NO  ──► Continue loop (AI may call more tools)
        │
        └──► AI responds without tool_use → Return to user
```

### Tool Declaration Format (Gemini)

```typescript
const TOOL_DECLARATIONS = [
  {
    name: 'write_file',
    description: 'Write content to a file in the virtual file system.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to write to' },
        content: { type: 'string', description: 'Content to write' },
      },
      required: ['path', 'content'],
    },
  },
  // ... 4 more tools
];
```

---

## File Attachment Handling

### Supported File Types

| File Type | Extension | Processing | AI Format |
|-----------|-----------|------------|-----------|
| Images | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` | Base64 encode | VLM inline image (Gemini/Claude) |
| Word Docs | `.docx` | `mammoth.js` → plain text | Text content part |
| Text Files | `.txt`, `.md`, `.json`, `.csv`, `.xml`, `.html`, `.css`, `.js`, `.ts`, `.py` | Base64 decode → UTF-8 | Text content part |

### Processing Pipeline

```typescript
async function processFileAttachments(
  files: File[]
): Promise<ContentPart[]> {
  const parts: ContentPart[] = [];

  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

    if (IMAGE_EXTENSIONS.includes(ext)) {
      const base64 = await fileToBase64(file);
      parts.push({
        type: 'image',
        mimeType: file.type,
        data: base64,
      });
    } else if (ext === 'docx') {
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      parts.push({
        type: 'text',
        text: `📄 ${file.name}\n${result.value}`,
      });
    } else {
      const text = await file.text();
      parts.push({
        type: 'text',
        text: `📄 ${file.name}\n${text}`,
      });
    }
  }

  return parts;
}
```

### Size Limits

- Images: Max 20MB (base64 bloat ~33%)
- Documents: Max 10MB raw
- Text files: Max 1MB raw
- Total attachments per message: Max 5 files

---

## Voice I/O Integration

### Speech Recognition (Input)

```typescript
// Uses Web Speech API (SpeechRecognition)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

recognition.lang = isArabic ? 'ar-EG' : 'en-US';
recognition.interimResults = true;
recognition.continuous = false;

recognition.onresult = (event: SpeechRecognitionEvent) => {
  const transcript = Array.from(event.results)
    .map(result => result[0].transcript)
    .join('');
  setVoiceTranscript(transcript);
};
```

### Speech Synthesis (Output)

```typescript
// Uses Web Speech API (SpeechSynthesis)
function speakResponse(text: string, lang: 'ar' | 'en', gender: 'male' | 'female') {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'ar' ? 'ar-EG' : 'en-US';

  // Select voice matching gender preference
  const voices = speechSynthesis.getVoices();
  const targetVoice = voices.find(v => {
    const matchesLang = v.lang.startsWith(lang);
    const matchesGender = gender === 'male'
      ? v.name.toLowerCase().includes('male')
      : v.name.toLowerCase().includes('female');
    return matchesLang && matchesGender;
  });

  if (targetVoice) utterance.voice = targetVoice;
  speechSynthesis.speak(utterance);
}
```

### Gender-Aware Voice Selection

- Configured in `UserPreferences.voiceGender` (default: `'male'`).
- Tries to find a matching system voice for the selected language and gender.
- Falls back to any available voice for the language.
- Falls back to default system voice if no match.

---

## Summarization Flow

Triggered from `SummaryModal` component.

```
User clicks "Summarize" button
    │
    ▼
SummaryModal
    │
    ├──► Get last 30 messages from current session
    │
    ├──► Build summarization prompt:
    │   "Summarize the following conversation into structured Markdown:
    │    - Key topics discussed
    │    - Decisions made
    │    - Action items identified
    │    - Code snippets produced"
    │
    ├──► Send to AIGateway (uses active model)
    │
    ├──► Stream response to SummaryModal
    │
    └──► Display formatted Markdown summary
```

---

## Artifact Extraction Pipeline

Triggered automatically after every AI response.

### Extraction Logic

```typescript
function extractArtifacts(responseContent: string, sessionId: string): Artifact[] {
  const CODE_BLOCK_REGEX = /```(\w+)\n([\s\S]*?)```/g;
  const artifacts: Artifact[] = [];
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = CODE_BLOCK_REGEX.exec(responseContent)) !== null) {
    const language = match[1];
    const code = match[2].trim();

    // Skip trivial blocks (too short or common formatting)
    if (code.length < 20) continue;
    if (['text', 'markdown'].includes(language)) continue;

    const artifact: Artifact = {
      id: crypto.randomUUID(),
      sessionId,
      language,
      filename: generateFilename(language, index),
      code,
      createdAt: Date.now(),
      messageId: '', // Set by caller
    };

    artifacts.push(artifact);
    index++;
  }

  return artifacts;
}

function generateFilename(language: string, index: number): string {
  const extensions: Record<string, string> = {
    javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts',
    python: 'py', py: 'py', html: 'html', css: 'css',
    json: 'json', sql: 'sql', bash: 'sh', sh: 'sh',
    rust: 'rs', go: 'go', java: 'java', cpp: 'cpp',
    csharp: 'cs', php: 'php', ruby: 'rb', swift: 'swift',
  };
  const ext = extensions[language] ?? language;
  return `artifact_${index + 1}.${ext}`;
}
```

### Storage

```typescript
// Save to IndexedDB 'wazir-artifacts' store
for (const artifact of artifacts) {
  await set(artifact.id, artifact, artifactsStore);
}
```

### UI Integration

- Extracted artifacts appear as clickable cards below the message.
- Clicking opens the artifact in the `AmounEditor` (Monaco) for preview/edit.
- User can rename, delete, or download artifacts.

---

## Error Handling Per Provider

### Error Categories

| Error Type | Providers Affected | User Message | Recovery |
|------------|-------------------|--------------|----------|
| Network failure | All | "فشل الاتصال بالمزود. تحقق من الإنترنت." | Retry button |
| 401 Unauthorized | All | "مفتاح API غير صالح. تحقق من الإعدادات." | Link to settings |
| 403 Forbidden | All | "تم رفض الوصول. تحقق من صلاحيات المفتاح." | Link to settings |
| 429 Rate Limited | All | "تم تجاوز حد الطلبات. حاول بعد قليل." | Auto-retry after delay |
| 500 Server Error | Proxy, Claude | "خطأ في خادم المزود. حاول لاحقاً." | Retry button |
| Model not found | All | "النموذج غير متاح. اختر نموذجاً آخر." | Model dropdown |
| Context too long | Gemini, Claude | "المحادثة طويلة جداً. أوجز أو ابدأ محادثة جديدة." | Summarize button |
| Content filtered | Gemini | "تم تصفية المحتوى. أعد صياغة الطلب." | User re-types |
| Tool execution error | Gemini | "فشل تنفيذ الأداة: {tool_name}" | Retry or skip |

### Error Rewriting (Express Proxy)

The Express server rewrites provider errors to clean JSON:

```typescript
// server/src/middleware/errorHandler.ts
function rewriteProviderError(error: ProxyError): CleanError {
  const status = error.statusCode;

  if (status === 401 || status === 403) {
    return {
      error: 'AUTH_ERROR',
      message: 'Invalid or expired API key',
      recoverable: false,
    };
  }

  if (status === 429) {
    return {
      error: 'RATE_LIMITED',
      message: 'Rate limit exceeded. Please wait and retry.',
      recoverable: true,
      retryAfter: error.headers?.['retry-after'] ?? '60',
    };
  }

  return {
    error: 'PROVIDER_ERROR',
    message: error.message ?? 'Unknown provider error',
    recoverable: false,
  };
}
```

### Client-Side Error Flow

```
Provider error received
    │
    ├──► Is it a ProviderError?
    │       ├── AUTH_ERROR → Show settings link toast
    │       ├── RATE_LIMITED → Show countdown, enable retry
    │       ├── CONTEXT_TOO_LONG → Show summarize suggestion
    │       ├── CONTENT_FILTERED → Show rephrase suggestion
    │       └── PROVIDER_ERROR → Show generic error + retry
    │
    ├──► Is it a NetworkError?
    │       └── Show offline indicator + retry
    │
    └── Unexpected error
            ├── Log to console.error (DEV only)
            ├── Show generic error toast
            └── Set isGenerating = false
```

---

## Chat Modes

Each mode appends a different system prompt prefix:

| Mode | System Prompt Addition |
|------|----------------------|
| `general` | Default Amoun persona — helpful, bilingual (AR/EN) |
| `coding` | Expert programmer mode — detailed code with explanations |
| `brainstorm` | Creative ideation — expand on ideas, ask probing questions |
| `files` | File analysis mode — focused on understanding and modifying attached files |

---
> صُنع بـ ❤️ بواسطة العرآب | حقوق النشر 100MillionDEV.com
>
> 𓂀 Wazeer OS — Egyptian Cyberpunk AI Assistant