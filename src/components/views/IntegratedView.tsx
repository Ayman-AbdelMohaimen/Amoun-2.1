import { useEffect, useState } from 'react';
import { PlugZap, ShieldCheck, Globe, Cloud, Puzzle, Braces, Zap, CircleCheck, CircleX } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { PROVIDERS } from '@/constants';

/** CORS from browser: direct-allowed vs proxy-required (documented constraint) */
const CORS_DIRECT_OK = new Set(['groq', 'openrouter']);

export default function IntegratedView() {
  const { currentLanguage, setActiveModel } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';

  const [ocStatus, setOcStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [ocEnabled, setOcEnabled] = useState(() => localStorage.getItem('wazeer_opencode_enabled') === '1');

  useEffect(() => {
    let alive = true;
    fetch('/api/opencode/status')
      .then((r) => (r.ok ? r.json() : { available: false }))
      .then((d: { available?: boolean }) => {
        if (alive) setOcStatus(d.available ? 'available' : 'unavailable');
      })
      .catch(() => {
        if (alive) setOcStatus('unavailable');
      });
    return () => {
      alive = false;
    };
  }, []);

  const toggleOpencode = () => {
    const next = !ocEnabled;
    setOcEnabled(next);
    localStorage.setItem('wazeer_opencode_enabled', next ? '1' : '0');
    if (next) setActiveModel('opencode-big-pickle', 'opencode');
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold font-[var(--font-display)] text-[var(--text-primary)]">
          {isRtl ? '🔗 الربط' : '🔗 Integrations'}
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          {isRtl
            ? 'وزير Standalone — بيشتغل لوحده 100%، وأي ربط خارجي اختياري وبيمر عبر طبقة Adapters'
            : 'Wazeer is standalone — external integrations are optional adapters'}
        </p>
      </div>

      {/* Local SSE proxy */}
      <div className="glass rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <PlugZap size={15} className="text-emerald-400" />
          <h2 className="text-xs font-medium text-[var(--text-secondary)]">
            {isRtl ? 'بوابة الـ SSE المحلية (port 3000)' : 'Local SSE gateway (port 3000)'}
          </h2>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 ms-auto">
            {isRtl ? 'شغالة ✓' : 'Running ✓'}
          </span>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
          {isRtl
            ? `بتحوّل الطلبات لـ ${PROVIDERS.length} مزود عبر /api/proxy/* — مفاتيحك بتعيش في متصفحك وبتترسل مباشرة للمزود من خلال البوابة.`
            : `Routes requests to ${PROVIDERS.length} providers via /api/proxy/* — your keys stay in the browser.`}
        </p>
      </div>

      {/* opencode integration — server-side CLI, no user API key */}
      <div className="glass rounded-xl p-4 space-y-2.5 border border-[var(--accent-400)]/20">
        <div className="flex items-center gap-2">
          <Braces size={15} className="text-[var(--accent-400)]" />
          <h2 className="text-xs font-medium text-[var(--text-secondary)]">opencode</h2>
          <span
            className={
              'text-[9px] px-1.5 py-0.5 rounded-full ms-auto whitespace-nowrap ' +
              (ocEnabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/8 text-[var(--text-muted)]')
            }
          >
            {isRtl
              ? ocEnabled ? 'مفعّل ✓' : 'متوقف'
              : ocEnabled ? 'Enabled ✓' : 'Disabled'}
          </span>
        </div>

        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
          {isRtl
            ? 'بيشغّل موديلات opencode المجانية على سيرفر وزير — من غير أي API key. بيفتَح الموديلات السبعة في قائمة اختيار الموديلات فوق (Big Pickle، Nemotron، Muse Spark، MiMo، Ling،…).'
            : 'Runs opencode free models on the Wazeer server — zero API keys. Adds 7 free models to the model picker (Big Pickle, Nemotron, Muse Spark, MiMo, Ling, …).'}
        </p>

        <div className="flex items-center gap-2">
          {/* Connection status */}
          <span
            className={
              'inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-mono ' +
              (ocStatus === 'available'
                ? 'bg-emerald-500/15 text-emerald-300'
                : ocStatus === 'checking'
                  ? 'bg-white/8 text-[var(--text-muted)]'
                  : 'bg-red-500/15 text-red-300')
            }
          >
            {ocStatus === 'available' ? (
              <CircleCheck size={11} />
            ) : ocStatus === 'checking' ? (
              <Zap size={11} className="animate-pulse" />
            ) : (
              <CircleX size={11} />
            )}
            {ocStatus === 'available'
              ? (isRtl ? 'CLI متاح على السيرفر ✓' : 'CLI available ✓')
              : ocStatus === 'checking'
                ? (isRtl ? 'فحص الاتصال...' : 'Checking…')
                : (isRtl ? 'CLI غير متاح على السيرفر' : 'CLI unavailable on server')}
          </span>

          {/* Toggle */}
          <button
            type="button"
            onClick={toggleOpencode}
            className={
              'ms-auto text-[10px] px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ' +
              (ocEnabled
                ? 'bg-white/8 text-[var(--text-secondary)] hover:bg-white/12'
                : 'bg-[var(--accent-400)] text-black hover:opacity-90')
            }
          >
            {isRtl
              ? ocEnabled ? 'إيقاف' : 'تفعيل ✓'
              : ocEnabled ? 'Disable' : 'Activate ✓'}
          </button>
        </div>

        <p className="text-[10px] text-[var(--text-dim)] leading-relaxed">
          {isRtl
            ? 'حد أمان: 6 محادثات/دقيقة لكل مستخدم على السيرفر. عند التفعيل، الموديل بيتبدل لـ "⚡ Big Pickle" — وغيّره من القائمة. متاح محلياً الـ CLI مثبت ✓'
            : 'Safety limit: 6 chats/minute per user server-side. Activating selects "⚡ Big Pickle" — swap from the picker. CLI already verified locally ✓'}
        </p>
      </div>

      {/* Providers grid */}
      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {PROVIDERS.map((p) => {
          const direct = CORS_DIRECT_OK.has(p.id);
          return (
            <div key={p.id} className="glass rounded-xl p-3.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--text-primary)] truncate">{p.displayName}</p>
                <p className="text-[10px] text-[var(--text-dim)] font-mono" dir="ltr">
                  {p.models.length} models · /api/proxy/{p.id}
                </p>
              </div>
              <span
                className={
                  'text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ' +
                  (direct ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/8 text-[var(--text-muted)]')
                }
              >
                {direct ? (isRtl ? 'CORS مباشر ✓' : 'Direct ✓') : isRtl ? 'عبر البوابة' : 'Via proxy'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Cloud sync */}
        <div className="glass rounded-xl p-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <Cloud size={14} className="text-[var(--accent-400)]" />
            <h2 className="text-xs font-medium text-[var(--text-secondary)]">{isRtl ? 'مزامنة Firestore' : 'Firestore sync'}</h2>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            {isRtl
              ? 'تسجيل الدخول يشغّل المزامنة السحابية للجلسات — من غير حساب، كل حاجة محلية على جهازك.'
              : 'Sign-in enables cloud session sync — without an account everything stays local.'}
          </p>
        </div>

        {/* PWA */}
        <div className="glass rounded-xl p-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-[var(--accent-400)]" />
            <h2 className="text-xs font-medium text-[var(--text-secondary)]">{isRtl ? 'PWA — يعمل كتطبيق' : 'PWA — installable'}</h2>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            {isRtl
              ? 'Service Worker مفعل بـ skipWaiting — التحديثات بتحتاج Hard Refresh واحد، وتقدر تثبت وزير كتطبيق.'
              : 'Service Worker with skipWaiting — updates need one hard refresh; install Wazeer as an app.'}
          </p>
        </div>
      </div>

      {/* Honest roadmap */}
      <div className="glass rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Puzzle size={14} className="text-[var(--accent-400)]" />
          <h2 className="text-xs font-medium text-[var(--text-secondary)]">{isRtl ? 'Adapters مجدولة (اختيارية)' : 'Scheduled adapters (optional)'}</h2>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['Notion', 'Google Tasks', 'زمرة Zomra', 'Google Calendar'].map((n) => (
            <span key={n} className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 border border-[var(--border)] text-[var(--text-dim)]">
              {n} — Phase 3
            </span>
          ))}
        </div>
        <p className="text-[10px] text-[var(--text-dim)] flex items-center gap-1.5">
          <ShieldCheck size={11} className="text-emerald-400" />
          {isRtl
            ? 'تعطيل أي Adapter مش هيكسر حاجة — كل تكامل معزول في register/integrations/'
            : 'Disabling any adapter breaks nothing — each integration is isolated in register/integrations/'}
        </p>
      </div>
    </div>
  );
}
