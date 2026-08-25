<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0--Rewrite-00ff88?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6-646cff?style=flat-square&logo=vite" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PWA-Installable-5c0c87?style=flat-square" alt="PWA" />
  <img src="https://img.shields.io/badge/license-Proprietary-ff3366?style=flat-square" alt="License" />
</p>

<h1 align="center">
  𓂀 Wazeer OS (وزير OS)
</h1>

<p align="center">
  <strong>المساعد الذكي الشخصي بتصميم سايبربانك مصري</strong><br/>
  <em>Your Personal AI Assistant — Egyptian Cyberpunk Edition</em>
</p>

<p align="center">
  Powered by the AI agent <strong>Amoun (أمون)</strong> — the hidden one who speaks.
</p>

---

## ✨ Key Features

- **🤖 Multi-Provider AI Chat** — Route to 7 LLM providers: Gemini, Claude, GLM, NVIDIA, OpenRouter, OpenCode, and custom endpoints
- **⚡ Real-Time Streaming** — SSE streaming for proxy providers, native SDK streaming for Gemini
- **🔧 Tool Calling** — Gemini ReAct loop with 5 tools: write_file, read_file, list_dir, run_command, search_web
- **🌐 Google Search Grounding** — Real-time web search via Gemini's native search capability
- **🧠 Memory System** — AI learns your preferences, facts, and decisions across sessions
- **📋 Task Management** — AI-extracted tasks + manual CRUD + scheduled auto-execution
- **🎤 Voice I/O** — Bilingual speech recognition and synthesis (Arabic & English)
- **📄 File Attachments** — Images (VLM), Word docs, text files — processed and sent to AI
- **💎 Artifact Extraction** — Code blocks auto-extracted, saved, and previewable in Monaco editor
- **🛡️ HorusGuard Security** — AST-based scanner (Babel) detects XSS, injection, and prototype pollution in AI output
- **🤖 Agent Swarm** — Amoun (primary), Hermes (coding, planned), 7orus (security, passive)
- **📱 PWA** — Installable on any device, works offline, background sync
- **🔐 BYOK** — Bring Your Own API Keys — no server-side key storage
- **💾 On-Device Data** — All data in IndexedDB, nothing leaves your device
- **🏛️ Egyptian Cyberpunk** — Dark theme, neon accents, hieroglyphic branding
- **📝 Conversation Summarization** — AI-generated Markdown summaries of any session
- **🎭 4 Chat Modes** — General, Coding, Brainstorm, and Files — each with tuned system prompts

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 10+
- A **Gemini API key** (or any supported provider key)

### 3 Steps to Run

```bash
# 1. Clone the repository
git clone https://github.com/100MillionDEV/Wazeer-OS.git
cd Wazeer-OS

# 2. Install dependencies
npm install

# 3. Set up environment and run
cp .env.example .env
# Edit .env — add your API key(s)
npm run dev
```

Open **http://localhost:5173** in your browser. The Express proxy starts on **http://localhost:3001**.

---

## 🏗️ Architecture Overview

``n
Wazeer OS is structured as a client-server PWA:

┌─────────────────────────────────────────────────────┐
│                   Browser (PWA)                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  React 19 + TypeScript                        │  │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────────────┐ │  │
│  │  │ Views   │ │Services │ │   Zustand Stores │ │  │
│  │  └────┬────┘ └────┬────┘ └───────┬──────────┘ │  │
│  │       │           │              │            │  │
│  │       └───────────┼──────────────┘            │  │
│  │                   │                           │  │
│  │            ┌──────▼──────┐                    │  │
│  │            │  IndexedDB  │                    │  │
│  │            │  (idb-keyval)│                    │  │
│  │            └─────────────┘                    │  │
│  └───────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ API calls (proxy)
                       ▼
┌──────────────────────────────────────────────────────┐
│  Express 4 Proxy Server                              │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────────┐ │
│  │  Helmet   │ │Rate Limit│ │ 15 Provider Proxies  │ │
│  │ COEP/COOP │ │100/min/IP│ │ → Gemini, Claude, ... │ │
│  └──────────┘ └──────────┘ └───────────────────────┘ │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
              External LLM APIs
```

---

## 📸 Screenshots

<!-- Add screenshots here -->

| Home / Chat | Agent Swarm | Tasks HUD |
|:---:|:---:|:---:|
| *[Screenshot placeholder]* | *[Screenshot placeholder]* | *[Screenshot placeholder]* |

| Code Editor | Settings | Mobile PWA |
|:---:|:---:|:---:|
| *[Screenshot placeholder]* | *[Screenshot placeholder]* | *[Screenshot placeholder]* |

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework |
| Vite | 6 | Build tool & dev server |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4 | Styling (utility-first) |
| Zustand | 5 | State management |
| IndexedDB (idb-keyval) | — | On-device storage |
| Framer Motion | 12 | Animations |
| Express | 4 | Proxy server |
| Firebase Auth | 12 | Google OAuth |
| @google/genai | 2.4 | Gemini SDK |
| Monaco Editor | — | Code editing (AmounEditor) |
| Mammoth.js | — | .docx parsing |
| Web Speech API | — | Voice I/O |
| @babel/parser + traverse | — | HorusGuard AST security |

---

## 🏛️ Design Philosophy

| Principle | Meaning |
|-----------|---------|
| **Green Code** | No dead code, no stubs, no mocks in production |
| **Security as Mindset** | SHA-256 hashing, HorusGuard AST scanning, no raw secrets |
| **Separation of Concerns** | Services → Stores → Components, never mixed |
| **Scalable Architecture** | Plugin-ready providers, injectable dependencies |
| **Enterprise Edition** | Production-grade error handling, graceful degradation |

---

## 🔐 Privacy & Data

- **All data on-device** — Chat history, tasks, memories, user profiles live in IndexedDB
- **No telemetry** — Wazeer OS does not phone home
- **BYOK** — You provide your own API keys; they never leave your browser
- **No server database** — The Express proxy only forwards requests, stores nothing
- **PWA** — Works offline for previously loaded content

---

## 📚 Documentation

- [Contributing Guide](./15-CONTRIBUTING.md)
- [Style Guide](./16-STYLEGUIDE.md)
- [Auth Module](./module-auth.md)
- [Chat Module](./module-chat.md)
- [Search Module](./module-search.md)
- [Learning Module](./module-learning.md)
- [Agents Module](./module-agents.md)
- [Tasks Module](./module-tasks.md)
- [Full Handover Document](./Full-Handover-for-Request-and-all-functioning-Pipelines.md)

---

## 🤝 Contributing

See [15-CONTRIBUTING.md](./15-CONTRIBUTING.md) for setup instructions, coding standards, and the PR process.

---

## 📄 License

Proprietary — © 100MillionDEV.com. All rights reserved.

---

## 👨‍💻 Developer

Built by **100MillionDEV** / **العرآب**

---

<p align="center">
  𓂀 Wazeer OS — وزير OS<br/>
  <em>صُنع بـ ❤️ بواسطة العرآب | حقوق النشر 100MillionDEV.com</em>
</p>
