# 📋 Wazeer OS — Task Board

> **⭐ الخطة الموحدة انتقلت إلى: [`Plan-v2.2.md`](./Plan-v2.2.md)** — كل المهام المتبقية مدمجة هناك (Phases 1 → 1.5 → 2 → 3).
> الملف ده: سجل الإنجازات + المهام الفورية فقط.

---

## ✅ سجل الإنجازات — 2026-09-11 (🚀 GMT — البيتّا Live على Wazeer.me)

### 🧹 فحص Phase 1 ضد الكود الفعلي (السورس أسبق من الوثائق بـ commit "Command Center")
- [x] **إصلاح خطأ `HONEYPOT_FIELD_NAMES`**: التسمية الصحيحة `HONEYPOT_ONBOARDING_FIELDS` في `OnboardingWizard.tsx` — رجع الـ `tsc --noEmit` لـ **0 أخطاء** ✅
- [x] **تأكيد المنفذ فعلاً** (وكان متسجل كـ pending في الوثائق):
  - [x] Artifact smart naming → `deriveArtifactTitle()` في `workspaceStore.ts`
  - [x] Full-width toggle ⛶ → `isFullWidth` state في `ArtifactPanel.tsx`
  - [x] Token auto-compaction في الـ pipeline → `compactMessages()` في `sendMessage()`
  - [x] Token UI Indicator → badge ⚡ في `ChatInput.tsx` (بيحمر عند 70%+)
- [x] **Honeypot 3-strikes مكتمل**: `HoneypotService.ts` (3 تحذيرات → ban 24h) + مربوط في `LoginModal` و `OnboardingWizard` + حدث `honeypot_trigger` في `AuthLog`
- [x] `vite build` ناجح — البندل الأساسي 2.59MB (665KB gzip) → مسجل كبند Code Splitting في Phase 3

---

## ✅ سجل الإنجازات — 2026-09-08

### 🔥 إصلاح الشاشة البيضاء (Critical Production Fix)
- [x] **تشخيص المشكلة**: تشغيل التطبيق محلياً على localhost:5173 + مراجعة Browser Console → تم اكتشاف الخطأ `ReferenceError: process is not defined` في `@babel/traverse`
- [x] **تحليل السبب**: مكتبة `@babel/traverse` و `@babel/types` (المستخدمة في `HorusGuard.ts` لعمل AST scanning للأكواد) بتعتمد على متغير Node.js global اسمه `process` — والـ Vite 6 مش بيعمل polyfill لهذا المتغير افتراضياً في المتصفح، وده كان بيمنع تحميل أي React component وبيظهر الشاشة البيضاء
- [x] **الحل بطبقات أمان متعددة (3 layers)**:
  - [x] **Layer 1**: إضافة `<script>` polyfill مبكر في أول `<head>` بتاع `index.html` يعرّف `window.process` مع كل attributes (env, argv, cwd, platform, nextTick) قبل تحميل أي سكربت
  - [x] **Layer 2**: إضافة `define` و `optimizeDeps.esbuildOptions.define` في `vite.config.ts` عشان الـ Vite transformer يحول كل وصول لـ `process` / `global` إلى `globalThis.process` / `globalThis` سواء في user code أو deps pre-bundle
  - [x] **Layer 3**: إنشاء ملف `src/polyfill.ts` كأول `import` في `main.tsx` عشان يضمن تحميل الـ polyfill قبل أي module تاني (React / Zustand / HorusGuard)
- [x] **مسح cache**: حذف مجلد `node_modules/.vite/` عشان يعمل re-optimize للـ deps بالـ config الجديد
- [x] **التحقق**: ظهور واجهة Command Center كاملة (49 refs, 21 interactive elements) بالعربي RTL مع جميع العناصر: TopBar, Hero, Quick Actions, Dashboards, Mobile Nav, Footer

