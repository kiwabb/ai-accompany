import React, { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react';
import { useTimer } from '../hooks/useTimer';
import { useAudio } from '../hooks/useAudio';
import type { FocusTheme, TimerSettings } from '../types/pomodoro';
import type { DailyStats } from '../api/client';
import { usePomodoroState, type PomodoroState, type PomodoroAction } from '../hooks/usePomodoroState';
import { usePomodoroData } from '../hooks/usePomodoroData';
import { useTimerActions } from './timerActions';
import { useSessionHandlers } from './timerSessionHandlers';

export interface TimerContextType {
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

    const timerActions = useTimerActions({
        isActive, timeLeft, sessionStartTime, totalTimeValue,
        activeTheme, phase, settings, dispatch,
        start, pause, reset, saveLearningSession,
        setSessionStartTime, isAutoStartPending,
    });

    const sessionHandlers = useSessionHandlers({
        isActive, sessionStartTime, totalTimeValue, timeLeft,
        activeTheme, phase, settings, dispatch,
        reset, saveLearningSession,
        setSessionStartTime,
    });

    // Handle auto-start next phase
    useEffect(() => {
        if (initialLoaded && settings.autoStartNext && !isActive && isAutoStartPending.current) {
            const isAtStart = Math.abs(timeLeft - totalTimeValue) < 2;
            if (isAtStart) {
                isAutoStartPending.current = false;
                const timer = setTimeout(() => {
                    timerActions.handleStart();
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [phase, settings.autoStartNext, initialLoaded, isActive, timeLeft, totalTimeValue, timerActions]);

    const value: TimerContextType = {
        state,
        dispatch,
        timeLeft,
        isActive,
        totalTimeValue,
        todayStats,
        start: timerActions.handleStart,
        pause: timerActions.handlePause,
        reset,
        handleToggle: timerActions.handleToggle,
        handleReset: timerActions.handleReset,
        handleSkip: timerActions.handleSkip,
        handleThemeChange: sessionHandlers.handleThemeChange,
        handleSaveSettings: sessionHandlers.handleSaveSettings,
        handleThemesChange: sessionHandlers.handleThemesChange,
        setDocumentContext: sessionHandlers.setDocumentContext,
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
