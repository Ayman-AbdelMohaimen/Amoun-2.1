import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, ChevronRight, ChevronLeft, Sparkles, Palette, Globe, Key,
  Code2, Home, FolderKanban, Settings, Shield, CheckCircle2,
  Wand2, MessageSquare, FileText, Bot, ArrowRight,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { wazeerDB } from '@/lib/db';
import { THEME_PRESETS, PROVIDERS, LOGO_GLYPH, AGENT_NAME_AR } from '@/constants';
import type { ThemePreset } from '@/types';
import {
  recordHoneypotTrigger,
  HONEYPOT_ONBOARDING_FIELDS,
} from '@/services/security/HoneypotService';

type StepId = 'welcome' | 'appearance' | 'api-key' | 'tour' | 'done';

interface StepConfig {
  id: StepId;
  labelAr: string;
  labelEn: string;
}

const STEPS: StepConfig[] = [
  { id: 'welcome',    labelAr: 'الترحيب',        labelEn: 'Welcome' },
  { id: 'appearance', labelAr: 'المظهر واللغة',  labelEn: 'Appearance' },
  { id: 'api-key',    labelAr: 'إعداد الذكاء',   labelEn: 'AI Setup' },
  { id: 'tour',       labelAr: 'جولة سريعة',     labelEn: 'Quick Tour' },
  { id: 'done',       labelAr: 'الانطلاق',       labelEn: 'All Set' },
];

