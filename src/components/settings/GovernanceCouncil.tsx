import { useState, useRef } from 'react';
import {
  Trash2, AlertTriangle, Brain, FolderKanban, FileCode2, Landmark, RotateCcw,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';

// ═══════════════════════════════════════════════════════════════════
// GOVERNANCE COUNCIL — Memory Optimizer & Reset (مجلس الحوكمة)
// Progressive purification: 4 levels, each with 2-step confirmation.
// Design spirit: Amon-beta governance cards — red danger theme.
// ═══════════════════════════════════════════════════════════════════

const ARM_TIMEOUT_MS = 4000;

export default function GovernanceCouncil() {
  const {
    currentLanguage,
    purgeGeneralChats, purgeProjects, purgeArtifacts, factoryReset,
  } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';

  const [armedId, setArmedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const levels = [
    {
      id: 'l1',
      badge: isRtl ? 'المستوى 1' : 'Level 1',
      icon: Brain,
      titleAr: 'مسح محادثات العصف الذهني العامة',
      titleEn: 'Purge General Brainstorm Chats',
      descAr: 'يقوم بمسح سجل محادثات العصف الذهني العامة فقط. يتم عزل وحماية بيئات ومحادثات المشاريع تماماً.',
      descEn: 'Clears general brainstorm chat history only. Project environments and their sessions remain fully isolated.',
      btnAr: 'تطهير الدردشات العامة',
      btnEn: 'Purge General Chats',
      run: () => {
        const n = purgeGeneralChats();
        return isRtl ? `✅ تم مسح ${n} محادثة عامة` : `✅ Purged ${n} general chat(s)`;
      },
    },
    {
      id: 'l2',
      badge: isRtl ? 'المستوى 2' : 'Level 2',
      icon: FolderKanban,
      titleAr: 'تطهير مصفوفة المشاريع وجلساتها',
      titleEn: 'Purge Projects Matrix',
      descAr: 'يقوم بتدمير كافة سجلات المشاريع الحالية وجلسات محادثاتها المعزولة نهائياً من الذاكرة المحلية.',
      descEn: 'Destroys all current project records and their isolated sessions from local memory.',
      btnAr: 'مسح مصفوفة المشاريع',
      btnEn: 'Wipe Projects Matrix',
      run: () => {
        const n = purgeProjects();
        return isRtl ? `✅ تم مسح ${n} مشروع وجلساته` : `✅ Purged ${n} project(s) + sessions`;
      },
    },
    {
      id: 'l3',
      badge: isRtl ? 'المستوى 3' : 'Level 3',
      icon: FileCode2,
      titleAr: 'تصفير برديات الأكواد والملفات المكتوبة',
      titleEn: 'Reset Artifacts & Generated Files',
      descAr: 'يقوم بحذف كافة الملفات والأكواد المولدة والبرديات نهائياً من IndexedDB لتخفيف مساحة المتصفح.',
      descEn: 'Permanently deletes all generated files and code artifacts from IndexedDB to free browser space.',
      btnAr: 'تطهير الأكواد والملفات',
      btnEn: 'Purge Codes & Files',
      run: async () => {
        const n = await purgeArtifacts();
        return isRtl ? `✅ تم مسح ${n} ملف/بردية` : `✅ Purged ${n} artifact(s)`;
      },
    },
    {
      id: 'max',
      badge: isRtl ? 'المستوى الأقصى 🚨' : 'MAX 🚨',
      max: true,
      icon: AlertTriangle,
      titleAr: 'ضبط المصنع الشامل والآمن',
      titleEn: 'Full Safe Factory Reset',
      descAr: 'يطهر النظام بالكامل كأنك مستخدم جديد. يمسح الأكواد والمشاريع والدردشات، ويحافظ فقط على بيانات دخولك ومفاتيحك.',
      descEn: 'Purges the entire system like a fresh user. Wipes codes, projects, and chats — keeps only your login data and API keys.',
      btnAr: 'إعادة تعيين المصنع الشامل',
      btnEn: 'Full Factory Reset',
      run: async () => {
        await factoryReset();
        setTimeout(() => window.location.reload(), 1200);
        return isRtl ? '✅ تم ضبط المصنع — جاري إعادة التشغيل…' : '✅ Factory reset — reloading…';
      },
    },
  ];

  const handleFire = async (id: string, run: () => string | Promise<string>) => {
    // Two-step confirmation: first click arms, second click (within timeout) fires
    if (armedId !== id) {
      setArmedId(id);
      if (armTimer.current) clearTimeout(armTimer.current);
      armTimer.current = setTimeout(() => setArmedId(null), ARM_TIMEOUT_MS);
      return;
    }
    if (armTimer.current) clearTimeout(armTimer.current);
    setArmedId(null);
    setBusyId(id);
    try {
      const msg = await run();
      setResult(msg);
    } catch {
      setResult(isRtl ? '❌ حدث خطأ أثناء التطهير' : '❌ Purge failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="glass rounded-2xl p-5 border border-red-500/20 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Landmark size={16} className="text-red-400" />
        <h2 className="text-sm font-bold text-[var(--text-primary)]">
          {isRtl ? 'مجلس الحوكمة وتطهير موارد الذاكرة' : 'Governance Council — Memory Optimizer & Reset'}
        </h2>
      </div>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
        {isRtl
          ? 'تصفير تدرجي ذكي للحفاظ على موارد الجهاز والذاكرة الداخلية.'
          : 'Smart progressive resets to preserve device resources and internal memory.'}
      </p>

      {/* Warning banner */}
      <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 flex items-start gap-2">
        <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-red-300/90 leading-relaxed">
          {isRtl
            ? '⚠️ يرجى استخدام الخيارات بحذر. يتيح لك صفر خيار تصفير متدرج للحفاظ على الموارد والسرعة القصوى للنظام دون فقدان معلومات حسابك الإداري.'
            : '⚠️ Use with caution. Progressive reset levels preserve system resources and speed without losing your administrative account data.'}
        </p>
      </div>

      {/* Level cards — 2-col grid like the legacy governance design */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {levels.map((lv) => {
          const isArmed = armedId === lv.id;
          const isBusy = busyId === lv.id;
          return (
            <div
              key={lv.id}
              className={`rounded-xl p-4 flex flex-col gap-2 border ${
                lv.max
                  ? 'border-red-500/40 bg-red-500/8'
                  : 'border-white/8 bg-white/2'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                    lv.max
                      ? 'bg-red-500 text-white'
                      : 'bg-red-500/15 text-red-400 border border-red-500/25'
                  }`}
                >
                  {lv.badge}
                </span>
                <lv.icon size={15} className={lv.max ? 'text-red-400' : 'text-[var(--text-dim)]'} />
              </div>

              <h3 className={`text-xs font-bold ${lv.max ? 'text-red-300' : 'text-[var(--text-primary)]'}`}>
                {isRtl ? lv.titleAr : lv.titleEn}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed flex-1">
                {isRtl ? lv.descAr : lv.descEn}
              </p>

              <button
                onClick={() => handleFire(lv.id, lv.run)}
                disabled={isBusy}
                className={`mt-1 w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 ${
                  lv.max
                    ? 'bg-red-500 text-white hover:brightness-110 shadow-[0_0_20px_rgba(239,68,68,0.35)]'
                    : isArmed
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'border border-red-500/40 text-red-400 hover:bg-red-500/15'
                }`}
              >
                {isBusy ? (
                  <>
                    <RotateCcw size={13} className="animate-spin" />
                    <span>{isRtl ? 'جاري التطهير…' : 'Purging…'}</span>
                  </>
                ) : isArmed ? (
                  <span>{isRtl ? '⚠️ متأكد؟ اضغط مرة أخرى للتأكيد' : '⚠️ Sure? Click again to confirm'}</span>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>{isRtl ? lv.btnAr : lv.btnEn}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Result feedback */}
      {result && (
        <p className="text-xs text-emerald-400 font-medium">{result}</p>
      )}

      {/* Footer note — legacy governance spirit */}
      <div className="pt-2 border-t border-white/5 text-center">
        <p className="text-[10px] text-[var(--text-dim)] leading-relaxed">
          {isRtl
            ? '🔒 جميع العمليات نهائية وتتم محلياً على جهازك بالكامل — سجل الأحداث يُمسح في المستوى الأقصى فقط'
            : '🔒 All operations are final and fully local — the event log is only cleared at MAX level'}
        </p>
        <p className="text-[9px] text-[var(--text-dim)] opacity-60 mt-1 font-mono" dir="ltr">
          Wazeer OS Governance · v2.1 · 100MillionDEV Core
        </p>
      </div>
    </div>
  );
}
