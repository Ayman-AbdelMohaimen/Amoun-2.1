/**
 * Wazeer OS v2.1 — About Page
 * Public contributor cards. Admin-only edit.
 * Green Code: data from IndexedDB `contributors` store.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Linkedin, Facebook, Twitter, Github, Plus, Pencil, Trash2, X, Save, Users } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { wazeerDB } from '@/lib/db';
import { ADMIN_EMAILS } from '@/constants';
import type { Contributor } from '@/types';

// ── Contributor Card ──────────────────────────────────────────────

function ContributorCard({ c, isAdmin, onEdit, onDelete }: {
  c: Contributor;
  isAdmin: boolean;
  onEdit: (c: Contributor) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 flex flex-col items-center gap-3 text-center relative group"
    >
      {/* Admin actions */}
      {isAdmin && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(c)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-[var(--accent-500)]/20 text-[var(--text-dim)] hover:text-[var(--accent-400)] transition-colors cursor-pointer"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(c.id)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 text-[var(--text-dim)] hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      {/* Avatar */}
      {c.avatarUrl ? (
        <img
          src={c.avatarUrl}
          alt={c.name}
          className="w-20 h-20 rounded-full object-cover border-2 border-[var(--accent-500)]/30 shadow-lg"
        />
      ) : (
        <div className="w-20 h-20 rounded-full bg-[var(--accent-500)]/10 border-2 border-[var(--accent-500)]/30 flex items-center justify-center text-3xl">
          {c.name.charAt(0)}
        </div>
      )}

      <div>
        <h3 className="font-bold text-[var(--text-primary)] text-base">{c.name}</h3>
        <p className="text-xs text-[var(--accent-400)] font-medium mt-0.5">{c.role}</p>
        {c.bio && <p className="text-xs text-[var(--text-dim)] mt-1 leading-relaxed">{c.bio}</p>}
      </div>

      {/* Social links */}
      <div className="flex gap-2 mt-1">
        {c.linkedin && (
          <a href={c.linkedin} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 text-[var(--text-dim)] hover:text-blue-400 transition-colors">
            <Linkedin size={14} />
          </a>
        )}
        {c.facebook && (
          <a href={c.facebook} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-600/20 text-[var(--text-dim)] hover:text-blue-500 transition-colors">
            <Facebook size={14} />
          </a>
        )}
        {c.twitter && (
          <a href={c.twitter} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-sky-500/20 text-[var(--text-dim)] hover:text-sky-400 transition-colors">
            <Twitter size={14} />
          </a>
        )}
        {c.github && (
          <a href={c.github} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/20 text-[var(--text-dim)] hover:text-white transition-colors">
            <Github size={14} />
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ── Contributor Modal (Admin only) ────────────────────────────────

const EMPTY: Omit<Contributor, 'id'> = {
  name: '', role: '', avatarUrl: '', bio: '',
  linkedin: '', facebook: '', twitter: '', github: '', order: 0,
};

function ContributorModal({ contributor, onSave, onClose }: {
  contributor: Contributor | null;
  onSave: (c: Contributor) => void;
  onClose: () => void;
}) {
  const isRtl = useWorkspaceStore(s => s.currentLanguage) === 'ar';
  const [form, setForm] = useState<Omit<Contributor, 'id'>>(
    contributor ? { ...contributor } : { ...EMPTY }
  );

  const handleSave = () => {
    if (!form.name.trim() || !form.role.trim()) return;
    onSave({
      id: contributor?.id ?? crypto.randomUUID(),
      ...form,
      order: Number(form.order) || 0,
    });
  };

  const F = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const inputCls = "w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-dim)] text-sm focus:outline-none focus:border-[var(--accent-500)] transition-colors";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass glow-lg rounded-2xl p-6 w-full max-w-md space-y-4"
        onClick={e => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[var(--text-primary)]">
            {contributor ? (isRtl ? 'تعديل مساهم' : 'Edit Contributor') : (isRtl ? 'إضافة مساهم' : 'Add Contributor')}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-dim)] cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2.5">
          <input placeholder={isRtl ? 'الاسم *' : 'Name *'} value={form.name} onChange={F('name')} className={inputCls} />
          <input placeholder={isRtl ? 'الوظيفة *' : 'Role *'} value={form.role} onChange={F('role')} className={inputCls} />
          <input placeholder={isRtl ? 'رابط الصورة' : 'Avatar URL'} value={form.avatarUrl ?? ''} onChange={F('avatarUrl')} className={inputCls} dir="ltr" />
          <textarea placeholder={isRtl ? 'نبذة قصيرة' : 'Short bio'} value={form.bio ?? ''} onChange={F('bio')}
            rows={2} className={`${inputCls} resize-none`} />
          <input placeholder="LinkedIn URL" value={form.linkedin ?? ''} onChange={F('linkedin')} className={inputCls} dir="ltr" />
          <input placeholder="Facebook URL" value={form.facebook ?? ''} onChange={F('facebook')} className={inputCls} dir="ltr" />
          <input placeholder="X / Twitter URL" value={form.twitter ?? ''} onChange={F('twitter')} className={inputCls} dir="ltr" />
          <input placeholder="GitHub URL" value={form.github ?? ''} onChange={F('github')} className={inputCls} dir="ltr" />
          <input placeholder={isRtl ? 'الترتيب (رقم)' : 'Order (number)'} type="number" value={form.order ?? 0} onChange={F('order')} className={inputCls} />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={!form.name.trim() || !form.role.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--accent-500)] text-[var(--bg-outer)] font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save size={14} />
            {isRtl ? 'حفظ' : 'Save'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg bg-white/5 border border-[var(--border)] text-[var(--text-dim)] text-sm hover:bg-white/10 transition-colors cursor-pointer">
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main About View ───────────────────────────────────────────────

export default function AboutView() {
  const { user, currentLanguage } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';
  const isAdmin = !!(user?.role === 'admin' || (user?.email && ADMIN_EMAILS.includes(user.email)));

  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Contributor | null>(null);

  const load = async () => {
    await wazeerDB.init();
    const all = await wazeerDB.getAll<Contributor>('contributors');
    setContributors(all.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (c: Contributor) => {
    await wazeerDB.init();
    await wazeerDB.put('contributors', c);
    setModalOpen(false);
    setEditTarget(null);
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isRtl ? 'حذف المساهم؟' : 'Delete contributor?')) return;
    await wazeerDB.init();
    await wazeerDB.delete('contributors', id);
    await load();
  };

  const openAdd = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (c: Contributor) => { setEditTarget(c); setModalOpen(true); };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/20 text-[var(--accent-400)] text-sm font-medium">
            <Info size={14} />
            {isRtl ? 'عن المشروع' : 'About'}
          </div>
          <h1 className="text-3xl font-bold font-[var(--font-display)] text-[var(--text-primary)]">
            𓂀 {isRtl ? 'وزير OS' : 'Wazeer OS'}
          </h1>
          <p className="text-[var(--text-muted)] max-w-xl mx-auto text-sm leading-relaxed">
            {isRtl
              ? 'منصة الذكاء الاصطناعي المصرية — تحويل الأفكار إلى مهام منظمة. مبنية بحب من فريق 100MillionDEV.'
              : 'Egyptian AI Platform — turning ideas into organized tasks. Built with ❤️ by the 100MillionDEV team.'}
          </p>
        </motion.div>

        {/* Contributors section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
              <Users size={18} className="text-[var(--accent-400)]" />
              {isRtl ? 'فريق المساهمين' : 'Contributors'}
            </h2>
            {isAdmin && (
              <button
                onClick={openAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-500)]/10 border border-[var(--accent-500)]/20 text-[var(--accent-400)] text-xs font-medium hover:bg-[var(--accent-500)]/20 transition-colors cursor-pointer"
              >
                <Plus size={13} />
                {isRtl ? 'إضافة مساهم' : 'Add Contributor'}
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12 text-[var(--text-dim)] text-sm">
              {isRtl ? 'جارٍ التحميل...' : 'Loading...'}
            </div>
          ) : contributors.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center space-y-3">
              <div className="text-4xl">👥</div>
              <p className="text-[var(--text-muted)] text-sm">
                {isRtl ? 'لا يوجد مساهمون بعد' : 'No contributors yet'}
              </p>
              {isAdmin && (
                <button
                  onClick={openAdd}
                  className="mx-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-500)] text-[var(--bg-outer)] text-sm font-semibold hover:brightness-110 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  {isRtl ? 'أضف أول مساهم' : 'Add first contributor'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {contributors.map(c => (
                  <ContributorCard
                    key={c.id}
                    c={c}
                    isAdmin={isAdmin}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer credit */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-[var(--text-dim)] pb-4"
        >
          صُنع بـ ❤️ بواسطة العرآب | 100MillionDEV.com — 𓂀
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <ContributorModal
            contributor={editTarget}
            onSave={handleSave}
            onClose={() => { setModalOpen(false); setEditTarget(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
