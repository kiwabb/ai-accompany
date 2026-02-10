import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './contexts/AuthContext';
import { TimerProvider, useTimerContext } from './contexts/TimerContext';
import { useVisualTheme } from './hooks/useVisualTheme';
import FocusListPage from './pages/FocusListPage';
import TimerPage from './pages/TimerPage';
import LibraryPage from './pages/LibraryPage';
import ReaderPage from './pages/ReaderPage';
import SettingsPage from './pages/SettingsPage';
import AchievementWall from './pages/AchievementWall';
import FocusStatsPage from './pages/FocusStatsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import FloatingTimer from './components/FloatingTimer';
import CozyPal from './components/CozyPal';
import AchievementToast from './components/AchievementToast';
import ChiikawaDecorations from './components/ChiikawaDecorations';
import ShinchanDecorations from './components/ShinchanDecorations';
import { getLatestUnlocks, type UserAchievementBackend } from './api/client';

const AppContent: React.FC = () => {
  const { state, timeLeft, todayStats } = useTimerContext();
  const { i18n } = useTranslation();
  const location = useLocation();
  const [unlockedAchievement, setUnlockedAchievement] = useState<UserAchievementBackend | null>(null);

  // Apply visual theme
  const { isChiikawaTheme, isShinchanTheme, showFloatingElements, themeColors } = useVisualTheme({
    activeVisualThemeId: state.activeVisualThemeId,
  });

  const hideCozyPal = ['/login', '/signup'].includes(location.pathname);
  const [cozyPalWidth, setCozyPalWidth] = useState(0);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--cozypal-offset', `${Math.max(0, cozyPalWidth)}px`);
    return () => {
      root.style.setProperty('--cozypal-offset', '0px');
    };
  }, [cozyPalWidth]);

  useEffect(() => {
    const checkAchievements = async () => {
      try {
        const latest = await getLatestUnlocks(1);
        if (latest && latest.length > 0) {
          setUnlockedAchievement(latest[0]);
          setTimeout(() => setUnlockedAchievement(null), 8000);
        }
      } catch (e) {
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
      <ChiikawaDecorations enabled={isChiikawaTheme && showFloatingElements} />
      <ShinchanDecorations enabled={isShinchanTheme && showFloatingElements} />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<FocusListPage />} />
        <Route path="/timer/:id" element={<TimerPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/read/:id" element={<ReaderPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/achievements" element={<AchievementWall />} />
        <Route path="/stats" element={<FocusStatsPage />} />
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
          isChiikawaTheme={isChiikawaTheme}
          isShinchanTheme={isShinchanTheme}
          onDimensionsChange={setCozyPalWidth}
        />
      )}

      <FloatingTimer />
      <AchievementToast
        achievement={unlockedAchievement}
        onDismiss={() => setUnlockedAchievement(null)}
      />
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
