import { useState, useRef, useCallback, type KeyboardEvent } from 'react';
import { Send, Square, Paperclip, Mic, MicOff, Volume2 } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { CHAT_MODES } from '@/constants';
import type { Attachment } from '@/types';
import { estimateContextTokens, getModelMaxTokens } from '@/services/learning/TokenManager';
import {
  startListening,
  stopListening,
  getIsRecording,
  isSTTSupported,
} from '@/services/voice/VoiceService';
import type { VoiceState } from '@/services/voice/VoiceService';

export default function ChatInput({ onSend, disabled, compact }: {
  onSend: (text: string, attachment?: File) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const { chatMode, setChatMode, currentLanguage, isGenerating, stopGeneration, voiceEnabled, voiceGender } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';
  const [text, setText] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!text.trim() && !attachedFile) return;
    onSend(text.trim(), attachedFile ?? undefined);
    setText('');
    setAttachedFile(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 10 * 1024 * 1024) setAttachedFile(file);
    e.target.value = '';
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 200) + 'px'; }
  };

  // ── Voice recording handler ──
  const handleMicClick = useCallback(() => {
    if (voiceState === 'recording') {
      stopListening();
      setVoiceState('idle');
      return;
    }

    if (!isSTTSupported()) {
      alert(isRtl ? 'المتصفح لا يدعم التعرف على الصوت. جرّب Chrome.' : 'Browser does not support speech recognition. Try Chrome.');
      return;
    }

    startListening(currentLanguage, {
      onTranscriptReady: (transcript) => {
        setText((prev) => {
          const newText = prev ? `${prev} ${transcript}` : transcript;
          // Auto-resize after setting text
          setTimeout(() => autoResize(), 0);
          return newText;
        });
        setVoiceState('idle');
      },
      onStateChange: (state) => {
        setVoiceState(state);
      },
      onError: (error) => {
        console.error('[VoiceService]', error);
        setVoiceState('idle');
      },
    });
  }, [voiceState, currentLanguage, isRtl]);

  const isRecording = voiceState === 'recording';

  const isMinisterMode = chatMode === 'minister';

  return (
    <div className={"relative glass rounded-2xl border border-[var(--accent-400)]/30 p-2 pt-3 shadow-[0_0_24px_var(--accent-glow)] focus-within:border-[var(--accent-400)] transition-all " + (compact ? 'max-w-xl mx-auto' : 'w-full')}>
      {attachedFile && (
        <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-white/5 border border-white/10 text-xs">
          <Paperclip size={14} className="text-[var(--accent-400)]" />
          <span className="flex-1 truncate text-[var(--text-secondary)]">{attachedFile.name}</span>
          <button onClick={() => setAttachedFile(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-400 font-medium">
            {isRtl ? '🎙️ جاري الاستماع إلى صوتك...' : '🎙️ Listening to your voice...'}
          </span>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center px-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => { setText(e.target.value); autoResize(); }}
          onKeyDown={handleKeyDown}
          placeholder={isRecording
            ? (isRtl ? '🎙️ تحدث الآن...' : '🎙️ Speak now...')
            : (isRtl ? 'اكتب رسالتك أو استفسارك لأمون وزير التنفيذ...' : 'Type your query for Amoun...')}
          disabled={disabled || isGenerating}
          rows={1}
          className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] resize-none outline-none max-h-[160px] leading-relaxed py-1"
          dir="auto"
        />
      </div>

      {/* Bottom Controls Bar (Harmonized with Home Center) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-2 pb-1 border-t border-white/5 mt-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* 3D Minister Switch */}
          <button
            onClick={() => setChatMode(isMinisterMode ? 'coding' : 'minister')}
            className="relative flex items-center h-7 rounded-full px-1 transition-all duration-300 cursor-pointer shrink-0"
            style={{
              width: 88,
              background: isMinisterMode
                ? 'linear-gradient(145deg, var(--accent-500), var(--accent-600))'
                : 'linear-gradient(145deg, #2b2b36, #17171f)',
              boxShadow: isMinisterMode
                ? 'inset 0 2px 5px rgba(0,0,0,0.35), 0 0 14px var(--accent-glow)'
                : 'inset 0 2px 6px rgba(0,0,0,0.65)',
            }}
            title={isRtl ? 'وضع الوزير — يسمع ويفلتر ويسجل ويتابع' : 'Minister mode'}
            role="switch"
            aria-checked={isMinisterMode}
          >
            <span
              className="absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300"
              style={{
                [isRtl ? 'right' : 'left']: isMinisterMode ? '3px' : '58px',
                background: isMinisterMode
                  ? 'linear-gradient(145deg, #ffffff, #b8c4cf)'
                  : 'linear-gradient(145deg, #8a8a96, #3d3d48)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.55)',
              }}
            />
            <span className={`w-full text-center text-[9px] font-bold font-mono transition-colors ${isMinisterMode ? 'text-black/80' : 'text-[var(--text-dim)]'}`}>
              {isRtl ? 'وزير 👑' : 'MINISTER 👑'}
            </span>
          </button>

          {/* Other Mode Pills */}
          {!isMinisterMode && (
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {CHAT_MODES.filter(m => m.id !== 'minister').map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setChatMode(mode.id)}
                  className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                    chatMode === mode.id
                      ? 'bg-[var(--accent-500)]/20 border-[var(--accent-400)]/50 text-[var(--accent-300)]'
                      : 'border-white/10 text-[var(--text-dim)] hover:border-[var(--accent-400)]/30 hover:text-[var(--text-secondary)]'
                  }`}
                >
                  {mode.icon} {isRtl ? mode.labelAr : mode.labelEn}
                </button>
              ))}
            </div>
          )}

          {/* Token Budget Indicator */}
          {(() => {
            const { chatSessions, currentSessionId, activeModel } = useWorkspaceStore.getState();
            const session = chatSessions.find((s) => s.id === currentSessionId);
            const messages = session?.messages ?? [];
            const currentTokens = estimateContextTokens(messages);
            const maxTokens = getModelMaxTokens(activeModel);
            const percentage = Math.min(100, Math.round((currentTokens / maxTokens) * 100));

            const colorClass =
              percentage >= 70
                ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
                : 'text-[var(--text-dim)] border-white/10 bg-white/5';

            return (
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-mono shrink-0 transition-colors ${colorClass}`}
                title={
                  isRtl
                    ? `استهلاك السياق: ${currentTokens.toLocaleString()} من ${maxTokens.toLocaleString()} توكن (${percentage}%)`
                    : `Context: ${currentTokens.toLocaleString()} / ${maxTokens.toLocaleString()} tokens (${percentage}%)`
                }
              >
                <span>⚡ {currentTokens > 1000 ? `${(currentTokens / 1000).toFixed(1)}k` : currentTokens}</span>
                <span className="opacity-60">/ {maxTokens > 1000 ? `${(maxTokens / 1000).toFixed(0)}k` : maxTokens}</span>
                <span className={`font-semibold ${percentage >= 70 ? 'text-amber-400' : 'text-[var(--accent-400)]'}`}>
                  ({percentage}%)
                </span>
              </div>
            );
          })()}
        </div>

        {/* Action Buttons: Mic, Attachment, Send */}
        <div className="flex items-center gap-1 ms-auto shrink-0">
          <button
            onClick={handleMicClick}
            className={
              "p-2 rounded-lg transition-all " +
              (isRecording
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse'
                : 'hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--accent-400)]')
            }
            title={isRecording ? (isRtl ? 'إيقاف التسجيل' : 'Stop recording') : (isRtl ? 'تسجيل صوتي' : 'Voice input')}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          <label className="p-2 rounded-lg hover:bg-white/5 cursor-pointer text-[var(--text-muted)] hover:text-[var(--accent-400)] transition-colors">
            <input type="file" className="hidden" accept="image/*,.pdf,.docx,.txt,.md,.json" onChange={handleFileChange} />
            <Paperclip size={16} />
          </label>

          {isGenerating ? (
            <button onClick={stopGeneration} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
              <Square size={16} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={(!text.trim() && !attachedFile) || disabled}
              className="p-2 rounded-xl bg-[var(--accent-400)] text-black font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer shadow-md"
              title={isRtl ? 'إرسال' : 'Send'}
            >
              <Send size={15} className={isRtl ? '-scale-x-100' : ''} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
