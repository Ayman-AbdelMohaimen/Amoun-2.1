import { useState } from 'react';
import { Plus, Trash2, Play, LayoutTemplate, Copy, Check } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';

const ICON_CHOICES = ['⚡', '📝', '💡', '🧪', '📊', '🎯', '🧠', '🛠️', '✉️', '🔍'];
const COLOR_CHOICES = ['#fbbf24', '#34d399', '#a78bfa', '#f472b6', '#38bdf8'];

export default function TemplatesView() {
  const { promptTemplates, addTemplate, deleteTemplate, useTemplate, currentLanguage } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [icon, setIcon] = useState('⚡');
  const [color, setColor] = useState(COLOR_CHOICES[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!name.trim() || !content.trim()) return;
    addTemplate({ name: name.trim(), nameEn: name.trim(), content: content.trim(), icon, color });
    setName(''); setContent(''); setIcon('⚡'); setColor(COLOR_CHOICES[0]); setShowForm(false);
  };

  const copyContent = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-[var(--font-display)] text-[var(--text-primary)]">
            {isRtl ? '⚡ القوالب' : '⚡ Templates'}
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {isRtl ? 'برومبتات جاهزة — بضغطة واحدة تبقى محادثة شغالة' : 'Ready prompts — one click turns into a live chat'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-400)]/20 text-[var(--accent-400)] text-xs hover:bg-[var(--accent-400)]/30 cursor-pointer"
        >
          <Plus size={14} /> {isRtl ? 'قالب جديد' : 'New Template'}
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-xl p-4 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isRtl ? 'اسم القالب' : 'Template name'}
            className="w-full bg-white/5 border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent-400)] text-[var(--text-primary)]"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isRtl ? 'نص البرومبت…' : 'Prompt content…'}
            rows={4}
            className="w-full bg-white/5 border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent-400)] text-[var(--text-primary)] resize-none"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1">
              {ICON_CHOICES.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={'w-8 h-8 rounded-lg text-sm transition-colors cursor-pointer ' + (icon === ic ? 'bg-white/15' : 'hover:bg-white/5')}
                >
                  {ic}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {COLOR_CHOICES.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={'w-6 h-6 rounded-full transition-transform cursor-pointer ' + (color === c ? 'scale-110 ring-2 ring-white/40' : '')}
                  style={{ backgroundColor: c }}
                  aria-label={`color ${c}`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 rounded-lg bg-[var(--accent-400)] text-black text-xs font-medium hover:brightness-110 cursor-pointer">
              {isRtl ? 'حفظ القالب' : 'Save'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-xs text-[var(--text-muted)] hover:bg-white/5 cursor-pointer">
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {promptTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <LayoutTemplate size={40} className="text-[var(--text-dim)] mb-3" />
          <p className="text-sm text-[var(--text-muted)]">{isRtl ? 'لا توجد قوالب بعد' : 'No templates yet'}</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {promptTemplates.map((t) => (
            <div key={t.id} className="glass rounded-xl p-4 flex flex-col gap-2 group hover:border-[var(--accent-400)]/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                    style={{ backgroundColor: `${t.color}22`, border: `1px solid ${t.color}44` }}
                  >
                    {t.icon}
                  </span>
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">{t.name}</h3>
                </div>
                {t.isBuiltIn && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-[var(--text-dim)]">
                    {isRtl ? 'مدمج' : 'Built-in'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed flex-1">{t.content}</p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => useTemplate(t.id)}
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-[var(--accent-400)]/15 text-[var(--accent-400)] hover:bg-[var(--accent-400)]/25 transition-colors cursor-pointer"
                >
                  <Play size={11} /> {isRtl ? 'تشغيل' : 'Run'}
                </button>
                <button
                  onClick={() => copyContent(t.id, t.content)}
                  className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors cursor-pointer"
                  title={isRtl ? 'نسخ' : 'Copy'}
                >
                  {copiedId === t.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
                {!t.isBuiltIn && (
                  <button
                    onClick={() => deleteTemplate(t.id)}
                    className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer ms-auto opacity-0 group-hover:opacity-100"
                    title={isRtl ? 'حذف' : 'Delete'}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
