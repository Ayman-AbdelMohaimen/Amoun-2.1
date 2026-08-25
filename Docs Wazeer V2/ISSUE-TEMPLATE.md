# Issue Templates — Wazeer OS v2.0.0-Rewrite

> 𓂀 Wazeer OS (وزير OS) — Issue Reporting Templates  
> Document Owner: Product & QA Team | Last Updated: 2025-01  
> Classification: Internal — All Teams

---

## Table of Contents

1. [Overview](#overview)
2. [Bug Report Template](#bug-report-template)
3. [Feature Request Template](#feature-request-template)
4. [Task Template](#task-template)
5. [Security Vulnerability Report Template](#security-vulnerability-report-template)
6. [Performance Issue Template](#performance-issue-template)
7. [Issue Labeling Convention](#issue-labeling-convention)

---

## Overview

### Purpose

Standardized issue templates ensure consistent, actionable bug reports and feature requests. Every issue should be understandable and reproducible by any team member without additional context.

### How to Use These Templates

1. **Copy the appropriate template** into a new GitHub Issue
2. **Fill all required fields** (marked with *)
3. **Be specific and objective** — avoid vague descriptions
4. **Attach evidence** — screenshots, console logs, screen recordings
5. **Set labels** — using the labeling convention below

### Issue Naming Convention

| Prefix | Type | Example |
|---|---|---|
| `bug:` | Bug report | `bug: Auth session not persisting after page reload` |
| `feat:` | Feature request | `feat: Add voice input for chat messages` |
| `task:` | Development task | `task: Implement AmounEditor split pane` |
| `security:` | Security vulnerability | `security: XSS risk in AI code block rendering` |
| `perf:` | Performance issue | `perf: Monaco Editor causing 3s initial load delay` |
| `ux:` | UX issue | `ux: Arabic RTL breaks on Settings page` |
| `docs:` | Documentation | `docs: Add API reference for useEventLogger` |

---

## Bug Report Template

### Title Format

```
bug: [Brief description of the bug]
```

### Template

```markdown
## Bug Report — Wazeer OS

### Description *
A clear, concise description of what the bug is.

**Example:** When switching from Arabic to English, the sidebar navigation items overlap on mobile viewports (< 768px).

### Steps to Reproduce *
1. Open Wazeer OS in Arabic mode
2. Navigate to Settings
3. Switch language to English
4. Resize browser to 375px width (mobile)
5. Open sidebar

### Expected Behavior *
What you expected to happen.

**Example:** Navigation items should reflow and display correctly in LTR layout without overlapping.

### Actual Behavior *
What actually happened.

**Example:** Navigation items overlap with the sidebar logo, making 3 items unreadable.

### Screenshots / Screen Recording *
If applicable, add screenshots or a screen recording to help explain the problem.

**Tip:** Use GIF format for short screen recordings (under 10MB).

| Before (broken) | After (expected) |
|---|---|
| [Attach screenshot] | [Attach screenshot] |

### Environment *
| Field | Value |
|---|---|
| **OS** | [e.g., macOS 14.2, Windows 11, Ubuntu 22.04] |
| **Browser** | [e.g., Chrome 120, Firefox 121, Safari 17] |
| **Device** | [e.g., MacBook Pro 14", Samsung Galaxy S24, iPad Pro] |
| **Viewport** | [e.g., 375px (mobile), 1024px (tablet), 1920px (desktop)] |
| **App Version** | [e.g., 2.0.0-alpha.1] |
| **Language** | [Arabic / English / Both] |
| **Theme** | [Emerald / Cyber-Blue / Crimson / Purple / Custom] |
| **Model** | [Gemini / GPT / Claude / Ollama] |
| **Auth State** | [Anonymous / Google / Email] |

### Console Errors *
Any errors shown in the browser console (F12 → Console tab).

```
[paste console errors here]
```

### Network Errors *
Any failed network requests (F12 → Network tab).

```
[paste failed request details here]
```

### Severity *
- [ ] **P0 — Critical**: App is unusable, data loss, security breach
- [ ] **P1 — High**: Major feature broken, no workaround
- [ ] **P2 — Medium**: Feature partially broken, workaround exists
- [ ] **P3 — Low**: Minor issue, cosmetic
- [ ] **P4 — Cosmetic**: Visual only, no functional impact

### Reproducibility *
- [ ] Always (100%)
- [ ] Frequently (> 50%)
- [ ] Sometimes (< 50%)
- [ ] Once (unable to reproduce)

### Additional Context *
Any other context about the problem: related issues, recent changes, etc.

### Workaround *
Is there a workaround? If yes, describe it.

**Example:** Refreshing the page fixes the layout temporarily.
```

---

## Feature Request Template

### Title Format

```
feat: [Brief description of the requested feature]
```

### Template

```markdown
## Feature Request — Wazeer OS

### Description *
A clear, concise description of the feature you'd like.

**Example:** Add a voice input option that uses the Web Speech API to transcribe speech and send it as a chat message to Amoun.

### User Story *
As a [type of user], I want [goal] so that [benefit].

**Example:**
As a **mobile user who types slowly in Arabic**, I want to **dictate messages using voice input** so that **I can communicate with Amoun faster and more naturally**.

### Acceptance Criteria *
Define what "done" looks like. Use Gherkin format (Given/When/Then).

```gherkin
Scenario: User sends voice message in Arabic
  Given the user is on HomeView
  And the Arabic language is selected
  When the user taps the microphone button
  And speaks "أريد كتابة كود بايثون"
  Then the speech is transcribed to text
  And the text appears in the ChatInput
  And the user can edit the text before sending
  And the user taps send
  And Amoun receives the transcribed message
```

### Proposed Solution *
Describe how you envision this feature working. Include UI placement, interaction flow, and technical approach.

**Example:**
1. Add a microphone button next to the ChatInput send button
2. On tap, start Web Speech API recognition with Arabic language
3. Show waveform visualization while recording
4. Transcribe in real-time, display in ChatInput
5. Stop on second tap or after 5s silence
6. User can edit before sending

### Design Mockups *
If applicable, attach wireframes or design mockups.

| Mobile | Desktop |
|---|---|
| [Attach mockup] | [Attach mockup] |

### Priority *
- [ ] **Must have (P0)**: Required for launch
- [ ] **Should have (P1)**: Important, target for v2.x
- [ ] **Nice to have (P2)**: Would be valuable, can defer
- [ ] **Future consideration**: Not currently planned

### Effort Estimate *
- [ ] **Small**: < 1 day
- [ ] **Medium**: 1-3 days
- [ ] **Large**: 3-5 days
- [ ] **X-Large**: > 5 days
- [ ] **Unknown**: Needs investigation

### Dependencies *
List any dependencies or prerequisites.

**Example:**
- Web Speech API support check (not available in all browsers)
- Language detection for auto-switching recognition language
- Microphone permissions flow

### Alternatives Considered *
Describe any alternative solutions you've considered.

**Example:**
- External STT API (rejected: adds latency and privacy concerns)
- Voice-to-text keyboard (rejected: not PWA-native)

### Additional Context *
Any other context: links to related issues, competitor implementations, etc.

### Bilingual Impact *
- [ ] English only
- [ ] Arabic only
- [ ] Both (full bilingual support needed)
- [ ] Language-agnostic (no text changes)
```

---

## Task Template

### Title Format

```
task: [Brief description of the task]
```

### Template

```markdown
## Development Task — Wazeer OS

### Description *
A clear description of what needs to be implemented.

**Example:** Implement the AmounEditor component with a split-pane layout containing Monaco Editor (left), chat panel (right), and terminal output (bottom).

### Acceptance Criteria *
- [ ] Monaco Editor loads and supports TypeScript syntax highlighting
- [ ] Chat panel allows sending messages to Amoun while editing code
- [ ] Terminal panel shows tool execution output from Amoun
- [ ] Panes are resizable via drag handles
- [ ] Mobile: tab-based layout instead of split pane
- [ ] Keyboard shortcut (Cmd+Shift+A) opens AmounEditor
- [ ] File tabs allow switching between multiple files
- [ ] All text renders correctly in both LTR and RTL

### Technical Approach *
Describe the implementation approach.

**Example:**
- Use `@monaco-editor/react` for the code editor
- Split pane with CSS Grid or `react-split`
- Chat panel reuses existing chat components
- Terminal panel renders output with styled `<pre>` elements
- Responsive: `@media (max-width: 768px)` switches to tabs
- Store: `useEditorStore` (Zustand) for file state

### Files to Create/Modify *
| File | Action | Description |
|---|---|---|
| `src/components/editor/AmounEditor.tsx` | Create | Main editor component |
| `src/components/editor/EditorPane.tsx` | Create | Monaco wrapper |
| `src/components/editor/ChatPane.tsx` | Create | Chat panel for editor |
| `src/components/editor/TerminalPane.tsx` | Create | Terminal output |
| `src/stores/useEditorStore.ts` | Create | Editor state management |
| `src/components/Sidebar.tsx` | Modify | Add AmounEditor nav item |
| `src/App.tsx` | Modify | Add route for AmounEditor |

### Dependencies *
- [ ] `@monaco-editor/react` package installed
- [ ] `react-split` package installed (or similar)
- [ ] Editor store defined in architecture doc
- [ ] File management design finalized

### Effort Estimate *
| Task | Estimate |
|---|---|
| AmounEditor layout | 4h |
| Monaco Editor integration | 3h |
| Chat panel | 2h |
| Terminal panel | 2h |
| Mobile responsiveness | 2h |
| Testing | 2h |
| **Total** | **~15h (2 days)** |

### Testing Requirements *
| Test Type | What to Test |
|---|---|
| Unit | Editor store state transitions |
| Integration | Chat message from editor reaches Amoun |
| Visual | Layout renders correctly at all breakpoints |
| Keyboard | Shortcuts work, tab navigation in editor |
| RTL | Layout correct in Arabic mode |

### Definition of Done *
- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Tests pass
- [ ] No console errors
- [ ] Works in Chrome, Firefox, Safari
- [ ] Works on mobile (375px, 768px)
- [ ] Works in both LTR and RTL
- [ ] Documentation updated (if applicable)
```

---

## Security Vulnerability Report Template

### Title Format

```
security: [Brief description of the vulnerability]
```

> ⚠️ **IMPORTANT**: If this is a critical security vulnerability, do NOT post it publicly. Email security details directly to the developer. This template is for non-critical or already-mitigated vulnerabilities.

### Template

```markdown
## Security Vulnerability Report — Wazeer OS

### Severity *
- [ ] **Critical**: Active exploitation possible, data breach
- [ ] **High**: Significant risk, needs immediate fix
- [ ] **Medium**: Moderate risk, schedule for next sprint
- [ ] **Low**: Minimal risk, track for future

### Description *
Describe the vulnerability in detail.

**Example:** When Amoun returns a code block containing `<script>` tags, the current markdown renderer passes it through without sanitization, creating a potential XSS vector if `dangerouslySetInnerHTML` is used anywhere in the chat component.

### Vulnerability Type *
- [ ] XSS (Cross-Site Scripting)
- [ ] Injection (SQL/NoSQL/Command)
- [ ] CSRF (Cross-Site Request Forgery)
- [ ] Auth bypass
- [ ] Data exposure
- [ ] Prompt injection (AI-specific)
- [ ] Insecure storage
- [ ] Misconfiguration
- [ ] Other: ___________

### Attack Vector *
Describe how the vulnerability can be exploited.

**Example:**
1. User asks Amoun to generate HTML code
2. Amoun responds with a code block containing `<img src=x onerror="alert(document.cookie)">`
3. If the chat component renders HTML, the script executes
4. Attacker could steal session cookies

### Affected Component(s) *
- Component: `src/components/chat/ChatMessage.tsx`
- Store: `src/stores/useChatStore.ts`
- Route: All views with chat

### Proof of Concept *
Provide a minimal reproduction of the vulnerability.

```javascript
// Steps to reproduce:
// 1. Open Wazeer OS
// 2. In the chat, type: "Show me an example of an XSS attack"
// 3. Amoun returns code containing <script> tags
// 4. Check if the code renders as HTML or text
```

### Impact *
What is the potential damage if exploited?

**Example:**
- Session hijacking via cookie theft
- Arbitrary JavaScript execution in user's browser
- Potential access to IndexedDB data (chat history, API keys)

### Current Mitigation *
Is there any existing mitigation?

**Example:** Current markdown renderer uses `react-markdown` which escapes HTML by default. However, the `rehype-raw` plugin could be added for legitimate HTML rendering, which would re-introduce the risk.

### Recommended Fix *
Describe the recommended fix.

**Example:**
1. Never use `dangerouslySetInnerHTML` for AI responses
2. Keep `react-markdown` without `rehype-raw`
3. Add DOMPurify for any HTML rendering
4. Implement HorusGuard AST scan on all rendered content
5. CSP headers prevent inline script execution as defense-in-depth

### Responsible Disclosure *
- [ ] I agree to follow responsible disclosure (no public disclosure before fix)
- [ ] This is a theoretical vulnerability (not actively exploited)
- [ ] I have verified this on the latest version (2.0.0-Rewrite)
```

---

## Performance Issue Template

### Title Format

```
perf: [Brief description of the performance issue]
```

### Template

```markdown
## Performance Issue — Wazeer OS

### Description *
A clear description of the performance problem.

**Example:** Opening the AmounEditor for the first time takes > 5 seconds on a mid-range Android device (3GB RAM). Monaco Editor bundle loads synchronously, blocking the main thread.

### Metrics *
| Metric | Expected | Actual |
|---|---|---|
| **FCP** (First Contentful Paint) | < 1.8s | __s |
| **LCP** (Largest Contentful Paint) | < 2.5s | __s |
| **CLS** (Cumulative Layout Shift) | < 0.1 | __ |
| **FID** (First Input Delay) | < 100ms | __ms |
| **INP** (Interaction to Next Paint) | < 200ms | __ms |
| **Bundle Size** (initial) | < 500KB | __KB |
| **TTI** (Time to Interactive) | < 3.5s | __s |
| **Memory Usage** (peak) | < 200MB | __MB |

### Reproduction Steps *
1. Open Chrome DevTools → Performance tab
2. Navigate to [URL/View]
3. Record performance trace
4. Observe [metric]

### Environment *
| Field | Value |
|---|---|
| **Device** | [e.g., Samsung Galaxy A54, MacBook Air M1] |
| **CPU Cores** | [e.g., 8 cores] |
| **RAM** | [e.g., 4GB] |
| **Network** | [e.g., 4G, WiFi, 3G slow] |
| **Browser** | [e.g., Chrome 120] |
| **OS** | [e.g., Android 14] |

### Performance Profile *
Attach a Chrome DevTools performance profile (`.json` or screenshot of flame chart).

### Bottleneck Analysis *
What is causing the slowdown?

**Example:**
- Monaco Editor bundle: 1.2MB uncompressed, loaded synchronously
- Image optimization: Landing page hero image is 2MB PNG (not WebP)
- Unnecessary re-renders: Chat component re-renders on every keystroke
- Large DOM: Chat history rendering 1000+ messages at once

### Proposed Optimization *
Describe the optimization approach.

**Example:**
1. Lazy load Monaco Editor with `React.lazy()` + `Suspense`
2. Convert hero image to WebP with AVIF fallback
3. Memoize chat components with `React.memo`
4. Virtualize chat message list with `react-window`

### Priority *
- [ ] **P0**: Blocking launch (user experience unacceptable)
- [ ] **P1**: Significant impact, fix before launch
- [ ] **P2**: Moderate impact, schedule for optimization sprint
- [ ] **P3**: Minor impact, track for future
```

---

## Issue Labeling Convention

### Severity Labels

| Label | Color | Usage |
|---|---|---|
| `severity: P0` | 🔴 `#dc2626` | Critical — app broken, data loss |
| `severity: P1` | 🟠 `#ea580c` | High — major feature broken |
| `severity: P2` | 🟡 `#ca8a04` | Medium — partial break, workaround |
| `severity: P3` | 🟢 `#16a34a` | Low — minor issue |
| `severity: P4` | 🔵 `#2563eb` | Cosmetic — visual only |

### Type Labels

| Label | Color | Usage |
|---|---|---|
| `type: bug` | `#dc2626` | Bug report |
| `type: feature` | `#2563eb` | Feature request |
| `type: task` | `#7c3aed` | Development task |
| `type: security` | `#dc2626` | Security vulnerability |
| `type: performance` | `#ea580c` | Performance issue |
| `type: ux` | `#ca8a04` | UX issue |
| `type: docs` | `#16a34a` | Documentation |

### Status Labels

| Label | Color | Usage |
|---|---|---|
| `status: triage` | `#9ca3af` | Needs triage |
| `status: in-progress` | `#f59e0b` | Being worked on |
| `status: review` | `#3b82f6` | In code review |
| `status: blocked` | `#dc2626` | Blocked by dependency |
| `status: testing` | `#8b5cf6` | In QA testing |
| `status: done` | `#22c55e` | Completed |
| `status: closed` | `#6b7280` | Closed (won't fix / duplicate) |

### Component Labels

| Label | Color | Usage |
|---|---|---|
| `component: chat` | `#2dd4bf` | Chat-related issues |
| `component: editor` | `#2dd4bf` | AmounEditor issues |
| `component: dashboard` | `#2dd4bf` | LlmDashboard issues |
| `component: auth` | `#2dd4bf` | Authentication issues |
| `component: pwa` | `#2dd4bf` | PWA / service worker issues |
| `component: design` | `#2dd4bf` | Design system issues |
| `component: i18n` | `#2dd4bf` | Internationalization issues |

### Priority Labels

| Label | Color | Usage |
|---|---|---|
| `priority: urgent` | `#dc2626` | Fix immediately |
| `priority: high` | `#ea580c` | Fix this sprint |
| `priority: medium` | `#ca8a04` | Fix next sprint |
| `priority: low` | `#16a34a` | Fix when convenient |
| `priority: backlog` | `#6b7280` | No timeline |

---

*Document 𓂀 Wazeer OS Issue Templates v2.0.0-Rewrite*  
*© 2025 100MillionDEV / العرآب — All Rights Reserved*
