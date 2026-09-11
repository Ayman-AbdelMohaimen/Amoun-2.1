import { Bot, Shield, Cpu, Zap, CheckCircle2, Coins, RefreshCw } from 'lucide-react';
import { useSwarmStore } from '@/store/swarmStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { AgentStatus } from '@/types';

const AGENT_ICONS: Record<string, typeof Bot> = {
  amoun: Bot,
  hermes: Cpu,
  '7orus': Shield,
};

const AGENT_STORIES: Record<string, { roleAr: string; roleEn: string; glow: string }> = {
  amoun: { roleAr: 'الملك — الوكيل الأساسي للشات والقرار', roleEn: 'The King — primary chat & decision agent', glow: 'text-amber-400' },
  hermes: { roleAr: 'الكاتب — متخصص الكود والتنفيذ', roleEn: 'The Scribe — coding & execution specialist', glow: 'text-emerald-400' },
  '7orus': { roleAr: 'الحارس — فحص أمان الكود قبل التنفيذ', roleEn: 'The Guardian — security scanning', glow: 'text-purple-400' },
};

const STATUS_STYLES: Record<AgentStatus, { ar: string; en: string; cls: string }> = {
  idle: { ar: 'جاهز', en: 'Idle', cls: 'bg-white/8 text-[var(--text-muted)]' },
  thinking: { ar: 'بيفكر', en: 'Thinking', cls: 'bg-amber-500/20 text-amber-300 animate-pulse' },
  executing: { ar: 'بيشتغل', en: 'Executing', cls: 'bg-emerald-500/20 text-emerald-300 animate-pulse' },
  error: { ar: 'غلطان', en: 'Error', cls: 'bg-red-500/20 text-red-300' },
  intercepting: { ar: 'بيتدخل', en: 'Intercepting', cls: 'bg-purple-500/20 text-purple-300' },
};

export default function AgentsView() {
  const { agents } = useSwarmStore();
  const { currentLanguage } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';
  const list = Object.values(agents);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold font-[var(--font-display)] text-[var(--text-primary)]">
          {isRtl ? '🐺 السرب' : '🐺 The Swarm'}
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          {isRtl ? 'حالة الوكلاء الحية — كل واحد ليها دور ودول في الأسطورة' : 'Live agent statuses — each with a role in the mythology'}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((a) => {
          const Icon = AGENT_ICONS[a.id] ?? Bot;
          const story = AGENT_STORIES[a.id];
          const status = STATUS_STYLES[a.status] ?? STATUS_STYLES.idle;
          return (
            <div key={a.id} className="glass rounded-xl p-4 space-y-3 hover:border-[var(--accent-400)]/25 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={'w-10 h-10 rounded-xl bg-white/5 border border-[var(--border)] flex items-center justify-center ' + (story?.glow ?? '')}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">{a.displayName}</h3>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {isRtl && story ? story.roleAr : !isRtl && story ? story.roleEn : a.description}
                    </p>
                  </div>
                </div>
                <span className={'text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap ' + status.cls}>
                  {isRtl ? status.ar : status.en}
                </span>
              </div>

              {a.currentTask && (
                <p className="text-[11px] text-[var(--text-secondary)] bg-white/5 rounded-lg px-2.5 py-1.5 truncate">
                  ⚙️ {a.currentTask}
                </p>
              )}

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-white/[0.03] py-1.5">
                  <CheckCircle2 size={12} className="mx-auto text-emerald-400 mb-0.5" />
                  <p className="text-xs font-bold font-mono text-[var(--text-primary)]">{a.tasksCompleted}</p>
                  <p className="text-[9px] text-[var(--text-dim)]">{isRtl ? 'مهام' : 'Tasks'}</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] py-1.5">
                  <Coins size={12} className="mx-auto text-[var(--accent-400)] mb-0.5" />
                  <p className="text-xs font-bold font-mono text-[var(--text-primary)]">{a.tokensUsed >= 1000 ? `${(a.tokensUsed / 1000).toFixed(1)}k` : a.tokensUsed}</p>
                  <p className="text-[9px] text-[var(--text-dim)]">{isRtl ? 'توكنز' : 'Tokens'}</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] py-1.5">
                  <RefreshCw size={12} className="mx-auto text-amber-400 mb-0.5" />
                  <p className="text-xs font-bold font-mono text-[var(--text-primary)]">{a.retryCount}/{a.maxRetries}</p>
                  <p className="text-[9px] text-[var(--text-dim)]">{isRtl ? 'محاولات' : 'Retries'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {a.capabilities.map((c) => (
                  <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-[var(--text-dim)] font-mono" dir="ltr">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Honest roadmap note */}
      <div className="glass rounded-xl p-4 flex items-start gap-2.5">
        <Zap size={14} className="text-[var(--accent-400)] mt-0.5 shrink-0" />
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
          {isRtl
            ? 'توجه خلفي مستقل (هيرمس الخلفي بطابور مهام ودائرة قصر Circuit Breaker) مجدول في Phase 2.4 من الخطة — الحالة الحية دلوقتي بتتحدث من المهام الفعلية اللي بتشتغل.'
            : 'Standalone background agent (task queue + circuit breaker) is scheduled for Phase 2.4 — live statuses update from real task execution.'}
        </p>
      </div>
    </div>
  );
}
