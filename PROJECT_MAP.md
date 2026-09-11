# 🗺️ Wazeer OS v2.1 — Project Map

**أحدث تحديث:** 2026-09-08  
**النسخة:** 2.1.1  

---

## 🏗️ البنية التحتية للمشروع (Architecture Overview)

```
src/
├── components/          # المكونات الرئيسية للواجهة
│   ├── layout/          # TopBar, Sidebar, MobileNavDrawer, MobileBottomNav, Footer
│   ├── skills/          # AddSkillModal (Custom prompt skills modal)
│   ├── workspace/       # InteractiveSelectionCard, LiveProcessBadge, ArtifactPanel
│   ├── views/           # HomeView, WorkspaceView, SkillsView, SettingsView, ProjectsView, etc.
│   └── ErrorBoundary.tsx# نظام حماية الواجهة وعزل الأخطاء (Modular Boundaries)
├── constants/           # Providers Registry, App Limits, Nav Items, System Prompts
├── services/            # الخدمات الأساسية
│   ├── AIGateway.ts     # بوابة الذكاء الاصطناعي والموجه الرئيسي (SSE Proxy / Direct SDK)
│   ├── providers/       # Gemini Provider, Claude, NVIDIA NIM, GLM, Groq
│   ├── learning/        # MemoryEngine, ContextBuilder, LearningEngine, TokenManager
│   ├── security/        # HorusGuard AST Scanner & PromptSanitizer
│   └── voice/           # VoiceService (STT / TTS)
├── lib/
│   ├── db.ts            # IndexedDB Store Wrapper ("Monmamar" v6 - Granular State Storage)
│   ├── errorHumanize.ts # المعالجة الإنسانية للأخطاء بالعامية المصرية
│   └── firestore.ts     # Cloud Sync (Users, Auth logs, Banned nodes)
└── store/
    ├── workspaceStore.ts# حالة التطبيق الرئيسية مع تقسيم الجلسات، التوكنز، والمهارات المخصصة
    └── swarmStore.ts    # حالة سرب الوكلاء (Swarm Intelligence)
```

---

## 🤖 الموديلات والـ Providers المعتمدة (LLM Registry)

### 1. Google Gemini (Direct SDK `@google/genai` v2)
- `Gemini 3.6 Flash` (`gemini-3.6-flash`) — الموديل الافتراضي الفائق السرعة
- `Gemini 3.5 Flash` (`gemini-3.5-flash`)

### 2. Groq (Ultra-Fast Inference)
- `⚡ Llama 3.3 70B (Groq)` (`groq-llama-3.3-70b`)
- `⚡ Llama 3.1 8B Instant (Groq)` (`groq-llama-3.1-8b`)
- `🧠 GPT-OSS 120B (Groq)` (`groq-gpt-oss-120b`)
- `⚡ GPT-OSS 20B (Groq)` (`groq-gpt-oss-20b`)

### 3. Zhipu GLM Direct
- `GLM-4 Flash (Direct)` (`glm-4-flash`)

### 4. NVIDIA NIM Group (API Key واحد لكل الموديلات التالية)
- 👁️ `Minimax M3 (VLM)` (`minimaxai/minimax-m3`)
- ⚡ `Minimax M2.7` (`minimaxai/minimax-m2.7`)
- 👁️ `Step 3.7 Flash (VLM)` (`stepfun-ai/step-3.7-flash`)
- ⚡ `Mistral Medium 3.5 128B` (`mistralai/mistral-medium-3.5-128b`)
- 🧠 `Nemotron 3 Ultra 550B` (`nvidia/nemotron-3-ultra-550b-a55b`)
- ⚡ `GPT-OSS 20B` (`openai/gpt-oss-20b`)
- 🧠 `GPT-OSS 120B` (`openai/gpt-oss-120b`)
- 👁️ `Cosmos3 Reasoner` (`nvidia/cosmos3-reasoner`)

