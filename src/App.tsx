import { useEffect } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import ErrorBoundary from '@/components/ErrorBoundary';
import TopBar from '@/components/layout/TopBar';
import Sidebar from '@/components/layout/Sidebar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import Footer from '@/components/layout/Footer';
import ArtifactPanel from '@/components/ArtifactPanel';
import LoginModal from '@/components/LoginModal';
import AddModelModal from '@/components/AddModelModal';
import OnboardingWizard from '@/components/OnboardingWizard';
import InstallPWA from '@/components/InstallPWA';
import HomeView from '@/components/views/HomeView';
import WorkspaceView from '@/components/views/WorkspaceView';
import SettingsView from '@/components/views/SettingsView';
import ProjectsView from '@/components/views/ProjectsView';
import AdminView from '@/components/views/AdminView';
import PlaceholderView from '@/components/views/PlaceholderView';
import { THEME_PRESETS } from '@/constants';
import type { ViewType } from '@/types';

export default function App() {
  const { activeView, currentLanguage, theme, accentColor, isArtifactPanelOpen, showAddModelModal, showLoginModal, showOnboardingWizard, hasCompletedOnboarding, setShowOnboardingWizard } = useWorkspaceStore();
  const isRtl = currentLanguage === 'ar';

  useEffect(() => { document.documentElement.lang = currentLanguage; document.documentElement.dir = isRtl ? 'rtl' : 'ltr'; }, [currentLanguage, isRtl]);

  useEffect(() => {
    if (!hasCompletedOnboarding && !showOnboardingWizard) {
      const t = setTimeout(() => {
        setShowOnboardingWizard(true);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [hasCompletedOnboarding, showOnboardingWizard, setShowOnboardingWizard]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-emerald', 'theme-cyber-blue', 'theme-crimson', 'theme-purple');
    if (theme === 'dark' || theme === 'light') { root.classList.add('theme-emerald'); }
    else { root.classList.add(`theme-${theme}`); }
    const preset = THEME_PRESETS[theme as keyof typeof THEME_PRESETS];
    if (preset) {
      root.style.setProperty('--accent-300', preset.accent300);
      root.style.setProperty('--accent-400', preset.accent400);
      root.style.setProperty('--accent-500', preset.accent500);
      root.style.setProperty('--accent-600', preset.accent600);
      root.style.setProperty('--accent-glow', preset.glow);
    } else if (accentColor.startsWith('#')) {
      root.style.setProperty('--accent-400', accentColor);
    }
  }, [theme, accentColor]);

  return (
    <ErrorBoundary>
      <div className="h-[100dvh] flex flex-col overflow-hidden bg-[var(--bg-outer)]">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <ViewRouter view={activeView} />
          </main>
        </div>
        <MobileBottomNav />
        <Footer />
        {isArtifactPanelOpen && <ArtifactPanel />}
        {showLoginModal && <LoginModal />}
        {showAddModelModal && <AddModelModal />}
        {showOnboardingWizard && <OnboardingWizard />}
        <InstallPWA />
      </div>
    </ErrorBoundary>
  );
}

function ViewRouter({ view }: { view: ViewType }) {
  switch (view) {
    case 'home': return <HomeView />;
    case 'workspace': return <WorkspaceView />;
    case 'settings': return <SettingsView />;
    case 'projects': return <ProjectsView />;
    case 'history': return <PlaceholderView viewId="history" labelAr="السجل" labelEn="History" />;
    case 'admin': return <AdminView />;
    case 'agents': return <PlaceholderView viewId="agents" labelAr="الوكلاء" labelEn="Agents" />;
    case 'skills': return <PlaceholderView viewId="skills" labelAr="المهارات" labelEn="Skills" />;
    case 'integrated': return <PlaceholderView viewId="integrated" labelAr="الربط" labelEn="Integrations" />;
    case 'reports': return <PlaceholderView viewId="reports" labelAr="التقارير والرؤى" labelEn="Reports & Insights" />;
    case 'templates': return <PlaceholderView viewId="templates" labelAr="القوالب" labelEn="Templates" />;
    case 'compute': return <PlaceholderView viewId="compute" labelAr="الإحصائيات" labelEn="Compute" />;
    case 'storage': return <PlaceholderView viewId="storage" labelAr="التخزين" labelEn="Storage" />;
    case 'kings-tools': return <PlaceholderView viewId="kings-tools" labelAr="أدوات الملك" labelEn="King's Tools" />;
    case 'landing': return <PlaceholderView viewId="landing" labelAr="الترحيب" labelEn="Landing" />;
    default: return <HomeView />;
  }
}
