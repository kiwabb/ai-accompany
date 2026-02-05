import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TimerProvider, useTimerContext } from './contexts/TimerContext';
import FocusListPage from './pages/FocusListPage';
import TimerPage from './pages/TimerPage';
import LibraryPage from './pages/LibraryPage';
import ReaderPage from './pages/ReaderPage';
import SettingsPage from './pages/SettingsPage';
import FloatingTimer from './components/FloatingTimer';
import CozyPal from './components/cozypal/CozyPalPanel';

// 内部组件以便能够使用 useTimerContext
const AppContent = () => {
  const { state, isActive, timeLeft, activeTheme, todayStats } = useTimerContext();
  const { i18n } = useTranslation();
  const { phase, settings, documentContext } = state;
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <>
      <FloatingTimer />

      {/* 全局 AI 助手 - 常驻显示（主页、阅读器或计时中） */}
      {(isActive || documentContext || isHomePage) && (
        <CozyPal
          themeName={activeTheme?.name || 'Focus'}
          phase={phase}
          timeLeft={timeLeft}
          apiKey={settings.googleApiKey}
          currentLanguage={i18n.language}
          aiPersona={settings.aiPersona || 'gentle_encourager'}
          aiProvider={settings.aiProvider || 'gemini'}
          aiModel={settings.aiModel}
          dailyCompletedPomodoros={todayStats?.total_sessions || 0}
          totalFocusMinutes={todayStats?.total_focus_minutes || 0}
          documentId={documentContext?.id}
          documentTitle={documentContext?.title}
          documentContent={documentContext?.content}
        />
      )}

      <Routes>
        <Route path="/" element={<FocusListPage />} />
        <Route path="/timer/:themeId" element={<TimerPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/read/:id" element={<ReaderPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <TimerProvider>
      <Router>
        <AppContent />
      </Router>
    </TimerProvider>
  );
}

export default App;