### 📋 مراجعة ودمج المهام من الوثائق الخمس
- [x] **مراجعة شاملة**: قراءة وتحليل 5 وثائق أساسية (`Plan-v2.2.md`, `PROJECT_MAP.md`, `Tasks.md`, `V2 Handover Journey.md`, `WAZEER-OS-V2.1-PRODUCTION-REVIEW.md`)
- [x] **استخراج المهام الناقصة**: تحديد 13 مهمة مستحقة لم تكن مسجلة بالكامل في Tasks.md وتصنيفها حسب الأولوية
- [x] **دمج في القائمة**: إضافة المهام الجديدة في أقسام الأولويات مع ربطها بالمصادر والوثائق المعتمدة

---

## ✅ سجل الإنجازات — 2026-09-02

### جلسة العمل الحالية (Login + About + Core Services)
- [x] **Google OAuth في LoginModal**: زر تسجيل الدخول بـ Google (بضغطة واحدة) مع `loginOAuth` + resolveRole — Firebase Auth dynamic import + signInWithPopup
- [x] **OAuth في AuthService**: `loginOAuth(name, email, avatarUrl)` — تسجيل تلقائي لو المستخدم جديد + sync Firestore + log `oauth_login`/`register`
- [x] **صفحة About عامة**: كروت المساهمين (صورة + اسم + وظيفة + نبذة + LinkedIn + Facebook + X + GitHub) — مرئية للجميع، يعدّلها الأدمن فقط
- [x] **Contributor CRUD**: Modal إضافة/تعديل/حذف مساهم مع ترتيب (order) + Admin actions على الـ hover — مخزّن في IndexedDB store `contributors`
- [x] **`contributors` store في IndexedDB v6**: تعريف Store جديد + bump version إلى 6 (كان v5) + index `order`
- [x] **nav item "عن المشروع"**: إضافة About لـ NAV_ITEMS (icon Info) وViewRouter case + import في App.tsx
- [x] **🔧 إصلاح Sidebar ICON_MAP**: إضافة `Info` للأيقونات المستوردة وللـ Map (كان مفقود → بيظهر Home بدل Info)
- [x] **تصميمات UI/UX متعددة** (Sidebar, TopBar, Projects, History, Chat, SDD switch, Admin/IP ban)
- [x] **Sub-Error Boundaries فرعية**: TopBar · Sidebar · Workspace (ViewRouter) · ArtifactPanel — كلها مغلفة بـ ErrorBoundary في App.tsx (يمنع انهيار كامل التطبيق)
- [x] **Token Manager & Context Compaction**: `TokenManager.ts` — `estimateTokens()` (عربي 2.5 حرف / إنجليزي 4 حرف) + `compactMessages()` تلقائي عند 70% من حد الموديل
- [x] **Exporters (lib/exporters.ts)**: تصدير Artifacts بـ `.md` / `.html` / `.json` / `.txt` + `downloadFile()` helper + CSV للمهام
- [x] **Importers (lib/importers.ts)**: استيراد مهام بـ `.json` / `.csv` / `.md` + auto-detect للـ format + dedup + `ImportedTaskDraft` interface
- [x] **`runTask` زر RUN على المهام (Plan 1.4)**: ميثود في workspaceStore تفتح Workspace وترسل برومبت تنفيذ فوري للـ task
- [x] **`rateMessage` تقييم الرسايل (Plan 1.3)**: 👎/😍 + ratingTags تحفظ في ChatMessage وتذكّر في الـ store
- [x] **Prompt Templates CRUD**: `addTemplate` / `updateTemplate` / `deleteTemplate` / `useTemplate` (فتح session جديد + إرسال preset)
- [x] **سلسلة الإنجاز اليومية**: `activityDates[]` في State + `markActivityToday()` + `generateDailySuggestion()` (اقتراح أُمون يومي يتولد مرة كل 24 ساعة)
- [x] **Artifact Export**: تصدير بضغطة في Exporters جاهزة + Types حقيقية لـ ExportableArtifact

---

## ✅ سجل الإنجازات — 2026-08-30

