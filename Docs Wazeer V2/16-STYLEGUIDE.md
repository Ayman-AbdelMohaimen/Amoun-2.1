# 𓂀 Wazeer OS Style Guide v2.0.0-Rewrite

> **The Egyptian Cyberpunk Code Standard.** Every line of code in Wazeer OS follows these rules.
> Deviations require explicit justification in the PR description.

---

## Table of Contents

1. [TypeScript Style](#typescript-style)
2. [React Style](#react-style)
3. [CSS / Tailwind Style](#css--tailwind-style)
4. [Naming Conventions](#naming-conventions)
5. [Import Order](#import-order)
6. [Error Handling Patterns](#error-handling-patterns)
7. [Comment Style](#comment-style)
8. [File Organization](#file-organization)
9. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## TypeScript Style

### Strict Mode Required

All TypeScript files must compile under `"strict": true` in `tsconfig.json`. This includes:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": false,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### No `any` — Ever

```typescript
// ✅ DO: Use specific types
function parseResponse(data: unknown): ChatMessage {
  if (typeof data !== 'object' || data === null) {
    throw new TypeError('Expected object, received ' + typeof data);
  }
  const record = data as Record<string, unknown>;
  return {
    id: String(record.id ?? crypto.randomUUID()),
    role: record.role === 'user' || record.role === 'assistant' ? record.role : 'user',
    content: String(record.content ?? ''),
    timestamp: Number(record.timestamp ?? Date.now()),
  };
}

// ❌ DON'T: Use any
function parseResponse(data: any): any {
  return data;
}
```

### Interfaces Over Type Aliases for Objects

```typescript
// ✅ DO: Interface for object shapes
interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  supportsStreaming: boolean;
  models: string[];
}

// ✅ ACCEPTABLE: Type alias for unions, primitives, or mapped types
type ChatMode = 'general' | 'coding' | 'brainstorm' | 'files';
type ProviderMap = Record<string, ProviderConfig>;

// ❌ DON'T: Type alias for object shapes that could be interfaces
type ProviderConfig = {
  id: string;
  name: string;
};
```

### Explicit Return Types on Public Functions

```typescript
// ✅ DO: Explicit return type on exported functions
export function hashPassword(password: string): Promise<string> {
  // ...
}

// ✅ ACCEPTABLE: Infer on private/internal functions
function formatTimestamp(ts: number) {
  return new Intl.DateTimeFormat('ar-EG', { timeStyle: 'short' }).format(ts);
}
```

### Use `readonly` for Immutable Data

```typescript
// ✅ DO: Mark arrays and objects that shouldn't be mutated
interface AgentState {
  readonly id: string;
  readonly capabilities: readonly AgentCapability[];
  status: AgentStatus; // mutable
}

// ✅ DO: Use `as const` for constant tuples
const ADMIN_EMAILS = [
  'hello.simple.ai@gmail.com',
  'ayman.abdelmohsen@gmail.com',
] as const;
```

### Prefer `const` Assertions

```typescript
// ✅ DO
const CHAT_MODES = ['general', 'coding', 'brainstorm', 'files'] as const;
type ChatMode = (typeof CHAT_MODES)[number];

// ❌ DON'T
const CHAT_MODES: string[] = ['general', 'coding', 'brainstorm', 'files'];
```

---

## React Style

### Functional Components Only

```typescript
// ✅ DO: Named function declaration, FC type
import type { FC } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'اسأل أمون...',
}) => {
  return (
    <div className="flex items-center gap-2 p-4">
      {/* ... */}
    </div>
  );
};

export default ChatInput;
```

### Rules of Hooks

```typescript
// ✅ DO: Hooks at top level, in correct order
export const MessageBubble: FC<{ message: ChatMessage }> = ({ message }) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const theme = useConfigStore((s) => s.theme);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // ...
};

// ❌ DON'T: Hooks inside conditions, loops, or nested functions
if (someCondition) {
  const [value, setValue] = useState(''); // VIOLATION
}
```

### Prop Types Must Be Interfaces

```typescript
// ✅ DO: Define prop interface above the component
interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string;
  sessionId: string;
}

export const SummaryModal: FC<SummaryModalProps> = ({ isOpen, onClose, summary, sessionId }) => {
  // ...
};

// ❌ DON'T: Inline prop types
export const SummaryModal: FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen }) => {
  // ...
};
```

### Default Exports

Every view and major component must have a **default export** for lazy loading:

```typescript
// Named export for testing and tree-shaking
export const ChatView: FC = () => { /* ... */ };

// Default export for route lazy loading
export default ChatView;
```

### Event Handler Naming

```typescript
// ✅ DO: handle + EventName pattern
const handleSubmit = (e: FormEvent<HTMLFormElement>): void => { /* ... */ };
const handleClickCopy = (): void => { /* ... */ };
const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => { /* ... */ };

// ❌ DON'T: Generic names
const submit = () => { /* ... */ };
const doClick = () => { /* ... */ };
```

### Cleanup in useEffect

```typescript
// ✅ DO: Always clean up side effects
useEffect(() => {
  const controller = new AbortController();

  void aiGateway.processPrompt(prompt, sessionId, {
    signal: controller.signal,
  });

  return () => {
    controller.abort();
  };
}, [prompt, sessionId]);
```

---

## CSS / Tailwind Style

### Utility-First — No Component CSS

```tsx
// ✅ DO: All styling via Tailwind utilities
<div className="flex items-center justify-between px-4 py-2 bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg">
  <span className="text-sm text-gray-300 font-mono">
    {message.content}
  </span>
</div>

// ❌ DON'T: Custom CSS classes for layout
// .message-bubble {
//   display: flex;
//   align-items: center;
//   padding: 8px 16px;
// }
```

### Exceptions: Animations Only

The **only** acceptable use of custom CSS is for keyframe animations that Tailwind cannot express:

```css
/* client/src/styles/animations.css */

@keyframes horus-glow {
  0%, 100% { box-shadow: 0 0 5px rgba(0, 255, 136, 0.3); }
  50% { box-shadow: 0 0 20px rgba(0, 255, 136, 0.6); }
}

@keyframes scan-line {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

@keyframes egyptian-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Theme Tokens via Tailwind Config

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        'wazeer-dark': '#0a0a0f',
        'wazeer-surface': '#12121a',
        'wazeer-border': '#1a1a2e',
        'wazeer-accent': '#00ff88',    // Egyptian neon green
        'wazeer-gold': '#ffd700',       // Pharaoh gold
        'wazeer-blue': '#4169e1',       // Nile blue
        'wazeer-red': '#ff3366',        // Danger red
        'wazeer-text': '#e0e0e0',
        'wazeer-muted': '#888888',
      },
      fontFamily: {
        'cairo': ['Cairo', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
};
```

### Responsive Design

```tsx
// ✅ DO: Mobile-first responsive
<div className="flex flex-col md:flex-row gap-2 md:gap-4 p-2 md:p-4">
  <div className="w-full md:w-64 shrink-0">
    {/* Sidebar */}
  </div>
  <div className="flex-1 min-w-0">
    {/* Main content */}
  </div>
</div>

// ❌ DON'T: Fixed widths that break on small screens
<div style={{ width: '1200px' }}>{/* ... */}</div>
```

### Dark-Mode Only

Wazeer OS is **always dark mode** (Egyptian Cyberpunk aesthetic). Do not add light mode support or `dark:` prefixes.

---

## Naming Conventions

### File Naming

| Category | Convention | Example |
|----------|-----------|---------|
| React Components | PascalCase `.tsx` | `ChatInput.tsx`, `LoginModal.tsx` |
| Services | camelCase `.ts` | `authService.ts`, `aiGateway.ts` |
| Stores | camelCase `Store.ts` | `workspaceStore.ts`, `swarmStore.ts` |
| Types | camelCase `.ts` | `chat.ts`, `auth.ts`, `memory.ts` |
| Utilities | camelCase `.ts` | `hash.ts`, `token.ts`, `format.ts` |
| DB definitions | camelCase `.ts` | `stores.ts`, `migrations.ts` |
| Styles | kebab-case `.css` | `animations.css`, `scrollbar.css` |
| Tests | camelCase `.test.ts` | `authService.test.ts` |
| Views | PascalCase `.tsx` | `HomeView.tsx`, `SettingsView.tsx` |
| Server routes | kebab-case `.ts` | `rate-limit.ts`, `error-handler.ts` |

### Variable Naming

```typescript
// camelCase for variables and functions
const chatSessions = []; // ✅
const isGenerating = false; // ✅
function extractTasks() {} // ✅

// UPPER_SNAKE_CASE for constants
const MAX_RETRIES = 3; // ✅
const DEFAULT_MODEL = 'gemini-2.0-flash'; // ✅
const ADMIN_EMAILS = ['...'] as const; // ✅
const MEMORY_TTL_DAYS = 90; // ✅

// PascalCase for types, interfaces, classes
interface ChatSession {} // ✅
type AgentCapability = 'chat' | 'code'; // ✅

class ProviderError extends Error {} // ✅ (only for error classes)

// Prefix boolean with is/has/should/can
const isAuthenticated = true; // ✅
const hasActiveSession = false; // ✅
const shouldRetry = true; // ✅
const canExecuteTools = false; // ✅

// Prefix handlers with handle
const handleSubmit = () => {}; // ✅
const handleFileUpload = () => {}; // ✅

// Suffix callbacks with Callback
type OnMessageCallback = (msg: ChatMessage) => void; // ✅
```

### Component Naming

```typescript
// ✅ DO: Descriptive, domain-specific names
export const ChatInput: FC<ChatInputProps> = ({}) => {};
export const MessageBubble: FC<MessageBubbleProps> = ({}) => {};
export const TasksHUD: FC = () => {};
export const SwarmIndicator: FC = () => {};
export const AmounEditor: FC = () => {};

// ❌ DON'T: Generic or abbreviated names
export const Input: FC = () => {};  // Too generic
export const MsgBub: FC = () => {}; // Abbreviated
export const Thing: FC = () => {};  // Meaningless
```

---

## Import Order

Imports must follow this exact order, separated by blank lines between groups:

```typescript
// ═══════════════════════════════════════════════════════════════
// 1. React & React Ecosystem
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef, type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════
// 2. Third-Party Libraries
// ═══════════════════════════════════════════════════════════════
import { get, set, del, keys } from 'idb-keyval';
import { create } from 'zustand';

// ═══════════════════════════════════════════════════════════════
// 3. Internal Modules (absolute paths with @/ alias)
// ═══════════════════════════════════════════════════════════════
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useSwarmStore } from '@/stores/swarmStore';
import { processPrompt } from '@/services/aiGateway';
import { extractTasks } from '@/services/learningEngine';
import { chatStore } from '@/db/stores';

// ═══════════════════════════════════════════════════════════════
// 4. Styles (if any custom CSS needed)
// ═══════════════════════════════════════════════════════════════
import '@/styles/animations.css';

// ═══════════════════════════════════════════════════════════════
// 5. Types (always last, using `type` keyword for type-only imports)
// ═══════════════════════════════════════════════════════════════
import type { ChatMessage, ProviderConfig, ProcessOptions } from '@/types/chat';
import type { Task, TaskPriority } from '@/types/task';
```

### Import Rules

1. **No relative imports** deeper than one level — use `@/` path alias for anything outside the current directory.
2. **No wildcard imports** — import each item explicitly: `import { get, set }` not `import * as idb`.
3. **Type-only imports** must use the `type` keyword: `import type { X } from './types'`.
4. **Barrel exports** (`index.ts`) are acceptable for directory-level exports only.
5. **No circular imports** — if A imports B, B must not import A. Use events/callbacks to break cycles.

---

## Error Handling Patterns

### Try/Catch with Typed Errors

```typescript
// ✅ DO: Catch specific errors, wrap in domain errors
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly providerId: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: AuthErrorCode
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
```

### Never Throw Raw

```typescript
// ✅ DO: Wrap all thrown errors
async function fetchProviderResponse(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new ProviderError(
        `Provider returned ${response.status}`,
        extractProviderId(url),
        response.status
      );
    }
    return await response.text();
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError(
      `Failed to reach provider: ${error instanceof Error ? error.message : 'Unknown error'}`,
      extractProviderId(url),
      0
    );
  }
}

// ❌ DON'T: Throw raw strings or unknown errors
throw 'Something went wrong';
throw new Error('Failed'); // In production code, use domain errors
```

### Result Type Pattern (for non-throwing APIs)

```typescript
// ✅ DO: Use Result for operations that can fail without throwing
interface Result<T, E = Error> {
  readonly ok: true;
  readonly value: T;
}
interface Result<T, E> {
  readonly ok: false;
  readonly error: E;
}

type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

function safeParse(json: string): Result<ChatMessage, SyntaxError> {
  try {
    return { ok: true, value: JSON.parse(json) as ChatMessage };
  } catch (error) {
    return { ok: false, error: error as SyntaxError };
  }
}

// Usage
const result = safeParse(rawJson);
if (result.ok) {
  console.info('Parsed message:', result.value);
} else {
  console.error('Parse failed:', result.error.message);
}
```

### Never Swallow Errors Silently

```typescript
// ✅ DO: At minimum, log the error
try {
  await saveToIndexedDB(record);
} catch (error) {
  console.error('Failed to save record to IndexedDB:', error);
  // Optionally: show user notification
}

// ❌ DON'T: Empty catch
try {
  await saveToIndexedDB(record);
} catch {
  // Silent failure — user thinks data is saved
}
```

---

## Comment Style

### JSDoc for All Public APIs

```typescript
/**
 * Authenticates a user with email and password.
 *
 * Password is hashed with SHA-256 on the client before transmission.
 * The hashed value is stored in IndexedDB, never the raw password.
 *
 * @param email - User's email address.
 * @param rawPassword - Plain text password (will be hashed internally).
 * @returns The authenticated user object with session token.
 * @throws {AuthError} If credentials are invalid or user not found.
 *
 * @see {@link registerUser} for creating new accounts.
 * @see {@link silentReAuth} for session restoration.
 */
export async function loginUser(
  email: string,
  rawPassword: string
): Promise<AuthenticatedUser> {
  // ...
}
```

### Inline Comments for Complex Logic Only

```typescript
// ✅ DO: Explain WHY, not WHAT
// SHA-256 hash is computed client-side so the raw password is never
// transmitted or stored. This is a design decision, not a replacement
// for server-side hashing (which we don't have — all data is local).
const hash = await crypto.subtle.digest('SHA-256', encoder.encode(rawPassword));

// ✅ DO: Explain non-obvious business rules
// Admin is determined by hardcoded emails OR first-registered-user flag.
// This is intentional — no admin panel exists in v2.0.
const isAdmin = ADMIN_EMAILS.includes(email) || isFirstRegisteredUser;

// ❌ DON'T: State the obvious
// Set the value to empty string
setValue('');
// Return the user object
return user;
// Loop through the array
for (const item of items) { }
```

### Section Dividers in Large Files

```typescript
// ═══════════════════════════════════════════════════════════════
// Section Name
// ═══════════════════════════════════════════════════════════════
```

### TODO/FIXME Format

```typescript
// TODO(#234): Add OAuth refresh token rotation before token expires
// FIXME: Session doesn't persist after reload — silentReAuth doesn't restore state
// HACK: Temporary workaround for Gemini rate limit, remove after API quota increase
// NOTE: Firebase Auth only used for Google OAuth, not for email/password
```

---

## File Organization

### File Size Limits

| File Type | Maximum Lines | Action if Exceeded |
|-----------|--------------|-------------------|
| Service files | 500 lines | Split into focused service modules |
| Component files | 300 lines | Extract sub-components or custom hooks |
| Store files | 400 lines | Split into slices or use `immer` middleware |
| Type files | 200 lines | Split by domain |
| Test files | 500 lines | Split into describe blocks in separate files |

### Component File Structure

```typescript
// ═══════════════════════════════════════════════════════════════
// Imports (see Import Order section)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
// ...

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════
interface MyComponentProps {
  // ...
}

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════
const MY_CONSTANT = 'value';

// ═══════════════════════════════════════════════════════════════
// Helpers (pure functions used by the component)
// ═══════════════════════════════════════════════════════════════
function helperFunction() { /* ... */ }

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════
export const MyComponent: FC<MyComponentProps> = (props) => {
  // State
  // Effects
  // Handlers
  // Derived state
  // Render
};

export default MyComponent;
```

### Co-located Tests

Tests live in `tests/` directory, mirroring the `src/` structure:

```
src/services/authService.ts  →  tests/unit/services/authService.test.ts
src/stores/workspaceStore.ts  →  tests/unit/stores/workspaceStore.test.ts
src/utils/hash.ts             →  tests/unit/utils/hash.test.ts
```

### Barrel Exports

Use `index.ts` barrel files only at directory boundaries:

```typescript
// client/src/types/index.ts
export type { ChatMessage, ChatSession, ProviderConfig } from './chat';
export type { User, AuthState } from './auth';
export type { Task, TaskPriority } from './task';
```

---

## Anti-Patterns to Avoid

### 1. ❌ Using `any` Type
```typescript
// BAD
const data: any = response.data;

// GOOD
const data = response.data as ChatResponse;
```

### 2. ❌ Business Logic in Components
```typescript
// BAD — component computes AI response
const MyComponent = () => {
  const handleSend = () => {
    const result = messages.filter(m => m.role === 'user').map(m => m.content);
    fetch('/api/proxy/gemini', { body: JSON.stringify({ messages: result }) });
  };
};

// GOOD — component calls service, service has the logic
const MyComponent = () => {
  const handleSend = () => {
    void aiGateway.processPrompt(input, sessionId);
  };
};
```

### 3. ❌ Direct IndexedDB Access from Components
```typescript
// BAD
const MyComponent = () => {
  useEffect(() => {
    get('key', chatStore).then(val => setState(val));
  }, []);
};

// GOOD — access through store or service
const MyComponent = () => {
  const messages = useWorkspaceStore(s => s.messages);
};
```

### 4. ❌ Console.log in Production Code
```typescript
// BAD
console.log('User logged in:', user);
console.debug('Store state:', store);

// GOOD — use structured logging or remove entirely
// In development only, behind a check:
if (import.meta.env.DEV) {
  console.info('[Auth] User authenticated:', user.email);
}
```

### 5. ❌ Nested Ternary Expressions
```typescript
// BAD
const status = isLoading ? 'loading' : error ? 'error' : data ? 'success' : 'empty';

// GOOD — use early returns or a helper function
function getStatus(): string {
  if (isLoading) return 'loading';
  if (error) return 'error';
  if (data) return 'success';
  return 'empty';
}
```

### 6. ❌ Prop Drilling Beyond 2 Levels
```typescript
// BAD: Passing props through 3+ components
<GrandParent child={<Parent child={<Child onAction={handleAction} />} />} />

// GOOD: Use Zustand store or React Context
const handleAction = useWorkspaceStore(s => s.handleAction);
```

### 7. ❌ useEffect for Derived State
```typescript
// BAD
const [total, setTotal] = useState(0);
useEffect(() => { setTotal(items.reduce((a, b) => a + b.count, 0)); }, [items]);

// GOOD — use useMemo
const total = useMemo(() => items.reduce((a, b) => a + b.count, 0), [items]);
```

### 8. ❌ Missing Dependency Arrays
```typescript
// BAD — missing dependency
useEffect(() => { fetchData(sessionId); }, []); // sessionId used but not in deps

// GOOD
useEffect(() => { fetchData(sessionId); }, [sessionId]);
```

### 9. ❌ God Components (doing too many things)
```typescript
// BAD: 300-line component handling chat, file upload, voice, and settings
export const ChatPanel: FC = () => {
  // 50 lines for chat
  // 50 lines for file upload
  // 50 lines for voice
  // 50 lines for settings
  // 100 lines of JSX
};

// GOOD: Split into focused components
export const ChatPanel: FC = () => {
  return (
    <div>
      <MessageList />
      <ChatInput />
      <FileUpload />
    </div>
  );
};
```

### 10. ❌ String Concatenation for User-Facing Text
```typescript
// BAD
<div>"Welcome " + user.name + "! You have " + taskCount + " tasks."</div>

// GOOD — use template literals and i18n-ready patterns
<div>{`Welcome, ${user.name}! You have ${taskCount} tasks.`}</div>
```

### 11. ❌ Storing Secrets in Code or IndexedDB
```typescript
// BAD
const API_KEY = 'sk-abc123...';
await set('api_key', userApiKey, configStore);

// GOOD — environment variables only
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
```

### 12. ❌ Ignoring Promise Rejections
```typescript
// BAD
void fetch(url); // Fire and forget

// GOOD
void fetch(url).catch((error) => {
  console.error('Background fetch failed:', error);
});
```

### 13. ❌ Mutable State Updates Outside Zustand
```typescript
// BAD — mutating Zustand state directly
const messages = useWorkspaceStore(s => s.messages);
messages.push(newMessage); // Mutation!

// GOOD — use store action
const addMessage = useWorkspaceStore(s => s.addMessage);
addMessage(newMessage);
```

### 14. ❌ Hardcoded Strings That Should Be Constants
```typescript
// BAD
if (model.startsWith('gemini')) { /* ... */ }
if (error.status === 429) { /* ... */ }

// GOOD
const GEMINI_PREFIX = 'gemini';
const HTTP_RATE_LIMIT = 429;
if (model.startsWith(GEMINI_PREFIX)) { /* ... */ }
```

### 15. ❌ Missing Error Boundaries
```typescript
// BAD — unhandled render errors crash the whole app

// GOOD — wrap feature areas in ErrorBoundary
<ErrorBoundary fallback={<ErrorPanel />}>
  <ChatView />
</ErrorBoundary>
```

---

## Quick Reference Card

| Rule | Standard |
|------|----------|
| TypeScript | Strict mode, no `any`, interfaces over types |
| React | Functional only, hooks rules, prop interfaces |
| CSS | Tailwind utility-first, custom CSS only for animations |
| File names | PascalCase (components), camelCase (services/stores) |
| Variables | camelCase, `is`/`has`/`should` prefix for booleans |
| Constants | UPPER_SNAKE_CASE with `as const` |
| Imports | React → third-party → internal → styles → types |
| Errors | Typed error classes, never throw raw, never swallow silently |
| Comments | JSDoc for public APIs, inline for complex logic only |
| Files | Services ≤ 500 lines, Components ≤ 300 lines |
| Dead code | Zero tolerance — remove before every PR |
| Console | No `console.log` in production paths |

---

> صُنع بـ ❤️ بواسطة العرآب | حقوق النشر 100MillionDEV.com
>
> 𓂀 Wazeer OS — Egyptian Cyberpunk AI Assistant