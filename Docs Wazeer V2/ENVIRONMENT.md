# Environment Setup / إعداد البيئة

> Wazeer OS / وزير OS v2.0.0-Rewrite | 𓂀 Amoun / أمون
> Author: 100MillionDEV / العرآب
> Last Updated: 2025-02-15

---

## 1. Prerequisites / المتطلبات الأساسية

### System Requirements

| Requirement | Minimum | Recommended | Check Command |
|-------------|---------|-------------|---------------|
| Node.js | v20.0.0 | v22.x LTS | `node --version` |
| npm | v10.0.0 | v11.x | `npm --version` |
| Git | v2.40+ | Latest | `git --version` |
| OS | Any (Windows/macOS/Linux) | macOS or Linux | — |
| RAM | 4 GB | 8 GB+ | — |
| Disk | 2 GB free | 5 GB free | — |
| Browser | Chrome 120+ / Firefox 120+ | Chrome 130+ | — |

### Install Node.js

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
nvm install 22
nvm use 22
nvm alias default 22

# Verify
node --version   # v22.x.x
npm --version    # v11.x.x
```

### Verify Prerequisites

```bash
# Run all checks at once
node --version && \
npm --version && \
git --version && \
echo "✅ All prerequisites met"
```

---

## 2. Installation / التثبيت

### Clone & Install

```bash
# Clone the repository
git clone https://github.com/your-org/wazeer-os.git
cd wazeer-os

# Install dependencies
npm install

# Verify installation
npm run doctor  # Custom health check script
```

### Project Structure After Install

```
wazeer-os/
├── public/
│   ├── icons/              # PWA icons (192, 512, maskable)
│   └── favicon.svg
├── server/
│   ├── index.ts            # Express proxy entry point
│   ├── routes/
│   │   └── health.ts       # Health check endpoint
│   ├── middleware/
│   │   ├── security.ts     # Helmet, COEP, COOP, CORP
│   │   └── rateLimit.ts    # Rate limiting config
│   └── utils/
│       └── gracefulShutdown.ts
├── src/
│   ├── components/         # React components
│   │   ├── chat/
│   │   ├── dashboard/
│   │   ├── settings/
│   │   ├── tasks/
│   │   └── auth/
│   ├── lib/
│   │   ├── ai/              # AIGateway v2.0 + adapters
│   │   ├── security/        # HorusGuard, PromptSanitizer
│   │   ├── learning/        # LearningEngine
│   │   ├── memory/          # MemoryEngine
│   │   ├── scheduler/       # TaskScheduler
│   │   ├── db/              # IndexedDB (Monmamar v4)
│   │   └── utils/           # Shared utilities
│   ├── stores/              # Zustand stores
│   ├── types/               # TypeScript type definitions
│   ├── hooks/               # Custom React hooks
│   ├── styles/              # Global CSS, Tailwind
│   ├── test/                # Test setup, mocks
│   ├── App.tsx
│   ├── main.tsx
│   └── sw.ts                # Service Worker
├── e2e/                     # Playwright E2E tests
├── .env.example             # Template for environment variables
├── .env.local               # Local environment (gitignored)
├── ecosystem.config.js      # PM2 config
├── firebase.json            # Firebase configuration
├── index.html               # Vite entry HTML
├── package.json
├── tsconfig.json
├── tailwind.config.ts       # Tailwind CSS 4 config
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── README.md
```

---

## 3. Environment Variables / متغيرات البيئة

### Setup

```bash
# Copy the example file
cp .env.example .env.local

# Edit with your values
nano .env.local  # or use your preferred editor
```

### Client Variables (VITE_ prefix)

These are baked into the build at compile time by Vite:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_APP_NAME` | No | `Wazeer OS` | Application display name |
| `VITE_APP_VERSION` | No | Auto from `package.json` | Version string for UI |
| `VITE_FIREBASE_API_KEY` | **Yes** | — | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | **Yes** | — | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | **Yes** | — | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | **Yes** | — | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | **Yes** | — | Firebase Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | **Yes** | — | Firebase App ID |
| `VITE_ENABLE_ANALYTICS` | No | `false` | Feature flag: analytics |
| `VITE_ENABLE_MEMORY` | No | `true` | Feature flag: MemoryEngine |
| `VITE_ENABLE_LEARNING` | No | `true` | Feature flag: LearningEngine |
| `VITE_ENABLE_SEARCH` | No | `true` | Feature flag: Gemini Grounding |

### Server Variables (no prefix)

