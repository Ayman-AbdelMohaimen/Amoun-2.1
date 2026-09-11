import { useMemo } from 'react';
import { MessageSquare, Coins, Layers, Timer, Gauge, ListChecks } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { ChatMessage } from '@/types';

interface ModelStat {
  model: string;
  messages: number;
  tokens: number;
  up: number;
  down: number;
  genSeconds: number;
  genCount: number;
}

export default function ComputeView() {
  const { chatSessions, tasks, currentLanguage } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';

  const allMessages = useMemo(() => chatSessions.flatMap((cs) => cs.messages), [chatSessions]);
  const assistantMsgs = useMemo(() => allMessages.filter((m) => m.role === 'assistant' && !m.content.startsWith('❌')), [allMessages]);

  const stats = useMemo(() => {
    const totalTokens = allMessages.reduce((sum, m) => sum + (m.tokensUsed ?? 0), 0);
    const genSecondsList = assistantMsgs.map((m) => m.generationSeconds).filter((s): s is number => typeof s === 'number');
    const avgSeconds = genSecondsList.length
      ? Math.round(genSecondsList.reduce((a, b) => a + b, 0) / genSecondsList.length)
      : null;
    const rated = assistantMsgs.filter((m) => m.rating);
    const up = rated.filter((m) => m.rating === 'up').length;
    const satisfaction = rated.length ? Math.round((up / rated.length) * 100) : null;

    const byModel = new Map<string, ModelStat>();
    for (const m of assistantMsgs) {
      const key = m.model ?? (isRtl ? 'غير معروف' : 'unknown');
      const s = byModel.get(key) ?? { model: key, messages: 0, tokens: 0, up: 0, down: 0, genSeconds: 0, genCount: 0 };
      s.messages += 1;
      s.tokens += m.tokensUsed ?? 0;
      if (m.rating === 'up') s.up += 1;
      if (m.rating === 'down') s.down += 1;
      if (typeof m.generationSeconds === 'number') {
        s.genSeconds += m.generationSeconds;
        s.genCount += 1;
      }
      byModel.set(key, s);
    }
    const modelRows = [...byModel.values()].sort((a, b) => b.messages - a.messages);

    // Last 7 days activity (assistant replies per day)
    const days: Array<{ label: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const count = assistantMsgs.filter((m) => {
        const t = new Date(m.timestamp).getTime();
        return t >= d.getTime() && t < next.getTime();
      }).length;
      days.push({ label: d.toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB', { weekday: 'short' }), count });
    }

    return {
      totalMessages: allMessages.length,
      totalTokens,
      sessions: chatSessions.length,
      avgSeconds,
      satisfaction,
      modelRows,
      days,
      tasksTotal: tasks.length,
      tasksDone: tasks.filter((t) => t.completed).length,
    };
  }, [allMessages, assistantMsgs, chatSessions, tasks, isRtl]);

  const fmtNum = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
  const maxDay = Math.max(1, ...stats.days.map((d) => d.count));

  const KPIS = [
    { icon: MessageSquare, label: isRtl ? 'إجمالي الرسايل' : 'Total messages', value: fmtNum(stats.totalMessages) },
    { icon: Coins, label: isRtl ? 'إجمالي التوكنز' : 'Total tokens', value: fmtNum(stats.totalTokens) },
    { icon: Layers, label: isRtl ? 'الجلسات' : 'Sessions', value: String(stats.sessions) },
    {
      icon: Timer,
      label: isRtl ? 'متوسط زمن التوليد' : 'Avg generation',
      value: stats.avgSeconds != null ? `${stats.avgSeconds}s` : '—',
    },
    {
      icon: Gauge,
      label: isRtl ? 'رضا التقييم 😍' : 'Satisfaction 😍',
      value: stats.satisfaction != null ? `${stats.satisfaction}%` : '—',
    },
    {
      icon: ListChecks,
      label: isRtl ? 'المهام المنجزة' : 'Tasks done',
      value: `${stats.tasksDone}/${stats.tasksTotal}`,
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold font-[var(--font-display)] text-[var(--text-primary)]">
          {isRtl ? '📊 الإحصائيات' : '📊 Compute'}
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          {isRtl ? 'أرقام حقيقية من بياناتك المحلية — مش مجرد ديكور' : 'Real numbers from your local data'}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {KPIS.map((k) => (
          <div key={k.label} className="glass rounded-xl p-3.5 flex flex-col gap-1.5">
            <k.icon size={15} className="text-[var(--accent-400)]" />
            <span className="text-lg font-bold font-mono text-[var(--text-primary)]" dir="ltr">{k.value}</span>
            <span className="text-[10px] text-[var(--text-muted)] leading-tight">{k.label}</span>
          </div>
        ))}
      </div>

      {/* Weekly activity */}
      <div className="glass rounded-xl p-4">
        <h2 className="text-xs font-medium text-[var(--text-secondary)] mb-3">{isRtl ? 'نشاط آخر 7 أيام (ردود)' : 'Last 7 days (replies)'}</h2>
        <div className="flex items-end gap-2 h-28">
          {stats.days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-mono text-[var(--text-dim)]">{d.count || ''}</span>
              <div
                className="w-full rounded-t-md bg-[var(--accent-400)]/60 min-h-[3px] transition-all"
                style={{ height: `${Math.max(4, (d.count / maxDay) * 100)}%` }}
              />
              <span className="text-[9px] text-[var(--text-dim)]">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Per-model table */}
      {stats.modelRows.length > 0 && (
        <div className="glass rounded-xl p-4">
          <h2 className="text-xs font-medium text-[var(--text-secondary)] mb-3">{isRtl ? 'الأداء حسب الموديل' : 'Per-model performance'}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[var(--text-dim)] text-[10px] text-start">
                  <th className="text-start pb-2 font-medium">{isRtl ? 'الموديل' : 'Model'}</th>
                  <th className="text-start pb-2 font-medium">{isRtl ? 'ردود' : 'Replies'}</th>
                  <th className="text-start pb-2 font-medium">{isRtl ? 'توكنز' : 'Tokens'}</th>
                  <th className="text-start pb-2 font-medium">{isRtl ? 'متوسط' : 'Avg'}</th>
                  <th className="text-start pb-2 font-medium">😍</th>
                  <th className="text-start pb-2 font-medium">👎</th>
                </tr>
              </thead>
              <tbody>
                {stats.modelRows.map((r) => (
                  <tr key={r.model} className="border-t border-[var(--border)]">
                    <td className="py-2 font-mono text-[11px] text-[var(--text-primary)]" dir="ltr">{r.model}</td>
                    <td className="py-2 text-[var(--text-secondary)]">{r.messages}</td>
                    <td className="py-2 text-[var(--text-secondary)] font-mono" dir="ltr">{fmtNum(r.tokens)}</td>
                    <td className="py-2 text-[var(--text-secondary)] font-mono" dir="ltr">
                      {r.genCount ? `${Math.round(r.genSeconds / r.genCount)}s` : '—'}
                    </td>
                    <td className="py-2 text-emerald-400">{r.up || ''}</td>
                    <td className="py-2 text-red-400">{r.down || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
