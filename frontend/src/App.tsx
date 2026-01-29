import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TimerProvider } from './contexts/TimerContext';
import FocusListPage from './pages/FocusListPage';
import TimerPage from './pages/TimerPage';
import LibraryPage from './pages/LibraryPage';
import ReaderPage from './pages/ReaderPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <TimerProvider>
      <Router>
        <Routes>
          <Route path="/" element={<FocusListPage />} />
          <Route path="/timer/:themeId" element={<TimerPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/read/:id" element={<ReaderPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Router>
    </TimerProvider>
  );
}

export default App;
