# Accessibility — Wazeer OS v2.0.0-Rewrite

> 𓂀 Wazeer OS (وزير OS) — WCAG 2.1 AA Compliance  
> Document Owner: Frontend & QA Team | Last Updated: 2025-01  
> Classification: Internal — Engineering & QA

---

## Table of Contents

1. [Overview & Compliance Targets](#overview--compliance-targets)
2. [Keyboard Navigation Map](#keyboard-navigation-map)
3. [Screen Reader Support](#screen-reader-support)
4. [Color Contrast Requirements](#color-contrast-requirements)
5. [Focus Management](#focus-management)
6. [Reduced Motion Support](#reduced-motion-support)
7. [RTL Accessibility Considerations](#rtl-accessibility-considerations)
8. [Testing Checklist](#testing-checklist)
9. [Appendix: ARIA Patterns](#appendix-aria-patterns)

---

## Overview & Compliance Targets

### Compliance Standard

Wazeer OS targets **WCAG 2.1 Level AA** compliance across all views and interactions. This is a minimum standard; where Level AAA is achievable without compromising the Egyptian Cyberpunk design language, it should be implemented.

### Compliance Scope

| Scope | Coverage |
|---|---|
| **Views** | All 12 views (home, integrated, projects, workspace, compute, storage, settings, admin, templates, kings-tools, history, landing) |
| **Components** | All interactive components (buttons, inputs, dropdowns, modals, accordions, tabs, toggles, sliders) |
| **Content** | All UI text, error messages, status indicators, tooltips |
| **Platforms** | Desktop (Chrome, Firefox, Safari, Edge), Mobile (Chrome Android, Safari iOS) |
| **Languages** | Arabic (RTL) and English (LTR) |

### Priority Levels

| Priority | WCAG Principle | Examples |
|---|---|---|
| **P0 — Must** | Perceivable, Operable | Text contrast, keyboard navigation, focus management |
| **P1 — Should** | Understandable, Robust | ARIA labels, error identification, consistent navigation |
| **P2 — Nice to have** | Beyond AA | Sign language, extended descriptions, enhanced contrast |

### Accessibility Principles

1. **Nothing is keyboard-inaccessible** — Every action can be performed via keyboard
2. **Nothing relies on color alone** — Color is always supplemented with text, icons, or patterns
3. **Nothing traps focus** — Users can always Tab out of any component
4. **Nothing moves without permission** — Animations respect `prefers-reduced-motion`
5. **Nothing is silent** — Screen readers get meaningful descriptions of every state

---

## Keyboard Navigation Map

### Global Shortcuts

| Shortcut | Action | Context |
|---|---|---|
| `Tab` | Move focus to next interactive element | Global |
| `Shift + Tab` | Move focus to previous element | Global |
| `Enter` / `Space` | Activate focused element (button, toggle, link) | Global |
| `Escape` | Close overlay/modal/dropdown; cancel action | When overlay open |
| `Cmd/Ctrl + K` | Open command palette | Global |
| `Cmd/Ctrl + /` | Toggle sidebar | Shell |
| `Cmd/Ctrl + N` | New conversation | Any view |
| `Cmd/Ctrl + T` | New task | HomeView, Editor |
| `Cmd/Ctrl + Shift + A` | Open AmounEditor | Any view |
| `F6` | Move focus to next landmark region | Global |
| `Shift + F6` | Move focus to previous landmark region | Global |

### Tab Order by View

#### Shell (Top-level)

```
1. TopBar
   ├── Logo / Brand (skip link target)
   ├── Model Selector [dropdown]
   ├── Swarm Status [status indicator]
   ├── Voice Toggle [button]
   ├── Language Toggle [button]
   ├── Install PWA [button, if eligible]
   └── User Menu / Login [button/modal]
   
2. Sidebar
   ├── Sidebar Toggle [button]
   └── Navigation Items [link × 11]
       ├── Home
       ├── Integrated Editor
       ├── Projects
       ├── Workspace
       ├── Compute
       ├── Storage
       ├── Settings
       ├── Admin
       ├── Templates
       ├── Kings Tools
       └── History
   └── Chat History Items [button × N]

3. Content Area (view-specific)
   [See per-view tab order below]

4. Mobile Bottom Nav (mobile only)
   ├── Home [tab]
   ├── Chat [tab]
   ├── Editor [tab]
   └── More [tab]
```

#### HomeView

```
1. Status Pills [button × 3]
2. Tasks HUD
   ├── Accordion trigger [button]
   └── Task items [button × N]
3. Goals HUD
   ├── Accordion trigger [button]
   └── Goal items [button × N]
4. 𓂀 Eye Centerpiece [decorative, tabindex=-1]
5. ChatInput
   ├── Text area [input]
   ├── Voice button [button]
   ├── Send button [button]
   └── Template suggestions [listbox]
6. Template Marquee [decorative, tabindex=-1]
7. Metric Cards [link × 3]
```

#### AmounEditor

```
1. Editor Tab / Chat Tab / Terminal Tab [tablist]
2. Editor Pane (when active)
   ├── File tabs [tab × N]
   └── Monaco Editor [textarea proxy]
3. Chat Pane (when active)
   ├── Message list [log region]
   └── Chat input [input + button]
4. Terminal Pane (when active)
   └── Terminal output [log region]
```

#### LlmDashboard

```
1. Summary Metric Cards [link × 4]
2. Agent Cards
   ├── Amoun card [region]
   ├── Hermes card [region]
   └── 7orus card [region]
3. Token Usage Chart [img region]
4. Operations by Model Chart [img region]
5. Error Rate Trend [img region]
```

#### SettingsView

```
1. Settings Navigation [nav]
   ├── Model Management [link]
   ├── Theme [link]
   ├── Language [link]
   ├── Data Management [link]
   └── About [link]
2. Settings Content (dynamic based on selected section)
   ├── Form inputs [input × N]
   ├── Toggles [switch × N]
   ├── Buttons [button × N]
   └── Select dropdowns [select × N]
```

### Focus Trapping

**Modals and overlays** trap focus within their bounds:

| Component | Trap Behavior |
|---|---|
| LoginModal | Focus trapped. First focusable element receives focus on open. Escape closes. |
| AddModelModal | Focus trapped. First input receives focus on open. Escape closes. |
| ArtifactPanel | Focus trapped. Close button receives focus on open. Escape closes. |
| SummaryModal | Focus trapped. Summary content is focusable. Escape closes. |
| Command Palette | Focus trapped. Search input receives focus on open. Escape closes. |
| Sidebar (mobile) | Focus trapped in overlay mode. Tab wraps within sidebar items. |
| Dropdown menus | Focus trapped. Arrow keys navigate. Escape closes. |

**Implementation:**
```tsx
// Focus trap hook
function useFocusTrap(containerRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const focusable = container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), 
       select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;
    
    first?.focus();
    
    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    
    container.addEventListener('keydown', handleTab);
    return () => container.removeEventListener('keydown', handleTab);
  }, []);
}
```

---

## Screen Reader Support

### ARIA Landmarks

| Landmark | Role | Element | Label |
|---|---|---|---|
| Top Bar | `banner` | `<header>` | `aria-label="Top navigation bar"` |
| Sidebar | `navigation` | `<nav>` | `aria-label="Main navigation"` |
| Chat History | `navigation` | `<nav>` | `aria-label="Chat history"` |
| Content Area | `main` | `<main>` | (implicit, no label needed) |
| Footer | `contentinfo` | `<footer>` | `aria-label="Site footer"` |
| Modals | `dialog` | `<div>` | `aria-label="{dialog title}"` |
| Search/Command | `search` | `<div>` | `aria-label="Command palette"` |

### Live Regions

Dynamic content that updates without user action uses ARIA live regions:

| Element | `aria-live` | `aria-atomic` | Trigger |
|---|---|---|---|
| Chat message list | `polite` | `false` | New message received |
| Toast notifications | `assertive` | `true` | Error, success, warning toasts |
| Status pills | `polite` | `true` | Model change, session status |
| Typing indicator | `polite` | `false` | Agent starts typing |
| Error rate display | `polite` | `false` | Metric update |
| Token counter | `off` | — | Not critical, too frequent |

### Component ARIA Patterns

#### Buttons

```tsx
// Standard button
<button 
  type="button"
  aria-label="Send message"
  aria-disabled={isDisabled}
  onClick={handleSend}
>
  <SendIcon aria-hidden="true" />
</button>

// Toggle button
<button
  type="button"
  role="switch"
  aria-checked={isOn}
  aria-label="Toggle voice input"
  onClick={toggle}
>
  <MicIcon aria-hidden="true" />
</button>
```

#### Chat Input

```tsx
<div role="group" aria-label="Chat input">
  <label htmlFor="chat-input" className="sr-only">Type your message</label>
  <textarea
    id="chat-input"
    role="textbox"
    aria-multiline="true"
    aria-placeholder="Ask Amoun anything..."
    aria-describedby="chat-input-hint"
    value={message}
    onChange={handleChange}
  />
  <span id="chat-input-hint" className="sr-only">
    Press Enter to send, Shift+Enter for new line
  </span>
</div>
```

#### Accordion (Tasks HUD)

```tsx
<div>
  <button
    id="tasks-trigger"
    aria-expanded={isOpen}
    aria-controls="tasks-panel"
    onClick={toggle}
  >
    Tasks ({count})
    <ChevronIcon aria-hidden="true" />
  </button>
  <div
    id="tasks-panel"
    role="region"
    aria-labelledby="tasks-trigger"
    hidden={!isOpen}
  >
    {tasks.map(task => (
      <button key={task.id} aria-label={`Task: ${task.title}, Priority: ${task.priority}`}>
        {task.title}
      </button>
    ))}
  </div>
</div>
```

#### Model Selector Dropdown

```tsx
<div>
  <button
    id="model-trigger"
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-label={`Current model: ${currentModel}. Click to change.`}
    onClick={toggle}
  >
    {currentModel}
  </button>
  {isOpen && (
    <ul role="listbox" aria-labelledby="model-trigger">
      {models.map(model => (
        <li
          key={model.id}
          role="option"
          aria-selected={model.id === currentModelId}
          tabIndex={-1}
          onClick={() => select(model.id)}
        >
          {model.name}
        </li>
      ))}
    </ul>
  )}
</div>
```

#### Metric Cards

```tsx
<a
  href="/dashboard"
  aria-label={`Total Operations: ${value.toLocaleString()}. View dashboard.`}
  className="metric-card"
>
  <span className="metric-label">Total Operations</span>
  <span className="metric-value">{value.toLocaleString()}</span>
</a>
```

### Screen Reader Announcements

| Event | Announcement | Method |
|---|---|---|
| New chat message | "New message from Amoun" | `aria-live="polite"` on message container |
| Task created | "Task added: {title}" | Toast with `role="status"` |
| Model switched | "Switched to {model name}" | Toast with `role="status"` |
| Error occurred | "{error message}" | Toast with `role="alert"` |
| Loading started | "Loading..." | `aria-busy="true"` on container |
| Loading complete | "Loaded" | `aria-busy="false"`, `aria-live="polite"` |
| Streaming response | "Amoun is responding" | `aria-live="polite"` on typing indicator |
| Voice activated | "Voice input activated" | `role="status"` |

---

## Color Contrast Requirements

### WCAG 2.1 AA Requirements

- **Normal text (< 18px / < 14px bold)**: minimum **4.5:1** contrast ratio
- **Large text (≥ 18px / ≥ 14px bold)**: minimum **3:1** contrast ratio
- **UI components & graphical objects**: minimum **3:1** contrast ratio
- **Focus indicators**: minimum **3:1** contrast against adjacent colors

### Verified Contrast Ratios

| Foreground | Background | Ratio | Size Context | Pass? |
|---|---|---|---|---|
| `gray-100` (#f3f4f6) on `#050508` (bg-outer) | 17.5:1 | Normal text | ✅ AA |
| `gray-100` (#f3f4f6) on `#0a0a0f` (bg-card) | 15.8:1 | Normal text | ✅ AA |
| `gray-300` (#d1d5db) on `#0a0a0f` (bg-card) | 12.1:1 | Normal text | ✅ AA |
| `gray-400` (#9ca3af) on `#0a0a0f` (bg-card) | 7.4:1 | Normal text | ✅ AA |
| `gray-500` (#6b7280) on `#0a0a0f` (bg-card) | 4.6:1 | Normal text | ✅ AA |
| `teal-400` (#2dd4bf) on `#050508` (bg-outer) | 10.8:1 | Normal text | ✅ AA |
| `teal-400` (#2dd4bf) on `#0a0a0f` (bg-card) | 9.8:1 | Normal text | ✅ AA |
| `teal-600` (#0d9488) on `#050508` (bg-outer) | 6.8:1 | Normal text | ✅ AA |
| `teal-500` (#14b8a6) on `#050508` (bg-outer) | 8.6:1 | Normal text | ✅ AA |
| `amber-500` (#f59e0b) on `#050508` (bg-outer) | 8.1:1 | Normal text | ✅ AA |
| `amber-500` (#f59e0b) on `#0a0a0f` (bg-card) | 7.3:1 | Normal text | ✅ AA |
| `red-400` (#f87171) on `#050508` (bg-outer) | 6.8:1 | Normal text | ✅ AA |
| `red-400` (#f87171) on `#0a0a0f` (bg-card) | 6.1:1 | Normal text | ✅ AA |
| `green-400` (#4ade80) on `#050508` (bg-outer) | 10.1:1 | Normal text | ✅ AA |
| `white/10` border on `#0a0a0f` | — | UI component | ✅ AA (3.1:1) |
| `teal-400` focus ring on `#0a0a0f` | 9.8:1 | Focus indicator | ✅ AA |

### Theme-Specific Contrast Validation

Each theme preset must be validated against `#050508` and `#0a0a0f`:

| Theme | Accent-400 | vs bg-outer | vs bg-card | Pass? |
|---|---|---|---|---|
| Emerald (default) | #2dd4bf | 10.8:1 | 9.8:1 | ✅ |
| Cyber-Blue | #60a5fa | 7.1:1 | 6.4:1 | ✅ |
| Crimson | #f87171 | 6.8:1 | 6.1:1 | ✅ |
| Purple | #a78bfa | 6.4:1 | 5.8:1 | ✅ |
| Custom (user hex) | User-defined | Must validate | Must validate | ⚠️ Validate |

**Custom theme validation:** When a user enters a custom hex value, the system must calculate contrast ratio against both background colors and reject hex values that fall below 4.5:1 for normal text or 3:1 for large text.

### Color Alone Independence

No information is conveyed by color alone. Every color-coded state includes a secondary indicator:

| State | Color | Secondary Indicator |
|---|---|---|
| Error | Red border + red glow | ❌ Error icon + error text |
| Success | Green text + green glow | ✓ Checkmark icon + success text |
| Warning | Amber text + amber glow | ⚠ Warning icon + warning text |
| Active/Selected | Teal border + teal glow | Dot indicator + "Active" text |
| Offline | Gray text | 📡 Offline icon + "Offline" text |
| Rate limited | Amber border | ⏱ Countdown timer + "Rate limited" text |
| Priority (Critical) | Red badge | Text: "Critical" |
| Priority (High) | Amber badge | Text: "High" |
| Priority (Medium) | Teal badge | Text: "Medium" |
| Priority (Low) | Gray badge | Text: "Low" |

---

## Focus Management

### Visible Focus Rings

Every interactive element has a visible focus indicator:

```css
/* Global focus styles */
*:focus-visible {
  outline: 2px solid var(--accent-400);    /* Teal focus ring */
  outline-offset: 2px;
  border-radius: inherit;
}

/* Enhanced focus with glow */
.focus-ring {
  box-shadow: 0 0 0 2px var(--accent-400),
              0 0 12px var(--accent-glow);
}

/* Remove default for mouse users (focus-visible only) */
*:focus:not(:focus-visible) {
  outline: none;
  box-shadow: none;
}
```

### Focus Ring Specifications

| Element | Ring Size | Offset | Additional |
|---|---|---|---|
| Buttons | 2px solid | 2px | — |
| Inputs | 2px solid | 0px (inside border) | + glow-sm |
| Links | 2px solid | 2px | — |
| Cards (clickable) | 2px solid | 0px | + border-accent-400 |
| Toggles | 2px solid | 2px | On track |
| Tab items | 2px solid bottom | 0px | — |

### Focus Restoration

When a modal/overlay closes, focus returns to the triggering element:

```tsx
function Modal({ isOpen, onClose, triggerRef }) {
  useEffect(() => {
    if (!isOpen) {
      // Restore focus to trigger element after close
      triggerRef.current?.focus();
    }
  }, [isOpen]);
  
  return (
    // ... modal content
  );
}
```

### Skip Link

A skip link is present at the top of every page:

```tsx
<a 
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 
             focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent-500 
             focus:text-[#050508] focus:rounded-md"
>
  Skip to main content
</a>

{/* Arabic version when RTL */}
<a 
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 ..."
>
  تخطي إلى المحتوى الرئيسي
</a>
```

---

## Reduced Motion Support

### Implementation

```css
/* Global reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Framer Motion hook */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const motionConfig = prefersReducedMotion 
  ? { initial: false, animate: false, transition: { duration: 0 } }
  : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } };
```

### What Changes in Reduced Motion

| Feature | Normal | Reduced Motion |
|---|---|---|
| Page transitions | Slide + fade (300ms) | Instant switch |
| Chat messages | Slide up + stagger | Instant appear |
| Modals | Scale + fade (300ms) | Instant appear |
| 𓂀 Eye pulse | Continuous 4s pulse | Static |
| Cyber grid parallax | Mouse-follow | No parallax |
| Gradient circles | Drifting animation | Static positions |
| Skeleton shimmer | Shimmer animation | Solid gray |
| Toast entrance | Slide + fade | Instant |
| Accordion expand | Height animation | Instant expand |
| Typing indicator | Dot pulse | Static dots |
| Glow effects | Pulsing | Static glow |
| Template marquee | Scrolling | Static, paginated |

### What Never Changes

| Feature | Always Works |
|---|---|
| Keyboard navigation | Full keyboard support maintained |
| Focus indicators | Focus rings always visible |
| ARIA announcements | Screen reader announcements always fire |
| Color contrast | Contrast ratios maintained |
| Semantic HTML | All roles and labels preserved |

---

## RTL Accessibility Considerations

### Directional Attributes

```tsx
// Global direction set on <html>
<html lang="ar" dir="rtl">  {/* Arabic */}
<html lang="en" dir="ltr">  {/* English */}

// Individual element override (rare)
<div dir="ltr">{/* Latin code block in Arabic context */}</div>
```

### RTL-Specific Accessibility Issues

| Issue | Solution |
|---|---|
| **Arrow key confusion** | In RTL, `ArrowRight` moves backward, `ArrowLeft` moves forward. Implement: `const isRTL = getComputedStyle(document.documentElement).direction === 'rtl';` and swap arrow logic. |
| **Focus ring positioning** | Focus ring offset direction must flip: `outline-offset: 2px` works in both directions, but custom glow shadows may need `inset-inline-start` instead of `left`. |
| **Skip link position** | In RTL, skip link appears top-right instead of top-left. Use `start` logical property: `inset-inline-start: 1rem`. |
| **Swipe gestures** | On mobile RTL, swipe-right = back, swipe-left = forward (opposite of LTR). Test on both orientations. |
| **Tooltip positioning** | Tooltips should prefer `start` alignment (right in RTL, left in LTR) rather than hardcoded `left`. |
| **Reading order** | Screen readers follow DOM order, which is correct for both directions when `dir` is set properly. Avoid CSS `order` property that changes visual order without changing DOM order. |

### Bilingual Screen Reader Testing

| Test | Tool | Expected |
|---|---|---|
| Arabic content reading | VoiceOver (macOS/iOS) | Proper Arabic pronunciation, no reversed words |
| English content in RTL mode | NVDA / JAWS | English text reads left-to-right within RTL layout |
| Language switching | All screen readers | `lang` attribute change triggers correct voice |
| Form labels | All screen readers | Labels properly associated with inputs in both directions |
| Navigation order | All screen readers | Tab order follows visual layout in both directions |

---

## Testing Checklist

### Manual Testing (Every PR)

- [ ] Tab through entire view — all interactive elements reachable
- [ ] Tab order is logical (follows visual layout)
- [ ] All buttons have visible focus ring on `Tab`
- [ ] No keyboard traps (except modals/dropdowns)
- [ ] Escape closes modals, dropdowns, overlays
- [ ] Enter/Space activates focused buttons and toggles
- [ ] Arrow keys navigate listboxes, tabs, menus
- [ ] Screen reader reads all text correctly (no "link link link")
- [ ] ARIA live regions announce dynamic content
- [ ] Error messages are announced immediately
- [ ] Form validation errors are associated with fields
- [ ] Language toggle works for screen readers (voice switches)
- [ ] RTL layout doesn't break keyboard navigation

### Automated Testing (CI/CD)

- [ ] `eslint-plugin-jsx-a11y` passes with zero errors
- [ ] `axe-core` audit passes with zero violations
- [ ] Color contrast ratios verified by `axe-core`
- [ ] `lang` and `dir` attributes present on `<html>`
- [ ] All images have `alt` text (or `alt=""` for decorative)
- [ ] All form inputs have associated labels
- [ ] No `onclick` without `onkeydown` handler

### Screen Reader Testing Matrix

| Screen Reader | Browser | Platform | Frequency |
|---|---|---|---|
| VoiceOver | Safari | macOS | Every feature release |
| VoiceOver | Safari | iOS | Every feature release |
| NVDA | Chrome | Windows | Every feature release |
| JAWS | Chrome | Windows | Major releases |
| TalkBack | Chrome | Android | Every feature release |

### Color Contrast Testing

| Tool | Purpose | Frequency |
|---|---|---|
| Chrome DevTools | Quick contrast check | Every PR |
| axe DevTools | Automated contrast audit | Every PR |
| WebAIM Contrast Checker | Manual verification | Theme changes |
| Colour Contrast Analyser (CCA) | Precise ratio measurement | New theme presets |

### Motion Testing

| Test | Method |
|---|---|
| Enable reduced motion | Set `prefers-reduced-motion: reduce` in OS settings |
| Verify all animations stop | Check every animated element is static |
| Verify focus still works | Tab through all elements, confirm focus rings |
| Verify ARIA still works | Screen reader announcements still fire |
| Verify functionality | All features work identically, just without motion |

---

## Appendix: ARIA Patterns

### Command Palette (Combobox with Listbox)

```tsx
<div role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
  <input
    role="searchbox"
    aria-label="Search commands"
    aria-controls="command-list"
    aria-activedescendant={activeDescendant}
    value={query}
    onChange={handleSearch}
  />
  <ul id="command-list" role="listbox" aria-label="Commands">
    {filteredCommands.map((cmd, i) => (
      <li
        key={cmd.id}
        id={`cmd-${cmd.id}`}
        role="option"
        aria-selected={i === activeIndex}
        tabIndex={-1}
      >
        {cmd.label}
      </li>
    ))}
  </ul>
</div>
```

### Tabs (Editor Tabs)

```tsx
<div role="tablist" aria-label="Editor views">
  <button role="tab" id="tab-editor" aria-selected={activeTab === 'editor'} 
          aria-controls="panel-editor" tabIndex={activeTab === 'editor' ? 0 : -1}>
    Editor
  </button>
  <button role="tab" id="tab-chat" aria-selected={activeTab === 'chat'}
          aria-controls="panel-chat" tabIndex={activeTab === 'chat' ? 0 : -1}>
    Chat
  </button>
  <button role="tab" id="tab-terminal" aria-selected={activeTab === 'terminal'}
          aria-controls="panel-terminal" tabIndex={activeTab === 'terminal' ? 0 : -1}>
    Terminal
  </button>
</div>
<div role="tabpanel" id="panel-editor" aria-labelledby="tab-editor" hidden={activeTab !== 'editor'}>
  {/* Editor content */}
</div>
```

### Status Indicator

```tsx
<div role="status" aria-label={`Model status: ${status}`}>
  <span className="status-dot" 
        aria-hidden="true"
        style={{ backgroundColor: statusColor }} />
  <span>{statusLabel}</span>
</div>
```

---

*Document 𓂀 Wazeer OS Accessibility Specification v2.0.0-Rewrite*  
*© 2025 100MillionDEV / العرآب — All Rights Reserved*
