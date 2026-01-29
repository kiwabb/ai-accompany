import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTimer } from '../hooks/useTimer';
import { useAudio } from '../hooks/useAudio';
import { DEFAULT_THEMES, DEFAULT_SETTINGS } from '../constants/pomodoro';
import { saveSession, getDailyStats, upsertUserSettings, getUserSettings, getUserThemes } from '../api/client';
import type { FocusTheme, TimerSettings, Phase } from '../types/pomodoro';
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

interface TimerContextType {
    state: PomodoroState;
    dispatch: React.Dispatch<PomodoroAction>;
    timeLeft: number;
    isActive: boolean;
    totalTimeValue: number;
    todayStats: DailyStats | null;
    start: () => void;
    pause: () => void;
    reset: () => void;
    handleToggle: () => void;
    handleReset: () => void;
    handleSkip: () => void;
    handleThemeChange: (themeId: string) => void;
    handleSaveSettings: (s: TimerSettings) => void;
    handleThemesChange: (newThemes: FocusTheme[]) => void;
    activeTheme: FocusTheme | undefined;
    initialLoaded: boolean;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(pomodoroReducer, initialState);
    const { themes, activeThemeId, settings, phase, completedSessions } = state;
    const [initialLoaded, setInitialLoaded] = useState(false);
    const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

    const activeTheme = useMemo(() => {
        return themes.find(t => t.id === activeThemeId) || themes[0];
    }, [themes, activeThemeId]);

    const totalTimeValue = useMemo(() => {
        if (!activeTheme) return 25 * 60;
        if (phase === 'focus') return (activeTheme.focusDuration || 25) * 60;
        return (phase === 'shortBreak' ? (settings.shortBreakDuration || 5) : (settings.longBreakDuration || 15)) * 60;
    }, [phase, activeTheme, settings]);

    const { playEndSound, stopBackgroundMusic } = useAudio({
        enableSounds: settings.enableSounds !== false,
        enableBackgroundMusic: settings.enableBackgroundMusic !== false,
        volume: settings.soundVolume || 0.5,
    });

    const fetchDailyStats = useCallback(async () => {
        try {
            const stats = await getDailyStats();
            setTodayStats(stats);
        } catch (error) {
            console.error('Failed to fetch daily stats', error);
        }
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
        playEndSound();
        if (phase === 'focus') {
            stopBackgroundMusic();
        }

        if (sessionStartTime) {
            // Note: Proactive AI messaging is handled in the View for now, 
            // as we don't have access to CozyPal ref here. 
            // If we want it global, we need a GlobalCozyPal.
            saveLearningSession('completed', totalTimeValue, sessionStartTime, new Date());
            setSessionStartTime(null);
        }
        dispatch({ type: 'NEXT_PHASE' });
    }, [sessionStartTime, saveLearningSession, totalTimeValue, phase, playEndSound, stopBackgroundMusic]);

    const { timeLeft, isActive, start, pause, reset } = useTimer({
        initialSeconds: totalTimeValue,
        onComplete: handleTimerComplete,
    });

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
            } finally {
                setInitialLoaded(true);
            }
        };
        fetchSettingsAndThemes();
        fetchDailyStats();
    }, [fetchDailyStats]);

    const handleStart = useCallback(() => {
        setSessionStartTime(new Date());
        start();
    }, [start]);

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

    const value = {
        state,
        dispatch,
        timeLeft,
        isActive,
        totalTimeValue,
        todayStats,
        start: handleStart,
        pause: handlePause,
        reset,
        handleToggle,
        handleReset,
        handleSkip,
        handleThemeChange,
        handleSaveSettings,
        handleThemesChange,
        activeTheme,
        initialLoaded
    };

    return (
        <TimerContext.Provider value={value}>
            {children}
        </TimerContext.Provider>
    );
};

export const useTimerContext = () => {
    const context = useContext(TimerContext);
    if (!context) {
        throw new Error('useTimerContext must be used within a TimerProvider');
    }
    return context;
};
