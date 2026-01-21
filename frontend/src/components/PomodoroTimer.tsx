import React, { useReducer, useEffect, useCallback, useMemo, useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { motion, LayoutGroup } from 'framer-motion';
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
    <LayoutGroup>
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[420px] md:max-w-[480px] lg:max-w-[880px] bg-white rounded-[56px] md:rounded-[72px] p-8 md:p-10 lg:p-16 shadow-cozy flex flex-col lg:flex-row items-center lg:items-center gap-10 lg:gap-20 relative transition-all duration-700"
      >
        {/* Container for decorative shapes with internal overflow hidden to protect shadow */}
        <div className="absolute inset-0 rounded-[56px] md:rounded-[72px] overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-cozy-orange/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cozy-green/5 rounded-full blur-3xl" />
        </div>

        {/* Left: Timer */}
        <motion.div layout className="flex-shrink-0 flex items-center justify-center">
          <TimerDisplay timeLeft={timeLeft} totalTime={totalTime} phase={phase} />
        </motion.div>

        {/* Right: Controls & Content */}
        <motion.div layout className="flex-grow flex flex-col items-center lg:items-start justify-center relative z-10 w-full lg:px-6">
          <div className="w-full flex justify-between items-start mb-8 lg:mb-12">
            <div className="flex flex-col">
              <span className="text-[11px] md:text-xs font-black uppercase tracking-[0.3em] text-cozy-text-light/50 ml-1 mb-2">Focus Companion</span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter text-cozy-text/90 leading-tight">Study Buddy</h1>
            </div>
            <motion.button 
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSettingsOpen(true)}
              className="p-4 md:p-4.5 rounded-3xl bg-cozy-cream/60 text-cozy-text-light hover:text-cozy-orange transition-all shadow-cozy-inner border border-white"
            >
              <SettingsIcon size={24} strokeWidth={2.5} />
            </motion.button>
          </div>

          <div className="w-full mb-10 lg:mb-16">
            <ThemeSelector themes={themes} activeThemeId={activeThemeId} onSelect={handleThemeChange} />
          </div>

          <div className="w-full flex flex-col items-center lg:items-start">
            <motion.div 
              key={completedSessions}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-10 lg:mb-14 px-8 py-2.5 bg-cozy-cream/50 rounded-full text-xs md:text-sm font-black uppercase tracking-[0.2em] text-cozy-text-light/70 border border-white shadow-sm"
            >
              Cycle #{completedSessions + 1}
            </motion.div>
            <div className="lg:pl-2">
              <TimerControls isActive={isActive} onStartPause={handleToggle} onReset={reset} onSkip={handleSkip} />
            </div>
          </div>
        </motion.div>

        <TimerSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          initialSettings={settings}
          initialThemes={themes}
          onSave={handleSaveSettings}
        />
      </motion.div>
    </LayoutGroup>
  );
};

export default PomodoroTimer;
