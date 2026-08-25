import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';

export default function InstallPWA() {
  const { currentLanguage } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setDeferredPrompt(null);
  };

  if (!deferredPrompt || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`fixed bottom-20 md:bottom-4 ${isRtl ? 'left-4' : 'right-4'} z-50 glass glow-md rounded-xl p-3 flex items-center gap-3 max-w-xs`}
      >
        <button
          onClick={handleInstall}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent-500)]/15 text-[var(--accent-400)] text-sm font-medium hover:bg-[var(--accent-500)]/25 transition-colors cursor-pointer"
        >
          <Download size={16} />
          <span>{isRtl ? 'تثبيت التطبيق' : 'Install App'}</span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg hover:bg-white/5 text-[var(--text-dim)] cursor-pointer"
          aria-label={isRtl ? 'إغلاق' : 'Dismiss'}
        >
          ✕
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
