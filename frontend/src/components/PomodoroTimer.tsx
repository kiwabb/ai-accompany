import React, { useReducer, useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { CozyPalHandle } from './CozyPal';
import CozyPal from './CozyPal';
import ThemeSelector from './ThemeSelector';
import { TimerDisplay } from './TimerDisplay';
import TimerControls from './TimerControls';
import TimerSettingsModal from './TimerSettingsModal';
import { useTimer } from '../hooks/useTimer';
import { DEFAULT_THEMES, DEFAULT_SETTINGS } from '../constants/pomodoro';
import type { FocusTheme, TimerSettings, Phase } from '../types/pomodoro';
import { saveSession, getDailyStats, upsertUserSettings, getUserSettings, getUserThemes } from '../api/client';
import type { SessionCreate, DailyStats } from '../api/client';

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
  | { type: 'SET_THEMES'; themes: FocusTheme[] }
  | { type: 'NEXT_PHASE' }
  | { type: 'RESET_TO_FOCUS' };

const initialState: PomodoroState = {
  themes: DEFAULT_THEMES,
  activeThemeId: DEFAULT_THEMES && DEFAULT_THEMES.length > 0 ? DEFAULT_THEMES[0].id : '',
  settings: DEFAULT_SETTINGS,
  phase: 'focus',
  completedSessions: 0,
};

function pomodoroReducer(state: PomodoroState, action: PomodoroAction): PomodoroState {
  switch (action.type) {
    case 'SET_ACTIVE_THEME':
      return { ...state, activeThemeId: action.themeId, phase: 'focus' };
    case 'SAVE_SETTINGS':
      const newThemes = action.themes && action.themes.length > 0 ? action.themes : state.themes;
      const newActiveThemeId = newThemes.some(t => t.id === state.activeThemeId) 
          ? state.activeThemeId 
          : (newThemes.length > 0 ? newThemes[0].id : state.activeThemeId);
      return {
        ...state,
        settings: action.settings,
        themes: newThemes,
        activeThemeId: newActiveThemeId,
      };
    case 'SET_THEMES':
      return {
        ...state,
        themes: action.themes,
        activeThemeId: action.themes.some(t => t.id === state.activeThemeId)
          ? state.activeThemeId
          : (action.themes.length > 0 ? action.themes[0].id : state.activeThemeId),
      };
    case 'NEXT_PHASE': {
      if (state.phase === 'focus') {
        const nextSessions = state.completedSessions + 1;
        const nextPhase = nextSessions % (state.settings.longBreakInterval || 4) === 0 ? 'longBreak' : 'shortBreak';
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
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  
  const [state, dispatch] = useReducer(pomodoroReducer, initialState);
  
  const { themes, activeThemeId, settings, phase, completedSessions } = state;
  const activeTheme = useMemo(() => {
    return themes.find(t => t.id === activeThemeId) || themes[0];
  }, [themes, activeThemeId]);
  
  const totalTimeValue = useMemo(() => {
    if (!activeTheme) return 25 * 60;
    if (phase === 'focus') return (activeTheme.focusDuration || 25) * 60;
    return (phase === 'shortBreak' ? (settings.shortBreakDuration || 5) : (settings.longBreakDuration || 15)) * 60;
  }, [phase, activeTheme, settings]);

  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
  
  const cozyPalRef = useRef<CozyPalHandle>(null);
  const prevPhaseRef = useRef<Phase>(phase);

  const fetchDailyStats = useCallback(async () => {
    try {
      const stats = await getDailyStats();
      setTodayStats(stats);
    } catch (error) {
      console.error('Failed to fetch daily stats', error);
    }
  }, []);

  useEffect(() => {
    const fetchSettingsAndThemes = async () => {
      try {
        const [fetchedSettings, fetchedThemes] = await Promise.all([
          getUserSettings(),
          getUserThemes()
        ]);
        
        const combinedThemes = [...DEFAULT_THEMES];
        fetchedThemes.forEach(theme => {
          if (!combinedThemes.find(t => t.id === theme.id)) {
            combinedThemes.push(theme);
          }
        });

        dispatch({ 
          type: 'SAVE_SETTINGS', 
          settings: fetchedSettings,
          themes: combinedThemes
        });
      } catch (error) {
        console.error('Error fetching user settings/themes:', error);
        dispatch({ 
          type: 'SAVE_SETTINGS', 
          settings: DEFAULT_SETTINGS, 
          themes: DEFAULT_THEMES 
        });
      } finally {
        setInitialLoaded(true);
      }
    };

    fetchSettingsAndThemes();
  }, []);

  const saveLearningSession = useCallback(async (status: SessionCreate['status'], duration: number, start: Date, end: Date) => {
    if (!activeTheme) return;
    const sessionData: SessionCreate = {
      theme_name: activeTheme.name,
      duration_seconds: duration,
      phase_type: phase,
      status: status,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      ai_persona: settings.aiPersona || 'gentle_encourager',
    };
    try {
      await saveSession(sessionData);
      fetchDailyStats();
    } catch (error) {
      console.error('Failed to save session', error);
    }
  }, [activeTheme, phase, settings.aiPersona, fetchDailyStats]);

  const handleTimerComplete = useCallback(() => {
    if (sessionStartTime) {
      if (phase === 'focus') {
        cozyPalRef.current?.triggerProactiveMessage('focus_completed', 0);
      }
      saveLearningSession('completed', totalTimeValue, sessionStartTime, new Date());
      setSessionStartTime(null);
    }
    dispatch({ type: 'NEXT_PHASE' });
  }, [sessionStartTime, saveLearningSession, totalTimeValue, phase]);

  const { timeLeft, isActive, start, pause, reset } = useTimer({
    initialSeconds: totalTimeValue,
    onComplete: handleTimerComplete,
  });

  useEffect(() => {
    if (prevPhaseRef.current !== phase) {
      if (phase === 'focus') {
        cozyPalRef.current?.triggerProactiveMessage('focus_start', totalTimeValue);
      } else if (phase === 'shortBreak' || phase === 'longBreak') {
        cozyPalRef.current?.triggerProactiveMessage('break_start', totalTimeValue);
      }
      prevPhaseRef.current = phase;
    }
  }, [phase, totalTimeValue]);

  useEffect(() => {
    if (isActive) {
      if (phase === 'focus' && timeLeft === 60) {
        cozyPalRef.current?.triggerProactiveMessage('focus_near_end', 60);
      } else if (phase !== 'focus' && timeLeft === 30) {
        cozyPalRef.current?.triggerProactiveMessage('break_near_end', 30);
      }
    }
  }, [timeLeft, phase, isActive]);

  useEffect(() => {
    fetchDailyStats();
  }, [fetchDailyStats]);

  const handleStart = useCallback(() => {
    setSessionStartTime(new Date());
    if (timeLeft === totalTimeValue) {
      if (phase === 'focus') {
        cozyPalRef.current?.triggerProactiveMessage('focus_start', totalTimeValue);
      } else {
        cozyPalRef.current?.triggerProactiveMessage('break_start', totalTimeValue);
      }
    }
    start();
  }, [start, timeLeft, totalTimeValue, phase]);

  const handlePause = useCallback(() => {
    pause();
  }, [pause]);

  const handleToggle = useCallback(() => isActive ? handlePause() : handleStart(), [isActive, handlePause, handleStart]);
  
  const handleReset = useCallback(() => {
    if (isActive && sessionStartTime) {
      const duration = totalTimeValue - timeLeft;
      saveLearningSession('interrupted', duration, sessionStartTime, new Date());
    }
    setSessionStartTime(null);
    reset();
    dispatch({ type: 'RESET_TO_FOCUS' });
  }, [isActive, sessionStartTime, totalTimeValue, timeLeft, saveLearningSession, reset]);

  const handleSkip = useCallback(() => {
    if (sessionStartTime) {
      const duration = totalTimeValue - timeLeft;
      saveLearningSession('skipped', duration, sessionStartTime, new Date());
    }
    setSessionStartTime(null);
    reset();
    dispatch({ type: 'NEXT_PHASE' });
  }, [sessionStartTime, totalTimeValue, timeLeft, saveLearningSession, reset]);

  const handleThemeChange = useCallback((themeId: string) => { 
    if (isActive && sessionStartTime) {
      const duration = totalTimeValue - timeLeft;
      saveLearningSession('interrupted', duration, sessionStartTime, new Date());
    }
    setSessionStartTime(null);
    dispatch({ type: 'SET_ACTIVE_THEME', themeId }); 
    reset(); 
  }, [isActive, sessionStartTime, totalTimeValue, timeLeft, saveLearningSession, reset]);

  const handleSaveSettings = useCallback(async (s: TimerSettings) => { 
    try {
      const updatedSettings = await upsertUserSettings(s);
      dispatch({ type: 'SAVE_SETTINGS', settings: updatedSettings, themes: DEFAULT_THEMES });
      reset();
      dispatch({ type: 'RESET_TO_FOCUS' });
    } catch (error) {
      console.error("Failed to save user settings:", error);
    }
  }, [reset]);

  const handleThemesChange = useCallback((newThemes: FocusTheme[]) => {
    dispatch({ type: 'SET_THEMES', themes: newThemes });
  }, []);

  return (
    <LayoutGroup>
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[420px] md:max-w-[480px] lg:max-w-[1024px] xl:max-w-[1100px] bg-white rounded-[56px] md:rounded-[72px] p-8 md:p-10 lg:p-16 shadow-cozy flex flex-col lg:flex-row items-center lg:items-center gap-10 lg:gap-24 relative transition-all duration-700 mx-auto"
      >
        <AnimatePresence>
          {!initialLoaded && (
            <motion.div 
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-[56px] md:rounded-[72px]"
            >
              <div className="text-cozy-text font-bold">Loading settings...</div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute inset-0 rounded-[56px] md:rounded-[72px] overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-cozy-orange/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cozy-green/5 rounded-full blur-3xl" />
        </div>

        <motion.div layout className="flex-shrink-0 flex items-center justify-center">
          <TimerDisplay timeLeft={timeLeft} totalTime={totalTimeValue} phase={phase} />
        </motion.div>

        <motion.div layout className="flex-grow flex flex-col items-center lg:items-start justify-center relative z-10 w-full lg:max-w-[420px] min-w-0">
           <div className="w-full flex flex-wrap justify-between items-start gap-4 mb-8 lg:mb-12">
            <div className="flex flex-col">
              <span className="text-[11px] md:text-xs font-black uppercase tracking-[0.3em] text-cozy-text-light/50 ml-1 mb-2">{t('timer.focusCompanion')}</span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-normal text-cozy-text/90 leading-tight font-heading">{t('timer.studyBuddy')}</h1>
            </div>
            <motion.button 
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSettingsOpen(true)}
              className="p-4 md:p-4.5 rounded-3xl bg-cozy-cream/60 text-cozy-text-light hover:text-cozy-orange transition-all shadow-cozy-inner border border-white flex-shrink-0"
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
              {t('timer.cycle')} #{completedSessions + 1}
            </motion.div>
            <div className="lg:pl-2">
              <TimerControls isActive={isActive} onStartPause={handleToggle} onReset={handleReset} onSkip={handleSkip} />
            </div>

            {todayStats && ( 
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-8 text-sm text-cozy-text-light/80 text-center lg:text-left"
              >
                {t('timer.todayFocus')}: <span className="font-bold text-cozy-orange">{todayStats.total_focus_minutes} {t('timer.minutes')}</span>
                <br/>{t('timer.totalSessions')}: <span className="font-bold text-cozy-orange">{todayStats.total_sessions}</span>
              </motion.div>
            )}

          </div>
        </motion.div>

        <TimerSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          initialSettings={settings}
          initialThemes={themes}
          onSave={handleSaveSettings}
          onThemesChange={handleThemesChange}
        />
      </motion.div>
       <CozyPal 
         ref={cozyPalRef}
         themeName={activeTheme?.name || 'English'} 
         phase={phase} 
         timeLeft={timeLeft} 
         apiKey={settings.googleApiKey} 
         currentLanguage={currentLanguage} 
         aiPersona={settings.aiPersona || 'gentle_encourager'} 
       />
    </LayoutGroup>
  );
};

export default PomodoroTimer;
