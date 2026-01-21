import React, { useReducer, useEffect, useCallback, useMemo, useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeSelector from './ThemeSelector';
import { TimerDisplay } from './TimerDisplay';
import TimerControls from './TimerControls';
import TimerSettingsModal from './TimerSettingsModal';
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
  | { type: 'SAVE_SETTINGS'; settings: TimerSettings; themes: FocusTheme[] }
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
      return { ...state, activeThemeId: action.themeId, phase: 'focus' };
    case 'SAVE_SETTINGS':
      return {
        ...state,
        settings: action.settings,
        themes: action.themes,
        activeThemeId: action.themes.some(t => t.id === state.activeThemeId) 
          ? state.activeThemeId 
          : action.themes[0].id,
      };
    case 'NEXT_PHASE': {
      if (state.phase === 'focus') {
        const nextSessions = state.completedSessions + 1;
        const nextPhase = nextSessions % state.settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
        return { ...state, completedSessions: nextSessions, phase: nextPhase };
      }
      return { ...state, phase: 'focus' };
    }
    case 'RESET_TO_FOCUS':
      return { ...state, phase: 'focus' };
    default:
      return state;
  }
}

const PomodoroTimer: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [state, dispatch] = useReducer(pomodoroReducer, initialState, (initial) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initial, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load state', e);
    }
    return initial;
  });

  const { themes, activeThemeId, settings, phase, completedSessions } = state;
  const activeTheme = useMemo(() => themes.find(t => t.id === activeThemeId) || themes[0], [themes, activeThemeId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ themes, settings, completedSessions, activeThemeId }));
  }, [themes, settings, completedSessions, activeThemeId]);

  const totalTime = useMemo(() => {
    if (phase === 'focus') return activeTheme.focusDuration * 60;
    return (phase === 'shortBreak' ? settings.shortBreakDuration : settings.longBreakDuration) * 60;
  }, [phase, activeTheme, settings]);

  const nextPhase = useCallback(() => dispatch({ type: 'NEXT_PHASE' }), []);
  const { timeLeft, isActive, start, pause, reset } = useTimer({ initialSeconds: totalTime, onComplete: nextPhase });

  const handleToggle = useCallback(() => isActive ? pause() : start(), [isActive, pause, start]);
  const handleSkip = useCallback(() => { reset(); nextPhase(); }, [reset, nextPhase]);
  const handleThemeChange = useCallback((themeId: string) => { dispatch({ type: 'SET_ACTIVE_THEME', themeId }); reset(); }, [reset]);
  const handleSaveSettings = useCallback((s: TimerSettings, t: FocusTheme[]) => { dispatch({ type: 'SAVE_SETTINGS', settings: s, themes: t }); reset(); }, [reset]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[420px] bg-white rounded-[48px] p-10 shadow-cozy flex flex-col items-center relative overflow-hidden"
    >
      {/* Decorative background shapes */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-cozy-orange/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cozy-green/5 rounded-full blur-3xl" />

      <div className="w-full flex justify-between items-center mb-8 relative z-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cozy-text-light/60 ml-1 mb-0.5">Companion</span>
          <h1 className="text-2xl font-bold tracking-tight text-cozy-text/90">Study Buddy</h1>
        </div>
        <motion.button 
          whileHover={{ rotate: 90, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsSettingsOpen(true)}
          className="p-3 rounded-2xl bg-cozy-cream/80 text-cozy-text-light hover:text-cozy-orange transition-colors shadow-sm"
        >
          <SettingsIcon size={20} strokeWidth={2.5} />
        </motion.button>
      </div>

      <ThemeSelector themes={themes} activeThemeId={activeThemeId} onSelect={handleThemeChange} />

      <div className="my-12 relative">
        <TimerDisplay timeLeft={timeLeft} totalTime={totalTime} phase={phase} />
      </div>

      <div className="w-full flex flex-col items-center relative z-10">
        <motion.div 
          key={completedSessions}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 px-5 py-2 bg-cozy-cream/50 rounded-full text-xs font-bold uppercase tracking-widest text-cozy-text-light/80 border border-white shadow-sm"
        >
          Session #{completedSessions + 1}
        </motion.div>
        <TimerControls isActive={isActive} onStartPause={handleToggle} onReset={reset} onSkip={handleSkip} />
      </div>

      <TimerSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialSettings={settings}
        initialThemes={themes}
        onSave={handleSaveSettings}
      />
    </motion.div>
  );
};

export default PomodoroTimer;
