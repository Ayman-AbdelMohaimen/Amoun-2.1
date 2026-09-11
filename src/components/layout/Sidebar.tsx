import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, Code, FolderKanban, LayoutTemplate, Cpu, Clock, Settings, Shield,
  Plus, Pencil, FileText, Trash2, LogIn, PanelLeftClose, PanelLeftOpen,
  Bot, Sparkles, Plug, BarChart3, Info, Star, MoreVertical,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { NAV_ITEMS, ADMIN_EMAILS } from '@/constants';
import type { ViewType, ChatSession } from '@/types';

const ICON_MAP: Record<string, React.FC<{ size?: number }>> = {
  Home, Code, FolderKanban, LayoutTemplate, Cpu, Clock, Settings, Shield,
  Bot, Sparkles, Plug, BarChart3, Info,
};

export default function Sidebar() {
  const {
    activeView, setActiveView, isSidebarCollapsed, toggleSidebar,
    currentLanguage, user,
    chatSessions, deleteSession, renameSession, createNewSession, setCurrentSession,
    toggleFavoriteSession,
  } = useWorkspaceStore();

  const isRtl = currentLanguage === 'ar';
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; sessionId: string } | null>(null);
  const contextRef = useRef<HTMLDivElement>(null);

  const handleNavClick = useCallback((view: ViewType) => {
    setActiveView(view);
  }, [setActiveView]);

  const handleContextMenu = useCallback((e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, sessionId });
  }, []);

  useEffect(() => {
    const close = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('pointerdown', close);
      document.addEventListener('scroll', close, true);
    }
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('scroll', close, true);
    };
  }, [contextMenu]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return isRtl ? 'اليوم' : 'Today';
    if (days === 1) return isRtl ? 'أمس' : 'Yesterday';
    if (days < 7) return isRtl ? `منذ ${days} أيام` : `${days}d ago`;
    return d.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
  };

  const collapsed = isSidebarCollapsed;

  return (
    // border-e = logical inline-end: sits between sidebar and content in BOTH directions.
    // NOTE: never build Tailwind classes dynamically (border-${...}) — they never get generated.
<aside
      className={`hidden md:flex flex-col shrink-0 border-e border-[var(--border)] glass transition-all overflow-hidden ${
        collapsed ? 'w-20' : 'w-56'
      }`}
    >
      {/* 𓂀 اللوجو — فوق المنيو مباشرة (هوية موحدة مع الهيدر) */}
      <div className={`px-2 pt-3 pb-3 flex flex-col items-center ${collapsed ? 'gap-0' : 'gap-1'}`}>
        <button
          onClick={() => handleNavClick('home')}
          className="relative group cursor-pointer rounded-2xl"
          title={isRtl ? 'مركز القيادة' : 'Command Center'}
          aria-label="WAZEER OS"
        >
          <span className="absolute inset-0 rounded-2xl bg-amber-500/20 blur-lg group-hover:bg-amber-500/35 transition-colors pointer-events-none" aria-hidden="true" />
          <img
            src="/home-hero.png"
            alt="𓂀"
            draggable={false}
            className={
              'relative rounded-2xl object-cover select-none pointer-events-none transition-transform group-hover:scale-105 ' +
              (collapsed ? 'w-12 h-12' : 'w-16 h-16')
            }
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5" aria-label={isRtl ? 'القائمة الرئيسية' : 'Main navigation'}>
        {NAV_ITEMS.filter(item => !item.adminOnly || user?.role === 'admin' || (user?.email && ADMIN_EMAILS.includes(user.email)) || !user).map(item => {
          const Icon = ICON_MAP[item.icon] ?? Home;
          const isActive = activeView === item.id;
          const label = isRtl ? item.labelAr : item.labelEn;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex rounded-lg text-sm transition-colors cursor-pointer ${
                collapsed
                  ? 'flex-col items-center gap-1.5 py-2.5 px-1'
                  : 'items-center gap-3 px-3 py-2'
              } ${
                isActive
                  ? 'bg-[var(--accent-500)]/15 text-[var(--accent-400)]'
                  : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)]'
              }`}
              title={collapsed ? undefined : label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={collapsed ? 20 : 18} className="shrink-0" />
              <span className={`truncate ${collapsed ? 'text-[10px] w-full text-center leading-tight' : ''}`}>{label}</span>
            </button>
          );
        })}

        {/* Divider */}
        {!collapsed && (
          <div className="border-t border-[var(--border)] my-2" />
        )}

        {/* Chat History — وزر محادثة جديدة هنا مع المحادثات */}
        {!collapsed && (
          <div className="space-y-0.5">
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[var(--text-dim)] font-semibold">
              {isRtl ? 'سجل المحادثات' : 'Chat History'}
            </div>
            <button
              onClick={() => createNewSession()}
              className="w-full flex items-center gap-2 px-3 py-2 mb-1 rounded-lg bg-[var(--accent-500)]/15 text-[var(--accent-400)] text-xs font-medium hover:bg-[var(--accent-500)]/25 transition-colors cursor-pointer"
              aria-label={isRtl ? 'محادثة جديدة' : 'New chat'}
            >
              <Plus size={14} />
              <span>{isRtl ? 'محادثة جديدة' : 'New Chat'}</span>
            </button>
            {chatSessions.length === 0 && (
              <p className="px-3 py-2 text-[10px] text-[var(--text-dim)] leading-relaxed">
                {isRtl ? 'لا توجد محادثات بعد — ابدأ أول محادثة من الزر فوق' : 'No chats yet — start your first one above'}
              </p>
            )}
            <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
              {chatSessions.map((session: ChatSession) => (
                <div
                  key={session.id}
                  onClick={() => setCurrentSession(session.id)}
                  onContextMenu={(e) => handleContextMenu(e, session.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-start text-xs text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] transition-colors cursor-pointer group"
                >
                  <div className="min-w-0 flex-1 flex flex-col">
                    <div className="flex items-center gap-1">
                      {session.isFavorite && <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />}
                      <span className="truncate w-full">{session.title}</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-dim)]">{formatDate(session.date)}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContextMenu(e, session.id);
                    }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 text-[var(--text-dim)] hover:text-white transition-opacity"
                    title={isRtl ? 'خيارات' : 'Options'}
                  >
                    <MoreVertical size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Controls & Toggle */}
      <div className="p-2 border-t border-[var(--border)] flex flex-col gap-1.5">
        {!user && !collapsed && (
          <button
            onClick={() => {}}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <LogIn size={16} />
            <span>{isRtl ? 'تسجيل الدخول' : 'Login'}</span>
          </button>
        )}

        <button
          onClick={toggleSidebar}
          className={`w-full flex items-center justify-center gap-2 p-2 rounded-xl border border-white/10 bg-white/3 text-[var(--text-muted)] hover:text-[var(--accent-300)] hover:border-[var(--accent-400)]/40 hover:bg-[var(--accent-500)]/10 hover:shadow-[0_0_12px_var(--accent-glow)] transition-all cursor-pointer ${
            collapsed ? 'px-0' : 'px-3'
          }`}
          title={collapsed ? (isRtl ? 'توسيع القائمة' : 'Expand') : (isRtl ? 'طي القائمة' : 'Collapse')}
          aria-label="Toggle Sidebar"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          {!collapsed && (
            <span className="text-xs font-mono">{isRtl ? 'طي القائمة' : 'Collapse Sidebar'}</span>
          )}
        </button>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            ref={contextRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-[100] glass glow-md rounded-xl p-1.5 min-w-[160px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={() => {
                toggleFavoriteSession(contextMenu.sessionId);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <Star size={13} className="text-amber-400" />
              <span>{isRtl ? 'المفضلة / تثبيت' : 'Favorite / Pin'}</span>
            </button>
            <button
              onClick={() => {
                const name = prompt(isRtl ? 'الاسم الجديد:' : 'New name:');
                if (name) renameSession(contextMenu.sessionId, name);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <Pencil size={13} />
              <span>{isRtl ? 'إعادة تسمية' : 'Rename'}</span>
            </button>
            <button
              onClick={() => {
                deleteSession(contextMenu.sessionId);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              <span>{isRtl ? 'حذف' : 'Delete'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
