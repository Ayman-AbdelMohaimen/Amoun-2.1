import { useState } from 'react';
import { ChevronDown, ChevronRight, Terminal, CheckCircle2, Clock, Play, FileCode } from 'lucide-react';
import type { SessionEvent } from '@/types';

interface LiveProcessBadgeProps {
  title: string;
  durationSeconds?: number;
  count?: number;
  type?: 'files' | 'process' | 'terminal' | 'background';
  events?: SessionEvent[];
  isCompleted?: boolean;
  isRtl?: boolean;
}

export default function LiveProcessBadge({
  title,
  durationSeconds,
  count,
  type = 'process',
  events = [],
  isCompleted = false,
  isRtl = true,
}: LiveProcessBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    if (mins > 0) return `${mins}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="my-1.5 max-w-xl text-start" dir={isRtl ? 'rtl' : 'ltr'}>
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all cursor-pointer select-none ${
          expanded
            ? 'bg-black/60 border-[var(--accent-400)]/40 text-[var(--accent-300)] shadow-sm'
            : 'bg-white/5 border-white/10 text-[var(--text-secondary)] hover:border-white/25 hover:text-[var(--text-primary)]'
        }`}
      >
        {isCompleted ? (
          <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-[var(--accent-400)] animate-pulse shrink-0" />
        )}

        {type === 'files' && <FileCode size={13} className="text-teal-400 shrink-0" />}
        {type === 'terminal' && <Terminal size={13} className="text-amber-400 shrink-0" />}
        {type === 'process' && <Play size={13} className="text-purple-400 shrink-0" />}

        <span className="font-mono text-[11px] truncate">{title}</span>

        {count != null && (
          <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px] font-mono">
            {count}
          </span>
        )}

        {durationSeconds != null && (
          <span className="text-[10px] font-mono text-[var(--text-dim)] flex items-center gap-1">
            <Clock size={10} />
            {formatDuration(durationSeconds)}
          </span>
        )}

        <span className="ms-auto ps-1 opacity-60">
          {expanded ? (
            <ChevronDown size={13} />
          ) : isRtl ? (
            <ChevronRight size={13} className="rotate-180" />
          ) : (
            <ChevronRight size={13} />
          )}
        </span>
      </button>

      {/* Collapsible details preview */}
      {expanded && (
        <div className="mt-2 p-3 rounded-xl bg-black/60 border border-white/10 glass text-xs font-mono space-y-2 animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between text-[10px] text-[var(--text-dim)] border-b border-white/10 pb-1.5">
            <span className="flex items-center gap-1 text-emerald-400">
              <Terminal size={12} />
              {isRtl ? 'سجل العمليات اللحظي' : 'Live Execution Pipeline'}
            </span>
            <span>{isCompleted ? 'Done' : 'Running...'}</span>
          </div>

          {events.length === 0 ? (
            <p className="text-[11px] text-zinc-500 py-1">
              {isRtl ? 'لا توجد تفاصيل إضافية مسجلة لهذه الخطوة.' : 'No detailed logs recorded for this step.'}
            </p>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar text-[11px]">
              {events.slice(-6).map((ev, i) => (
                <div key={ev.id || i} className="flex items-start gap-2 text-zinc-300">
                  <span className="text-zinc-500 text-[10px] shrink-0">
                    [{new Date(ev.timestamp).toLocaleTimeString()}]
                  </span>
                  <span className="text-emerald-400 shrink-0">❯</span>
                  <span className="truncate">
                    {typeof ev.payload === 'object' ? JSON.stringify(ev.payload) : String(ev.payload)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
