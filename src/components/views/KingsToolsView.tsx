import { Crown, ShieldCheck, Gauge, Save, LogIn, Download } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import GovernanceCouncil from '@/components/settings/GovernanceCouncil';

export default function KingsToolsView() {
  const { currentLanguage, setActiveView } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';

  const TOOLS = [
    {
      icon: Gauge, view: 'settings' as const,
      ar: 'فاحص الموديلات', en: 'Model tester',
      descAr: '⚡ جنب كل موديل — فحص اتصال حقيقي بأقل من 10 ثواني', descEn: '⚡ per-model real ping in <10s',
    },
    {
      icon: ShieldCheck, view: 'agents' as const,
      ar: 'حالة السرب وحورس', en: 'Swarm & Horus status',
      descAr: 'متابعة حية للوكلاء وسجل محاولاتهم', descEn: 'Live agent statuses and retry logs',
    },
    {
      icon: Save, view: 'storage' as const,
      ar: 'النسخ الاحتياطي', en: 'Backup',
      descAr: 'تصدير كل بياناتك JSON + صيانة التخزين', descEn: 'Export all data as JSON + storage maintenance',
    },
    {
      icon: LogIn, view: 'admin' as const,
      ar: 'لوحة الإدارة', en: 'Admin panel',
      descAr: 'إدارة النظام والمستخدمين (للأدمن فقط)', descEn: 'System administration (admins only)',
    },
    {
      icon: Download, view: 'history' as const,
      ar: 'سجل الأحداث', en: 'Event log',
      descAr: 'دفتر اليوميات الصاعد — كل حاجة متسجلة', descEn: 'Append-only journal — everything is logged',
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold font-[var(--font-display)] text-[var(--text-primary)] flex items-center gap-2">
          <Crown size={18} className="text-amber-400" />
          {isRtl ? "أدوات الملك" : "King's Tools"}
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          {isRtl ? 'العدة الثقيلة — حوكمة، أمان، وصيانة' : 'The heavy artillery — governance, security and maintenance'}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {TOOLS.map((t) => (
          <button
            key={t.en}
            onClick={() => setActiveView(t.view)}
            className="glass rounded-xl p-4 text-start space-y-1.5 hover:border-amber-400/30 hover:bg-amber-400/[0.03] transition-all cursor-pointer group"
          >
            <t.icon size={16} className="text-amber-400 group-hover:scale-110 transition-transform" />
            <h3 className="text-xs font-bold text-[var(--text-primary)]">{isRtl ? t.ar : t.en}</h3>
            <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">{isRtl ? t.descAr : t.descEn}</p>
          </button>
        ))}
      </div>

      {/* Governance council — embedded */}
      <div className="space-y-2">
        <h2 className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
          <Crown size={13} className="text-amber-400" />
          {isRtl ? 'مجلس الحوكمة وتطهير الذاكرة' : 'Governance council & memory purge'}
        </h2>
        <GovernanceCouncil />
      </div>
    </div>
  );
}
