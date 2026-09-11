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
import HistoryView from '@/components/views/HistoryView';
import AgentsView from '@/components/views/AgentsView';
import SkillsView from '@/components/views/SkillsView';
import IntegratedView from '@/components/views/IntegratedView';
import ReportsView from '@/components/views/ReportsView';
import TemplatesView from '@/components/views/TemplatesView';
import ComputeView from '@/components/views/ComputeView';
import StorageView from '@/components/views/StorageView';
import KingsToolsView from '@/components/views/KingsToolsView';
import LandingView from '@/components/views/LandingView';
import AboutView from '@/components/views/AboutView';
import { THEME_PRESETS, LOGO_GLYPH } from '@/constants';
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
    <ErrorBoundary title="خطأ في النظام الرئيسي">
      <div className="h-[100dvh] flex flex-col overflow-hidden bg-[var(--bg-outer)] relative">
        {/* 𓂀 Global Background Watermark — هالة العين الفرعونية في خلفية كل الصفحات */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden opacity-[0.035]">
          <span className="text-[38vw] leading-none font-bold text-[var(--accent-400)] filter blur-[1px]">
            {LOGO_GLYPH}
          </span>
        </div>

        <ErrorBoundary title="خطأ في الشريط العلوي">
          <TopBar />
        </ErrorBoundary>
        <div className="flex flex-1 overflow-hidden">
          <ErrorBoundary title="خطأ في القائمة الجانبية">
            <Sidebar />
          </ErrorBoundary>
          <main className="flex-1 overflow-hidden">
            <ErrorBoundary title="خطأ في مساحة العرض">
              <ViewRouter view={activeView} />
            </ErrorBoundary>
          </main>
        </div>
        <MobileBottomNav />
        <Footer />
        {isArtifactPanelOpen && (
          <ErrorBoundary title="خطأ في لوحة البرديات">
            <ArtifactPanel />
          </ErrorBoundary>
        )}
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
    case 'history': return <HistoryView />;
    case 'admin': return <AdminView />;
    case 'agents': return <AgentsView />;
    case 'skills': return <SkillsView />;
    case 'integrated': return <IntegratedView />;
    case 'reports': return <ReportsView />;
    case 'templates': return <TemplatesView />;
    case 'compute': return <ComputeView />;
    case 'storage': return <StorageView />;
    case 'kings-tools': return <KingsToolsView />;
    case 'landing': return <LandingView />;
    case 'about': return <AboutView />;
    default: return <HomeView />;
  }
}
