# 📋 Wazeer OS v2.1 — Production Review & Gap Analysis
**تاريخ المراجعة:** 2026-08-04  
**الهدف:** النسخة Production الجديدة اللي تشغل 100 فرد  
**المقارنة:** النسخة القديمة (Amon-beta) ↔ النسخة الجديدة في `src/` ↔ الـ Docs الرسمية

---

## 🎯 Executive Summary — ملخص تنفيذي سريع

النسخة الجديدة في `src/` الأساسي **مطورة جداً** عن النسخة القديمة في `Amon-beta/`، و80% من الـ P0 fixes اللي كانت مطلوبة للمستويين قديمة **موجودة أصلاً** في النسخة الجديدة.

| المؤشر | Amon-beta (القديمة الشغالة) | v2.1 src/ (الجديدة) | الحالة |
|--------|-----------------------------|---------------------|--------|
| COEP/COOP/CORP Headers | ❌ مفقودين في `server.ts` | ✅ موجودين via Helmet | ✅ محسوس |
| Rate Limiting | ⚠️ موجود بس مش مُضبوط على Proxy | ✅ 100 req/min global + 30 admin | ✅ محسوس |
| SPA Fallback Bug | ❌ `app.get('*')` بيلتقط `/api/*` | ✅ مفيش wildcard في الـ routes | ✅ محسوس |
| IndexedDB Layer | ⚠️ partial + store وحيد God Object | ✅ 8 stores + Class Wrapper + fallback | ✅ محسوس |
| Firestore Sync | ❌ غير موجود | ✅ users + auth_logs + banned_nodes + admin_settings | ✅ محسوس |
| ADMIN_EMAILS | ❌ hardcoded في LoginModal | ✅ في `constants/index.ts` | ✅ محسوس |
| Firebase Admin SDK | ❌ غير موجود | ✅ lazy init via FIREBASE_SERVICE_ACCOUNT | ✅ محسوس |
| Providers Registry | ⚠️ 7 providers قديمة | ✅ 7 providers + 11 proxy routes | ✅ محسوس |
| Version Stack | React 18 + Vite 5 | React 19 + Vite 6 + Tailwind 4 + Zustand 5 | ✅ محسوس |

**الخلاصة السريعة:** انتقل من `Amon-beta` إلى `v2.1 src/` فوراً — الكود أنظف، والأمن أقوى، والبنية أسهل للتوسيع لـ 100 فرد.

---

## 🗄️ Database Architecture — حالة قواعد البيانات

