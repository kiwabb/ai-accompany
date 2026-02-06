import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TimerProvider, useTimerContext } from './contexts/TimerContext';
import { useVisualTheme } from './hooks/useVisualTheme';
import FocusListPage from './pages/FocusListPage';
import TimerPage from './pages/TimerPage';
import LibraryPage from './pages/LibraryPage';
import ReaderPage from './pages/ReaderPage';
import SettingsPage from './pages/SettingsPage';
import AchievementWall from './pages/AchievementWall';
import FocusStatsPage from './pages/FocusStatsPage';
import FloatingTimer from './components/FloatingTimer';
import AchievementToast from './components/AchievementToast';
import ChiikawaDecorations from './components/ChiikawaDecorations';
import ShinchanDecorations from './components/ShinchanDecorations';
import { getLatestUnlocks, type UserAchievementBackend } from './api/client';

const AppContent: React.FC = () => {
  const { state } = useTimerContext();
  const [unlockedAchievement, setUnlockedAchievement] = useState<UserAchievementBackend | null>(null);

  // Apply visual theme
  const { isChiikawaTheme, isShinchanTheme, showFloatingElements, themeColors } = useVisualTheme({
    activeVisualThemeId: state.activeVisualThemeId,
  });

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
        <Route path="/" element={<FocusListPage />} />
        <Route path="/timer/:id" element={<TimerPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/read/:id" element={<ReaderPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/achievements" element={<AchievementWall />} />
        <Route path="/stats" element={<FocusStatsPage />} />
      </Routes>
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
      <TimerProvider>
        <AppContent />
      </TimerProvider>
    </Router>
  );
}

export default App;
