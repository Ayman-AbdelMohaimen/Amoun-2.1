import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Code, Plus, Clock, Settings, MessageSquare, FolderKanban, X } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { ViewType } from '@/types';

const TABS: { id: ViewType | 'fab'; labelAr: string; labelEn: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'home', labelAr: 'الرئيسية', labelEn: 'Home', icon: Home },
  { id: 'workspace', labelAr: 'العمل', labelEn: 'Work', icon: Code },
  { id: 'fab', labelAr: 'جديد', labelEn: 'New', icon: Plus },
  { id: 'history', labelAr: 'السجل', labelEn: 'History', icon: Clock },
  { id: 'settings', labelAr: 'إعدادات', labelEn: 'Settings', icon: Settings },
];

export default function MobileBottomNav() {
  const { activeView, setActiveView, currentLanguage, createNewSession, addProject } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';
  const [fabOpen, setFabOpen] = useState(false);

  const handleTab = (id: ViewType | 'fab') => {
    if (id === 'fab') {
      setFabOpen(p => !p);
      return;
    }
    setActiveView(id);
    setFabOpen(false);
  };

  const fabActions = [
    { label: isRtl ? 'محادثة جديدة' : 'New Chat', icon: MessageSquare, action: () => { createNewSession(); setFabOpen(false); } },
    { label: isRtl ? 'مشروع جديد' : 'New Project', icon: FolderKanban, action: () => { addProject('New Project'); setFabOpen(false); } },
  ];

  return (
    <div className="md:hidden relative">
      {/* FAB Menu Overlay */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setFabOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 glass glow-lg rounded-2xl p-2 min-w-[200px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-2 pb-1.5 mb-1 border-b border-[var(--border)]">
                <span className="text-xs font-semibold text-[var(--text-muted)]">
                  {isRtl ? 'إنشاء' : 'Create'}
                </span>
                <button
                  onClick={() => setFabOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-dim)] cursor-pointer"
                  aria-label={isRtl ? 'إغلاق' : 'Close'}
                >
                  <X size={14} />
                </button>
              </div>
              {fabActions.map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <item.icon size={18} className="text-[var(--accent-400)]" />
                  <span>{item.label}</span>
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Bar */}
      <nav className="glass border-t border-[var(--border)] flex items-stretch justify-around h-16 pb-[env(safe-area-inset-bottom)] shrink-0" aria-label={isRtl ? 'التنقل' : 'Navigation'}>
        {TABS.map(tab => {
          const isActive = tab.id === activeView;
          const isFab = tab.id === 'fab';
          const label = isRtl ? tab.labelAr : tab.labelEn;

          if (isFab) {
            return (
              <button
                key="fab"
                onClick={() => handleTab('fab')}
                className={`flex flex-col items-center justify-center gap-0.5 w-14 transition-colors cursor-pointer ${
                  fabOpen ? 'text-red-400' : 'text-[var(--accent-400)]'
                }`}
                aria-label={label}
                aria-expanded={fabOpen}
              >
                <div className={`p-2.5 rounded-full transition-all ${fabOpen ? 'bg-red-500/20 rotate-45' : 'bg-[var(--accent-500)]/15'}`}>
                  <Plus size={22} />
                </div>
                <span className="text-[10px]">{label}</span>
              </button>
            );
          }

          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTab(tab.id as ViewType)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors cursor-pointer ${
                isActive ? 'text-[var(--accent-400)]' : 'text-[var(--text-dim)]'
              }`}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
              {isActive && (
                <motion.div
                  layoutId="mobile-tab-indicator"
                  className="absolute top-0 w-8 h-0.5 rounded-full bg-[var(--accent-400)]"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
