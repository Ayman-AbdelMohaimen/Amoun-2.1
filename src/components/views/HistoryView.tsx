import { useState, useMemo } from 'react';
import {
  ScrollText, MessageSquare, MoreVertical, Edit3, Sparkles, Trash2,
  ExternalLink, Search, ChevronDown, ChevronUp, ArrowRight,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { processPrompt } from '@/services/AIGateway';

export default function HistoryView() {
  const {
    chatSessions,
    currentLanguage,
    setCurrentSession,
    renameSession,
    deleteSession,
    setActiveView,
    activeModel,
    activeProviderId,
  } = useWorkspaceStore();

  const isRtl = currentLanguage === 'ar';
  const [query, setQuery] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);

  const filteredSessions = useMemo(() => {
    if (!query.trim()) return chatSessions;
    const q = query.trim().toLowerCase();
    return chatSessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.messages.some((m) => m.content.toLowerCase().includes(q)),
    );
  }, [chatSessions, query]);

  const handleSmartSummarize = async (sessionId: string) => {
    const session = chatSessions.find((s) => s.id === sessionId);
    if (!session || session.messages.length === 0) return;
    setSummarizingId(sessionId);
    setOpenDropdownId(null);

    try {
      const messagesText = session.messages
        .filter((m) => m.role !== 'system')
        .slice(-10)
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');

      const prompt = `ملخص هذه المحادثة في عنوان جذاب ومختصر للغاية (3 إلى 5 كلمات فقط):\n${messagesText}`;
      const response = await processPrompt({
        messages: [{ id: crypto.randomUUID(), role: 'user', content: prompt, timestamp: new Date().toISOString() }],
        modelId: activeModel,
        providerId: activeProviderId,
        systemPrompt: 'أنت ملخص محادثات ذكي. أعد فقط العنوان الجديد بدون مقدمات أو علامات تنصيص.',
      });

      const newTitle = response.content.trim().replace(/^["'«»]|["'«»]$/g, '');
      if (newTitle) {
        renameSession(sessionId, newTitle);
      }
    } catch (err) {
      console.error('[HistoryView] Summarize error:', err);
    } finally {
      setSummarizingId(null);
    }
  };

  const fmtDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-6 relative" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Bar with Back Button */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('home')}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[var(--accent-400)]/40 transition-all cursor-pointer text-[var(--text-secondary)] hover:text-white"
            title={isRtl ? 'العودة للرئيسية' : 'Back to Home'}
          >
            <ArrowRight size={18} className={isRtl ? '' : 'rotate-180'} />
          </button>
          <div>
            <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--text-primary)] flex items-center gap-2">
              <span>{isRtl ? 'البرديات' : 'Papyri Archives'}</span>
              <ScrollText size={22} className="text-amber-400" />
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {isRtl
                ? 'إدارة وتنظيم المحادثات السابقة والملخصات الذكية'
                : 'Manage, summarize, and organize past conversation neural uplinks'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isRtl ? 'البحث في عناوين ومحتويات المحادثات...' : 'Search in titles and content...'}
            className="w-full bg-black/40 border border-white/10 rounded-xl ps-9 pe-4 py-2 text-xs outline-none focus:border-[var(--accent-400)] text-[var(--text-primary)] shadow-inner"
          />
        </div>
      </div>

      {/* Sessions List / Cards */}
      {filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center glass rounded-2xl p-8 border border-white/5">
          <ScrollText size={48} className="text-[var(--text-dim)] mb-3 opacity-40" />
          <p className="text-sm font-medium text-[var(--text-muted)]">
            {isRtl ? 'لا توجد محادثات مخزنة بعد.' : 'No saved neural uplinks found.'}
          </p>
          <p className="text-xs text-[var(--text-dim)] mt-1">
            {isRtl ? 'كل محادثة جديدة تفتحها مع أمون ستحفظ كبردية هنا تلقائياً.' : 'New chats with Amoun will be archived here automatically.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl mx-auto">
          {filteredSessions.map((session) => {
            const isExpanded = expandedSessionId === session.id;
            const isDropdownOpen = openDropdownId === session.id;
            const isSummarizing = summarizingId === session.id;
            const lastMsg = session.messages[session.messages.length - 1];

            return (
              <div
                key={session.id}
                className="group relative glass rounded-2xl border border-[var(--accent-400)]/20 hover:border-[var(--accent-400)]/50 transition-all p-4 md:p-5 shadow-lg overflow-visible"
              >
                {/* Top session header */}
                <div className="flex items-start justify-between gap-3">
                  {/* Title & Stats */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={16} className="text-[var(--accent-400)] shrink-0" />
                      <h3 className="text-base font-bold text-[var(--text-primary)] truncate font-mono">
                        {session.title || (isRtl ? 'بردية بدون عنوان' : 'Untitled Neural Uplink')}
                      </h3>
                      {isSummarizing && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono animate-pulse">
                          <Sparkles size={11} /> {isRtl ? 'جاري التلخيص...' : 'Summarizing...'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[var(--text-dim)] mt-1.5 font-mono">
                      <span>🕒 {fmtDate(session.date)}</span>
                      <span>•</span>
                      <span>💬 {session.messages.length} {isRtl ? 'رسائل' : 'messages'}</span>
                    </div>
                  </div>

                  {/* Actions: Expand arrow + 3 Dots dropdown */}
                  <div className="flex items-center gap-2 shrink-0 relative">
                    <button
                      onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-dim)] hover:text-white transition-colors"
                      title={isExpanded ? (isRtl ? 'طي' : 'Collapse') : (isRtl ? 'معاينة' : 'Preview')}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {/* 3 Dots Menu Button */}
                    <button
                      onClick={() => setOpenDropdownId(isDropdownOpen ? null : session.id)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* 3-Dots Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute top-8 start-0 z-50 glass glow-lg rounded-xl border border-white/15 p-1.5 w-44 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <button
                          onClick={() => {
                            const newName = prompt(isRtl ? 'إدخال اسم جديد للبردية:' : 'Enter new title:', session.title);
                            if (newName?.trim()) renameSession(session.id, newName.trim());
                            setOpenDropdownId(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                        >
                          <Edit3 size={13} className="text-amber-400" />
                          <span>{isRtl ? 'تعديل الاسم' : 'Rename'}</span>
                        </button>

                        <button
                          onClick={() => handleSmartSummarize(session.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                        >
                          <Sparkles size={13} className="text-purple-400" />
                          <span>{isRtl ? 'تلخيص ذكي' : 'Smart Summarize'}</span>
                        </button>

                        <div className="my-1 border-t border-white/10" />

                        <button
                          onClick={() => {
                            deleteSession(session.id);
                            setOpenDropdownId(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/15 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                          <span>{isRtl ? 'حذف' : 'Delete'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Session Content Preview */}
                <div className="mt-3 pt-3 border-t border-white/5">
                  {session.messages.length === 0 ? (
                    <p className="text-xs text-[var(--text-dim)] italic">
                      {isRtl ? 'لا توجد رسائل في هذه المحادثة بعد.' : 'No messages in this conversation yet.'}
                    </p>
                  ) : isExpanded ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pe-2 my-2">
                      {session.messages.map((m) => (
                        <div key={m.id} className="text-xs flex gap-2">
                          <span className="font-bold text-[var(--accent-400)] shrink-0">
                            {m.role === 'user' ? (isRtl ? 'أنت:' : 'User:') : 'أمون:'}
                          </span>
                          <span className="text-[var(--text-secondary)] line-clamp-2">{m.content}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 font-sans leading-relaxed">
                      {lastMsg ? `${lastMsg.role === 'user' ? '👤' : '👑'} ${lastMsg.content}` : ''}
                    </p>
                  )}
                </div>

                {/* Bottom Action: Open Conversation & Load */}
                <div className="mt-4 pt-2 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setCurrentSession(session.id);
                      setActiveView('workspace');
                    }}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-xl border border-[var(--accent-400)]/40 bg-[var(--accent-400)]/15 text-[var(--accent-300)] text-xs font-medium hover:bg-[var(--accent-400)]/25 hover:border-[var(--accent-400)] transition-all cursor-pointer shadow-md"
                  >
                    <span>{isRtl ? 'فتح المحادثة والتحميل' : 'Open Neural Uplink'}</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
