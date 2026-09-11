# 𓂀 Wazeer OS v2.1 — رحلة الـ Handover الكاملة

> **المرجع الرئيسي** — الوثيقة دي هي خريطة الطريق الحية للتطبيق: إحنا جتنا منين، إحنا فين دلوقتي، والـ Pipelines شغالة إزاي بالظبط من جوه الكود الفعلي.
>
> **آخر تحديث:** 2026-09-11 | **الحالة:** 🚀 GMT — Go To Market (بيتّا Live على Wazeer.me — `main` مستقر + CI/CD + فرع `v2.2-dev` للتطوير) | **المالك:** العرآب — 100MillionDEV

---

## 📖 الفهرس

1. [رحلة التطوير — منين جتنا](#1-رحلة-التطوير)
2. [المعمارية الفعلية وهيكل الملفات](#2-المعمارية-الفعلية)
3. [الـ Pipelines الرئيسية (من الكود الفعلي)](#3-الـ-pipelines-الرئيسية)
4. [قواعد البيانات — IndexedDB + Firestore](#4-قواعد-البيانات)
5. [استراتيجيات DeepSeek Harness المطبقة](#5-استراتيجيات-dsh)
6. [⚠️ الـ Bottlenecks المستقبلية (تحليل صريح)](#6-الـ-bottlenecks-المستقبلية)
7. [التشغيل والنشر](#7-التشغيل-والنشر)
8. [المشاكل المعروفة وخريطة البروداكشن](#8-المشاكل-المعروفة-والخريطة)
9. [قواعد المشروع الثابتة](#9-قواعد-المشروع)

---

## 1. رحلة التطوير

```
Amon-beta (v0.x)          Wazeer OS v2.0 (Rewrite)         Wazeer OS v2.1 (الحالية)
─────────────────         ────────────────────────         ───────────────────────
React 18 + Vite 5         React 19 + Vite 6 + TW4          + DSH Patterns (Event Log,
7 providers، streaming    معمارية نظيفة: Gateway +          HorusGuard Pipeline, Custom
Auth ناقص، Search وهمي    Stores + IndexedDB v4             Model Routing, Throttling)
Search mock               Gemini Grounding حقيقي           + إصلاح Custom Models
                          Memory + Learning Engines         + TS نظيف (0 errors)
```

### المحطات الحاسمة

| التاريخ | المحطة | النتيجة |
|---------|--------|---------|
| v0.x | Amon-beta شغالة بس فيها 13 مشكلة موثقة | مصدر الدروس |
| v2.0 | إعادة كتابة كاملة: AIGateway موحد، Zustand 5، IndexedDB wrapper، Helmet + Rate limiting | الأساس الحالي |
| v2.1 | Onboarding Wizard، مفاتيح API في IndexedDB، فصل Tools عن Grounding، توسيع الموديلات (NVIDIA NIM group) | 90% جاهزية |
| 2026-08-25 | **جلسة الإصلاح الكبرى**: باج Custom Models + 16 خطأ TS + توصيل HorusGuard + Event Log + Throttling + اعتماد استراتيجيات DSH | جاهزون للـ Build النظيف |
| 2026-08-30 | **شفافية مثبتة + فاحص الموديلات**: عداد الثواني يتحفظ جوه ChatMessage + زر الإعدادات في أخطاء المفاتيح + سقف 10 ثواني لـ testModel | مستوى الخدمة ارتفع |
| 2026-09-02 | **Login + About + Core Services**: Google OAuth بضغطة واحدة + صفحة About + CRUD Contributors + IndexedDB v6 + Sidebar Info icon fix + Token Manager + Exporters/Importers + Sub-Error Boundaries | جاهزية 95% (تمام اللوجين)
| 2026-09-08 | **Command Center release**: إعادة بناء HomeView على موك-أب مركز القيادة الذكي (Hero · Quick Actions · Daily %) | بيتّا على Wazeer.me
| 2026-09-11 | **🚀 GMT — Go To Market**: إصلاح Honeypot typo + فحص Phase 1 (السورس أسبق من الوثائق) + CI/CD + فرع v2.2-dev | بيتّا Live + CI أخضر

### درس الـ v2.0 المهم
وثيقة `Full-Handover-for-Request-and-all-functioning-Pipelines.md` بتوصف معمارية **v2.0 القديمة** (stores منفصلة، client/server منفصلين) — **مش مطابقة للواقع الحالي**. الوثيقة دي (اللي بتقراها) هي المرجع الصحيح لـ v2.1.

---

## 2. المعمارية الفعلية

```
src/
├── main.tsx                    # Bootstrap: wazeerDB.init() + Service Worker
├── App.tsx                     # ViewRouter + **Sub-ErrorBoundaries** (TopBar/Sidebar/Workspace/ArtifactPanel) + Modals + Theme
├── types/index.ts              # ⭐ المصدر الوحيد لكل الـ Types + Contributor type
├── constants/index.ts          # ⭐ PROVIDERS + CHAT_MODES + **NAV_ITEMS شاملة About (Info icon)** + ADMIN_EMAILS + THEME_PRESETS
│
├── store/
│   └── workspaceStore.ts       # 🧠 قلب التطبيق (Zustand): sessions, tasks, projects,
│                               #    models, sendMessage, **rateMessage, runTask, templates CRUD,
│                               #    activityDates (streak), dailySuggestion, importTasks, markActivityToday**
│
├── services/
│   ├── AIGateway.ts            # 🚪 البوابة الموحدة: routing + SSE + retry/fallback
│   ├── AuthService.ts          # 🔐 **Hybrid Auth**: registerUser/loginUser + **loginOAuth (Google)** +
│   │                           #    resolveRole + silentReAuth + SHA-256 hashing + Firestore sync
│   ├── providers/
│   │   └── geminiProvider.ts   # Gemini SDK مباشر (streaming + ReAct tools)
│   ├── tools/
│   │   └── ToolRegistry.ts     # تعريفات الأدوات + VFS + HorusGuard guard
│   ├── security/
│   │   ├── HorusGuard.ts       # AST scanner (Babel) — 16 قاعدة تهديد
│   │   └── PromptSanitizer.ts  # تنقية مدخلات المستخدم
│   └── learning/
│       ├── ContextBuilder.ts   # تجميع system prompt (مهام + ذاكرة + مشروع)
│       ├── LearningEngine.ts   # استخراج المهام (JSON من AI + heuristics عربي/إنجليزي)
│       ├── MemoryEngine.ts     # الذاكرة التراكمية (استخراج بـ Gemini + استرجاع بالكلمات)
│       ├── TaskScheduler.ts    # تنفيذ تلقائي للمهام المستحقة كل 5 دقائق
│       └── TokenManager.ts     # 🆕 **Token Budgeting**: estimateTokens() (عربي 2.5/إنجليزي 4 حرف)
│                               #    + compactMessages() تلقائي عند 70% من حد الموديل
│
├── lib/
│   ├── db.ts                   # IndexedDB "Monmamar" **v6** — 10 stores + in-memory fallback
│   ├── firestore.ts            # مزامنة سحابية (users, auth_logs, banned_nodes)
│   ├── errorHumanize.ts        # أخطاء مترجمة مصري + isApiKeyError() للـ Settings CTA
│   ├── exporters.ts            # 🆕 تصدير Artifacts/مهام: .md/.html/.json/.txt/CSV + downloadFile()
│   └── importers.ts            # 🆕 استيراد مهام: JSON/CSV/MD + detectFormat + dedup + ImportedTaskDraft
│
├── server/                     # Express (tsx) — بورت 3000
│   ├── index.ts                # Helmet + Rate limits + Admin API + SPA fallback
│   ├── providers.ts            # 11 proxy route: /api/proxy/{claude,glm,nvidia,groq,...}
│   └── proxyFactory.ts         # http-proxy-middleware v3 (timeout 120s + error sanitize)
│
└── components/
    ├── layout/TopBar.tsx       # ⭐ Model Selector (custom models) + User/Login button trigger
    ├── layout/Sidebar.tsx      # **Info icon مضاف للـ ICON_MAP** + sessions context menu
    ├── layout/Footer.tsx       # Footer ثابت مع الحالة
    ├── layout/MobileBottomNav.tsx  # Bottom Navigation للموبايل
    ├── views/                  # Home, Workspace, Settings, Projects, Admin +
    │                           #   🆕 **AboutView** (Contributor Cards + Admin CRUD Modal)
    │                           #   + Templates, History, Compute, Storage, Agents, Skills, Reports, Integrated, KingsTools, Landing
    ├── OnboardingWizard.tsx    # ترحيب → مفاتيح مجانية → لغة/ثيم → جولة
    ├── AddModelModal.tsx       # إضافة موديل مخصص (endpoint + key + vision)
    ├── LoginModal.tsx          # 🆕 **Email/Password + Google OAuth بضغطة واحدة** (Firebase Auth signInWithPopup dynamic import)
    ├── ArtifactPanel.tsx       # لوحة البرديات
    ├── ChatInput.tsx           # إدخال + مايك (STT) + مرفقات + أوضاع المحادثة
    └── ErrorBoundary.tsx       # **Sub-Error Boundaries** لكل وحدة (منع انهيار كامل التطبيق)
```

**قاعدة التبعية الذهبية:** `components → store → services → lib/db` — ممنوع عكس الاتجاه. الـ store هو النقطة الوحيدة اللي بتلمس الـ services.

---

## 3. الـ Pipelines الرئيسية

### 🔵 Pipeline 1: Chat (الأهم — كل رسالة بتمر هنا)

```
المستخدم يكتب/يتكلم (ChatInput / VoiceService STT)
│
├─► workspaceStore.sendMessage(text, attachment?)
│   ├── حماية: لو isGenerating → تجاهل
│   ├── إنشاء session لو مفيش → userMessage + assistantPlaceholder (isStreaming)
│   ├── appendSessionEvent('user/message')          ← 🆕 Event Log
│   │
│   ├── buildContextualPrompt()                     ← ContextBuilder
│   │   ├── BASE_SYSTEM_PROMPT (شخصية أمون + صيغة tasks_extracted)
│   │   ├── {TASKS_CONTEXT}     → أول 15 مهمة معلقة مرتبة بالأولوية
│   │   ├── {MEMORY_CONTEXT}    → getRelevantMemories(query, 8) بالـ token overlap
│   │   ├── {PROJECT_CONTEXT}   → المشروع النشط
│   │   └── modePrefix (minister/general/coding/brainstorm/files)
│   │
│   ├── حل الـ Provider:
│   │   ├── PROVIDERS registry lookup (بالـ model id)
│   │   └── customModels.find(cm.id === activeModel) → 'custom'   ← 🆕 الإصلاح
│   │
│   ├── processPrompt() → AIGateway                 ← انظر Pipeline 2
│   │
│   ├── Streaming (throttled 50ms)                  ← 🆕 Mobile-first
│   │   └── onChunk → flushTimer → set() مجمّع بدل re-render لكل token
│   │
│   └── POST-PROCESSING (بعد اكتمال الرد):
│       ├── stripTaskJSONFromResponse() — إخفاء JSON من الواجهة
│       ├── extractArtifactsFromResponse() → IndexedDB 'artifacts'
│       ├── extractTasks(rawContent) → JSON أولاً → heuristics ثانياً → tasks
│       ├── extractMemories() (fire-and-forget) → Gemini flash يلخص الذكريات
│       ├── appendSessionEvent('assistant/message')  ← 🆕 Event Log
│       └── logEvent('message_received') → metrics
│
└─► أخطاء: AbortError → "⏹ تم الإيقاف" | غير كده → "❌ message" + appendSessionEvent('error')
```

### 🚪 Pipeline 2: AI Gateway Routing (قلب الـ AIGateway)

```
processPrompt(request)
├── sanitizePrompt() على كل رسائل المستخدم (PromptSanitizer)
├── قراءة المفاتيح: wazeerDB.getApiKeys() (IndexedDB 'config' → 'api_keys')
│
├── gemini → geminiProvider.chat() مباشر من المتصفح (@google/genai v2.4)
│   ├── hasTools → ReAct loop (حد أقصى 3 دورات): functionDeclarations
│   │   └── كل tool call → executeToolCall() → 🆕 HorusGuard guard أولاً
│   ├── else hasGrounding → googleSearch: {} (بحث حقيقي)
│   └── الأدوات والبحث ممنوع يتجمعوا في طلب واحد (خطأ 400 من Google)
│
├── claude  → /api/proxy/claude + x-api-key + anthropic-version (SSE)
├── glm     → JWT يتعمل client-side (HS256) → Bearer → /api/proxy/glm أو direct
├── custom  → 🆕 request.customModel (بيتحل في الـ store) → fetch مباشر للـ endpoint
│             └── المفتاح: apiKeys[customModel.apiKeyConfigKey] (مثال: custom_ox_alpha)
└── default → Bearer → /api/proxy/{providerId}

معالجة أخطاء ذكية:
├── 504 → retry مرة واحدة (بدون signal)
└── Gemini 503/resource_exhausted → fallback تلقائي لـ gemini-2.5-flash
```

### 🔐 Pipeline 3: Custom Model (المسار الجديد المُصلح)

```
AddModelModal → حفظ المفتاح في api_keys.custom_<name> + CustomModel في الـ state
TopBar → setActiveModel(cm.id ← UUID, 'custom')
sendMessage → customModels.find(cm.id === activeModel) → processPrompt({customModel})
AIGateway case 'custom' → request.customModel مباشرة (مفيش DB lookup بيفشل)
```

> **درس مستفاد:** الـ UUID بتاع الموديل هو الـ `activeModel` — أي مقارنة بـ `modelId` الفعلي هتفشل. عشان كده بنمرر الـ object كامل في الطلب.

### 🛡️ Pipeline 4: Tool Execution (نمط DSH المصغر — 4 مراحل)

```
Gemini functionCall
├── 1. GUARD     → scanCode(args) — HorusGuard AST
│                  └── critical/high threat → DENIAL (الجسم مايتنفذش)
├── 2. EXECUTE   → write_file / read_file / list_dir (VFS in-memory)
│                  └── run_command → simulated (WebContainer مش موجود)
├── 3. RESULT    → نص يرجع للنموذج (buildFunctionResponsePart)
└── 4. LOG       → toolCalls في الرسالة + onToolCall callback
```

### 🧠 Pipeline 5: Learning (مهام + ذاكرة)

```
استخراج المهام (فوري):
  JSON "tasks_extracted:[...]" من رد الـ AI (أساسي — بيتعلم في الـ system prompt)
  → fallback heuristics: triggers عربي (يجب، قم بـ، لا تنس) + إنجليزي (need to, TODO)
  → priority inference + tags + dedup بالسطر

الذاكرة (fire-and-forget):
  آخر 10 رسائل → Gemini 2.5 Flash (temp 0.1) → JSON مصنف
  (preference/fact/decision/skill/context) → confidence ≥ 0.5 → userMemory store
  الاسترجاع: token overlap (unigrams+bigrams) → top 8 → حقن في system prompt
```

### ⏰ Pipeline 6: Task Scheduler

```
كل 5 دقائق: tasks المستحقة (غير مكتملة + dueDate فاتت + مش manual)
→ حل الـ provider من PROVIDERS registry (🆕 مش startsWith)
→ custom models مدعومة 🆕 | موديل مجهول → skip + تحذير
→ executeSinglePrompt → completed + executionResult
```

### 🗄️ Pipeline 7: Persistence (Zustand → IndexedDB)

```
كل action → set() + _persist()
_persist → snapshot انتقائي (PersistedState) → store 'state' مفتاح 'workspace_state'
_rehydrate عند الإقلاع → دمج { ...DEFAULTS, ...saved }
⚠️ معروف: ده blob أحادي — شوف Bottleneck #1
```

### ☁️ Pipeline 8: Server Proxy + Admin

```
Express (tsx) بورت 3000:
├── Helmet (CSP + COEP credentialless + HSTS) + compression
├── Global limiter 100 req/min على /api/* | Admin 30 req/min
├── 11 proxy routes (http-proxy-middleware v3، timeout 120s، أخطاء JSON نظيفة)
├── /api/health → status + version + adminEnabled
└── /api/admin/* → requireAdmin (⚠️ headers بس — شوف Bottleneck #4)
    dashboard | action (ban/unban/promote/demote) | create-user | users
```

### 🔐 Pipeline 9: Hybrid Auth (Email/Password + Google OAuth) 🆕

```
LoginModal (UI)
├─► Email/Password
│    ├── isRegister ? registerUser(name, email, password) : loginUser(email, password)
│    ├── SHA-256 hash لكلمة المرور via Web Crypto API (مفيش clear text)
│    ├── resolveRole(email): ADMIN_EMAILS → admin، غيره → user
│    ├── حفظ User في IndexedDB stores (users + config.wazir_user)
│    └── syncUserToFirestore + logAuthEvent (local + Firestore)
│
└─► Google OAuth (handleGoogleLogin)
     ├── Dynamic import: firebase/auth → getAuth() + GoogleAuthProvider + signInWithPopup
     │   (Firebase مش bundle بشكل دائم — فقط لما المستخدم يختار Google)
     ├── result.user → displayName, email, photoURL
     ├── loginOAuth(displayName, email, photoURL):
     │    ├── لو مستخدم جديد → auto-register (مفيش passwordHash للمستخدمين OAuth)
     │    ├── لو موجود → تحديث lastLogin + avatar + name + re-resolve role
     │    ├── حفظ في IndexedDB + sync Firestore
     │    └── check banned (role === 'banned' → خطأ)
     ├── silentReAuth على app boot: استرجاع Session + re-resolve role
     ├── logoutUser(): مسح session token + مسح wazir_user من config
     └── createSessionToken() → UUID في localStorage (wazir_session_token)
```

---

## 4. قواعد البيانات

### IndexedDB — `Monmamar` **v6** (10 stores)

| Store | Key | الاستخدام | الحالة |
|-------|-----|-----------|--------|
| `config` | id | API keys + المستخدم + events + tasks القديمة | ✅ مستخدم |
| `state` | id | `workspace_state` — الـ snapshot الكامل (streak activityDates + dailySuggestion هنا) | ✅ مستخدم |
| `logs` | id (AI) | Event logs | ⚠️ مخزن بس مش متعامل معاه UI |
| `artifacts` | id | كتل الكود المستخرجة (indexes: chatId, type, pinned, createdAt) | ✅ مستخدم + Exporters |
| `auth_logs` | id | أحداث الدخول محلياً (login/register/oauth_login/failed_login/logout) | ✅ مستخدم في AuthService |
| `banned_nodes` | ip | محظورون محلياً | ⚠️ متعرف بس Firestore هو الأساسي |
| `userMemory` | id (AI) | الذاكرة التراكمية المصنفة (category, createdAt, sourceSession) | ✅ مستخدم في MemoryEngine |
| `users` | email | حسابات محلية (OAuth + Email/Password مع passwordHash nullable) | ✅ مستخدم في AuthService |
| `session_events` | id (AI) | Event Log append-only: sessionId, timestamp indexes | ✅ write-side منفذ |
| `contributors` | id | 🆕 كروت صفحة About — ترتيب (order index) + صورة + سوشيال | ✅ منفذ في AboutView |

### Firestore (سحابي — اختياري للـ Admin)

`users/{id}` + `auth_logs/{id}` + `banned_nodes/{id}` — بيتفعلو مع `VITE_FIREBASE_*` + `FIREBASE_SERVICE_ACCOUNT`. **قواعد الـ Security Rules في `firestore.rules` لازم تنشر قبل فتح التسجيل.**

Auth Event Types المحفوظة في `auth_logs`:
- `login`, `logout`, `register`, `oauth_login`, `failed_login`, `role_change`, `user_banned`, `user_unbanned`

---

## 5. استراتيجيات DSH

**المصدر:** `deepseek-harness-architecture-tutorial.html` + [deepseek-ai/deepseek-harness](https://github.com/Ayman-AbdelMohaimen/deepseek-harness) — 5 أنماط: Event-Sourced Log، Waterfall Events، Capability Seams، Tool Pipeline، Scoped Registry.

### القرار المعماري: تبنٍّ عملي مش استنساخ

وزير **مش هيتبني على Cordis** — ده over-engineering لتطبيق BYOK client-side. بنطبق *الأنماط* حيث بتحل مشاكل حقيقية:

| النمط | حالة وزير قبل | القرار | الحالة |
|-------|----------------|--------|--------|
| **1. Event-Sourced Log** | messages array داخل blob واحد | ✍️ **write-side أولاً**: store `session_events` append-only + أحداث user/assistant/error. الـ read model (deriveMessages/replay/fork) لاحقاً | 🟡 أساس مطروح |
| **2. Waterfall Events** | pipeline hardcoded | ⏳ hook points خفيفة قبل/بعد الرد — بعد البروداكشن | مؤجل |
| **3. Capability Seams** | switch يدوي في Gateway | ⏳ الـ switch شغال — refactor لـ interface + providers لما نضيف providers كتير | مؤجل |
| **4. Tool Pipeline** | مرحلة واحدة + **HorusGuard يتيم** | ✅ **اتطبق**: Guard (deny) → Execute → Result → Log | ✅ منفذ |
| **5. Scoped Registry** | swarmStore ميت + SWARM pill كذب | ⏳ مع v3 (Hermes) — مسجل كـ mock-in-production | مؤجل |

**القاعدة الذهبية المتبناة:** *"Model-visible means logged"* — أي حاجة بتوصل للنموذج تقدر تتعاد بناؤها من الـ event log.

---

## 6. الـ Bottlenecks المستقبلية

مرتبة بالخطورة — دي قرارات هتتحخذ قبل/بعد الـ launch:

| # | الخطرة | التفصيل | العلاج | التوقيت |
|---|--------|---------|--------|---------|
| 1 | 💥 **workspace_state blob** | كل تغيير بيعمل rewrite لكل الجلسات → بطء + quota (~50MB) + jank | تقسيم لكل-session records + debounce + الانتقال التدريجي للـ event log كـ source of truth | بعد أول 20 مستخدم نشط |
| 2 | 🟡 ~~مفيش Token Budget/Compaction~~ | ✅ **اتحلّ!** TokenManager.ts + estimateTokens + compactMessages عند 70% | **UI Indicator** شريط استهلاك tokens في ChatInput (اللي ناقص بس) | P1 — قبل 50 مستخدم |
| 3 | ⚡ Re-render لكل token | اتحل جزئياً بالـ 50ms throttle؛ فاضل تحسين MessageList (memoization) | React.memo + virtualization لو القوائم طويلة | P2 |
| 4 | 🔐 **Admin auth وهمي** | `x-user-id`/`x-user-role` headers من الـ client — منتحلة بـ curl | Firebase ID token verification في `requireAdmin` | **قبل أول 50 مستخدم** |
| 5 | 🐌 MemoryEngine بيتضخم | قراءة كل الذكريات كل رسالة + N writes للـ accessCount + **مفيش dedup** | dedup بالتشابه (85%) + batch access updates + cap | P1 |
| 6 | 🧪 صفر tests | refactors معمارية من غير شبكة أمان | Vitest: Gateway routing + LearningEngine + HorusGuard (pure functions — سهلة) | P1 |
| 7 | 🔑 GLM JWT client-side | السر في المتصفح — مقبول في BYOK، بس يتوثق كـ risk | توثيق + تعليمات للمستخدم | مقبول |
| 8 | 📡 Custom endpoints CORS | fetch مباشر من المتصفح — Groq/OpenRouter بيوافقوا، OpenAI بيرفض | توثيق الـ providers الـ CORS-friendly + relay اختياري في السيرفر لاحقاً | حسب الحاجة |
| 9 | 🎭 SWARM pill كذب | StatusPill أخضر hardcoded — mock في production | توصيله بـ swarmStore أو إزالته | قرار من العرآب |
| 10 | 🔴 Artifact Panel ناقص | Exporters/Importers جاهزة لكن: (1) تسمية ذكية HTML/MD/Code، (2) Full Width toggle في ArtifactPanel | تكملة UI bindings + workspaceStore smart naming | P1 — قريب |
| 11 | 🔴 Token Compaction مش متصل بالPipeline | TokenManager منفذ لكن `sendMessage()` ما تستدعيشه تلقائياً قبل AIGateway | استدعاء `compactMessages()` + حفظ summary في history عند البوابة | P1 |

---

## 7. التشغيل والنشر

```bash
# التطوير
npm install
npm run dev        # Vite dev server
npm run server     # Express proxy + admin على :3000 (tsx — مش watch، اعمل restart يدوي)

# البروداكشن
npm run build      # → dist/
npm run server     # يخدم dist/ + الـ proxies على نفس البورت

# النشر (Hostinger VPS حسب 14-DEPLOYMENT.md)
pm2 start src/server/index.ts --interpreter tsx --name wazeer-os
pm2 save && pm2 startup
# Health check: https://<domain>/api/health → {"status":"ok","version":"2.1.0",...}
```

**متغيرات البيئة:** انظر `.env.example` — السيرفر محتاج `PORT` + `FIREBASE_SERVICE_ACCOUNT` (اختياري للـ Admin). **المفاتيح بتاعة الـ LLM مش في الـ env أبداً** — BYOK: كل مستخدم مفاتيحه في IndexedDB على جهازه.

---

## 8. المشاكل المعروفة والخريطة

**اتصلحت (2026-08-25):**
- ✅ Custom Models مش شغالة (DB lookup غلط + UUID/modelId تعارض)
- ✅ 16 خطأ TypeScript (vite-env.d.ts، proxyFactory v3، db casts، ProjectsView، theme union، AdminDashboardData import)
- ✅ TaskScheduler provider detection (startsWith → registry + custom support)
- ✅ HorusGuard كان يتيم → دخل الـ Tool Pipeline كـ guard
- ✅ تحذيرات `[DOM] Password field` (forms في OnboardingWizard + AddModelModal)
- ✅ Streaming re-render لكل token → throttle 50ms

**اتصلحت (2026-08-30):**
- ✅ عداد الثواني + الحالة العربية النهائية بتتحفظ جوه ChatMessage (مش UI مؤقت)
- ✅ زر الإعدادات الذهي في أخطاء الـ API key (isApiKeyError + setActiveView settings)
- ✅ سقف 10 ثواني لـ testModel (فاحص الموديلات مش هيطلّ فوق ده)
- ✅ Plan 1.3 (rateMessage 👎/😍) و Plan 1.1 (testModel) كانوا متنفذين في الكود بس مش مسجلين في الوثائق

**اتصلحت (2026-09-02):**
- ✅ Google OAuth بالكامل: LoginModal + AuthService loginOAuth + Firebase Auth dynamic import
- ✅ صفحة About عامة: Contributor Cards كاملة (صورة + اسم + وظيفة + نبذة + 4 سوشيال)
- ✅ Contributor CRUD كامل: Modal إضافة/تعديل/حذف + Admin hover actions + ترتيب
- ✅ IndexedDB v6 bump + contributors store جديد مع order index
- ✅ NAV_ITEMS فيه About مع Info icon + Sidebar ICON_MAP اتصلح (كان ناقص Info)
- ✅ ViewRouter فيه About case + App.tsx imports كاملة
- ✅ Sub-Error Boundaries: TopBar/Sidebar/Workspace/ArtifactPanel مغلفين بـ ErrorBoundary
- ✅ Token Budgeting كامل: estimateTokens + compactMessages عند 70% في TokenManager
- ✅ Exporters/Importers: exporters.ts كامل (.md/.html/.json/.txt/CSV) + importers.ts كامل (JSON/CSV/MD + dedup)
- ✅ Prompt Templates CRUD + useTemplate (فتح session جديد مع preset)
- ✅ runTask زر RUN على المهام + rateMessage تقييم الرسايل مسجلة فعلاً
- ✅ Streak (activityDays) + Daily Suggestion (اقتراح أُمون يومي يتولد مرة كل 24 ساعة)
- ✅ Mark "PanelLeftOpen import bug" محلول (اتضاف في TopBar + rebuild bundle)

**اتصلحت (2026-09-11) — جولة GMT:**
- ✅ Honeypot 3-strikes مكتمل (كان فاضل typo): `HONEYPOT_FIELD_NAMES` → `HONEYPOT_ONBOARDING_FIELDS` في OnboardingWizard — **tsc 0 أخطاء + build ناجح**
- ✅ فحص Phase 1 ضد الكود: smart naming · full-width toggle · token auto-compaction · token UI indicator — كلها مؤكدة منفذة (الاتوثيق كان متأخر عن السورس)
- ✅ CI/CD: GitHub Actions (tsc + vitest + build) على `main` + فتح فرع `v2.2-dev`

**المفتوحة:** شوف `Tasks.md` — فيه التوزيع الكامل P0/P1/P2 + roadmap الـ DSH.

---

## 9. قواعد المشروع

1. **Green Code** — نكتب اللي يلزمنا بس. مفيش dead code، مفيش stubs، مفيش mocks في production، مفيش `any`، ملفات service ≤ 500 سطر.
2. **Security is Mindset** — HorusGuard على كل كود متولد، مفيش مفاتيح في السورس أو الـ env للـ LLM، الـ keys في IndexedDB بتاع المستخدم بس.
3. **Mobile First** — كل UI يتصمم للموبايل أولاً (BottomNav موجود)، والأداء بيتقاس على موبايل متوسط.
4. **Localization عربي مصر** — `currentLanguage: 'ar'` افتراضي، كل component فيه `isRtl`، والـ prompts بتاعة أمون عربي أصيل.
5. **الهوية** — أمون/وزير OS 𓂀 | العرآب | 100MillionDEV.com

---

> صُنع بـ ❤️ بواسطة العرآب | حقوق النشر 100MillionDEV.com
>
> 𓂀 Wazeer OS v2.1 — Egyptian Cyberpunk AI Assistant
