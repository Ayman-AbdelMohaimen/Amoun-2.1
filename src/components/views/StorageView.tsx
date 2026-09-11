import { useEffect, useState } from 'react';
import { HardDrive, Download, Trash2, ShieldAlert, Database } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { wazeerDB } from '@/lib/db';

const TRACKED_STORES = ['config', 'state', 'logs', 'artifacts', 'session_events', 'userMemory'] as const;

export default function StorageView() {
  const { chatSessions, tasks, projects, customModels, promptTemplates, currentLanguage } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';
  const [quota, setQuota] = useState<{ usage: number; total: number } | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [blobKB, setBlobKB] = useState<number>(0);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Real browser quota (Chrome/Edge report usage for the origin)
    navigator.storage?.estimate?.().then((e) => {
      setQuota({ usage: e.usage ?? 0, total: e.quota ?? 0 });
    }).catch(() => undefined);

    // Record counts per IndexedDB store
    Promise.all(
      TRACKED_STORES.map((s) =>
        wazeerDB.getAll<unknown>(s).then((rows) => [s, rows.length] as const).catch(() => [s, 0] as const),
      ),
    ).then((pairs) => setCounts(Object.fromEntries(pairs)));

    // The workspace_state blob — the silent killer at scale (Plan Phase 3.9)
    const raw = localStorage.getItem('workspace_state');
    setBlobKB(raw ? Math.round(new Blob([raw]).size / 1024) : 0);
  }, []);

  const fmtMB = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  const pct = quota && quota.total ? Math.min(100, (quota.usage / quota.total) * 100) : 0;

  const exportBackup = () => {
    setBusy(true);
    try {
      const backup = {
        exportedAt: new Date().toISOString(),
        app: 'Wazeer OS v2.2',
        state: { chatSessions, tasks, projects, customModels, promptTemplates },
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wazeer-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  const purgeOldEvents = async () => {
    setBusy(true);
    try {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000; // EVENT_RETENTION_DAYS
      const events = await wazeerDB.getAll<{ id?: number; timestamp: string }>('session_events');
      const old = events.filter((e) => new Date(e.timestamp).getTime() < weekAgo && e.id != null);
      for (const e of old) await wazeerDB.delete('session_events', String(e.id!)).catch(() => {});
      setCounts((c) => ({ ...c, session_events: (c.session_events ?? 0) - old.length }));
    } finally {
      setBusy(false);
    }
  };

  const wipeAll = async () => {
    setBusy(true);
    try {
      for (const s of TRACKED_STORES) await wazeerDB.clear(s);
      localStorage.removeItem('workspace_state');
      setCounts({});
      setConfirmWipe(false);
      window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  const STORE_LABELS: Record<string, string> = {
    config: isRtl ? 'الإعدادات والمفاتيح' : 'Config & keys',
    state: isRtl ? 'حالة النظام' : 'System state',
    logs: isRtl ? 'السجلات' : 'Logs',
    artifacts: isRtl ? 'الأرتيفاكتس' : 'Artifacts',
    session_events: isRtl ? 'سجل الأحداث' : 'Event log',
    userMemory: isRtl ? 'ذاكرة أمون' : 'User memory',
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold font-[var(--font-display)] text-[var(--text-primary)]">
          {isRtl ? '💾 التخزين' : '💾 Storage'}
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          {isRtl ? 'كل بياناتك محلية على جهازك — indexedDB "Monmamar"' : 'All data stays local — IndexedDB "Monmamar"'}
        </p>
      </div>

      {/* Quota bar */}
      <div className="glass rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <HardDrive size={13} className="text-[var(--accent-400)]" />
            {isRtl ? 'مساحة المتصفح المستخدمة' : 'Browser storage used'}
          </span>
          <span className="font-mono text-[var(--text-dim)]" dir="ltr">
            {quota ? `${fmtMB(quota.usage)} / ${fmtMB(quota.total)}` : '—'}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-500)] to-[var(--accent-300)] transition-all"
            style={{ width: `${Math.max(1.5, pct)}%` }}
          />
        </div>
      </div>

      {/* Store counts */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {TRACKED_STORES.map((s) => (
          <div key={s} className="glass rounded-xl p-3.5 flex items-center gap-3">
            <Database size={15} className="text-[var(--text-dim)] shrink-0" />
            <div>
              <p className="text-sm font-bold font-mono text-[var(--text-primary)]" dir="ltr">{counts[s] ?? 0}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{STORE_LABELS[s]}</p>
            </div>
          </div>
        ))}
      </div>

      {/* workspace_state blob health */}
      <div className={'glass rounded-xl p-4 flex items-center justify-between gap-3 ' + (blobKB > 1024 ? 'border-amber-500/30' : '')}>
        <div>
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            {isRtl ? 'حجم حالة النظام (workspace_state)' : 'workspace_state blob size'}
          </p>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
            {isRtl
              ? blobKB > 1024
                ? 'عالي — تقسيم الـ blob مجدول في Phase 2/3'
                : 'صحي — بيتم حفظه بعد كل تغيير مهم'
              : blobKB > 1024 ? 'High — blob splitting is on the roadmap' : 'Healthy'}
          </p>
        </div>
        <span
          className={
            'text-lg font-bold font-mono shrink-0 ' + (blobKB > 1024 ? 'text-amber-400' : 'text-emerald-400')
          }
          dir="ltr"
        >
          {blobKB} KB
        </span>
      </div>

      {/* Actions */}
      <div className="glass rounded-xl p-4 space-y-3">
        <h2 className="text-xs font-medium text-[var(--text-secondary)]">{isRtl ? 'أدوات الصيانة' : 'Maintenance'}</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportBackup}
            disabled={busy}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-[var(--accent-400)]/15 text-[var(--accent-400)] hover:bg-[var(--accent-400)]/25 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download size={13} /> {isRtl ? 'تصدير نسخة احتياطية (JSON)' : 'Export backup (JSON)'}
          </button>
          <button
            onClick={purgeOldEvents}
            disabled={busy}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={13} /> {isRtl ? 'تنضيف الأحداث الأقدم من 7 أيام' : 'Purge events older than 7 days'}
          </button>
        </div>

        {/* Danger zone — two-step confirmation like the governance council */}
        {!confirmWipe ? (
          <button
            onClick={() => setConfirmWipe(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg text-red-400/80 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <ShieldAlert size={13} /> {isRtl ? 'مسح كل البيانات المحلية…' : 'Wipe all local data…'}
          </button>
        ) : (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 space-y-2">
            <p className="text-xs text-red-300">
              {isRtl
                ? '⚠️ ده هيمسح كل الجلسات والذاكرة والمفاتيح المحلية — مفيش رجوع بعد كده. متأكد؟'
                : '⚠️ This wipes all sessions, memory and local keys — irreversible. Sure?'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={wipeAll}
                disabled={busy}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 cursor-pointer disabled:opacity-50"
              >
                {isRtl ? 'أيوه، امسح كل حاجة' : 'Yes, wipe everything'}
              </button>
              <button
                onClick={() => setConfirmWipe(false)}
                className="text-xs px-3 py-1.5 rounded-lg text-[var(--text-muted)] hover:bg-white/5 cursor-pointer"
              >
                {isRtl ? 'لا، استنى' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
