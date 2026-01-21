import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import ThemeSelector from './ThemeSelector';
import { TimerDisplay } from './TimerDisplay';
import TimerControls from './TimerControls';
import { useTimer } from '../hooks/useTimer';
import { DEFAULT_THEMES, DEFAULT_SETTINGS } from '../constants/pomodoro';
import type { FocusTheme, TimerSettings, Phase } from '../types/pomodoro';

const STORAGE_KEY = 'pomodoro-timer-state';

interface PomodoroState {
  themes: FocusTheme[];
  activeThemeId: string;
  settings: TimerSettings;
  phase: Phase;
  completedSessions: number;
}

type PomodoroAction =
  | { type: 'SET_ACTIVE_THEME'; themeId: string }
  | { type: 'UPDATE_SETTINGS'; settings: TimerSettings }
  | { type: 'NEXT_PHASE' }
  | { type: 'RESET_TO_FOCUS' };

const initialState: PomodoroState = {
  themes: DEFAULT_THEMES,
  activeThemeId: DEFAULT_THEMES[0].id,
  settings: DEFAULT_SETTINGS,
  phase: 'focus',
  completedSessions: 0,
};

function pomodoroReducer(state: PomodoroState, action: PomodoroAction): PomodoroState {
  switch (action.type) {
    case 'SET_ACTIVE_THEME':
      return {
        ...state,
        activeThemeId: action.themeId,
        phase: 'focus',
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: action.settings,
      };
    case 'NEXT_PHASE': {
      if (state.phase === 'focus') {
        const nextSessions = state.completedSessions + 1;
        const nextPhase = nextSessions % state.settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
        return {
          ...state,
          completedSessions: nextSessions,
          phase: nextPhase,
        };
      }
      return {
        ...state,
        phase: 'focus',
      };
    }
    case 'RESET_TO_FOCUS':
      return {
        ...state,
        phase: 'focus',
      };
    default:
      return state;
  }
}

const PomodoroTimer: React.FC = () => {
  const [state, dispatch] = useReducer(pomodoroReducer, initialState, (initial) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initial,
          ...parsed,
          themes: parsed.themes || initial.themes,
          activeThemeId: parsed.activeThemeId || initial.activeThemeId,
        };
      }
    } catch (e) {
      console.error('Failed to load state from localStorage', e);
    }
    return initial;
  });

  const { themes, activeThemeId, settings, phase, completedSessions } = state;

  const activeTheme = useMemo(() => 
    themes.find(t => t.id === activeThemeId) || themes[0],
  [themes, activeThemeId]);

  useEffect(() => {
    try {
      const stateToSave = {
        themes,
        settings,
        completedSessions,
        activeThemeId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }, [themes, settings, completedSessions, activeThemeId]);

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
    dispatch({ type: 'NEXT_PHASE' });
  }, []);

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
    dispatch({ type: 'SET_ACTIVE_THEME', themeId });
    reset();
  }, [reset]);

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