These are used by the Express proxy and are **never** sent to the browser:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Express proxy port |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `ALLOWED_ORIGINS` | **Yes** | `http://localhost:5173` | CORS allowed origins (comma-separated) |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per minute per IP |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit window in ms |
| `BODY_SIZE_LIMIT` | No | `5mb` | Max request body size |
| `REQUEST_TIMEOUT` | No | `120000` | Request timeout in ms |
| `TRUST_PROXY` | No | `0` | Trust proxy count (set to `1` behind Cloudflare) |
| `LOG_LEVEL` | No | `info` | Server log level: `debug`, `info`, `warn`, `error` |

### .env.example File

```bash
# ============================================
# Wazeer OS — Environment Configuration
# ============================================

# --- Firebase (REQUIRED) ---
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxx

# --- App (Optional) ---
VITE_APP_NAME=Wazeer OS
VITE_ENABLE_MEMORY=true
VITE_ENABLE_LEARNING=true
VITE_ENABLE_SEARCH=true
VITE_ENABLE_ANALYTICS=false

# --- Server (for Express proxy) ---
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
BODY_SIZE_LIMIT=5mb
REQUEST_TIMEOUT=120000
TRUST_PROXY=0
```

---

## 4. Firebase Configuration / إعدادات فايربيس

### Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or select existing)
3. Enable **Authentication** → Sign-in method:
   - ✅ Email/Password
   - ✅ Google
   - ✅ Anonymous (optional, for trial users)
4. Go to **Project Settings** → General → Your apps → Web app
5. Register the app and copy the config
6. Paste into `.env.local`

### Firebase Security Rules

```javascript
// Firebase Firestore Rules (if Firestore is used in future)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Deny all reads/writes by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

> **Note:** Wazeer OS v2.0 uses Firebase **Auth only**, not Firestore or Realtime Database. All data is stored in IndexedDB on the client.

---

## 5. LLM API Key Setup / إعداد مفاتيح الذكاء الاصطناعي

### BYOK — Bring Your Own Key

Wazeer OS does not require LLM keys in environment variables. Instead, users add their keys through the **Settings UI** after logging in. Keys are stored in IndexedDB.

### For Development / للتطوير

To test AI features locally, you need at least one LLM provider key:

| Provider | Get Key | Free Tier | Models Available |
|----------|---------|-----------|----------------|
| Google Gemini | [aistudio.google.com](https://aistudio.google.com/apikey) | Yes (15 RPM) | gemini-2.5-flash, gemini-2.0-flash |
| OpenAI | [platform.openai.com](https://platform.openai.com/api-keys) | Yes (limited) | gpt-4o-mini |
| Anthropic Claude | [console.anthropic.com](https://console.anthropic.com/) | Yes (limited) | claude-3-haiku |
| Groq | [console.groq.com](https://console.groq.com/) | Yes (30 RPM) | llama-3.1-70b, mixtral-8x7b |
| Mistral | [console.mistral.ai](https://console.mistral.ai/) | Yes (limited) | mistral-large, mistral-small |
| Ollama (local) | No key needed | Free (local) | Any local model |

### Adding Keys in the UI

1. Log in to Wazeer OS
2. Navigate to **الإعدادات** (Settings) → **مفاتيح الذكاء** (AI Keys)
3. Click **إضافة مفتاح** (Add Key)
4. Select provider, enter API key, select default model
5. Click **حفظ** (Save)
6. Key is stored in IndexedDB `config` store under `llm_keys`

### Environment Variable Override (Testing Only)

For CI/testing, you can pre-seed a key:

```bash
# .env.local (testing only — NOT for production)
VITE_TEST_GEMINI_KEY=your-test-key-here
```

```typescript
// src/test/setup.ts — only used in test environment
if (process.env.NODE_ENV === 'test' && import.meta.env.VITE_TEST_GEMINI_KEY) {
  // Pre-seed test key into mock IndexedDB
}
```

---

## 6. Running the Development Server / تشغيل خادم التطوير

### Start Both Client and Server

```bash
# Terminal 1: Vite dev server (port 5173)
npm run dev

# Terminal 2: Express proxy (port 3001)
npm run dev:proxy

