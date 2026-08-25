# 14 — Deployment Guide / دليل النشر

> Wazeer OS / وزير OS v2.0.0-Rewrite | 𓂀 Amoun / أمون
> Author: 100MillionDEV / العرآب
> Infrastructure: Hostinger Shared Hosting + Cloudflare CDN (Planned)
> Principle: **Scalable Architecture** — Start small, grow without rewrite

---

## 1. Infrastructure Overview / نظرة عامة على البنية التحتية

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
│  │ proxied     │  │ Edge certs   │  │ 1 year max-age           │  │
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
        └───────────────┘    └────────────────┘
```

### Hostinger Specifications

| Resource | Allocation | Usage by Wazeer OS |
|----------|-----------|-------------------|
| Disk Space | 100 GB | ~50MB (build) + ~100MB (logs backup) |
| Bandwidth | Unlimited | Static assets + proxy traffic |
| RAM | Shared (no fixed) | ~30-50MB for Node.js proxy |
| CPU | Shared (no fixed) | Minimal — proxy-only, no compute |
| Node.js | v20+ via PM2 | Single process, 3001 port |
| SSL | Free via Hostinger or Cloudflare | Auto-renewed |
| Domains | 1 included | `wazeer.os` or subdomain |

---

## 2. Build Process / عملية البناء

### Build Pipeline

```
Source Code (src/)
       │
       ▼
┌──────────────────┐
│  npm run build   │  Vite 6 production build
│  (vite build)    │  React 19 + Tailwind 4 + TypeScript
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  dist/           │  Static build output
│  ├── index.html  │  Entry HTML with preloaded assets
│  ├── assets/     │  JS, CSS (content-hashed filenames)
│  │   ├── index-[hash].js      (~180KB gzip)
│  │   ├── index-[hash].css     (~25KB gzip)
│  │   └── vendor-[hash].js     (~80KB gzip, if split)
│  ├── sw.js       │  Service Worker (Workbox)
│  ├── manifest.json│  PWA manifest
│  └── icons/      │  App icons (192, 512, maskable)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  rsync to        │  Deploy static files
│  Hostinger       │  → /public_html/dist/
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  PM2 restart     │  Restart Express proxy
│  wazeer-proxy    │  → Graceful shutdown → start
└──────────────────┘
```

### Vite Build Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Wazeer OS / وزير OS',
        short_name: 'وزير',
        description: 'AI Operating System — 𓂀 Amoun',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'es2022',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand', 'framer-motion'],
          ai: ['@google/genai'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

---

## 3. Environment Variables / متغيرات البيئة

### Server-Side (.env — Hostinger only)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `PORT` | Yes | `3001` | Express proxy port |
| `NODE_ENV` | Yes | `production` | Environment mode |
| `ALLOWED_ORIGINS` | Yes | `https://wazeer.os,https://www.wazeer.os` | CORS allowed origins |
| `RATE_LIMIT_MAX` | No | `100` | Requests per minute per IP |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit window |
| `BODY_SIZE_LIMIT` | No | `5mb` | Max request body size |
| `REQUEST_TIMEOUT` | No | `120000` | Request timeout in ms |
| `TRUST_PROXY` | Yes | `1` | Trust first proxy (Cloudflare/Hostinger) |

### Client-Side (Vite env — baked into build)

| Variable | Prefix | Example | Description |
|----------|--------|---------|-------------|
| `VITE_APP_NAME` | `VITE_` | `Wazeer OS` | App display name |
| `VITE_APP_VERSION` | `VITE_` | `2.0.0` | Current version |
| `VITE_ENABLE_ANALYTICS` | `VITE_` | `false` | Feature flag: analytics |
| `VITE_ENABLE_MEMORY` | `VITE_` | `true` | Feature flag: MemoryEngine |

> **Note:** LLM API keys are **NOT** in environment variables. They are stored per-user in IndexedDB (BYOK model).

---

## 4. Nginx Configuration / إعدادات Nginx

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

    # SSL (managed by Hostinger/Cloudflare)
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

    # Cache static assets (content-hashed by Vite)
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

---

## 5. PM2 Configuration / إعدements PM2

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

### PM2 Commands

