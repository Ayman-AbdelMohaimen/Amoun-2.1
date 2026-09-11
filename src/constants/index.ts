/**
 * Wazeer OS v2.0 — Application Constants
 * Single source of truth for all static configuration.
 */

import type { AgentState, ChatMode, PromptTemplate, ProviderConfig, ThemePreset, ViewType } from '../types';

// ═══════════════════════════════════════════════════════════════════
// APP META
// ═══════════════════════════════════════════════════════════════════

export const APP_NAME = 'Wazeer OS';
export const APP_NAME_AR = 'وزير OS';
export const APP_VERSION = '2.0.0';
export const AGENT_NAME = 'Amoun';
export const AGENT_NAME_AR = 'أمون';
export const LOGO_GLYPH = '𓂀';
export const FOOTER_TEXT = `صُنع بـ ❤️ بواسطة العرآب | حقوق النشر 100MillionDEV.com`;
export const ADMIN_EMAILS = [
  'hello.simple.ai@gmail.com',
  'ayman.abdelmohsen@gmail.com',
];

// ═══════════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════════

export interface NavItem {
  id: ViewType;
  labelAr: string;
  labelEn: string;
  icon: string;
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', labelAr: 'الرئيسية', labelEn: 'Home', icon: 'Home' },
  { id: 'workspace', labelAr: 'مساحة العمل', labelEn: 'Workspace', icon: 'Code' },
  { id: 'projects', labelAr: 'المشاريع', labelEn: 'Projects', icon: 'FolderKanban' },
  { id: 'agents', labelAr: 'الوكلاء', labelEn: 'Agents', icon: 'Bot' },
  { id: 'skills', labelAr: 'المهارات', labelEn: 'Skills', icon: 'Sparkles' },
  { id: 'integrated', labelAr: 'الربط', labelEn: 'Integrations', icon: 'Plug' },
  { id: 'reports', labelAr: 'التقارير', labelEn: 'Reports & Insights', icon: 'BarChart3' },
  { id: 'templates', labelAr: 'القوالب', labelEn: 'Templates', icon: 'LayoutTemplate' },
  { id: 'history', labelAr: 'السجل', labelEn: 'History', icon: 'Clock' },
  { id: 'settings', labelAr: 'الإعدادات', labelEn: 'Settings', icon: 'Settings' },
  { id: 'admin', labelAr: 'المدير', labelEn: 'Admin', icon: 'Shield', adminOnly: true },
  { id: 'about', labelAr: 'عن المشروع', labelEn: 'About', icon: 'Info' },
];

// ═══════════════════════════════════════════════════════════════════
// CHAT MODES
// ═══════════════════════════════════════════════════════════════════

export const CHAT_MODES: { id: ChatMode; labelAr: string; labelEn: string; icon: string; systemPrefix: string }[] = [
  {
    id: 'minister',
    labelAr: 'الوزير',
    labelEn: 'Minister',
    icon: '👑',
    systemPrefix: '', // The BASE_SYSTEM_PROMPT already IS the minister prompt. Empty prefix = full minister mode.
  },
  {
    id: 'coding',
    labelAr: 'برمجة',
    labelEn: 'Coding',
    icon: '💻',
    systemPrefix: 'أنت أمون في وضع البرمجة. قدّم كوداً نظيفاً مع تعليقات. اشرح نهجك. اتبع مبادئ Green Code. استخرج المهام البرمجية المطلوبة.',
  },
  {
    id: 'research',
    labelAr: 'بحث علمي',
    labelEn: 'Research',
    icon: '🔬',
    systemPrefix: 'أنت أمون في وضع البحث العلمي. ادقق المصادر، استشهد بدقة، وفرّق بين الحقائق والفرضيات. نظّم الخطوات البحثية كمهام متابعة.',
  },
  {
    id: 'education',
    labelAr: 'تعليم',
    labelEn: 'Education',
    icon: '🎓',
    systemPrefix: 'أنت أمون في وضع التعليم. اشرح خطوة بخطوة بأمثلة متدرجة، وتحقق من الفهم بأسئلة قصيرة. حوّل نقاط التعلم إلى مهام مراجعة.',
  },
];

// ═══════════════════════════════════════════════════════════════════
// THEME PRESETS
// ═══════════════════════════════════════════════════════════════════

