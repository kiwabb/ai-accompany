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
    playStartSound?: () => void;
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
        playStartSound,
    } = deps;

    const handleStart = useCallback(() => {
        // Play start sound when entering a fresh phase (full duration) or after completion (timeLeft=0).
        if (timeLeft === totalTimeValue || timeLeft <= 0) {
            playStartSound?.();
        }
        setSessionStartTime(new Date());
        start();
    }, [start, setSessionStartTime, timeLeft, totalTimeValue, playStartSound]);

    const handlePause = useCallback(() => {
        pause();
    }, [pause]);

    const handleReset = useCallback(() => {
        if (isActive && sessionStartTime) {
            const duration = totalTimeValue - timeLeft;
            saveLearningSession(activeTheme, phase, settings, 'interrupted', duration, sessionStartTime, new Date());
        }
        setSessionStartTime(null);
        reset();
    }, [isActive, sessionStartTime, totalTimeValue, timeLeft, saveLearningSession, reset, activeTheme, phase, settings, setSessionStartTime]);

    const handleSkip = useCallback(() => {
        if (sessionStartTime) {
            const duration = totalTimeValue - timeLeft;
            saveLearningSession(activeTheme, phase, settings, 'skipped', duration, sessionStartTime, new Date());
        }
        // Just dispatch — useTimer's [initialSeconds] effect will reset timeLeft to the new
        // duration. isActive carries over: if running, the new phase keeps ticking; if paused,
        // it stays paused at the new duration and the user can start manually.
        dispatch({ type: 'NEXT_PHASE' });
        if (isActive) {
            setSessionStartTime(new Date());
        } else {
            setSessionStartTime(null);
        }
    }, [isActive, sessionStartTime, totalTimeValue, timeLeft, saveLearningSession, activeTheme, phase, settings, dispatch, setSessionStartTime]);

    const handleToggle = useCallback(() => {
        if (isActive) {
            handlePause();
        } else {
            handleStart();
        }
    }, [isActive, handlePause, handleStart]);

    return {
        handleStart,
        handlePause,
        handleReset,
        handleSkip,
        handleToggle,
    };
};
