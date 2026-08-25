import { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Check, Trash2, RotateCcw, Edit2, X, Send, ListChecks, Volume2, VolumeX } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import ChatInput from '@/components/ChatInput';
import { speak, stopSpeaking, getIsSpeaking, isTTSSupported } from '@/services/voice/VoiceService';
import type { ChatMessage } from '@/types';

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

  return (
    <div className="h-full flex flex-col">
      {/* Task extraction interactive banner */}
      {sessionTasks.length > 0 && (
        <div className="shrink-0 mx-4 mt-3 px-3 py-2.5 rounded-xl bg-[var(--accent-400)]/15 border border-[var(--accent-400)]/30 flex items-center justify-between gap-2 text-xs shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2">
            <ListChecks size={16} className="text-[var(--accent-400)] shrink-0" />
            <span className="text-[var(--text-primary)] font-medium">
              {isRtl
                ? `تم استخراج ${sessionTasks.length} مهمة من هذه المحادثة`
                : `${sessionTasks.length} task(s) extracted from this conversation`
              }
            </span>
          </div>
          <button
            onClick={() => useWorkspaceStore.getState().setActiveView('home')}
            className="px-2.5 py-1 rounded-lg bg-[var(--accent-400)] text-black font-bold text-[11px] hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1 shadow-sm shrink-0"
          >
            <span>{isRtl ? 'عرض المهام' : 'View Tasks'}</span>
          </button>
        </div>
      )}

      {/* Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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

        {isGenerating && <GenerationIndicator isRtl={isRtl} />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 p-4 border-t border-[var(--border)]">
        <ChatInput onSend={handleSend} disabled={isGenerating} />
      </div>
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
