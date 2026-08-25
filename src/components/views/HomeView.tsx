import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus, Trash2, Check, Edit3, X,
  Bot, Mic, MicOff, Send, Layers,
  FileUp, FileDown, Sparkles, Flame, Crown, RefreshCw, Zap, Terminal,
  FolderKanban, ListTodo, Users, BarChart3, Code2, PenLine,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useSwarmStore } from '@/store/swarmStore';
import { useEventLogger } from '@/hooks/useEventLogger';
import { APP_NAME_AR, QUICK_ACTIONS } from '@/constants';
import { isSTTSupported, startListening, stopListening } from '@/services/voice/VoiceService';
import { importTasks as parseImportTasks } from '@/lib/importers';
import { exportTasksAs } from '@/lib/exporters';
import type { ChatMode, Task } from '@/types';

// ═══════════════════════════════════════════════════════════════════
// COMMAND CENTER (مركز القيادة الذكي)
// Section 1: Hero كامل (العين + صندوق الشات + الفلاتر) — ملء الشاشة
// Section 2: اللوحات (تظهر مع السكرول) — كل الأكسنت تتبع الثيم النشط
// ═══════════════════════════════════════════════════════════════════

/** Local (not UTC) yyyy-mm-dd */
function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Consecutive active days ending today (or yesterday — streak survives till midnight). */
function calcStreak(dates: string[]): number {
  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date();
  if (!set.has(localDate(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (set.has(localDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Egypt week: Saturday → Friday. */
const WEEK_LETTERS = [
  { jsDay: 6, letter: 'س' },
  { jsDay: 0, letter: 'ح' },
  { jsDay: 1, letter: 'ن' },
  { jsDay: 2, letter: 'ث' },
  { jsDay: 3, letter: 'ر' },
  { jsDay: 4, letter: 'خ' },
  { jsDay: 5, letter: 'ج' },
];

const QUICK_ACTION_ICONS = { data: BarChart3, app: Code2, content: PenLine } as const;

/** Advanced modes (وزير switch OFF) — permissions/tools/skills per mode land in Phase 2 Modes Hub */
const ADVANCED_MODES: Array<{ id: ChatMode; icon: string; labelAr: string; labelEn: string }> = [
  { id: 'coding', icon: '💻', labelAr: 'برمجة', labelEn: 'Coding' },
  { id: 'research', icon: '🔬', labelAr: 'بحث علمي', labelEn: 'Research' },
  { id: 'education', icon: '🎓', labelAr: 'تعليم', labelEn: 'Education' },
];

export default function HomeView() {
  const {
    tasks, addTask, toggleTask, removeTask, editTask, importTasks, runTask,
    sendMessage, currentLanguage, setActiveView,
    projects, isGenerating,
    activityDates, dailySuggestion, generateDailySuggestion,
    chatMode, setChatMode,
  } = useWorkspaceStore();
  const agents = useSwarmStore((s) => s.agents);

  const isRtl = currentLanguage === 'ar';
  const isMinisterMode = chatMode === 'minister';
  const [showTasks, setShowTasks] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [importFeedback, setImportFeedback] = useState('');
  const [tasksExportOpen, setTasksExportOpen] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const tasksExportRef = useRef<HTMLDivElement>(null);

  const log = useEventLogger((s) => s);
  const metrics = useMemo(() => log.getMetrics(), [log.events.length]);
  const incompleteTasks = tasks.filter((t) => !t.completed);

  // ── Daily completion ──
  const today = localDate(new Date());
  const todayDone = tasks.filter((t) => t.completed && t.completedAt?.startsWith(today)).length;
  const dailyTotal = todayDone + incompleteTasks.length;
  const dailyPct = dailyTotal > 0 ? Math.round((todayDone / dailyTotal) * 100) : 0;

  // ── Streak + week ──
  const streak = calcStreak(activityDates);
  const weekDays = useMemo(() => {
    const now = new Date();
    const sinceSaturday = (now.getDay() + 1) % 7;
    const saturday = new Date(now);
    saturday.setDate(now.getDate() - sinceSaturday);
    return WEEK_LETTERS.map(({ jsDay, letter }, idx) => {
      const d = new Date(saturday);
      d.setDate(saturday.getDate() + idx);
      return { letter, date: localDate(d), isToday: localDate(d) === today, active: activityDates.includes(localDate(d)) };
    });
  }, [activityDates, today]);

  // ── Recent projects ──
  const recentProjects = useMemo(() => {
    const allSessions = useWorkspaceStore.getState().chatSessions;
    return [...projects]
      .map((p) => {
        const sessions = allSessions.filter((cs) => cs.projectId === p.id);
        const lastStr = sessions.reduce<string>((acc, cs) => (cs.date > acc ? cs.date : acc), p.createdAt);
        const days = Math.max(0, Math.floor((Date.now() - new Date(lastStr).getTime()) / 86_400_000));
        return { ...p, days, activityPct: Math.max(8, 100 - days * 8) };
      })
      .sort((a, b) => a.days - b.days)
      .slice(0, 3);
  }, [projects]);

  // ── Agents ──
  const agentRows = [
    { id: 'amoun', name: 'أمون', nameEn: 'Amoun', roleAr: 'الوزير — كل المهام', roleEn: 'The Minister — everything', working: isGenerating },
    { id: '7orus', name: 'حورس', nameEn: 'Horus', roleAr: 'الحرس — الأمان والفحص', roleEn: 'Guardian — security', working: agents['7orus']?.status === 'error' },
    { id: 'hermes', name: 'تحوت', nameEn: 'Thoth', roleAr: 'الكاتب — البرمجة', roleEn: 'Scribe — coding', working: false },
  ];

  // ── Actions ──
  const handleSendPrompt = (text: string) => {
    if (!text.trim() || isGenerating) return;
    sendMessage(text.trim());
    setActiveView('workspace');
  };

  const handleVoiceToggle = () => {
    if (!isSTTSupported()) {
      alert(isRtl ? 'المتصفح لا يدعم التسجيل الصوتي المباشر' : 'Speech recognition is not supported in this browser');
      return;
    }
    if (isRecording) {
      stopListening();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      startListening(currentLanguage, {
        onTranscriptReady: (transcript) => {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsRecording(false);
        },
        onError: () => setIsRecording(false),
        onStateChange: (state) => {
          if (state === 'idle') setIsRecording(false);
        },
      });
    }
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    addTask(newTaskText.trim(), 'manual');
    setNewTaskText('');
  };

  const startEdit = (t: Task) => { setEditingTaskId(t.id); setEditText(t.text); };
  const saveEdit = (id: string) => {
    if (editText.trim()) editTask(id, editText.trim());
    setEditingTaskId(null);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const content = await file.text();
      const drafts = parseImportTasks(file.name, content);
      if (drafts.length === 0) {
        setImportFeedback(isRtl ? '⚠️ المفروض مفيش مهام في الملف' : '⚠️ No tasks found in file');
        return;
      }
      const n = importTasks(drafts);
      setImportFeedback(isRtl ? `✅ تم استيراد ${n} مهمة` : `✅ Imported ${n} task(s)`);
      setShowTasks(true);
    } catch (err) {
      setImportFeedback(`❌ ${err instanceof Error ? err.message : 'فشل الاستيراد'}`);
    }
    setTimeout(() => setImportFeedback(''), 5000);
  };

  const handleExportTasks = (format: 'todoist-csv' | 'csv' | 'md' | 'json') => {
    exportTasksAs(tasks, format);
    setTasksExportOpen(false);
  };

  useEffect(() => {
    void generateDailySuggestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 — HERO في برواز: العين + الشات + الفلاتر
      ════════════════════════════════════════════════════════════ */}
      <section className="min-h-[calc(100dvh-150px)] flex flex-col items-center justify-center gap-3 px-4 pt-[5px] pb-3 relative">

        {/* 📊 شريط المهام + العمليات — في الهوا (من غير خلفية) محاذي لحواف البرواز */}
        <div className="relative z-10 w-full max-w-4xl flex items-center justify-between px-1">
          {/* Insight metrics — أقصى الشمال */}
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-[var(--accent-400)] flex items-center gap-1">
              <Zap size={11} /> {isRtl ? 'عمليات:' : 'Ops:'} <b>{metrics.totalOperations}</b>
            </span>
            <span className="text-[10px] font-mono text-[var(--accent-300)] flex items-center gap-1">
              <BarChart3 size={11} /> {isRtl ? 'توكنز:' : 'Tokens:'} <b>{metrics.totalTokens.toLocaleString()}</b>
            </span>
            <span className="text-[10px] font-mono text-purple-300 flex items-center gap-1">
              🧠 {isRtl ? 'أخطاء:' : 'Errors:'} <b>{metrics.totalErrors}</b>
            </span>
          </div>
          {/* زر التاسكات — أقصى اليمين + Accent */}
          <button
            onClick={() => setShowTasks(true)}
            className="text-[10px] font-mono flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--accent-400)] text-black font-bold hover:brightness-110 hover:scale-105 transition-all cursor-pointer shadow-[0_0_14px_var(--accent-glow)]"
            title={isRtl ? 'فتح لوحة المهام' : 'Open Tasks HUD'}
          >
            <ListTodo size={11} />
            {isRtl ? 'المهام' : 'Tasks'}
            {incompleteTasks.length > 0 && (
              <span className="px-1.5 rounded-full bg-black/25 text-white text-[9px]">{incompleteTasks.length}</span>
            )}
          </button>
        </div>

        {/* 🖼️ برواز منصة الأوامر — زي الشكل القديم (كورنر + ليبل + دوتس) */}
        <div className="relative w-full max-w-4xl glass rounded-2xl border border-white/10 p-5 md:p-8 flex flex-col items-center justify-center gap-5 min-h-[calc(100dvh-300px)] shadow-2xl overflow-hidden">
          {/* Cyber grid خفيف جوه البرواز */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* أركان البرواز */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[var(--accent-400)]/40 rounded-tl-sm pointer-events-none" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[var(--accent-400)]/40 rounded-tr-sm pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[var(--accent-400)]/40 rounded-bl-sm pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[var(--accent-400)]/40 rounded-br-sm pointer-events-none" />

          {/* ليبل البرواز + دوتس */}
          <div className="absolute top-3.5 left-4 flex items-center gap-2 text-[10px] md:text-xs text-[var(--text-dim)] font-mono tracking-wide pointer-events-none">
            <Terminal size={13} className="text-[var(--accent-400)] animate-pulse" />
            <span>{isRtl ? 'منصة الأوامر العصبية' : 'COMMAND CONSOLE'}</span>
          </div>
          <div className="absolute top-3.5 right-4 flex gap-1.5 pointer-events-none">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>

          {/* 👁️ العين — نظيفة من غير خلفيات أو دوائر */}
          <img
            src="/home-hero.png"
            alt="𓂀"
            draggable={false}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover select-none pointer-events-none relative z-10 mt-4"
          />

          {/* العنوان — مرفوع بعيد عن مايك الشات بوكس */}
          <div className="text-center relative z-10 -mt-1 mb-5">
            <h1 className="text-xl md:text-2xl font-bold font-[var(--font-display)] text-[var(--text-primary)]">
              {isRtl ? 'ابدأ مهمة جديدة' : 'Start a New Mission'} <Sparkles size={17} className="inline text-[var(--accent-400)] -mt-1" />
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              {isRtl ? 'صف ما تريد إنجازه، وسيتولى وزير التنفيذ.' : 'Describe what you want done — the Minister handles execution.'}
            </p>
          </div>

          {/* صندوق الشات — ستايل قديم: المايك في نص البوكس + سويتش وزير 3D */}
          <div className="relative z-10 max-w-2xl mx-auto w-full">
            <div className="relative rounded-2xl glass border border-[var(--accent-400)]/35 p-2 pt-3 shadow-[0_0_28px_var(--accent-glow)] focus-within:border-[var(--accent-400)] transition-all">

              {/* المايك — دائرة في نص البوكس من فوق (زي القديم بالظبط) */}
              <div className="flex justify-center -mt-8 mb-1">
                <button
                  onClick={handleVoiceToggle}
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer border-4 border-[#0d0d12] ${
                    isRecording
                      ? 'bg-red-500 text-white animate-bounce shadow-[0_0_25px_rgba(239,68,68,0.7)]'
                      : 'bg-[var(--accent-400)] text-black hover:scale-105 shadow-[0_0_20px_var(--accent-glow)]'
                  }`}
                  title={isRecording ? (isRtl ? 'إيقاف التسجيل' : 'Stop Recording') : (isRtl ? 'تحدث مع أمون بالصوت' : 'Speak with Amoun')}
                >
                  {isRecording ? <MicOff size={19} /> : <Mic size={19} />}
                </button>
              </div>

              {/* صف الإدخال — الارسال نزل لصف وزير */}
              <div className="flex items-center px-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendPrompt(inputText); setInputText(''); } }}
                  placeholder={isRecording
                    ? (isRtl ? '🎙️ جاري الاستماع إلى صوتك...' : '🎙️ Listening to your voice...')
                    : (isRtl ? 'اضغط على علامة المايك وقول كل اللي في نفسك 😉' : 'Click mic or type what you need...')}
                  dir="auto"
                  className="flex-1 bg-transparent text-sm text-center text-[var(--text-primary)] placeholder:text-[var(--text-dim)] outline-none py-1.5 px-2"
                />
              </div>

              {/* صف الأوضاع: سويتش وزير 3D + شرائح الأوضاع المتقدمة */}
              <div className="flex flex-wrap items-center gap-2 px-2 pt-2 pb-1 border-t border-white/5 mt-1.5">
                <button
                  onClick={() => setChatMode(isMinisterMode ? 'coding' : 'minister')}
                  className="relative flex items-center h-8 rounded-full px-1 transition-all duration-300 cursor-pointer shrink-0"
                  style={{
                    width: 96,
                    background: isMinisterMode
                      ? 'linear-gradient(145deg, var(--accent-500), var(--accent-600))'
                      : 'linear-gradient(145deg, #2b2b36, #17171f)',
                    boxShadow: isMinisterMode
                      ? 'inset 0 2px 5px rgba(0,0,0,0.35), 0 0 16px var(--accent-glow)'
                      : 'inset 0 2px 6px rgba(0,0,0,0.65)',
                  }}
                  title={isRtl ? 'وضع الوزير الصامت — يسمع ويفلتر ويسجل ويتابع' : 'Silent Minister mode — listens, filters, records, follows up'}
                  role="switch"
                  aria-checked={isMinisterMode}
                >
                  <span
                    className="absolute top-1 w-6 h-6 rounded-full transition-all duration-300"
                    style={{
                      [isRtl ? 'right' : 'left']: isMinisterMode ? '4px' : '62px',
                      background: isMinisterMode
                        ? 'linear-gradient(145deg, #ffffff, #b8c4cf)'
                        : 'linear-gradient(145deg, #8a8a96, #3d3d48)',
                      boxShadow: '0 3px 6px rgba(0,0,0,0.55), inset 0 -2px 3px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.6)',
                    }}
                  />
                  <span className={`w-full text-center text-[10px] font-bold font-mono transition-colors ${isMinisterMode ? 'text-black/80' : 'text-[var(--text-dim)]'}`}>
                    {isRtl ? 'وزير 👑' : 'MINISTER 👑'}
                  </span>
                </button>

                {!isMinisterMode && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ADVANCED_MODES.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setChatMode(m.id)}
                        className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                          chatMode === m.id
                            ? 'bg-[var(--accent-500)]/20 border-[var(--accent-400)]/50 text-[var(--accent-300)]'
                            : 'border-white/10 text-[var(--text-dim)] hover:border-[var(--accent-400)]/30 hover:text-[var(--text-secondary)]'
                        }`}
                      >
                        {m.icon} {isRtl ? m.labelAr : m.labelEn}
                      </button>
                    ))}
                  </div>
                )}
                {isMinisterMode && (
                  <span className="text-[9px] text-[var(--text-dim)] font-mono truncate">
                    {isRtl ? '· يسمع ← يفلتر ← يسجل ← يتابع' : '· listens → filters → records → follows up'}
                  </span>
                )}

                {/* الإرسال — نفس صف وزير */}
                <button
                  onClick={() => { handleSendPrompt(inputText); setInputText(''); }}
                  disabled={!inputText.trim() || isGenerating}
                  className="ms-auto p-2 rounded-xl bg-[var(--accent-400)] text-black disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer shadow-md shrink-0"
                  title={isRtl ? 'إرسال' : 'Send'}
                >
                  <Send size={15} className={isRtl ? '-scale-x-100' : ''} />
                </button>
              </div>
            </div>
          </div>

          {/* الفلاتر — 3 إجراءات سريعة */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 relative z-10 max-w-2xl mx-auto w-full">
            {QUICK_ACTIONS.map((qa) => {
              const Icon = QUICK_ACTION_ICONS[qa.id as keyof typeof QUICK_ACTION_ICONS] ?? Sparkles;
              return (
                <button
                  key={qa.id}
                  onClick={() => handleSendPrompt(isRtl ? qa.promptAr : qa.promptEn)}
                  disabled={isGenerating}
                className="glass rounded-xl p-3 text-start hover:border-[var(--accent-400)]/50 hover:bg-[var(--accent-500)]/5 transition-all cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center gap-2 mb-1">
                  {/* الأيقونة يمين + أنيميشن */}
                  <Icon
                    size={16}
                    className="text-[var(--accent-400)] shrink-0 transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-12 drop-shadow-[0_0_6px_var(--accent-glow)]"
                  />
                  <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-300)] transition-colors">
                    {isRtl ? qa.titleAr : qa.titleEn}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--text-dim)] leading-snug">
                  {isRtl ? qa.descAr : qa.descEn}
                </p>
              </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2 — اللوحات (تظهر مع السكرول)
      ════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 pb-10 grid grid-cols-1 lg:grid-cols-[1fr_270px] gap-3 md:gap-4">

        {/* MAIN */}
        <div className="flex flex-col gap-3 md:gap-4 min-w-0">

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">

            {/* مهمتك اليومية */}
            <div className="glass rounded-2xl p-4 flex flex-col border border-white/5">
              <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 mb-3">
                <ListTodo size={14} className="text-[var(--accent-400)]" />
                {isRtl ? 'مهمتك اليومية' : 'Your Daily Mission'}
              </h3>
              <div className="flex items-center gap-4 flex-1">
                <div className="relative w-[74px] h-[74px] shrink-0">
                  <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                    <circle
                      cx="40" cy="40" r="34" fill="none"
                      stroke="var(--accent-400)" strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${(dailyPct / 100) * 2 * Math.PI * 34} ${2 * Math.PI * 34}`}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold font-mono text-[var(--text-primary)]">
                    {dailyPct}%
                  </span>
                </div>
                <div className="text-xs space-y-1.5">
                  <p className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                    <Check size={12} className="text-[var(--accent-400)]" />
                    <span className="font-bold font-mono">{todayDone} / {dailyTotal}</span>
                    <span className="text-[var(--text-dim)]">{isRtl ? 'المهام المنجزة' : 'completed'}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                    <Flame size={12} className="text-[var(--accent-400)]" />
                    <span className="font-bold font-mono">{streak}</span>
                    <span className="text-[var(--text-dim)]">{isRtl ? 'أيام سلسلة الإنجاز' : 'day streak'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTasks(true)}
                className="mt-3 w-full py-2 rounded-xl text-[11px] font-bold bg-white/5 border border-white/10 text-[var(--text-secondary)] hover:border-[var(--accent-400)]/50 hover:text-[var(--accent-300)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ListTodo size={12} />
                {isRtl ? 'عرض المهام' : 'View Tasks'}
                {incompleteTasks.length > 0 && (
                  <span className="px-1.5 rounded-full bg-[var(--accent-400)] text-black text-[9px]">{incompleteTasks.length}</span>
                )}
              </button>
            </div>

            {/* الوكلاء النشطون */}
            <div className="glass rounded-2xl p-4 flex flex-col border border-white/5">
              <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 mb-3">
                <Users size={14} className="text-purple-400" />
                {isRtl ? 'الوكلاء النشطون' : 'Active Agents'}
              </h3>
              <div className="flex-1 space-y-2">
                {agentRows.map((a) => (
                  <div key={a.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-white/2 border border-white/5">
                    <span className="w-7 h-7 rounded-full bg-purple-500/15 text-purple-300 flex items-center justify-center shrink-0">
                      <Bot size={13} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-[var(--text-primary)] truncate">
                        {isRtl ? a.name : a.nameEn}
                      </p>
                      <p className="text-[9px] text-[var(--text-dim)] truncate">
                        {isRtl ? a.roleAr : a.roleEn}
                      </p>
                    </div>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${a.working ? 'bg-[var(--accent-400)] animate-pulse shadow-[0_0_8px_var(--accent-glow)]' : 'bg-emerald-500/50'}`} />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveView('settings')}
                className="mt-3 w-full py-2 rounded-xl text-[11px] font-bold bg-white/5 border border-white/10 text-[var(--text-secondary)] hover:border-purple-400/50 hover:text-purple-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Bot size={12} />
                {isRtl ? 'إدارة الوكلاء' : 'Manage Agents'}
              </button>
            </div>

            {/* مشاريعك الأخيرة */}
            <div className="glass rounded-2xl p-4 flex flex-col border border-white/5 sm:col-span-2 xl:col-span-1">
              <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 mb-3">
                <FolderKanban size={14} className="text-[var(--accent-400)]" />
                {isRtl ? 'مشاريعك الأخيرة' : 'Recent Projects'}
              </h3>
              <div className="flex-1 space-y-2.5">
                {recentProjects.length === 0 && (
                  <p className="text-[11px] text-[var(--text-dim)] text-center py-4">
                    {isRtl ? 'لا توجد مشاريع بعد' : 'No projects yet'}
                  </p>
                )}
                {recentProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActiveView('projects')}
                    className="w-full text-start p-2.5 rounded-xl bg-white/2 border border-white/5 hover:border-[var(--accent-400)]/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-300)] transition-colors">
                        {p.icon ?? '📁'} {p.name}
                      </span>
                      <span className="text-[9px] text-[var(--text-dim)] font-mono shrink-0">
                        {p.days === 0 ? (isRtl ? 'اليوم' : 'Today') : isRtl ? `منذ ${p.days} يوم` : `${p.days}d ago`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--accent-400)]/80 transition-all duration-700"
                        style={{ width: `${p.activityPct}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-[var(--text-dim)] mt-1">
                      {sessionsCount(p.id)} {isRtl ? 'جلسة' : 'sessions'} · {isRtl ? 'مستوى النشاط' : 'activity'} {p.activityPct}%
                    </p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setActiveView('projects')}
                className="mt-3 w-full py-2 rounded-xl text-[11px] font-bold bg-white/5 border border-white/10 text-[var(--text-secondary)] hover:border-[var(--accent-400)]/50 hover:text-[var(--accent-300)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FolderKanban size={12} />
                {isRtl ? 'عرض جميع المشاريع' : 'View All Projects'}
              </button>
            </div>
          </div>
        </div>

        {/* SIDE RAIL */}
        <div className="flex flex-col gap-3 md:gap-4">

          {/* اقتراح أُمون */}
          <div className="glass rounded-2xl p-4 border border-[var(--accent-400)]/20 flex flex-col">
            <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-[var(--accent-400)]" />
                {isRtl ? 'اقتراح أُمون' : "Amoun's Suggestion"}
              </span>
              <button
                onClick={() => void generateDailySuggestion(true)}
                disabled={isGenerating}
                className="p-1 rounded-lg text-[var(--text-dim)] hover:text-[var(--accent-300)] hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-40"
                title={isRtl ? 'اقتراح جديد' : 'New suggestion'}
              >
                <RefreshCw size={12} />
              </button>
            </h3>
            <p className="text-[10px] text-[var(--text-dim)] mb-2.5">
              {isRtl ? 'خطوتك التالية المقترحة' : 'Your suggested next step'}
            </p>

            {dailySuggestion ? (
              <>
                <div className="rounded-xl bg-white/3 border border-white/8 p-3 mb-3 flex-1">
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed">{dailySuggestion.text}</p>
                </div>
                <button
                  onClick={() => handleSendPrompt(dailySuggestion.text)}
                  disabled={isGenerating}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-[var(--accent-400)] text-black hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_18px_var(--accent-glow)] disabled:opacity-50 mb-2"
                >
                  {isRtl ? 'ابدأ التنفيذ' : 'Start Now'}
                  <Send size={12} className={isRtl ? '-scale-x-100' : ''} />
                </button>
                {dailySuggestion.reason && (
                  <div className="text-[10px] text-[var(--text-dim)] leading-relaxed border-t border-white/5 pt-2">
                    <span className="font-bold text-[var(--text-muted)]">{isRtl ? 'لماذا هذا الاقتراح؟' : 'Why this?'}</span>
                    <p className="mt-0.5">{dailySuggestion.reason}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center py-6">
                <p className="text-[11px] text-[var(--text-dim)] text-center animate-pulse">
                  {isRtl ? 'أمون بيجهز اقتراح اليوم…' : 'Amoun is preparing today’s suggestion…'}
                </p>
              </div>
            )}
            <p className="text-[9px] text-[var(--text-dim)] opacity-60 mt-2.5 text-center">
              🔄 {isRtl ? 'تحديث يومي · 09:00 صباحاً' : 'Refreshes daily · 09:00 AM'}
            </p>
          </div>

          {/* إنجازك المستمر */}
          <div className="glass rounded-2xl p-4 border border-[var(--accent-400)]/15">
            <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center justify-center gap-1.5 mb-3">
              <Crown size={14} className="text-[var(--accent-400)]" />
              {isRtl ? 'إنجازك المستمر' : 'Your Streak'}
            </h3>
            <div className="flex items-center justify-center gap-4 mb-3">
              <span className="w-14 h-14 rounded-full bg-[var(--accent-500)]/10 border-2 border-[var(--accent-400)]/40 flex items-center justify-center text-2xl">
                👑
              </span>
              <div>
                <p className="text-3xl font-bold font-mono text-[var(--accent-300)] leading-none">{streak}</p>
                <p className="text-[10px] text-[var(--text-dim)] mt-1">{isRtl ? 'أيام متتالية' : 'days in a row'}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              {weekDays.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                    d.active
                      ? 'bg-[var(--accent-500)]/20 text-[var(--accent-300)] border border-[var(--accent-400)]/40'
                      : d.isToday
                        ? 'border border-dashed border-[var(--accent-400)]/50 text-[var(--accent-300)]'
                        : 'bg-white/4 text-[var(--text-dim)] border border-white/8'
                  }`}>
                    {d.active ? <Check size={11} className="stroke-[3]" /> : d.letter}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-center text-[9px] text-[var(--text-dim)] opacity-60 mt-2.5">
              {isRtl ? `${APP_NAME_AR} — سلسلتك بتنكسر لو يوم كامل من غير نشاط` : 'Your streak breaks after a fully inactive day'}
            </p>
          </div>
        </div>
      </section>

      {/* ══════════ TASKS HUD OVERLAY ══════════ */}
      <AnimatePresence>
        {showTasks && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="fixed top-16 inset-x-3 md:inset-x-8 glass rounded-2xl border border-[var(--accent-400)]/40 overflow-hidden z-50 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
          >
            <div className="p-3.5 bg-white/4 border-b border-[var(--border)] flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[var(--accent-400)] flex items-center gap-2">
                <Layers size={15} />
                {isRtl ? 'لوحة المهام والعمليات التفاعلية' : 'Interactive Task Operations'}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-[var(--text-dim)]">
                  {incompleteTasks.length} {isRtl ? 'مهام متبقية' : 'pending'}
                </span>

                <input
                  ref={importFileRef}
                  type="file"
                  accept=".json,.csv,.md,.markdown"
                  className="hidden"
                  onChange={handleImportFile}
                />
                <button
                  onClick={() => importFileRef.current?.click()}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--accent-400)] transition-colors cursor-pointer"
                  title={isRtl ? 'استيراد مهام (JSON/CSV/MD)' : 'Import tasks (JSON/CSV/MD)'}
                >
                  <FileUp size={14} />
                </button>

                <div className="relative" ref={tasksExportRef}>
                  <button
                    onClick={() => setTasksExportOpen(v => !v)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      tasksExportOpen
                        ? 'bg-[var(--accent-500)]/20 text-[var(--accent-400)]'
                        : 'hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--accent-400)]'
                    }`}
                    title={isRtl ? 'تصدير المهام' : 'Export tasks'}
                  >
                    <FileDown size={14} />
                  </button>
                  <AnimatePresence>
                    {tasksExportOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className="absolute top-full mt-1 end-0 w-56 bg-[#0c0c14] border border-white/10 rounded-xl shadow-2xl py-1 z-[60] overflow-hidden"
                      >
                        {([
                          { id: 'todoist-csv' as const, labelAr: 'CSV — استيراد Todoist', labelEn: 'CSV — Todoist import' },
                          { id: 'csv' as const, labelAr: 'CSV عام (Excel)', labelEn: 'Generic CSV (Excel)' },
                          { id: 'md' as const, labelAr: 'Markdown (Notion/Obsidian)', labelEn: 'Markdown (Notion/Obsidian)' },
                          { id: 'json' as const, labelAr: 'JSON', labelEn: 'JSON' },
                        ]).map(f => (
                          <button
                            key={f.id}
                            onClick={() => handleExportTasks(f.id)}
                            className="w-full px-3 py-2 text-[11px] text-start text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                          >
                            {isRtl ? f.labelAr : f.labelEn}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={() => setShowTasks(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {importFeedback && (
              <p className="px-3.5 py-1.5 text-[11px] font-mono text-[var(--accent-400)] bg-white/3 border-b border-[var(--border)]">
                {importFeedback}
              </p>
            )}

            <div className="p-3 max-h-64 overflow-y-auto space-y-2 custom-scrollbar">
              {tasks.length === 0 && (
                <p className="text-xs text-[var(--text-dim)] text-center py-6">
                  {isRtl ? 'لا توجد مهام حالياً. تحدث مع أمون لاستخراجها تلقائياً.' : 'No tasks yet. Speak to Amoun to extract them automatically.'}
                </p>
              )}
              {tasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 group p-2.5 rounded-xl bg-white/2 hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                      task.completed ? 'bg-[var(--accent-400)] border-[var(--accent-400)]' : 'border-[var(--border)] hover:border-[var(--accent-400)]'
                    }`}
                  >
                    {task.completed && <Check size={10} className="text-black stroke-[3]" />}
                  </button>

                  {editingTaskId === task.id ? (
                    <div className="flex-1 flex gap-1 items-center">
                      <input
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit(task.id)}
                        className="flex-1 bg-white/10 border border-[var(--accent-400)] rounded px-2 py-0.5 text-xs outline-none text-[var(--text-primary)]"
                        autoFocus
                      />
                      <button onClick={() => saveEdit(task.id)} className="text-[var(--accent-400)] hover:opacity-80"><Check size={12} /></button>
                      <button onClick={() => setEditingTaskId(null)} className="text-[var(--text-muted)] hover:opacity-80"><X size={12} /></button>
                    </div>
                  ) : (
                    <>
                      <span className={`flex-1 text-xs leading-relaxed ${task.completed ? 'line-through text-[var(--text-dim)]' : 'text-[var(--text-primary)]'}`}>
                        {task.text}
                      </span>
                      {task.source === 'ai' && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          AI
                        </span>
                      )}
                      {!task.completed && (
                        <button
                          onClick={() => runTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-[var(--accent-400)] text-black hover:brightness-110 transition-all cursor-pointer shrink-0"
                          title={isRtl ? 'تنفيذ فوري في الشات' : 'Run now in chat'}
                        >
                          ▶ RUN
                        </button>
                      )}
                      <button onClick={() => startEdit(task)} className="opacity-0 group-hover:opacity-100 text-[var(--text-dim)] hover:text-[var(--accent-400)] p-1 cursor-pointer transition-opacity">
                        <Edit3 size={11} />
                      </button>
                      <button onClick={() => removeTask(task.id)} className="opacity-0 group-hover:opacity-100 text-[var(--text-dim)] hover:text-red-400 p-1 cursor-pointer transition-opacity">
                        <Trash2 size={11} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 p-3 bg-black/40 border-t border-[var(--border)]">
              <input
                value={newTaskText}
                onChange={e => setNewTaskText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                placeholder={isRtl ? 'أضف مهمة جديدة...' : 'Add a task...'}
                className="flex-1 bg-white/5 border border-[var(--border)] rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--accent-400)] text-[var(--text-primary)] placeholder:text-[var(--text-dim)]"
              />
              <button
                onClick={handleAddTask}
                className="px-4 py-2 rounded-xl bg-[var(--accent-400)] text-black text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer shadow-md"
              >
                <Plus size={13} />
                <span>{isRtl ? 'إضافة' : 'Add'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Scroll hint chevron (inline stub to avoid extra import). */
function ChevronDownStub() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** Session count per project (helper for the projects panel). */
function sessionsCount(projectId: string): number {
  return useWorkspaceStore
    .getState()
    .chatSessions.filter((cs) => cs.projectId === projectId).length;
}
