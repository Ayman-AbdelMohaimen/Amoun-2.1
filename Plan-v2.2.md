# 🗺️ خطة وزير OS v2.2 — التحسينات الأساسية (Standalone) + استلهام أنماط زمرة
### 🧬 الخريطة الموحدة الموحدة — مدمج فيها كل مهام `Tasks.md` المتبقية

> **ملف مراجعة وتنفيذ** — مبني على `SCR/التحسينات الاساسية لهيكلة.txt` + `SCR/Ui - UX V2.txt` + تحليل [ZomraPRO](https://github.com/Ayman-AbdelMohaimen/ZomraPRO) + `Tasks.md`
> **آخر تحديث:** 2026-08-25 | **الحالة:** 🟡 قيد المراجعة والتنفيذ
> **⭐ مبدأ حاكم:** وزير **Standalone** — يشتغل لوحده بالكامل، أي تكامل مستقبلي (زمرة أو غيرها) محول اختياري فقط
> **القرارات المعتمدة:** MD صيغة · `public/` + IndexedDB · whitelist + python (pip مؤجلة) · هيرمس مستقل بالخلفية

---

## 📖 الفهرس
1. [✅ المنجز (سجل الإنجازات)](#1-المنجز)
2. [خلاصة تحليل زمرة](#2-خلاصة-تحليل-زمرة)
3. [استراتيجية الدمج والاستقلالية](#3-استراتيجية-الدمج)
4. [🔴 Phase 1 — الجاهزية الفورية](#4-phase-1)
5. [🔐 Phase 1.5 — الأمان قبل التوسع](#5-phase-15)
6. [🟡 Phase 2 — القدرات المحلية + الصلابة](#6-phase-2)
7. [🟢 Phase 3 — التوسع والأداء](#7-phase-3)
8. [ملاحظات ثابتة](#8-ملاحظات-ثابتة)

---

## 1. ✅ المنجز

### جلسة 2026-08-25 (الإصلاح الكبير + DSH)
- ✅ إصلاح Custom Models (routing + UUID/modelId) · 16 خطأ TypeScript → صفر
- ✅ توصيل HorusGuard بالـ Tool Pipeline (كان يتيم) · TaskScheduler provider detection
- ✅ Session Event Log (IndexedDB v5 · write-side) · Streaming throttle 50ms
- ✅ Gemini 3.6 migration (registry + fallback + MemoryEngine + migration تلقائي)
- ✅ إصلاح الـ Proxy (bindLlmRouters قبل express.json — NVIDIA اتحسّت، مُثبت بـ curl)
- ✅ شفافية التوليد: عداد ثواني + حالة عربية حية + أخطاء مترجمة + abort detection
- ✅ RTL: TopBar dropdown (dynamic class bug) · Sidebar border · صفحة الإعدادات
- ✅ CRUD الموديلات: إضافة جوه مجموعات + حذف + إخفاء + استعادة · OpenRouter ×8 + Groq provider
- ✅ تنضيف رسايل الأخطاء (unwrap 3 مستويات + cap 240 حرف)
- ✅ مجلس الحوكمة وتطهير الذاكرة (4 مستويات + تأكيد خطوتين) — من `Ui - UX V2.txt`

---

## 2. خلاصة تحليل زمرة

**نفس الستاك بالظبط** (React 19/Vite 6/Zustand 5/Tailwind 4/Babel) — الدمج طبيعي.

| # | الكنز | قيمته لوزير |
|---|-------|-------------|
| 1 | `zomra-roles/` — 48 ملف MD أدوار | بند 2: وكلاء MD-driven |
| 2 | `zomra-server.js` — جسر تنفيذ (whitelist + containment + timeout) | بند 8: تنفيذ حقيقي |
| 3 | أمان الجسر (3 ثغرات هنصلحها: فحص args، تقييد التقديم، HorusGuard قبل التنفيذ) | أماننا أقوى |
| 4 | File System Access API | فولدر المستخدم |
| 5 | Horus المحلي (صفر tokens) | عندنا HorusGuard ✓ |
| 6 | `.zomra_skills.json` — تعلم من الأخطاء المحلولة | Phase 3 |
| 7 | Skeptical Memory — تحقق قبل الكتابة | Phase 3 |
| 8 | Lexical RAG — سياق محلي بدل ملفات كاملة | Phase 3 |
| 9 | دساتير MD (hermes.md/horus.md) | Modes Hub |
| 10 | Sub-Agent Orchestration + Circuit Breaker | هيرمس المستقل |

---

## 3. استراتيجية الدمج

> **⭐ Standalone First:** وزير يشتغل لوحده 100%. زمرة = مصدر أنماط + محتوى منسوخ مرة واحدة.
> أي تكامل مستقبلي = Adapter اختياري في طبقة Integrations — تعطيله لا يكسر شيئاً.

**قواعد الاستقلالية:**
1. الأدوار MD → محتوى منسوخ مرة واحدة لـ `public/roles/` — صفر fetch خارجي
2. جسر التنفيذ → endpoint داخل سيرفر وزير — فكرة منسوخة مش اتصال
3. File System Access → API متصفح قياسي
4. أي تكامل مستقبلي → `register/integrations/{name}.ts` + إعداد + fallback آمن

---

## 4. 🔴 Phase 1 — الجاهزية الفورية

### 1.1 ⚡ فاحص الموديلات + إصلاح Gemini *(أولوية — يشخص مشكلة جوجل فوراً)*
- زر "فحص الاتصال" ⚡ جنب كل موديل في الإعدادات → ping صغير → ✅/❌ + الخطأ الحقيقي بالعربي
- ملفات: `AIGateway.ts` (`testModel`) + `SettingsView.tsx`
- **قبول:** نتيجة أي موديل في أقل من 10 ثواني

### 1.2 📦 Artifacts Panel *(بند 4)*
- تسمية احترافية: HTML→`<title>` · MD→أول H1 · Code→استنتاج (`login-page.tsx`) — `workspaceStore.ts`
- عرض Full Width ⛶ toggle (بدل `max-w-2xl`) — `ArtifactPanel.tsx`
- تصدير بضغطة: `.md` (Notion/Obsidian) · `.csv` (Todoist) · `.html` · `.json` — `lib/exporters.ts` جديد
- استيراد مهام `.json/.csv/.md` → tasks — `lib/importers.ts` جديد + `HomeView.tsx`

### 1.3 👎😍 تقييم الرسايل *(بند 3)*
- شبشب/قلوب تحت كل رد + وسوم سبب على 👎 → تتحفظ في الذاكرة (أمون يتعلم)
- ملفات: `WorkspaceView.tsx` + `workspaceStore.ts` (`rateMessage`) + `types`

### 1.4 ▶️ زر RUN على المهام *(بند 5)*
- ▶️ بجانب كل مهمة → يفتح الشات ببرومبت تنفيذ فوري بكل الأدوات
- ملفات: `HomeView.tsx` + `workspaceStore.ts` (`runTask`)

### 1.5 🎨 Command Center — إعادة بناء HomeView *(المرجع البصري المعتمد)*

> **المرجع:** موك-أب "مركز القيادة الذكي" (صورة العرآب — 2026-08-25). كل اللي هننفذه بعدها يلتزم بالروح البصرية دي.

**الهيكل (RTL):**
```
TopBar: 𓂀 + "WAZEER OS — مركز القيادة الذكي" | Model | SWARM CORE | MONMAMAR DB | صوت/شبكة/لغة/حساب
──────────────────────────────────────────────────────────────
┌─ Hero: "ابدأ مهمة جديدة ✨" + إدخال ذهبي (مايك دائري + إرسال) ─┐
├─ 3 كروت إجراءات سريعة: 📊 تحليل بيانات | </> بناء تطبيق | ✍️ إنشاء محتوى ─┤
├─ 3 لوحات: مهمتك اليومية (حلقة %) | الوكلاء النشطون | مشاريعك الأخيرة (%تقدم) ─┤
└─ عمود جانبي: اقتراح أُمون (CTA ذهبي + "لماذا؟" + تحديث 09:00) + إنجازك المستمر (👑 سلسلة أيام + أيام الأسبوع) ─┘
```

**اللغة البصرية:**
- ذهبي/عنبري = الأزرار الرئيسية وحدود الإدخال (ملكي) · تيل/زمردي = تقدم ونجاح · بنفسجي = الوكلاء
- أرقام كبيرة Bold بخط Mono · كروت rounded-2xl بحدود خافتة وتوهج ناعم · خلفية شبه سوداء

**مطابقة البيانات (الموجود ↔ المطلوب):**
| العنصر | المصدر | الحالة |
|--------|--------|--------|
| حلقة "مهمتك اليومية %" | tasks (completedAt اليوم) | ✅ موجود |
| الوكلاء النشطون | swarmStore | 🟡 تحويل هيرمس → **تحوت** (أكثر مصرية) + حالة حية |
| مشاريعك الأخيرة + % تقدم | projects | 🟡 نسبة التقدم جديدة (تُشتق من مهام/جلسات المشروع) |
| 🔥 سلسلة الإنجاز (أيام متتالية) | — | 🔴 جديدة: تُشتق من session_events (نشاط يومي) |
| اقتراح أُمون اليوم (09:00) | — | 🔴 جديدة: اقتراح يولَّد مرة يومياً ويُخزن في config |
| الإجراءات السريعة ×3 | — | 🟡 presets برومبت جاهزة تفتح الشات |

**معيار القبول:** الصفحة الرئيسية تشبه الموك-أب هيكلياً على Desktop، وتتكدس عمودياً على الموبايل (Mobile-first) بنفس الروح.

---

## 5. 🔐 Phase 1.5 — الأمان قبل التوسع *(مدمج من Tasks.md P0.5 + P1)*

> **ليه هنا؟** قبل ما نفتح لأي عدد أكبر من المستخدمين — دي غير قابلة للتفاوض.

### 1.5.1 🔑 مصادقة Admin حقيقية
- استبدال `x-user-id`/`x-user-role` headers (قابلة للانتحال بـ curl) بـ **Firebase ID token verification** في `requireAdmin`
- ملفات: `server/index.ts` + `AdminView.tsx` (إرسال الـ token)

### 1.5.2 📜 نشر Firestore Security Rules
- تطبيق `firestore.rules` الموجود فعلاً على المشروع + اختبار القواعد

### 1.5.3 🧪 Vitest أساسي *(شبكة الأمان قبل Phase 2)*
- اختبارات: AIGateway routing · LearningEngine (JSON + heuristics) · HorusGuard rules · exporters/importers
- كلها pure functions — سريعة التنفيذ، حماية حقيقية للـ refactors الجاية

---

## 6. 🟡 Phase 2 — القدرات المحلية + الصلابة

### 2.1 🎭 Roles Engine *(بند 2)*
- `public/roles/*.md` (frontmatter: name/description/tools/permissions + الجسم = System Prompt)
- `services/rolesEngine.ts` (تحميل + parse + cache) — التعديلات تتحفظ في **IndexedDB** كـ override
- استيراد محتوى الأدوار الأقيمة من زمرة الـ 48 (نسخة واحدة ثم ملك لوزير)
- Roles Manager UI في الإعدادات

### 2.2 🎛️ Modes Hub *(بند 5)*
- `public/modes/*.md`: 🤫 الوزير الصامت · 💻 برمجة · 🔬 بحث علمي · 🎓 تعليم — برومبت + أدوات + صلاحيات + Flow
- **سويتش 3D للوزير الصامت** في ChatInput
- `CHAT_MODES` تتحول لقارئ MD

### 2.3 ⚙️ Execution Bridge *(بند 8)*
- `src/server/execute.ts`: `POST /api/execute` — whitelist: `npm · npx · git · node · python · ls · mkdir · cat · rm · echo · vite · tsc` (pip مؤجلة) + `isWithinWorkspace()` + timeout 30s + **فحص args + HorusGuard قبل التنفيذ**
- `run_command` حقيقي بدل `[simulated]`
- File System Access API: زر "ربط فولدر" → تحليل حسب الـ Flow (Chrome/Edge Desktop — يتوثق في UI)

### 2.4 🐺 Swarm حقيقي + هيرمس المستقل *(بند 3)*
- **هيرمس**: وكيل خلفي مستقل — موديل/مفتاح خاص من الإعدادات · طابور مهام (مراجعة Artifacts · spawn_subtasks · فحص صحة المشروع المربوط) · Circuit Breaker 3 محاولات · سجل نشاط حي
- **حورس** = HorusGuard بحالة حية · إزالة SWARM pill الثابت
- صفحة صلاحيات + Skills + حالة السرب

### 2.5 🧠 ذكاء السياق *(مدمج من Tasks.md P1)*
- **Token Budgeting + History Trimming (Compaction)**: تقليم التاريخ القديم + تلخيص — يمنع 400 errors في الجلسات الطويلة (أعلى قيمة تقنية)
- **MemoryEngine**: dedup بالتشابه 85% · batch للـ accessCount · cap للعدد

### 2.6 🛡️ HorusGuard تطويرات *(مدمج من Tasks.md P1)*
- نقل AST parsing لـ **Web Worker** (منع UI freeze على الأكواد الطويلة)
- كشف أنماط المفاتيح: GLM (`id.secret`) · JWT · AWS · `sk-ant-`/`sk-or-`/`gsk_`

### 2.7 🗂️ VFS Persistence *(مدمج من Tasks.md P0 — آخر P0 متبقية)*
- حفظ شجرة الـ VFS في IndexedDB (`vfs_files`) بدل الذاكرة — الملفات تعيش بعد الـ Refresh
- تحميل عند الإقلاع + ربطها بجسر التنفيذ

### 2.8 🔄 CI/CD *(مدمج من Tasks.md P2)*
- GitHub Actions: install → tsc → vitest → build → (deploy لاحقاً)

---

## 7. 🟢 Phase 3 — التوسع والأداء

### الميزات *(بند 6 + 2-ج)*
1. **مدونة أخبار الموديلات**: posts MD + نشر من Admin + صفحة News
2. **Design Studio**: بوسترات/صور/UI-UX كتاسك بموديلات VLM
3. **Skills JSON + Skeptical Memory** (نمط زمرة)
4. **RAG محلي** (`/vector/*` بنمط زمرة)
5. **Desktop Offline كامل**: PWA caching شامل + أيقونة
6. **إحصائيات التقييم** في Compute (قلوب/شبشب لكل موديل)
7. **⭐ طبقة Integrations العامة** (`register/integrations/{name}.ts`) — Notion/Google Tasks/زمرة/أي أداة = Adapter اختياري

### الأداء والبنية *(مدمج من Tasks.md P1/P2)*
8. **Event Log read-side**: `deriveEvents()` + Replay/Fork (إكمال نمط DSH)
9. **تقسيم `workspace_state` blob**: لكل session record + debounce (القاتل الصامت مع 100 مستخدم)
10. **Code Splitting**: manualChunks + lazy Monaco (الباندل 2.4MB)
11. **MessageList optimization**: memoization/virtualization
12. **Waterfall hook points** في الـ chat pipeline (نمط DSH 2)
13. **Capability Seam refactor** للـ Providers (نمط DSH 3 — عند الحاجة)
14. **Placeholder views**: Templates · Compute · Storage · History

---

## 8. ملاحظات ثابتة
- Custom endpoints وCORS: Groq/OpenRouter ✓ من المتصفح · OpenAI ✗ — يتوثق للمستخدمين
- GLM JWT client-side — risk مقبول في BYOK (متوثق)
- السيرفر tsx مش watch — restart يدوي بعد تعديل `src/server/`
- كل Phase ينتهي بـ: tsc نظيف + build ناجح + تجربة يدوية للبنود

---

> صُنع بـ ❤️ بواسطة العرآب | 100MillionDEV.com — 𓂀 وزير × زمرة
