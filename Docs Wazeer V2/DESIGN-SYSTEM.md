# Design System — Wazeer OS v2.0.0-Rewrite

> 𓂀 Wazeer OS (وزير OS) — Egyptian Cyberpunk Design System  
> Document Owner: Design & Frontend Team | Last Updated: 2025-01  
> Classification: Internal — Engineering & Design

---

## Table of Contents

1. [Overview](#overview)
2. [Color Tokens](#color-tokens)
3. [Theme Presets](#theme-presets)
4. [Typography Scale](#typography-scale)
5. [Spacing System](#spacing-system)
6. [Border Radius Tokens](#border-radius-tokens)
7. [Shadow & Glow Tokens](#shadow--glow-tokens)
8. [Component Variants](#component-variants)
9. [Animation Tokens](#animation-tokens)
10. [Glassmorphism Recipe](#glassmorphism-recipe)
11. [Icon System](#icon-system)
12. [Background System](#background-system)
13. [Appendix: Tailwind Configuration](#appendix-tailwind-configuration)

---

## Overview

The Wazeer OS Design System is an **Egyptian Cyberpunk** visual language built on Tailwind CSS 4. Every design decision serves the brand identity: ancient Egyptian mysticism meets high-tech futurism. The system is token-based, theme-aware, and fully RTL-compatible.

### Design Principles

1. **Depth through darkness** — Layered dark surfaces create spatial hierarchy without borders
2. **Glow as accent** — Teal glow replaces traditional color fills for emphasis
3. **Glass as structure** — Frosted glass panels provide order within the cosmic void
4. **Motion as life** — Subtle animations breathe life into the interface
5. **Bilingual symmetry** — Every component works identically in AR and EN

---

## Color Tokens

### Core Background Palette

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `bg-outer` | `#050508` | `bg-[#050508]` | Page background, outermost layer |
| `bg-shell` | `#0d0d12` | `bg-[#0d0d12]` | Shell/sidebar background |
| `bg-card` | `#0a0a0f` | `bg-[#0a0a0f]` | Card/panel backgrounds |
| `bg-elevated` | `#12121a` | `bg-[#12121a]` | Elevated surfaces (modals, dropdowns) |
| `bg-input` | `#0f0f17` | `bg-[#0f0f17]` | Input fields |
| `bg-hover` | `#1a1a25` | `bg-[#1a1a25]` | Hover state for interactive elements |

### Accent Palette (Default: Emerald/Teal)

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `accent-300` | `#5eead4` | `text-teal-300` | Bright accent text, highlights |
| `accent-400` | `#2dd4bf` | `text-teal-400` | Primary accent, icons, borders |
| `accent-500` | `#14b8a6` | `text-teal-500` | Interactive elements, links |
| `accent-600` | `#0d9488` | `text-teal-600` | Active states, selected items |
| `accent-700` | `#0f766e` | `text-teal-700` | Pressed states |
| `accent-glow` | `rgba(45,212,191,0.3)` | `shadow-[0_0_20px_rgba(45,212,191,0.3)]` | Glow effects, focus rings |

### Secondary Palette (Amber)

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `secondary-300` | `#fcd34d` | `text-amber-300` | Warning highlights, badges |
| `secondary-400` | `#fbbf24` | `text-amber-400` | Secondary accent |
| `secondary-500` | `#f59e0b` | `text-amber-500` | Warning states, notifications |
| `secondary-600` | `#d97706` | `text-amber-600` | Active warning |

### Text Palette

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `text-primary` | `#f3f4f6` | `text-gray-100` | Headings, primary text |
| `text-secondary` | `#d1d5db` | `text-gray-300` | Body text, descriptions |
| `text-muted` | `#9ca3af` | `text-gray-400` | Captions, placeholders |
| `text-dim` | `#6b7280` | `text-gray-500` | Disabled text, timestamps |
| `text-inverse` | `#050508` | `text-[#050508]` | Text on accent backgrounds |

### Semantic Palette

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `success-400` | `#4ade80` | `text-green-400` | Success states, confirmations |
| `success-500` | `#22c55e` | `text-green-500` | Success buttons |
| `error-400` | `#f87171` | `text-red-400` | Error messages |
| `error-500` | `#ef4444` | `text-red-500` | Error states, destructive actions |
| `warning-400` | `#fbbf24` | `text-amber-400` | Warnings (uses secondary) |
| `warning-500` | `#f59e0b` | `text-amber-500` | Warning states |
| `info-400` | `#60a5fa` | `text-blue-400` | Informational messages |

### Border Palette

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `border-default` | `rgba(255,255,255,0.10)` | `border-white/10` | Card borders, dividers |
| `border-subtle` | `rgba(255,255,255,0.05)` | `border-white/5` | Subtle separators |
| `border-strong` | `rgba(255,255,255,0.20)` | `border-white/20` | Hover borders |
| `border-focus` | `#2dd4bf` | `border-teal-400` | Focus rings, active borders |
| `border-error` | `#f87171` | `border-red-400` | Error borders |
| `border-warning` | `#fbbf24` | `border-amber-400` | Warning borders |

---

## Theme Presets

### Theme Architecture

Themes are CSS custom properties set on `:root` via the `useThemeStore` Zustand store. The accent color family changes, while backgrounds remain consistent (dark palette is universal).

### Preset 1: Emerald (Default)

```css
--accent-300: #5eead4;
--accent-400: #2dd4bf;
--accent-500: #14b8a6;
--accent-600: #0d9488;
--accent-700: #0f766e;
--accent-glow: rgba(45,212,191,0.3);
```

### Preset 2: Cyber-Blue

```css
--accent-300: #93c5fd;
--accent-400: #60a5fa;
--accent-500: #3b82f6;
--accent-600: #2563eb;
--accent-700: #1d4ed8;
--accent-glow: rgba(59,130,246,0.3);
```

### Preset 3: Crimson

```css
--accent-300: #fca5a5;
--accent-400: #f87171;
--accent-500: #ef4444;
--accent-600: #dc2626;
--accent-700: #b91c1c;
--accent-glow: rgba(239,68,68,0.3);
```

### Preset 4: Purple

```css
--accent-300: #c4b5fd;
--accent-400: #a78bfa;
--accent-500: #8b5cf6;
--accent-600: #7c3aed;
--accent-700: #6d28d9;
--accent-glow: rgba(139,92,246,0.3);
```

### Preset 5: Custom (User-defined)

```css
--accent-300: var(--custom-accent-light);
--accent-400: var(--custom-accent);
--accent-500: var(--custom-accent-dark);
--accent-600: var(--custom-accent-darker);
--accent-700: var(--custom-accent-darkest);
--accent-glow: var(--custom-accent-glow);
```

Users provide a single hex value in Settings; the system generates the full accent family using HSL manipulation (lighten/darken by fixed percentages).

### Theme Switching

Theme changes are:
1. Applied via CSS custom properties on `document.documentElement`
2. Persisted to `useConfigStore` in IndexedDB
3. Animated with 200ms transition on accent-colored elements
4. Reflected immediately in all charts, glows, and accent surfaces

---

## Typography Scale

### Font Families

| Role | Font | Source | Fallback | Usage |
|---|---|---|---|---|
| **Display** | Space Grotesk | Google Fonts | sans-serif | H1, H2, nav headings, hero text |
| **Body** | Inter | Google Fonts | sans-serif | Paragraphs, labels, UI text |
| **Mono** | JetBrains Mono | Google Fonts | monospace | Code blocks, terminal, technical data |
| **Logo** | System Serif | Native | Georgia, serif | Wazeer OS wordmark only |
| **Arabic Display** | IBM Plex Sans Arabic | Google Fonts | Arabic sans-serif | Arabic headings |
| **Arabic Body** | IBM Plex Sans Arabic | Google Fonts | Arabic sans-serif | Arabic body text |

### Type Scale

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `text-display-xl` | 48px / 3rem | 700 (Bold) | 1.1 | -0.02em | Hero text, landing page |
| `text-display-lg` | 36px / 2.25rem | 700 (Bold) | 1.2 | -0.01em | Page titles |
| `text-display-md` | 30px / 1.875rem | 600 (SemiBold) | 1.3 | -0.01em | Section headings |
| `text-display-sm` | 24px / 1.5rem | 600 (SemiBold) | 1.4 | 0 | Card titles |
| `text-heading-lg` | 20px / 1.25rem | 600 (SemiBold) | 1.5 | 0 | Subsection headings |
| `text-heading-md` | 16px / 1rem | 600 (SemiBold) | 1.5 | 0 | Component headings |
| `text-body-lg` | 16px / 1rem | 400 (Regular) | 1.6 | 0 | Primary body text |
| `text-body-md` | 14px / 0.875rem | 400 (Regular) | 1.6 | 0 | Secondary body text |
| `text-body-sm` | 12px / 0.75rem | 400 (Regular) | 1.5 | 0.02em | Captions, timestamps |
| `text-mono-md` | 14px / 0.875rem | 400 (Regular) | 1.7 | 0 | Code in body |
| `text-mono-sm` | 12px / 0.75rem | 400 (Regular) | 1.6 | 0 | Small code, terminal |
| `text-logo` | 18px / 1.125rem | 700 (Bold) | 1.0 | 0.05em | "Wazeer OS" wordmark |
| `text-agent` | 20px / 1.25rem | 600 (SemiBold) | 1.5 | 0 | "Amoun" agent name |

### Arabic Typography Adjustments

| Property | Arabic Value | Notes |
|---|---|---|
| Line height | +0.1em above base | Arabic scripts need more vertical space |
| Letter spacing | 0 (never negative) | Arabic doesn't use Latin-style tracking |
| Font weight | Prefer Medium (500) for body | Regular (400) can appear thin in Arabic |
| Direction | `dir="rtl"` | Applied on `<html>` when Arabic is active |
| Text alignment | Right-aligned in RTL | Automatic via `dir` attribute |
| Numbers | Use Arabic-Indic (٠١٢٣) in pure AR context | Latin digits acceptable in mixed content |

### Font Loading Strategy

```html
<!-- Preconnect to Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<!-- Load with display=swap for FOIT prevention -->
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## Spacing System

### 4px Grid

All spacing is based on a 4px grid. Tailwind default spacing scale applies.

| Token | Value | Tailwind | Common Usage |
|---|---|---|---|
| `space-0` | 0px | `p-0`, `m-0` | Reset |
| `space-1` | 4px | `p-1`, `m-1`, `gap-1` | Inline element padding, icon gaps |
| `space-2` | 8px | `p-2`, `m-2`, `gap-2` | Tight element spacing |
| `space-3` | 12px | `p-3`, `m-3`, `gap-3` | Input padding, small card padding |
| `space-4` | 16px | `p-4`, `m-4`, `gap-4` | Standard element spacing |
| `space-5` | 20px | `p-5`, `m-5`, `gap-5` | Card padding (default) |
| `space-6` | 24px | `p-6`, `m-6`, `gap-6` | Section padding |
| `space-8` | 32px | `p-8`, `m-8`, `gap-8` | Large section padding |
| `space-10` | 40px | `p-10`, `m-10` | Page section spacing |
| `space-12` | 48px | `p-12`, `m-12` | Major section breaks |
| `space-16` | 64px | `p-16`, `m-16` | Hero spacing |
| `space-20` | 80px | `p-20`, `m-20` | Landing page sections |

### Component-Specific Spacing

| Component | Padding | Gap | Margin |
|---|---|---|---|
| Sidebar items | `px-4 py-3` | — | — |
| TopBar | `px-6 h-14` | `gap-4` | — |
| Cards | `p-5` | — | `mb-4` |
| Chat messages | `px-4 py-3` | `space-y-4` | — |
| ChatInput | `px-4 py-3` | — | — |
| Modal content | `p-6` | `space-y-4` | — |
| Buttons (default) | `px-4 py-2` | `gap-2` | — |
| Buttons (large) | `px-6 py-3` | `gap-2` | — |
| Status pills | `px-3 py-1` | `gap-2` | — |
| Metric cards | `p-5` | — | `gap-4` (grid) |
| Form inputs | `px-3 py-2` | — | — |
| MobileBottomNav | `py-2` | `gap-1` | — |

---

## Border Radius Tokens

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `radius-none` | 0px | `rounded-none` | Code blocks, terminal |
| `radius-sm` | 4px | `rounded-sm` | Small badges, tags |
| `radius-md` | 8px | `rounded-md` | Buttons, inputs, small cards |
| `radius-lg` | 12px | `rounded-lg` | Cards, modals, panels |
| `radius-xl` | 16px | `rounded-xl` | Large cards, feature sections |
| `radius-2xl` | 20px | `rounded-2xl` | Hero sections, onboarding cards |
| `radius-full` | 9999px | `rounded-full` | Pills, avatars, circular elements |

### Component Radius Mapping

| Component | Radius | Token |
|---|---|---|
| Buttons | `rounded-md` (8px) | `radius-md` |
| Inputs | `rounded-md` (8px) | `radius-md` |
| Cards | `rounded-xl` (16px) | `radius-xl` |
| Modals | `rounded-2xl` (20px) | `radius-2xl` |
| Status pills | `rounded-full` | `radius-full` |
| Badges | `rounded-full` | `radius-full` |
| Sidebar | `rounded-none` (0 right) | `radius-none` (left only) |
| TopBar | `rounded-none` | `radius-none` |
| Chat bubbles (user) | `rounded-2xl` | `radius-2xl` (bottom-right flat) |
| Chat bubbles (agent) | `rounded-2xl` | `radius-2xl` (bottom-left flat) |
| Tooltips | `rounded-md` (8px) | `radius-md` |
| Dropdown menus | `rounded-lg` (12px) | `radius-lg` |

---

## Shadow & Glow Tokens

### Shadow Tokens

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `shadow-none` | none | `shadow-none` | Flat elements |
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.5)` | `shadow-sm` | Subtle elevation |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.5)` | `shadow-md` | Cards at rest |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.5)` | `shadow-lg` | Elevated cards |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.5)` | `shadow-xl` | Modals, overlays |

### Glow Tokens (Egyptian Cyberpunk Signature)

| Token | Value | Usage |
|---|---|---|
| `glow-sm` | `0 0 8px var(--accent-glow)` | Subtle interactive glow (hover on links) |
| `glow-md` | `0 0 16px var(--accent-glow)` | Selected elements, focus rings |
| `glow-lg` | `0 0 32px var(--accent-glow)` | Eye centerpiece, active swarm |
| `glow-xl` | `0 0 48px var(--accent-glow)` | Hero elements, landing page CTA |
| `glow-error` | `0 0 16px rgba(239,68,68,0.3)` | Error state glow |
| `glow-success` | `0 0 16px rgba(34,197,94,0.3)` | Success state glow |
| `glow-warning` | `0 0 16px rgba(245,158,11,0.3)` | Warning state glow |

### Glow Animation

```css
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 var(--glow-size) var(--accent-glow); }
  50% { box-shadow: 0 0 calc(var(--glow-size) * 1.5) var(--accent-glow); }
}
```

---

## Component Variants

### Buttons

| Variant | Background | Border | Text | Hover |
|---|---|---|---|---|
| **Primary** | `bg-accent-500` | none | `text-[#050508]` (inverse) | `bg-accent-600` + glow-sm |
| **Secondary** | transparent | `border-accent-500` | `text-accent-400` | `bg-accent-500/10` + glow-sm |
| **Ghost** | transparent | none | `text-gray-300` | `bg-white/5` |
| **Danger** | `bg-error-500` | none | `text-white` | `bg-error-600` + glow-error |
| **Disabled** | `bg-white/5` | `border-white/5` | `text-gray-500` | none |

Button sizes:
- **Small**: `px-3 py-1.5 text-sm` — Compact actions
- **Default**: `px-4 py-2 text-sm` — Standard
- **Large**: `px-6 py-3 text-base` — Primary CTAs

### Inputs

| Variant | Background | Border | Text | Focus |
|---|---|---|---|---|
| **Default** | `bg-input` | `border-white/10` | `text-gray-100` | `border-accent-400` + glow-sm |
| **Error** | `bg-input` | `border-error-400` | `text-gray-100` | `border-error-400` + glow-error |
| **Disabled** | `bg-white/5` | `border-white/5` | `text-gray-500` | — |
| **Readonly** | `bg-white/5` | `border-white/10` | `text-gray-300` | — |

Input sizes:
- **Small**: `px-3 py-1.5 text-sm`
- **Default**: `px-4 py-2 text-sm`
- **Large**: `px-4 py-3 text-base` (ChatInput)

### Cards

| Variant | Background | Border | Notes |
|---|---|---|---|
| **Default** | `bg-card/80 backdrop-blur-xl` | `border-white/10` | Glassmorphic |
| **Elevated** | `bg-elevated/80 backdrop-blur-xl` | `border-white/10` | Modals, dropdowns |
| **Selected** | `bg-card/80 backdrop-blur-xl` | `border-accent-400` | glow-md applied |
| **Hover** | — | `border-white/20` | translateY(-2px), shadow-lg |

### Modals

- **Backdrop**: `bg-black/60 backdrop-blur-sm`
- **Container**: `bg-elevated backdrop-blur-xl rounded-2xl border-white/10 shadow-xl`
- **Close button**: Ghost variant, `absolute top-4 right-4`
- **Animation**: Scale 0.95→1.0 + fade, 300ms ease-out

### Pills & Badges

| Type | Style | Usage |
|---|---|---|
| **Status pill** | `rounded-full px-3 py-1 text-xs` + colored dot | System status indicators |
| **Count badge** | `rounded-full w-5 h-5 text-[10px] flex items-center justify-center` | Notification counts |
| **Priority badge** | `rounded-full px-2 py-0.5 text-[10px] font-medium` | Task priorities |

Priority badge colors:
- Critical: `bg-error-500/20 text-error-400`
- High: `bg-secondary-500/20 text-secondary-400`
- Medium: `bg-accent-500/20 text-accent-400`
- Low: `bg-white/10 text-gray-400`

### Toggles

- **Track**: `rounded-full w-10 h-5` — Off: `bg-white/10`, On: `bg-accent-500`
- **Thumb**: `rounded-full w-4 h-4 bg-white` — positioned with translateX
- **Focus**: glow-sm on track

---

## Animation Tokens

### Duration Tokens

| Token | Value | CSS | Usage |
|---|---|---|---|
| `duration-instant` | 100ms | `100ms` | Button press, toggle |
| `duration-fast` | 200ms | `200ms` | Tooltip, badge, hover |
| `duration-normal` | 300ms | `300ms` | Page transitions, modals, accordion |
| `duration-slow` | 500ms | `500ms` | Skeleton fade, complex reveals |
| `duration-grand` | 800ms | `800ms` | Hero entrance, major reveals |

### Easing Tokens

| Token | Value | CSS | Usage |
|---|---|---|---|
| `ease-default` | ease | `ease` | Standard transitions |
| `ease-out` | cubic-bezier(0.16, 1, 0.3, 1) | `cubic-bezier(0.16, 1, 0.3, 1)` | Enter animations |
| `ease-in` | cubic-bezier(0.55, 0, 1, 0.45) | `cubic-bezier(0.55, 0, 1, 0.45)` | Exit animations |
| `ease-in-out` | cubic-bezier(0.45, 0, 0.55, 1) | `cubic-bezier(0.45, 0, 0.55, 1)` | Repeated/bidirectional |
| `spring-bouncy` | spring(300, 20) | Framer Motion only | Playful interactions |
| `spring-smooth` | spring(200, 25) | Framer Motion only | Modal transitions |

### Stagger Tokens

| Token | Value | Usage |
|---|---|---|
| `stagger-fast` | 30ms | Badge list, icon row |
| `stagger-normal` | 50ms | Card grid, nav items |
| `stagger-slow` | 100ms | Major section reveals |

### Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Glassmorphism Recipe

### Standard Glass Panel

```css
.glass-panel {
  background: rgba(10, 10, 15, 0.8);      /* bg-card with 80% opacity */
  backdrop-filter: blur(24px);             /* backdrop-blur-xl */
  -webkit-backdrop-filter: blur(24px);      /* Safari support */
  border: 1px solid rgba(255, 255, 255, 0.1); /* border-white/10 */
  border-radius: 16px;                      /* rounded-xl */
}
```

### Tailwind Class

```
bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/10 rounded-xl
```

### Glass Variants

| Variant | Blur | Opacity | Border | Usage |
|---|---|---|---|---|
| **Standard** | `blur-xl` (24px) | 80% | `white/10` | Cards, panels |
| **Heavy** | `blur-2xl` (40px) | 90% | `white/15` | Modals, overlays |
| **Light** | `blur-md` (12px) | 60% | `white/5` | Subtle overlays |
| **Frosted** | `blur-3xl` (64px) | 95% | `white/20` | Background effects |

### Glass + Glow Combination

```
bg-[#0a0a0f]/80 backdrop-blur-xl border border-accent-400/30 
shadow-[0_0_20px_rgba(45,212,191,0.3)] rounded-xl
```

This combination is the signature Wazeer OS visual: glass panel with teal glow border.

---

## Icon System

### Library: lucide-react

All icons use the [lucide-react](https://lucide.dev/) library, which provides clean, consistent SVG icons.

### Sizing

| Token | Size (px) | Tailwind | Usage |
|---|---|---|---|
| `icon-xs` | 14 | `w-3.5 h-3.5` | Inline icons, badges |
| `icon-sm` | 16 | `w-4 h-4` | Button icons, list items |
| `icon-md` | 20 | `w-5 h-5` | Nav icons, card icons |
| `icon-lg` | 24 | `w-6 h-6` | Feature icons, sidebar |
| `icon-xl` | 32 | `w-8 h-8` | Empty state illustrations |
| `icon-2xl` | 48 | `w-12 h-12` | Hero features |

### Color Rules

| Context | Color | Tailwind |
|---|---|---|
| Default | `text-gray-400` | Neutral, unobtrusive |
| Active/Selected | `text-accent-400` | Matches theme accent |
| Hover | `text-gray-200` | Brightens on interaction |
| Disabled | `text-gray-600` | Dimmed |
| Error | `text-error-400` | Red |
| Success | `text-success-400` | Green |
| Warning | `text-secondary-400` | Amber |
| Inverse (on accent bg) | `text-[#050508]` | Dark on bright |

### Key Icon Mappings

| Function | Icon (lucide) | Context |
|---|---|---|
| Home | `Home` | Sidebar nav |
| Editor | `Code2` | Sidebar nav |
| Projects | `FolderKanban` | Sidebar nav |
| Workspace | `LayoutDashboard` | Sidebar nav |
| Compute | `Cpu` | Sidebar nav |
| Storage | `Database` | Sidebar nav |
| Settings | `Settings` | Sidebar nav |
| Admin | `Shield` | Sidebar nav |
| Templates | `FileTemplate` | Sidebar nav |
| Kings Tools | `Crown` | Sidebar nav |
| History | `History` | Sidebar nav |
| Chat send | `Send` | ChatInput |
| Voice | `Mic` / `MicOff` | TopBar |
| Language | `Languages` | TopBar |
| Model | `Brain` | TopBar |
| Login | `LogIn` / `LogOut` | TopBar |
| Add | `Plus` | Various |
| Close | `X` | Modals, panels |
| Search | `Search` | Command palette |
| Copy | `Copy` | Code blocks |
| Download | `Download` | Artifacts |
| Delete | `Trash2` | Destructive |
| Edit | `Pencil` | Editable items |
| Check | `Check` | Completion |
| Warning | `AlertTriangle` | Warnings |
| Error | `AlertCircle` | Errors |
| Info | `Info` | Informational |
| Swarm | `Network` | Swarm indicator |
| Terminal | `Terminal` | Editor |
| Eye of Horus | 𓂀 (text/emoji) | Brand (not lucide) |

---

## Background System

### Cyber Grid Pattern

The signature background is a subtle CSS grid pattern overlay:

```css
.cyber-grid {
  background-image: 
    linear-gradient(rgba(45,212,191,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(45,212,191,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}
```

### Animated Gradient Circles

```css
.gradient-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  animation: drift 10s ease-in-out infinite;
}
```

Positioned as decorative elements behind the main content. 2-3 circles per view, slowly drifting.

### Noise Texture

Optional subtle noise overlay for texture (SVG filter or base64 PNG, very low opacity 2-3%).

---

## Appendix: Tailwind Configuration

### Theme Extension (tailwind.config.js)

```js
export default {
  theme: {
    extend: {
      colors: {
        outer: '#050508',
        shell: '#0d0d12',
        card: '#0a0a0f',
        elevated: '#12121a',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        logo: ['Georgia', 'serif'],
        arabic: ['IBM Plex Sans Arabic', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'eye-pulse': 'eye-pulse 4s ease-in-out infinite',
        'marquee': 'marquee 30s linear infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
    },
  },
};
```

---

*Document 𓂀 Wazeer OS Design System v2.0.0-Rewrite*  
*© 2025 100MillionDEV / العرآب — All Rights Reserved*
