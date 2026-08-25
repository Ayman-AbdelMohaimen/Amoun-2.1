# Project Context — Wazeer OS v2.0.0-Rewrite

> 𓂀 Wazeer OS (وزير OS) — Quick Reference & Onboarding Guide  
> Document Owner: Engineering Lead | Last Updated: 2025-01  
> Classification: Internal — Engineering (New Developer Guide)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack Quick Reference](#tech-stack-quick-reference)
3. [Architecture Diagram](#architecture-diagram)
4. [Entry Points](#entry-points)
5. [Key Files and Their Roles](#key-files-and-their-roles)
6. [Directory Structure](#directory-structure)
7. [How to Add a New LLM Provider](#how-to-add-a-new-llm-provider)
8. [How to Add a New View](#how-to-add-a-new-view)
9. [How to Add a New IndexedDB Store](#how-to-add-a-new-indexeddb-store)
10. [Common Gotchas](#common-gotchas)

---

## Project Overview

**Wazeer OS (وزير OS)** is a Progressive Web App personal AI assistant built by 100MillionDEV (العرآب). It features the AI agent **Amoun (أمون)** for chat, coding, and task management, with an Egyptian Cyberpunk design language. The app runs entirely client-side using React 19, communicates with LLM APIs (Gemini, GPT, Claude, Ollama) for AI features, and stores all data in IndexedDB — respecting user privacy by keeping analytics and history on-device. Version 2.0.0-Rewrite is a complete architectural overhaul from v0.x, moving from CRA to Vite 6, context providers to Zustand 5, and generic dark theme to a comprehensive design system with glassmorphism, glow effects, and bilingual AR/EN support.

---

## Tech Stack Quick Reference

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | React | 19.x | UI components |
| **Build Tool** | Vite | 6.x | Development server, bundling, HMR |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS with custom design tokens |
| **State Management** | Zustand | 5.x | Global state (stores, no context nesting) |
| **Animation** | Framer Motion | 12.x | Page transitions, micro-interactions |
| **AI SDK** | @google/genai | 2.4.x | LLM API integration (multi-model) |
| **Auth** | Firebase Auth | 12.x | Google + email authentication |
| **Database** | IndexedDB | Native API | Persistent client-side storage |
| **Code Editor** | Monaco Editor | @monaco-editor/react | Integrated code editing (AmounEditor) |
| **Icons** | lucide-react | latest | Icon library |
| **Fonts** | Space Grotesk, Inter, JetBrains Mono, IBM Plex Sans Arabic | Google Fonts | Typography system |
| **PWA** | Service Worker API | Native | Offline support, installability |
| **Hosting** | Hostinger VPS | — | Static file serving |
| **Security Scanner** | HorusGuard | Custom | AST-based code security scanning |
| **Testing** | Vitest + Testing Library | latest | Unit and integration tests |

---

## Architecture Diagram

### Simplified Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER (Client-Side)                   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                    React 19 App Shell                  │    │
│  │                                                        │    │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────────────┐  │    │
│  │  │ TopBar   │  │ Sidebar  │  │ Content Area       │  │    │
│  │  │          │  │ (11 nav) │  │                    │  │    │
│  │  │ Model    │  │ + Chat   │  │ ┌───────┐ ┌─────┐ │  │    │
│  │  │ Swarm    │  │ History  │  │ │Home   │ │Edit │ │  │    │
│  │  │ Voice    │  │          │  │ │View   │ │or   │ │  │    │
│  │  │ Lang     │  │          │  │ └───────┘ │     │ │  │    │
│  │  │ Login    │  │          │  │ ┌───────┐ │Dash │ │  │    │
│  │  └─────────┘  └──────────┘  │ │Settings│ │board│ │  │    │
│  │                             │ │View   │ │     │ │  │    │
│  │  ┌─────────────────────────┐│ └───────┘ └─────┘ │  │    │
│  │  │   MobileBottomNav      ││                    │  │    │
│  │  │   (mobile only)        ││                    │  │    │
│  │  └─────────────────────────┘└────────────────────┘  │    │
│  └──────────────────────────────────────────────────────┘    │
│                            │                                  │
│  ┌─────────────────────────┼──────────────────────────┐     │
│  │          Zustand Stores  │                           │     │
│  │                          │                           │     │
│  │  ┌────────┐ ┌────────┐  │  ┌────────┐ ┌────────┐ │     │
│  │  │Auth    │ │Chat    │  │  │Model   │ │Theme   │ │     │
│  │  │Store   │ │Store   │  │  │Store   │ │Store   │ │     │
│  │  └────┬───┘ └───┬────┘  │  └───┬────┘ └───┬────┘ │     │
│  │       │         │        │      │          │       │     │
│  │  ┌────┴───┐ ┌───┴────┐  │  ┌───┴────┐      │       │     │
│  │  │Tasks   │ │Memory  │  │  │Events  │      │       │     │
│  │  │Store   │ │Store   │  │  │Logger  │      │       │     │
│  │  └────────┘ └────────┘  │  └────────┘      │       │     │
│  │                         │                   │       │     │
│  │  ┌────────┐ ┌────────┐  │  ┌────────┐      │       │     │
│  │  │Config  │ │Editor  │  │  │I18n    │      │       │     │
│  │  │Store   │ │Store   │  │  │Store   │      │       │     │
│  │  └────┬───┘ └────────┘  │  └────────┘      │       │     │
│  └───────┼──────────────────────────────────────┘     │
│          │                                              │
│  ┌───────┼──────────────────────────────────┐         │
│  │       │       IndexedDB (Persistent)      │         │
│  │       │                                    │         │
│  │  ┌────┴───┐ ┌──────────┐ ┌────────────┐ │         │
│  │  │ config │ │chats     │ │ tasks      │ │         │
│  │  │ store  │ │ store    │ │ store      │ │         │
│  │  └────────┘ └──────────┘ └────────────┘ │         │
│  └──────────────────────────────────────────┘         │
│                                                        │
└──────────────────────┬──────────────────────────────────┘
                       │ (API calls — user's own keys)
                       │
          ┌────────────┼────────────┐
          │            │            │
    ┌─────┴────┐ ┌────┴─────┐ ┌──┴──────┐
    │ Gemini   │ │ GPT-4o   │ │ Claude  │
    │ API      │ │ API      │ │ API     │
    └──────────┘ └──────────┘ └─────────┘
          │
    ┌─────┴────┐
    │Firebase  │
    │Auth      │
    └──────────┘
```

---

## Entry Points

### `main.tsx` — Application Entry

```typescript
// src/main.tsx
// - Imports global CSS (Tailwind)
// - Renders <App /> into #root
// - Initializes PWA service worker registration
```

**Responsibilities:**
1. Mount React app to DOM
2. Import global styles (Tailwind directives)
3. Register service worker
4. Set up error boundary at root level

### `App.tsx` — Shell Component

```typescript
// src/App.tsx
// - Wraps everything in providers (ThemeProvider, etc.)
// - Manages routing (view switching)
// - Renders TopBar + Sidebar + Content + MobileBottomNav
// - Handles global keyboard shortcuts
```

**Responsibilities:**
1. Route management (view → component mapping)
2. Layout shell (TopBar, Sidebar, Content, MobileBottomNav)
3. Global keyboard shortcut listeners
4. Language direction (RTL/LTR) on `<html>`

### `server.ts` — Express Server (Optional)

```typescript
// server/server.ts
// - Express 4 server for production serving
// - Serves static files from dist/
// - Provides API endpoints if needed (minimal)
```

---

## Key Files and Their Roles

### Top 20 Essential Files

| # | File Path | Role | Lines (est.) |
|---|---|---|---|
| 1 | `src/main.tsx` | App entry point, SW registration | ~30 |
| 2 | `src/App.tsx` | Shell layout, routing, providers | ~200 |
| 3 | `src/stores/useAuthStore.ts` | Firebase auth state, user session | ~150 |
| 4 | `src/stores/useChatStore.ts` | Messages, conversations, streaming | ~250 |
| 5 | `src/stores/useModelStore.ts` | Model selection, API key management | ~200 |
| 6 | `src/stores/useThemeStore.ts` | Theme presets, CSS custom properties | ~100 |
| 7 | `src/stores/useTasksStore.ts` | Task CRUD, priorities, status | ~150 |
| 8 | `src/stores/useMemoryStore.ts` | Memory extraction, categories | ~120 |
| 9 | `src/stores/useConfigStore.ts` | General config, IndexedDB bridge | ~100 |
| 10 | `src/stores/useEventLogger.ts` | Analytics events, metrics computation | ~200 |
| 11 | `src/stores/useI18nStore.ts` | Language toggle, translations | ~150 |
| 12 | `src/components/layout/TopBar.tsx` | Model selector, swarm, voice, lang, login | ~200 |
| 13 | `src/components/layout/Sidebar.tsx` | 11 nav items, chat history, collapsible | ~250 |
| 14 | `src/components/layout/MobileBottomNav.tsx` | Mobile tab navigation | ~100 |
| 15 | `src/views/HomeView.tsx` | Status pills, Tasks HUD, Eye, ChatInput | ~350 |
| 16 | `src/views/AmounEditor.tsx` | Monaco + chat + terminal split pane | ~300 |
| 17 | `src/views/LlmDashboard.tsx` | Metrics cards, charts, agent cards | ~350 |
| 18 | `src/views/SettingsView.tsx` | Model management, theme, language, data | ~300 |
| 19 | `src/components/chat/ChatInput.tsx` | Message input, voice, send, templates | ~200 |
| 20 | `src/services/llm.ts` | Unified LLM interface (@google/genai) | ~300 |

### Additional Important Files

| File | Role |
|---|---|
| `src/components/auth/LoginModal.tsx` | Firebase Auth modal (Google + email) |
| `src/components/auth/AddModelModal.tsx` | Add/configure LLM provider |
| `src/components/chat/ChatMessage.tsx` | Single message rendering (markdown, code) |
| `src/components/panels/ArtifactPanel.tsx` | Slide-in artifact preview |
| `src/components/ui/SkeletonPulse.tsx` | Skeleton loading component |
| `src/components/ui/ErrorBoundary.tsx` | Error boundary wrapper |
| `src/components/onboarding/OnboardingFlow.tsx` | 3-step onboarding wizard |
| `src/components/dashboard/MetricCard.tsx` | Dashboard metric display |
| `src/components/dashboard/AgentCard.tsx` | Per-agent status card |
| `src/services/horusGuard.ts` | AST code security scanner |
| `src/services/search.ts` | Web search integration (Gemini grounding) |
| `src/services/db.ts` | IndexedDB initialization and migration |
| `src/utils/i18n.ts` | Translation strings (AR/EN) |
| `src/utils/constants.ts` | App version, routes, defaults |
| `tailwind.config.js` | Tailwind theme configuration |
| `vite.config.ts` | Vite build configuration |

---

## Directory Structure

```
wazeer-os/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   ├── favicon.ico
│   ├── icons/                 # PWA icons (72-512px)
│   └── screenshots/           # PWA screenshots
├── src/
│   ├── main.tsx               # Entry point
│   ├── App.tsx                # Shell component
│   ├── components/
│   │   ├── layout/            # TopBar, Sidebar, MobileBottomNav
│   │   ├── chat/              # ChatInput, ChatMessage, ChatList
│   │   ├── editor/            # AmounEditor, EditorPane, ChatPane, TerminalPane
│   │   ├── dashboard/         # MetricCard, AgentCard, Charts
│   │   ├── auth/              # LoginModal, AddModelModal
│   │   ├── panels/            # ArtifactPanel, SummaryModal
│   │   ├── onboarding/        # OnboardingFlow
│   │   ├── home/              # TasksHUD, GoalsHUD, EyeCenterpiece, TemplateMarquee
│   │   ├── settings/          # ModelManagement, ThemeConfig, DataManagement
│   │   └── ui/                # SkeletonPulse, ErrorBoundary, Toast, Button, etc.
│   ├── views/
│   │   ├── HomeView.tsx
│   │   ├── AmounEditor.tsx    # Also known as IntegratedView
│   │   ├── LlmDashboard.tsx
│   │   ├── SettingsView.tsx
│   │   ├── ProjectsView.tsx
│   │   ├── WorkspaceView.tsx
│   │   ├── ComputeView.tsx
│   │   ├── StorageView.tsx
│   │   ├── AdminView.tsx      # Also KingsToolsView
│   │   ├── TemplatesView.tsx
│   │   ├── HistoryView.tsx
│   │   └── LandingPageView.tsx
│   ├── stores/
│   │   ├── useAuthStore.ts
│   │   ├── useChatStore.ts
│   │   ├── useModelStore.ts
│   │   │   ├── useThemeStore.ts
│   │   ├── useTasksStore.ts
│   │   ├── useMemoryStore.ts
│   │   ├── useConfigStore.ts
│   │   ├── useEventLogger.ts
│   │   ├── useI18nStore.ts
│   │   ├── useEditorStore.ts
│   │   └── useSwarmStore.ts
│   ├── services/
│   │   ├── llm.ts             # Unified LLM interface
│   │   ├── horusGuard.ts      # Code security scanner
│   │   ├── search.ts          # Web search
│   │   └── db.ts              # IndexedDB
│   ├── utils/
│   │   ├── i18n.ts            # Translations
│   │   ├── constants.ts       # App constants
│   │   ├── cn.ts              # Tailwind class merge utility
│   │   └── helpers.ts         # General helpers
│   ├── types/
│   │   ├── chat.ts            # Chat-related types
│   │   ├── model.ts           # Model-related types
│   │   ├── task.ts            # Task types
│   │   ├── event.ts           # Analytics event types
│   │   └── index.ts           # Barrel export
│   └── styles/
│       └── globals.css        # Tailwind directives + custom CSS
├── server/
│   └── server.ts              # Express static server
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   └── ... (17 documentation files)
├── tests/
│   ├── unit/
│   └── integration/
├── .env                       # Environment variables (API keys)
├── .env.example               # Template for env vars
├── index.html                 # HTML entry (Vite)
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## How to Add a New LLM Provider

### Step-by-Step Guide

Adding a new LLM provider (e.g., Mistral) requires changes in 3 files:

#### 1. Add Provider Definition

```typescript
// src/types/model.ts
export interface ModelProvider {
  id: string;
  name: string;
  provider: string;
  icon: string;
  requiresApiKey: boolean;
  supportedFeatures: {
    chat: boolean;
    search: boolean;
    code: boolean;
    vision: boolean;
  };
}

// Add to the PROVIDERS constant:
export const PROVIDERS: ModelProvider[] = [
  // ... existing providers
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'mistral',
    icon: 'MistralIcon', // from lucide-react or custom SVG
    requiresApiKey: true,
    supportedFeatures: {
      chat: true,
      search: false,
      code: true,
      vision: false,
    },
  },
];
```

#### 2. Implement API Call

```typescript
// src/services/llm.ts
export async function sendMessage(
  prompt: string,
  model: ModelConfig,
  history: Message[]
): Promise<LLMResponse> {
  switch (model.provider) {
    case 'google':
      return sendToGemini(prompt, model, history);
    case 'openai':
      return sendToOpenAI(prompt, model, history);
    case 'anthropic':
      return sendToAnthropic(prompt, model, history);
    case 'mistral':
      return sendToMistral(prompt, model, history); // NEW
    case 'ollama':
      return sendToOllama(prompt, model, history);
    default:
      throw new Error(`Unknown provider: ${model.provider}`);
  }
}

// New function:
async function sendToMistral(
  prompt: string,
  model: ModelConfig,
  history: Message[]
): Promise<LLMResponse> {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${model.apiKey}`,
    },
    body: JSON.stringify({
      model: model.id,
      messages: formatHistory(history, prompt),
      max_tokens: 4096,
    }),
  });
  
  return parseMistralResponse(response);
}
```

#### 3. Update Model Selector UI

```typescript
// src/components/layout/TopBar.tsx (ModelSelector)
// The provider dropdown automatically reads from PROVIDERS constant
// No UI code changes needed if using the data-driven approach
```

### Verification Checklist

- [ ] Provider appears in model selector dropdown
- [ ] API key input works for the new provider
- [ ] Messages send and receive correctly
- [ ] Streaming works (if supported)
- [ ] Error handling works (invalid key, rate limit)
- [ ] Theme accent colors apply to provider icon
- [ ] Event logging captures the new provider in `metadata.model`

---

## How to Add a New View

### Step-by-Step Guide

Adding a new view (e.g., `AnalyticsView`) requires 4 steps:

#### 1. Create View Component

```typescript
// src/views/AnalyticsView.tsx
import { motion } from 'framer-motion';

export default function AnalyticsView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 space-y-6"
    >
      <h1 className="text-display-lg">Analytics</h1>
      {/* View content */}
    </motion.div>
  );
}
```

#### 2. Add Route

```typescript
// src/App.tsx
import AnalyticsView from './views/AnalyticsView';

// Add to route mapping:
const VIEWS = {
  home: HomeView,
  analytics: AnalyticsView,  // NEW
  // ... existing views
};
```

#### 3. Add Sidebar Navigation Item

```typescript
// src/components/layout/Sidebar.tsx
const NAV_ITEMS = [
  // ... existing items
  { id: 'analytics', label: 'Analytics', labelAr: 'التحليلات', icon: BarChart3 },
];
```

#### 4. Add Translation Strings

```typescript
// src/utils/i18n.ts
export const translations = {
  en: {
    nav: {
      // ... existing
      analytics: 'Analytics',
    },
  },
  ar: {
    nav: {
      // ... existing
      analytics: 'التحليلات',
    },
  },
};
```

### Verification Checklist

- [ ] View renders when navigating from sidebar
- [ ] Page transition animation works
- [ ] View works in both LTR and RTL
- [ ] Mobile layout is correct (stacked, full-width)
- [ ] Keyboard shortcut can navigate to the view (optional)
- [ ] View title uses display typography

---

## How to Add a New IndexedDB Store

### Step-by-Step Guide

Adding a new IndexedDB store (e.g., for `projects`) requires 2 steps:

#### 1. Update Database Schema

```typescript
// src/services/db.ts
const DB_NAME = 'wazeer_os_db';
const DB_VERSION = 2; // Increment!

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Existing stores...
      if (!db.objectStoreNames.contains('projects')) {
        const projects = db.createObjectStore('projects', { keyPath: 'id' });
        projects.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
```

#### 2. Create Zustand Store with Persistence

```typescript
// src/stores/useProjectsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

interface ProjectsStore {
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
}

export const useProjectsStore = create<ProjectsStore>()(
  persist(
    (set) => ({
      projects: [],
      addProject: (project) => {
        const newProject: Project = {
          ...project,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ projects: [...state.projects, newProject] }));
      },
      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        }));
      },
      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        }));
      },
    }),
    { name: 'projects' } // IndexedDB key name
  )
);
```

### Verification Checklist

- [ ] DB_VERSION incremented
- [ ] Store created with correct keyPath
- [ ] Indexes created for queried fields
- [ ] Zustand persist configured with store name
- [ ] Data persists across page reload
- [ ] Data survives browser restart
- [ ] Migration from old DB_VERSION works (test upgrade)

---

## Common Gotchas

### 1. Zustand Persist + IndexedDB

**Gotcha:** Zustand `persist` with `name: 'auth'` stores in `localStorage` by default, not IndexedDB.

**Fix:** Use `localStorage` for small stores (auth, theme) and IndexedDB for large stores (chat history, events). For IndexedDB persistence, use a custom storage adapter.

### 2. Tailwind CSS 4 Dark Mode

**Gotcha:** Tailwind CSS 4 doesn't use `darkMode: 'class'` — dark mode is handled via CSS custom properties on `:root`.

**Fix:** Theme colors are set as CSS custom properties in `useThemeStore`, not via Tailwind's dark mode class.

### 3. Monaco Editor + Vite

**Gotcha:** Monaco Editor workers need special Vite configuration for correct loading.

**Fix:** Configure Vite to handle Monaco's worker files:
```typescript
// vite.config.ts
export default {
  optimizeDeps: {
    include: ['monaco-editor'],
  },
};
```

### 4. Firebase Auth + IndexedDB

**Gotcha:** Firebase Auth state is separate from IndexedDB. App state (auth store) may be out of sync with Firebase.

**Fix:** Use `onAuthStateChanged` to sync Firebase state with Zustand. Never rely solely on persisted state for auth.

### 5. RTL Layout + Framer Motion

**Gotcha:** Framer Motion `x` animations go the wrong direction in RTL.

**Fix:** Use CSS logical properties or conditional animation direction:
```typescript
const isRTL = document.documentElement.dir === 'rtl';
const xDirection = isRTL ? -20 : 20;
<motion.div initial={{ x: xDirection }} animate={{ x: 0 }} />
```

### 6. Service Worker Cache Busting

**Gotcha:** After deploying new version, users may see old cached version due to service worker.

**Fix:** Include app version in cache name: `wazeer-os-v${APP_VERSION}`. Detect SW update and prompt user to refresh.

### 7. @google/genai Multi-Model

**Gotcha:** `@google/genai` is Google's SDK. To use OpenAI, Claude, or other providers, you need separate API calls, not the genai SDK.

**Fix:** Abstract behind a unified `llm.ts` service that routes to different API endpoints based on the selected provider.

### 8. IndexedDB Async Nature

**Gotcha:** IndexedDB operations are asynchronous. Zustand `persist` may read stale data if DB isn't ready.

**Fix:** Ensure DB is initialized before rendering app. Use a loading state while IndexedDB opens.

### 9. Long Chat History Performance

**Gotcha:** Rendering 500+ chat messages causes DOM bloat and slow scrolling.

**Fix:** Implement virtual scrolling with `react-window` for chat lists exceeding 100 messages.

### 10. Environment Variables in PWA

**Gotcha:** `import.meta.env` variables are baked at build time, not available at runtime.

**Fix:** For runtime config (API keys entered by user), store in IndexedDB, not env vars. Env vars are only for build-time config (Firebase keys).

---

*Document 𓂀 Wazeer OS Project Context v2.0.0-Rewrite*  
*© 2025 100MillionDEV / العرآب — All Rights Reserved*
