import { ArrowLeft, MessageSquareText, Sparkles, ShieldCheck, Languages } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';

const FEATURES = [
  {
    icon: MessageSquareText,
    ar: 'شات بذاكرة', en: 'Chat with memory',
    descAr: 'أمون بيتفكرك — ذاكرة محلية بتنضف نفسها', descEn: 'Amoun remembers — local self-cleaning memory',
  },
  {
    icon: Sparkles,
    ar: '12+ موديل', en: '12+ models',
    descAr: 'Gemini · GLM · OpenRouter · Groq · NVIDIA — بمفتاحك أنت', descEn: 'Gemini · GLM · OpenRouter · Groq · NVIDIA — your keys',
  },
  {
    icon: ShieldCheck,
    ar: 'شفافية كاملة', en: 'Full transparency',
    descAr: 'كل حدث مسجل، وكل خطأ مترجم مصري وواضح', descEn: 'Every event logged, every error in plain words',
  },
  {
    icon: Languages,
    ar: 'عربي أولاً', en: 'Arabic first',
    descAr: 'RTL مظبوط من أول سطر — مش ترجمة مطاوعة', descEn: 'RTL done right from line one — not a bolt-on',
  },
];

export default function LandingView() {
  const { currentLanguage, setActiveView } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';

  return (
    <div className="h-full overflow-y-auto cyber-grid">
      <div className="max-w-3xl mx-auto px-6 py-14 space-y-10 text-center">
        <div className="space-y-4">
          <img
            src="/logo.png"
            alt="𓂀"
            className="w-20 h-20 mx-auto rounded-full select-none pointer-events-none drop-shadow-[0_0_30px_rgba(251,191,36,0.35)]"
            draggable={false}
          />
          <h1 className="text-3xl md:text-4xl font-bold font-[var(--font-display)] text-[var(--text-primary)]">
            𓂀 {isRtl ? 'وزير OS' : 'Wazeer OS'}
          </h1>
          <p className="text-sm md:text-base text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
            {isRtl
              ? 'مساعدك الذكي اللي بيشتغل لوحده — وكلاء، ذاكرة، حوكمة، ومفاتيحك في إيدك. بياناتك على جهازك، والقوة بين يديك.'
              : 'Your self-reliant AI assistant — agents, memory, governance, and your keys in your hands. Data stays local.'}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-start">
          {FEATURES.map((f) => (
            <div key={f.en} className="glass rounded-2xl p-5 space-y-2 hover:border-[var(--accent-400)]/30 transition-colors">
              <f.icon size={18} className="text-[var(--accent-400)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">{isRtl ? f.ar : f.en}</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{isRtl ? f.descAr : f.descEn}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => setActiveView('home')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent-400)] text-black text-sm font-bold hover:brightness-110 hover:scale-[1.02] transition-all cursor-pointer shadow-[0_0_25px_var(--accent-glow)]"
        >
          {isRtl ? 'ابدأ رحلتك' : 'Start your journey'}
          <ArrowLeft size={15} className={isRtl ? '' : 'rotate-180'} />
        </button>

        <p className="text-[10px] text-[var(--text-dim)]">100MillionDEV.com — 𓂀 وزير × زمرة</p>
      </div>
    </div>
  );
}
