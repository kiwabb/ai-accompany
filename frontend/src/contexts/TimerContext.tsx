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
    handleVisualThemeChange: (themeId: string) => void;
    handleSaveSettings: (s: TimerSettings) => void;
    handleUpdateSetting: (s: Partial<TimerSettings>) => void;
    handleThemesChange: (newThemes: FocusTheme[]) => void;
    setDocumentContext: (context?: PomodoroState['documentContext']) => void;
    activeTheme: FocusTheme | undefined;
    initialLoaded: boolean;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { state, dispatch, activeTheme, totalTimeValue } = usePomodoroState();
    const { todayStats, setTodayStats, initialLoaded, saveLearningSession } = usePomodoroData(dispatch);

    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
    const isAutoStartPending = useRef(false);
    const isSkipPending = useRef(false);

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

    // 乐观更新当日学习时长：focus 阶段每过 60 秒就增加当前主题 1 分钟；会话结束后由 fetchDailyStats 重新校准。
    const lastAccumulatedSecondsRef = useRef(totalTimeValue);
    useEffect(() => {
        if (!isActive || phase !== 'focus' || !activeTheme) {
            lastAccumulatedSecondsRef.current = timeLeft;
            return;
        }
        const last = lastAccumulatedSecondsRef.current;
        if (last - timeLeft >= 60) {
            const elapsedMinutes = Math.floor((last - timeLeft) / 60);
            lastAccumulatedSecondsRef.current = last - elapsedMinutes * 60;
            const themeName = activeTheme.name;
            setTodayStats(prev => {
                const base: DailyStats = prev ?? {
                    date: new Date().toISOString().split('T')[0],
                    total_focus_minutes: 0,
                    total_sessions: 0,
                    sessions_by_theme: {},
                };
                return {
                    ...base,
                    total_focus_minutes: base.total_focus_minutes + elapsedMinutes,
                    sessions_by_theme: {
                        ...base.sessions_by_theme,
                        [themeName]: (base.sessions_by_theme[themeName] || 0) + elapsedMinutes,
                    },
                };
            });
        }
    }, [timeLeft, isActive, phase, activeTheme, setTodayStats]);

    const timerActions = useTimerActions({
        isActive, timeLeft, sessionStartTime, totalTimeValue,
        activeTheme, phase, settings, dispatch,
        start, pause, reset, saveLearningSession,
        setSessionStartTime, isAutoStartPending, isSkipPending,
    });

    const sessionHandlers = useSessionHandlers({
        isActive, sessionStartTime, totalTimeValue, timeLeft,
        activeTheme, phase, settings, dispatch,
        reset, saveLearningSession,
        setSessionStartTime,
    });

    // Stable ref to avoid re-running auto-start effect when timerActions identity changes
    const timerActionsRef = useRef(timerActions);
    useEffect(() => { timerActionsRef.current = timerActions; }, [timerActions]);

    // Handle auto-start next phase (after timer complete with autoStartNext, OR after explicit skip)
    useEffect(() => {
        if (initialLoaded && !isActive && isAutoStartPending.current) {
            const shouldAutoStart = settings.autoStartNext || isSkipPending.current;
            if (!shouldAutoStart) return;
            const isAtStart = Math.abs(timeLeft - totalTimeValue) < 2;
            if (isAtStart) {
                isAutoStartPending.current = false;
                isSkipPending.current = false;
                const timer = setTimeout(() => {
                    timerActionsRef.current.handleStart();
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [phase, settings.autoStartNext, initialLoaded, isActive, timeLeft, totalTimeValue]);

    const handleVisualThemeChange = useCallback((themeId: string) => {
        dispatch({ type: 'SET_VISUAL_THEME', themeId });
    }, [dispatch]);

    const handleUpdateSetting = useCallback((newSettings: Partial<TimerSettings>) => {
        sessionHandlers.handleSaveSettings({ ...state.settings, ...newSettings });
    }, [state.settings, sessionHandlers]);

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
        handleVisualThemeChange,
        handleSaveSettings: sessionHandlers.handleSaveSettings,
        handleUpdateSetting,
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
