import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import ThemeSelector from './ThemeSelector';
import { TimerDisplay } from './TimerDisplay';
import TimerControls from './TimerControls';
import { useTimer } from '../hooks/useTimer';
import { DEFAULT_THEMES, DEFAULT_SETTINGS } from '../constants/pomodoro';
import type { FocusTheme, TimerSettings, Phase } from '../types/pomodoro';

const STORAGE_KEY = 'pomodoro-timer-state';

const PomodoroTimer: React.FC = () => {
  const [themes, setThemes] = useState<FocusTheme[]>(DEFAULT_THEMES);
  const [activeTheme, setActiveTheme] = useState<FocusTheme>(DEFAULT_THEMES[0]);
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [phase, setPhase] = useState<Phase>('focus');
  const [completedSessions, setCompletedSessions] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.themes) setThemes(parsed.themes);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.completedSessions !== undefined) setCompletedSessions(parsed.completedSessions);
        if (parsed.activeThemeId) {
          const found = (parsed.themes || DEFAULT_THEMES).find((t: FocusTheme) => t.id === parsed.activeThemeId);
          if (found) setActiveTheme(found);
        }
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
  }, []);

  useEffect(() => {
    const stateToSave = {
      themes,
      settings,
      completedSessions,
      activeThemeId: activeTheme.id,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [themes, settings, completedSessions, activeTheme.id]);

  const totalTime = useMemo(() => {
    switch (phase) {
      case 'focus':
        return activeTheme.focusDuration * 60;
      case 'shortBreak':
        return settings.shortBreakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
      default:
        return activeTheme.focusDuration * 60;
    }
  }, [phase, activeTheme, settings]);

  const nextPhase = useCallback(() => {
    if (phase === 'focus') {
      const nextSessions = completedSessions + 1;
      setCompletedSessions(nextSessions);
      setPhase(nextSessions % settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak');
    } else {
      setPhase('focus');
    }
  }, [phase, completedSessions, settings.longBreakInterval]);

  const { timeLeft, isActive, start, pause, reset } = useTimer({
    initialSeconds: totalTime,
    onComplete: nextPhase,
  });

  const handleToggle = useCallback(() => {
    if (isActive) {
      pause();
    } else {
      start();
    }
  }, [isActive, pause, start]);

  const handleSkip = useCallback(() => {
    reset();
    nextPhase();
  }, [reset, nextPhase]);

  const handleThemeChange = useCallback((themeId: string) => {
    const theme = themes.find((t) => t.id === themeId);
    if (theme) {
      setActiveTheme(theme);
      setPhase('focus');
      reset();
    }
  }, [themes, reset]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-900 rounded-3xl shadow-xl">
      <div className="w-full flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Pomodoro</h1>
        <button 
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Settings"
        >
          <SettingsIcon className="text-gray-600 dark:text-gray-400" size={24} />
        </button>
      </div>

      <ThemeSelector 
        themes={themes} 
        activeThemeId={activeTheme.id} 
        onSelect={handleThemeChange} 
      />

      <div className="my-8">
        <TimerDisplay 
          timeLeft={timeLeft} 
          totalTime={totalTime} 
          phase={phase} 
        />
      </div>

      <div className="w-full flex flex-col items-center">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Completed: {completedSessions}
        </div>
        <TimerControls 
          isActive={isActive} 
          onStartPause={handleToggle} 
          onReset={reset} 
          onSkip={handleSkip} 
        />
      </div>
    </div>
  );
};

export default PomodoroTimer;
