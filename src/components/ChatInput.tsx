import { useState, useRef, useCallback, type KeyboardEvent } from 'react';
import { Send, Square, Paperclip, Mic, MicOff, ChevronDown, Volume2 } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { CHAT_MODES } from '@/constants';
import type { ChatMode, Attachment } from '@/types';
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
  const [showModes, setShowModes] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeMode = CHAT_MODES.find(m => m.id === chatMode) ?? CHAT_MODES[0];

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

  return (
    <div className={"relative glass rounded-xl " + (compact ? 'p-2' : 'p-3')}>
      {attachedFile && (
        <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-white/5 text-xs">
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
            {isRtl ? 'جاري التسجيل...' : 'Listening...'}
          </span>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => { setText(e.target.value); autoResize(); }}
            onKeyDown={handleKeyDown}
            placeholder={isRtl ? 'اكتب رسالتك أو اضغط المايك لأمون...' : 'Type or tap mic for Amoun...'}
            disabled={disabled || isGenerating}
            rows={1}
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none outline-none max-h-[200px] leading-relaxed"
            dir="auto"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Mic Button — always visible */}
          <button
            onClick={handleMicClick}
            className={
              "p-2 rounded-lg transition-all " +
              (isRecording
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse'
                : 'hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--accent-400)]')
            }
            title={isRecording
              ? (isRtl ? 'إيقاف التسجيل' : 'Stop recording')
              : (isRtl ? 'تسجيل صوتي' : 'Voice input')
            }
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <label className="p-2 rounded-lg hover:bg-white/5 cursor-pointer text-[var(--text-muted)] hover:text-[var(--accent-400)] transition-colors">
            <input type="file" className="hidden" accept="image/*,.pdf,.docx,.txt,.md,.json" onChange={handleFileChange} />
            <Paperclip size={18} />
          </label>

          <div className="relative">
            <button
              onClick={() => setShowModes(!showModes)}
              className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--accent-400)] transition-colors flex items-center gap-1"
            >
              <span>{activeMode.icon}</span>
              <ChevronDown size={14} className={showModes ? 'rotate-180' : ''} />
            </button>
            {showModes && (
              <div className="absolute bottom-full mb-2 end-0 w-48 glass rounded-xl p-1 z-50">
                {CHAT_MODES.map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => { setChatMode(mode.id as ChatMode); setShowModes(false); }}
                    className={"w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-start transition-colors " + (chatMode === mode.id ? 'bg-[var(--accent-400)]/10 text-[var(--accent-400)]' : 'text-[var(--text-secondary)] hover:bg-white/5')}
                  >
                    <span className="w-5 text-center">{mode.icon}</span>
                    <span>{isRtl ? mode.labelAr : mode.labelEn}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {isGenerating ? (
            <button onClick={stopGeneration} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
              <Square size={18} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={(!text.trim() && !attachedFile) || disabled}
              className="p-2 rounded-lg bg-[var(--accent-400)]/20 text-[var(--accent-400)] hover:bg-[var(--accent-400)]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} className={isRtl ? 'rotate-180' : ''} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