| Command | Purpose |
|---------|---------|
| `pm2 start ecosystem.config.js` | Start proxy process |
| `pm2 restart wazeer-proxy` | Restart after deploy |
| `pm2 reload wazeer-proxy` | Zero-downtime reload |
| `pm2 stop wazeer-proxy` | Stop process |
| `pm2 logs wazeer-proxy` | View live logs |
| `pm2 monit` | Real-time monitoring dashboard |
| `pm2 startup` | Generate startup script |
| `pm2 save` | Save process list for resurrection |

---

## 6. Cloudflare Configuration / إعدادات Cloudflare

### DNS Settings

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| A | `@` | Hostinger IP | ☁️ Proxied | Auto |
| A | `www` | Hostinger IP | ☁️ Proxied | Auto |

### SSL/TLS

| Setting | Value |
|---------|-------|
| SSL Mode | **Full (Strict)** |
| Minimum TLS Version | **TLS 1.2** |
| Always Use HTTPS | **On** |
| Automatic HTTPS Rewrites | **On** |

### Caching

| Rule | Setting |
|------|---------|
| Static assets (`/assets/*`) | Cache Level: Standard, Edge TTL: 1 year |
| Service Worker (`/sw.js`) | Bypass Cache |
| API (`/api/*`) | Bypass Cache |
| HTML (`/`) | Cache Level: Standard, Edge TTL: 2 hours |

### DDoS Protection

| Feature | Setting |
|---------|---------|
| DDoS Protection | **On** (free tier) |
| Bot Fight Mode | **On** |
| Challenge Passage | 30 minutes |
| Security Level | **Medium** |

### Rate Limiting (Cloudflare Layer — Optional)

```
Rule: Wazeer API Rate Limit
  URI Path: /api/*
  Rate: 100 requests per 60 seconds per IP
  Action: Block for 60 seconds
  Response: 429 Too Many Requests
```

---

## 7. Scalability Path / مسار التوسع

### Phase 1: Launch (Current)

```
Resources: 1x Shared Hosting + 1x PM2 Process
Capacity: ~100 concurrent users
Cost: ~$5/month

┌──────────────────┐
│  Hostinger       │
│  ┌────────────┐  │
│  │ Nginx      │  │
│  │ PM2 (x1)   │  │
│  │ dist/      │  │
│  └────────────┘  │
└──────────────────┘
```

### Phase 2: Growth (Cloudflare + Upgrade)

```
Resources: Cloudflare CDN + VPS (1 vCPU, 1GB RAM)
Capacity: ~1,000 concurrent users
Cost: ~$20/month

┌─────────────┐     ┌──────────────────┐
│ Cloudflare  │────►│  VPS             │
│ CDN + Cache │     │  ┌────────────┐  │
│ DDoS        │     │  │ Nginx      │  │
│ WAF         │     │  │ PM2 (x2)   │  │
└─────────────┘     │  │ dist/      │  │
                    │  └────────────┘  │
                    └──────────────────┘
```

### Phase 3: SaaS (Full Scale)

```
Resources: Cloudflare Enterprise + Kubernetes + DB
Capacity: ~50,000 concurrent users
Cost: ~$200/month

┌───────────────┐     ┌──────────────────────────┐
│ Cloudflare    │     │  Kubernetes Cluster       │
│ Enterprise    │────►│  ┌────────┐ ┌────────┐   │
│ CDN + WAF     │     │  │ Pod 1  │ │ Pod 2  │   │
│ + Bot Mgmt   │     │  │ Proxy  │ │ Proxy  │   │
└───────────────┘     │  └────────┘ └────────┘   │
                      │  ┌────────┐ ┌────────┐   │
                      │  │ Pod 3  │ │ Pod N  │   │
                      │  │ Proxy  │ │ Proxy  │   │
                      │  └────────┘ └────────┘   │
                      │  ┌────────────────────┐  │
                      │  │ Redis (rate limit) │  │
                      │  └────────────────────┘  │
                      └──────────────────────────┘
```

| Phase | Users | Infra | Monthly Cost | Key Change |
|-------|-------|-------|-------------|------------|
| Launch | 100 | Shared Hosting | $5 | Current state |
| Growth | 1,000 | VPS + Cloudflare | $20 | Add VPS, Cloudflare free tier |
| SaaS | 50,000 | K8s + Cloudflare Pro | $200 | Containerize, horizontal scale |

---

## 8. Deploy Script / سكريبت النشر

