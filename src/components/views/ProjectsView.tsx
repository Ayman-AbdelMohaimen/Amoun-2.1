import { useState } from 'react';
import { Plus, Trash2, FolderOpen, FolderKanban } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { Project } from '@/types';

export default function ProjectsView() {
  const { projects, addProject, deleteProject, currentLanguage, setActiveView, createNewSession } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    addProject(name.trim(), summary.trim());
    setName(''); setSummary(''); setShowForm(false);
  };

  const openProject = (p: Project) => {
    // createNewSession already sets currentSessionId and switches to workspace
    createNewSession(p.id);
    setActiveView('workspace');
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-display)]">{isRtl ? 'المشاريع' : 'Projects'}</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-400)]/20 text-[var(--accent-400)] text-xs hover:bg-[var(--accent-400)]/30">
          <Plus size={14} /> {isRtl ? 'مشروع جديد' : 'New Project'}
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-xl p-4 space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder={isRtl ? 'اسم المشروع' : 'Project name'} className="w-full bg-white/5 border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent-400)] text-[var(--text-primary)]" />
          <textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder={isRtl ? 'وصف مختصر' : 'Brief summary'} rows={2} className="w-full bg-white/5 border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent-400)] text-[var(--text-primary)] resize-none" />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 rounded-lg bg-[var(--accent-400)] text-black text-xs font-medium hover:brightness-110">{isRtl ? 'إنشاء' : 'Create'}</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-xs text-[var(--text-muted)] hover:bg-white/5">{isRtl ? 'إلغاء' : 'Cancel'}</button>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <FolderKanban size={40} className="text-[var(--text-dim)] mb-3" />
          <p className="text-sm text-[var(--text-muted)]">{isRtl ? 'لا توجد مشاريع بعد' : 'No projects yet'}</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {projects.map(p => (
            <div key={p.id} className="glass rounded-xl p-4 hover:border-[var(--accent-400)]/30 transition-colors cursor-pointer group" onClick={() => openProject(p)}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">{p.icon} {p.name}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{p.summary || (isRtl ? 'لا يوجد وصف' : 'No description')}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteProject(p.id); }} className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--text-dim)] hover:text-red-400"><Trash2 size={14} /></button>
              </div>
              <div className="flex gap-3 mt-3 text-[10px] text-[var(--text-dim)]">
                <span>{p.chats.length} {isRtl ? 'محادثات' : 'chats'}</span>
                <span>{p.files.length} {isRtl ? 'ملفات' : 'files'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
