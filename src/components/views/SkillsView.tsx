import { useState } from 'react';
import {
  ShieldCheck,
  BrainCircuit,
  ListChecks,
  CalendarClock,
  Volume2,
  ScrollText,
  Gauge,
  MessagesSquare,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { CHAT_MODES } from '@/constants';
import AddSkillModal from '@/components/skills/AddSkillModal';

const SKILLS = [
  {
    id: 'horus-guard',
    icon: ShieldCheck,
    live: true,
    ar: 'حورس الحارس — فحص أمان الكود',
    en: 'HorusGuard — code security scan',
    descAr: 'AST scanner بيفحص الكود المولد (إتاحة أنماط خطيرة + تسريب مفاتيح) قبل ما يتعرض',
    descEn: 'AST scanner checks generated code before display',
  },
  {
    id: 'amoun-memory',
    icon: BrainCircuit,
    live: true,
    ar: 'ذاكرة أمون',
    en: 'Amoun memory',
    descAr: 'استخراج تلقائي للذكريات مع إزالة تكرار بالتشابه 85% + مجلس حوكمة لتطهيرها',
    descEn: 'Automatic memory extraction with ~85% similarity dedup',
  },
  {
    id: 'task-extraction',
    icon: ListChecks,
    live: true,
    ar: 'استخراج المهام',
    en: 'Task extraction',
    descAr: 'بيطلع المهام من ردود الـ AI ويقترح إضافتها بموافقتك',
    descEn: 'Extracts tasks from AI replies with interactive confirmation',
  },
  {
    id: 'task-scheduler',
    icon: CalendarClock,
    live: true,
    ar: 'مجدول المهام',
    en: 'Task scheduler',
    descAr: 'كشف الـ provider لكل موديل تلقائياً + دعم الموديلات المخصصة',
    descEn: 'Correct provider detection incl. custom models',
  },
  {
    id: 'voice-tts',
    icon: Volume2,
    live: true,
    ar: 'الصوت (TTS)',
    en: 'Voice (TTS)',
    descAr: 'قراءة صوتية للردود بصوت ذكر أو أنثى — من إعدادات الصوت',
    descEn: 'Read replies aloud, male or female voice',
  },
  {
    id: 'append-event-log',
    icon: ScrollText,
    live: true,
    ar: 'سجل الأحداث الصاعد',
    en: 'Append-only event log',
    descAr: 'كل رسالة ورد وخطأ بيتسجل في indexedDB — أساس نمط DSH',
    descEn: 'Every message logged — DSH event-sourcing pattern',
  },
  {
    id: 'model-tester',
    icon: Gauge,
    live: true,
    ar: 'فاحص الموديلات',
    en: 'Model tester',
    descAr: '⚡ جنب كل موديل — فحص اتصال حقيقي خلال أقل من 10 ثواني',
    descEn: 'Per-model ⚡ ping with real errors in <10s',
  },
  {
    id: 'corrective-learning',
    icon: MessagesSquare,
    live: true,
    ar: 'التعلم التصحيحي',
    en: 'Corrective learning',
    descAr: '👍👎 على كل رد + وسوم سبب — أمون يتعلم من اللي مضايقك',
    descEn: '👍👎 ratings with reason tags feed corrective memory',
  },
];

function PhysicalToggle3D({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      dir="ltr"
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className="relative inline-flex items-center h-6 w-11 rounded-full px-0.5 transition-all duration-300 cursor-pointer shrink-0 select-none"
      style={{
        background: checked
          ? 'linear-gradient(145deg, var(--accent-500), var(--accent-600))'
          : 'linear-gradient(145deg, #2b2b36, #17171f)',
        boxShadow: checked
          ? 'inset 0 2px 4px rgba(0,0,0,0.35), 0 0 10px var(--accent-glow)'
          : 'inset 0 2px 4px rgba(0,0,0,0.65)',
      }}
      role="switch"
      aria-checked={checked}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 pointer-events-none"
        style={{
          left: checked ? '22px' : '2px',
          background: checked
            ? 'linear-gradient(145deg, #ffffff, #b8c4cf)'
            : 'linear-gradient(145deg, #8a8a96, #3d3d48)',
          boxShadow: '0 2px 5px rgba(0,0,0,0.5), inset 0 -1px 2px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.6)',
        }}
      />
    </button>
  );
}

export default function SkillsView() {
  const { currentLanguage, customSkills, enabledSkillIds, toggleSkill, deleteCustomSkill } = useWorkspaceStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const isRtl = currentLanguage === 'ar';

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-[var(--font-display)] text-[var(--text-primary)]">
            {isRtl ? '🧠 المهارات والقدرات' : '🧠 Skills & Capabilities'}
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {isRtl
              ? 'القدرات الفعالة للنظام والمهارات المخصصة — مفاتيح تحكم فيزيائية 3D وتوجيهات حية'
              : 'Active system capabilities and custom prompt skills with 3D tactile controls'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent-500)] hover:bg-[var(--accent-400)] text-black font-bold text-xs transition-all shadow-md hover:shadow-lg cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>{isRtl ? 'إضافة مهارة مخصصة' : 'Add Custom Skill'}</span>
        </button>
      </div>

      {/* Built-in Skills */}
      <div>
        <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
          {isRtl ? 'قدرات النظام الأساسية' : 'Core System Capabilities'}
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {SKILLS.map((s) => {
            const isEnabled = enabledSkillIds.includes(s.id);
            return (
              <div
                key={s.id}
                onClick={() => toggleSkill(s.id)}
                className={`glass rounded-xl p-4 space-y-2 transition-all cursor-pointer border ${
                  isEnabled ? 'hover:border-[var(--accent-400)]/30' : 'opacity-60 border-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      isEnabled ? 'bg-[var(--accent-500)]/15 text-[var(--accent-400)]' : 'bg-white/5 text-[var(--text-dim)]'
                    }`}>
                      <s.icon size={17} />
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium transition-colors ${
                      isEnabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-[var(--text-dim)]'
                    }`}>
                      {isEnabled ? (isRtl ? 'شغالة ✓' : 'Live ✓') : (isRtl ? 'معطلة' : 'Off')}
                    </span>
                  </div>
                  <PhysicalToggle3D checked={isEnabled} onChange={() => toggleSkill(s.id)} />
                </div>
                <h3 className="text-xs font-bold text-[var(--text-primary)] leading-snug">{isRtl ? s.ar : s.en}</h3>
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">{isRtl ? s.descAr : s.descEn}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Skills Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-[var(--accent-400)]" />
            <span>{isRtl ? 'المهارات المخصصة المحقونة' : 'Custom Injected Skills'}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-dim)] font-mono">
              {customSkills.length}
            </span>
          </h2>
        </div>

        {customSkills.length === 0 ? (
          <div className="glass rounded-xl p-5 border border-dashed border-white/10 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-[var(--text-dim)]">
              <Sparkles size={18} />
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-medium">
              {isRtl ? 'لا توجد مهارات مخصصة بعد' : 'No custom skills yet'}
            </p>
            <p className="text-[11px] text-[var(--text-dim)] max-w-md mx-auto">
              {isRtl
                ? 'أنشئ مهارات مخصصة بتوجيهات برومبت محددة تُحقن تلقائياً في سياق أمون عند تفعيلها.'
                : 'Create custom skills with tailored prompt instructions automatically injected into Amoun context.'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-[var(--accent-400)] transition-colors cursor-pointer mt-1"
            >
              <Plus size={13} />
              <span>{isRtl ? 'إنشاء أول مهارة' : 'Create First Skill'}</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {customSkills.map((cs) => {
              const isEnabled = cs.enabled && enabledSkillIds.includes(cs.id);
              return (
                <div
                  key={cs.id}
                  className={`glass rounded-xl p-4 space-y-2.5 hover:border-[var(--accent-400)]/25 transition-all relative group border ${
                    isEnabled ? 'border-white/10' : 'opacity-60 border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg transition-colors ${
                        isEnabled ? 'bg-[var(--accent-500)]/15 text-[var(--accent-400)]' : 'bg-white/5 text-[var(--text-dim)]'
                      }`}>
                        <Sparkles size={17} />
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                        isEnabled
                          ? 'bg-[var(--accent-500)]/15 text-[var(--accent-300)] border border-[var(--accent-500)]/20'
                          : 'bg-white/5 text-[var(--text-dim)] border border-white/5'
                      }`}>
                        {isEnabled ? (isRtl ? 'مخصصة — نشطة' : 'Custom — Active') : (isRtl ? 'معطلة' : 'Disabled')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCustomSkill(cs.id);
                        }}
                        className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                        title={isRtl ? 'حذف المهارة' : 'Delete Skill'}
                      >
                        <Trash2 size={14} />
                      </button>
                      <PhysicalToggle3D checked={isEnabled} onChange={() => toggleSkill(cs.id)} />
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-[var(--text-primary)] leading-snug">
                    {isRtl ? cs.nameAr : cs.nameEn}
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                    {isRtl ? cs.descAr : cs.descEn}
                  </p>
                  {cs.promptSnippet && (
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[9px] text-[var(--text-dim)] font-mono line-clamp-2 bg-black/25 p-1.5 rounded-md border border-white/5">
                        {cs.promptSnippet}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat modes */}
      <div className="glass rounded-xl p-4">
        <h2 className="text-xs font-medium text-[var(--text-secondary)] mb-3">
          {isRtl ? 'أنماط المحادثة — ببرومبت نظام مختلف لكل نمط' : 'Chat modes — distinct system prompt per mode'}
        </h2>
        <div className="flex flex-wrap gap-2">
          {CHAT_MODES.map((m) => (
            <span key={m.id} className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-[var(--border)] text-[var(--text-secondary)]">
              <span>{m.icon}</span> {isRtl ? m.labelAr : m.labelEn}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-[var(--text-dim)] mt-3">
          {isRtl
            ? 'أنماط MD مستقلة (الوزير الصامت · بحث علمي · تعليم) مجدولة في Phase 2.2'
            : 'Standalone MD modes (Silent Minister · Research · Teaching) are scheduled for Phase 2.2'}
        </p>
      </div>

      {/* Modal */}
      <AddSkillModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