```bash
#!/bin/bash
# deploy.sh — Wazeer OS Production Deployment
set -euo pipefail

DEPLOY_DIR="/home/user/public_html/dist"
BUILD_DIR="./dist"
BACKUP_DIR="/home/user/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "𓂀 Wazeer OS Deployment — $(date)"
echo "================================"

# Step 1: Run tests
echo "[1/6] Running tests..."
npm run test:ci

# Step 2: Build
echo "[2/6] Building for production..."
npm run build

# Step 3: Backup current deployment
echo "[3/6] Backing up current deployment..."
mkdir -p "$BACKUP_DIR"
if [ -d "$DEPLOY_DIR" ]; then
  tar -czf "$BACKUP_DIR/wazeer-$TIMESTAMP.tar.gz" -C /home/user/public_html dist
  echo "  Backup: $BACKUP_DIR/wazeer-$TIMESTAMP.tar.gz"
fi

# Step 4: Deploy static files
echo "[4/6] Deploying static files..."
rsync -avz --delete "$BUILD_DIR/" "$DEPLOY_DIR/"

# Step 5: Restart proxy
echo "[5/6] Restarting proxy..."
pm run deploy:proxy  # pm2 reload wazeer-proxy

# Step 6: Health check
echo "[6/6] Running health check..."
HTTP_STATUS=$(curl -s -o /dev/null -w '%{http_code}' https://wazeer.os/api/health || echo '000')
if [ "$HTTP_STATUS" = "200" ]; then
  echo "  ✅ Health check passed (200)"
else
  echo "  ❌ Health check failed ($HTTP_STATUS)"
  echo "  Rolling back..."
  tar -xzf "$BACKUP_DIR/wazeer-$TIMESTAMP.tar.gz" -C /home/user/public_html
  pm2 restart wazeer-proxy
  exit 1
fi

echo "================================"
echo "✅ Deployment successful!"
echo "  Version: $(node -p "require('./package.json').version")"
echo "  Time: $(date)"
```

---

## 9. Monitoring & Health Checks / المراقبة والفحص الصحي

### Health Check Endpoint

```typescript
// server/routes/health.ts
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: process.env.npm_package_version || 'unknown',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});
```

### Monitoring Stack (Minimal)

| Tool | Purpose | Setup |
|------|---------|-------|
| PM2 Plus (free) | Process monitoring, logs, alerts | `pm2 link` |
| UptimeRobot (free) | Uptime monitoring, alerting | Monitor `https://wazeer.os/api/health` every 5 min |
| Cloudflare Analytics | Traffic, security events, performance | Built-in with Cloudflare |
| Chrome Lighthouse | Performance, accessibility, PWA, SEO | Manual before each release |

---

## 10. Rollback Procedure / إجراء التراجع

```bash
#!/bin/bash
# rollback.sh — Emergency Rollback
set -euo pipefail

BACKUP_DIR="/home/user/backups"
DEPLOY_DIR="/home/user/public_html/dist"

# Find latest backup
LATEST=$(ls -t "$BACKUP_DIR"/wazeer-*.tar.gz | head -1)

if [ -z "$LATEST" ]; then
  echo "❌ No backup found!"
  exit 1
fi

echo "Rolling back to: $LATEST"
tar -xzf "$LATEST" -C /home/user/public_html
pm2 restart wazeer-proxy
echo "✅ Rollback complete"
```

---

## 11. SSL Configuration / إعدادات SSL

### Current: Hostinger SSL

| Aspect | Configuration |
|--------|--------------|
| Certificate Authority | Let's Encrypt (via Hostinger) |
| Auto-renewal | Yes (every 60 days) |
| Protocol | TLS 1.2, TLS 1.3 |
| Cipher Suites | ECDHE-RSA-AES128-GCM-SHA256, ECDHE-RSA-AES256-GCM-SHA384 |

### Planned: Cloudflare SSL

| Aspect | Configuration |
|--------|--------------|
| Mode | Full (Strict) — requires valid origin cert |
| Edge Certificate | Cloudflare Universal SSL (free) |
| Origin Certificate | Cloudflare Origin CA (15 year) |
| HSTS | Enabled via Cloudflare (max-age=31536000) |

---

> 𓂀 *From a single shared hosting to the cloud — Wazeer OS scales with its people, not against them.* — Wazeer OS DevOps