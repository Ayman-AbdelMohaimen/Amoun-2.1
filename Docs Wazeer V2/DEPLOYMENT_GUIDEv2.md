# Deployment Guide v2

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Infrastructure Overview](#infrastructure-overview)
3. [Build & Test Pipeline](#build--test-pipeline)
4. [Environment Variables](#environment-variables)
5. [Nginx Configuration](#nginx-configuration)
6. [PM2 Process Management](#pm2-process-management)
7. [Deployment Script](#deployment-script)
8. [Cloudflare Configuration](#cloudflare-configuration)
9. [Rollback Procedure](#rollback-procedure)
10. [Monitoring & Health Checks](#monitoring--health-checks)
11. [Scaling Path](#scaling-path)
12. [Security Checklist](#security-checklist)
13. [Arabic Section](#العربية)

---

## Prerequisites
- **Node.js** v20+ (recommended via nvm)
- **npm** (latest)
- **PM2** (`npm i -g pm2`)
- **rsync** (available on most *nix shells – Git Bash includes it)
- **Cloudflare** account with DNS zone for your domain
- **Hostinger** shared hosting account (or equivalent VPS for later phases)

## العربية
## المتطلبات المسبقة
- **Node.js** إصدار 20 أو أحدث (يفضل عبر nvm)
- **npm** أحدث نسخة
- **PM2** (`npm i -g pm2`)
- **rsync** (موجود في معظم بيئات *nix – Git Bash يتضمنه)
- حساب **Cloudflare** مع منطقة DNS للنطاق الخاص بك
- حساب **Hostinger** استضافة مشتركة (أو خادم VPS للمرحلة المتقدمة)

---

## Infrastructure Overview
```
┌───────────────────────────────────────────────────────────────────┐
│                        User's Browser                            │
│                        (PWA — Wazeer OS)                         │
└──────────────────────────┬────────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Cloudflare CDN (Planned)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│  │ DNS (A/AAA) │  │ SSL/TLS      │  │ Cache (static assets)    │  │
│  │ proxied     │  │ Edge certs   │  │ 1 year max‑age           │  │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│  │ DDoS Prot.  │  │ Rate Limit   │  │ WAF (Web App Firewall)  │  │
│  │ (L3/L4/L7)  │  │ (optional)   │  │ (managed rules)         │  │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────────┘
                           │ Origin pull
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Hostinger Shared Hosting                        │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Nginx (shared)                                          │    │
│  │  ├── / → /public_html/dist/ (Vite static build)         │    │
│  │  └── /api/* → proxy_pass http://127.0.0.1:3001          │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  PM2 Process Manager                                     │    │
│  │  └── wazeer-proxy (Express 4 on port 3001)               │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
        ┌───────▼───────┐    ┌────────▼───────┐
        │  Firebase      │    │  LLM Providers │
        │  Auth 12       │    │  (15 services) │
        └────────────────┘    └────────────────┘
```

## العربية
## نظرة عامة على البنية التحتية
```
┌───────────────────────────────────────────────────────────────────┐
│                        متصفح المستخدم                             │
│                        (PWA — وزير OS)                         │
└──────────────────────────┬─────────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    CDN Cloudflare (مخطط)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│  │ DNS (A/AAA) │  │ SSL/TLS      │  │ تخزين مؤقت (أصول ثابتة) │  │
│  │ proxied     │  │ شهادات الحافة │  │ 1 سنة max‑age             │  │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│  │ حماية DDoS │  │ تقييد المعدل │  │ جدار حماية WAF          │  │
│  │ (L3/L4/L7) │  │ (اختياري)     │  │ (قواعد مُدارة)          │  │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────────┘
                           │ سحب الأصل
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                استضافة مشتركة Hostinger                         │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Nginx (مشترك)                                            │    │
│  │ ├── / → /public_html/dist/ (بناء Vite ثابت)               │    │
│  │ └── /api/* → proxy_pass http://127.0.0.1:3001            │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ مدير عمليات PM2                                          │    │
│  │ └── wazeer-proxy (Express 4 على المنفذ 3001)              │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
        ┌───────▼───────┐    ┌────────▼───────┐
        │  Firebase      │    │  موفّري LLM      │
        │  Auth 12       │    │  (15 خدمة)       │
        └────────────────┘    └────────────────┘
```

---

## Build & Test Pipeline
```bash
# 1. Install dependencies (locked versions)
npm ci

# 2. Lint + TypeScript strict check (fails CI on warnings)
npm run lint && npx tsc --noEmit

# 3. Unit / Component tests (Vitest) – enforce coverage thresholds
npm run test:ci   # defined in package.json → vitest --run --coverage

# 4. End‑to‑End tests (Playwright) – only critical user‑flows
npx playwright test

# 5. Build production bundle (Vite 6)
npm run build   # outputs ./dist, gzip size ~180KB, total <300KB gzip
```

## العربية
## خط أنابيب البناء والاختبار
```bash
# 1. تثبيت الاعتمادات (إصدارات مقفلة)
npm ci

# 2. فحص lint + TypeScript الصارم (يفشل CI عند وجود تحذيرات)
npm run lint && npx tsc --noEmit

# 3. اختبارات الوحدة / المكون (Vitest) – فرض حدود التغطية
npm run test:ci   # معرف في package.json → vitest --run --coverage

# 4. اختبارات E2E (Playwright) – فقط تدفقات المستخدم الحرجة
npx playwright test

# 5. بناء الحزمة الإنتاجية (Vite 6)
npm run build   # ينتج ./dist، حجم gzip ~180KB، إجمالي <300KB gzip
```

---

## Environment Variables
### Server‑side (`.env`)
| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `PORT` | Yes | `3001` | Express proxy port |
| `NODE_ENV` | Yes | `production` | Environment mode |
| `ALLOWED_ORIGINS` | Yes | `https://wazeer.os,https://www.wazeer.os` | CORS allowed origins |
| `RATE_LIMIT_MAX` | No | `100` | Requests per minute per IP |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate‑limit window |
| `BODY_SIZE_LIMIT` | No | `5mb` | Max request body size |
| `REQUEST_TIMEOUT` | No | `120000` | Request timeout (ms) |
| `TRUST_PROXY` | Yes | `1` | Trust first proxy (Cloudflare/Hostinger) |

### Client‑side (`VITE_` prefixed)
| Variable | Prefix | Example | Description |
|----------|--------|---------|-------------|
| `VITE_APP_NAME` | `VITE_` | `Wazeer OS` | Display name |
| `VITE_APP_VERSION` | `VITE_` | `2.0.0` | Current version |
| `VITE_ENABLE_ANALYTICS` | `VITE_` | `false` | Feature flag for analytics |
| `VITE_ENABLE_MEMORY` | `VITE_` | `true` | Feature flag for MemoryEngine |

> **Note:** LLM API keys are stored per‑user in IndexedDB, NOT in `.env`.

## العربية
## متغيرات البيئة
### جانب الخادم (`.env`)
| المتغير | مطلوب | مثال | الوصف |
|----------|----------|---------|-------------|
| `PORT` | نعم | `3001` | منفذ خادم Express |
| `NODE_ENV` | نعم | `production` | وضع البيئة |
| `ALLOWED_ORIGINS` | نعم | `https://wazeer.os,https://www.wazeer.os` | أصول CORS المسموح بها |
| `RATE_LIMIT_MAX` | لا | `100` | عدد الطلبات في الدقيقة لكل IP |
| `RATE_LIMIT_WINDOW_MS` | لا | `60000` | نافذة تقييد المعدل |
| `BODY_SIZE_LIMIT` | لا | `5mb` | الحد الأقصى لحجم جسم الطلب |
| `REQUEST_TIMEOUT` | لا | `120000` | مهلة الطلب (مللي ثانية) |
| `TRUST_PROXY` | نعم | `1` | الوثوق بالوكيل الأول (Cloudflare/Hostinger) |

### جانب العميل (بادئة `VITE_`)
| المتغير | البادئة | مثال | الوصف |
|----------|--------|---------|-------------|
| `VITE_APP_NAME` | `VITE_` | `Wazeer OS` | اسم العرض |
| `VITE_APP_VERSION` | `VITE_` | `2.0.0` | الإصدار الحالي |
| `VITE_ENABLE_ANALYTICS` | `VITE_` | `false` | علم تشغيل التحليلات |
| `VITE_ENABLE_MEMORY` | `VITE_` | `true` | علم تشغيل MemoryEngine |

> **ملاحظة:** مفاتيح API للـLLM مخزنة لكل مستخدم في IndexedDB، **ليس** في `.env`.

---

## Nginx Configuration
```nginx
# /etc/nginx/sites-available/wazeer-os.conf
server {
    listen 80;
    server_name wazeer.os www.wazeer.os;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name wazeer.os www.wazeer.os;

    # SSL (managed by Hostinger or Cloudflare)
    ssl_certificate /etc/ssl/certs/wazeer.os.pem;
    ssl_certificate_key /etc/ssl/private/wazeer.os.key;

    # Security headers (defense in depth)
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Gzip compression (Brotli preferred if available)
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 256;

    # Static files — Vite build output
    root /home/user/public_html/dist;
    index index.html;

    # Cache static assets (content‑hashed by Vite)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Service Worker — no cache
    location /sw.js {
        expires off;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files $uri =404;
    }

    # PWA Manifest
    location /manifest.json {
        expires 1d;
        add_header Cache-Control "public";
        try_files $uri =404;
    }

    # API proxy — forward to PM2 Express process
    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
        proxy_buffering off;           # Required for SSE streaming
        proxy_cache_bypass $http_upgrade;
    }

    # SPA fallback — all other routes → index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## العربية
## إعداد Nginx
```nginx
# /etc/nginx/sites-available/wazeer-os.conf
server {
    listen 80;
    server_name wazeer.os www.wazeer.os;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name wazeer.os www.wazeer.os;

    # SSL (مدار من Hostinger أو Cloudflare)
    ssl_certificate /etc/ssl/certs/wazeer.os.pem;
    ssl_certificate_key /etc/ssl/private/wazeer.os.key;

    # رؤوس الأمان (طبقات دفاعية)
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # ضغط gzip (يفضل Brotli إذا متاح)
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 256;

    # ملفات ثابتة — ناتج بناء Vite
    root /home/user/public_html/dist;
    index index.html;

    # تخزين مؤقت للأصول الثابتة (محتوى‑مُعَلم بواسطة Vite)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # عامل الخدمة — لا تخزين مؤقت
    location /sw.js {
        expires off;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files $uri =404;
    }

    # ملف تعريف PWA
    location /manifest.json {
        expires 1d;
        add_header Cache-Control "public";
        try_files $uri =404;
    }

    # وكيل API — تمرير إلى عملية Express في PM2
    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
        proxy_buffering off;           # مطلوب لتدفق SSE
        proxy_cache_bypass $http_upgrade;
    }

    # إرجاع SPA — كل المسارات الأخرى → index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## PM2 Process Management
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'wazeer-proxy',
    script: './server/index.js',
    instances: 1,              // Shared hosting = 1 instance
    exec_mode: 'fork',
    port: 3001,
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      TRUST_PROXY: 1,
    },
    max_memory_restart: '100M', // Restart if memory exceeds 100MB
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/home/user/logs/wazeer-error.log',
    out_file: '/home/user/logs/wazeer-out.log',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,         // Graceful shutdown timeout
  }],
};
```

### Common PM2 Commands
- `pm2 start ecosystem.config.js`
- `pm2 restart wazeer-proxy`
- `pm2 reload wazeer-proxy`   // zero‑downtime reload
- `pm2 stop wazeer-proxy`
- `pm2 logs wazeer-proxy`
- `pm2 monit`
- `pm2 save`   // persist process list

## العربية
## إدارة عملية PM2
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'wazeer-proxy',
    script: './server/index.js',
    instances: 1,              // الاستضافة المشتركة = نسخة واحدة
    exec_mode: 'fork',
    port: 3001,
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      TRUST_PROXY: 1,
    },
    max_memory_restart: '100M', // إعادة تشغيل إذا تجاوز الذاكرة 100MB
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/home/user/logs/wazeer-error.log',
    out_file: '/home/user/logs/wazeer-out.log',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,         // مهلة إغلاق هادئ
  }],
};
```

### أوامر PM2 الشائعة
- `pm2 start ecosystem.config.js`
- `pm2 restart wazeer-proxy`
- `pm2 reload wazeer-proxy`   // إعادة تحميل بدون توقف
- `pm2 stop wazeer-proxy`
- `pm2 logs wazeer-proxy`
- `pm2 monit`
- `pm2 save`   // حفظ قائمة العمليات للتحميل المستقبلي

---

## Deployment Script
```bash
#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="/home/user/public_html/dist"
BUILD_DIR="./dist"
BACKUP_DIR="/home/user/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "𓂀 Wazeer OS Deployment — $(date)"
echo "================================"

# 1. Run tests
echo "[1/6] Running tests..."
npm run test:ci

# 2. Build
echo "[2/6] Building for production..."
npm run build

# 3. Backup current deployment (retain last 7 backups)
echo "[3/6] Backing up current deployment..."
mkdir -p "$BACKUP_DIR"
if [ -d "$DEPLOY_DIR" ]; then
  tar -czf "$BACKUP_DIR/wazeer-$TIMESTAMP.tar.gz" -C /home/user/public_html dist
  echo "  Backup created: $BACKUP_DIR/wazeer-$TIMESTAMP.tar.gz"
fi
# Rotate backups – keep newest 7, delete older
cd "$BACKUP_DIR"
ls -1tr wazeer-*.tar.gz | head -n -7 | xargs -r rm --

# 4. Deploy static files
echo "[4/6] Deploying static files..."
rsync -avz --delete "$BUILD_DIR/" "$DEPLOY_DIR/"

# 5. Restart proxy
echo "[5/6] Restarting proxy..."
pm run pm2:reload   # defined as "pm2 reload wazeer-proxy"

# 6. Health check
echo "[6/6] Running health check..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://wazeer.os/api/health || echo '000')
if [ "$HTTP_STATUS" = "200" ]; then
  echo "  ✅ Health check passed (200)"
else
  echo "  ❌ Health check failed ($HTTP_STATUS)"
  echo "  Rolling back..."
  LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/wazeer-*.tar.gz | head -1)
  tar -xzf "$LATEST_BACKUP" -C /home/user/public_html
  npm run pm2:restart   # `pm2 restart wazeer-proxy`
  exit 1
fi

echo "================================"
echo "✅ Deployment successful!"
echo "  Version: $(node -p "require('./package.json').version")"
echo "  Time: $(date)"
```

## العربية
## سكريبت النشر
```bash
#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="/home/user/public_html/dist"
BUILD_DIR="./dist"
BACKUP_DIR="/home/user/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "𓂀 نشر وزير OS — $(date)"
echo "================================"

# 1. تشغيل الاختبارات
echo "[1/6] تشغيل الاختبارات..."
npm run test:ci

# 2. بناء التطبيق
echo "[2/6] بناء نسخة الإنتاج..."
npm run build

# 3. نسخ احتياطي للنسخة الحالية (الاحتفاظ بآخر 7 نسخ احتياطيّة)
echo "[3/6] إنشاء نسخة احتياطيّة..."
mkdir -p "$BACKUP_DIR"
if [ -d "$DEPLOY_DIR" ]; then
  tar -czf "$BACKUP_DIR/wazeer-$TIMESTAMP.tar.gz" -C /home/user/public_html dist
  echo "  نسخة احتياطيّة تم إنشاؤها: $BACKUP_DIR/wazeer-$TIMESTAMP.tar.gz"
fi
# تدوير النسخ الاحتياطيّة – الاحتفاظ بأحدث 7، حذف الباقي
cd "$BACKUP_DIR"
ls -1tr wazeer-*.tar.gz | head -n -7 | xargs -r rm --

# 4. نشر الملفات الثابتة
echo "[4/6] نشر الملفات الثابتة..."
rsync -avz --delete "$BUILD_DIR/" "$DEPLOY_DIR/"

# 5. إعادة تشغيل الوكيل
echo "[5/6] إعادة تشغيل الوكيل..."
pm run pm2:reload   # معرف في package.json → "pm2 reload wazeer-proxy"

# 6. فحص الصحة
echo "[6/6] فحص الصحة..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://wazeer.os/api/health || echo '000')
if [ "$HTTP_STATUS" = "200" ]; then
  echo "  ✅ فحص الصحة نجح (200)"
else
  echo "  ❌ فحص الصحة فشل ($HTTP_STATUS)"
  echo "  الرجوع إلى النسخة الاحتياطيّة..."
  LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/wazeer-*.tar.gz | head -1)
  tar -xzf "$LATEST_BACKUP" -C /home/user/public_html
  npm run pm2:restart   # `pm2 restart wazeer-proxy`
  exit 1
fi

echo "================================"
echo "✅ النشر ناجح!"
echo "  الإصدار: $(node -p "require('./package.json').version")"
echo "  الوقت: $(date)"
```

---

## Cloudflare Configuration
### DNS Settings
| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| A    | `@`  | Hostinger IP | ☁️ Proxied | Auto |
| A    | `www`| Hostinger IP | ☁️ Proxied | Auto |

### SSL/TLS (Full Strict)
- **Mode:** Full (Strict) – requires a valid origin certificate.
- **Minimum TLS Version:** TLS 1.2
- **Always Use HTTPS:** On
- **Automatic HTTPS Rewrites:** On

### Caching Rules (recommended)
| Rule | Setting |
|------|---------|
| Static assets (`/assets/*`) | Cache Level: Standard, Edge TTL: 1 year |
| Service Worker (`/sw.js`) | Bypass Cache |
| API (`/api/*`) | Bypass Cache |
| HTML (`/`) | Cache Level: Standard, Edge TTL: 2 hours |

### Optional Rate‑Limiting (Cloudflare Layer)
```
Rule: Wazeer API Rate Limit
  URI Path: /api/*
  Rate: 100 requests per 60 seconds per IP
  Action: Block for 60 seconds
  Response: 429 Too Many Requests
```

## العربية
## إعدادات Cloudflare
### إعدادات DNS
| النوع | الاسم | المحتوى | الوكيل | TTL |
|------|------|---------|-------|-----|
| A    | `@`  | عنوان IP Hostinger | ☁️ بروكسي | تلقائي |
| A    | `www`| عنوان IP Hostinger | ☁️ بروكسي | تلقائي |

### SSL/TLS (Full Strict)
- **الوضع:** Full (Strict) – يتطلب شهادة أصل صالحة.
- **الحد الأدنى لإصدار TLS:** TLS 1.2
- **استخدام HTTPS دائمًا:** تشغيل
- **إعادة كتابة HTTPS تلقائية:** تشغيل

### قواعد التخزين المؤقت (مستحسنة)
| القاعدة | الإعداد |
|---------|---------|
| الأصول الثابتة (`/assets/*`) | مستوى التخزين: قياسي، Edge TTL: سنة واحدة |
| عامل الخدمة (`/sw.js`) | تخطي التخزين المؤقت |
| API (`/api/*`) | تخطي التخزين المؤقت |
| HTML (`/`) | مستوى التخزين: قياسي، Edge TTL: ساعتان |

### تقييد معدل اختياري (طبقة Cloudflare)
```
القاعدة: تقييد معدل واجهة برمجة تطبيقات وزير
  مسار URI: /api/*
  المعدل: 100 طلب كل 60 ثانية لكل IP
  الإجراء: حظر لمدة 60 ثانية
  الاستجابة: 429 Too Many Requests
```

---

## Rollback Procedure
1. **Identify the latest backup** in `/home/user/backups` (filename includes timestamp).
2. **Extract** the backup to the web root:
   ```bash
   tar -xzf /home/user/backups/wazeer-<timestamp>.tar.gz -C /home/user/public_html
   ```
3. **Restart the proxy** to load the restored files:
   ```bash
   pm2 restart wazeer-proxy
   ```
4. **Run a health check** (`curl https://wazeer.os/api/health`). If the status is not `200`, repeat with the previous backup.
5. **Document** the rollback event in `logs/rollback.log` (timestamp, backup used, reason).

## العربية
## إجراء التراجع
1. **حدد أحدث نسخة احتياطيّة** في `/home/user/backups` (الاسم يحتوي على طابع زمني).
2. **استخرج** النسخة إلى جذر الويب:
   ```bash
   tar -xzf /home/user/backups/wazeer-<timestamp>.tar.gz -C /home/user/public_html
   ```
3. **أعد تشغيل الوكيل** لتحميل الملفات المستعادة:
   ```bash
   pm2 restart wazeer-proxy
   ```
4. **نفّذ فحص الصحة** (`curl https://wazeer.os/api/health`). إذا لم يكن الوضع `200`، كرّر مع النسخة الاحتياطيّة السابقة.
5. **سجّل** حدث التراجع في `logs/rollback.log` (الطابع الزمني، النسخة المستخدمة، السبب).

---

## Monitoring & Health Checks
| Tool | Purpose | Setup |
|------|---------|-------|
| **PM2 Plus** (free) | Process monitoring, logs, alerts | `pm2 link` to enable dashboard |
| **UptimeRobot** (free) | External uptime check of `/api/health` every 5 min | Add monitor → URL → `https://wazeer.os/api/health` |
| **Chrome Lighthouse** | Performance, accessibility, PWA, SEO audit before each release | Run `npx lighthouse https://wazeer.os --output=json` |
| **Custom Metrics Dashboard** (optional) | Visualize request latency, error rate, memory usage | Export PM2 metrics to Grafana via InfluxDB (future phase) |

### Alert Threshold Recommendations
- **CPU** > 70 % for > 5 min → Slack/Webhook alert
- **Memory** > 80 % → PagerDuty alert
- **Avg. Response Time** > 500 ms → Email alert
- **Error Rate** > 1 % of requests → SMS alert

## العربية
## المراقبة وفحص الصحة
| الأداة | الغرض | الإعداد |
|------|---------|-------|
| **PM2 Plus** (مجاني) | مراقبة العملية، السجلات، التنبيهات | `pm2 link` لتفعيل لوحة التحكم |
| **UptimeRobot** (مجاني) | فحص وقت تشغيل خارجي لـ `/api/health` كل 5 دقائق | أضف مراقبة → URL → `https://wazeer.os/api/health` |
| **Chrome Lighthouse** | تدقيق الأداء، القدرة على الوصول، PWA، SEO قبل كل إصدار | تشغيل `npx lighthouse https://wazeer.os --output=json` |
| **لوحة مقاييس مخصصة** (اختياري) | تصور زمن الاستجابة، معدل الأخطاء، استهلاك الذاكرة | تصدير مقاييس PM2 إلى Grafana عبر InfluxDB (المرحلة المستقبلية) |

### توصيات حدود التنبيه
- **CPU** > 70 % لأكثر من 5 دقائق → تنبيه Slack/Webhook
- **الذاكرة** > 80 % → تنبيه PagerDuty
- **متوسط زمن الاستجابة** > 500 ms → تنبيه بريد إلكتروني
- **معدل الأخطاء** > 1 % من الطلبات → تنبيه SMS

---

## Scaling Path
| Phase | Users | Infrastructure | Cost (approx.) | Key Changes |
|-------|-------|--------------|----------------|-------------|
| **Phase 1 – Launch** | ~100 | 1× Shared Hosting + 1× PM2 process | $5 / mo | Current setup – baseline monitoring |
| **Phase 2 – Growth** | 1 000‑5 000 | VPS (1 vCPU, 2 GB RAM) + Cloudflare CDN | $20‑$30 / mo | Add second PM2 instance, enable horizontal replica, configure Cloudflare load‑balancer |
| **Phase 3 – SaaS** | 50 000+ | Kubernetes cluster + Cloudflare Enterprise | $200‑$300 / mo | Deploy stateless Pods, use Redis for rate‑limit store, automated CI/CD pipelines |

## العربية
## مسار التوسع
| المرحلة | عدد المستخدمين | البنية التحتية | التكلفة (تقريبية) | التغييرات الرئيسية |
|-------|----------------|----------------|-------------------|-------------------|
| **المرحلة 1 – الإطلاق** | ~100 | استضافة مشتركة × 1 + عملية PM2 × 1 | 5 $/شهر | الإعداد الحالي – مراقبة أساسية |
| **المرحلة 2 – النمو** | 1 000‑5 000 | خادم VPS (1 vCPU, 2 GB RAM) + CDN Cloudflare | 20‑30 $/شهر | إضافة نسخة ثانية من PM2، تمكين النسخة الأفقية، ضبط موازن تحميل Cloudflare |
| **المرحلة 3 – SaaS** | 50 000+ | مجموعة Kubernetes + Cloudflare Enterprise | 200‑300 $/شهر | نشر حاويات غير حالة، استخدام Redis لتخزين تقييد المعدل، خطوط CI/CD تلقائية |

---

## Security Checklist
- **Security Headers** – CSP, HSTS, X‑Frame‑Options, X‑Content‑Type‑Options, Referrer‑Policy, Permissions‑Policy, COEP, COOP, CORP (configured via Helmet).
- **HorusGuard AST Scanner** – Blocks `eval`, `innerHTML`, `require('child_process')`, insecure `fetch` (http://).
- **Prompt Sanitizer** – Redacts API keys, bearer tokens, passwords, environment variables.
- **Excommunicado Protocol** – IP ban after 100 requests/min (5 min temporary, then permanent).
- **Rate Limiting** – 100 req/min per IP at proxy level, optional Cloudflare layer.
- **Backup Security** – Encrypt backup tarballs (e.g., `gpg --symmetric`) and store off‑site.
- **Audit Log** – All proxy requests logged to IndexedDB `logs` store; no sensitive data recorded.

## العربية
## قائمة التحقق الأمنية
- **رؤوس الأمان** – CSP, HSTS, X‑Frame‑Options, X‑Content‑Type‑Options, Referrer‑Policy, Permissions‑Policy, COEP, COOP, CORP (مكوّن عبر Helmet).
- **HorusGuard – ماسح AST** – يمنع `eval`، `innerHTML`، `require('child_process')`، `fetch` غير الآمن (http://).
- **معقم المطالبات** – يزيل مفاتيح API، رموز Bearer، كلمات المرور، متغيرات البيئة.
- **بروتوكول Excommunicado** – حظر IP بعد 100 طلب/دقيقة (5 دقائق مؤقت ثم دائم).
- **تقييد المعدل** – 100 طلب/دقيقة لكل IP على مستوى الوكيل، طبقة Cloudflare اختيارية.
- **أمان النسخ الاحتياطي** – تشفير أرشيفات النسخ الاحتياطي (مثال `gpg --symmetric`) وتخزينها خارج الموقع.
- **سجل التدقيق** – جميع طلبات الوكيل مسجّلة في مخزن IndexedDB `logs`؛ لا يتم تسجيل بيانات حساسة.

---

## Arabic Section
**(All sections above are duplicated in Arabic; the English version precedes each Arabic block for easy side‑by‑side reading.)
