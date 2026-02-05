import { useCallback } from 'react';
import type { FocusTheme, TimerSettings, Phase } from '../types/pomodoro';
import type { PomodoroAction } from '../hooks/usePomodoroState';

export interface TimerActionDeps {
    isActive: boolean;
    timeLeft: number;
    sessionStartTime: Date | null;
    totalTimeValue: number;
    activeTheme: FocusTheme | undefined;
    phase: Phase;
    settings: TimerSettings;
    dispatch: React.Dispatch<PomodoroAction>;
    start: () => void;
    pause: () => void;
    reset: () => void;
    saveLearningSession: (
        activeTheme: FocusTheme | undefined,
        phase: Phase,
        settings: TimerSettings,
        status: 'completed' | 'interrupted' | 'skipped',
        duration: number,
        start: Date,
        end: Date
    ) => Promise<void>;
    setSessionStartTime: (time: Date | null) => void;
    isAutoStartPending: React.MutableRefObject<boolean>;
}

export const useTimerActions = (deps: TimerActionDeps) => {
    const {
        isActive,
        timeLeft,
        sessionStartTime,
        totalTimeValue,
        activeTheme,
        phase,
        settings,
        dispatch,
        start,
        pause,
        reset,
        saveLearningSession,
        setSessionStartTime,
        isAutoStartPending,
    } = deps;

    const handleStart = useCallback(() => {
        setSessionStartTime(new Date());
        start();
    }, [start, setSessionStartTime]);

    const handlePause = useCallback(() => {
        isAutoStartPending.current = false;
        pause();
    }, [pause, isAutoStartPending]);

    const handleReset = useCallback(() => {
        if (isActive && sessionStartTime) {
            const duration = totalTimeValue - timeLeft;
            saveLearningSession(activeTheme, phase, settings, 'interrupted', duration, sessionStartTime, new Date());
        }
        setSessionStartTime(null);
        isAutoStartPending.current = false;
        reset();
    }, [isActive, sessionStartTime, totalTimeValue, timeLeft, saveLearningSession, reset, activeTheme, phase, settings, setSessionStartTime, isAutoStartPending]);

    const handleSkip = useCallback(() => {
        if (sessionStartTime) {
            const duration = totalTimeValue - timeLeft;
            saveLearningSession(activeTheme, phase, settings, 'skipped', duration, sessionStartTime, new Date());
        }
        setSessionStartTime(null);
        isAutoStartPending.current = true;
        reset();
        dispatch({ type: 'NEXT_PHASE' });
    }, [sessionStartTime, totalTimeValue, timeLeft, saveLearningSession, reset, activeTheme, phase, settings, dispatch, setSessionStartTime, isAutoStartPending]);

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

    return {
        handleStart,
        handlePause,
        handleReset,
        handleSkip,
        handleToggle,
    };
};
