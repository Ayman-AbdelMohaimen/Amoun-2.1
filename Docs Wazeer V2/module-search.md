# 𓂀 Search Module — Technical Reference

> **Module ID:** `search`
> **Owner:** AI Features
> **Status:** Transitioning (Mocked → Real in v2.0)
> **Security Level:** Medium

---

## Table of Contents

1. [Module Overview](#module-overview)
2. [Current State (v0.x): Mocked Implementation](#current-state-v0x-mocked-implementation)
3. [v2.0 Target: Gemini Google Search Grounding](#v20-target-gemini-google-search-grounding)
4. [Gemini Grounding Integration](#gemini-grounding-integration)
5. [Tool Declaration Format](#tool-declaration-format)
6. [Fallback Strategy for Non-Gemini Models](#fallback-strategy-for-non-gemini-models)
7. [Search Result Format and Injection](#search-result-format-and-injection)
8. [Privacy Considerations](#privacy-considerations)

---

## Module Overview

The Search module provides web search capabilities to the AI agent Amoun. In v0.x, this was a mocked implementation returning fake results. In v2.0, it transitions to real web search using Gemini's built-in Google Search grounding capability.

### Evolution

| Version | Implementation | Provider Support | Real Results |
|---------|---------------|-----------------|-------------|
| v0.x | Mocked (setTimeout + fake data) | All providers (fake) | ❌ No |
| v2.0 | Gemini grounding | Gemini only | ✅ Yes |
| v2.0 | Graceful degradation | Non-Gemini | ❌ Unavailable |

### Design Philosophy

- **Provider-native search:** Use the provider's own search capability (Gemini grounding) rather than implementing a separate search API.
- **Graceful degradation:** Non-Gemini models simply don't have search available — no error, no mock, just silent unavailability.
- **No separate search API key:** Search is a Gemini model capability, not a separate service.

---

## Current State (v0.x): Mocked Implementation

### What Exists

```typescript
// client/src/services/searchService.ts (v0.x — TO BE REPLACED)

/**
 * Mocked search function — returns fake results after 1 second delay.
 * DEPRECATED: Will be replaced by Gemini grounding in v2.0.
 */
async function searchWeb(query: string): Promise<SearchResult[]> {
  // Simulated delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return [
    {
      title: `Search result for: ${query}`,
      url: 'https://example.com',
      snippet: 'This is a mocked search result. In v2.0, this will be replaced with real Google Search results via Gemini grounding.',
    },
    {
      title: `Another result for: ${query}`,
      url: 'https://example.org',
      snippet: 'Mocked search result #2. The search module is being rewritten.',
    },
  ];
}
```

### Why It Was Mocked

1. **No separate search API:** Wazeer OS doesn't have a Serper/Bing Search API key.
2. **BYOK model:** Users provide their own Gemini API key, which includes grounding access.
3. **Time constraint:** The mocked version allowed tool calling integration to be tested.

### What Must Be Removed

- The `searchWeb` mock function in `searchService.ts`
- The fake `SearchResult` type with hardcoded URLs
- The `setTimeout` delay simulation
- Any references to the mock in test files

---

## v2.0 Target: Gemini Google Search Grounding

### Architecture

Instead of implementing search as a separate tool that returns results for the AI to read, v2.0 uses Gemini's **native grounding** capability. This means:

1. The AI model itself decides when to search.
2. The model accesses Google Search internally during generation.
3. Search results are returned as part of the model's response with grounding metadata.
4. The UI displays grounding sources (links, titles) below the response.

### How Gemini Grounding Works

```
User asks: "What is the latest version of React?"
    │
    ▼
Gemini model (with google_search_retrieval tool enabled)
    │
    ├──► Model decides it needs current information
    │
    ├──► Model internally queries Google Search
    │
    ├──► Model generates response based on search results
    │
    └──► Response includes grounding metadata:
        {
          candidates: [{
            content: { parts: [{ text: "React 19 was released..." }] },
            groundingMetadata: {
              groundingChunks: [
                { web: { uri: "https://react.dev/blog/...", title: "React 19" } },
                { web: { uri: "https://github.com/facebook/react/...", title: "GitHub" } },
              ],
              groundingSupports: [
                {
                  segment: { startIndex: 0, endIndex: 42 },
                  groundingChunkIndices: [0],
                  confidenceScores: [0.95],
                },
              ],
              searchEntryPoint: {
                renderedContent: "React 19..."
              },
            }
          }]
        }
```

---

## Gemini Grounding Integration

### Model Configuration

```typescript
// In AIGateway, when using Gemini with search enabled:
const model = genAI.getGenerativeModel({
  model: modelId,
  systemInstruction: buildSystemPrompt(options.mode),
  tools: [{ googleSearchRetrieval: {} }],
  // OR combined with function calling:
  tools: [
    { googleSearchRetrieval: {} },
    ...FUNCTION_TOOL_DECLARATIONS,
  ],
});
```

### Grounding Metadata Extraction

```typescript
interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

interface GroundingSupport {
  segment: {
    startIndex: number;
    endIndex: number;
  };
  groundingChunkIndices: number[];
  confidenceScores: number[];
}

interface GroundingMetadata {
  groundingChunks: GroundingChunk[];
  groundingSupports: GroundingSupport[];
  searchEntryPoint?: {
    renderedContent: string;
  };
}

function extractGroundingMetadata(
  response: GenerateContentResult
): GroundingMetadata | null {
  const candidate = response.response.candidates?.[0];
  return candidate?.groundingMetadata ?? null;
}
```

### UI Rendering of Grounding Sources

```typescript
// In MessageBubble component:
function GroundingSources({ metadata }: { metadata: GroundingMetadata }) {
  return (
    <div className="mt-3 border-t border-[#1a1a2e] pt-2">
      <span className="text-xs text-[#888]">
        𓂀 Sources:
      </span>
      <div className="flex flex-wrap gap-2 mt-1">
        {metadata.groundingChunks.map((chunk, i) => (
          chunk.web && (
            <a
              key={i}
              href={chunk.web.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#00ff88] hover:underline flex items-center gap-1"
            >
              <ExternalLink size={12} />
              {chunk.web.title}
            </a>
          )
        ))}
      </div>
    </div>
  );
}
```

---

## Tool Declaration Format

### v0.x: search_web Tool (Mocked)

```typescript
// In toolRegistry.ts (v0.x — TO BE REMOVED)
const searchWebTool = {
  name: 'search_web',
  description: 'Search the web for current information.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
    },
    required: ['query'],
  },
};
```

### v2.0: Google Search Grounding Tool

In v2.0, `search_web` is **removed** from `toolRegistry.ts`. Instead, grounding is enabled at the model configuration level:

```typescript
// No function declaration needed — it's a model-level tool
const tools = [
  { googleSearchRetrieval: {} },
  // Function calling tools remain:
  { functionDeclarations: [writeFileTool, readFileTool, listDirTool, runCommandTool] },
];
```

### Key Difference

| Aspect | v0.x (Mocked) | v2.0 (Grounding) |
|--------|--------------|-------------------|
| Declaration | Function tool in toolRegistry | Model-level googleSearchRetrieval |
| Execution | Custom handler → mock data | Gemini internal → real Google Search |
| Result format | Structured JSON | Grounding metadata on response |
| Provider support | All (mocked) | Gemini only |
| User sees | AI reads mock results | AI has real context + source links |

---

## Fallback Strategy for Non-Gemini Models

### The Problem

Claude, GLM, NVIDIA, OpenRouter, and custom providers do **not** have Google Search grounding. When Amoun uses one of these models, search is unavailable.

### The Solution: Graceful Degradation

```typescript
function shouldEnableSearch(providerId: string): boolean {
  return providerId === 'gemini';
}

// In AIGateway.processPrompt():
const tools = [];
if (shouldEnableSearch(provider.id)) {
  tools.push({ googleSearchRetrieval: {} });
}
if (provider.supportsTools) {
  tools.push({ functionDeclarations: FUNCTION_TOOL_DECLARATIONS });
}
```

### User Experience

| Model | Search Available | User Sees |
|-------|-----------------|-----------|
| Gemini (any) | ✅ Yes | Grounding sources below response |
| Claude | ❌ No | No search indicator — feature silently unavailable |
| GLM | ❌ No | Same as above |
| NVIDIA | ❌ No | Same as above |
| Others | ❌ No | Same as above |

### System Prompt Adjustment

When using a non-Gemini model, the system prompt does **not** mention search capabilities:

```typescript
function buildSystemPrompt(mode: ChatMode, providerId: string): string {
  const base = getBaseSystemPrompt();
  const modePrefix = getModePrefix(mode);
  const searchNote = shouldEnableSearch(providerId)
    ? '\nYou have access to Google Search for current information.'
    : '';
  return `${base}${modePrefix}${searchNote}`;
}
```

This ensures the AI doesn't claim it can search when it can't.

---

## Search Result Format and Injection

### Grounding-Aware Message Rendering

When an AI response includes grounding metadata, the message is rendered with source links:

```
┌─────────────────────────────────────────────────┐
│ React 19 was released on December 5, 2024. It   │
│ includes new features like Actions, Server       │
│ Components as standard, and the new compiler.    │
│                                                  │
│ 𓂀 Sources:                                      │
│ ┌──────────────────┐ ┌──────────────────┐        │
│ │🔗 React 19 Blog  │ │🔗 GitHub Release  │       │
│ └──────────────────┘ └──────────────────┘        │
└─────────────────────────────────────────────────┘
```

### Message Data Structure with Grounding

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  // v2.0 addition:
  groundingMetadata?: GroundingMetadata;
}
```

### Storage

Grounding metadata is stored as part of the `ChatMessage` in IndexedDB. This allows historical messages to display their sources when viewed later.

---

## Privacy Considerations

### What Gets Sent to Google

When Gemini grounding is active:
- The user's prompt is sent to Google's Gemini API (as always).
- Gemini **internally** queries Google Search — the user's prompt becomes a search query.
- Search results are processed by Gemini, not by Wazeer OS directly.

### What Wazeer OS Stores

- The AI's response text (as always).
- Grounding source URLs and titles (for display).
- Confidence scores (for potential future use in source ranking).
- **NOT stored:** Full search result snippets, user search queries separately.

### User Control

- User can disable search by switching to a non-Gemini model.
- Future: Per-conversation toggle for grounding enable/disable.
- All data is on-device — no Wazeer OS server ever sees queries or results.

### Transparent Disclosure

The system prompt should inform the user:
```
When using Gemini models, Amoun may use Google Search to provide
up-to-date information. Search queries derived from your messages
are sent to Google. Source links are displayed below responses.
```

---

## Migration Checklist (v0.x → v2.0)

- [ ] Remove `searchWeb` mock function from `searchService.ts`
- [ ] Remove `search_web` from `toolRegistry.ts` function declarations
- [ ] Add `googleSearchRetrieval: {}` to Gemini model tools configuration
- [ ] Add `GroundingMetadata` type to `chat.ts` types
- [ ] Add `groundingMetadata` field to `ChatMessage` interface
- [ ] Implement `extractGroundingMetadata()` in `AIGateway`
- [ ] Create `GroundingSources` component for `MessageBubble`
- [ ] Update `buildSystemPrompt()` with search availability note
- [ ] Add `shouldEnableSearch()` provider check
- [ ] Store grounding metadata in IndexedDB with messages
- [ ] Test: verify grounding works with Gemini Pro/Flash
- [ ] Test: verify non-Gemini models work without errors
- [ ] Remove any test files referencing the mock

---

> صُنع بـ ❤️ بواسطة العرآب | حقوق النشر 100MillionDEV.com
>
> 𓂀 Wazeer OS — Egyptian Cyberpunk AI Assistant