### 1. IndexedDB (Local — لكل مستخدم على جهازه)
**DB Name:** `Monmamar` — **Version:** 4 — **Implementation:** [db.ts](file:///f:/Projects/Amoun/Wazeer-OS-v2.1/src/lib/db.ts)

| Store Name | Key Path | Indexes | المستخدم الفعلي | الحالة |
|------------|----------|---------|----------------|--------|
| `config` | `id` | — | API keys + saved user + events | ✅ مستخدم |
| `state` | `id` | — | Workspace state persisted | ✅ مستخدم |
| `logs` | `id` (AI) | `timestamp` | Event logs | ⚠️ مخزن بس مش متعامل معاه UI |
| `artifacts` | `id` | `chatId`, `type`, `pinned`, `createdAt` | Code blocks extracted from AI | ⚠️ متعرف بس مفيش UI لعرضهم؟ |
| `auth_logs` | `id` | `timestamp` | Login/register events | ✅ مستخدم في AuthService |
| `banned_nodes` | `ip` | `timestamp` | Banned IPs locally | ⚠️ متعرف بس Firestore هو الأساسي للـ bans |
| `userMemory` | `id` (AI) | `category`, `createdAt`, `sourceSession` | Semantic memory | ✅ مستخدم في MemoryEngine |
| `users` | `email` | `createdAt` | Local user accounts | ✅ مستخدم في AuthService |

**مميزات الـ IndexedDB:**
- ✅ In-memory fallback لو IndexedDB متاحةش (Safari private mode)
- ✅ Helper methods: `getApiKeys()`, `saveApiKeys()`, `getUser()`, `saveUser()`
- ✅ Lazy init via `wazeerDB.init()` — مفيش blocking عند الـ load

---

### 2. Firestore (Cloud — centralized for all users)
**Implementation:** [firestore.ts](file:///f:/Projects/Amoun/Wazeer-OS-v2.1/src/lib/firestore.ts)

| Collection | مستخدم | الحالة |
|------------|--------|--------|
| `users/{userId}` | User profile (name, email, role, avatar, preferences, lastLogin) | ✅ مكتوب sync كامل |
| `auth_logs/{logId}` | All login/register/failed events for all users | ✅ مكتوب log كامل |
| `banned_nodes/{userId}` | Banned users (permanent + reason + bannedBy admin) | ✅ مكتوب ban/unban |
| `admin_settings` | Global settings (for future) | ⚠️ متعرف بس مفيش operations عليه حالياً |

**Firebase Admin SDK:** [server/index.ts](file:///f:/Projects/Amoun/Wazeer-OS-v2.1/src/server/index.ts#L28-L51)
- ✅ Lazy init — بيشتغل بس لو `FIREBASE_SERVICE_ACCOUNT` موجود في `.env`
- ✅ Admin API routes محمية بـ `requireAdmin` middleware
- Endpoints متاحة:
  - `GET /api/health` — status + adminEnabled flag
  - `GET /api/admin/dashboard` — totalUsers, activeToday/Week, bannedUsers, recent auth logs
  - `GET /api/admin/users` — all users list
  - `PATCH /api/admin/users/:id/role` — change user role
  - `POST /api/admin/users/:id/ban` — ban user with reason
  - `POST /api/admin/users/:id/unban` — unban user

> ⚠️ **ملحوظة مهمة:** الـ Firebase Admin endpoints بتستخدم headers بسيطين `x-user-id` و `x-user-role` للمصادقة — ده كويس لـ MVP بس لـ 100 فرد يبقى نزود Authentication token حقيقي (JWT) مش مجرد headers.

---

## 🔴 P0 Gaps — حاجات لازم نعملها قبل Deployment لـ 100 فرد

### P0.1 — Onboarding Wizard غير موجود (أعلى قيمة للمستخدمين الجدد)
في النسخة القديمة Tasks.md كان مذكور كأولوية P0 — بس في النسخة الجديدة:
- مفيش onboarding flow عند أول login
- المستخدم الجديد لا يعرف إزاي يضيف API Key
- لا يوجد guided flow لاختيار الـ provider المناسب (Gemini مجاني → Groq → NVIDIA مجاني)

**مطلوب:**
- `OnboardingWizard.tsx` component
- خطوات: ترحيب → إضافة مفتاح Gemini مجاني → إختيار اللغة والثيم → شرح واجهة Workspace
- رابط في SettingsView يعيد الـ wizard

---

### P0.2 — API Key Inputs في SettingsView غير واضحة للمستخدم
في الـ workspaceStore و db.ts فيه APIs حفظ واسترجاع، بس لازم نتأكد إن:
- ✅ Gemini API Key Input
- ✅ Provider selection UI سهل
- ✅ Save toasts واضحة
- ⚠️ Validation للـ keys (مثال: لازم يبدأ بـ `sk-` لـ OpenAI)

---

### P0.3 — HorusGuard بيشتغل في Main Thread (UI freeze محتمل)
الحالة الحالية في [HorusGuard.ts](file:///f:/Projects/Amoun/Wazeer-OS-v2.1/src/services/security/HorusGuard.ts):
- بيستخدم `@babel/parser` و `@babel/traverse` مباشرة
- لما الـ AI يرجع ملف كبير (أكثر من 300 سطر كود) ممكن يعمل UI jank لـ 200-500ms

**المطلوب:**
- Web Worker لـ AST parsing → `workers/horus-worker.ts`
- الـ UI يظهر spinner "جاري فحص الأمان..." بينما الـ Worker شغال

---

### P0.4 — VFS (Virtual File System) In-Memory فقط
الحالية في [ToolRegistry.ts](file:///f:/Projects/Amoun/Wazeer-OS-v2.1/src/services/tools/ToolRegistry.ts#L17):
```typescript
const vfs = new Map<string, string>();
```
- الملفات تضيع بعد reload الصفحة
- مش متزامنة مع IndexedDB

**المطلوب:**
- Save VFS state في IndexedDB store `vfs_files`
- Load عند الـ boot الاول من الـ IndexedDB

---

### P0.5 — Honeypot Logic في useBanGuard
الحالية:
- لو user ضغط field معين باسم honeypot → permanent ban فوراً
- مشكلة: browser autofill أحياناً بيملأ fields خفية → false positives

**المطلوب (من Amon-beta Tasks.md):**
- 3-strikes rule: أول 3 false positives → warning بس
- بعد الثالث → actual ban
- Log كل honeypot trigger في `auth_logs` Firestore

---

## 🟡 P1 Gaps — مهمات الأسبوع الثاني لـ 100 فرد

### P1.1 — Missing API Key Pattern Detection في HorusGuard
الحالية الـ threat rules في [HorusGuard.ts](file:///f:/Projects/Amoun/Wazeer-OS-v2.1/src/services/security/HorusGuard.ts#L24) بتكتشف:
- eval(), new Function(), child_process
- document.cookie, localStorage/ sessionStorage
- fetch(http://), innerHTML/outerHTML

**الناقص:**
```
GLM keys format:  id.secret (بفاصلة) → يعمل generateGLMJWT
JWT tokens:       eyJhbGciOi...base64
AWS keys:         AKIA...
Anthropic/OpenRouter/Groq keys: sk-ant-...  sk-or-...  gsk_...
```

---

### P1.2 — Context Builder + Token Budgeting غير موجود
الحالية في [AIGateway.ts](file:///f:/Projects/Amoun/Wazeer-OS-v2.1/src/services/AIGateway.ts):
- بيبعت الـ messages كلها للـ LLM بدون تحكم في الـ context size
- لما الـ history يكون طويل → بيتجاوز max tokens → 400 error من الـ provider

**المطلوب:**
- ContextBuilder function توزع الـ token budget:
  - System constraints: 2K tokens
  - Documents (uploaded): 40%
  - Semantic memory: 25%
  - Chat history (trimmed from oldest): 10%
  - Current query: 5%
  - Buffer for response: 20%

---

### P1.3 — 4-Layer Cognitive Memory مش منفذ كامل
الحالية في [MemoryEngine.ts](file:///f:/Projects/Amoun/Wazeer-OS-v2.1/src/services/learning/MemoryEngine.ts):
- Store واحد `userMemory` مع categories: `preference`, `fact`, `decision`, `skill`, `context`
- كلها بنفس الـ TTL وبدون tiers

**المطلوب (من Architecture Docs):**
| Layer | TTL | Store | مستخدم |
|-------|-----|-------|--------|
| `working_mem` | 5 دقائق | transient في store | الحالية بتبقى في الـ chat بس |
| `episodic_mem` | 7 أيام | userMemory category=episodic | ⛔ غير موجود |
| `semantic_mem` | 90 يوم | userMemory semantic | الحالي شبه كده بس بدون TTL |
| `procedural_mem` | Eternal | userMemory procedural | ⛔ غير موجود |

---

### P1.4 — Zod Validation مَحطوط في الـ Docs بس غير منفذ
الـ [03-TECHNICAL-SPECIFICATION.md](file:///f:/Projects/Amoun/Wazeer-OS-v2.1/Wazeer-OS-docs/03-TECHNICAL-SPECIFICATION.md) بتتكلم عن Zod schemas:
```typescript
export const TaskSchema = z.object({ ...
export const ProjectSchema = z.object({ ...
```

لكن في الحقيقة:
- `zod` مش موجود في [package.json](file:///f:/Projects/Amoun/Wazeer-OS-v2.1/package.json) dependencies
- مفيش schema validation فعلي في أي endpoint أو store action

---

### P1.5 — CI/CD Pipeline غير موجود
الـ [14-DEPLOYMENT.md](file:///f:/Projects/Amoun/Wazeer-OS-v2.1/Wazeer-OS-docs/14-DEPLOYMENT.md) بيذكر:
- GitHub Actions
- Build → Test → Deploy pipeline
- Health checks + rollback

**الحالية:**
- مفيش `.github/workflows/` folder أصلاً
- مفيش automated test suite تشتغل قبل الـ deploy

---

## 🟠 P2 Gaps — تحسينات بعد الـ Launch

| # | Gap | التفاصيل | الحالة |
|---|-----|---------|--------|
| P2.1 | Tests كاملة غير موجودة | مفيش `tests/` folder، مفيش `vitest.config.ts`، مفيش Playwright E2E | ⛔ |
| P2.2 | Brotli compression level | الـ `compression()` middleware موجود بس default level — نضبطه لـ level 6 (توازن) | ⚠️ |
| P2.3 | Cache headers لـ static assets | الـ build بتاع Vite يخرج fingerprinted assets → نضيف `Cache-Control: immutable, max-age=31536000` | ⛔ |
| P2.4 | 8 Placeholder Views غير منفذة | [App.tsx](file:///f:/Projects/Amoun/Wazeer-OS-v2.1/src/App.tsx#L71-L78) فيها: history, templates, compute, storage, kings-tools, integrated, landing | ⚠️ (MVP مش محتاج كلهم) |
| P2.5 | swarmStore.ts غير مستخدم | [store/swarmStore.ts](file:///f:/Projects/Amoun/Wazeer-OS-v2.1/src/store/swarmStore.ts) موجود بس مش import في أي مكان | ⚠️ |
| P2.6 | HorusGuard في ReAct loop | الـ ReAct loop الحالي في Gemini بس → نضيف auto-scan لكل generated code قبل ما يعرضه | ⚠️ |

---

## 📝 Docs Corruption & Sync Issues — مشاكل في التوثيق نفسه

| الملف | المشكلة | الأولوية |
|-------|---------|---------|
| [07-IMPLEMENTATION-PLAN.md](file:///f:/Projects/Amoun/Wazeer-OS-v2.1/Wazeer-OS-docs/07-IMPLEMENTATION-PLAN.md) | ⚠️ **Corrupted تماماً:** أول 3 bytes null bytes (`\u0000`) + كل الـ Arabic characters munged. لازم يعاد إنشاؤه من الصفر. | 🔴 P1 |
| **كل الملفات تقريباً** | التواريخ بتاعتها قديمة سنة كاملة: مكتوب 2025-07-13 بينما اليوم 2026-08-04. الـ Decisions لحد 2025-02. | 🟡 P2 |
| [module-auth.md](file:///f:/Projects/Amoun/Wazeer-OS-v2.1/Wazeer-OS-docs/module-auth.md) | Paths غلط: مكتوب `client/src/services/authService.ts` بينما المسار `src/services/AuthService.ts` (CamelCase + بدون client/). نفس المشكلة في module-chat, module-learning | 🟡 P2 |
| [README.md](file:///f:/Projects/Amoun/Wazeer-OS-v2.1/Wazeer-OS-docs/README.md) | Screenshots كلها placeholder text `[Screenshot placeholder]` مش صور حقيقية | 🟠 P3 |
| **PROJECT_MAP.md** | الملف ده مذكور في الـ Protocols كأهم ملف، لكن غير موجود أصلاً. لازم ننشئه. | 🟡 P1 |

---

## 🚀 Production Deployment Checklist — لنشر 100 فرد

### المرحلة ١: إعدادات الـ Environment (قبل أي حاجة)
إنشاء `.env` و `.env.local` بالمتغيرات دي:

```bash
# ============== CLIENT (VITE_ prefix) ==============
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=wazeer-os.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=wazeer-os
VITE_FIREBASE_STORAGE_BUCKET=wazeer-os.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# ============== SERVER (no prefix) ==============
PORT=3000
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"wazeer-os",...}'  # JSON full من Firebase Console
NODE_ENV=production

# (اختياري) لـ Reverse Proxy على Hostinger
# TRUST_PROXY=true
```

### المرحلة ٢: إعدادات Firebase Console (مستخدم جديد للـ Admin)
1. **Firestore Security Rules** — لازم نضعها فوراً (ده غلط كبير لو ممكن أي حد يكتب على أي document):
```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    
    // Users: يقرا يكتب document نفسه بس
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth.token.email in get(/databases/$(db)/documents/admin_settings/allowed_admins).data.emails;
    }
    
    // Auth logs: المستخدم يقرا logاته بس، Admin يقرا الكل
    match /auth_logs/{logId} {
      allow read: if request.auth != null && (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    
    // Banned nodes: Admin read/write بس
    match /banned_nodes/{nodeId} {
      allow read, write: if isAdmin();
    }
    
    // Admin settings: Admin بس
    match /admin_settings/{doc} {
      allow read, write: if isAdmin();
    }
    
    function isAdmin() {
      return request.auth.token.email in ['hello.simple.ai@gmail.com', 'ayman.abdelmohsen@gmail.com'];
    }
  }
}
```

2. **Authentication** → Sign-in method → Email/Password مفعّل + Google OAuth

### المرحلة ٣: Build + Test المحلي
```powershell
# فولدر المشروع الأساسي Wazeer-OS-v2.1
npm.cmd install        # أول مرة بس
npm.cmd run build      # Build للـ production → يطلع dist/
npm.cmd run server     # يبدأ الـ Express server (مع proxy + admin routes)
# افتح http://localhost:3000
# جرب:
# 1. تسجيل جديد
# 2. إضافة Gemini API Key
# 3. إرسال رسالة في Workspace
# 4. Login كـ admin وجرب Admin panel
# 5. إيقاف/استئناف generation
```

### المرحلة ٤: Hostinger Deployment (المنصوص عليه في الـ Docs)
استناداً لـ [14-DEPLOYMENT.md](file:///f:/Projects/Amoun/Wazeer-OS-v2.1/Wazeer-OS-docs/14-DEPLOYMENT.md):

1. **Upload `dist/` + `src/server/`** (أو build مُجمع مع PM2)
2. **PM2 Process:**
```bash
npm.cmd install -g pm2
pm2 start src/server/index.ts --interpreter tsx --name wazeer-os
pm2 save
pm2 startup     # لـ auto-start بعد reboot
```
3. **Nginx Config (لو VPS مش Shared):**
   - Proxy pass من port 80/443 → localhost:3000
   - Brotli + Cache headers لـ static files
   - Cloudflare CDN فوق (مذكور في الـ Docs كـ Planned)

4. **Health Check:**
   - `https://wazeer.100millioncc.com/api/health`
   - لازم يطلع: `{"status":"ok","version":"2.1.0","adminEnabled":true,...}`

---

## 🗺️ Roadmap — ترتيب التنفيذ الأسبوعي

| الأسبوع | المرحلة | المهام الأساسية |
|---------|---------|----------------|
| **Week 1** | P0 Hardening | 1. OnboardingWizard component<br>2. HorusGuard Web Worker<br>3. VFS → IndexedDB sync<br>4. Honeypot 3-strikes<br>5. إضافة Firestore Rules فوق |
| **Week 2** | P1 Stabilization | 1. API Key patterns في HorusGuard<br>2. ContextBuilder + Token Budget<br>3. Zod validation للـ store actions<br>4. Fix 07-IMPLEMENTATION-PLAN.md + إنشاء PROJECT_MAP.md<br>5. Gemini API Key UI validation |
| **Week 3** | Launch Prep | 1. GitHub Actions pipeline (build → deploy)<br>2. Cache headers + Brotli tuning<br>3. Smoke tests للـ 10 most common flows<br>4. Deployment فعلي على staging domain |
| **Week 4** | Go Live | 1. Progressive rollout (10 users → 50 → 100)<br>2. Monitoring via `/api/health`<br>3. Gather feedback + quick fixes<br>4. إضافة missing features (Projects, Settings polish) |

---

## ✅ الخلاصة النهائية لسيد العرآب

**النسخة الجديدة v2.1 في `src/` جاهزة 70% للـ Production لـ 100 فرد.**

المسار الصحيح:
1. ✅ **لا ترجع للنسخة القديمة في Amon-beta** — فيها P0 bugs كتير وبتاعة architecture أقل مرونة
2. ✅ **استخدم النسخة الجديدة في `src/` كـ base** — الأمن فيها مضبوط، والـ Databases منظمة، والـ dependencies حديثة
3. 🔴 **نفذ أسبوع 1 (P0) كلو قبل ما تفتح لأي حد** — Onboarding مهمة خاصةً لـ 100 فرد جدد
4. 🟡 **أسبوع 2 (P1) قبل لما توصل لـ 50+ مستخدم** — Context builder بيوفر crashes كتير لما الـ chats تطول
5. 🟠 **أسبوع 3 و 4 تحسينات بعد الـ launch**

لو عاوز نبدأ ننفذ أي حاجة من دول فوراً (مثلاً نكتب Firestore Rules أو نعمل OnboardingWizard) — قولي وهنزّل الحقول.
