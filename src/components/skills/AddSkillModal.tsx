import { useState } from 'react';
import { X, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddSkillModal({ isOpen, onClose }: AddSkillModalProps) {
  const { addCustomSkill, currentLanguage } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [promptSnippet, setPromptSnippet] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() && !nameEn.trim()) {
      setError(isRtl ? 'يرجى إدخال اسم المهارة' : 'Please enter a skill name');
      return;
    }
    if (!promptSnippet.trim()) {
      setError(isRtl ? 'يرجى إدخال توجيهات المهارة للذكاء الاصطناعي' : 'Please enter prompt instructions');
      return;
    }

    addCustomSkill({
      nameAr: nameAr.trim() || nameEn.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      descAr: descAr.trim() || descEn.trim(),
      descEn: descEn.trim() || descAr.trim(),
      promptSnippet: promptSnippet.trim(),
      enabled: true,
    });

    onClose();
    // Reset
    setNameAr('');
    setNameEn('');
    setDescAr('');
    setDescEn('');
    setPromptSnippet('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="glass glow-lg rounded-2xl border border-white/15 max-w-md w-full p-5 shadow-2xl bg-[#0e0e14] animate-in zoom-in-95 duration-150"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--accent-400)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)] font-[var(--font-display)]">
              {isRtl ? 'إضافة مهارة مخصصة جديدة' : 'Add New Custom Skill'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-dim)] hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 mt-4 text-xs">
          <div>
            <label className="text-[var(--text-secondary)] font-medium block mb-1">
              {isRtl ? 'اسم المهارة بالعربية' : 'Skill Name (Arabic)'}
            </label>
            <input
              type="text"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder={isRtl ? 'مثال: محلل السوق المالي' : 'e.g. Market Analyst'}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[var(--text-primary)] outline-none focus:border-[var(--accent-400)]"
              dir="auto"
            />
          </div>

          <div>
            <label className="text-[var(--text-secondary)] font-medium block mb-1">
              {isRtl ? 'اسم المهارة بالإنجليزية' : 'Skill Name (English)'}
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Financial Market Analyst"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[var(--text-primary)] outline-none focus:border-[var(--accent-400)]"
              dir="ltr"
            />
          </div>

          <div>
            <label className="text-[var(--text-secondary)] font-medium block mb-1">
              {isRtl ? 'وصف المهارة' : 'Description'}
            </label>
            <input
              type="text"
              value={descAr}
              onChange={(e) => setDescAr(e.target.value)}
              placeholder={isRtl ? 'نبذة عما تفعله هذه المهارة...' : 'Brief description...'}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[var(--text-primary)] outline-none focus:border-[var(--accent-400)]"
              dir="auto"
            />
          </div>

          <div>
            <label className="text-[var(--text-secondary)] font-medium block mb-1">
              {isRtl ? 'توجيهات البرومبت (Prompt Instructions)' : 'Prompt Instructions'}
            </label>
            <textarea
              value={promptSnippet}
              onChange={(e) => setPromptSnippet(e.target.value)}
              rows={3}
              placeholder={isRtl
                ? 'اكتب الإرشادات التي سيتم حقنها في برومبت النظام عند تفعيل المهارة...'
                : 'Write instructions that will be injected into system prompt when enabled...'}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[var(--text-primary)] outline-none focus:border-[var(--accent-400)] resize-none"
              dir="auto"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-[var(--text-muted)] hover:bg-white/5 cursor-pointer"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent-400)] text-black font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-md"
            >
              <Plus size={15} />
              <span>{isRtl ? 'إضافة المهارة' : 'Add Skill'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
