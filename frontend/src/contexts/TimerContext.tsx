import React, { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react';
import { useTimer } from '../hooks/useTimer';
import { useAudio } from '../hooks/useAudio';
import { upsertUserSettings } from '../api/client';
import type { FocusTheme, TimerSettings } from '../types/pomodoro';
import type { DailyStats } from '../api/client';
import { usePomodoroState, type PomodoroState, type PomodoroAction } from '../hooks/usePomodoroState';
import { usePomodoroData } from '../hooks/usePomodoroData';
import { DEFAULT_THEMES } from '../constants/pomodoro';

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

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { state, dispatch, activeTheme, totalTimeValue } = usePomodoroState();
    const { todayStats, initialLoaded, saveLearningSession } = usePomodoroData(dispatch);
    
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
    const isAutoStartPending = useRef(false);

    const { settings, phase } = state;

    const { playEndSound, stopBackgroundMusic } = useAudio({
        enableSounds: settings.enableSounds !== false,
        enableBackgroundMusic: settings.enableBackgroundMusic !== false,
        volume: settings.soundVolume || 0.5,
    });

    const handleTimerComplete = useCallback(() => {
        playEndSound();
        if (phase === 'focus') {
            stopBackgroundMusic();
        }

        if (sessionStartTime) {
            saveLearningSession(activeTheme, phase, settings, 'completed', totalTimeValue, sessionStartTime, new Date());
            setSessionStartTime(null);
        }
        isAutoStartPending.current = true;
        dispatch({ type: 'NEXT_PHASE' });
    }, [sessionStartTime, saveLearningSession, totalTimeValue, phase, playEndSound, stopBackgroundMusic, activeTheme, settings, dispatch]);

    const { timeLeft, isActive, start, pause, reset } = useTimer({
        initialSeconds: totalTimeValue,
        onComplete: handleTimerComplete,
    });

    const handleStart = useCallback(() => {
        setSessionStartTime(new Date());
        start();
    }, [start]);

    const handlePause = useCallback(() => {
        isAutoStartPending.current = false;
        pause();
    }, [pause]);

    // Handle auto-start next phase
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
    }, [phase, settings.autoStartNext, initialLoaded, isActive, timeLeft, totalTimeValue, handleStart]);

    const handleReset = useCallback(() => {
        if (isActive && sessionStartTime) {
            const duration = totalTimeValue - timeLeft;
            saveLearningSession(activeTheme, phase, settings, 'interrupted', duration, sessionStartTime, new Date());
        }
        setSessionStartTime(null);
        isAutoStartPending.current = false;
        reset();
    }, [isActive, sessionStartTime, totalTimeValue, timeLeft, saveLearningSession, reset, activeTheme, phase, settings]);

    const handleSkip = useCallback(() => {
        if (sessionStartTime) {
            const duration = totalTimeValue - timeLeft;
            saveLearningSession(activeTheme, phase, settings, 'skipped', duration, sessionStartTime, new Date());
        }
        setSessionStartTime(null);
        isAutoStartPending.current = true;
        reset();
        dispatch({ type: 'NEXT_PHASE' });
    }, [sessionStartTime, totalTimeValue, timeLeft, saveLearningSession, reset, activeTheme, phase, settings, dispatch]);

    const handleToggle = useCallback(() => {
        if (isActive) {
            handlePause();
        } else {
            if (timeLeft <= 0) {
                handleSkip();
            } else {
                handleStart();
            }
        }
    }, [isActive, timeLeft, handlePause, handleStart, handleSkip]);

    const handleThemeChange = useCallback(async (themeId: string) => {
        if (isActive && sessionStartTime) {
            const duration = totalTimeValue - timeLeft;
            saveLearningSession(activeTheme, phase, settings, 'interrupted', duration, sessionStartTime, new Date());
        }
        setSessionStartTime(null);
        dispatch({ type: 'SET_ACTIVE_THEME', themeId });
        reset();

        try {
            const updatedSettings = { ...settings, activeThemeId: themeId };
            await upsertUserSettings(updatedSettings);
        } catch (error) {
            console.error("Failed to sync theme to backend", error);
        }

        const saved = localStorage.getItem(CONTEXT_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            parsed.activeThemeId = themeId;
            localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(parsed));
        }
    }, [isActive, sessionStartTime, totalTimeValue, timeLeft, saveLearningSession, reset, settings, activeTheme, phase, dispatch]);

    const handleSaveSettings = useCallback(async (s: TimerSettings) => {
        try {
            const updatedSettings = await upsertUserSettings(s);
            dispatch({ type: 'SAVE_SETTINGS', settings: updatedSettings, themes: DEFAULT_THEMES });
            reset();
            dispatch({ type: 'RESET_TO_FOCUS' });
        } catch (error) {
            console.error("Failed to save user settings:", error);
        }
    }, [reset, dispatch]);

    const handleThemesChange = useCallback((newThemes: FocusTheme[]) => {
        dispatch({ type: 'SET_THEMES', themes: newThemes });
    }, [dispatch]);

    const setDocumentContext = useCallback((context?: PomodoroState['documentContext']) => {
        dispatch({ type: 'SET_DOCUMENT_CONTEXT', context });
    }, [dispatch]);

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
