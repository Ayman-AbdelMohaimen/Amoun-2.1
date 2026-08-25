import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, ExternalLink, Pin, Code, LayoutTemplate,
  Copy, Edit3, Save, Check, FileText, Sparkles, Trash2,
  Maximize2, Minimize2, FileDown, FileJson, FileCode2, FileType2,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { wazeerDB } from '@/lib/db';
import { exportArtifactAs } from '@/lib/exporters';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Artifact } from '@/types';

export default function ArtifactPanel() {
  const {
    isArtifactPanelOpen, toggleArtifactPanel, selectedArtifactId,
    setSelectedArtifactId, currentLanguage
  } = useWorkspaceStore();

  const isRtl = currentLanguage === 'ar';
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeId, setActiveId] = useState<string | null>(selectedArtifactId);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close export menu on outside click
  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [exportOpen]);

  const loadArtifacts = async () => {
    try {
      const stored = await wazeerDB.getAll<Artifact>('artifacts');
      setArtifacts(stored.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      if (stored.length > 0 && !activeId) {
        setActiveId(stored[0].id);
      }
    } catch {
      // IndexedDB fallback
    }
  };

  useEffect(() => {
    if (isArtifactPanelOpen) {
      loadArtifacts();
    }
  }, [isArtifactPanelOpen]);

  useEffect(() => {
    if (selectedArtifactId) {
      setActiveId(selectedArtifactId);
    }
  }, [selectedArtifactId]);

  const activeArtifact = artifacts.find(a => a.id === activeId) || artifacts[0];

  useEffect(() => {
    if (activeArtifact) {
      setEditContent(activeArtifact.content);
      setIsEditing(false);
    }
  }, [activeArtifact?.id]);

  const handleCopy = async () => {
    if (!activeArtifact) return;
    await navigator.clipboard.writeText(activeArtifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePin = async (id: string) => {
    const art = artifacts.find(a => a.id === id);
    if (!art) return;
    const updated = { ...art, pinned: !art.pinned };
    await wazeerDB.put('artifacts', updated);
    setArtifacts(prev => prev.map(a => a.id === id ? updated : a));
  };

  const handleDelete = async (id: string) => {
    await wazeerDB.delete('artifacts', id);
    setArtifacts(prev => prev.filter(a => a.id !== id));
    if (activeId === id) {
      const remaining = artifacts.filter(a => a.id !== id);
      setActiveId(remaining[0]?.id || null);
    }
  };

  const handleSaveEdit = async () => {
    if (!activeArtifact) return;
    const updated: Artifact = { ...activeArtifact, content: editContent };
    await wazeerDB.put('artifacts', updated);
    setArtifacts(prev => prev.map(a => a.id === updated.id ? updated : a));
    setIsEditing(false);
  };

  // ── Export menu (MD → Notion/Obsidian · HTML · JSON · TXT) ──
  const exportFormats: Array<{ id: 'md' | 'html' | 'json' | 'txt'; icon: typeof FileDown; labelAr: string; labelEn: string }> = [
    { id: 'md', icon: FileType2, labelAr: 'Markdown (Notion / Obsidian)', labelEn: 'Markdown (Notion / Obsidian)' },
    { id: 'html', icon: FileCode2, labelAr: 'صفحة HTML', labelEn: 'HTML Page' },
    { id: 'json', icon: FileJson, labelAr: 'JSON', labelEn: 'JSON' },
    { id: 'txt', icon: FileText, labelAr: 'نص خام', labelEn: 'Plain Text' },
  ];

  if (!isArtifactPanelOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={toggleArtifactPanel}
      role="dialog"
      aria-label="Artifacts Panel"
    >
      <motion.div
        initial={{ x: isRtl ? -400 : 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: isRtl ? -400 : 400, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`w-full ${isFullWidth ? 'max-w-none' : 'max-w-2xl'} h-full glass ${isRtl ? 'border-r' : 'border-l'} border-[var(--border)] flex flex-col shadow-2xl overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
          {/* Header */}
          <div className="h-14 border-b border-[var(--border)] flex items-center justify-between px-4 bg-white/2 shrink-0">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-[var(--accent-400)]" />
              <h3 className="font-bold text-sm text-[var(--text-primary)] font-[var(--font-display)]">
                {isRtl ? 'مستكشف البرديات والمنتجات' : 'Artifacts Explorer'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--accent-500)]/15 text-[var(--accent-400)]">
                {artifacts.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Full Width toggle — ⛶ */}
              <button
                onClick={() => setIsFullWidth(v => !v)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                title={isFullWidth ? (isRtl ? 'عرض عادي' : 'Normal width') : (isRtl ? 'عرض كامل' : 'Full width')}
                aria-label="Toggle width"
              >
                {isFullWidth ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={toggleArtifactPanel}
                className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

        {/* Content Body: Sidebar List + Live Preview */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          
          {/* Artifacts List (Left / RTL Right) */}
          <div className="w-full sm:w-56 border-b sm:border-b-0 sm:border-e border-[var(--border)] bg-black/30 overflow-y-auto p-2 space-y-1.5 shrink-0 custom-scrollbar">
            {artifacts.length === 0 ? (
              <div className="text-center py-8 px-2">
                <FileText size={24} className="mx-auto text-[var(--text-dim)] mb-2 opacity-50" />
                <p className="text-xs text-[var(--text-dim)] leading-relaxed">
                  {isRtl ? 'لم يتم توليد أي برديات أو ملفات بعد.' : 'No artifacts generated yet.'}
                </p>
              </div>
            ) : (
              artifacts.map(a => (
                <button
                  key={a.id}
                  onClick={() => { setActiveId(a.id); setSelectedArtifactId(a.id); }}
                  className={`w-full text-start p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2 border ${
                    activeId === a.id
                      ? 'bg-[var(--accent-500)]/15 border-[var(--accent-400)] text-[var(--accent-400)] shadow-[0_0_12px_rgba(45,212,191,0.15)]'
                      : 'border-transparent bg-white/2 hover:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    {a.type === 'html' ? (
                      <ExternalLink size={14} className="text-orange-400 shrink-0" />
                    ) : a.type === 'svg' ? (
                      <Sparkles size={14} className="text-purple-400 shrink-0" />
                    ) : a.type === 'markdown' ? (
                      <FileText size={14} className="text-emerald-400 shrink-0" />
                    ) : (
                      <Code size={14} className="text-cyan-400 shrink-0" />
                    )}
                    <span className="text-xs font-medium truncate">{a.title}</span>
                  </div>
                  {a.pinned && <Pin size={12} className="text-amber-400 shrink-0" />}
                </button>
              ))
            )}
          </div>

          {/* Active Artifact Preview & Editor */}
          <div className="flex-1 flex flex-col bg-black/40 relative overflow-hidden">
            {activeArtifact ? (
              <>
                {/* Action Bar */}
                <div className="p-2.5 border-b border-[var(--border)] flex items-center justify-between bg-white/2 shrink-0">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate font-mono">
                      {activeArtifact.title}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-[var(--text-dim)]">
                      {activeArtifact.language || activeArtifact.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isEditing
                          ? 'bg-[var(--accent-400)] text-black border-[var(--accent-400)] font-bold'
                          : 'bg-white/5 border-white/10 text-[var(--text-dim)] hover:text-white hover:bg-white/10'
                      }`}
                      title={isEditing ? (isRtl ? 'حفظ التعديل' : 'Save') : (isRtl ? 'تعديل' : 'Edit')}
                    >
                      {isEditing ? <Save size={13} /> : <Edit3 size={13} />}
                    </button>

                    <button
                      onClick={handleCopy}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[var(--text-dim)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title={isRtl ? 'نسخ الكود' : 'Copy Code'}
                    >
                      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>

                    <button
                      onClick={() => handleTogglePin(activeArtifact.id)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        activeArtifact.pinned
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                          : 'bg-white/5 border-white/10 text-[var(--text-dim)] hover:text-white hover:bg-white/10'
                      }`}
                      title={isRtl ? 'تثبيت البردية' : 'Pin'}
                    >
                      <Pin size={13} />
                    </button>

                    {/* Export dropdown — MD/HTML/JSON/TXT one-click */}
                    <div className="relative" ref={exportRef}>
                      <button
                        onClick={() => setExportOpen(v => !v)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          exportOpen
                            ? 'bg-[var(--accent-500)]/20 border-[var(--accent-400)]/40 text-[var(--accent-400)]'
                            : 'bg-white/5 border-white/10 text-[var(--text-dim)] hover:text-white hover:bg-white/10'
                        }`}
                        title={isRtl ? 'تصدير بضغطة' : 'One-click export'}
                      >
                        <FileDown size={13} />
                      </button>
                      <AnimatePresence>
                        {exportOpen && activeArtifact && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.97 }}
                            transition={{ duration: 0.12 }}
                            className="absolute top-full mt-1 end-0 w-52 bg-[#0c0c14] border border-white/10 rounded-xl shadow-2xl py-1 z-50 overflow-hidden"
                          >
                            {exportFormats.map(f => (
                              <button
                                key={f.id}
                                onClick={() => {
                                  exportArtifactAs(activeArtifact, f.id);
                                  setExportOpen(false);
                                }}
                                className="w-full px-3 py-2 text-[11px] text-start text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <f.icon size={13} className="text-[var(--accent-400)] shrink-0" />
                                <span className="truncate">{isRtl ? f.labelAr : f.labelEn}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      onClick={() => handleDelete(activeArtifact.id)}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[var(--text-dim)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title={isRtl ? 'حذف' : 'Delete'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* View / Render Canvas */}
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                  {isEditing ? (
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      dir="ltr"
                      className="w-full h-full min-h-[350px] bg-black/60 text-gray-200 font-mono text-xs p-3 rounded-xl border border-[var(--accent-400)]/40 focus:outline-none resize-none custom-scrollbar leading-relaxed"
                    />
                  ) : activeArtifact.type === 'html' || activeArtifact.type === 'svg' ? (
                    <iframe
                      sandbox="allow-scripts"
                      srcDoc={activeArtifact.content}
                      className="w-full h-full min-h-[350px] bg-white rounded-xl border-0 shadow-lg"
                      title={activeArtifact.title}
                    />
                  ) : activeArtifact.type === 'markdown' ? (
                    <div className="markdown-body text-xs text-[var(--text-secondary)] leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {activeArtifact.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <pre className="text-xs font-mono text-cyan-300 bg-black/80 p-4 rounded-xl overflow-auto border border-white/5 leading-relaxed" dir="ltr">
                      <code>{activeArtifact.content}</code>
                    </pre>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-[var(--text-dim)] font-mono">
                {isRtl ? 'اختر بردية لمعاينتها' : 'Select an artifact to view'}
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
}
