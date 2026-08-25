# UX Specification — Wazeer OS v2.0.0-Rewrite

> 𓂀 Wazeer OS (وزير OS) — Personal AI Assistant Platform  
> Document Owner: Product & UX Team | Last Updated: 2025-01  
> Classification: Internal — Engineering & Design

---

## Table of Contents

1. [Overview](#overview)
2. [User Personas](#user-personas)
3. [User Journey Maps](#user-journey-maps)
4. [Information Architecture](#information-architecture)
5. [Navigation Flow](#navigation-flow)
6. [Key Interaction Patterns](#key-interaction-patterns)
7. [Responsive Behavior](#responsive-behavior)
8. [Animation & Motion Guidelines](#animation--motion-guidelines)
9. [Error States & Empty States](#error-states--empty-states)
10. [Loading States & Skeleton Screens](#loading-states--skeleton-screens)
11. [Onboarding Flow](#onboarding-flow)
12. [Appendix: Micro-interaction Inventory](#appendix-micro-interaction-inventory)

---

## Overview

This document defines the complete user experience for Wazeer OS v2.0.0-Rewrite. It covers every touchpoint from first visit to power-user mastery, across desktop, tablet, and mobile viewports. The UX is built on three pillars: **Egyptian Cyberpunk aesthetics**, **bilingual AR/EN support**, and **AI-first interaction design**.

All interactions are designed mobile-first and scale upward. The system uses Framer Motion 12 for orchestrated animations and maintains a consistent Egyptian Cyberpunk visual language throughout.

---

## User Personas

### Persona A: The Explorer (First-time user)

| Attribute | Detail |
|---|---|
| **Name** | Sara — Student & Content Creator |
| **Language** | Arabic (RTL primary) |
| **Device** | Samsung Galaxy S24, Chrome Android |
| **Goals** | Understand what Wazeer OS does, try Amoun chat, explore features |
| **Tech literacy** | Medium — uses AI tools casually |
| **Pain points** | Needs guidance, easily overwhelmed by complex UIs |

### Persona B: The Builder (Returning user)

| Attribute | Detail |
|---|---|
| **Name** | Ahmed — Full-stack Developer |
| **Language** | English (LTR primary) |
| **Device** | MacBook Pro 14", VS Code side-by-side |
| **Goals** | Use Amoun for coding tasks, manage projects, integrate into workflow |
| **Tech literacy** | High — comfortable with CLIs, APIs, dev tools |
| **Pain points** | Needs efficiency, hates redundant clicks, wants keyboard shortcuts |

### Persona C: The Architect (Power user)

| Attribute | Detail |
|---|---|
| **Name** | Dr. Layla — AI Researcher |
| **Language** | Bilingual (switches between AR/EN) |
| **Device** | Desktop multi-monitor, occasionally iPad |
| **Goals** | Fine-tune models, analyze token usage, manage swarm agents |
| **Tech literacy** | Expert — contributes to OSS, understands LLM internals |
| **Pain points** | Needs granular control, wants to inspect metrics, values data privacy |

---

## User Journey Maps

### Journey 1: First Visit (Explorer)

```
[Landing Page]
    │
    ├──► "Get Started" CTA
    │       │
    │       ▼
    │   [PWA Install Prompt] (browser-native)
    │       │
    │       ├──► Install → Desktop shortcut created
    │       └──► Skip → Continue in browser
    │
    ▼
[Onboarding Wizard — Step 1: Welcome]
    │   "Welcome to Wazeer OS. Meet Amoun, your AI assistant."
    │   [𓂀 Eye animation — 2s intro]
    │   [Language Selection: العربية / English]
    │
    ▼
[Onboarding Wizard — Step 2: Choose Model]
    │   "Select your preferred AI model"
    │   [Model cards: Gemini, GPT, Claude, Ollama]
    │   [API Key input or "Use defaults"]
    │
    ▼
[Onboarding Wizard — Step 3: Explore]
    │   "Quick tour of your workspace"
    │   [Animated highlights: Sidebar, TopBar, Chat, Tasks]
    │   [Skip Tour / Next → Finish]
    │
    ▼
[HomeView — Active State]
    │   [Status pills: Model active, Session started]
    │   [ChatInput visible, cursor focused]
    │   [Template marquee scrolling]
    │   [Greeting: "مرحباً Sara" / "Welcome, Sara"]
```

**Success Metrics:** User sends first message within 90 seconds of onboarding completion.

### Journey 2: Returning User (Builder)

```
[HomeView — Session Resume]
    │   [Last conversation loaded in sidebar history]
    │   [Status: "Session restored • Last active 2h ago"]
    │
    ├──► Continue last chat → ChatInput focused
    │       │
    │       ▼
    │   [Message sent → Streaming response begins]
    │       │
    │       ├──► Text response → Rendered with markdown
    │       ├──► Code response → Syntax highlighted, copy button
    │       ├──► Task extracted → Toast: "Task created: Fix API endpoint"
    │       └──► Memory extracted → Toast: "Memory saved: Preference for TypeScript"
    │
    ├──► New chat → Empty chat area, full focus on input
    │
    ├──► AmounEditor → Split pane opens with Monaco editor
    │       │
    │       ▼
    │   [Code in left pane, chat in right, terminal at bottom]
    │   [Agent works in editor with real-time feedback]
    │
    └──► LlmDashboard → Analytics view
            │
            ▼
        [Metrics cards: Operations, Tokens, Error Rate]
        [Charts: 7-day token usage, operations by model]
```

**Success Metrics:** Time to first meaningful interaction < 5 seconds.

### Journey 3: Power User (Architect)

```
[HomeView]
    │   [Keyboard shortcut: Cmd+K → Command palette]
    │   [Keyboard shortcut: Cmd+T → New task]
    │   [Keyboard shortcut: Cmd+Shift+A → AmounEditor]
    │
    ├──► LlmDashboard
    │       │
    │       ├──► Per-agent cards (Amoun, Hermes, 7orus)
    │       │   [Status indicator: active/idle/error]
    │       │   [Tasks count, token count, last activity]
    │       │
    │       ├──► Token Usage Chart (7-day line chart)
    │       │   [Hover: exact values per day]
    │       │   [Click: drill into day's events]
    │       │
    │       ├──► Error Rate Trend
    │       │   [Threshold line at 5%]
    │       │   [Spikes highlighted in crimson]
    │       │
    │       └──► Export data → CSV download
    │
    ├──► Settings → Advanced
    │       │
    │       ├──► Add custom model via API key
    │       ├──► Configure swarm parameters
    │       ├──► Adjust circuit breaker thresholds
    │       ├──► Theme customization (custom hex values)
    │       └──► Data management (export/import, clear analytics)
    │
    └──► Kings Tools (Admin)
            │
            ├──► Swarm management (add/remove agents)
            ├──► HorusGuard scan logs
            └──► System health overview
```

**Success Metrics:** Task completion rate > 85%, avg session duration > 15 min.

---

## Information Architecture

### View Hierarchy

```
Wazeer OS
├── Landing Page (unauthenticated)
│   └── Hero → Features → CTA → Footer
│
├── Main Shell (authenticated)
│   ├── TopBar (persistent)
│   │   ├── Model Selector dropdown
│   │   ├── Swarm Status Indicator
│   │   ├── Voice Input toggle
│   │   ├── Language Toggle (AR/EN)
│   │   ├── Login / User Avatar
│   │   └── InstallPWA badge
│   │
│   ├── Sidebar (collapsible)
│   │   ├── Navigation Items (11):
│   │   │   ├── 𓂀 Home
│   │   │   ├── 𓁹 Integrated Editor
│   │   │   ├── 𓂋 Projects
│   │   │   ├── 𓊝 Workspace
│   │   │   ├── 𓃭 Compute
│   │   │   ├── 𓁲 Storage
│   │   │   ├── 𓊵 Settings
│   │   │   ├── 𓂀 Admin
│   │   │   ├── 𓁹 Templates
│   │   │   ├── 𓃭 Kings Tools
│   │   │   └── 𓁲 History
│   │   └── Chat History (recent 20 conversations)
│   │
│   ├── Content Area (view-switched)
│   │   ├── HomeView
│   │   │   ├── Status Pills (model, session, swarm)
│   │   │   ├── Tasks HUD (accordion)
│   │   │   ├── Goals HUD
│   │   │   ├── 𓂀 Eye Centerpiece (animated)
│   │   │   ├── ChatInput (persistent)
│   │   │   ├── Template Marquee
│   │   │   └── 3 Metric Cards (operations, tokens, errors)
│   │   │
│   │   ├── AmounEditor
│   │   │   ├── Monaco Editor (left pane)
│   │   │   ├── Chat Panel (right pane)
│   │   │   └── Terminal Output (bottom)
│   │   │
│   │   ├── LlmDashboard
│   │   │   ├── Summary Cards (4)
│   │   │   ├── Agent Cards (Amoun, Hermes, 7orus)
│   │   │   ├── Token Usage Chart
│   │   │   ├── Operations by Model Chart
│   │   │   └── Error Rate Trend
│   │   │
│   │   ├── SettingsView
│   │   │   ├── Model Management
│   │   │   ├── Theme Configuration
│   │   │   ├── Language & Region
│   │   │   ├── Data Management
│   │   │   └── About & Credits
│   │   │
│   │   ├── [Other Views: Projects, Workspace, Compute, Storage, Templates, Kings Tools, History]
│   │   └── LandingPageView (fallback)
│   │
│   └── MobileBottomNav (mobile only)
│       ├── Home
│       ├── Chat
│       ├── Editor
│       └── More (expanded menu)
│
└── Global Overlays
    ├── LoginModal
    ├── AddModelModal
    ├── ArtifactPanel (slide-in)
    ├── SummaryModal
    └── CommandPalette (Cmd+K)
```

---

## Navigation Flow

### Primary Navigation

| Trigger | Action | Target |
|---|---|---|
| Sidebar item click | View switch with page transition | Corresponding view |
| TopBar model selector | Dropdown opens | Model list (Gemini, GPT, Claude, Ollama) |
| Chat history item click | Load conversation | Chat area populated with messages |
| "New Chat" button | Reset chat state | Empty chat, focus on ChatInput |
| Mobile bottom nav | Tab switch | Corresponding view (4 primary) |
| Cmd/Ctrl + K | Command palette opens | Searchable action list |
| Back button (mobile) | Navigate back | Previous view or HomeView |

### Keyboard Shortcuts

| Shortcut | Action | Context |
|---|---|---|
| `Cmd/Ctrl + K` | Open command palette | Global |
| `Cmd/Ctrl + T` | New task | HomeView, Editor |
| `Cmd/Ctrl + N` | New chat | Any view |
| `Cmd/Ctrl + Shift + A` | Open AmounEditor | Any view |
| `Cmd/Ctrl + /` | Toggle sidebar | Shell |
| `Escape` | Close modal/overlay | When modal is open |
| `Cmd/Ctrl + Enter` | Send message | When ChatInput focused |

---

## Key Interaction Patterns

### Chat Flow

```
[User types in ChatInput]
    │
    ├──► Press Enter OR click Send
    │       │
    │       ▼
    │   [Message appears in chat with slide-up animation]
    │   [ChatInput clears, shows typing indicator]
    │   [Status pill updates: "Amoun is thinking..."]
    │
    ├──► Streaming response begins
    │       │
    │       ▼
    │   [Response renders word-by-word with fade-in]
    │   [Markdown parsed: headers, code blocks, lists, links]
    │   [Code blocks get syntax highlighting + copy button]
    │   [Timestamp badge appears]
    │
    ├──► Post-response processing (automatic)
    │       │
    │       ├── Task detected → Toast: "Task added" → Tasks HUD updates
    │       ├── Memory detected → Toast: "Memory saved" → Memory counter updates
    │       └── Tool call made → Toast: "Using [tool name]" → Inline indicator
    │
    └──► Follow-up: ChatInput refocused, scroll to bottom
```

**Interaction details:**
- ChatInput has auto-resize (min 1 line, max 6 lines)
- Paste images: converts to base64, preview thumbnail shown
- Voice input: microphone toggle, waveform visualization, auto-send option
- Stop generation: "Stop" button appears during streaming, aborts request

### Task Creation Flow

```
[User message contains actionable item]
    │
    ▼
[Amoun extracts task automatically]
    │
    ├──► Task appears in Tasks HUD (accordion)
    │   [Title, priority badge, source: "from chat"]
    │   [Status: pending → in-progress → completed]
    │
    ├──► User clicks task → Task detail expands
    │   [Description, subtasks, related messages]
    │   [Actions: Edit, Delete, Mark Complete]
    │
    └──► Task completion → Animation: checkmark, confetti micro-effect
        [Toast: "Task completed — Great work!"]
```

### Model Switching Flow

```
[User clicks Model Selector in TopBar]
    │
    ▼
[Dropdown opens with glassmorphic styling]
    │
    ├── Current model highlighted with teal glow
    ├── Available models listed with provider icons
    ├── Each model shows: name, provider, status (active/rate-limited/error)
    │
    ├──► Select different model
    │       │
    │       ▼
    │   [Transition animation: brief fade]
    │   [Status pill updates: "Switched to Gemini Pro"]
    │   [Chat history preserved, new messages use new model]
    │   [Toast: "Model switched — your context is preserved"]
    │
    └──► Click "Add Model"
            │
            ▼
        [AddModelModal opens]
        [Provider selection → API key input → Test connection → Save]
```

### Artifact Preview Flow

```
[Amoun generates artifact: code, image, document]
    │
    ▼
[Artifact indicator appears in message]
    │
    ├──► Click artifact → ArtifactPanel slides in from right
    │   [Full preview with syntax highlighting]
    │   [Actions: Copy, Download, Open in Editor]
    │   [Version history if edited]
    │
    └──► Close → Panel slides out, returns to chat
```

---

## Responsive Behavior

### Mobile (< 768px)

| Element | Behavior |
|---|---|
| **Sidebar** | Hidden by default. Opens as overlay (full-height, 280px width) via hamburger menu. Closes on item selection or tap-outside. |
| **TopBar** | Compact: logo + hamburger + model name + voice toggle + login. Settings move to "More" in bottom nav. |
| **BottomNav** | Visible: 4 tabs (Home, Chat, Editor, More). Fixed bottom, 56px height. Active tab has teal glow. |
| **HomeView** | Stacked layout. Eye centerpiece smaller (120px). Metric cards horizontal scroll. Tasks/Goals in tabs instead of side-by-side. |
| **ChatInput** | Full-width, fixed above BottomNav. Send button prominent. |
| **AmounEditor** | Tab-based: Editor / Chat / Terminal (not split pane). Swipe between tabs. |
| **LlmDashboard** | Cards stacked. Charts full-width, scrollable. Agent cards in horizontal carousel. |
| **Modals** | Full-screen on mobile, sheet-style from bottom. |
| **Marquee** | Single template visible, swipe to browse. |

### Tablet (768px – 1024px)

| Element | Behavior |
|---|---|
| **Sidebar** | Collapsible (icon-only: 64px). Expands on hover or toggle. |
| **TopBar** | Full TopBar visible, all controls accessible. |
| **BottomNav** | Hidden. |
| **AmounEditor** | Split pane: 50/50 on landscape, stacked on portrait. |
| **LlmDashboard** | 2×2 grid for summary cards. Charts side-by-side. |

### Desktop (> 1024px)

| Element | Behavior |
|---|---|
| **Sidebar** | Always visible (256px). Collapsible via toggle button. |
| **TopBar** | Full TopBar with all controls. |
| **AmounEditor** | Full split pane: editor 60% / chat 40%. Resizable divider. Terminal as bottom panel. |
| **LlmDashboard** | Full grid layout. Agent cards in row. Charts side-by-side with legend. |
| **Command Palette** | Available via Cmd+K. |

---

## Animation & Motion Guidelines

### Design Principles

1. **Purposeful motion** — Every animation serves a function: guide attention, provide feedback, establish spatial relationships.
2. **Consistent timing** — All animations use the same timing system (see tokens below). No arbitrary durations.
3. **Respectful of preference** — All animations disabled when `prefers-reduced-motion: reduce` is set.
4. **Performance-first** — Only animate `transform` and `opacity`. Never animate `width`, `height`, or `layout` properties directly (use `layout` prop in Framer Motion).

### Animation Tokens

| Token | Value | Usage |
|---|---|---|
| `duration-instant` | 100ms | Button press feedback, toggle switches |
| `duration-fast` | 200ms | Tooltip appearance, badge animations |
| `duration-normal` | 300ms | Page transitions, modal open/close, accordion |
| `duration-slow` | 500ms | Eye centerpiece pulse, skeleton fade |
| `duration-grand` | 800ms | Landing page hero entrance |
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Enter animations (elements appearing) |
| `ease-in` | `cubic-bezier(0.55, 0, 1, 0.45)` | Exit animations (elements disappearing) |
| `ease-in-out` | `cubic-bezier(0.45, 0, 0.55, 1)` | Repeated animations (pulses, breathing) |
| `stagger-children` | 50ms | Sequential appearance of list items, cards |
| `spring-bouncy` | `{ stiffness: 300, damping: 20 }` | Playful interactions (task complete, toast entrance) |
| `spring-smooth` | `{ stiffness: 200, damping: 25 }` | Modal transitions, panel slides |

### Animated Elements Inventory

| Element | Animation | Trigger | Purpose |
|---|---|---|---|
| 𓂀 Eye Centerpiece | Slow pulse + iris rotation (4s cycle) | Always (HomeView) | Brand identity, alive feeling |
| Page transitions | Slide + fade (300ms, ease-out) | View switch | Spatial orientation |
| Chat messages | Slide up + fade in (200ms, stagger 50ms) | New message | Temporal order |
| Status pills | Scale in (200ms, spring-bouncy) | State change | Feedback |
| Sidebar | Slide left/right (300ms, ease-out) | Toggle | Spatial awareness |
| Modals | Fade backdrop + scale content (300ms) | Open/close | Focus management |
| Task completion | Checkmark draw + confetti particles | Task marked done | Reward/celebration |
| Template marquee | Horizontal scroll (CSS animation, 30s loop) | Always (HomeView) | Discovery |
| Skeleton screens | Shimmer pulse (1.5s, ease-in-out) | Loading state | Anticipation |
| Error messages | Shake + fade in (400ms) | Error occurrence | Attention |
| Toast notifications | Slide in from top-right + auto-dismiss (3s) | System events | Non-blocking feedback |
| Swarm indicator | Breathing glow (2s cycle) | Active swarm | System status awareness |
| Glow effects | Pulsing shadow (3s cycle) | Hover on accent elements | Interactivity hint |
| Cyber grid background | Subtle parallax on mouse move (desktop only) | Mouse movement | Depth/atmosphere |
| Gradient circles | Slow drift + blend (10s cycle) | Always (background) | Atmosphere |

### Reduced Motion Mode

When `prefers-reduced-motion: reduce` is active:
- All motion durations → 0ms (instant state changes)
- Eye centerpiece: static (no pulse, no rotation)
- Cyber grid: no parallax
- Gradient circles: static positions
- Page transitions: instant switch (no slide/fade)
- Chat messages: appear instantly (no stagger)
- Toasts: appear instantly, still auto-dismiss after 3s
- Skeleton screens: solid color (no shimmer)

---

## Error States & Empty States

### HomeView

| State | Display | Recovery Action |
|---|---|---|
| **No model configured** | "Connect an AI model to get started" + [Add Model] CTA | Opens AddModelModal |
| **No messages** | Eye centerpiece prominent, "Ask Amoun anything" placeholder in ChatInput, template marquee visible | User types message |
| **API key invalid** | Error pill: "Model connection failed — check your API key" | [Fix in Settings] button |
| **Rate limited** | Warning pill: "Rate limit reached — wait 60s or switch model" | Countdown timer, [Switch Model] |
| **Network offline** | Error banner: "You're offline — messages will queue" | Auto-retry when online |
| **All tasks completed** | "All clear — no pending tasks. 𓂀" + celebratory micro-animation | — |

### Chat Area

| State | Display | Recovery Action |
|---|---|---|
| **Empty conversation** | "Start a conversation with Amoun" + template suggestions | Click template or type |
| **Streaming error** | Partial message shown, red indicator: "Response interrupted" | [Retry] button |
| **Model timeout** | "Amoun took too long to respond — try again" | [Retry] button, auto-switch suggestion |
| **Content filtered** | "Response was filtered for safety" | Inform user, suggest rephrase |

### AmounEditor

| State | Display | Recovery Action |
|---|---|---|
| **No file open** | "Open a file or start coding with Amoun" + [New File] CTA | — |
| **Parse error** | Red underline in Monaco, error panel at bottom | Click error → jump to line |
| **No agent response** | "Waiting for Amoun..." spinner in chat pane | — |

### LlmDashboard

| State | Display | Recovery Action |
|---|---|---|
| **No data** | "No analytics data yet — start using Wazeer OS to see metrics" | — |
| **All zeros** | "Metrics will populate as you interact with Amoun" | — |
| **Chart error** | Fallback: "Chart unavailable" + [Reload Dashboard] | Refresh data |

### SettingsView

| State | Display | Recovery Action |
|---|---|---|
| **No models added** | "No AI models configured" + [Add Model] CTA | Opens AddModelModal |
| **Save failed** | Error toast: "Settings could not be saved — try again" | [Retry] button |
| **Import failed** | Error toast: "Invalid file format — expected .json" | — |

### History View

| State | Display | Recovery Action |
|---|---|---|
| **No history** | "No conversation history" + Eye of Horus illustration | Start chatting |
| **Search no results** | "No conversations match your search" | Clear search |

---

## Loading States & Skeleton Screens

### Skeleton Screen Specifications

All skeleton screens use the same component: `SkeletonPulse` with:
- Background: `bg-white/5` (matches theme)
- Shimmer: animated gradient from `bg-white/0` → `bg-white/10` → `bg-white/0`
- Duration: 1.5s, infinite loop
- Border-radius: matches the element being skeletonized

### Per-View Skeletons

#### HomeView Loading
```
┌──────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓  ▓▓▓▓▓▓  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← Status pills (3 rectangles)
│                                      │
│         ▓▓▓▓▓▓▓▓▓▓▓                 │  ← Eye placeholder (circle)
│                                      │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← Tasks HUD
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│                                      │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← ChatInput placeholder
└──────────────────────────────────────┘
```

#### LlmDashboard Loading
```
┌──────────┬──────────┬──────────┬──────────┐
│ ▓▓▓▓▓▓▓▓ │ ▓▓▓▓▓▓▓▓ │ ▓▓▓▓▓▓▓▓ │ ▓▓▓▓▓▓▓▓ │  ← 4 metric cards
├──────────┴──────────┼──────────┴──────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← Agent cards
├─────────────────────┼─────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← Charts
└─────────────────────┴─────────────────────┘
```

### Loading Indicator Types

| Type | Usage | Specification |
|---|---|---|
| **Spinner** | Inline loading (buttons, small areas) | 20px, teal stroke, 1s rotation, `animate-spin` |
| **Pulse dots** | Chat typing indicator | 3 dots (8px), sequential pulse (1.5s cycle, 300ms stagger) |
| **Progress bar** | File operations, bulk actions | Full-width, teal gradient, indeterminate or percent |
| **Skeleton screen** | View loading, data fetching | Shimmer effect as described above |
| **Eye pulse** | Wazeer OS brand loading | 𓂀 scaled 1.0→1.1→1.0 (2s cycle) with teal glow |

### Loading Timing Rules

| Scenario | Max time before skeleton | Max time before error state |
|---|---|---|
| Local data load (IndexedDB) | 200ms | 5s |
| AI model response | 500ms (show typing indicator) | 60s (timeout) |
| Settings save | 100ms | 10s |
| Theme change | Instant (0ms) | N/A |
| Chart data aggregation | 300ms | 5s |
| PWA update check | Background, no UI | N/A |

---

## Onboarding Flow

### Onboarding Architecture

The onboarding flow is a multi-step wizard rendered as a centered modal overlay. It uses `localStorage` key `wazeer_onboarding_complete` to track completion. Steps are stored in `onboardingStep` Zustand store.

### Step 1: Welcome (العربية / English)

```
┌────────────────────────────────────────┐
│                                        │
│              𓂀                        │
│         (animated, 2s entrance)        │
│                                        │
│      "Welcome to Wazeer OS"            │
│      "مرحباً بك في وزير OS"            │
│                                        │
│   "Your personal AI assistant,        │
│    powered by ancient wisdom and       │
│    modern technology."                 │
│                                        │
│   ┌─────────────┐  ┌─────────────┐    │
│   │   العربية    │  │   English    │    │
│   └─────────────┘  └─────────────┘    │
│                                        │
│           [Continue →]                 │
│                                        │
│         1 — ● — ○ — ○                 │
│                                        │
└────────────────────────────────────────┘
```

- Language selection sets `i18n.locale` globally
- RTL layout applies immediately if Arabic selected
- Step indicator shows progress (1/3, 2/3, 3/3)

### Step 2: Configure Model

```
┌────────────────────────────────────────┐
│                                        │
│    "Choose Your AI Model"              │
│    "اختر نموذج الذكاء الاصطناعي"      │
│                                        │
│  ┌──────────┐ ┌──────────┐           │
│  │ ✦ Gemini  │ │ ✦ GPT    │           │
│  │   Pro     │ │   4o     │           │
│  │  [Select] │ │  [Select]│           │
│  └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐           │
│  │ ✦ Claude  │ │ ✦ Ollama │           │
│  │  3.5      │ │  (Local) │           │
│  │  [Select] │ │  [Select]│           │
│  └──────────┘ └──────────┘           │
│                                        │
│  [Skip — use defaults]                │
│                                        │
│         [Continue →]                   │
│                                        │
│         ○ — ● — ○                     │
│                                        │
└────────────────────────────────────────┘
```

- API key input appears when a cloud model is selected
- "Skip" uses the default Gemini model with demo key (rate-limited)
- Connection test runs in background, status indicator shown

### Step 3: Quick Tour

```
┌────────────────────────────────────────┐
│                                        │
│    "Take a Quick Tour"                 │
│    "جولة سريعة"                        │
│                                        │
│   [Animated mockup of the interface]   │
│   [Hotspots highlight: sidebar, top    │
│    bar, chat input, tasks HUD]         │
│                                        │
│   "Click highlighted areas to learn    │
│    more, or skip to start using        │
│    Wazeer OS."                         │
│                                        │
│   [← Back]    [Skip Tour]  [Finish ✓] │
│                                        │
│         ○ — ○ — ●                     │
│                                        │
└────────────────────────────────────────┘
```

- Each hotspot shows a tooltip on hover/tap explaining the feature
- "Skip Tour" completes onboarding instantly
- "Finish" sets `wazeer_onboarding_complete = true`

### Post-Onboarding

After onboarding completes:
1. HomeView renders with personalized greeting
2. First-use tooltip appears over ChatInput (3s, then auto-dismiss)
3. Template marquee starts scrolling
4. Status pills animate in (stagger, 100ms each)

### Onboarding Recovery

- If user closes browser during onboarding, `onboardingStep` persists
- On return, wizard resumes from last completed step
- "Reset onboarding" available in Settings → Advanced → Data Management
- Force-show on `onboardingStep = -1` (dev mode)

---

## Appendix: Micro-interaction Inventory

### Button Interactions

| State | Visual | Animation |
|---|---|---|
| Default | Teal border, transparent bg | — |
| Hover | Teal bg/10, glow shadow | `duration-fast` |
| Active/Press | Scale 0.97 | `duration-instant` |
| Disabled | Gray-500, no pointer | — |
| Loading | Spinner replaces text | Spinner `animate-spin` |

### Input Interactions

| State | Visual | Animation |
|---|---|---|
| Default | Dark bg, white/10 border | — |
| Focus | Teal border, glow shadow | `duration-fast` |
| Error | Red border, error message below | Shake `duration-normal` |
| Success | Green border flash | Fade `duration-fast` |
| Typing | No animation | — |

### Card Interactions

| State | Visual | Animation |
|---|---|---|
| Default | Glassmorphic, white/10 border | — |
| Hover | Border white/20, subtle lift (translateY -2px) | `duration-normal` |
| Selected | Teal border, teal glow | `duration-normal` |

### Toggle Interactions

| State | Visual | Animation |
|---|---|---|
| Off | Gray track, dark thumb | — |
| On | Teal track, white thumb | Spring `spring-bouncy` |
| Transition | Thumb slides | `duration-fast` |

---

*Document 𓂀 Wazeer OS UX Specification v2.0.0-Rewrite*  
*© 2025 100MillionDEV / العرآب — All Rights Reserved*