### الشفافية المثبتة + فاحص الموديلات (إكمال Plan 1.1)
- [x] **تثبيت العداد على بيانات الرسالة**: الثواني النهائية + الحالة العربية النهائية (✅ اكتمل · ⏹ اتوقف · ⛔ فشل) بتحفظ جوه `ChatMessage` وتفضل ظاهرة بعد انتهاء التوليد — مش UI مؤقت
- [x] **لينك الإعدادات في أخطاء المفتاح**: أي رسالة خطأ سببها API key بتعلم بـ `apiKeyError` وتعرض زر ذهبي "ضيف مفتاح الـ API من الإعدادات" → `setActiveView('settings')`
- [x] `isApiKeyError()` في `errorHumanize.ts` — كشف موحّد لأخطاء المفاتيح (401/unauthorized/invalid key/permission_denied)
- [x] **سقف 10 ثواني لـ testModel** (معيار قبول Plan 1.1) — بروفايدر ميت عمره مهما يطلّ الفاحص: "⏱ مجابش في 10 ثواني"
- [x] 🔍 مراجعة كود: Plan 1.3 (شبشب/قلوب + وسوم + ذاكرة تصحيحية) و Plan 1.1 (testModel + أزرار ⚡) كانوا متنفيذين في الكود — اتظبطت علمتهم تحت

---

## ✅ سجل الإنجازات — 2026-08-25

### التوسع والإضافة (Phases 1 → 2)
- [x] **صفحات 10 جديدة**: TemplatesView · HistoryView · ComputeView · StorageView · AgentsView · SkillsView · ReportsView · IntegratedView · KingsToolsView · LandingView — كلها مبنية على بيانات حقيقية من IndexedDB والمتجر
- [x] `PromptTemplate` CRUD + `useTemplate` — new session + send preset prompt
- [x] `AgentStatus` live view — swarm agents with tasks, tokens, retries
- [x] `Skill` listing — 9 skills with live status + explanations + chat modes
- [x] `Report` dashboard — ratings per model, due tasks, memory insights, best/worst models
- [x] `IntegratedView` — providers grid + CORS docs + PWA status
- [x] `KingsToolsView` — governance council embedded + 5 management tools
- [x] `LandingView` — landing page with features, CTA, footer
- [x] `StorageView` — quota bar + record counts + blob size health + export/purge/wipe
- [x] `HistoryView` — append-only event log filtered + searchable
- [x] `ComputeView` — KPI cards + weekly activity + per-model table
- [x] `TemplatesView` — add/edit/delete templates + one-click run
- [x] `addTemplate` / `updateTemplate` / `deleteTemplate` / `useTemplate` in workspaceStore

---

## ✅ سجل الإنجازات — 2026-08-25

### الإصلاح الكبير + DSH
- [x] إصلاح Custom Models (routing + UUID/modelId) — كانت مش شغالة خالص
- [x] 16 خطأ TypeScript → **صفر** (vite-env.d.ts · proxyFactory v3 · db casts · ProjectsView · theme union · AdminDashboardData)
- [x] توصيل HorusGuard بالـ Tool Pipeline (كان يتيم — مش منادى به في أي حتة)
- [x] TaskScheduler: provider detection صحيح + دعم Custom Models
- [x] Session Event Log (IndexedDB **v5** · store `session_events` · write-side)
- [x] Streaming throttle 50ms (Mobile-first — بدل re-render لكل token)

### Providers والموديلات
- [x] Gemini 3.6 migration (registry + fallback + MemoryEngine + migration تلقائي) — بعد تقادم 2.5
- [x] إصلاح Proxy: bindLlmRouters قبل express.json (NVIDIA ERR_EMPTY_RESPONSE — مُثبت بـ curl)
- [x] OpenRouter ×8 موديلات جديدة (GLM-5.2 · OX Alpha · Laguna S/XS · Nemotron ×3)
- [x] Groq Provider كامل (Llama 3.3/3.1 · GPT-OSS 120B/20B)
- [x] CRUD الموديلات من الفرونت: إضافة جوه مجموعات + Endpoint مخصص + حذف + إخفاء + استعادة