export const THEME_PRESETS: Record<ThemePreset, { accent300: string; accent400: string; accent500: string; accent600: string; glow: string }> = {
  emerald: {
    accent300: '#5eead4', accent400: '#2dd4bf', accent500: '#14b8a6', accent600: '#0d9488',
    glow: 'rgba(45,212,191,0.15)',
  },
  'cyber-blue': {
    accent300: '#93c5fd', accent400: '#60a5fa', accent500: '#3b82f6', accent600: '#2563eb',
    glow: 'rgba(59,130,246,0.15)',
  },
  crimson: {
    accent300: '#fca5a5', accent400: '#f87171', accent500: '#ef4444', accent600: '#dc2626',
    glow: 'rgba(239,68,68,0.15)',
  },
  purple: {
    accent300: '#c4b5fd', accent400: '#a78bfa', accent500: '#8b5cf6', accent600: '#7c3aed',
    glow: 'rgba(139,92,246,0.15)',
  },
  custom: {
    accent300: '', accent400: '', accent500: '', accent600: '',
    glow: '',
  },
};

// ═══════════════════════════════════════════════════════════════════
// PROVIDER REGISTRY
// ═══════════════════════════════════════════════════════════════════

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'gemini', displayName: 'Google Gemini', target: '', authHeader: 'x-goog-api-key', pathPrefix: '',
    models: [
      // gemini-2.5-flash was retired by Google for new keys (404 "no longer available") — 3.6 is the successor
      { id: 'gemini-3.6-flash', providerId: 'gemini', displayName: 'Gemini 3.6 Flash', modelId: 'gemini-3.6-flash',
        capabilities: { vision: true, streaming: true, tools: true, grounding: true, maxTokens: 65536 }, pricing: { input: 0, output: 0 } },
      { id: 'gemini-3.5-flash', providerId: 'gemini', displayName: 'Gemini 3.5 Flash', modelId: 'gemini-3.5-flash',
        capabilities: { vision: true, streaming: true, tools: true, grounding: true, maxTokens: 65536 }, pricing: { input: 0, output: 0 } },
    ],
  },
  {
    id: 'claude', displayName: 'Anthropic Claude', target: 'https://api.anthropic.com', authHeader: 'x-api-key', pathPrefix: '/v1/messages',
    models: [
      { id: 'claude-3.5', providerId: 'claude', displayName: 'Claude 3.5', modelId: 'claude-3-5-sonnet-20241022',
        capabilities: { vision: true, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 3, output: 15 } },
    ],
  },
  {
    id: 'glm', displayName: 'Zhipu GLM (Direct)', target: 'https://open.bigmodel.cn', authHeader: 'Authorization', pathPrefix: '/api/paas/v4/chat/completions',
    models: [
      { id: 'glm-4-flash', providerId: 'glm', displayName: 'GLM-4 Flash (Direct)', modelId: 'glm-4-flash',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
    ],
  },
  {
    id: 'nvidia', displayName: 'NVIDIA NIM', target: 'https://integrate.api.nvidia.com', authHeader: 'Authorization', pathPrefix: '/v1/chat/completions',
    models: [
      { id: 'deepseek-v4-flash', providerId: 'nvidia', displayName: '⚡ DeepSeek V4 Flash', modelId: 'deepseek-ai/deepseek-v4-flash',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
      { id: 'deepseek-v4-pro', providerId: 'nvidia', displayName: '⚡ DeepSeek V4 Pro', modelId: 'deepseek-ai/deepseek-v4-pro',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
      { id: 'glm-5.2-nvidia', providerId: 'nvidia', displayName: '⚡ GLM-5.2 (Z.ai)', modelId: 'z-ai/glm-5.2',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
      { id: 'minimax-m3', providerId: 'nvidia', displayName: '👁️ Minimax M3 (VLM)', modelId: 'minimaxai/minimax-m3',
        capabilities: { vision: true, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
      { id: 'minimax-m2.7', providerId: 'nvidia', displayName: '⚡ Minimax M2.7', modelId: 'minimaxai/minimax-m2.7',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
      { id: 'step-3.7-flash', providerId: 'nvidia', displayName: '👁️ Step 3.7 Flash (VLM)', modelId: 'stepfun-ai/step-3.7-flash',
        capabilities: { vision: true, streaming: true, tools: false, grounding: false, maxTokens: 262144 }, pricing: { input: 0, output: 0 } },
      { id: 'step-3.5-flash', providerId: 'nvidia', displayName: '⚡ Step 3.5 Flash', modelId: 'stepfun-ai/step-3.5-flash',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 262144 }, pricing: { input: 0, output: 0 } },
      { id: 'mistral-medium-3.5', providerId: 'nvidia', displayName: '⚡ Mistral Medium 3.5 128B', modelId: 'mistralai/mistral-medium-3.5-128b',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
      { id: 'nemotron-3-ultra', providerId: 'nvidia', displayName: '🧠 Nemotron 3 Ultra 550B', modelId: 'nvidia/nemotron-3-ultra-550b-a55b',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 1048576 }, pricing: { input: 0, output: 0 } },
      { id: 'gpt-oss-20b', providerId: 'nvidia', displayName: '⚡ GPT-OSS 20B', modelId: 'openai/gpt-oss-20b',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
      { id: 'gpt-oss-120b', providerId: 'nvidia', displayName: '🧠 GPT-OSS 120B', modelId: 'openai/gpt-oss-120b',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
      { id: 'kimi-k2.6', providerId: 'nvidia', displayName: '👁️ Kimi K2.6 (1T MoE)', modelId: 'moonshotai/kimi-k2.6',
        capabilities: { vision: true, streaming: true, tools: true, grounding: false, maxTokens: 262144 }, pricing: { input: 0, output: 0 } },
      { id: 'cosmos3-reasoner', providerId: 'nvidia', displayName: '👁️ Cosmos3 Reasoner', modelId: 'nvidia/cosmos3-reasoner',
        capabilities: { vision: true, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
    ],
  },
  {
    id: 'openrouter', displayName: 'OpenRouter', target: 'https://openrouter.ai/api', authHeader: 'Authorization', pathPrefix: '/v1/chat/completions',
    models: [
      { id: 'openrouter-auto', providerId: 'openrouter', displayName: 'OpenRouter Auto', modelId: 'openrouter/auto',
        capabilities: { vision: true, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
      { id: 'or-glm-5.2', providerId: 'openrouter', displayName: '⚡ GLM-5.2 (OpenRouter)', modelId: 'z-ai/glm-5.2:free',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
      { id: 'or-ox-alpha', providerId: 'openrouter', displayName: '👑 OX Alpha (Stealth)', modelId: 'stealth/ox-alpha',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
      { id: 'or-laguna-s', providerId: 'openrouter', displayName: '⚡ Laguna S 2.1', modelId: 'poolside/laguna-s-2.1:free',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
      { id: 'or-laguna-xs', providerId: 'openrouter', displayName: '⚡ Laguna XS 2.1', modelId: 'poolside/laguna-xs-2.1:free',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
      { id: 'or-nemotron-3.5-lightning', providerId: 'openrouter', displayName: '⚡ Nemotron 3.5 Lightning 30B', modelId: 'nvidia/nemotron-3.5-lightning:free',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
      { id: 'or-nemotron-3-super', providerId: 'openrouter', displayName: '🧠 Nemotron 3 Super 120B', modelId: 'nvidia/nemotron-3-super-120b-a12b:free',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
      { id: 'or-nemotron-3-ultra', providerId: 'openrouter', displayName: '🧠 Nemotron 3 Ultra 550B', modelId: 'nvidia/nemotron-3-ultra-550b-a55b:free',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 1048576 }, pricing: { input: 0, output: 0 } },
    ],
  },
  {
    id: 'groq', displayName: 'Groq', target: 'https://api.groq.com', authHeader: 'Authorization', pathPrefix: '/openai/v1/chat/completions',
    models: [
      // Keys: https://console.groq.com/keys — ultra-fast free inference
      { id: 'groq-llama-3.3-70b', providerId: 'groq', displayName: '⚡ Llama 3.3 70B (Groq)', modelId: 'llama-3.3-70b-versatile',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
      { id: 'groq-llama-3.1-8b', providerId: 'groq', displayName: '⚡ Llama 3.1 8B Instant (Groq)', modelId: 'llama-3.1-8b-instant',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
      { id: 'groq-gpt-oss-120b', providerId: 'groq', displayName: '🧠 GPT-OSS 120B (Groq)', modelId: 'openai/gpt-oss-120b',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
      { id: 'groq-gpt-oss-20b', providerId: 'groq', displayName: '⚡ GPT-OSS 20B (Groq)', modelId: 'openai/gpt-oss-20b',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0, output: 0 } },
    ],
  },
  {
    id: 'deepseek', displayName: 'DeepSeek', target: 'https://api.deepseek.com', authHeader: 'Authorization', pathPrefix: '/v1/chat/completions',
    models: [
      { id: 'deepseek-chat', providerId: 'deepseek', displayName: 'DeepSeek Chat', modelId: 'deepseek-chat',
        capabilities: { vision: false, streaming: true, tools: false, grounding: false, maxTokens: 8192 }, pricing: { input: 0.14, output: 0.28 } },
    ],
  },
  {
    id: 'openai', displayName: 'OpenAI', target: 'https://api.openai.com', authHeader: 'Authorization', pathPrefix: '/v1/chat/completions',
    models: [
      { id: 'gpt-4o-mini', providerId: 'openai', displayName: 'GPT-4o Mini', modelId: 'gpt-4o-mini',
        capabilities: { vision: true, streaming: true, tools: true, grounding: false, maxTokens: 16384 }, pricing: { input: 0.15, output: 0.6 } },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
// DEFAULT AGENTS
// ═══════════════════════════════════════════════════════════════════

export const DEFAULT_AGENTS: AgentState[] = [
  {
    id: 'amoun', displayName: 'أمون', description: 'The King — Primary AI agent',
    status: 'idle', retryCount: 0, maxRetries: 3, lastActivity: '',
    tokensUsed: 0, tasksCompleted: 0, capabilities: ['chat', 'code', 'research', 'scheduling'],
  },
  {
    // تحوت — Egyptian god of wisdom & writing (replaces the Greek "Hermes")
    id: 'hermes', displayName: 'تحوت', description: 'The Scribe — Coding specialist',
    status: 'idle', retryCount: 0, maxRetries: 3, lastActivity: '',
    tokensUsed: 0, tasksCompleted: 0, capabilities: ['code'],
  },
  {
    id: '7orus', displayName: 'حورس', description: 'The Guardian — Security scanner',
    status: 'idle', retryCount: 0, maxRetries: 3, lastActivity: '',
    tokensUsed: 0, tasksCompleted: 0, capabilities: ['security'],
  },
];

// ═══════════════════════════════════════════════════════════════════
// QUICK ACTIONS (Command Center hero presets)
// ═══════════════════════════════════════════════════════════════════

export const QUICK_ACTIONS: Array<{ id: string; icon: string; titleAr: string; titleEn: string; descAr: string; descEn: string; promptAr: string; promptEn: string }> = [
  {
    id: 'data', icon: '📊',
    titleAr: 'تحليل بيانات', titleEn: 'Data Analysis',
    descAr: 'استخراج زرى وتقارير دقيقة', descEn: 'Insights and precise reports',
    promptAr: 'ساعدني في تحليل بيانات: هوصفلك البيانات أو أرفع ملف، وأنت تطلع لي رؤى مهمة وتقرير منظم برسم بياني عند الحاجة.',
    promptEn: 'Help me analyze data: I will describe it or upload a file, and you produce key insights and a structured report.',
  },
  {
    id: 'app', icon: '</>',
    titleAr: 'بناء تطبيق', titleEn: 'Build an App',
    descAr: 'تطبيقات كاملة بدون كود', descEn: 'Full apps without writing code',
    promptAr: 'عايز أبني تطبيق/صفحة ويب. هوصفلك الفكرة وأنت تكتب الكود كامل جاهز للتشغيل كسجل برديات منظمة.',
    promptEn: 'I want to build an app/web page. I will describe the idea and you deliver complete runnable code as organized artifacts.',
  },
  {
    id: 'content', icon: '✍️',
    titleAr: 'إنشاء محتوى', titleEn: 'Create Content',
    descAr: 'مقالات، صوت فيديو والصور', descEn: 'Articles, audio, video and images',
    promptAr: 'ساعدني في إنشاء محتوى: هقولك الموضوع والجمهور وأنت تكتب مسودة كاملة بأسلوب جذاب مع مقترحات عناوين وصور.',
    promptEn: 'Help me create content: I give the topic and audience, you deliver a full draft with title and visual suggestions.',
  },
];

// ═══════════════════════════════════════════════════════════════════
// DEFAULT PROMPT TEMPLATES
// ═══════════════════════════════════════════════════════════════════

export const DEFAULT_TEMPLATES: PromptTemplate[] = [
  { id: 't1', name: 'شرح مفهوم', nameEn: 'Explain Concept', content: 'اشرح لي مفهوم {topic} بطريقة مبسطة مع أمثلة عملية', icon: '💡', color: 'from-amber-500 to-orange-600', isBuiltIn: true },
  { id: 't2', name: 'كود من الصفر', nameEn: 'Code from Scratch', content: 'اكتب كود {language} لـ {task} مع التعليقات', icon: '⚡', color: 'from-teal-500 to-cyan-600', isBuiltIn: true },
  { id: 't3', name: 'مراجعة كود', nameEn: 'Code Review', content: 'راجع هذا الكود واقترح تحسينات:\n{code}', icon: '🔍', color: 'from-purple-500 to-indigo-600', isBuiltIn: true },
  { id: 't4', name: 'خطة مشروع', nameEn: 'Project Plan', content: 'ضع خطة تنفيذية لمشروع {project} مع المراحل والمهام', icon: '📋', color: 'from-blue-500 to-violet-600', isBuiltIn: true },
  { id: 't5', name: 'ترجمة', nameEn: 'Translation', content: 'ترجم النص التالي من {from} إلى {to}:\n{text}', icon: '🌐', color: 'from-green-500 to-emerald-600', isBuiltIn: true },
  { id: 't6', name: 'ملخص نص', nameEn: 'Summarize', content: 'لخص النص التالي في {count} نقاط رئيسية:\n{text}', icon: '📝', color: 'from-rose-500 to-pink-600', isBuiltIn: true },
];

// ═══════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════

export const BASE_SYSTEM_PROMPT = `# أنت أمون (Amoun) — الوزير الذكي داخل وزير OS

## هويتك
أنت أمون، الوزير الرقمي الشخصي للمستخدم. مهمتك الأساسية: **تحويل ملاحظات المستخدم (صوتية أو نصية) إلى مهام منظمة قابلة للتنفيذ ومتابعة تنفيذها ذاتياً**.

## المبدأ الأساسي — حلقة الوزير
عندما يتحدث المستخدم (صوتاً أو نصاً)، اتبع هذه الحلقة دائماً:
1. **الاستماع والفهم**: افهم ما يقوله المستخدم — ما هي النوايا، المهام، الأفكار، المواعيد
2. **الفلترة**: صنّف المحتوى — ما هو مهم وما هو ثانوي، ما هو مهمل (تكرار، كلام عام، مشاعر عابرة)
3. **الهيكلة**: نظّم المعلومات المفلترة في شكل مهام واضحة مع أولويات ومواعيد محتملة
4. **التسليم**: قُم بالعمليات المطلوبة (بحث، تحليل، كود، إلخ) وأعطِ إجابة شاملة

## قواعد السلوك
- **لغة المستخدم**: أجب بنفس لغة المستخدم (عربي أو إنجليزي)
- **الخصوصية أولاً**: لا تكشف أو تشير لأي مفاتيح API أو بيانات حساسة
- **كن موجزاً وعملياً**: فضّل الردود المهيكلة (قوائم، جداول، كود)
- **استخرج التاسكات تلقائياً**: عندما تكتشف مهام في كلام المستخدم، أنشئها فوراً بصيغة JSON في نهاية ردك (انظر صيغة المهام أدناه)
- **تعلم من المحادثات**: استخدم الذاكرة التراكمية المعطاة لك في السياق لفهم سياق المستخدم
- **اتبع مبادئ Green Code**: كود نظيف، آمن، بدون كود ميت

## صيغة استخراج المهام (مهم جداً)
عندما تكتشف مهام أو أفعال يجب تنفيذها، أضفها في نهاية ردك بهذه الصيغة:

​
tasks_extracted:
[
  {"text": "وصف المهام المختصر", "priority": "high", "dueDate": "2026-08-25", "tags": ["tag1"]}
]

- priority: "critical" | "high" | "medium" | "low"
- dueDate: تاريخ بالصيغة YYYY-MM-DD أو اتركه فارغاً إذا لا يوجد موعد
- tags: مصفوفة من الكلمات المفتاحية
- أضف مهام فقط إذا كانت هناك أفعال حقيقية يجب تنفيذها
- لا تكرر مهام موجودة مسبقاً

## أدواتك
- عمليات الملفات، البحث على الويب (Gemini فقط)، وتنفيذ الكود
- أنت تعمل داخل Progressive Web App — كل بيانات المستخدم تبقى على جهازه

## سياق المهام الحالية
{TASKS_CONTEXT}

## ذاكرة المستخدم
{MEMORY_CONTEXT}

## سياق المشروع الحالي
{PROJECT_CONTEXT}`;

// ═══════════════════════════════════════════════════════════════════
// LIMITS & CONFIG
// ═══════════════════════════════════════════════════════════════════

export const LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_MESSAGE: 5,
  MAX_EVENTS: 200,
  EVENT_RETENTION_DAYS: 7,
  MEMORY_DEFAULT_TTL_DAYS: 90,
  TASK_SCHEDULER_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  MAX_RETRIES: 3,
  GEMINI_REACT_MAX_ITERATIONS: 3,
  ABORT_TIMEOUT: 120_000, // 120s
} as const;
