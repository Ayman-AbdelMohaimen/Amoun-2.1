# 𓂀 Contributing to Wazeer OS (وزير OS) v2.0.0-Rewrite

> **Egyptian Cyberpunk meets Enterprise AI.** Thank you for your interest in contributing to Wazeer OS.
> This guide covers everything you need to set up, code, and submit changes.

---

## Table of Contents

1. [Principles](#principles)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure Overview](#project-structure-overview)
4. [Coding Standards — Green Code](#coding-standards--green-code)
5. [Pull Request Process](#pull-request-process)
6. [Commit Message Format](#commit-message-format)
7. [Code Review Checklist](#code-review-checklist)
8. [Adding a New LLM Provider](#adding-a-new-llm-provider)
9. [Adding a New View](#adding-a-new-view)
10. [Adding a New IndexedDB Store](#adding-a-new-indexeddb-store)
11. [Testing Requirements](#testing-requirements)
12. [Documentation Requirements](#documentation-requirements)
13. [Getting Help](#getting-help)

---

## Principles

All contributions must adhere to the five mandatory principles of Wazeer OS:

| Principle | Meaning |
|-----------|---------|
| **Green Code** | No dead code, no stubs, no mocks in production. Every line must serve a purpose. |
| **Security as Mindset** | SHA-256 hashing on client, no raw secrets, input sanitization, HorusGuard AST scanning. |
| **Separation of Concerns** | Services handle logic, stores hold state, components render UI. Never mix. |
| **Scalable Architecture** | Modular design, plugin-ready providers, injectable dependencies. |
| **Enterprise Edition** | Production-grade error handling, structured logging, graceful degradation. |

---

## Development Environment Setup

### Prerequisites

| Requirement | Minimum Version | Recommended |
|-------------|-----------------|-------------|
| Node.js | 20.x LTS | 22.x LTS |
| npm | 10.x | 10.x |
| Git | 2.40+ | Latest |
| OS | Any | macOS / Ubuntu 22.04+ |
| Editor | Any | VS Code + ESLint + Prettier |

### Step-by-Step Setup

```bash
# 1. Clone the repository
gh repo clone 100MillionDEV/Wazeer-OS
# or: git clone https://github.com/100MillionDEV/Wazeer-OS.git
cd Wazeer-OS

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see .env.example for all required variables)

# 4. Start the development server (client + server concurrently)
npm run dev

# 5. Open in browser
# Client: http://localhost:5173
# Server: http://localhost:3001
```

### Environment Variables

All API keys are stored in `.env` and **never** committed. Key variables:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_GEMINI_API_KEY=
VITE_CLAUDE_API_KEY=
VITE_DEFAULT_MODEL=
```

> **BYOK (Bring Your Own Keys):** Wazeer OS does not ship with any API keys. Users provide their own.

### Verification

```bash
# Lint check
npm run lint

# Type check
npx tsc --noEmit

# Build check
npm run build

# Run tests (when available)
npm test
```

---

## Project Structure Overview

```
Wazeer-OS/
├── client/                          # React 19 PWA client
│   ├── public/
│   │   ├── manifest.json            # PWA manifest
│   │   ├── sw.js                    # Service worker
│   │   └── icons/                   # PWA icons (192, 512)
│   ├── src/
│   │   ├── main.tsx                 # Entry point, bootstrap
│   │   ├── App.tsx                  # Root component, router
│   │   ├── components/              # UI components
│   │   │   ├── auth/                # LoginModal, auth-related
│   │   │   ├── chat/                # ChatInput, MessageBubble, etc.
│   │   │   ├── editor/              # AmounEditor (Monaco)
│   │   │   ├── layout/              # TopBar, Sidebar, Footer
│   │   │   ├── modals/              # SummaryModal, SettingsModal
│   │   │   └── tasks/               # TasksHUD, TaskItem
│   │   ├── services/                # Business logic services
│   │   │   ├── authService.ts       # Auth operations
│   │   │   ├── aiGateway.ts         # LLM routing
│   │   │   ├── learningEngine.ts    # Task + memory extraction
│   │   │   ├── memoryEngine.ts      # Memory CRUD + relevance
│   │   │   ├── taskScheduler.ts     # Auto-execution scheduler
│   │   │   └── horusGuard.ts        # AST security scanner
│   │   ├── stores/                  # Zustand state stores
│   │   │   ├── workspaceStore.ts    # Chat, sessions, tasks, models
│   │   │   ├── swarmStore.ts        # Agent states
│   │   │   ├── configStore.ts       # User preferences, config
│   │   │   └── uiStore.ts           # Modal, theme, layout state
│   │   ├── db/                      # IndexedDB layer (idb-keyval)
│   │   │   ├── stores.ts            # Store definitions + indexes
│   │   │   └── migrations.ts        # Schema versioning
│   │   ├── utils/                   # Pure utility functions
│   │   │   ├── hash.ts              # SHA-256 password hashing
│   │   │   ├── token.ts             # UUID session tokens
│   │   │   └── format.ts            # Date, text formatting
│   │   ├── types/                   # TypeScript interfaces
│   │   │   ├── chat.ts              # Message, Session, Provider
│   │   │   ├── auth.ts              # User, AuthState
│   │   │   ├── task.ts              # Task, TaskPriority
│   │   │   ├── agent.ts             # AgentState, AgentCapability
│   │   │   └── memory.ts            # Memory, MemoryCategory
│   │   └── styles/                  # Global styles, animations
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                          # Express 4 proxy server
│   ├── src/
│   │   ├── index.ts                 # Server entry point
│   │   ├── proxy/                   # Provider proxy routes
│   │   │   ├── registry.ts          # Provider registry (15 providers)
│   │   │   └── handlers.ts          # Proxy request handlers
│   │   ├── middleware/               # Security middleware
│   │   │   ├── security.ts          # Helmet, COEP/COOP/CORP
│   │   │   ├── rateLimit.ts         # 100 req/min/IP
│   │   │   └── errorHandler.ts      # Error rewriting
│   │   └── utils/
│   │       └── shutdown.ts          # Graceful shutdown handler
│   ├── tsconfig.json
│   └── package.json
├── shared/                          # Shared types between client/server
│   └── types/
├── tests/                           # Test suites
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                            # Project documentation
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── package.json                     # Root package.json (workspaces)
├── tsconfig.base.json
└── README.md
```

---

## Coding Standards — Green Code

### The Green Code Manifesto

Wazeer OS follows **Green Code** principles — every line of code must justify its existence:

1. **No Dead Code:** Remove unused imports, functions, variables, and files before every PR.
2. **No Stubs in Production:** Every function must have a real implementation. Mocked placeholders are only acceptable in `tests/`.
3. **No Console.log in Production:** Use structured logging. `console.log` is only acceptable during active debugging in development.
4. **No `any` Types:** All TypeScript types must be explicit. Use `unknown` if the type is truly unknown, then narrow.
5. **File Size Limits:** Service files ≤ 500 lines, component files ≤ 300 lines. Split if exceeded.
6. **No Magic Numbers:** Extract constants. `const MAX_RETRIES = 3;` not `retryCount < 3`.
7. **No Bare Catch Blocks:** Every `catch` must handle or re-throw with context.
8. **No Duplication (DRY):** Extract shared logic into utilities or services.

### TypeScript Rules

```typescript
// ✅ DO: Explicit types, interfaces over types
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// ❌ DON'T: any, type aliases for objects
const handleMessage = (msg: any) => { ... };
type Message = { id: string; role: string; content: string };
```

### React Rules

```typescript
// ✅ DO: Functional components, proper hooks
export default function ChatInput({ onSend }: ChatInputProps) {
  const [value, setValue] = useState<string>('');
  // ...
}

// ❌ DON'T: Class components, deprecated patterns
class ChatInput extends React.Component { ... }
```

### Import Order

```typescript
// 1. React & React ecosystem
import { useState, useCallback } from 'react';

// 2. Third-party libraries
import { motion } from 'framer-motion';
import { get, set } from 'idb-keyval';

// 3. Internal modules (absolute paths with @/ alias)
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { processPrompt } from '@/services/aiGateway';

// 4. Styles (if any)
import '@/styles/animations.css';

// 5. Types (imported last, using `type` keyword)
import type { ChatMessage, ProviderConfig } from '@/types/chat';
```

---

## Pull Request Process

### 1. Fork & Branch

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/Wazeer-OS.git
cd Wazeer-OS
git checkout -b feat/your-feature-name
# or: fix/bug-description, docs/your-docs, refactor/your-refactor
```

### 2. Branch Naming Convention

| Type | Prefix | Example |
|------|--------|---------|
| Feature | `feat/` | `feat/voice-recognition-arabic` |
| Bug Fix | `fix/` | `fix/session-persistence-login` |
| Documentation | `docs/` | `docs/module-learning-guide` |
| Refactor | `refactor/` | `refactor/ai-gateway-streaming` |
| Performance | `perf/` | `perf/memory-engine-batching` |
| Security | `security/` | `security/horusguard-injection` |

### 3. Commit

```bash
git add -p  # Review each change
npm run lint  # Verify before committing
git commit -m "feat(auth): add registration flow to LoginModal"
```

### 4. Push & PR

```bash
git push origin feat/your-feature-name
# Open PR on GitHub against the `main` branch
```

### 5. PR Template

```markdown
## Description
Brief description of what this PR does and why.

## Type
- [ ] Feature
- [ ] Bug Fix
- [ ] Refactor
- [ ] Documentation
- [ ] Security

## Related Issues
Closes #123

## Changes Made
- Change 1
- Change 2

## Testing
- [ ] Unit tests pass
- [ ] Manual testing performed
- [ ] No regression in existing features

## Screenshots (if applicable)

## Green Code Checklist
- [ ] No dead code added
- [ ] No `any` types
- [ ] No `console.log` in production paths
- [ ] File size limits respected
- [ ] All new code has types
```

---

## Commit Message Format

Wazeer OS uses **Conventional Commits** (v1.0.0):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Purpose |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructure, no behavior change |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, tooling |
| `security` | Security fix or improvement |

### Scopes

Common scopes: `auth`, `chat`, `search`, `learning`, `agents`, `tasks`, `editor`, `proxy`, `db`, `ui`, `pwa`

### Examples

```
feat(chat): add voice input with Arabic speech recognition
fix(auth): resolve session persistence after page reload
docs(learning): document memory extraction pipeline
refactor(gateway): extract provider routing into strategy pattern
security(horusguard): add prototype pollution detection to AST scanner
perf(memory): batch IndexedDB writes for memory deduplication
```

---

## Code Review Checklist

Reviewers **must** verify all items before approving:

### Architecture
- [ ] Changes follow Separation of Concerns — no business logic in components
- [ ] New modules follow the service → store → component pattern
- [ ] No circular dependencies introduced

### Code Quality
- [ ] No `any` types — all code explicitly typed
- [ ] No `console.log` / `console.debug` in production code paths
- [ ] No dead code, commented-out blocks, or TODO without issue reference
- [ ] No magic numbers — extracted to named constants
- [ ] File size within limits (services ≤ 500, components ≤ 300)

### Security
- [ ] User input sanitized before rendering
- [ ] No secrets or API keys in code (must use env vars)
- [ ] HorusGuard scanning applied where applicable
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] IndexedDB writes use structured data, not raw strings

### Performance
- [ ] No unnecessary re-renders (React.memo, useMemo, useCallback where needed)
- [ ] IndexedDB operations are not blocking the UI thread
- [ ] Streaming responses are properly cleaned up on unmount
- [ ] No memory leaks (event listeners, timers, subscriptions cleaned up)

### Testing
- [ ] Unit tests cover new service functions
- [ ] Edge cases tested (empty input, network failure, malformed data)
- [ ] No tests skipped without explanation

### Documentation
- [ ] New public APIs have JSDoc comments
- [ ] New modules documented in `docs/module-*.md`
- [ ] README updated if user-facing changes

---

## Adding a New LLM Provider

Wazeer OS supports 7+ LLM providers with a plugin-like architecture. To add a new one:

### Step 1: Define the Provider Configuration

In `client/src/services/aiGateway.ts`, add to the provider registry:

```typescript
const PROVIDER_CONFIG: Record<string, ProviderConfig> = {
  // ... existing providers
n  'my-provider': {
    name: 'My Provider',
    baseUrl: 'https://api.my-provider.com/v1',
    streamPath: '/chat/completions',
    authHeader: 'Authorization',
    authPrefix: 'Bearer',
    supportsStreaming: true,
    supportsTools: false,
    maxTokens: 8192,
    models: ['my-model-large', 'my-model-small'],
  },
};
```

### Step 2: Add Proxy Route

In `server/src/proxy/registry.ts`, register the proxy endpoint:

```typescript
app.use('/api/proxy/my-provider', createProxyHandler('https://api.my-provider.com/v1'));
```

### Step 3: Add to Model Selection UI

Models from the new provider will automatically appear in the model dropdown if they're in the user's `models` array in `configStore`.

### Step 4: Handle Response Format

If the provider's response format differs from OpenAI's, add a response adapter in `aiGateway.ts`:

```typescript
function adaptMyProviderResponse(raw: unknown): StreamChunk {
  // Transform to standard StreamChunk format
}
```

### Step 5: Test

```bash
# 1. Verify proxy route
npm run dev
# Test: curl -X POST http://localhost:3001/api/proxy/my-provider/chat/completions

# 2. Verify client routing
# Select the new model in the UI and send a test message

# 3. Add integration test
touch tests/integration/providers/my-provider.test.ts
```

### Step 6: Document

Update `module-chat.md` with the new provider's details and any special handling.

---

## Adding a New View

Views in Wazeer OS follow a consistent pattern:

### Step 1: Create the Component

```typescript
// client/src/views/MyNewView.tsx
import { useWorkspaceStore } from '@/stores/workspaceStore';
import type { FC } from 'react';

interface MyNewViewProps {
  // Define props
}

/**
 * Brief description of what this view does.
 */
export const MyNewView: FC<MyNewViewProps> = (props) => {
  // Use stores for state
  // Use services for logic
  // Return JSX with Tailwind classes
  return (
    <div className="flex flex-col h-full bg-wazeer-dark">
      {/* View content */}
    </div>
  );
};

export default MyNewView;
```

### Step 2: Add Route

In `client/src/App.tsx`, add the route:

```typescript
import MyNewView from '@/views/MyNewView';

// In router configuration:
<Route path="/my-view" element={<MyNewView />} />
```

### Step 3: Add Navigation (if needed)

If the view needs a sidebar entry, add it to the `Sidebar` component's navigation array.

### Step 4: Create Store Slice (if needed)

If the view has significant state, add a dedicated Zustand store or extend an existing one.

---

## Adding a New IndexedDB Store

IndexedDB stores are defined in `client/src/db/stores.ts` using `idb-keyval`:

### Step 1: Define the Store

```typescript
// client/src/db/stores.ts
import { createStore } from 'idb-keyval';

export const myNewStore = createStore('wazeer-mydata', 'mydata-store');
// Parameters: database name, object store name
```

### Step 2: Create Type Definitions

```typescript
// client/src/types/myData.ts
export interface MyDataRecord {
  id?: number; // autoIncrement
  name: string;
  value: string;
  category: MyDataCategory;
  createdAt: number;
}

export type MyDataCategory = 'type-a' | 'type-b' | 'type-c';
```

### Step 3: Create DB Operations

```typescript
// client/src/services/myDataService.ts
import { get, set, del, keys, clear } from 'idb-keyval';
import { myNewStore } from '@/db/stores';
import type { MyDataRecord } from '@/types/myData';

export const myDataService = {
  async getAll(): Promise<MyDataRecord[]> {
    const allKeys = await keys(myNewStore);
    const records = await Promise.all(
      allKeys.map(async (key) => {
        const record = await get(key, myNewStore);
        return record as MyDataRecord;
      })
    );
    return records.sort((a, b) => b.createdAt - a.createdAt);
  },

  async save(record: MyDataRecord): Promise<void> {
    await set(record.id ?? Date.now(), record, myNewStore);
  },

  async remove(id: number): Promise<void> {
    await del(id, myNewStore);
  },

  async clearAll(): Promise<void> {
    await clear(myNewStore);
  },
};
```

### Step 4: Add Migration (if needed)

```typescript
// client/src/db/migrations.ts
// Add migration logic for schema version changes
```

---

## Testing Requirements

### Coverage Targets

| Layer | Minimum Coverage |
|-------|------------------|
| Services (pure logic) | 80% |
| Stores (state management) | 70% |
| Utilities | 90% |
| Components | 50% |
| Integration (E2E) | Key flows only |

### Test Structure

```
tests/
├── unit/
│   ├── services/
│   │   ├── authService.test.ts
│   │   ├── aiGateway.test.ts
│   │   └── learningEngine.test.ts
│   ├── stores/
│   │   └── workspaceStore.test.ts
│   └── utils/
│       └── hash.test.ts
├── integration/
│   ├── chat-flow.test.ts
│   └── auth-flow.test.ts
└── e2e/
    └── full-conversation.test.ts
```

### Test Naming

```typescript
// Pattern: describe('UnitName') → it('should behavior when condition')
describe('AuthService', () => {
  describe('loginUser', () => {
    it('should return user when credentials are valid', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'hashed_password';

      // Act
      const result = await authService.loginUser(email, password);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(email);
    });

    it('should throw AuthError when password is incorrect', async () => {
      // ...
    });

    it('should log auth attempt to auth_logs store', async () => {
      // ...
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --grep "AuthService"

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

---

## Documentation Requirements

### When to Document

| Change Type | Documentation Required |
|-------------|----------------------|
| New feature | Module doc update + README feature list |
| New API/service | JSDoc + module doc API reference |
| Bug fix | Update Known Issues in handover doc |
| Breaking change | Migration guide in module doc |
| New store | Module doc + handover store reference |
| New provider | module-chat.md provider section |

### JSDoc Standard

```typescript
/**
 * Processes a user prompt and routes it to the appropriate AI provider.
 *
 * @param prompt - The user's input message text.
 * @param sessionId - The current chat session identifier.
 * @param options - Optional configuration for this request.
 * @param options.mode - Chat mode affecting system prompt (general, coding, brainstorm, files).
 * @param options.modelId - Override the active model for this request.
 * @param options.attachments - File attachments to include in the request.
 * @returns A promise that resolves when the full response is received.
 * @throws {ProviderError} When the provider returns an error or is unreachable.
 * @throws {NetworkError} When the network request fails entirely.
 *
 * @example
 * ```typescript
 * await aiGateway.processPrompt('Hello, Amoun!', 'session-123', {
 *   mode: 'general',
 * });
 * ```
 */
export async function processPrompt(
  prompt: string,
  sessionId: string,
  options?: ProcessOptions
): Promise<void> {
  // ...
}
```

---

## Getting Help

- **Issues:** Open a GitHub issue with the `question` label.
- **Discussions:** Use GitHub Discussions for architectural questions.
- **Dev Channel:** Join the developer Discord/Telegram for real-time help.
- **Code Questions:** Tag `@100MillionDEV` on your PR for a faster review.

---

> صُنع بـ ❤️ بواسطة العرآب | حقوق النشر 100MillionDEV.com
>
> 𓂀 Wazeer OS — Egyptian Cyberpunk AI Assistant
