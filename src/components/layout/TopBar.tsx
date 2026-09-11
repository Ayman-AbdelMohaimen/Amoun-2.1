import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown, Mic, MicOff, Globe,
  PanelLeftClose, PanelLeftOpen, LogIn, User, Plus, Check, LayoutTemplate,
  X, RotateCcw, Menu,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { wazeerDB } from '@/lib/db';
import { PROVIDERS } from '@/constants';
import type { ModelInfo } from '@/types';
import MobileNavDrawer from './MobileNavDrawer';

export default function TopBar() {
  const {
    activeModel, setActiveModel, customModels, removeCustomModel,
    hiddenModelIds, hideModel, unhideAllModels,
    activeView, setActiveView,
    currentLanguage, setLanguage,
    voiceEnabled, toggleVoice,
    isArtifactPanelOpen, toggleArtifactPanel,
    isSidebarCollapsed, toggleSidebar,
    user, setShowLoginModal,
    showAddModelModal, setShowAddModelModal,
    isGenerating,
  } = useWorkspaceStore();

  // MONMAMAR DB availability (IndexedDB vs in-memory fallback)
  const [dbAvailable, setDbAvailable] = useState(true);
  useEffect(() => {
    setDbAvailable(wazeerDB.isAvailable());
  }, []);

  const isRtl = currentLanguage === 'ar';
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    };
    if (modelDropdownOpen) document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [modelDropdownOpen]);

  const allModels: (ModelInfo & { _group: string })[] = [];
  for (const provider of PROVIDERS) {
    for (const model of provider.models) {
      allModels.push({ ...model, _group: provider.displayName });
    }
  }
  // User-added models merge INTO their provider group (or "Custom" for own endpoints)
  for (const cm of customModels) {
    const group = cm.providerId
      ? PROVIDERS.find(p => p.id === cm.providerId)?.displayName ?? cm.providerName
      : cm.providerName || 'Custom';
    allModels.push({
      id: cm.id,
      providerId: cm.providerId ?? 'custom',
      displayName: cm.displayName ?? `${cm.providerName} / ${cm.modelId}`,
      modelId: cm.modelId,
      capabilities: { vision: cm.hasVision, streaming: cm.hasStreaming, tools: false, grounding: false, maxTokens: 8192 },
      pricing: { input: 0, output: 0 },
      _group: group,
    });
  }

  const customIds = new Set(customModels.map(c => c.id));
  const visibleModels = allModels.filter(m => !hiddenModelIds.includes(m.id));

  const currentModelName = visibleModels.find(m => m.id === activeModel)?.displayName ?? activeModel;

  const grouped = visibleModels.reduce<Record<string, typeof visibleModels>>((acc, m) => {
    (acc[m._group] ??= []).push(m);
    return acc;
  }, {});

  return (
    // LTR physical order: logo always LEFT, model center, actions RIGHT — both languages
    <header dir="ltr" className="h-14 shrink-0 glass border-b border-[var(--border)] flex items-center px-3 gap-2 z-50">
      
      {/* Royal Logo — standalone (name lives in the <head> title), physical LEFT, same eye as hero */}
      <div className="shrink-0">
        <button
          onClick={() => setActiveView('home')}
          className="hover:opacity-85 transition-opacity cursor-pointer"
          aria-label={isRtl ? 'الرئيسية' : 'Home'}
        >
          <img
            src="/home-hero.png"
            alt="WAZEER OS"
            className="w-12 h-12 object-contain select-none"
            draggable={false}
          />
        </button>
      </div>

      {/* Center — Model Selector + Artifacts (جمب القايمة) */}
      <div className="flex-1 flex items-center justify-center gap-1.5">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setModelDropdownOpen(p => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass glow-sm text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer max-w-[220px] sm:max-w-none"
          >
            <span className="truncate text-xs sm:text-sm">{currentModelName}</span>
            <ChevronDown size={14} className={`shrink-0 transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {modelDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                // Centered under the button at all sizes — direction-agnostic (RTL-safe).
                // NOTE: never build Tailwind classes dynamically (sm:${...}) — never generated.
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] glass glow-md rounded-xl overflow-hidden z-50"
              >
                <div className="max-h-80 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
                  {Object.entries(grouped).map(([group, models]) => (
                    <div key={group}>
                      <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--text-dim)] font-semibold">
                        {group}
                      </div>
                      {models.map(model => (
                        <div
                          key={model.id}
                          className={`flex items-center rounded-lg transition-colors ${
                            model.id === activeModel
                              ? 'bg-[var(--accent-500)]/15'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <button
                            onClick={() => {
                              setActiveModel(model.id, model.providerId);
                              setModelDropdownOpen(false);
                            }}
                            className={`flex items-center gap-2 flex-1 min-w-0 px-2.5 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                              model.id === activeModel
                                ? 'text-[var(--accent-400)]'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            <span className="truncate flex-1 text-start">{model.displayName}</span>
                            {model.id === activeModel && <Check size={14} className="shrink-0" />}
                          </button>
                          {/* ✕ — user-added → delete permanently; built-in → hide (restorable) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (customIds.has(model.id)) removeCustomModel(model.id);
                              else hideModel(model.id);
                            }}
                            className="p-1.5 me-1 rounded text-[var(--text-dim)] hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
                            title={customIds.has(model.id)
                              ? (isRtl ? 'حذف نهائي' : 'Delete permanently')
                              : (isRtl ? 'إخفاء (قابل للاستعادة)' : 'Hide (restorable)')}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="border-t border-[var(--border)] p-1.5 space-y-0.5">
                  {hiddenModelIds.length > 0 && (
                    <button
                      onClick={() => unhideAllModels()}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                      title={isRtl ? 'إرجاع كل الموديلات المدمجة المخفية' : 'Restore all hidden built-in models'}
                    >
                      <RotateCcw size={12} />
                      <span>{isRtl ? `استعادة المخفيين (${hiddenModelIds.length})` : `Restore hidden (${hiddenModelIds.length})`}</span>
                    </button>
                  )}
                  <button
                    onClick={() => { setModelDropdownOpen(false); setShowAddModelModal(true); }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-[var(--accent-400)] hover:bg-[var(--accent-500)]/10 transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>{isRtl ? 'إضافة نموذج' : 'Add Model'}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Artifacts — جمب قايمة الموديلات (مخفية على شاشات الموبايل الضيقة لمنع التكدس) */}
        <button
          onClick={toggleArtifactPanel}
          className={`hidden sm:inline-flex p-2 rounded-lg transition-colors cursor-pointer ${
            isArtifactPanelOpen
              ? 'text-[var(--accent-400)] bg-[var(--accent-500)]/15 border border-[var(--accent-400)]/30'
              : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)]'
          }`}
          aria-label="Artifacts"
          title={isRtl ? 'مستكشف البرديات والمنتجات' : 'Artifacts Explorer'}
        >
          <LayoutTemplate size={16} />
        </button>
      </div>

      {/* Right (physical) — Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* SWARM — live dot (red if any agent errored, teal pulse while generating) */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 border border-white/8">
          <span className={`w-1.5 h-1.5 rounded-full ${isGenerating ? 'bg-teal-400 animate-pulse' : 'bg-emerald-500/70'}`} />
          <span className="text-[9px] font-mono tracking-widest text-[var(--text-dim)]">SWARM CORE</span>
        </div>
        {/* MONMAMAR DB — IndexedDB availability */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 border border-white/8">
          <span className={`w-1.5 h-1.5 rounded-full ${dbAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[9px] font-mono tracking-widest text-[var(--text-dim)]">MONMAMAR DB</span>
        </div>

        {/* Voice toggle — visible on tablet/desktop, in drawer on mobile */}
        <button
          onClick={toggleVoice}
          className="hidden sm:inline-flex p-2 rounded-lg hover:bg-white/5 transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          aria-label={isRtl ? 'تبديل الصوت' : 'Toggle voice'}
          title={voiceEnabled ? (isRtl ? 'إيقاف الصوت' : 'Mute voice') : (isRtl ? 'تفعيل الصوت' : 'Enable voice')}
        >
          {voiceEnabled ? <Mic size={18} /> : <MicOff size={18} />}
        </button>

        {/* Working Language Switcher — visible on tablet/desktop, in drawer on mobile */}
        <button
          onClick={() => setLanguage(isRtl ? 'en' : 'ar')}
          className="hidden sm:inline-flex p-2 rounded-lg hover:bg-white/5 transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer text-xs font-bold"
          aria-label={isRtl ? 'English' : 'عربي'}
          title={isRtl ? 'Switch to English' : 'التبديل للعربية'}
        >
          <Globe size={16} className="inline me-1" />
          <span>{isRtl ? 'EN' : 'عربي'}</span>
        </button>

        {/* Menu Toggle: Opens MobileNavDrawer on mobile, toggles sidebar on desktop */}
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              setMobileDrawerOpen(true);
            } else {
              toggleSidebar();
            }
          }}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          aria-label={isRtl ? 'القائمة' : 'Menu'}
          title={isRtl ? 'القائمة' : 'Menu'}
        >
          <span className="md:hidden">
            <Menu size={18} />
          </span>
          <span className="hidden md:inline-flex">
            {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </span>
        </button>

        {/* Login / User button — ALWAYS visible, never pushed offscreen */}
        {user ? (
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setMobileDrawerOpen(true);
              }
            }}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg glass text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0 max-w-[120px]"
            aria-label={user.name}
          >
            <User size={15} className="shrink-0 text-[var(--accent-400)]" />
            <span className="truncate hidden sm:inline">{user.name}</span>
          </button>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--accent-500)]/20 text-[var(--accent-400)] border border-[var(--accent-400)]/30 text-xs font-bold hover:bg-[var(--accent-500)]/30 transition-colors cursor-pointer shrink-0 shadow-sm"
            aria-label={isRtl ? 'تسجيل الدخول' : 'Login'}
          >
            <LogIn size={14} className="shrink-0" />
            <span>{isRtl ? 'دخول' : 'Login'}</span>
          </button>
        )}
      </div>

      {/* Mobile Drawer */}
      <MobileNavDrawer isOpen={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />
    </header>
  );
}
