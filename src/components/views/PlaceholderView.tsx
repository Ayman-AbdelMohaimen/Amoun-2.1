import { useWorkspaceStore } from '@/store/workspaceStore';

export default function PlaceholderView({ viewId, labelAr, labelEn }: { viewId: string; labelAr: string; labelEn: string }) {
  const { currentLanguage } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';
  return (
    <div className="flex items-center justify-center h-full cyber-grid">
      <div className="text-center space-y-3">
        <img
          src="/logo.png"
          alt="𓂀"
          className="w-16 h-16 mx-auto select-none pointer-events-none drop-shadow-[0_0_20px_rgba(251,191,36,0.3)] rounded-full opacity-80"
          draggable={false}
        />
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--text-primary)]">{isRtl ? labelAr : labelEn}</h1>
        <p className="text-sm text-[var(--text-muted)]">{isRtl ? 'قادم في الإصدارات القادمة' : 'Coming in future releases'}</p>
      </div>
    </div>
  );
}
