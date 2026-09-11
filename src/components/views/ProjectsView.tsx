import { useState, useEffect } from 'react';
import {
  FolderKanban, Plus, Trash2, ChevronDown, ChevronUp, FolderOpen,
  ArrowRight, FileCode, Sparkles, Check, Link as LinkIcon, BookOpen,
  FileText, ExternalLink, RefreshCw,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { wazeerDB } from '@/lib/db';
import type { Project, Artifact } from '@/types';

export default function ProjectsView() {
  const {
    projects,
    addProject,
    deleteProject,
    currentLanguage,
    setActiveView,
    setCurrentProject,
    setSelectedArtifactId,
    toggleArtifactPanel,
    isArtifactPanelOpen,
  } = useWorkspaceStore();

  const isRtl = currentLanguage === 'ar';

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [references, setReferences] = useState('');
  const [generateSddDocs, setGenerateSddDocs] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Real artifacts from IndexedDB (File Root)
  const [allArtifacts, setAllArtifacts] = useState<Artifact[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  const loadAllFiles = async () => {
    setLoadingFiles(true);
    try {
      const files = await wazeerDB.getAll<Artifact>('artifacts');
      setAllArtifacts(files.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch {
      setAllArtifacts([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    loadAllFiles();
  }, [projects]);

  const handleCreate = async () => {
    if (!name.trim() || isCreating) return;
    setIsCreating(true);

    try {
      const links = references
        .split(/[\n,]+/)
        .map((l) => l.trim())
        .filter(Boolean);

      await addProject(name.trim(), summary.trim(), links, generateSddDocs);
      setName('');
      setSummary('');
      setReferences('');
      setIsDetailsOpen(false);
      await loadAllFiles();
    } catch (err) {
      console.error('[ProjectsView] Error creating project:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const openProject = (p: Project) => {
    setCurrentProject(p.id);
  };

  const openArtifact = (artifactId: string) => {
    setSelectedArtifactId(artifactId);
    if (!isArtifactPanelOpen) {
      toggleArtifactPanel();
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('home')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono hover:bg-white/10 transition-colors cursor-pointer text-[var(--text-secondary)] hover:text-white"
          >
            <ArrowRight size={14} className={isRtl ? '' : 'rotate-180'} />
            <span>{isRtl ? 'العودة للوحة العصف الذهني' : 'Back to Brainstorming'}</span>
          </button>
        </div>

        {/* Title */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-400)]/20 text-[var(--accent-300)] font-mono">
            {projects.length} {isRtl ? 'مشاريع' : 'projects'}
          </span>
          <h1 className="text-xl md:text-2xl font-bold font-[var(--font-display)] text-[var(--text-primary)] flex items-center gap-2">
            <span>{isRtl ? 'مجلس إدارة المشاريع' : 'Project Management Council'}</span>
            <FolderKanban size={24} className="text-[var(--accent-400)]" />
          </h1>
        </div>
      </div>

      <p className="text-xs text-[var(--text-muted)] text-center max-w-xl mx-auto -mt-2">
        {isRtl
          ? 'تنظيم الملفات، هندسة الأكواد، وأرشيف محادثات الذكاء الاصطناعي لكل فكرة بشكل مستقل.'
          : 'Organize files, code engineering, and AI chat archives for each idea independently.'}
      </p>

      {/* Main Split Grid: Left (Existing Projects) | Right (New Project Form) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Projects List (بيئات المشاريع النشطة) */}
        <div className="lg:col-span-7 glass rounded-2xl border border-white/10 p-5 min-h-[340px] flex flex-col">
          <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4 font-mono flex items-center justify-between border-b border-white/5 pb-2">
            <span>{isRtl ? 'بيئات المشاريع النشطة' : 'Active Project Environments'}</span>
            <span className="text-xs text-[var(--text-dim)] font-normal">{projects.length} {isRtl ? 'مشاريع' : 'environments'}</span>
          </h2>

          {projects.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-xl my-auto">
              <FolderOpen size={40} className="text-[var(--text-dim)] mb-3 opacity-40" />
              <p className="text-sm text-[var(--text-muted)] font-medium">
                {isRtl ? 'لا توجد مشاريع مضافة حالياً.' : 'No active projects added yet.'}
              </p>
              <p className="text-xs text-[var(--text-dim)] mt-1">
                {isRtl ? 'املأ النموذج في الجانب لبدء تنظيم أول أعمالك.' : 'Fill out the form on the side to start organizing your work.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {projects.map((p) => {
                const projectFiles = allArtifacts.filter((a) => a.projectId === p.id);

                return (
                  <div
                    key={p.id}
                    onClick={() => openProject(p)}
                    className="group relative glass rounded-xl border border-white/10 hover:border-[var(--accent-400)]/50 p-4 transition-all cursor-pointer hover:shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 font-mono group-hover:text-[var(--accent-300)] transition-colors">
                          <span>{p.icon || '📁'}</span>
                          <span className="truncate">{p.name}</span>
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProject(p.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
                          title={isRtl ? 'حذف المشروع' : 'Delete project'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2 leading-relaxed">
                        {p.summary || (isRtl ? 'لا يوجد وصف للمشروع' : 'No description')}
                      </p>

                      {/* Project SDD/Docs preview */}
                      {projectFiles.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {projectFiles.slice(0, 2).map((pf) => (
                            <span
                              key={pf.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                openArtifact(pf.id);
                              }}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--accent-400)]/10 text-[var(--accent-300)] border border-[var(--accent-400)]/20 hover:bg-[var(--accent-400)]/20 font-mono flex items-center gap-1"
                              title={pf.title}
                            >
                              <FileText size={10} />
                              <span className="truncate max-w-[120px]">{pf.title}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-white/5 text-[10px] font-mono text-[var(--text-dim)]">
                      <div className="flex items-center gap-2.5">
                        <span>💬 {p.chats.length} {isRtl ? 'محادثات' : 'chats'}</span>
                        <span>📂 {projectFiles.length || p.files.length} {isRtl ? 'ملفات' : 'files'}</span>
                      </div>
                      <span className="text-[var(--accent-300)] group-hover:underline flex items-center gap-1">
                        {isRtl ? 'دخول البيئة' : 'Open'} ➔
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: New Project Setup Form (تأسيس مشروع جديد - الصورة 3 و 4) */}
        <div className="lg:col-span-5 glass rounded-2xl border border-[var(--accent-400)]/30 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <button
              onClick={() => setIsDetailsOpen((v) => !v)}
              className="flex items-center gap-1 text-xs text-[var(--accent-300)] hover:underline font-mono cursor-pointer"
            >
              <span>{isDetailsOpen ? (isRtl ? 'إغلاق التفاصيل ∧' : 'Close details ∧') : (isRtl ? 'تعديل التفاصيل ∨' : 'Edit details ∨')}</span>
            </button>
            <h2 className="text-sm font-bold text-[var(--text-primary)] font-mono flex items-center gap-1.5">
              <span>{isRtl ? '+ تأسيس مشروع جديد' : '+ Establish New Project'}</span>
            </h2>
          </div>

          {/* Form Fields (Expanded in Image 4) */}
          {isDetailsOpen && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div>
                <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">
                  {isRtl ? 'اسم المشروع' : 'Project Name'}
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isRtl ? 'مثل: مشروع أوريون، نظام المبيعات...' : 'e.g. Orion System, Sales App...'}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--accent-400)] text-[var(--text-primary)] font-mono"
                  dir="auto"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">
                  {isRtl ? 'وصف المشروع وملخص الفكرة' : 'Project Description & Summary'}
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder={isRtl ? 'صف رؤيتك والجمهور المستهدف وأبرز مميزات التطبيق...' : 'Describe vision, target audience, and key features...'}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--accent-400)] text-[var(--text-primary)] resize-none"
                  dir="auto"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">
                  {isRtl ? 'مراجع وروابط هامة' : 'Important References & Links'}
                </label>
                <input
                  value={references}
                  onChange={(e) => setReferences(e.target.value)}
                  placeholder={isRtl ? 'مستودعات Github، روابط Figma، واجهات برمجية...' : 'Github repos, Figma links, APIs...'}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--accent-400)] text-[var(--text-primary)] font-mono text-[11px]"
                  dir="auto"
                />
              </div>
            </div>
          )}

          {/* SDD Switch (الزر الاختياري المضيء لإنشاء مجلد Docs و SDD) */}
          <div className="p-3 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs font-bold text-[var(--text-primary)]">
                {isRtl ? 'إنشاء مجلد Docs والمخططات المعمارية' : 'Create Docs & Architectural Schematics'}
              </p>
              <p className="text-[10px] text-[var(--text-dim)] mt-0.5">
                {isRtl ? 'يتضمن ملفات SDD وملفات التخطيط للمشروع وتحدث تلقائياً' : 'Includes SDD planning files auto-updated continuously'}
              </p>
            </div>

            {/* Glowing Toggle Switch */}
            <button
              onClick={() => setGenerateSddDocs((v) => !v)}
              className={`w-11 h-6 rounded-full transition-all duration-300 relative p-0.5 cursor-pointer shrink-0 ${
                generateSddDocs
                  ? 'bg-gradient-to-r from-emerald-500 to-[var(--accent-400)] shadow-[0_0_12px_var(--accent-glow)]'
                  : 'bg-zinc-800 border border-white/10'
              }`}
              role="switch"
              aria-checked={generateSddDocs}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-md block transition-transform duration-300 ${
                  generateSddDocs ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Big Action Submit Button (أدخل اسم المشروع / اضغط للتوسيع) */}
          <button
            onClick={name.trim() ? handleCreate : () => setIsDetailsOpen(true)}
            disabled={isCreating}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[var(--accent-400)] via-amber-400 to-[var(--accent-500)] text-black font-bold text-xs hover:brightness-110 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin" />
                <span>{isRtl ? 'جاري تأسيس المشروع وتوليد ملفات الـ SDD...' : 'Creating Project & SDD Docs...'}</span>
              </span>
            ) : (
              <>
                <span>📁</span>
                <span>
                  {name.trim()
                    ? (isRtl ? `تأسيس مشروع "${name.trim()}" الان` : `Establish "${name.trim()}" Now`)
                    : (isRtl ? 'أدخل اسم المشروع (اضغط للتوسيع)' : 'Enter Project Name (Click to Expand)')}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Section: Full File Root Explorer (جذر الملفات الكامل File Root - الصور 3 و 4) */}
      <div className="glass rounded-2xl border border-white/10 p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--accent-300)]" dir="ltr">
              (root) / 📁
            </span>
            <button onClick={loadAllFiles} className="text-[var(--text-dim)] hover:text-white p-1" title="تحديث الملفات">
              <RefreshCw size={12} className={loadingFiles ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 font-mono">
              {isRtl ? 'جذر الملفات الكامل (File Root)' : 'Full File Root Directory'}
            </span>
            <FolderOpen size={16} className="text-amber-400" />
          </div>
        </div>

        <p className="text-[11px] text-[var(--text-dim)]">
          {isRtl
            ? 'تصفح مستودع الملفات الكلي لكافة المشاريع في بيئتك البرمجية المحلية.'
            : 'Browse total file repository for all projects in your local environment.'}
        </p>

        {/* Tree Root Container with Real Files */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-zinc-400 min-h-[100px]">
          {loadingFiles ? (
            <p className="text-center py-4 text-[var(--text-dim)]">{isRtl ? 'جاري قراءة الملفات...' : 'Loading files...'}</p>
          ) : allArtifacts.length === 0 ? (
            <p className="text-center py-4 text-zinc-500">
              {isRtl ? '📂 (root) / — لا توجد ملفات أو برديات مخزنة بعد. أنشئ مشروعاً لتوليد ملفات الـ SDD التلقائية.' : 'No files in repository yet.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {allArtifacts.map((art) => {
                const proj = projects.find((p) => p.id === art.projectId);

                return (
                  <div
                    key={art.id}
                    onClick={() => openArtifact(art.id)}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[var(--accent-400)]/40 transition-all cursor-pointer group"
                    title={isRtl ? 'انقر لعرض وتعديل الملف في لوحة البرديات' : 'Click to open in Artifact Panel'}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode size={15} className="text-[var(--accent-400)] shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-zinc-200 text-xs font-bold group-hover:text-[var(--accent-300)]">
                          {art.title}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {proj ? `[${proj.name}] · ` : ''}{(art.content.length / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <ExternalLink size={12} className="text-zinc-500 group-hover:text-[var(--accent-400)] shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