### UX والشفافية
- [x] عداد ثواني + حالة عربية حية أثناء التوليد (تجهيز → اتصال → كتابة)
- [x] أخطاء مترجمة مصري + unwrap 3 مستويات + cap 240 حرف + abort detection موسع
- [x] RTL: TopBar dropdown (dynamic class bug) · Sidebar border · صفحة الإعدادات (الأيقونات)
- [x] إصلاح زر حفظ المفاتيح (form onSubmit) + إزالة تحذيرات Password DOM
- [x] مجلس الحوكمة وتطهير الذاكرة — 4 مستويات + تأكيد خطوتين (من `Ui - UX V2.txt`)

---

## 🚀 خطة العمل الحالية — الأولويات المرتبة

### 🔴 فوري (تم الإنجاز بالكامل والتحقق منه — Wazeer.me Mobile + Manus Suite + Skills)
- [x] **1. إصلاحات واجهة الموبايل (Mobile UX/UI Bugs — سكرين شوت 1)**:
  - [x] إصلاح TopBar على الموبايل: منع خروج زر الدخول (Login) خارج الشاشة وضمان ظهوره دائماً.
  - [x] تفعيل زر القائمة (Menu) على شاشات الموبايل بفتح دراور/قائمة تنقل جانبية منسدلة حقيقية تضم كل الـ Views والتنقلات.
  - [x] ضبط وتوسيط لوجو العين الملكية (Horus) بهالته الذهبية المتناسقة.
  - [x] نقل صندوق الشات إلى أسفل الهيرو مباشرة وتقليل البادينج الجانبي (px) لمنع انكسار وازدحام أزرار الإدخال (مايك، وزير 3D، إرسال).
- [x] **2. قائمة المحادثة المصغرة (Manus Mini-Menu — سكرين شوت 2)**:
  - [x] إضافة قائمة `...` خيارات مصغرة لكل محادثة ومشروع: المفضلة (Favorite)، إعادة التسمية (Rename)، عرض الملفات (View all files)، جدولة مهمة (Schedule task)، إضافة لمشروع (Add to project)، والحذف (Delete).
  - [x] إتاحتها في ترويسة مساحة العمل (Workspace Header) وكذلك في القائمة الجانبية (Sidebar).
- [x] **3. الاستبيانات التفاعلية والتحديث اللحظي التتابعي (Interactive Selection & Live Minimized Stream — سكرين شوت 3)**:
  - [x] بناء مكون الاختيارات والاستبيان التفاعلي `InteractiveSelectionCard` (خيارات أحادية Single، خيارات متعددة Multiple، ملاحظات نصية Remarks، أزرار Skip و Continue بعداد زمني).
  - [x] بطاقات التحديث التتابعي اللحظي القابلة للطي (Minimized / Collapsible Badges: `Explored N files >`، عداد وقت التشغيل، تشغيل المهام بالخلفية، ومعاينة سطر أوامر مصغر) متزامنة مع الشات والـ CLI.
- [x] **4. منظومة المهارات المتقدمة (Skills 3D & Custom Skills)**:
  - [x] زر 3D فيزيائي فاخر لتفعيل/تعطيل كل مهارة في كروت المهارات (SkillsView).
  - [x] زر `+` مودال لإضافة مهارة مخصصة جديدة (Custom Skill).
  - [x] إدارة `customSkills` وتفعيلها في Zustand Store مع الحفظ والاسترجاع المستمر في IndexedDB.
  - [x] ربط المهارات النشطة ديناميكياً ببرومبت النظام في `ContextBuilder.ts`.
  - [x] فحص `tsc` كامل وحل كافة أخطاء الـ TypeCheck وبناء الـ Production Build والتحقق من سلامة السيرفر.

- [x] Google OAuth (بضغطة واحدة) في LoginModal
- [x] صفحة About + Contributor Cards + Admin CRUD
- [ ] **📦 Artifacts Panel (Plan 1.2)**:
  - [x] exporters.ts → تصدير `.md/.html/.json/.txt` + CSV للمهام (منجز)
  - [x] importers.ts → استيراد مهام `.json/.csv/.md` + dedup (منجز)
  - [x] **تسمية ذكية** (HTML→`<title>` · MD→أول H1 · Code→اسم ملف) في workspaceStore — منجز (`deriveArtifactTitle`)
  - [x] **Full Width ⛶ toggle** في ArtifactPanel (بدل `max-w-2xl`) — منجز
