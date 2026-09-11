import { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot, User, Copy, Check, Trash2, RotateCcw, Edit2, X, Send, ListChecks,
  Volume2, VolumeX, Settings, KeyRound, FolderOpen, Terminal, ChevronDown, ChevronUp, FileText,
  FileCode, ExternalLink, MoreVertical, Star, Pencil, CalendarClock, FolderPlus,
  SlidersHorizontal,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { wazeerDB } from '@/lib/db';
import ChatInput from '@/components/ChatInput';
import { speak, stopSpeaking, getIsSpeaking, isTTSSupported } from '@/services/voice/VoiceService';
import LiveProcessBadge from '@/components/workspace/LiveProcessBadge';
import InteractiveSelectionCard from '@/components/workspace/InteractiveSelectionCard';
import type { ChatMessage, SessionEvent, Artifact } from '@/types';

export default function WorkspaceView() {
  const {
    chatSessions,
    currentSessionId,
    currentLanguage,
    isGenerating,
    voiceEnabled,
    voiceGender,
    sendMessage,
    deleteMessage,
    editMessage,
    retryMessage,
    tasks,
    addTask,
    projects,
    currentProjectId,
    setCurrentProject,
    setSelectedArtifactId,
    toggleArtifactPanel,
    isArtifactPanelOpen,
    renameSession,
    deleteSession,
    toggleFavoriteSession,
  } = useWorkspaceStore();

  const isRtl = currentLanguage === 'ar';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const session = chatSessions.find((s) => s.id === currentSessionId);
  const messages = session?.messages ?? [];
  const activeProject = projects.find((p) => p.id === (currentProjectId || session?.projectId));

  // Extract all uploaded attachments from messages in current session
  const uploadedFiles = messages.flatMap((m) => m.attachments ?? []);

  // CLI / Background Logs State & Project Artifacts
  const [showCliPanel, setShowCliPanel] = useState(false);
  const [showFilesPanel, setShowFilesPanel] = useState(false);
  const [sessionLogs, setSessionLogs] = useState<SessionEvent[]>([]);
  const [projectArtifacts, setProjectArtifacts] = useState<Artifact[]>([]);

  // Manus Mini-Menu & Dialogs State
  const [miniMenuOpen, setMiniMenuOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [sessionTitleInput, setSessionTitleInput] = useState('');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleTaskInput, setScheduleTaskInput] = useState('');
  const [showPreferencesCard, setShowPreferencesCard] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMiniMenuOpen(false);
      }
    };
    if (miniMenuOpen) document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [miniMenuOpen]);

  useEffect(() => {
    if (currentSessionId) {
      wazeerDB.getByIndex<SessionEvent>('session_events', 'sessionId', currentSessionId)
        .then((evs) => setSessionLogs(evs.sort((a, b) => (b.id ?? 0) - (a.id ?? 0))))
        .catch(() => setSessionLogs([]));
    }
  }, [currentSessionId, messages.length]);

  useEffect(() => {
    wazeerDB.getAll<Artifact>('artifacts')
      .then((all) => {
        const targetProjId = currentProjectId || session?.projectId;
        const matched = all.filter((a) => (targetProjId && a.projectId === targetProjId) || a.chatId === currentSessionId);
        setProjectArtifacts(matched);
      })
      .catch(() => setProjectArtifacts([]));
  }, [currentProjectId, currentSessionId, session?.projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text: string, attachment?: any) => sendMessage(text, attachment);

  const copyToClipboard = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartEdit = (id: string, currentContent: string) => {
    setEditingId(id);
    setEditText(currentContent);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editText.trim()) return;
    const textToSubmit = editText.trim();
    setEditingId(null);
    await editMessage(id, textToSubmit);
  };

  // ── TTS handler ──
  const handleSpeak = (msgId: string, content: string) => {
    if (isSpeaking && speakingMsgId === msgId) {
      stopSpeaking();
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      return;
    }

    stopSpeaking();
    speak(content, currentLanguage, voiceGender, () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    });
    setIsSpeaking(true);
    setSpeakingMsgId(msgId);
  };

  // Count tasks extracted in this session (simple approach)
  const sessionTasks = tasks.filter(t => t.sourceSessionId === currentSessionId);

  const openArtifact = (artifactId: string) => {
    setSelectedArtifactId(artifactId);
    if (!isArtifactPanelOpen) {
      toggleArtifactPanel();
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* HUD Top Actions: الملفات المرفوعة + شاشة الـ CLI الخلفية + مؤشر المشروع النشط */}
      <div className="shrink-0 px-4 py-2 border-b border-[var(--border)] bg-black/20 flex items-center justify-between gap-2 text-xs flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Project Pill */}
          {activeProject && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--accent-400)]/15 border border-[var(--accent-400)]/40 text-[var(--accent-300)] font-mono text-[11px] shadow-sm">
              <span>📁 {activeProject.name}</span>
              <button
                onClick={() => setCurrentProject(null)}
                className="hover:text-red-400 ms-1 text-zinc-400 text-xs cursor-pointer"
                title={isRtl ? 'مغادرة بيئة المشروع' : 'Leave Project Environment'}
              >
                ✕
              </button>
            </div>
          )}

          {/* Files Root Trigger (2) */}
          <button
            onClick={() => setShowFilesPanel((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all cursor-pointer ${
              showFilesPanel
                ? 'bg-[var(--accent-400)]/20 border-[var(--accent-400)]/50 text-[var(--accent-300)]'
                : 'bg-white/5 border-white/10 text-[var(--text-secondary)] hover:border-white/20'
            }`}
            title={isRtl ? 'عرض روت الملفات ووثائق الـ SDD' : 'View Files & SDD Docs'}
          >
            <FolderOpen size={13} className="text-[var(--accent-400)]" />
            <span>{isRtl ? 'الملفات والوثائق' : 'Files & Docs'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/10 font-mono text-[10px]">
              {uploadedFiles.length + projectArtifacts.length}
            </span>
          </button>

          {/* CLI / Terminal Trigger (4) */}
          <button
            onClick={() => setShowCliPanel((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all cursor-pointer ${
              showCliPanel
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-white/5 border-white/10 text-[var(--text-secondary)] hover:border-white/20'
            }`}
            title={isRtl ? 'عرض شاشة الأوامر والعمليات الخلفية CLI' : 'Open CLI / Background Console'}
          >
            <Terminal size={13} className="text-amber-400" />
            <span className="font-mono text-[11px]">{isRtl ? 'سجل العمليات CLI' : 'CLI Monitor'}</span>
            {sessionLogs.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 ms-auto">
          {/* Task counter quick link */}
          {sessionTasks.length > 0 && (
            <button
              onClick={() => useWorkspaceStore.getState().setActiveView('home')}
              className="flex items-center gap-1 text-[11px] text-[var(--accent-300)] hover:underline cursor-pointer"
            >
              <ListChecks size={13} />
              <span className="hidden sm:inline">{isRtl ? `${sessionTasks.length} مهمة مستخرجة` : `${sessionTasks.length} tasks`}</span>
              <span className="sm:hidden">{sessionTasks.length}</span>
            </button>
          )}

          {/* Questionnaire / Preferences toggle button */}
          <button
            onClick={() => setShowPreferencesCard((v) => !v)}
            className={`px-2 py-1 rounded-lg border text-xs transition-colors cursor-pointer flex items-center gap-1 ${
              showPreferencesCard
                ? 'bg-[var(--accent-400)]/20 border-[var(--accent-400)]/40 text-[var(--accent-300)]'
                : 'bg-white/5 border-white/10 text-[var(--text-secondary)] hover:text-white'
            }`}
            title={isRtl ? 'استبيان تفضيلات التوليد' : 'Generation Preferences'}
          >
            <SlidersHorizontal size={13} className="text-[var(--accent-400)]" />
            <span className="hidden sm:inline">{isRtl ? 'تفضيلات' : 'Preferences'}</span>
          </button>

          {/* Manus 1.6 Style Mini Menu (...) */}
          {session && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMiniMenuOpen((v) => !v)}
                className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                  miniMenuOpen
                    ? 'bg-white/15 border-white/30 text-white'
                    : 'bg-white/5 border-white/10 text-[var(--text-secondary)] hover:text-white hover:border-white/20'
                }`}
                title={isRtl ? 'خيارات المحادثة والمشروع' : 'Chat & Project Options'}
                aria-label="Chat Options"
              >
                {session.isFavorite && <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />}
                <MoreVertical size={14} />
              </button>

              {miniMenuOpen && (
                <div
                  className="absolute top-full end-0 mt-1.5 w-52 glass glow-lg rounded-xl p-1.5 border border-white/15 z-50 shadow-2xl space-y-0.5 text-xs text-start bg-[#0d0d12]/95 backdrop-blur-xl"
                  dir={isRtl ? 'rtl' : 'ltr'}
                >
                  <button
                    onClick={() => {
                      toggleFavoriteSession(session.id);
                      setMiniMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/10 text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <Star size={14} className={session.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-[var(--text-dim)]'} />
                    <span>{session.isFavorite ? (isRtl ? 'إزالة من المفضلة' : 'Unfavorite') : (isRtl ? 'إضافة للمفضلة' : 'Favorite')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSessionTitleInput(session.title);
                      setRenameDialogOpen(true);
                      setMiniMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/10 text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <Pencil size={14} className="text-[var(--text-dim)]" />
                    <span>{isRtl ? 'إعادة التسمية' : 'Rename'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowFilesPanel(true);
                      setMiniMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/10 text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <FolderOpen size={14} className="text-[var(--text-dim)]" />
                    <span>{isRtl ? 'عرض كل الملفات' : 'View all files'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setScheduleTaskInput(session.title);
                      setScheduleDialogOpen(true);
                      setMiniMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/10 text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <CalendarClock size={14} className="text-[var(--text-dim)]" />
                    <span>{isRtl ? 'جدولة مهمة' : 'Schedule a task'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (projects.length > 0) {
                        setCurrentProject(projects[0].id);
                      }
                      setMiniMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/10 text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <FolderPlus size={14} className="text-[var(--text-dim)]" />
                    <span>{isRtl ? 'إضافة إلى مشروع' : 'Add to project'}</span>
                  </button>

                  <div className="border-t border-white/10 my-1" />

                  <button
                    onClick={() => {
                      if (confirm(isRtl ? 'هل تريد حذف هذه المحادثة بالتأكيد؟' : 'Delete this chat?')) {
                        deleteSession(session.id);
                      }
                      setMiniMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-red-500/15 text-red-400 transition-colors cursor-pointer font-medium"
                  >
                    <Trash2 size={14} />
                    <span>{isRtl ? 'حذف' : 'Delete'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Drawer Panel: Uploaded Files & SDD Docs (2) */}
      {showFilesPanel && (
        <div className="shrink-0 p-3 bg-black/40 border-b border-[var(--border)] glass animate-in slide-in-from-top-2 duration-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--accent-400)] flex items-center gap-1.5">
              <FolderOpen size={14} />
              {isRtl ? 'ملفات ووثائق الجلسة والمشروع' : 'Files & Architecture Artifacts'}
            </span>
            <button onClick={() => setShowFilesPanel(false)} className="text-[var(--text-dim)] hover:text-white cursor-pointer">
              <X size={14} />
            </button>
          </div>

          {uploadedFiles.length === 0 && projectArtifacts.length === 0 ? (
            <p className="text-xs text-[var(--text-dim)] text-center py-3">
              {isRtl ? 'لا توجد ملفات أو وثائق مرفوعة بعد.' : 'No files or documents created yet.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {/* Project SDD Docs */}
              {projectArtifacts.map((art) => (
                <div
                  key={art.id}
                  onClick={() => openArtifact(art.id)}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--accent-400)]/10 border border-[var(--accent-400)]/30 text-xs hover:bg-[var(--accent-400)]/20 transition-colors cursor-pointer group"
                  title={isRtl ? 'فتح في لوحة البرديات' : 'Open in Artifact Panel'}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode size={14} className="text-[var(--accent-400)] shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-zinc-100 font-bold">{art.title}</p>
                      <p className="text-[10px] text-[var(--accent-300)] font-mono">{(art.content.length / 1024).toFixed(1)} KB (SDD Doc)</p>
                    </div>
                  </div>
                  <ExternalLink size={12} className="text-zinc-400 group-hover:text-white shrink-0" />
                </div>
              ))}

              {/* Uploaded Attachments */}
              {uploadedFiles.map((file, i) => (
                <div key={file.id || i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 text-xs">
                  <FileText size={14} className="text-[var(--accent-400)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[var(--text-primary)] font-medium">{file.name}</p>
                    <p className="text-[10px] text-[var(--text-dim)] font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Drawer Panel: CLI Monitor Terminal (4) */}
      {showCliPanel && (
        <div className="shrink-0 p-3 bg-[#08080d]/95 border-b border-[var(--border)] font-mono text-xs max-h-56 overflow-y-auto custom-scrollbar shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-white/10 text-[11px] text-[var(--text-dim)]">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Terminal size={13} />
              {isRtl ? 'شاشة الأوامر والعمليات الحية (CLI)' : 'BACKGROUND PROCESSES MONITOR'}
            </span>
            <button onClick={() => setShowCliPanel(false)} className="text-[var(--text-dim)] hover:text-white">
              <X size={14} />
            </button>
          </div>
          {sessionLogs.length === 0 ? (
            <p className="text-[11px] text-zinc-500 py-2">
              [amoun-cli] ready. Listening for pipeline events and LLM streaming...
            </p>
          ) : (
            <div className="space-y-1 text-[11px]">
              {sessionLogs.map((log, i) => {
                const isErr = log.type === 'error';
                return (
                  <div key={log.id || i} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-zinc-500 text-[10px] shrink-0">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className={isErr ? 'text-red-400' : 'text-emerald-400'}>
                      {log.type === 'user/message' ? '❯ USER_INPUT' : log.type === 'assistant/message' ? '◆ ASSISTANT_RESPONSE' : '⛔ ERROR'}
                    </span>
                    <span className="text-zinc-300 truncate">
                      {typeof log.payload === 'object' ? JSON.stringify(log.payload) : String(log.payload)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Interactive Preferences / Selection Card (Manus Style) */}
        {showPreferencesCard && (
          <InteractiveSelectionCard
            onSubmit={(res, text) => {
              setShowPreferencesCard(false);
              sendMessage(text);
            }}
            onSkip={() => setShowPreferencesCard(false)}
            isRtl={isRtl}
          />
        )}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <img
                src="/home-hero.png"
                alt="𓂀"
                className="w-56 md:w-72 mx-auto mb-3 select-none pointer-events-none drop-shadow-[0_0_35px_rgba(251,191,36,0.25)]"
                draggable={false}
              />
              <p className="text-sm text-[var(--text-muted)] mb-3">
                {isRtl ? 'ابدأ محادثة جديدة مع أمون' : 'Start a new conversation with Amoun'}
              </p>
              <p className="text-xs text-[var(--text-dim)] max-w-xs mx-auto">
                {isRtl
                  ? 'أمون يستمع لملاحظاتك الصوتية والنصية، يفلترها، ويحولها لمهام قابلة للتنفيذ'
                  : 'Amoun listens to your voice & text notes, filters them, and turns them into actionable tasks'
                }
              </p>
            </div>
          </div>
        )}

        {messages
          .filter((m) => m.role !== 'system')
          .map((msg) => (
            <div
              key={msg.id}
              className={'flex gap-3 group ' + (msg.role === 'user' ? 'flex-row-reverse' : '')}
            >
              <div
                className={
                  'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs mt-1 ' +
                  (msg.role === 'user'
                    ? 'bg-[var(--accent-400)]/20 text-[var(--accent-400)]'
                    : 'bg-purple-500/20 text-purple-400')
                }
              >
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>

              <div className={'flex-1 max-w-[85%] ' + (msg.role === 'user' ? 'text-end' : '')}>
                {/* Message Content / Edit Input */}
                {editingId === msg.id ? (
                  <div className="flex flex-col gap-2 my-1">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full text-sm text-[var(--text-primary)] bg-white/10 rounded-xl p-3 border border-[var(--accent-400)]/50 focus:outline-none resize-none"
                      rows={3}
                      dir="auto"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 text-xs rounded-lg glass hover:bg-white/10 flex items-center gap-1 text-[var(--text-muted)]"
                      >
                        <X size={12} /> {isRtl ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        onClick={() => handleSaveEdit(msg.id)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-[var(--accent-400)] text-black font-medium hover:opacity-90 flex items-center gap-1"
                      >
                        <Send size={12} /> {isRtl ? 'إرسال التعديل' : 'Save & Send'}
                      </button>
                    </div>
                  </div>
                ) : msg.role === 'user' ? (
                  <p
                    className="inline-block text-sm text-[var(--text-primary)] bg-white/5 rounded-2xl px-4 py-2.5 whitespace-pre-wrap text-start"
                    dir="auto"
                  >
                    {msg.content}
                  </p>
                ) : (
                  <div className="relative">
                    <div className="markdown-body text-sm text-[var(--text-secondary)]" dir="auto">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* 🔑 API-key error → CTA to Settings (رسايل أخطاء مصرية) */}
                {msg.role === 'assistant' && !msg.isStreaming && msg.apiKeyError && msg.content.startsWith('❌') && (
                  <button
                    onClick={() => useWorkspaceStore.getState().setActiveView('settings')}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-colors cursor-pointer"
                  >
                    <KeyRound size={12} />
                    {isRtl ? 'ضيف مفتاح الـ API من الإعدادات' : 'Add your API key in Settings'}
                    <Settings size={12} className="opacity-70" />
                  </button>
                )}

                {/* ⏱ Persisted generation transparency — الثواني والحالة النهائية من بيانات الرسالة */}
                {msg.role === 'assistant' && !msg.isStreaming && msg.generationSeconds != null && (
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[var(--text-dim)]">
                    <span className="font-mono" dir="ltr">⏱ {msg.generationSeconds}s</span>
                    {msg.generationFinalStatus && <span>· {msg.generationFinalStatus}</span>}
                  </div>
                )}

                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className={'flex gap-2 mt-1 ' + (msg.role === 'user' ? 'justify-end' : '')}>
                    {msg.attachments.map((a) => (
                      <span key={a.id} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-[var(--text-dim)]">
                        📎 {a.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* 👎😍 Rating — visible always (mobile-first), assistant only */}
                {msg.role === 'assistant' && !msg.isStreaming && msg.content && (
                  <MessageRating msg={msg} />
                )}

                {/* Micro Options Toolbar */}
                {!isGenerating && editingId !== msg.id && (
                  <div
                    className={
                      'flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ' +
                      (msg.role === 'user' ? 'justify-end' : 'justify-start')
                    }
                  >
                    {/* Replay */}
                    <button
                      onClick={() => retryMessage(msg.id)}
                      className="p-1 rounded hover:bg-white/10 text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors"
                      title={isRtl ? 'إعادة المحاولة' : 'Replay'}
                      aria-label="Replay"
                    >
                      <RotateCcw size={12} />
                    </button>

                    {/* Edit — User only */}
                    {msg.role === 'user' && (
                      <button
                        onClick={() => handleStartEdit(msg.id, msg.content)}
                        className="p-1 rounded hover:bg-white/10 text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors"
                        title={isRtl ? 'تعديل' : 'Edit'}
                        aria-label="Edit"
                      >
                        <Edit2 size={12} />
                      </button>
                    )}

                    {/* Delete — User only */}
                    {msg.role === 'user' && (
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="p-1 rounded hover:bg-red-500/20 text-[var(--text-dim)] hover:text-red-400 transition-colors"
                        title={isRtl ? 'حذف' : 'Delete'}
                        aria-label="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}

                    {/* Copy — Assistant only */}
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="p-1 rounded hover:bg-white/10 text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors"
                        title={isRtl ? 'نسخ' : 'Copy'}
                        aria-label="Copy"
                      >
                        {copiedId === msg.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                      </button>
                    )}

                    {/* TTS — Assistant only */}
                    {msg.role === 'assistant' && voiceEnabled && isTTSSupported() && msg.content && !msg.isStreaming && (
                      <button
                        onClick={() => handleSpeak(msg.id, msg.content)}
                        className={
                          'p-1 rounded transition-colors ' +
                          (isSpeaking && speakingMsgId === msg.id
                            ? 'bg-[var(--accent-400)]/20 text-[var(--accent-400)]'
                            : 'hover:bg-white/10 text-[var(--text-dim)] hover:text-[var(--text-primary)]')
                        }
                        title={isSpeaking && speakingMsgId === msg.id
                          ? (isRtl ? 'إيقاف القراءة' : 'Stop reading')
                          : (isRtl ? 'اقرأ الرد' : 'Read aloud')
                        }
                        aria-label="Text-to-speech"
                      >
                        {isSpeaking && speakingMsgId === msg.id ? <VolumeX size={12} /> : <Volume2 size={12} />}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

        {/* Live Process Sequential Updates Badge (Manus Style) */}
        {isGenerating && (
          <LiveProcessBadge
            title={isRtl ? 'استكشاف سياق المحادثة والملفات والأدوات' : 'Exploring context, files & tools'}
            type="process"
            events={sessionLogs}
            isCompleted={false}
            isRtl={isRtl}
          />
        )}

        {isGenerating && <GenerationIndicator isRtl={isRtl} />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 p-4 border-t border-[var(--border)]">
        <ChatInput onSend={handleSend} disabled={isGenerating} />
      </div>

      {/* Rename Session Dialog */}
      {renameDialogOpen && session && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-2xl p-5 border border-white/15 max-w-sm w-full space-y-4 shadow-2xl bg-[#0e0e14]" dir={isRtl ? 'rtl' : 'ltr'}>
            <h3 className="text-sm font-bold text-[var(--text-primary)] font-[var(--font-display)]">
              {isRtl ? 'إعادة تسمية المحادثة' : 'Rename Chat'}
            </h3>
            <input
              type="text"
              value={sessionTitleInput}
              onChange={(e) => setSessionTitleInput(e.target.value)}
              className="w-full text-xs text-[var(--text-primary)] bg-white/5 border border-white/15 rounded-xl p-2.5 outline-none focus:border-[var(--accent-400)]"
              dir="auto"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setRenameDialogOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-[var(--text-muted)] hover:bg-white/5 cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  if (sessionTitleInput.trim()) renameSession(session.id, sessionTitleInput.trim());
                  setRenameDialogOpen(false);
                }}
                className="px-4 py-1.5 rounded-xl text-xs bg-[var(--accent-400)] text-black font-bold hover:opacity-90 cursor-pointer shadow-sm"
              >
                {isRtl ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Task Dialog */}
      {scheduleDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-2xl p-5 border border-white/15 max-w-sm w-full space-y-4 shadow-2xl bg-[#0e0e14]" dir={isRtl ? 'rtl' : 'ltr'}>
            <h3 className="text-sm font-bold text-[var(--text-primary)] font-[var(--font-display)]">
              {isRtl ? 'جدولة مهمة جديدة' : 'Schedule a Task'}
            </h3>
            <textarea
              value={scheduleTaskInput}
              onChange={(e) => setScheduleTaskInput(e.target.value)}
              rows={3}
              placeholder={isRtl ? 'اكتب تفاصيل المهمة...' : 'Enter task description...'}
              className="w-full text-xs text-[var(--text-primary)] bg-white/5 border border-white/15 rounded-xl p-2.5 outline-none focus:border-[var(--accent-400)] resize-none"
              dir="auto"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setScheduleDialogOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-[var(--text-muted)] hover:bg-white/5 cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  if (scheduleTaskInput.trim()) addTask(scheduleTaskInput.trim(), 'manual');
                  setScheduleDialogOpen(false);
                }}
                className="px-4 py-1.5 rounded-xl text-xs bg-[var(--accent-400)] text-black font-bold hover:opacity-90 cursor-pointer shadow-sm"
              >
                {isRtl ? 'إضافة للمهام' : 'Add to Tasks'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MESSAGE RATING — 👎 شبشب / 😍 قلوب (feeds corrective memory)
// ═══════════════════════════════════════════════════════════════════

const RATING_TAGS = [
  { id: 'wrong', ar: 'غلط علمي', en: 'Factually wrong' },
  { id: 'long', ar: 'طويل', en: 'Too long' },
  { id: 'unclear', ar: 'مش فاهم', en: 'Unclear' },
  { id: 'broken-code', ar: 'كود مكسور', en: 'Broken code' },
] as const;

function MessageRating({ msg }: { msg: ChatMessage }) {
  const { rateMessage, currentLanguage } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';
  const [showTags, setShowTags] = useState(false);

  // Error messages aren't rateable
  if (msg.content.startsWith('❌')) return null;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <button
        onClick={() => rateMessage(msg.id, 'up')}
        className={`text-sm transition-all cursor-pointer hover:scale-125 active:scale-95 ${
          msg.rating === 'up'
            ? 'opacity-100 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]'
            : 'opacity-35 hover:opacity-80'
        }`}
        title={isRtl ? 'إجابة جميلة 😍' : 'Great answer'}
        aria-label="Rate up"
      >
        😍
      </button>
      <button
        onClick={() => {
          rateMessage(msg.id, 'down');
          setShowTags(v => !v);
        }}
        className={`text-sm transition-all cursor-pointer hover:scale-125 active:scale-95 ${
          msg.rating === 'down'
            ? 'opacity-100'
            : 'opacity-35 hover:opacity-80'
        }`}
        title={isRtl ? 'إجابة سيئة 👎' : 'Bad answer'}
        aria-label="Rate down"
      >
        👎
      </button>

      {/* 👎 → quick reason tags */}
      {msg.rating === 'down' && showTags && (
        <div className="flex flex-wrap items-center gap-1">
          {RATING_TAGS.map(t => {
            const active = msg.ratingTags?.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => {
                  const next = active
                    ? (msg.ratingTags ?? []).filter(x => x !== t.id)
                    : [...(msg.ratingTags ?? []), t.id];
                  rateMessage(msg.id, 'down', next);
                }}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                  active
                    ? 'bg-red-500/25 border-red-500/40 text-red-300'
                    : 'border-white/10 text-[var(--text-dim)] hover:border-red-500/30 hover:text-red-300'
                }`}
              >
                {isRtl ? t.ar : t.en}
              </button>
            );
          })}
          <span className="text-[9px] text-[var(--text-dim)] font-mono">
            {isRtl ? '· أمون هيتعلم من ده' : '· Amoun will learn'}
          </span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// GENERATION INDICATOR — live status + elapsed-seconds counter
// Full transparency: what is happening right now, in Arabic.
// ═══════════════════════════════════════════════════════════════════

function GenerationIndicator({ isRtl }: { isRtl: boolean }) {
  const { generationStatus, generationStartedAt } = useWorkspaceStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (generationStartedAt === null) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(Math.floor((Date.now() - generationStartedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [generationStartedAt]);

  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-purple-500/20 text-purple-400">
        <Bot size={14} />
      </div>
      <div className="glass rounded-xl px-3 py-2 flex flex-col gap-1.5 min-w-[200px] max-w-[280px]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-400)] animate-pulse shrink-0" />
          <span className="text-xs text-[var(--text-secondary)] leading-snug">
            {generationStatus || (isRtl ? 'جاري العمل…' : 'Working…')}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-400)] animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-400)] animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-400)] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-[10px] font-mono text-[var(--text-dim)]" dir="ltr">
            ⏱ {elapsed}s
          </span>
        </div>
      </div>
    </div>
  );
}