export default function OnboardingWizard() {
  const {
    showOnboardingWizard, completeOnboarding,
    currentLanguage, setLanguage, theme, setTheme, accentColor, setAccentColor,
    setActiveView,
  } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';

  const [stepIdx, setStepIdx] = useState(0);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (showOnboardingWizard) {
      setStepIdx(0);
      wazeerDB.getApiKeys().then(setApiKeys).catch(() => {});
    }
  }, [showOnboardingWizard]);

  if (!showOnboardingWizard) return null;

  const step = STEPS[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === STEPS.length - 1;

  const next = () => !isLast && setStepIdx(stepIdx + 1);
  const prev = () => !isFirst && setStepIdx(stepIdx - 1);

  const updateKey = (provider: string, value: string) =>
    setApiKeys(prev => ({ ...prev, [provider]: value }));

  const saveKeysAndNext = async () => {
    for (const fieldName of HONEYPOT_ONBOARDING_FIELDS) {
      const el = document.querySelector<HTMLInputElement>(`input[name="${fieldName}"]`);
      const val = el?.value ?? '';
      if (val.trim()) {
        const hp = await recordHoneypotTrigger(fieldName, val);
        if (hp.banned) {
          // Silent block — don't save, don't advance
          return;
        }
      }
    }
    try {
      await wazeerDB.saveApiKeys(apiKeys);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
      next();
    } catch {
      next();
    }
  };

  const finish = () => {
    completeOnboarding();
    setActiveView('home');
  };

  const closeAndComplete = () => {
    completeOnboarding();
  };

  const skip = () => {
    if (isLast) finish();
    else setStepIdx(STEPS.length - 1);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="glass rounded-3xl w-full max-w-2xl overflow-hidden glow-xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="𓂀"
              className="w-10 h-10 select-none pointer-events-none drop-shadow-[0_0_15px_rgba(251,191,36,0.35)] rounded-full"
              draggable={false}
            />
            <div>
              <h2 className="font-bold font-[var(--font-display)] text-lg text-[var(--text-primary)]">
                {isRtl ? 'أهلاً بك في وزير OS' : 'Welcome to Wazeer OS'}
              </h2>
              <p className="text-xs text-[var(--text-dim)]">
                {isRtl ? `${STEPS.length} خطوات بسيطة وبنبدأ!` : `${STEPS.length} quick steps to get you started!`}
              </p>
            </div>
          </div>
          <button
            onClick={closeAndComplete}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] transition-colors"
            title={isRtl ? 'إغلاق' : 'Close'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-5">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 flex-1 last:flex-0 last:gap-0">
                <div
                  className={
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ' +
                    (i < stepIdx
                      ? 'bg-[var(--accent-500)] text-black'
                      : i === stepIdx
                        ? 'bg-[var(--accent-400)]/20 text-[var(--accent-400)] ring-2 ring-[var(--accent-400)]'
                        : 'bg-white/5 text-[var(--text-dim)]')
                  }
                >
                  {i < stepIdx ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={
                      'h-0.5 rounded-full flex-1 transition-colors ' +
                      (i < stepIdx ? 'bg-[var(--accent-500)]' : 'bg-white/10')
                    }
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 mb-4">
            {STEPS.map((s, i) => (
              <p
                key={s.id + '-label'}
                className={
                  'text-[10px] w-1/5 first:w-[calc(20%-0.375rem)] text-center transition-colors ' +
                  (i === stepIdx ? 'text-[var(--accent-400)]' : 'text-[var(--text-dim)]')
                }
              >
                {isRtl ? s.labelAr : s.labelEn}
              </p>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="px-6 py-4 min-h-[380px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {step.id === 'welcome' && (
                <WelcomeStep isRtl={isRtl} />
              )}
              {step.id === 'appearance' && (
                <AppearanceStep
                  isRtl={isRtl}
                  theme={theme} setTheme={setTheme}
                  accentColor={accentColor} setAccentColor={setAccentColor}
                  currentLanguage={currentLanguage} setLanguage={setLanguage}
                />
              )}
              {step.id === 'api-key' && (
                <ApiKeyStep
                  isRtl={isRtl}
                  apiKeys={apiKeys} updateKey={updateKey}
                  savedFlash={savedFlash}
                />
              )}
              {step.id === 'tour' && (
                <TourStep isRtl={isRtl} />
              )}
              {step.id === 'done' && (
                <DoneStep isRtl={isRtl} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 pb-5 pt-2 flex items-center justify-between border-t border-[var(--border)] mt-2">
          <button
            onClick={prev}
            disabled={isFirst}
            className={
              'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm transition-all ' +
              (isFirst
                ? 'opacity-0 pointer-events-none'
                : 'text-[var(--text-secondary)] hover:bg-white/5')
            }
          >
            <ChevronLeft size={16} className={isRtl ? 'rotate-180' : ''} />
            {isRtl ? 'السابق' : 'Back'}
          </button>

          <div className="flex items-center gap-2">
            {!isLast && (
              <button
                onClick={skip}
                className="px-4 py-2.5 rounded-xl text-sm text-[var(--text-muted)] hover:bg-white/5 transition-colors"
              >
                {isRtl ? 'تخطي' : 'Skip'}
              </button>
            )}

            {step.id === 'api-key' ? (
              <button
                onClick={saveKeysAndNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--accent-500)] text-black hover:brightness-110 transition-all"
              >
                {savedFlash ? <CheckCircle2 size={16} /> : <ArrowRight size={16} className={isRtl ? 'rotate-180' : ''} />}
                {savedFlash
                  ? (isRtl ? 'تم الحفظ!' : 'Saved!')
                  : (isRtl ? 'حفظ والتالي' : 'Save & Continue')}
              </button>
            ) : isLast ? (
              <button
                onClick={finish}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--accent-500)] text-black hover:brightness-110 transition-all"
              >
                <Sparkles size={16} />
                {isRtl ? 'ابدأ الاستخدام' : 'Start Using Wazeer'}
              </button>
            ) : (
              <button
                onClick={next}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--accent-400)] text-black hover:brightness-110 transition-all"
              >
                {isRtl ? 'التالي' : 'Continue'}
                <ChevronRight size={16} className={isRtl ? 'rotate-180' : ''} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Welcome ──────────────────────────────────────────────
function WelcomeStep({ isRtl }: { isRtl: boolean }) {
  const features = isRtl
    ? [
        { icon: Bot,      title: 'أمون الذكي',      desc: 'مساعد AI متعدد النماذج لخدمتك' },
        { icon: Code2,    title: 'مساحة الكود',     desc: 'اكتب وعدّل الكود مع فحص أماني' },
        { icon: Wand2,    title: 'أدوات الملك',     desc: 'مكتبات أدوات جاهزة لأي مهمة' },
        { icon: FileText, title: 'المشاريع',        desc: 'نظّم عملك في مشاريع منفصلة' },
      ]
    : [
        { icon: Bot,      title: `${AGENT_NAME_AR} AI Assistant`, desc: 'Multi-model AI that adapts to you' },
        { icon: Code2,    title: 'Code Workspace',                desc: 'Write code with built-in security scanning' },
        { icon: Wand2,    title: "King's Toolkit",                 desc: 'Pre-built tools for any workflow' },
        { icon: FileText, title: 'Project Hub',                   desc: 'Organize work into isolated projects' },
      ];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--accent-400)]/5 border border-[var(--accent-400)]/15">
        <div className="p-2.5 rounded-xl bg-[var(--accent-400)]/15 text-[var(--accent-400)] shrink-0">
          <Sparkles size={22} />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">
            {isRtl ? 'وزير OS — نظام الذكاء الأول متكامل 𓂀' : 'Wazeer OS — Your Complete AI Operating System 𓂀'}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {isRtl
              ? 'النسخة الجديدة v2.1 مدعومة بـ 7 مزودين ذكاء اصطناعي، نظام ملفات افتراضي، أمان حورس، وتزامن سحابي عبر Firebase. كل حاجة في مكان واحد.'
              : 'The all-new v2.1 ships with 7 AI providers, a virtual file system, HorusGuard security scanning, and Firebase cloud sync. Everything in one place.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {features.map(f => (
          <div key={f.title} className="p-3 rounded-xl bg-white/3 border border-[var(--border)] flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/5 text-[var(--accent-400)] shrink-0">
              <f.icon size={15} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{f.title}</p>
              <p className="text-xs text-[var(--text-dim)] mt-0.5 leading-snug">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-center text-[var(--text-dim)] pt-2">
        {isRtl
          ? '💡 النصيحة: ابدأ بمفتاح Gemini المجاني، جربه في مساحة العمل، وبعدين ضيف مزودين زيادة حسب احتياجك.'
          : '💡 Pro tip: Start with the free Gemini key, try it in the workspace, then add more providers as you need them.'}
      </p>
    </div>
  );
}

// ── Step 2: Appearance & Language ─────────────────────────────────
function AppearanceStep({
  isRtl, theme, setTheme, accentColor, setAccentColor,
  currentLanguage, setLanguage,
}: {
  isRtl: boolean;
  theme: string; setTheme: (t: any) => void;
  accentColor: string; setAccentColor: (c: string) => void;
  currentLanguage: string; setLanguage: (l: any) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Language */}
      <section>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-3">
          <Globe size={15} className="text-[var(--accent-400)]" />
          {isRtl ? 'اختر اللغة' : 'Choose Language'}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage('ar')}
            className={
              'flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ' +
              (currentLanguage === 'ar'
                ? 'bg-[var(--accent-400)]/20 text-[var(--accent-400)] ring-2 ring-[var(--accent-400)]'
                : 'bg-white/3 text-[var(--text-secondary)] hover:bg-white/5')
            }
          >
            🇪🇬 {isRtl ? 'العربية (RTL)' : 'Arabic (RTL)'}
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={
              'flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ' +
              (currentLanguage === 'en'
                ? 'bg-[var(--accent-400)]/20 text-[var(--accent-400)] ring-2 ring-[var(--accent-400)]'
                : 'bg-white/3 text-[var(--text-secondary)] hover:bg-white/5')
            }
          >
            🇺🇸 {isRtl ? 'الإنجليزية' : 'English'}
          </button>
        </div>
      </section>

      {/* Theme Presets */}
      <section>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-3">
          <Palette size={15} className="text-[var(--accent-400)]" />
          {isRtl ? 'اختر ثيم الألوان' : 'Pick a Color Theme'}
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {(['emerald', 'cyber-blue', 'crimson', 'purple'] as ThemePreset[]).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={
                'p-3 rounded-xl transition-all flex flex-col items-center gap-2 ' +
                (theme === t
                  ? 'ring-2 ring-[var(--accent-400)] bg-white/5'
                  : 'bg-white/3 hover:bg-white/5')
              }
            >
              <div
                className="w-10 h-10 rounded-full shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${THEME_PRESETS[t].accent600}, ${THEME_PRESETS[t].accent400})`,
                }}
              />
              <span className="text-[11px] font-medium capitalize text-[var(--text-secondary)]">
                {isRtl
                  ? t === 'emerald' ? 'زمردي'
                    : t === 'cyber-blue' ? 'سايبر بلو'
                      : t === 'crimson' ? 'قرمزي' : 'بنفسجي'
                  : t.replace('-', ' ')}
              </span>
            </button>
          ))}
        </div>

        {/* Custom color */}
        <div className="mt-3 flex items-center gap-3 p-2.5 rounded-xl bg-white/3">
          <input
            type="color"
            value={accentColor.startsWith('#') ? accentColor : '#14b8a6'}
            onChange={e => { setTheme('custom'); setAccentColor(e.target.value); }}
            className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
            title={isRtl ? 'لون مخصص' : 'Custom color'}
          />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {isRtl ? 'لون مخصص' : 'Custom Color'}
            </p>
            <p className="text-[11px] text-[var(--text-dim)]">
              {isRtl ? 'اختر أي لون يعجبك' : 'Pick any accent color you like'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Step 3: API Key Setup ─────────────────────────────────────────
function ApiKeyStep({
  isRtl, apiKeys, updateKey, savedFlash,
}: {
  isRtl: boolean;
  apiKeys: Record<string, string>;
  updateKey: (p: string, v: string) => void;
  savedFlash: boolean;
}) {
  const recommended = [
    {
      provider: 'gemini',
      labelAr: 'Google Gemini (مجاني - الأنسب للبداية)',
      labelEn: 'Google Gemini (Free — Best to Start)',
      docsUrl: 'https://aistudio.google.com/app/apikey',
      tag: isRtl ? 'مجاني 100%' : '100% Free',
      tagColor: 'text-emerald-400 bg-emerald-400/10',
    },
    {
      provider: 'nvidia',
      labelAr: 'NVIDIA NIM (مجاني - DeepSeek و Llama)',
      labelEn: 'NVIDIA NIM (Free — DeepSeek, Llama)',
      docsUrl: 'https://build.nvidia.com/explore/discover',
      tag: isRtl ? 'مجاني' : 'Free Tier',
      tagColor: 'text-green-400 bg-green-400/10',
    },
    {
      provider: 'groq',
      labelAr: 'Groq (سريع جداً — تجربة مجانية محدودة)',
      labelEn: 'Groq (Blazing Fast — Limited Free)',
      docsUrl: 'https://console.groq.com/keys',
      tag: isRtl ? 'أسرع استجابة' : 'Fastest',
      tagColor: 'text-amber-400 bg-amber-400/10',
    },
    {
      provider: 'openrouter',
      labelAr: 'OpenRouter (+100 نموذج في مكان واحد)',
      labelEn: 'OpenRouter (100+ Models, One Key)',
      docsUrl: 'https://openrouter.ai/keys',
      tag: isRtl ? 'اكتر من 100 نموذج' : '100+ Models',
      tagColor: 'text-purple-400 bg-purple-400/10',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[var(--accent-400)]/5 border border-[var(--accent-400)]/15">
        <div className="p-2 rounded-xl bg-[var(--accent-400)]/15 text-[var(--accent-400)] shrink-0">
          <Key size={18} />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-0.5">
            {isRtl ? 'اربط مفتاح الذكاء الاصطناعي' : 'Connect Your AI Provider Keys'}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {isRtl
              ? 'كل المفاتيح بتتخزن محلياً في جهازك بس (IndexedDB) — مفيش أي مفتاح بيبعت لسيرفرنا اطلاقاً. الأمان أولوية.'
              : 'All keys are stored locally on your device only (IndexedDB). No keys are ever sent to our servers. Security first.'}
          </p>
        </div>
      </div>

      {savedFlash && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2"
        >
          <CheckCircle2 size={16} />
          {isRtl ? '✅ تم حفظ المفاتيح بنجاح في التخزين المحلي' : '✅ Keys saved to local storage successfully'}
        </motion.div>
      )}

      {/* Form wrapper: browser consoles warn about standalone password fields */}
      <form
        className="space-y-2 max-h-[260px] overflow-y-auto pr-1"
        onSubmit={e => e.preventDefault()}
      >
        {/* Honeypot fields — invisible to humans, bots fill these
        */}
        <input
          name="wazeer_company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
        />
        <input
          name="wazeer_city"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
        />
        {recommended.map(r => {
          const p = PROVIDERS.find(pr => pr.id === r.provider);
          if (!p) return null;
          const val = apiKeys[r.provider] ?? '';
          return (
            <div
              key={r.provider}
              className="p-3 rounded-xl bg-white/3 border border-[var(--border)] space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-white/5 text-[var(--text-dim)]">
                    {r.provider}
                  </div>
                  <span className={'text-[10px] px-2 py-0.5 rounded-full font-medium ' + r.tagColor}>
                    {r.tag}
                  </span>
                </div>
                <a
                  href={r.docsUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[10px] text-[var(--accent-400)] hover:underline"
                >
                  {isRtl ? 'احصل على مفتاح ↗' : 'Get Key ↗'}
                </a>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-snug">
                {isRtl ? r.labelAr : r.labelEn}
              </p>
              <input
                type="password"
                autoComplete="off"
                placeholder={isRtl ? 'الصق المفتاح هنا...' : 'Paste your key here...'}
                value={val}
                onChange={e => updateKey(r.provider, e.target.value)}
                dir="ltr"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent-400)] transition-colors"
              />
            </div>
          );
        })}
      </form>

      <p className="text-[11px] text-[var(--text-dim)] text-center">
        {isRtl
          ? '💡 تقدر تحط باقي المفاتيح وتعدل عليها في أي وقت من صفحة الإعدادات.'
          : '💡 You can always add or change keys later from the Settings page.'}
      </p>
    </div>
  );
}

