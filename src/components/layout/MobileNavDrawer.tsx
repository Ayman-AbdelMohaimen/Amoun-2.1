import { motion, AnimatePresence } from 'motion/react';
import {
  X, Home, Code, FolderKanban, LayoutTemplate, Cpu, Clock, Settings, Shield,
  Bot, Sparkles, Plug, BarChart3, Info, Globe, Mic, MicOff, LogIn, User,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { NAV_ITEMS, ADMIN_EMAILS } from '@/constants';
import type { ViewType } from '@/types';

const ICON_MAP: Record<string, React.FC<{ size?: number }>> = {
  Home, Code, FolderKanban, LayoutTemplate, Cpu, Clock, Settings, Shield,
  Bot, Sparkles, Plug, BarChart3, Info,
};

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const {
    activeView, setActiveView, currentLanguage, setLanguage,
    voiceEnabled, toggleVoice, user, setShowLoginModal,
  } = useWorkspaceStore();

  const isRtl = currentLanguage === 'ar';

  const handleSelectView = (view: ViewType) => {
    setActiveView(view);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden flex"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: isRtl ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? '100%' : '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className={`w-[82%] max-w-[320px] h-full glass border-e border-[var(--border)] flex flex-col p-4 shadow-2xl ${
              isRtl ? 'ms-auto' : 'me-auto'
            }`}
            onClick={(e) => e.stopPropagation()}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <img
                  src="/home-hero.png"
                  alt="WAZEER OS"
                  className="w-9 h-9 rounded-xl object-contain drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                />
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-primary)] font-[var(--font-display)]">
                    {isRtl ? 'وزير OS' : 'WAZEER OS'}
                  </h2>
                  <p className="text-[10px] text-[var(--text-dim)]">
                    {isRtl ? 'قائمة التنقل السريع' : 'Navigation Menu'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                aria-label={isRtl ? 'إغلاق القائمة' : 'Close menu'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation List */}
            <nav className="flex-1 overflow-y-auto py-3 space-y-1 custom-scrollbar">
              {NAV_ITEMS.filter(
                (item) =>
                  !item.adminOnly ||
                  user?.role === 'admin' ||
                  (user?.email && ADMIN_EMAILS.includes(user.email)) ||
                  !user
              ).map((item) => {
                const Icon = ICON_MAP[item.icon] ?? Home;
                const isActive = activeView === item.id;
                const label = isRtl ? item.labelAr : item.labelEn;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectView(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[var(--accent-500)]/20 text-[var(--accent-300)] border border-[var(--accent-400)]/30 font-bold shadow-sm'
                        : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-[var(--accent-400)]' : 'opacity-70'} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Bottom Quick Controls & User Account */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              {/* Voice & Language toggles */}
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={toggleVoice}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    voiceEnabled
                      ? 'bg-[var(--accent-500)]/15 border-[var(--accent-400)]/40 text-[var(--accent-300)]'
                      : 'bg-white/5 border-white/10 text-[var(--text-muted)]'
                  }`}
                >
                  {voiceEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                  <span>{voiceEnabled ? (isRtl ? 'الصوت مفعّل' : 'Voice ON') : (isRtl ? 'الصوت مغلق' : 'Voice OFF')}</span>
                </button>

                <button
                  onClick={() => setLanguage(isRtl ? 'en' : 'ar')}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
                >
                  <Globe size={14} />
                  <span>{isRtl ? 'English' : 'العربية'}</span>
                </button>
              </div>

              {/* User Account / Login */}
              {user ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/8 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[var(--accent-400)]/20 text-[var(--accent-400)] flex items-center justify-center">
                        <User size={14} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--text-primary)] truncate">{user.name}</p>
                      <p className="text-[10px] text-[var(--text-dim)] truncate">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent-400)]/15 text-[var(--accent-300)] font-mono shrink-0">
                    {user.role}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    setShowLoginModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[var(--accent-400)] text-black font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-md"
                >
                  <LogIn size={15} />
                  <span>{isRtl ? 'تسجيل الدخول' : 'Sign In'}</span>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
