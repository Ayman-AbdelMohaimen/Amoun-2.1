# 📋 Wazeer OS — Task Board

> **⭐ الخطة الموحدة انتقلت إلى: [`Plan-v2.2.md`](./Plan-v2.2.md)** — كل المهام المتبقية مدمجة هناك (Phases 1 → 1.5 → 2 → 3).
> الملف ده: سجل الإنجازات + المهام الفورية فقط.

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

## 🔜 الفوري القادم (من Plan-v2.2.md — Phase 1)
- [ ] ⚡ فاحص الموديلات + إصلاح Gemini النهائي → **Plan 1.1**
- [ ] 📦 Artifacts: تسمية احترافية + Full Width + تصدير/استيراد → **Plan 1.2**
- [ ] 👎😍 شبشب/قلوب + تعلم بالذاكرة → **Plan 1.3**
- [ ] ▶️ زر RUN على المهام → **Plan 1.4**

بعدها: **Phase 1.5 (الأمان)** → **Phase 2 (القدرات + الصلابة)** → **Phase 3 (التوسع)** — كل التفاصيل في الخطة.

---

## 📝 ملاحظات ثابتة
- Custom endpoints وCORS: Groq/OpenRouter ✓ · OpenAI ✗ من المتصفح
- GLM JWT client-side — risk مقبول في BYOK
- السيرفر tsx مش watch — restart يدوي بعد تعديل `src/server/`
- التحديثات الأمامية محتاجة Hard Refresh واحد (skipWaiting مفعّل في الـ SW)