# OR: Run both concurrently (recommended)
npm run dev:all
```

### Available npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start Vite dev server (port 5173) |
| `dev:proxy` | `tsx watch server/index.ts` | Start Express proxy (port 3001) |
| `dev:all` | `concurrently "npm:dev" "npm:dev:proxy"` | Start both concurrently |
| `build` | `vite build` | Production build to `dist/` |
| `build:proxy` | `tsx server/index.ts` | Build and run proxy (production mode) |
| `preview` | `vite preview` | Preview production build locally |
| `test` | `vitest` | Run unit tests in watch mode |
| `test:ci` | `vitest run --coverage` | Run unit tests once with coverage |
| `test:component` | `vitest run --config vitest.component.config.ts` | Run component tests |
| `test:e2e` | `playwright test` | Run E2E tests |
| `lint` | `eslint src/ --ext .ts,.tsx` | Lint source code |
| `typecheck` | `tsc --noEmit` | TypeScript type checking |
| `doctor` | `node scripts/doctor.js` | Check environment health |

### Development URL Mapping

```
http://localhost:5173          → Vite dev server (React app)
http://localhost:5173/api/*     → Proxied to Express (port 3001)
http://localhost:3001           → Express proxy (direct access)
http://localhost:3001/health   → Health check endpoint
```

---

## 7. PWA Testing / اختبار التطبيق التقدمي

### Chrome DevTools

1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Verify:
   - **Manifest**: Name, icons, theme color correct
   - **Service Workers**: Registered and active
   - **Cache Storage**: Static assets cached
   - **IndexedDB**: `monmamar` database with 7 stores

### Offline Testing

1. Open the app normally
2. In DevTools → Network tab → Select **Offline**
3. Reload the page
4. App should load from Service Worker cache
5. Verify IndexedDB data is still accessible

### Install as PWA

1. Look for the install icon (⊕) in Chrome address bar
2. Click **Install** (تثبيت)
3. App opens in standalone window
4. Verify: no browser chrome, app icon in taskbar/dock

### PWA Checklist

- [ ] `manifest.json` has all required fields
- [ ] Service Worker registers without errors
- [ ] App works offline after first load
- [ ] Install prompt appears
- [ ] App icon is correct on home screen/taskbar
- [ ] `start_url` loads the app correctly
- [ ] `display: standalone` hides browser chrome

---

## 8. Common Issues / مشاكل شائعة

### Issue: `npm install` fails with ERESOLVE

```bash
# Cause: Peer dependency conflicts
# Solution: Use --legacy-peer-deps (temporary) or update lockfile
npm install --legacy-peer-deps

# Better: Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 5173 already in use

```bash
# Find and kill the process using port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
PORT=5174 npm run dev
```

### Issue: IndexedDB not opening / version error

```bash
# Cause: Corrupted IndexedDB from previous version
# Solution: Clear site data in DevTools
# DevTools → Application → Storage → Clear site data

# Or run the factory reset from the app's Settings → Advanced → Reset Database
```

### Issue: Firebase Auth throws `auth/invalid-api-key`

```bash
# Cause: Missing or incorrect Firebase config in .env.local
# Solution: Verify all 6 VITE_FIREBASE_* variables are set
# Make sure you copied from the CORRECT Firebase project
```

### Issue: CORS errors on LLM API calls

```bash
# Cause: Express proxy not running
# Solution: Start the proxy in a separate terminal
npm run dev:proxy

# Or run both together
npm run dev:all
```

### Issue: HorusGuard scanning takes too long

```bash
# Cause: Very large code block (>500 lines)
# Solution: This is expected. HorusGuard is O(n) where n = AST nodes.
# Blocks >500 lines are truncated before scanning with a warning.
```

### Issue: Arabic text renders left-to-right

```bash
# Cause: Missing dir="rtl" on container element
# Solution: Verify the language setting in IndexedDB config store
# The app should auto-set dir based on language. Check:
# 1. Settings → Language → العربية
# 2. Reload the page
# 3. Check <html dir="rtl" lang="ar"> in DevTools Elements
```

### Issue: Service Worker serves stale content after deploy

```bash
# Cause: Browser caches the old Service Worker
# Solution: Force update
# DevTools → Application → Service Workers → Check "Update on reload"
# Then hard reload (Ctrl+Shift+R)
# In production: The new SW has `updateViaCache: 'none'` to prevent this
```

### Issue: `VITE_` env variables are undefined in browser

```bash
# Cause: Variables not prefixed with VITE_ or not in .env.local
# Solution:
# 1. Ensure variable name starts with VITE_
# 2. Ensure .env.local is in project root
# 3. Restart Vite dev server after changing .env.local
```

---

## 9. Development Tips / نصائح التطوير

### TypeScript Strictness

Wazeer OS uses strict TypeScript. Do not use `// @ts-ignore` or `any` without a comment explaining why.

```typescript
// ❌ BAD
const data: any = fetchData();

// ✅ GOOD
type UserData = { name: string; email: string };
const data: UserData = await fetchData();
```

### Hot Module Replacement

Vite HMR is enabled by default. React Fast Refresh preserves component state during edits.

### Debugging IndexedDB

```javascript
// In browser console:
// List all databases
indexedDB.databases().then(console.table);

// Open and inspect Monmamar
const req = indexedDB.open('monmamar', 4);
req.onsuccess = (e) => {
  const db = e.target.result;
  console.log('Stores:', Array.from(db.objectStoreNames));
};
```

---

> 𓂀 *A clean environment is the foundation of clean code. Set up once, develop daily.* — Wazeer OS Engineering
