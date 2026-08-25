# 𓂀 Wazeer OS v2.1 — رحلة الـ Handover الكاملة

> **المرجع الرئيسي** — الوثيقة دي هي خريطة الطريق الحية للتطبيق: إحنا جتنا منين، إحنا فين دلوقتي، والـ Pipelines شغالة إزاي بالظبط من جوه الكود الفعلي.
>
> **آخر تحديث:** 2026-08-25 | **الحالة:** Pre-Production | **المالك:** العرآب — 100MillionDEV

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

### درس الـ v2.0 المهم
وثيقة `Full-Handover-for-Request-and-all-functioning-Pipelines.md` بتوصف معمارية **v2.0 القديمة** (stores منفصلة، client/server منفصلين) — **مش مطابقة للواقع الحالي**. الوثيقة دي (اللي بتقراها) هي المرجع الصحيح لـ v2.1.

---

## 2. المعمارية الفعلية

```
src/
├── main.tsx                    # Bootstrap: wazeerDB.init() + Service Worker
├── App.tsx                     # ViewRouter (switch بسيط) + Modals + Theme
├── types/index.ts              # ⭐ المصدر الوحيد لكل الـ Types
├── constants/index.ts          # ⭐ PROVIDERS registry + BASE_SYSTEM_PROMPT + LIMITS
│
├── store/
│   └── workspaceStore.ts       # 🧠 قلب التطبيق (Zustand): sessions, tasks, projects,
│                               #    models, sendMessage (الـ Pipeline الرئيسية), persistence
│
├── services/
│   ├── AIGateway.ts            # 🚪 البوابة الموحدة: routing + SSE + retry/fallback
│   ├── providers/
│   │   └── geminiProvider.ts   # Gemini SDK مباشر (streaming + ReAct tools)
│   ├── tools/
│   │   └── ToolRegistry.ts     # تعريفات الأدوات + VFS + 🆕 HorusGuard guard
│   ├── security/
│   │   ├── HorusGuard.ts       # AST scanner (Babel) — 16 قاعدة تهديد
│   │   └── PromptSanitizer.ts  # تنقية مدخلات المستخدم
│   └── learning/
│       ├── ContextBuilder.ts   # تجميع system prompt (مهام + ذاكرة + مشروع)
│       ├── LearningEngine.ts   # استخراج المهام (JSON من AI + heuristics عربي/إنجليزي)
│       ├── MemoryEngine.ts     # الذاكرة التراكمية (استخراج بـ Gemini + استرجاع بالكلمات)
│       └── TaskScheduler.ts    # تنفيذ تلقائي للمهام المستحقة كل 5 دقائق
│
├── lib/
│   ├── db.ts                   # IndexedDB "Monmamar" v5 — 9 stores + in-memory fallback
│   └── firestore.ts            # مزامنة سحابية (users, auth_logs, banned_nodes)
│
├── server/                     # Express (tsx) — بورت 3000
│   ├── index.ts                # Helmet + Rate limits + Admin API + SPA fallback
│   ├── providers.ts            # 11 proxy route: /api/proxy/{claude,glm,nvidia,groq,...}
│   └── proxyFactory.ts         # http-proxy-middleware v3 (timeout 120s + error sanitize)
│
└── components/
    ├── layout/TopBar.tsx       # ⭐ Model Selector (بيضيف Custom models للقايمة)
    ├── views/                  # Home, Workspace, Settings, Projects, Admin, Placeholders
    ├── OnboardingWizard.tsx    # ترحيب → مفاتيح مجانية → لغة/ثيم → جولة
    ├── AddModelModal.tsx       # إضافة موديل مخصص (endpoint + key + vision)
    └── ChatInput.tsx           # إدخال + مايك (STT) + مرفقات + أوضاع المحادثة
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

---

## 4. قواعد البيانات

### IndexedDB — `Monmamar` **v5** (9 stores)

| Store | Key | الاستخدام |
|-------|-----|-----------|
| `config` | id | API keys + المستخدم + events + tasks القديمة |
| `state` | id | `workspace_state` — الـ snapshot الكامل |
| `session_events` | id (AI) | 🆕 **Event Log** — append-only، indexes: sessionId, timestamp |
| `artifacts` | id | كتل الكود المستخرجة (indexes: chatId, type, pinned) |
| `userMemory` | id (AI) | الذاكرة التراكمية المصنفة |
| `users` | email | حسابات محلية |
| `auth_logs` | id | أحداث الدخول محلياً |
| `banned_nodes` | ip | محظورون محلياً |
| `logs` | id (AI) | محجوز — مش مستهلك بالـ UI |

### Firestore (سحابي — اختياري للـ Admin)

`users/{id}` + `auth_logs/{id}` + `banned_nodes/{id}` — بيتفعلو مع `VITE_FIREBASE_*` + `FIREBASE_SERVICE_ACCOUNT`. **قواعد الـ Security Rules في `firestore.rules` لازم تنشر قبل فتح التسجيل.**

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
| 2 | 💥 **مفيش Token Budget/Compaction** | تاريخ الجلسة كله بيتبعت كل رسالة → 400 errors مع الجلسات الطويلة | history trimming + تلخيص الرسايل القديمة (compaction على طريقة DSH) | P1 — قبل 50 مستخدم |
| 3 | ⚡ Re-render لكل token | اتحل جزئياً بالـ 50ms throttle؛ فاضل تحسين MessageList (memoization) | React.memo + virtualization لو القوائم طويلة | P2 |
| 4 | 🔐 **Admin auth وهمي** | `x-user-id`/`x-user-role` headers من الـ client — منتحلة بـ curl | Firebase ID token verification في `requireAdmin` | **قبل أول 50 مستخدم** |
| 5 | 🐌 MemoryEngine بيتضخم | قراءة كل الذكريات كل رسالة + N writes للـ accessCount + **مفيش dedup** | dedup بالتشابه (85%) + batch access updates + cap | P1 |
| 6 | 🧪 صفر tests | refactors معمارية من غير شبكة أمان | Vitest: Gateway routing + LearningEngine + HorusGuard (pure functions — سهلة) | P1 |
| 7 | 🔑 GLM JWT client-side | السر في المتصفح — مقبول في BYOK، بس يتوثق كـ risk | توثيق + تعليمات للمستخدم | مقبول |
| 8 | 📡 Custom endpoints CORS | fetch مباشر من المتصفح — Groq/OpenRouter بيوافقوا، OpenAI بيرفض | توثيق الـ providers الـ CORS-friendly + relay اختياري في السيرفر لاحقاً | حسب الحاجة |
| 9 | 🎭 SWARM pill كذب | StatusPill أخضر hardcoded — mock في production | توصيله بـ swarmStore أو إزالته | قرار من العرآب |

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
