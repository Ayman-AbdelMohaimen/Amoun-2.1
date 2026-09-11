import { PlugZap, ShieldCheck, Globe, Cloud, Puzzle } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { PROVIDERS } from '@/constants';

/** CORS from browser: direct-allowed vs proxy-required (documented constraint) */
const CORS_DIRECT_OK = new Set(['groq', 'openrouter']);

export default function IntegratedView() {
  const { currentLanguage } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';

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
