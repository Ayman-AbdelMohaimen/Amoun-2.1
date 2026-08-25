# 🗺️ Wazeer OS v2.1 — Project Map

**أحدث تحديث:** 2026-08-22  
**النسخة:** 2.1.0  

---

## 🏗️ البنية التحتية للمشروع (Architecture Overview)

```
src/
├── components/          # المكونات الرئسية للواجهة
│   ├── layout/          # TopBar, Sidebar, BottomBar, Footer
│   └── views/           # HomeView, SettingsView, Workspace, etc.
├── constants/           # Providers Registry, App Limits, Nav Items
├── services/            # الخدمات الأساسية
│   ├── AIGateway.ts     # بوابة الذكاء الاصطناعي والموجه الرئيسي (SSE Proxy / Direct SDK)
│   ├── providers/       # Gemini Provider, Claude, NVIDIA NIM, GLM
│   ├── learning/        # MemoryEngine & Semantic User Memory
│   └── security/        # HorusGuard AST Scanner & PromptSanitizer
├── lib/
│   ├── db.ts            # IndexedDB Store Wrapper ("Monmamar" v4)
│   └── firestore.ts     # Cloud Sync (Users, Auth logs, Banned nodes)
└── store/
    └── workspaceStore.ts# حالة التطبيق الرئسية (Zustand 5)
```

---

## 🤖 الموديلات والـ Providers المعتمدة (LLM Registry)

### 1. Google Gemini (Direct SDK `@google/genai` v2)
- `Gemini 3.5 Flash` (`gemini-3.5-flash`)
- `Gemini 2.5 Flash` (`gemini-2.5-flash`)

### 2. Zhipu GLM Direct
- `GLM-4 Flash (Direct)` (`glm-4-flash`)

### 3. NVIDIA NIM Group (API Key واحد لكل الموديلات التالية)
- 👁️ `Minimax M3 (VLM)` (`minimaxai/minimax-m3`)
- ⚡ `Minimax M2.7` (`minimaxai/minimax-m2.7`)
- 👁️ `Step 3.7 Flash (VLM)` (`stepfun-ai/step-3.7-flash`)
- ⚡ `Mistral Medium 3.5 128B` (`mistralai/mistral-medium-3.5-128b`)
- 🧠 `Nemotron 3 Ultra 550B` (`nvidia/nemotron-3-ultra-550b-a55b`)
- ⚡ `GPT-OSS 20B` (`openai/gpt-oss-20b`)
- 🧠 `GPT-OSS 120B` (`openai/gpt-oss-120b`)
- 👁️ `Cosmos3 Reasoner` (`nvidia/cosmos3-reasoner`)
