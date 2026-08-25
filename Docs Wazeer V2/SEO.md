# SEO — Wazeer OS v2.0.0-Rewrite

> 𓂀 Wazeer OS (وزير OS) — Search Engine Optimization & PWA Visibility  
> Document Owner: Frontend & Marketing Team | Last Updated: 2025-01  
> Classification: Internal — Engineering & Marketing

---

## Table of Contents

1. [Overview](#overview)
2. [PWA Manifest Optimization](#pwa-manifest-optimization)
3. [index.html Meta Tags](#indexhtml-meta-tags)
4. [Structured Data](#structured-data)
5. [Service Worker Caching Strategy](#service-worker-caching-strategy)
6. [Performance Optimization for SEO](#performance-optimization-for-seo)
7. [Landing Page SEO](#landing-page-seo)
8. [Arabic SEO Considerations](#arabic-seo-considerations)
9. [Monitoring & Metrics](#monitoring--metrics)

---

## Overview

Wazeer OS is a **Progressive Web App (PWA)**, which means traditional SEO strategies must be adapted. The landing page (LandingPageView) is the primary indexable surface, while the app shell and all views within the authenticated experience are client-side rendered.

### SEO Strategy Summary

| Surface | Indexable? | Strategy |
|---|---|---|
| Landing page | ✅ Yes | Full SEO — meta tags, structured data, content |
| App shell (authenticated) | ⚠️ Limited | Meta tags set, but content is client-rendered |
| PWA install | ✅ Yes | Manifest optimization for discoverability |
| Deep links | ✅ Planned | URL-based routing for shareable views |

### Search Targets

| Query Type | Example | Target Page |
|---|---|---|
| Brand search | "Wazeer OS", "وزير OS" | Landing page |
| Feature search | "AI assistant PWA", "personal AI workspace" | Landing page |
| Agent search | "Amoun AI assistant", "أمون ذكاء اصطناعي" | Landing page |
| Developer search | "AI code editor PWA", "LLM dashboard" | Landing page |

---

## PWA Manifest Optimization

### manifest.json

```json
{
  "name": "Wazeer OS — Personal AI Assistant",
  "short_name": "Wazeer OS",
  "description": "Wazeer OS (وزير OS) — Your personal AI assistant with Amoun. Egyptian Cyberpunk PWA for chat, coding, and AI-powered productivity.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#050508",
  "theme_color": "#2dd4bf",
  "orientation": "any",
  "scope": "/",
  "lang": "en",
  "dir": "ltr",
  "categories": ["productivity", "utilities", "lifestyle"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop-wide.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Wazeer OS Desktop — Home View with Amoun AI"
    },
    {
      "src": "/screenshots/mobile-narrow.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Wazeer OS Mobile — Chat with Amoun"
    }
  ],
  "shortcuts": [
    {
      "name": "New Chat",
      "short_name": "Chat",
      "description": "Start a new conversation with Amoun",
      "url": "/?action=new-chat",
      "icons": [{ "src": "/icons/shortcut-chat.png", "sizes": "96x96" }]
    },
    {
      "name": "Editor",
      "short_name": "Editor",
      "description": "Open the Amoun integrated editor",
      "url": "/?action=open-editor",
      "icons": [{ "src": "/icons/shortcut-editor.png", "sizes": "96x96" }]
    }
  ]
}
```

### Manifest Optimization Notes

| Field | SEO Impact | Notes |
|---|---|---|
| `name` | High | Full app name with keywords — "Personal AI Assistant" |
| `short_name` | High | Concise for home screen — "Wazeer OS" |
| `description` | High | Keyword-rich description for PWA directories |
| `categories` | Medium | Helps in PWA store categorization |
| `screenshots` | High | Critical for PWA install dialog and directories |
| `shortcuts` | Medium | Improves discoverability of key features |
| `theme_color` | Medium | #2dd4bf (teal) matches brand |
| `background_color` | Low | #050508 (dark) for splash screen |

### Icon Requirements

| Size | Usage | Required? |
|---|---|---|
| 72x72 | Android legacy | ✅ |
| 96x96 | Android, shortcuts | ✅ |
| 128x128 | Chrome Web Store | ✅ |
| 144x144 | Windows tiles | ✅ |
| 152x152 | iOS legacy | ✅ |
| 192x192 | Android maskable | ✅ Required |
| 384x384 | Android splash | ✅ |
| 512x512 | PWA install, maskable | ✅ Required |

All icons include the 𓂀 Eye of Horus mark with teal glow on dark background (#050508).

---

## index.html Meta Tags

### Complete `<head>` Configuration

```html
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
  
  <!-- Primary Meta Tags -->
  <title>Wazeer OS — Personal AI Assistant 𓂀</title>
  <meta name="title" content="Wazeer OS — Personal AI Assistant 𓂀" />
  <meta name="description" content="Wazeer OS (وزير OS) is a Progressive Web App personal AI assistant powered by Amoun (أمون). Chat, code, and manage tasks with Egyptian Cyberpunk design." />
  <meta name="keywords" content="Wazeer OS, AI assistant, PWA, Amoun, personal AI, chat, code editor, LLM, Egyptian Cyberpunk, وزير OS, أمون, ذكاء اصطناعي" />
  <meta name="author" content="100MillionDEV / العرآب" />
  <meta name="robots" content="index, follow" />
  <meta name="language" content="English" />
  <meta name="revisit-after" content="7 days" />
  
  <!-- PWA Meta Tags -->
  <meta name="theme-color" content="#2dd4bf" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Wazeer OS" />
  <meta name="application-name" content="Wazeer OS" />
  <meta name="msapplication-TileColor" content="#050508" />
  <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
  
  <!-- Favicon -->
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  
  <!-- Manifest -->
  <link rel="manifest" href="/manifest.json" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://wazeer.os/" />
  <meta property="og:title" content="Wazeer OS — Personal AI Assistant 𓂀" />
  <meta property="og:description" content="Wazeer OS (وزير OS) — Your personal AI assistant with Amoun. Egyptian Cyberpunk PWA for chat, coding, and AI-powered productivity." />
  <meta property="og:image" content="https://wazeer.os/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:locale:alternate" content="ar_SA" />
  <meta property="og:site_name" content="Wazeer OS" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://wazeer.os/" />
  <meta name="twitter:title" content="Wazeer OS — Personal AI Assistant 𓂀" />
  <meta name="twitter:description" content="Wazeer OS (وزير OS) — Your personal AI assistant with Amoun. Egyptian Cyberpunk PWA for chat, coding, and AI-powered productivity." />
  <meta name="twitter:image" content="https://wazeer.os/og-image.png" />
  <meta name="twitter:creator" content="@100MillionDEV" />
  
  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Wazeer OS",
    "alternateName": "وزير OS",
    "description": "Progressive Web App personal AI assistant with Amoun (أمون)",
    "url": "https://wazeer.os",
    "applicationCategory": "Productivity",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Person",
      "name": "100MillionDEV",
      "alternateName": "العرآب",
      "url": "https://github.com/100MillionDEV"
    },
    "screenshot": "https://wazeer.os/screenshots/desktop-wide.png",
    "featureList": [
      "AI Chat with Amoun",
      "Integrated Code Editor",
      "Task Management",
      "Memory System",
      "Multi-model Support",
      "PWA Install",
      "Bilingual AR/EN",
      "Dark Egyptian Cyberpunk Theme"
    ],
    "inLanguage": ["en", "ar"]
  }
  </script>
  
  <!-- Canonical & Hreflang -->
  <link rel="canonical" href="https://wazeer.os/" />
  <link rel="alternate" hreflang="en" href="https://wazeer.os/?lang=en" />
  <link rel="alternate" hreflang="ar" href="https://wazeer.os/?lang=ar" />
  <link rel="alternate" hreflang="x-default" href="https://wazeer.os/" />
  
  <!-- Preconnect for Performance -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preconnect" href="https://www.googleapis.com" />
  
  <!-- Font Loading -->
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet" />
</head>
```

### Meta Tag Rationale

| Tag | Purpose | SEO Impact |
|---|---|---|
| `og:title` | Social sharing title | High — controls preview on Facebook, LinkedIn, Discord |
| `og:description` | Social sharing description | High — 160 char summary |
| `og:image` | Social sharing image | Critical — 1200×630 branded image with 𓂀 |
| `twitter:card` | Twitter/X preview style | High — large image card |
| Structured data | Rich results in Google | Medium — WebApplication schema |
| `hreflang` | Language targeting | Medium — Arabic + English signals |
| Canonical | Duplicate content prevention | High — prevents self-cannibalization |
| `robots` | Crawl directives | High — explicitly allows indexing |

---

## Structured Data

### WebApplication Schema

The primary structured data uses the `WebApplication` type (see above in meta tags). This provides:

- **Rich snippet**: App name, description, category in search results
- **App rating**: Can be added post-launch with user reviews
- **Install prompt**: Browsers may surface the PWA install option in search
- **Feature list**: Enumerated capabilities for search understanding

### Additional Schema: SoftwareApplication (Fallback)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Wazeer OS",
  "applicationCategory": "ProductivityApplication",
  "operatingSystem": "Web Browser",
  "downloadUrl": "https://wazeer.os/",
  "fileSize": "5MB",
  "installURL": "https://wazeer.os/manifest.json"
}
```

### Organization Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "100MillionDEV",
  "alternateName": "العرآب",
  "url": "https://wazeer.os",
  "logo": "https://wazeer.os/icons/icon-512x512.png"
}
```

---

## Service Worker Caching Strategy

### Caching Strategy Overview

| Resource | Strategy | Max Age | Rationale |
|---|---|---|---|
| App shell (HTML) | Network First, Cache Fallback | No cache for index.html | Always serve latest version |
| JS bundles | Cache First, Network Fallback | 30 days | Content-hashed filenames |
| CSS bundles | Cache First, Network Fallback | 30 days | Content-hashed filenames |
| Fonts | Cache First, Network Fallback | 365 days | Fonts rarely change |
| Icons | Cache First, Network Fallback | 365 days | Static assets |
| Images (OG, screenshots) | Cache First, Network Fallback | 30 days | Static marketing assets |
| API responses | Network Only | No cache | Real-time data, never stale |
| Model API calls | Network Only | No cache | Real-time AI responses |

### Service Worker Implementation

```javascript
// sw.js — Service Worker for Wazeer OS

const CACHE_NAME = 'wazeer-os-v2.0.0';
const STATIC_CACHE = 'wazeer-static-v2.0.0';
const DYNAMIC_CACHE = 'wazeer-dynamic-v2.0.0';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Route-based strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // API calls: Network only
  if (url.pathname.startsWith('/api/')) {
    return;  // Let browser handle
  }
  
  // Static assets (hashed): Cache first
  if (url.pathname.match(/\.(js|css)$/) && url.pathname.includes('-')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }
  
  // Fonts: Cache first, long expiry
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetchAndCache(request, 365))
    );
    return;
  }
  
  // HTML: Network first, cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }
  
  // Default: Cache first, network fallback
  event.respondWith(
    caches.match(request).then((cached) => cached || fetchAndCache(request, 30))
  );
});
```

---

## Performance Optimization for SEO

### Core Web Vitals Targets

| Metric | Target | Current Estimate | Impact on SEO |
|---|---|---|---|
| **FCP** (First Contentful Paint) | < 1.8s | ~1.2s | Good — critical for engagement |
| **LCP** (Largest Contentful Paint) | < 2.5s | ~1.8s | Good — hero text + 𓂀 |
| **CLS** (Cumulative Layout Shift) | < 0.1 | ~0.02 | Excellent — font loading with swap |
| **FID** (First Input Delay) | < 100ms | ~50ms | Good — minimal main thread work |
| **INP** (Interaction to Next Paint) | < 200ms | ~150ms | Good — React 19 concurrent features |
| **TTFB** (Time to First Byte) | < 800ms | ~300ms | Good — Hostinger CDN |

### Optimization Techniques

#### 1. Font Loading

```css
/* Font display swap prevents FOIT (Flash of Invisible Text) */
@font-face {
  font-family: 'Space Grotesk';
  font-display: swap;
  /* ... */
}
```

#### 2. Critical CSS Inline

The most critical CSS (above-the-fold styles) should be inlined in `<head>`:

```html
<style>
  /* Critical: Background, layout, fonts */
  body { background: #050508; color: #f3f4f6; margin: 0; font-family: 'Inter', sans-serif; }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
</style>
```

#### 3. Image Optimization

- All icons in PNG (sharp edges at small sizes)
- OG image at 1200×630, compressed to < 200KB
- Screenshots at exact manifest sizes, WebP with PNG fallback
- Lazy load all below-fold images

#### 4. Bundle Splitting

```javascript
// Vite 6 code splitting configuration
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'framer-motion': ['framer-motion'],
          'editor': ['@monaco-editor/react'],
          'firebase': ['firebase/auth'],
          'genai': ['@google/genai'],
        },
      },
    },
  },
};
```

#### 5. Preloading

```html
<!-- Preload critical resources -->
<link rel="preload" href="/fonts/SpaceGrotesk-Bold.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/assets/index-[hash].js" as="script" />
```

### Lighthouse Score Targets

| Category | Target | Current |
|---|---|---|
| Performance | > 90 | ~88 (needs optimization) |
| Accessibility | > 90 | ~92 |
| Best Practices | > 90 | ~95 |
| SEO | > 90 | ~85 (needs structured data fix) |
| PWA | 100 | ~95 (needs offline fallback) |

---

## Landing Page SEO

### LandingPageView Content Strategy

The landing page is the primary indexable surface. It must contain:

#### H1 — Primary Keyword
```html
<h1>Wazeer OS — Your Personal AI Assistant</h1>
```

#### H2 — Feature Sections
```html
<h2>Chat with Amoun (أمون)</h2>
<h2>Integrated Code Editor</h2>
<h2>Smart Task Management</h2>
<h2>Multi-Model Support</h2>
<h2>Install Anywhere — PWA</h2>
```

#### Content Sections

| Section | Content | Keywords |
|---|---|---|
| Hero | App name, tagline, CTA | "Wazeer OS", "AI assistant", "PWA" |
| Features | 5 key features with icons | "chat", "code editor", "tasks", "LLM", "bilingual" |
| How it works | 3-step process | "AI assistant", "personal AI", "workspace" |
| Tech stack | Developer-focused section | "React", "PWA", "Gemini", "IndexedDB" |
| About | Brand story + developer credit | "Egyptian Cyberpunk", "100MillionDEV" |
| CTA | Install/get started button | "Install Wazeer OS", "Get Started" |
| Footer | Links, copyright | "Wazeer OS", "وزير OS" |

### Keyword Density Targets

| Keyword | Target Density | Placement |
|---|---|---|
| Wazeer OS | 3-5 mentions | Title, H1, body, footer, meta |
| AI assistant | 4-6 mentions | Title, description, features, body |
| PWA | 3-4 mentions | Description, features, tech section |
| Amoun | 2-3 mentions | Features section, about |
| Egyptian Cyberpunk | 1-2 mentions | About section |
| وزير OS | 1-2 mentions | Arabic section, footer |

---

## Arabic SEO Considerations

### Hreflang Implementation

```html
<!-- Primary language versions -->
<link rel="alternate" hreflang="en" href="https://wazeer.os/?lang=en" />
<link rel="alternate" hreflang="ar" href="https://wazeer.os/?lang=ar" />
<link rel="alternate" hreflang="x-default" href="https://wazeer.os/" />
```

### Arabic Meta Tags (When Language is Arabic)

```html
<!-- Dynamically set when Arabic is active -->
<html lang="ar" dir="rtl">
<title>وزير OS — مساعدك الشخصي بالذكاء الاصطناعي 𓂀</title>
<meta name="description" content="وزير OS — تطبيق ويب تقدمي (PWA) يعمل كمساعد ذكاء اصطناعي شخصي بواسطة أمون. محادثة، برمجة، وإدارة المهام بتصميم سايبربانك مصري." />
<meta property="og:title" content="وزير OS — مساعدك الشخصي بالذكاء الاصطناعي 𓂀" />
<meta property="og:description" content="وزير OS — تطبيق ويب تقدمي يعمل كمساعد ذكاء اصطناعي شخصي بواسطة أمون." />
```

### Arabic Content Guidelines

| Guideline | Implementation |
|---|---|
| Use proper Arabic text | No transliterated English masquerading as Arabic |
| Modern Standard Arabic | Avoid colloquial dialects in SEO content |
| Arabic punctuation | ، (comma), ؛ (semicolon), ؟ (question mark) |
| Proper line height | +0.1em extra for Arabic readability |
| Google Arabic algorithms | Use correct morphology — Arabic is root-based |

### Common Arabic SEO Mistakes

| ❌ Mistake | ✅ Correct |
|---|---|
| Mixing Arabic and Latin punctuation | Consistent Arabic punctuation |
| Keyword stuffing in Arabic | Natural Arabic sentence construction |
| Wrong RTL markup | `dir="rtl"` + `lang="ar"` on `<html>` |
| Missing Arabic meta description | Complete Arabic meta tags for Arabic page |
| Not using hreflang | Proper hreflang for language targeting |

---

## Monitoring & Metrics

### SEO Monitoring Checklist

| Tool | Purpose | Frequency |
|---|---|---|
| Google Search Console | Index status, crawl errors, performance | Weekly |
| Google PageSpeed Insights | Core Web Vitals scores | Monthly |
| Lighthouse CI | Automated performance checks | Every PR |
| Facebook Sharing Debugger | OG tag validation | After changes |
| Twitter Card Validator | Card preview validation | After changes |
| Schema.org Validator | Structured data validation | After changes |

### Pre-Launch SEO Checklist

- [ ] `index.html` has all meta tags (title, description, OG, Twitter)
- [ ] `manifest.json` is complete with all icon sizes
- [ ] Structured data validates without errors
- [ ] Hreflang tags point to correct language versions
- [ ] Canonical URL is set correctly
- [ ] `robots.txt` allows crawling of landing page
- [ ] `sitemap.xml` is generated (if applicable)
- [ ] OG image renders correctly on all platforms (Facebook, Twitter, LinkedIn, Discord)
- [ ] Lighthouse SEO score > 90
- [ ] Core Web Vitals pass (FCP < 1.8s, LCP < 2.5s, CLS < 0.1)
- [ ] Landing page has semantic HTML (h1, h2, sections)
- [ ] All images have alt text
- [ ] Service worker installed and passes Lighthouse PWA audit
- [ ] Font loading doesn't cause layout shift (CLS)
- [ ] Arabic version renders correctly in RTL

---

*Document 𓂀 Wazeer OS SEO Specification v2.0.0-Rewrite*  
*© 2025 100MillionDEV / العرآب — All Rights Reserved*
