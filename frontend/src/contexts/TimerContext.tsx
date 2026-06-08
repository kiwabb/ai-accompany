import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useTimer } from '../hooks/useTimer';
import { useAudio } from '../hooks/useAudio';
import type { DailyStats } from '../api/client';
import type { TimerSettings } from '../types/pomodoro';
import { usePomodoroState } from '../hooks/usePomodoroState';
import { usePomodoroData } from '../hooks/usePomodoroData';
import { useTimerActions } from './timerActions';
import { useSessionHandlers } from './timerSessionHandlers';
import { TimerContext, type TimerContextType } from './TimerContextValue';

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { state, dispatch, activeTheme, totalTimeValue } = usePomodoroState();
    const { todayStats, setTodayStats, initialLoaded, saveLearningSession } = usePomodoroData(dispatch);

    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
    // Ref to pause() so handleTimerComplete can pause when autoStartNext is disabled.
    // pause is defined by useTimer below (after handleTimerComplete) — break the cycle via ref.
    const pauseRef = useRef<() => void>(() => {});

    const { settings, phase } = state;

    const { playStartSound, playEndSound, stopBackgroundMusic } = useAudio({
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
        }

        // Dispatch NEXT_PHASE first — useTimer's [initialSeconds] effect will reset timeLeft
        // to the new phase's duration via microtask. With isActive left untouched, the running
        // interval seamlessly carries over and the next tick decrements from the new value.
        dispatch({ type: 'NEXT_PHASE' });

        if (settings.autoStartNext) {
            // Seamless transition: timer stays active, refresh sessionStartTime for new phase
            setSessionStartTime(new Date());
        } else {
            // Stop and wait for the user to start the next phase manually
            pauseRef.current();
            setSessionStartTime(null);
        }
    }, [sessionStartTime, saveLearningSession, totalTimeValue, phase, playEndSound, stopBackgroundMusic, activeTheme, settings, dispatch]);

    const { timeLeft, isActive, hasStarted, start, pause, reset } = useTimer({
        initialSeconds: totalTimeValue,
        onComplete: handleTimerComplete,
    });

    useEffect(() => { pauseRef.current = pause; }, [pause]);

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
        setSessionStartTime,
        playStartSound,
    });

    const sessionHandlers = useSessionHandlers({
        isActive, sessionStartTime, totalTimeValue, timeLeft,
        activeTheme, phase, settings, dispatch,
        reset, saveLearningSession,
        setSessionStartTime,
    });

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
        hasStarted,
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
