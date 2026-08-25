# Content Guidelines — Wazeer OS v2.0.0-Rewrite

> 𓂀 Wazeer OS (وزير OS) — Voice, Tone & Content Standards  
> Document Owner: Product & Content Team | Last Updated: 2025-01  
> Classification: Internal — All Teams

---

## Table of Contents

1. [Overview](#overview)
2. [Voice & Tone](#voice--tone)
3. [Naming Conventions](#naming-conventions)
4. [Arabic Typography Rules](#arabic-typography-rules)
5. [English Typography Rules](#english-typography-rules)
6. [UI Copy Standards](#ui-copy-standards)
7. [System Prompt Voice (Amoun)](#system-prompt-voice-amoun)
8. [Error Message Templates](#error-message-templates)
9. [Terminology Glossary](#terminology-glossary)
10. [Appendix: Bilingual Copy Reference](#appendix-bilingual-copy-reference)

---

## Overview

This document establishes the voice, tone, and content standards for all text within Wazeer OS — including UI labels, system messages, AI responses, error states, and documentation. Consistency in language builds trust; inconsistency creates confusion.

### Guiding Principles

1. **Professional yet warm** — We're building serious tools, but we're not cold
2. **Bilingual parity** — Arabic and English receive equal care; neither is an afterthought
3. **Clarity over cleverness** — Users should understand immediately, never guess
4. **Privacy-first language** — Never imply data leaves the device unless it does
5. **Cultural respect** — Egyptian identity is celebrated, never stereotyped

---

## Voice & Tone

### Voice (Constant — Who We Are)

The Wazeer OS voice is:

| Attribute | Description | Example |
|---|---|---|
| **Knowledgeable** | Confident in capabilities without arrogance | "Wazeer OS manages your AI workspace" |
| **Efficient** | Values the user's time, minimal words | "3 tasks completed" not "I have successfully completed three tasks for you" |
| **Bilingual** | Equally comfortable in Arabic and English | Seamless switching based on user preference |
| **Private** | Never promises what it can't guarantee | "Your data stays on your device" |
| **Warm** | Human, not robotic | "Welcome back" not "User session restored" |

### Tone (Variable — How We Adapt)

| Context | Tone | Shift |
|---|---|---|
| **Onboarding** | Encouraging, guiding | Friendly explanations, no jargon |
| **Error states** | Calm, helpful | Clear problem statement + actionable fix |
| **Success states** | Brief celebration | "Done" or "✓ Task completed" — not paragraphs of praise |
| **Settings** | Neutral, precise | Technical terms where appropriate |
| **AI responses (Amoun)** | Wise, efficient | Full personality — see AI-INSTRUCTIONS.md |
| **Empty states** | Gentle nudge | Suggest next action without judgment |
| **Destructive actions** | Serious, clear | Explicit warning, no sugar-coating |

### Tone Spectrum

```
Casual ◄————————————————————————————► Formal
                                          ↑ Wazeer OS sits here
Warm ◄————————————————————————————► Cold
↑                                     
Wazeer OS
```

---

## Naming Conventions

### Brand Names — STRICT RULES

| ✅ Correct | ❌ Incorrect | Note |
|---|---|---|
| Wazeer OS | WazeerOS, Wazeer, wazeer-os | Always "Wazeer OS" with space and caps |
| وزير OS | وزير, الوزير, wazeer | Always "وزير OS" — Arabic name + Latin "OS" |
| Amoun | Amoun OS, Zomra, أمون OS | Never append "OS" to agent name |
| أمون | Amun, Amon | Use Amoun (English) or أمون (Arabic) only |
| 𓂀 Eye of Horus | Eye logo, Horus eye | Symbol only, never as "logo icon" |
| 100MillionDEV | 100milliondev, 100MDev | Exact case |
| العرآب | العرب, Al-Arab | Exact spelling with hamza |

### Feature Names

| English | Arabic | Notes |
|---|---|---|
| HomeView | الرئيسية | Dashboard / home screen |
| AmounEditor | محرر أمون | Code + chat split pane |
| LlmDashboard | لوحة التحكم | Analytics dashboard |
| Settings | الإعدادات | User configuration |
| Templates | القوالب | Pre-built prompts |
| Kings Tools | أدوات الملك | Admin/superuser tools |
| History | السجل | Chat & action history |
| Swarm | سرب | Multi-agent coordination |
| HorusGuard | حورس جارد | Security scanner (7orus agent) |
| ArtifactPanel | لوحة المخرجات | Generated artifacts preview |
| Command Palette | لوحة الأوامر | Cmd+K quick actions |

### Naming Rules

1. **English names use PascalCase** in code references (e.g., `HomeView`, `AmounEditor`)
2. **Arabic names are proper nouns** — capitalize first letter in UI
3. **Agent names are never localized** — "Amoun" stays "Amoun" in both languages
4. **View names match component names** — `SettingsView` → "Settings" in UI
5. **Never invent names** — if a feature doesn't have an established name, propose one in design review

---

## Arabic Typography Rules

### Font Selection

- **Primary**: IBM Plex Sans Arabic (Google Fonts)
- **Display**: IBM Plex Sans Arabic Bold for headings
- **Monospace**: JetBrains Mono for code (Latin only; Arabic code is transliterated)

### Direction

- All Arabic content uses `dir="rtl"` on the containing element
- The `<html>` element switches direction when Arabic is the active language
- `dir` attribute is managed by `useI18nStore` and applied globally

### Line Height

| Context | Arabic Line Height | English Line Height | Reason |
|---|---|---|---|
| Display (headings) | 1.5 | 1.1–1.3 | Arabic needs more vertical space |
| Body text | 1.8 | 1.6 | Arabic descenders need room |
| Captions | 1.6 | 1.5 | Small text still needs breathing room |
| UI labels | 1.5 | 1.3 | Compact Arabic labels |

### Letter Spacing

- **Never apply negative letter-spacing to Arabic text** — Arabic ligatures break with tracking adjustments
- Default `letter-spacing: 0` for all Arabic content
- If emphasis needed, use font-weight increase instead

### Text Alignment

| Context | AR Alignment | EN Alignment |
|---|---|---|
| Body text | `text-right` | `text-left` |
| Headings | `text-right` | `text-left` |
| Numbers (standalone) | `text-left` (Latin digits) | `text-left` |
| Mixed content | Respects `dir` | Respects `dir` |
| Centered content | `text-center` (both) | `text-center` (both) |

### Number Formatting

| Context | Format | Example |
|---|---|---|
| Pure Arabic text | Arabic-Indic digits | ٠١٢٣٤٥٦٧٨٩ |
| Technical context | Western digits | 0123456789 |
| Mixed UI | Western digits (default) | 3 tasks, 100% |
| Currency | Localized | ٥٠٠ ج.م or EGP 500 |

### Punctuation

- Arabic text uses Arabic punctuation: ، (comma) ؛ (semicolon) ؟ (question mark) «» (quotes) — not Latin equivalents
- Code blocks within Arabic content always use Latin punctuation
- Lists in Arabic: RTL bullet rendering handled by CSS `direction`

### Common Arabic Mistakes to Avoid

| ❌ Wrong | ✅ Correct | Note |
|---|---|---|
| مسجل الدخول | تم تسجيل الدخول | Use verbal nouns (مصدر) |
| ١٠٠ | 100 | Technical UI uses Western digits |
| كلمة السر | كلمة المرور | Modern standard Arabic |
| صفحة الانترنت | الصفحة الرئيسية | Descriptive, not transliterated |

---

## English Typography Rules

### Font Selection

- **Display**: Space Grotesk (headings, hero text)
- **Body**: Inter (all body text, UI labels)
- **Mono**: JetBrains Mono (code, terminal, technical data)

### Line Height

| Context | Line Height |
|---|---|
| Display headings | 1.1–1.3 |
| Body text | 1.6 |
| Captions | 1.5 |
| UI labels | 1.3 |
| Code | 1.7 |

### Capitalization Rules

| Context | Style | Example |
|---|---|---|
| Headings | Title Case | "Model Management" |
| Button labels | Sentence case | "Add model" not "Add Model" |
| Navigation items | Title Case | "Settings", "History" |
| Status messages | Sentence case | "Connection established" |
| Tooltips | Sentence case | "Switch to Arabic" |
| Error messages | Sentence case | "Failed to save settings" |
| Brand names | As written | "Wazeer OS", "Amoun" |
| Section titles | Title Case | "Color Tokens", "Theme Presets" |

### Punctuation

- No periods in button labels, nav items, or headings
- Periods in body text, descriptions, and error messages
- Question marks in confirmation dialogs: "Delete this task?"
- Exclamation marks: use sparingly, only in success celebrations: "Task completed!"

---

## UI Copy Standards

### Button Labels

| Action | EN | AR |
|---|---|---|
| Confirm | Save | حفظ |
| Destructive | Delete | حذف |
| Cancel | Cancel | إلغاء |
| Continue | Continue | متابعة |
| Skip | Skip | تخطي |
| Close | Close | إغلاق |
| Add new | Add model | إضافة نموذج |
| Search | Search | بحث |
| Copy | Copy | نسخ |
| Download | Download | تحميل |
| Retry | Retry | إعادة المحاولة |
| Learn more | Learn more | معرفة المزيد |
| Get started | Get started | ابدأ الآن |
| Sign in | Sign in | تسجيل الدخول |
| Sign out | Sign out | تسجيل الخروج |

### Error Messages

Format: `[What happened] — [What to do]`

| Scenario | EN | AR |
|---|---|---|
| Network error | "Connection lost — check your internet and try again" | "فُقد الاتصال — تحقق من الإنترنت وحاول مجدداً" |
| API key invalid | "API key is invalid — update it in Settings" | "مفتاح API غير صالح — حدّثه في الإعدادات" |
| Rate limited | "Rate limit reached — wait 60 seconds or switch models" | "تم تجاوز حد الطلبات — انتظر ٦٠ ثانية أو بدّل النموذج" |
| Save failed | "Could not save — try again" | "لم يتم الحفظ — حاول مجدداً" |
| Model timeout | "Response timed out — try again or use a different model" | "انتهت مهلة الاستجابة — حاول مجدداً أو استخدم نموذجاً مختلفاً" |
| Generic | "Something went wrong — please try again" | "حدث خطأ ما — يرجى المحاولة مجدداً" |

### Empty States

Format: `[Encouraging statement] + [Action suggestion]`

| View | EN | AR |
|---|---|---|
| Chat (no messages) | "Start a conversation with Amoun" | "ابدأ محادثة مع أمون" |
| History (no history) | "No conversations yet" | "لا توجد محادثات بعد" |
| Tasks (no tasks) | "No pending tasks — all clear 𓂀" | "لا مهام معلقة — كل شيء جاهز 𓂀" |
| Models (none added) | "Add your first AI model to get started" | "أضف أول نموذج ذكاء اصطناعي للبدء" |
| Dashboard (no data) | "Start using Wazeer OS to see your analytics" | "ابدأ استخدام وزير OS لمشاهدة تحليلاتك" |
| Projects (none) | "Create your first project" | "أنشئ مشروعك الأول" |

### Tooltips

| Element | EN | AR |
|---|---|---|
| Model selector | "Choose AI model" | "اختر نموذج الذكاء الاصطناعي" |
| Voice toggle | "Toggle voice input" | "تفعيل الإدخال الصوتي" |
| Language toggle | "Switch language" | "تبديل اللغة" |
| Sidebar toggle | "Toggle sidebar" | "إظهار/إخفاء الشريط الجانبي" |
| Code copy | "Copy to clipboard" | "نسخ إلى الحافظة" |
| New chat | "Start new conversation" | "بدء محادثة جديدة" |
| Install PWA | "Install Wazeer OS" | "تثبيت وزير OS" |

### Confirmation Dialogs

Format: `[Question]?` + [Cancel] + [Confirm]

| Action | EN | AR |
|---|---|---|
| Delete task | "Delete this task? This cannot be undone." | "حذف هذه المهمة؟ لا يمكن التراجع عن هذا." |
| Clear history | "Clear all conversation history?" | "مسح كل سجل المحادثات؟" |
| Remove model | "Remove this model? Existing chats may lose context." | "إزالة هذا النموذج؟ قد تفقد المحادثات الحالية سياقها." |
| Reset settings | "Reset all settings to defaults?" | "إعادة تعيين جميع الإعدادات؟" |
| Sign out | "Sign out of Wazeer OS?" | "تسجيل الخروج من وزير OS؟" |

---

## System Prompt Voice (Amoun)

### Personality Definition

Amoun (أمون) speaks with these qualities:

1. **Wise but concise** — Answers fully but never pads with filler words
2. **Bilingual** — Responds in the language the user writes in
3. **Helpful without overstepping** — Offers suggestions, doesn't insist
4. **Transparent about limitations** — "I don't have access to live internet data"
5. **Privacy-respecting** — Never asks for unnecessary personal information
6. **Task-aware** — Proactively extracts tasks and memories from conversation

### Response Patterns

| Situation | Pattern | Example |
|---|---|---|
| Greeting | Brief + offer help | "Hello! How can I help you today?" / "مرحباً! كيف يمكنني مساعدتك؟" |
| Complex question | Structured answer | Numbered sections, clear headings |
| Code request | Code + explanation | "Here's the implementation:" + code block + "This works because..." |
| Task detected | Answer + task extraction | "I'll help with that. I've also created a task to track your progress." |
| Unclear request | Clarifying question | "Could you provide more details about what you'd like me to do?" |
| Error encountered | Apology + explanation + retry | "I encountered an issue. Let me try a different approach." |
| Outside capability | Honest limitation | "I can't do that directly, but here's an alternative..." |

### Language Rules for Amoun

1. **Match the user's language** — If user writes in Arabic, respond in Arabic
2. **Mixed language** — If user mixes AR/EN, match the dominant language
3. **Technical terms** — Keep English for code, API names, technical specs even in Arabic responses
4. **Arabic script quality** — Use proper Modern Standard Arabic (اللغة العربية الفصحى), not dialect
5. **Egyptian identity** — Occasional cultural warmth: "بحب الخير" (with pleasure) is acceptable in casual chat

### What Amoun Never Says

- ❌ "I am an AI language model trained by..." — No robotic disclaimers
- ❌ "As a large language model..." — No meta-references
- ❌ "I think you should consider..." — Overly hedging
- ❌ Any response exceeding 800 words without structure — Keep it readable
- ❌ Political, religious, or controversial opinions — Stay neutral

---

## Error Message Templates

### Template Format

```
[Error Title]: [Brief Description] — [Recovery Action]
```

### Sanitization Rules

1. **Never expose stack traces** to users — log internally, show friendly message
2. **Never expose API keys** in error messages — mask with `[REDACTED]`
3. **Never expose internal paths** — use generic "internal error" instead
4. **Never blame the user** — "Something went wrong" not "You entered invalid data"
5. **Always provide a recovery action** — every error message includes a "what to do"

### Error Categories & Templates

#### Network Errors

```typescript
// Template
const networkError = (action: string) => ({
  title: t('errors.network.title'),  // "Connection Error"
  message: t('errors.network.message', { action }),  // "Could not ${action} — check your internet connection"
  action: t('errors.network.retry'),  // "Retry"
});
```

#### Validation Errors

```typescript
// Template  
const validationError = (field: string, requirement: string) => ({
  title: t('errors.validation.title'),  // "Invalid Input"
  message: t('errors.validation.message', { field, requirement }),  // "${field} must be ${requirement}"
  action: t('errors.validation.fix'),  // "Fix"
});
```

#### API Errors

```typescript
// Template
const apiError = (statusCode: number) => {
  const messages: Record<number, string> = {
    401: 'errors.api.unauthorized',    // "Authentication required — sign in again"
    403: 'errors.api.forbidden',       // "You don't have permission for this action"
    429: 'errors.api.rateLimited',      // "Too many requests — wait a moment"
    500: 'errors.api.server',           // "Server error — try again later"
    503: 'errors.api.unavailable',      // "Service unavailable — try again later"
  };
  return messages[statusCode] || 'errors.api.unknown';  // "Something went wrong"
};
```

#### Model Errors

```typescript
// Template
const modelError = (model: string) => ({
  title: t('errors.model.title'),  // "Model Error"
  message: t('errors.model.message', { model }),  // "${model} encountered an issue"
  action: t('errors.model.switch'),  // "Switch Model"
});
```

### Toast Notification Messages

| Event | EN Toast | AR Toast |
|---|---|---|
| Message sent | "Message sent" | "تم إرسال الرسالة" |
| Message received | "Amoun responded" | "ردّ أمون" |
| Task created | "Task added: {title}" | "تمت إضافة مهمة: {title}" |
| Task completed | "Task completed 𓂀" | "تم إنجاز المهمة 𓂀" |
| Memory saved | "Memory saved" | "تم حفظ الذاكرة" |
| Settings saved | "Settings saved" | "تم حفظ الإعدادات" |
| Model switched | "Switched to {model}" | "تم التبديل إلى {model}" |
| Copied to clipboard | "Copied!" | "تم النسخ!" |
| PWA installed | "Wazeer OS installed 𓂀" | "تم تثبيت وزير OS 𓂀" |

---

## Terminology Glossary

### Arabic-English Technical Terms

| Arabic | English | Context |
|---|---|---|
| وزير | Wazeer (Minister/Vizier) | App name (وزير OS) |
| أمون | Amoun | AI agent name |
| عين حورس | Eye of Horus | Brand symbol (𓂀) |
| الذكاء الاصطناعي | Artificial Intelligence | AI |
| النموذج | Model | LLM model (Gemini, GPT, etc.) |
| المحادثة | Conversation/Chat | Chat interface |
| المهمة | Task | Actionable items extracted from chat |
| الذاكرة | Memory | Extracted context stored by Amoun |
| السجل | History | Conversation history |
| لوحة التحكم | Dashboard | Analytics dashboard |
| المحرر | Editor | Code editor |
| القوالب | Templates | Pre-built prompts |
| الإعدادات | Settings | User configuration |
| سرب | Swarm | Multi-agent system |
| حورس جارد | HorusGuard | Security scanning system |
| مفتاح البرمجة | API Key | Authentication key for LLM APIs |
| الرموز المميزة | Tokens | LLM token usage |
| الاستجابة | Response | AI reply |
| الطرح | Prompt | User input to AI |

### Brand-Specific Terms

| Term | Meaning | Usage |
|---|---|---|
| Wazeer OS | The product name | UI, docs, code |
| وزير OS | Arabic product name | Arabic UI, Arabic docs |
| Amoun | The AI agent | UI, docs, code |
| أمون | Arabic agent name | Arabic UI |
| 𓂀 | Eye of Horus symbol | Logo, branding, decorative |
| Eye of Horus | Full English name | Documentation only |
| عين حورس | Full Arabic name | Arabic documentation |
| Egyptian Cyberpunk | Design aesthetic | Design docs, marketing |
| العرآب | Developer alias | Credits, about page |
| 100MillionDEV | Developer handle | Credits, about page |
| HorusGuard | Security scanner (agent: 7orus) | Tech docs, security |
| حورس جارد | Arabic HorusGuard name | Arabic UI |

---

## Appendix: Bilingual Copy Reference

### Complete HomeView Labels

| Element | English | Arabic |
|---|---|---|
| Greeting | "Welcome back, {name}" | "مرحباً بعودتك، {name}" |
| Status: Model | "Model: {name}" | "النموذج: {name}" |
| Status: Session | "Session active" | "الجلسة نشطة" |
| Status: Swarm | "Swarm: {count} agents" | "السرب: {count} وكلاء" |
| Tasks HUD title | "Tasks" | "المهام" |
| Tasks empty | "No pending tasks" | "لا مهام معلقة" |
| Goals HUD title | "Goals" | "الأهداف" |
| ChatInput placeholder | "Ask Amoun anything..." | "اسأل أمون أي شيء..." |
| Metrics: Operations | "Total Operations" | "إجمالي العمليات" |
| Metrics: Tokens | "Tokens Processed" | "الرموز المُعالجة" |
| Metrics: Errors | "Error Rate" | "معدل الأخطاء" |

### Complete Settings Labels

| Section | English | Arabic |
|---|---|---|
| Model Management | "Model Management" | "إدارة النماذج" |
| Add Model | "Add Model" | "إضافة نموذج" |
| Theme | "Theme" | "المظهر" |
| Language | "Language" | "اللغة" |
| Arabic | "العربية" | "العربية" |
| English | "English" | "English" |
| Data Management | "Data Management" | "إدارة البيانات" |
| Export Data | "Export Data" | "تصدير البيانات" |
| Import Data | "Import Data" | "استيراد البيانات" |
| Clear Data | "Clear All Data" | "مسح جميع البيانات" |
| About | "About" | "حول" |
| Version | "Version {version}" | "الإصدار {version}" |
| Developer | "Developed by 100MillionDEV / العرآب" | "تطوير 100MillionDEV / العرآب" |

### Complete Auth Labels

| Element | English | Arabic |
|---|---|---|
| Sign in title | "Sign in to Wazeer OS" | "تسجيل الدخول إلى وزير OS" |
| Email | "Email" | "البريد الإلكتروني" |
| Password | "Password" | "كلمة المرور" |
| Sign in button | "Sign In" | "تسجيل الدخول" |
| Sign up button | "Create Account" | "إنشاء حساب" |
| Forgot password | "Forgot password?" | "نسيت كلمة المرور؟" |
| Sign in with Google | "Continue with Google" | "المتابعة مع Google" |
| Or separator | "or" | "أو" |

---

*Document 𓂀 Wazeer OS Content Guidelines v2.0.0-Rewrite*  
*© 2025 100MillionDEV / العرآب — All Rights Reserved*
