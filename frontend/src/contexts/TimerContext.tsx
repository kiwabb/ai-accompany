import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useState, useRef } from 'react';
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
    documentContext?: {
        id: number;
        title: string;
        content: string;
    };
}

type PomodoroAction =
    | { type: 'SET_ACTIVE_THEME'; themeId: string }
    | { type: 'SAVE_SETTINGS'; settings: TimerSettings; themes: FocusTheme[] }
    | { type: 'SET_THEMES'; themes: FocusTheme[] }
    | { type: 'NEXT_PHASE' }
    | { type: 'RESET_TO_FOCUS' }
    | { type: 'SET_DOCUMENT_CONTEXT'; context?: PomodoroState['documentContext'] };

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
        case 'SAVE_SETTINGS': {
            const newThemes = action.themes && action.themes.length > 0 ? action.themes : state.themes;
            // Priority: action.settings.activeThemeId (backend) > current state.activeThemeId (local) > first theme
            const idFromSettings = action.settings.activeThemeId;
            const newActiveThemeId = (idFromSettings && newThemes.some(t => t.id === idFromSettings))
                ? idFromSettings
                : (newThemes.some(t => t.id === state.activeThemeId)
                    ? state.activeThemeId
                    : (newThemes.length > 0 ? newThemes[0].id : state.activeThemeId));

            return {
                ...state,
                settings: action.settings,
                themes: newThemes,
                activeThemeId: newActiveThemeId,
            };
        }
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
        case 'SET_DOCUMENT_CONTEXT':
            return { ...state, documentContext: action.context };
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
    setDocumentContext: (context?: PomodoroState['documentContext']) => void;
    activeTheme: FocusTheme | undefined;
    initialLoaded: boolean;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const CONTEXT_STORAGE_KEY = 'pomodoro_context_state';

const loadInitialState = (): PomodoroState => {
    try {
        const saved = localStorage.getItem(CONTEXT_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Ensure we have valid structure, merging with defaults
            return {
                ...initialState,
                // Only persist UI states that are not fetched from API immediately
                // Or persist everything and let API update override
                activeThemeId: parsed.activeThemeId || initialState.activeThemeId,
                phase: parsed.phase || initialState.phase,
                settings: parsed.settings || initialState.settings, // Will be updated by API
                themes: parsed.themes || initialState.themes
            };
        }
    } catch (e) {
        console.error("Failed to load context state", e);
    }
    return initialState;
};

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(pomodoroReducer, undefined, loadInitialState);

    // Persist state changes
    useEffect(() => {
        const stateToSave = {
            activeThemeId: state.activeThemeId,
            phase: state.phase,
            // We can optionally not save themes/settings if we trust API, 
            // but saving them makes offline startup faster/smoother
            settings: state.settings,
            themes: state.themes
        };
        localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(stateToSave));
    }, [state.activeThemeId, state.phase, state.settings, state.themes]);
    const { themes, activeThemeId, settings, phase } = state;
    const [initialLoaded, setInitialLoaded] = useState(false);
    const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
    const isAutoStartPending = useRef(false);

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
            saveLearningSession('completed', totalTimeValue, sessionStartTime, new Date());
            setSessionStartTime(null);
        }
        isAutoStartPending.current = true;
        dispatch({ type: 'NEXT_PHASE' });
    }, [sessionStartTime, saveLearningSession, totalTimeValue, phase, playEndSound, stopBackgroundMusic]);

    const { timeLeft, isActive, start, pause, reset } = useTimer({
        initialSeconds: totalTimeValue,
        onComplete: handleTimerComplete,
    });

    // Handle auto-start next phase - Only trigger on phase changes
    useEffect(() => {
        if (initialLoaded && settings.autoStartNext && !isActive && isAutoStartPending.current) {
            const isAtStart = Math.abs(timeLeft - totalTimeValue) < 2;
            if (isAtStart) {
                isAutoStartPending.current = false;
                const timer = setTimeout(() => {
                    handleStart();
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [phase, settings.autoStartNext, initialLoaded]);
    // Reduced dependencies to avoid re-triggering on every tick

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
        isAutoStartPending.current = false;
        pause();
    }, [pause]);


    const handleReset = useCallback(() => {
        if (isActive && sessionStartTime) {
            const duration = totalTimeValue - timeLeft;
            saveLearningSession('interrupted', duration, sessionStartTime, new Date());
        }
        setSessionStartTime(null);
        isAutoStartPending.current = false;
        reset();
        // Just reset time, don't force phase back to focus unless explicitly desired.
        // This prevents "skipping" the current phase (like a break).
    }, [isActive, sessionStartTime, totalTimeValue, timeLeft, saveLearningSession, reset]);

    const handleSkip = useCallback(() => {
        if (sessionStartTime) {
            const duration = totalTimeValue - timeLeft;
            saveLearningSession('skipped', duration, sessionStartTime, new Date());
        }
        setSessionStartTime(null);
        isAutoStartPending.current = true;
        reset();
        dispatch({ type: 'NEXT_PHASE' });
    }, [sessionStartTime, totalTimeValue, timeLeft, saveLearningSession, reset]);

    const handleToggle = useCallback(() => {
        if (isActive) {
            handlePause();
        } else {
            // Failsafe: if timer is at 0, treat play as "Next Phase"
            if (timeLeft <= 0) {
                handleSkip(); // handleSkip dispatches NEXT_PHASE and resets
            } else {
                handleStart();
            }
        }
    }, [isActive, timeLeft, handlePause, handleStart, handleSkip]);

    const handleThemeChange = useCallback(async (themeId: string) => {
        if (isActive && sessionStartTime) {
            const duration = totalTimeValue - timeLeft;
            saveLearningSession('interrupted', duration, sessionStartTime, new Date());
        }
        setSessionStartTime(null);
        dispatch({ type: 'SET_ACTIVE_THEME', themeId });
        reset();

        // Sync theme choice to backend record
        try {
            const updatedSettings = { ...settings, activeThemeId: themeId };
            await upsertUserSettings(updatedSettings);
        } catch (error) {
            console.error("Failed to sync theme to backend", error);
        }

        // Also ensure immediate localStorage backup
        const saved = localStorage.getItem(CONTEXT_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            parsed.activeThemeId = themeId;
            localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(parsed));
        }
    }, [isActive, sessionStartTime, totalTimeValue, timeLeft, saveLearningSession, reset, settings]);

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

    const setDocumentContext = useCallback((context?: PomodoroState['documentContext']) => {
        dispatch({ type: 'SET_DOCUMENT_CONTEXT', context });
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
        setDocumentContext,
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
