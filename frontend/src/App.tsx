import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './contexts/AuthContext';
import { TimerProvider } from './contexts/TimerContext';
import { useTimerContext } from './contexts/useTimerContext';
import { useVisualTheme } from './hooks/useVisualTheme';
import { useIsMobile } from './hooks/useIsMobile';
import FocusListPage from './pages/FocusListPage';
import TimerPage from './pages/TimerPage';
import LibraryPage from './pages/LibraryPage';
import ReaderPage from './pages/ReaderPage';
import SettingsPage from './pages/SettingsPage';
import AchievementWall from './pages/AchievementWall';
import FocusStatsPage from './pages/FocusStatsPage';
import ProfilePage from './pages/ProfilePage';
import TasksPage from './pages/TasksPage';
import BottomNav from './components/BottomNav';
import FloatingTimer from './components/FloatingTimer';
import CozyPal from './components/CozyPal';
import AchievementToast from './components/AchievementToast';
import OriginalThemeDecorations from './components/OriginalThemeDecorations';
import ChiikawaDecorations from './components/ChiikawaDecorations';
import ShinchanDecorations from './components/ShinchanDecorations';
import { getLatestUnlocks, type UserAchievementBackend } from './api/client';

const AppContent: React.FC = () => {
  const { state, timeLeft, todayStats } = useTimerContext();
  const { i18n } = useTranslation();
  const location = useLocation();
  const [unlockedAchievement, setUnlockedAchievement] = useState<UserAchievementBackend | null>(null);

  // Apply visual theme
  const { activeTheme, isOriginalCartoonTheme, showFloatingElements, themeColors } = useVisualTheme({
    activeVisualThemeId: state.activeVisualThemeId,
  });
  const activeFocusTheme = state.themes.find((theme) => theme.id === state.activeThemeId);
  const isChiikawaTheme = activeTheme.id === 'chiikawa';
  const isShinchanTheme = activeTheme.id === 'shinchan';

  const hideCozyPal = false;
  // BottomNav 在沉浸式页面（Timer / Reader）隐藏，其他路由都显示
  const hideBottomNav =
    location.pathname.startsWith('/timer/') ||
    location.pathname.startsWith('/read/');
  const [cozyPalWidth, setCozyPalWidth] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const root = document.documentElement;
    const offsetPx = isMobile ? 0 : Math.max(0, cozyPalWidth);
    root.style.setProperty('--cozypal-offset', `${offsetPx}px`);
    return () => {
      root.style.setProperty('--cozypal-offset', '0px');
    };
  }, [cozyPalWidth, isMobile]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateVh = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    updateVh();
    window.addEventListener('resize', updateVh);
    window.addEventListener('orientationchange', updateVh);
    return () => {
      window.removeEventListener('resize', updateVh);
      window.removeEventListener('orientationchange', updateVh);
    };
  }, []);

  useEffect(() => {
    const checkAchievements = async () => {
      try {
        const latest = await getLatestUnlocks(1);
        if (latest && latest.length > 0) {
          setUnlockedAchievement(latest[0]);
          setTimeout(() => setUnlockedAchievement(null), 8000);
        }
      } catch {
        // ignore
      }
    };

    const interval = setInterval(checkAchievements, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="min-h-screen font-sans selection:bg-[var(--theme-primary)]/30 transition-colors duration-500"
      style={{
        backgroundColor: themeColors.bg,
        color: themeColors.text,
      }}
    >
      <OriginalThemeDecorations
        theme={activeTheme}
        enabled={isOriginalCartoonTheme && showFloatingElements}
      />
      <ChiikawaDecorations enabled={isChiikawaTheme && showFloatingElements} />
      <ShinchanDecorations enabled={isShinchanTheme && showFloatingElements} />

      <Routes>
        <Route path="/" element={<FocusListPage />} />
        <Route path="/timer/:themeId" element={<TimerPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/read/:id" element={<ReaderPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/achievements" element={<AchievementWall />} />
        <Route path="/stats" element={<FocusStatsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/tasks" element={<TasksPage />} />
      </Routes>

      {!hideCozyPal && (
        <CozyPal
          themeName={state.activeThemeId || 'default'}
          phase={state.phase}
          timeLeft={timeLeft}
          apiKey={state.settings?.openaiApiKey}
          currentLanguage={i18n.language}
          aiPersona={state.settings?.aiPersona || 'friendly'}
          aiProvider={state.settings?.aiProvider}
          aiModel={state.settings?.aiModel}
          dailyCompletedPomodoros={todayStats?.total_sessions || 0}
          totalFocusMinutes={todayStats?.total_focus_minutes || 0}
          documentId={state.documentContext?.id}
          documentTitle={state.documentContext?.title}
          documentContent={state.documentContext?.content}
          visualTheme={activeTheme}
          activeFocusTheme={activeFocusTheme}
          onDimensionsChange={setCozyPalWidth}
        />
      )}

      <FloatingTimer />
      <AchievementToast
        achievement={unlockedAchievement}
        onDismiss={() => setUnlockedAchievement(null)}
      />

      {!hideBottomNav && <BottomNav />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <TimerProvider>
          <AppContent />
        </TimerProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
