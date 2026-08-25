# Execution Rules — Wazeer OS v2.0.0-Rewrite

> 𓂀 Wazeer OS (وزير OS) — Coding Standards & Engineering Rules  
> Document Owner: Engineering Lead | Last Updated: 2025-01  
> Classification: Internal — Engineering

---

## Table of Contents

1. [Overview](#overview)
2. [Green Code Rules](#green-code-rules)
3. [Security Execution Rules](#security-execution-rules)
4. [State Management Rules](#state-management-rules)
5. [File Organization Rules](#file-organization-rules)
6. [Naming Conventions](#naming-conventions)
7. [Import Rules](#import-rules)
8. [Error Handling Rules](#error-handling-rules)
9. [Component Development Rules](#component-development-rules)
10. [TypeScript Rules](#typescript-rules)
11. [Testing Rules](#testing-rules)
12. [PR Review Checklist](#pr-review-checklist)
13. [Anti-Patterns (What NOT to Do)](#anti-patterns-what-not-to-do)

---

## Overview

### The 5 Mandates

Wazeer OS engineering is governed by five mandatory principles:

| # | Principle | Rule | Enforcement |
|---|---|---|---|
| 1 | **Green Code** | No dead code, no stubs, no mocks in production | Linting, code review |
| 2 | **Security as Mindset** | Every input validated, every output sanitized | HorusGuard, review |
| 3 | **Separation of Concerns** | Stores are state-only, services handle logic, components are pure | Architecture review |
| 4 | **Scalable Architecture** | Modular, replaceable, documented | Code review |
| 5 | **Enterprise Edition** | Professional quality in every line | PR checklist |

---

## Green Code Rules

### Rule 1.1: No Dead Code

Every line of code must be reachable and executed in at least one code path.

```typescript
// ❌ WRONG — Dead code
function calculateTotal(items: Item[]): number {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  // const tax = subtotal * 0.1;  ← Dead code (commented out, not used)
  // const oldCalculation = subtotal * 1.15;  ← Dead code (never called)
  return subtotal;
}

// ✅ CORRECT — All code is live
function calculateTotal(items: Item[], taxRate: number): number {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * taxRate;
  return subtotal + tax;
}
```

### Rule 1.2: No STUB Functions

Every function must have a real implementation or be removed entirely.

```typescript
// ❌ WRONG — STUB function
function searchWeb(query: string): Promise<SearchResult[]> {
  // TODO: Implement real search
  return Promise.resolve([]);  ← STUB!
}

// ✅ CORRECT — Either implement fully or remove
async function searchWeb(query: string): Promise<SearchResult[]> {
  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: query }] }],
    tools: [{ googleSearch: {} }],
  });
  return extractSearchResults(response);
}
```

### Rule 1.3: No Mock Data in Production

Production code must never return hardcoded mock data.

```typescript
// ❌ WRONG — Mock data in production
function getMetrics(): Metrics {
  return {
    totalOperations: 1234,    ← Hardcoded!
    tokensProcessed: 56789,   ← Hardcoded!
    errorRate: 2.3,           ← Hardcoded!
  };
}

// ✅ CORRECT — Real data from event logger
function getMetrics(): Metrics {
  return useEventLogger.getState().getMetrics();
}
```

### Rule 1.4: No Console.log in Production

```typescript
// ❌ WRONG — Console.log left in production code
function handleLogin(user: User) {
  console.log('User logged in:', user);  ← Remove!
  setUser(user);
}

// ✅ CORRECT — Use proper logging
function handleLogin(user: User) {
  useEventLogger.getState().logEvent({
    type: 'auth.login',
    category: 'auth',
    metadata: { provider: user.provider, sessionId: user.sessionId },
  });
  setUser(user);
}
```

### Rule 1.5: No TODO Without a Ticket

Every TODO must reference a GitHub issue number.

```typescript
// ❌ WRONG — Vague TODO
// TODO: implement caching

// ✅ CORRECT — TODO with ticket reference
// TODO(#127): implement Redis caching for model responses
```

---

## Security Execution Rules

### Rule 2.1: Validate All Inputs

Every external input must be validated before use.

```typescript
// ❌ WRONG — Unvalidated input
function updateModel(config: ModelConfig) {
  modelStore.setModel(config);  ← No validation!
}

// ✅ CORRECT — Validate before use
function updateModel(config: Partial<ModelConfig>): void {
  if (!config.id || typeof config.id !== 'string') {
    throw new ValidationError('Model ID is required and must be a string');
  }
  if (config.apiKey && !isValidApiKey(config.apiKey)) {
    throw new ValidationError('Invalid API key format');
  }
  modelStore.updateModel(config);
}
```

### Rule 2.2: Sanitize All Outputs

All user-generated content and AI responses must be sanitized before rendering.

```typescript
// ❌ WRONG — Raw HTML rendering
function renderMessage(content: string): ReactNode {
  return <div dangerouslySetInnerHTML={{ __html: content }} />;  ← DANGEROUS!
}

// ✅ CORRECT — Use safe rendering
function renderMessage(content: string): ReactNode {
  return <div>{renderMarkdown(content)}</div>;  ← Safe markdown rendering
}

// ✅ CORRECT — If HTML must be rendered, sanitize first
function renderSafeHtml(content: string): ReactNode {
  const clean = DOMPurify.sanitize(content);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

### Rule 2.3: Scan All Generated Code

All AI-generated code blocks must pass HorusGuard AST scanning.

```typescript
// ✅ CORRECT — Scan before rendering
function handleCodeBlock(code: string, language: string): void {
  const scanResult = HorusGuard.scan(code, language);
  
  if (scanResult.hasVulnerabilities) {
    // Show warning to user
    showWarning('This code contains potential security issues. Review before using.');
    // Display scan findings
    displayFindings(scanResult.findings);
  }
  
  renderCodeBlock(code, language, scanResult);
}
```

### Rule 2.4: Never Expose Secrets

API keys, tokens, and secrets must never appear in source code, logs, or UI.

```typescript
// ❌ WRONG — API key in log
console.log('Calling Gemini with key:', apiKey);  ← EXPOSES KEY!

// ❌ WRONG — API key in error message
throw new Error(`Failed to authenticate with key ${apiKey}`);  ← EXPOSES KEY!

// ✅ CORRECT — Mask secrets
console.log('Calling Gemini with key:', maskApiKey(apiKey));  // Shows "sk-...abcd"

// ✅ CORRECT — Generic error messages
throw new Error('Authentication failed — check your API key in Settings');
```

### Rule 2.5: Content Security Policy

All pages must have CSP headers. No inline scripts (except nonce'd):

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{RANDOM}';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://*.googleapis.com https://*.google.com https://api.openai.com https://api.anthropic.com;
```

---

## State Management Rules

### Rule 3.1: Stores Are State-Only

Zustand stores contain **state and actions that modify state**. No business logic.

```typescript
// ❌ WRONG — Business logic in store
const useChatStore = create((set) => ({
  messages: [],
  sendMessage: async (text: string) => {
    // Complex LLM call logic belongs in a service!
    const response = await fetch('https://api.google.com/gemini', { ... });
    const data = await response.json();
    set((state) => ({ messages: [...state.messages, data] }));
  },
}));

// ✅ CORRECT — Store only manages state
const useChatStore = create((set, get) => ({
  messages: [],
  isStreaming: false,
  
  addMessage: (message: Message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },
  
  setStreaming: (streaming: boolean) => {
    set({ isStreaming: streaming });
  },
  
  clearMessages: () => {
    set({ messages: [], isStreaming: false });
  },
}));
```

### Rule 3.2: Services Handle Logic

Business logic lives in service functions, not in stores or components.

```typescript
// src/services/chat.ts
export async function sendMessage(text: string): Promise<void> {
  const { addMessage, setStreaming } = useChatStore.getState();
  const { activeModel } = useModelStore.getState();
  
  setStreaming(true);
  addMessage({ role: 'user', content: text, timestamp: Date.now() });
  
  try {
    const response = await llmService.send(text, activeModel);
    addMessage({ role: 'assistant', content: response.text, timestamp: Date.now() });
    extractTasks(response.text);
    extractMemories(response.text);
  } catch (error) {
    handleChatError(error);
  } finally {
    setStreaming(false);
  }
}
```

### Rule 3.3: Components Are Pure

Components receive data via props or store subscriptions and render UI. No business logic in components.

```typescript
// ❌ WRONG — Logic in component
function ChatMessage({ message }: { message: Message }) {
  const [isLong, setIsLong] = useState(false);
  useEffect(() => {
    setIsLong(message.content.length > 500);  ← Business logic!
  }, [message]);
}

// ✅ CORRECT — Pure rendering
function ChatMessage({ message, isExpanded, onToggleExpand }: Props) {
  return (
    <div className="chat-message">
      <p>{message.content}</p>
      {message.content.length > 500 && (
        <button onClick={onToggleExpand}>
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}
```

### Rule 3.4: Store Separation by Domain

Each domain has exactly one store. No cross-store mutations.

```
useAuthStore     — Authentication, user session
useChatStore     — Messages, conversations, streaming state
useModelStore    — Model selection, API keys, provider config
useThemeStore    — Theme preset, CSS custom properties
useTasksStore    — Task CRUD, priorities, status
useMemoryStore   — Memory extraction, categories
useConfigStore   — General config, app settings
useEventLogger   — Analytics events, metrics computation
useI18nStore     — Language toggle, locale, translations
useEditorStore   — Editor state (files, active file, split position)
useSwarmStore    — Agent swarm state, circuit breaker
```

---

## File Organization Rules

### Rule 4.1: Maximum File Size

| File Type | Max Lines | Rationale |
|---|---|---|
| Component (.tsx) | 300 lines | Components should be focused and readable |
| Store (.ts) | 200 lines | Stores should be simple state containers |
| Service (.ts) | 400 lines | Services can be longer (complex logic) |
| Utility (.ts) | 200 lines | Utilities should be small and composable |
| Types (.ts) | 300 lines | Type definitions can grow |
| Test (.test.ts) | 300 lines | Tests should be focused |
| Config (.js/.ts) | 100 lines | Config files are concise |

### Rule 4.2: Barrel Exports

Every directory should have an `index.ts` barrel export:

```typescript
// src/components/ui/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Modal } from './Modal';
export { Toast } from './Toast';
export { SkeletonPulse } from './SkeletonPulse';
```

### Rule 4.3: Co-located Tests

Tests live alongside the files they test:

```
src/
├── stores/
│   ├── useChatStore.ts
│   ├── useChatStore.test.ts    ← Co-located test
│   ├── useModelStore.ts
│   └── useModelStore.test.ts   ← Co-located test
├── services/
│   ├── llm.ts
│   └── llm.test.ts             ← Co-located test
```

### Rule 4.4: Directory Structure

```
src/
├── components/          # UI components (presentational + container)
│   ├── layout/          # TopBar, Sidebar, MobileBottomNav
│   ├── chat/            # ChatInput, ChatMessage
│   ├── editor/          # AmounEditor, EditorPane
│   ├── dashboard/       # MetricCard, AgentCard
│   ├── auth/            # LoginModal, AddModelModal
│   ├── home/            # TasksHUD, GoalsHUD, EyeCenterpiece
│   ├── settings/        # Settings sub-components
│   ├── onboarding/      # OnboardingFlow
│   ├── panels/          # ArtifactPanel, SummaryModal
│   └── ui/              # Reusable primitives (Button, Input, etc.)
├── views/               # Page-level components (route targets)
├── stores/              # Zustand stores (one per domain)
├── services/            # Business logic and API calls
├── utils/               # Pure utility functions
├── types/               # TypeScript type definitions
└── styles/              # Global CSS, Tailwind directives
```

---

## Naming Conventions

### Rule 5.1: File Names

| Type | Convention | Example |
|---|---|---|
| React component | PascalCase | `ChatMessage.tsx`, `TopBar.tsx` |
| Zustand store | camelCase with `use` prefix | `useChatStore.ts`, `useModelStore.ts` |
| Service | camelCase | `llm.ts`, `search.ts`, `horusGuard.ts` |
| Utility | camelCase | `cn.ts`, `helpers.ts`, `constants.ts` |
| Type definition | PascalCase | `Message.ts`, `ModelConfig.ts` |
| CSS module | PascalCase | `HomeView.module.css` |
| Test | Same as source + `.test` | `useChatStore.test.ts` |
| Barrel export | `index.ts` | Always `index.ts` |
| Constants | UPPER_SNAKE_CASE (file) | `API_ENDPOINTS.ts` |

### Rule 5.2: Code Names

| Entity | Convention | Example |
|---|---|---|
| Components | PascalCase | `ChatInput`, `TasksHUD`, `MetricCard` |
| Props interfaces | PascalCase + `Props` | `ChatInputProps`, `TaskCardProps` |
| Store state | camelCase | `messages`, `isStreaming`, `activeModel` |
| Store actions | camelCase verb | `addMessage`, `setTheme`, `deleteTask` |
| Functions | camelCase verb | `sendMessage`, `parseResponse`, `validateApiKey` |
| Constants | UPPER_SNAKE_CASE | `APP_VERSION`, `MAX_EVENTS`, `THEME_PRESETS` |
| Types/Interfaces | PascalCase | `Message`, `ModelConfig`, `AnalyticsEvent` |
| Enum members | PascalCase | `Status.Active`, `Priority.High` |
| CSS classes | Tailwind utilities or kebab-case custom | `bg-card`, `text-accent-400`, `eye-centerpiece` |
| Event handler props | `on` + PascalCase | `onClick`, `onChange`, `onSubmit` |
| Boolean props | `is`/`has`/`should` prefix | `isLoading`, `hasError`, `shouldRetry` |
| Callback props | `on` + Action | `onModelSwitch`, `onTaskCreate` |

### Rule 5.3: Component Naming

Component names must match their file name exactly:

```typescript
// File: src/components/chat/ChatInput.tsx
export function ChatInput() { ... }  // ✅ Correct

// ❌ WRONG — name doesn't match file
export function MessageInput() { ... }
```

---

## Import Rules

### Rule 6.1: No Circular Dependencies

Import graph must be acyclic. If A imports B, B must not import A.

```
✅ ALLOWED:
  Component → Store → Service
  Store → Types
  Service → Types
  
❌ FORBIDDEN:
  Component ↔ Component (circular)
  Store ↔ Store (circular)
  Service ↔ Store (circular)
```

### Rule 6.2: Absolute Imports

Always use absolute imports from `src/` root:

```typescript
// ❌ WRONG — Relative import
import { useChatStore } from '../../stores/useChatStore';
import { Button } from '../ui/Button';

// ✅ CORRECT — Absolute import
import { useChatStore } from '@/stores/useChatStore';
import { Button } from '@/components/ui/Button';
```

### Rule 6.3: Import Order

Imports must be organized in this order:

```typescript
// 1. React & React ecosystem
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// 2. Third-party libraries
import { Mic, Send, StopCircle } from 'lucide-react';

// 3. Internal stores
import { useChatStore } from '@/stores/useChatStore';
import { useModelStore } from '@/stores/useModelStore';

// 4. Internal services & utils
import { sendMessage } from '@/services/chat';
import { cn } from '@/utils/cn';

// 5. Types
import type { Message } from '@/types/chat';

// 6. Relative imports (co-located)
import { ChatBubble } from './ChatBubble';
```

### Rule 6.4: Type Imports

Use `import type` for type-only imports (tree-shaking optimization):

```typescript
// ✅ CORRECT — Type-only import
import type { Message, ModelConfig } from '@/types';
import { useChatStore } from '@/stores/useChatStore';

// ❌ WRONG — Value import for types (can't tree-shake)
import { Message, ModelConfig } from '@/types';
```

---

## Error Handling Rules

### Rule 7.1: Never Throw Raw Errors

Always wrap errors in typed error classes or standardized error objects.

```typescript
// ❌ WRONG — Raw throw
throw new Error('API key is invalid');

// ✅ CORRECT — Typed error
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'error' | 'warn' | 'info',
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Usage
throw new AppError(
  'API key is invalid',
  'AUTH_INVALID_KEY',
  'error',
  true // recoverable: user can update key
);
```

### Rule 7.2: Try/Catch at Service Boundaries

All service functions must catch errors and handle them gracefully.

```typescript
// ✅ CORRECT — Error handling at service level
export async function sendChatMessage(text: string): Promise<void> {
  try {
    const response = await llmService.send(text);
    useChatStore.getState().addMessage({
      role: 'assistant',
      content: response.text,
      timestamp: Date.now(),
    });
  } catch (error) {
    // Log the error (not the raw message)
    useEventLogger.getState().logError({
      type: 'error.api',
      category: 'error',
      metadata: {
        action: 'chat_message',
        errorCode: error instanceof AppError ? error.code : 'UNKNOWN',
        recoverable: true,
      },
    });
    
    // Show user-friendly error
    showToast(error instanceof AppError
      ? error.message
      : 'Something went wrong — please try again'
    );
  }
}
```

### Rule 7.3: Sanitize Before Display

Never display raw error messages from APIs to users.

```typescript
// ❌ WRONG — Raw API error shown to user
catch (error) {
  setError(error.message);  ← Could contain stack trace, API key, etc.
}

// ✅ CORRECT — Sanitized error shown
catch (error) {
  const userMessage = getSafeErrorMessage(error);
  setError(userMessage);
}

function getSafeErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error && error.message.includes('network')) {
    return 'Connection lost — check your internet and try again';
  }
  return 'Something went wrong — please try again';
}
```

### Rule 7.4: Error Boundaries on Every View

Every route-level view must be wrapped in an ErrorBoundary:

```typescript
// ✅ CORRECT — Error boundary wrapping
export default function SettingsView() {
  return (
    <ErrorBoundary
      fallback={<ErrorFallback title="Settings Error" />}
      onError={(error) => logError('error.view', { view: 'settings', error })}
    >
      <SettingsContent />
    </ErrorBoundary>
  );
}
```

---

## Component Development Rules

### Rule 8.1: Functional Components Only

No class components. React 19 + hooks exclusively.

### Rule 8.2: Props Interfaces

Every component with props must have a typed interface:

```typescript
// ✅ CORRECT — Typed props
interface TaskCardProps {
  task: Task;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  className?: string; // Optional for composition
}

export function TaskCard({
  task,
  isExpanded,
  onToggle,
  onComplete,
  onDelete,
  className,
}: TaskCardProps) {
  // ...
}
```

### Rule 8.3: Destructured Props

Always destructure props in the function signature:

```typescript
// ❌ WRONG — Props not destructured
export function TaskCard(props: TaskCardProps) {
  return <div>{props.task.title}</div>;
}

// ✅ CORRECT — Destructured
export function TaskCard({ task, isExpanded, onToggle }: TaskCardProps) {
  return <div>{task.title}</div>;
}
```

### Rule 8.4: Default Props via Destructuring

```typescript
// ✅ CORRECT — Default via destructuring
interface ToastProps {
  message: string;
  duration?: number;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export function Toast({
  message,
  duration = 3000,
  type = 'info',
}: ToastProps) {
  // ...
}
```

---

## TypeScript Rules

### Rule 9.1: Strict Mode

`tsconfig.json` must have:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Rule 9.2: No `any` Type

Never use `any`. Use `unknown` for truly unknown types.

```typescript
// ❌ WRONG — any
function handleError(error: any) { ... }

// ✅ CORRECT — unknown or specific type
function handleError(error: unknown) {
  if (error instanceof Error) {
    // Now TypeScript knows error has message, stack, etc.
  }
}
```

### Rule 9.3: Prefer Interfaces for Objects

```typescript
// ✅ CORRECT — Interface for object shapes
interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  apiKey?: string;
}

// ✅ CORRECT — Type alias for unions
type ModelProvider = 'google' | 'openai' | 'anthropic' | 'ollama';

// ❌ WRONG — Type alias for plain objects (use interface)
type ModelConfig = {
  id: string;
  name: string;
};
```

---

## Testing Rules

### Rule 10.1: Test Critical Paths

Priority for testing:

1. **Stores** — State transitions, edge cases
2. **Services** — API calls, error handling, parsing
3. **Auth flow** — Login, logout, persistence
4. **Utilities** — Validation, sanitization, formatting

### Rule 10.2: Test Naming Convention

```
describe('[Module]', () => {
  describe('[function/method]', () => {
    it('should [expected behavior] when [condition]', () => {
      // ...
    });
  });
});
```

Example:
```typescript
describe('useChatStore', () => {
  describe('addMessage', () => {
    it('should add message to end of list when called', () => {
      // ...
    });
    it('should maintain order when adding multiple messages', () => {
      // ...
    });
  });
});
```

---

## PR Review Checklist

### Before Creating a PR

- [ ] Code compiles: `tsc --noEmit` passes
- [ ] Linting passes: `eslint src/ --ext .ts,.tsx`
- [ ] All tests pass: `npm test`
- [ ] No `console.log` statements
- [ ] No `any` types
- [ ] No STUB functions or mock data
- [ ] Dead code removed
- [ ] New files follow naming conventions
- [ ] Imports use absolute paths
- [ ] Props are typed with interfaces
- [ ] Error handling implemented
- [ ] Works in both LTR and RTL
- [ ] Responsive at 375px, 768px, 1024px+

### During PR Review

- [ ] PR title follows conventional commits: `feat(scope): description`
- [ ] PR description explains what and why (not just how)
- [ ] No more than 400 lines changed (request split if larger)
- [ ] All files reviewed
- [ ] No merge conflicts
- [ ] CI checks pass
- [ ] At least one reviewer approved

### Before Merging

- [ ] All review comments addressed
- [ ] CI still passes
- [ ] CHANGELOG.md updated (if user-facing change)
- [ ] Documentation updated (if API or component change)

---

## Anti-Patterns (What NOT to Do)

| # | Anti-Pattern | Why Wrong | Do Instead |
|---|---|---|---|
| 1 | `console.log` for debugging | Left in production | Use `useEventLogger` or remove |
| 2 | `// TODO` without issue number | Gets forgotten | Always reference GitHub issue |
| 3 | `any` type | Defeats TypeScript | Use `unknown` or specific type |
| 4 | Commented-out code | Dead code | Delete it, git has history |
| 5 | Nested ternaries | Unreadable | Use early returns or if/else |
| 6 | `dangerouslySetInnerHTML` | XSS risk | Use markdown renderer or DOMPurify |
| 7 | Inline styles in JSX | Inconsistent with Tailwind | Use Tailwind classes |
| 8 | Relative imports beyond 1 level | Fragile, confusing | Use absolute imports with `@/` |
| 9 | Business logic in components | Hard to test | Move to services |
| 10 | Direct IndexedDB calls in components | Bypasses state management | Use Zustand stores |
| 11 | `useEffect` for data fetching without cleanup | Memory leaks, race conditions | Use AbortController or React Query |
| 12 | State mutation outside Zustand `set` | Bypasses reactivity | Always use store actions |
| 13 | Exporting everything | Pollutes namespace | Barrel exports with explicit list |
| 14 | God components (> 300 lines) | Unmaintainable | Split into smaller components |
| 15 | Hardcoded strings | Breaks i18n | Use translation function from useI18nStore |

---

*Document 𓂀 Wazeer OS Execution Rules v2.0.0-Rewrite*  
*© 2025 100MillionDEV / العرآب — All Rights Reserved*