// ── Step 4: Quick Tour ────────────────────────────────────────────
function TourStep({ isRtl }: { isRtl: boolean }) {
  const sections = isRtl
    ? [
        { icon: Home,         id: 'home',      name: 'الرئيسية',    desc: 'الصفحة الرئيسية والنظرة السريعة' },
        { icon: Code2,        id: 'workspace', name: 'مساحة العمل', desc: 'المحادثة الرئيسية مع أمون + الكود' },
        { icon: FolderKanban, id: 'projects',  name: 'المشاريع',    desc: 'فصل الأعمال في مشاريع مستقلة' },
        { icon: Settings,     id: 'settings',  name: 'الإعدادات',   desc: 'المفاتيح، الثيم، اللغة، والصوت' },
        { icon: Shield,       id: 'admin',     name: 'لوحة المدير', desc: 'إدارة المستخدمين والإحصائيات' },
      ]
    : [
        { icon: Home,         id: 'home',      name: 'Home',      desc: 'Dashboard & quick overview' },
        { icon: Code2,        id: 'workspace', name: 'Workspace', desc: 'Main chat with Amoun + code' },
        { icon: FolderKanban, id: 'projects',  name: 'Projects',  desc: 'Isolate work into separate projects' },
        { icon: Settings,     id: 'settings',  name: 'Settings',  desc: 'Keys, theme, language & voice' },
        { icon: Shield,       id: 'admin',     name: 'Admin',     desc: 'User management & analytics' },
      ];

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white/3 border border-[var(--border)]">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-3">
          <MessageSquare size={15} className="text-[var(--accent-400)]" />
          {isRtl ? 'التنقل السريع في النظام' : 'Quick System Navigation'}
        </h3>
        <div className="space-y-2">
          {sections.map(s => (
            <div
              key={s.id}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-white/3 hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[var(--accent-400)] shrink-0">
                <s.icon size={15} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">{s.name}</p>
                <p className="text-xs text-[var(--text-dim)]">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-[var(--accent-400)]/5 border border-[var(--accent-400)]/15">
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-1.5 flex items-center gap-1.5">
          <Shield size={14} className="text-[var(--accent-400)]" />
          {isRtl ? 'نظام أمان حورس 𓂀' : 'HorusGuard Security System 𓂀'}
        </p>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {isRtl
            ? 'كل كود بيأتي من الذكاء الاصطناعي بيتفحص تلقائياً بحثاً عن أكواد خبيثة (eval, localStorage, innerHTML, child_process, ...). نتأكد إنك آمن قبل ما تشغل أي كود.'
            : 'Every AI-generated code block is automatically scanned for threats (eval, localStorage, innerHTML, child_process, etc.). We keep you safe before anything runs.'}
        </p>
      </div>
    </div>
  );
}

// ── Step 5: Done ──────────────────────────────────────────────────
function DoneStep({ isRtl }: { isRtl: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 space-y-5 h-[320px]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.1 }}
        className="p-6 rounded-full bg-[var(--accent-400)]/15 ring-4 ring-[var(--accent-400)]/20"
      >
        <Sparkles size={48} className="text-[var(--accent-400)]" />
      </motion.div>

      <div>
        <h3 className="text-2xl font-bold font-[var(--font-display)] text-[var(--text-primary)] mb-2">
          {isRtl ? 'كل شيء جاهز يا باشا! 𓂀' : "You're All Set! 𓂀"}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] max-w-md leading-relaxed">
          {isRtl
            ? 'تم إعداد النظام بنجاح. روح على مساحة العمل وابدأ تسأل أمون أي حاجة — من كتابة كود، وحتى حل مسائل، وتنظيم مشاريعك.'
            : 'Your system is configured. Jump into the Workspace and ask Amoun anything — from writing code to solving problems and organizing projects.'}
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-[var(--text-dim)]">
        <CheckCircle2 size={14} className="text-[var(--accent-400)]" />
        <span>Wazeer OS v2.1</span>
        <span>·</span>
        <span>{isRtl ? 'جاهز للإنتاج 100 مستخدم' : 'Production Ready'}</span>
      </div>
    </div>
  );
}
