import { useEffect, useMemo, useState } from 'react';
import { Lightbulb, Star, Tags, TrendingUp, Zap, Coins, AlertTriangle } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useEventLogger } from '@/hooks/useEventLogger';
import { wazeerDB } from '@/lib/db';
import type { UserMemory } from '@/types';

export default function ReportsView() {
  const { chatSessions, tasks, currentLanguage } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const log = useEventLogger((s) => s);

  useEffect(() => {
    wazeerDB.getAll<UserMemory>('userMemory').then(setMemories).catch(() => setMemories([]));
  }, []);

  const insights = useMemo(() => {
    const assistantMsgs = chatSessions.flatMap((cs) => cs.messages).filter((m) => m.role === 'assistant');

    // Best / worst model by 👎😍
    const byModel = new Map<string, { up: number; down: number }>();
    for (const m of assistantMsgs) {
      if (!m.rating) continue;
      const key = m.model ?? '?';
      const s = byModel.get(key) ?? { up: 0, down: 0 };
      if (m.rating === 'up') s.up += 1;
      if (m.rating === 'down') s.down += 1;
      byModel.set(key, s);
    }
    const rated = [...byModel.entries()];
    const best = rated.filter(([, s]) => s.up > 0).sort((a, b) => b[1].up - a[1].up)[0];
    const worst = rated.filter(([, s]) => s.down > 0).sort((a, b) => b[1].down - a[1].down)[0];

    // Slowest generation among assistant messages
    const timed = assistantMsgs.filter((m) => typeof m.generationSeconds === 'number' && m.generationSeconds > 0);
    const slowest = timed.length
      ? timed.reduce((max, m) => ((m.generationSeconds ?? 0) > (max.generationSeconds ?? 0) ? m : max))
      : null;

    // Upcoming tasks (due within 3 days, not completed)
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    const dueTasks = tasks.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) <= soon);

    // Memory categories
    const memByCategory = new Map<string, number>();
    for (const mem of memories) memByCategory.set(mem.category, (memByCategory.get(mem.category) ?? 0) + 1);
    const topMemories = [...memories].sort((a, b) => b.accessCount - a.accessCount).slice(0, 5);

    return { best, worst, slowest, dueTasks, memByCategory: [...memByCategory.entries()].sort((a, b) => b[1] - a[1]), topMemories };
  }, [chatSessions, tasks, memories]);

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="glass rounded-xl p-4 space-y-2.5">
      <h2 className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
        <Lightbulb size={13} className="text-[var(--accent-400)]" /> {title}
      </h2>
      {children}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold font-[var(--font-display)] text-[var(--text-primary)]">
          {isRtl ? '📈 التقارير والرؤى' : '📈 Reports & Insights'}
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          {isRtl ? 'خلاصات مستخرجة من سلوكك الفعلي — تقييماتك وذاكرتك ومهامك' : 'Derived from your actual usage — ratings, memory and tasks'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Ops insight — العمليات والتوكنز والأخطاء (نقلناها من الهيرو للداشبورد) */}
        <Card title={isRtl ? 'العمليات والنشاط' : 'Operations & activity'}>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-white/[0.03] py-2.5">
              <Zap size={13} className="mx-auto text-[var(--accent-400)] mb-1" />
              <p className="text-base font-bold font-mono text-[var(--text-primary)]" dir="ltr">{log.getMetrics().totalOperations}</p>
              <p className="text-[9px] text-[var(--text-dim)]">{isRtl ? 'عمليات' : 'Ops'}</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] py-2.5">
              <Coins size={13} className="mx-auto text-[var(--accent-300)] mb-1" />
              <p className="text-base font-bold font-mono text-[var(--text-primary)]" dir="ltr">
                {log.getMetrics().totalTokens >= 1000
                  ? `${(log.getMetrics().totalTokens / 1000).toFixed(1)}k`
                  : log.getMetrics().totalTokens}
              </p>
              <p className="text-[9px] text-[var(--text-dim)]">{isRtl ? 'توكنز' : 'Tokens'}</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] py-2.5">
              <AlertTriangle size={13} className="mx-auto text-purple-300 mb-1" />
              <p className="text-base font-bold font-mono text-[var(--text-primary)]" dir="ltr">{log.getMetrics().totalErrors}</p>
              <p className="text-[9px] text-[var(--text-dim)]">{isRtl ? '🧠 أخطاء' : 'Errors'}</p>
            </div>
          </div>
          <p className="text-[10px] text-[var(--text-dim)] border-t border-[var(--border)] pt-2">
            {isRtl ? 'متحسبة من سجل الأحداث الفعلي على جهازك' : 'Computed from your local event log'}
          </p>
        </Card>

        {/* Ratings insight */}
        <Card title={isRtl ? 'رأيك في الموديلات' : 'Your verdict on models'}>
          {insights.best || insights.worst ? (
            <div className="space-y-2 text-xs">
              {insights.best && (
                <p className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Star size={13} className="text-amber-400 shrink-0" />
                  {isRtl
                    ? <>أكتر موديل نال إعجابك: <b className="font-mono" dir="ltr">{insights.best[0]}</b> ({insights.best[1].up} 😍)</>
                    : <>Most loved: <b className="font-mono" dir="ltr">{insights.best[0]}</b> ({insights.best[1].up} 👍)</>}
                </p>
              )}
              {insights.worst && (
                <p className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <TrendingUp size={13} className="text-red-400 rotate-180 shrink-0" />
                  {isRtl
                    ? <>أكتر موديل شبشبته: <b className="font-mono" dir="ltr">{insights.worst[0]}</b> ({insights.worst[1].down} 👎) — جرب موديل بديل</>
                    : <>Most downvoted: <b className="font-mono" dir="ltr">{insights.worst[0]}</b> ({insights.worst[1].down} 👎) — consider switching</>}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-[var(--text-dim)]">{isRtl ? 'قيّم الردود بـ 😍👎 وستظهر الرؤى هنا' : 'Rate replies to unlock insights'}</p>
          )}
          {insights.slowest && (
            <p className="text-[11px] text-[var(--text-muted)] border-t border-[var(--border)] pt-2">
              {isRtl
                ? <>أبطأ توليد: <b className="font-mono" dir="ltr">{insights.slowest.model}</b> واخد {insights.slowest.generationSeconds}s — لو متكرر، جرب موديل أسرع</>
                : <>Slowest reply: <b className="font-mono" dir="ltr">{insights.slowest.model}</b> took {insights.slowest.generationSeconds}s</>}
            </p>
          )}
        </Card>

        {/* Tasks insight */}
        <Card title={isRtl ? 'المهام الجاية' : 'Upcoming tasks'}>
          {insights.dueTasks.length > 0 ? (
            <div className="space-y-1.5">
              {insights.dueTasks.slice(0, 5).map((t) => (
                <p key={t.id} className="text-[11px] text-[var(--text-secondary)] flex items-center gap-2">
                  <Tags size={11} className="text-amber-400 shrink-0" />
                  <span className="truncate">{t.text}</span>
                  <span className="text-[9px] text-[var(--text-dim)] font-mono shrink-0" dir="ltr">{t.dueDate}</span>
                </p>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-[var(--text-dim)]">
              {isRtl ? 'مفيش مهام مستحقة خلال 3 أيام — تمام كده 👌' : 'Nothing due within 3 days 👌'}
            </p>
          )}
        </Card>

        {/* Memory insight */}
        <Card title={isRtl ? 'ذاكرة أمون' : "Amoun's memory"}>
          {memories.length > 0 ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {insights.memByCategory.map(([cat, n]) => (
                  <span key={cat} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-[var(--border)] text-[var(--text-muted)]">
                    {isRtl ? `${cat}: ${n}` : `${cat}: ${n}`}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-[var(--text-dim)]">{isRtl ? 'أكتر الذكريات استخداماً:' : 'Most-accessed memories:'}</p>
              <div className="space-y-1">
                {insights.topMemories.map((m) => (
                  <p key={m.id} className="text-[11px] text-[var(--text-secondary)] truncate" dir="auto">
                    • {m.content} <span className="text-[9px] text-[var(--text-dim)]">({m.accessCount}×)</span>
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-[var(--text-dim)]">
              {isRtl ? 'الذاكرة بتتعبى تلقائياً كل ما تحادث أمون' : 'Memory fills automatically as you chat'}
            </p>
          )}
        </Card>

        {/* Governance note */}
        <Card title={isRtl ? 'الشفافية' : 'Transparency'}>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            {isRtl
              ? 'الرؤى دي محسوبة على جهازك من بياناتك أنت — مفيش حاجة بتتحسب في السحابة، وممكن تطهّر الذاكرة من مجلس الحوكمة في الإعدادات.'
              : 'Computed locally from your own data — nothing is computed in the cloud; purge memory anytime from the governance council in Settings.'}
          </p>
        </Card>
      </div>
    </div>
  );
}