- [x] **▶️ زر RUN على المهام (Plan 1.4)**: `runTask()` منجز في workspaceStore
- [x] **🐝 Honeypot 3-strikes rule** (Production Review P0.5):
  - [x] أول 3 تفعيلات لـ honeypot → warning بس (منع false positives من browser autofill)
  - [x] بعد الثالث → actual ban (24h)
  - [x] log كل trigger في `auth_logs` **Firestore** + IndexedDB (منجز 2026-09-11 — fire-and-forget عبر `logAuthEventToFirestore`)

### 🟠 عالي الأولوية (بعد الفوري مباشرة)
- [x] **Token Manager & Context Compaction**: `estimateTokens()` + `compactMessages()` في TokenManager.ts — منجز
- [x] **Token UI Indicator**: badge ⚡ في ChatInput بيوضح نسبة السياق (amber عند 70%+) — منجز (ممكن ترقيته لشريط Green/Yellow/Red لاحقاً)
- [x] **Sub-Error Boundaries فرعية**: TopBar · Sidebar · WorkspaceView · ArtifactPanel — منجز في App.tsx

### 🔐 أمان (Phase 1.5)
- [ ] **Firebase Admin Auth حقيقي**: استبدال `x-user-role` headers بـ Firebase ID token verification في `requireAdmin`
- [ ] **نشر Firestore Security Rules**: تطبيق `firestore.rules` الموجود + اختبار القواعد
- [ ] **Vitest أساسي**: اختبارات AIGateway routing · LearningEngine · HorusGuard · exporters — منجز جزئياً (HorusGuard · exporters/importers · TokenManager = 23 اختبار ✓، باقي AIGateway routing · LearningEngine)

### 🟡 متوسط (Phase 2)
- [ ] **🔑 API Key Pattern Detection في HorusGuard** (Production Review P1.1):
  - [ ] كشف GLM keys: `id.secret` (بفاصلة) → يتولد منه JWT
  - [ ] كشف JWT tokens: `eyJhbGciOi...` (base64)
  - [ ] كشف AWS keys: `AKIA...`
  - [ ] كشف Anthropic / OpenRouter / Groq keys: `sk-ant-...` / `sk-or-...` / `gsk_...`
- [ ] **VFS Persistence**: حفظ شجرة الـ VFS في IndexedDB (`vfs_files`) — الملفات تعيش بعد الـ Refresh
- [ ] **Roles Engine**: `public/roles/*.md` + `services/rolesEngine.ts` + Roles Manager UI
- [ ] **Execution Bridge**: `POST /api/execute` حقيقي مع whitelist + HorusGuard قبل التنفيذ
- [ ] **Hermes المستقل**: وكيل خلفي مستقل بموديل/مفتاح خاص + Circuit Breaker
- [x] **Token Auto-Compaction في Pipeline**: تشغيل `compactMessages()` تلقائياً داخل `sendMessage()` قبل استدعاء AIGateway (منجز — مفيّد بالكود، workspaceStore.ts → `getSessionMessages`)

### 🟢 أداء (Phase 3)
- [ ] **تقسيم `workspace_state` blob**: sessions/{id}/messages + sessions/{id}/metadata + global/settings — يمنع CPU jank مع كثرة الجلسات
- [ ] **Code Splitting + Lazy Monaco**: manualChunks — الباندل الحالي 2.4MB
- [ ] **MessageList memoization/virtualization**: أداء الشات مع 500+ رسالة

---

## 📝 ملاحظات ثابتة
- Custom endpoints وCORS: Groq/OpenRouter ✓ · OpenAI ✗ من المتصفح
- GLM JWT client-side — risk مقبول في BYOK
- السيرفر tsx مش watch — restart يدوي بعد تعديل `src/server/`
- التحديثات الأمامية محتاجة Hard Refresh واحد (skipWaiting مفعّل في الـ SW)
- **تم حل خطأ PanelLeftOpen**: بإضافة الـ import في `TopBar.tsx` وإعادة بناء الـ bundle بـ Vite build.
