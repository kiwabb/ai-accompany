import { useCallback } from 'react';
import { upsertUserSettings } from '../api/client';
import type { FocusTheme, TimerSettings, Phase } from '../types/pomodoro';
import type { PomodoroState, PomodoroAction } from '../hooks/usePomodoroState';

const CONTEXT_STORAGE_KEY = 'pomodoro_context_state';

export interface SessionHandlerDeps {
    isActive: boolean;
    sessionStartTime: Date | null;
    totalTimeValue: number;
    timeLeft: number;
    activeTheme: FocusTheme | undefined;
    phase: Phase;
    settings: TimerSettings;
    dispatch: React.Dispatch<PomodoroAction>;
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
}

export const useSessionHandlers = (deps: SessionHandlerDeps) => {
    const {
        isActive,
        sessionStartTime,
        totalTimeValue,
        timeLeft,
        activeTheme,
        phase,
        settings,
        dispatch,
        reset,
        saveLearningSession,
        setSessionStartTime,
    } = deps;

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
    }, [isActive, sessionStartTime, totalTimeValue, timeLeft, saveLearningSession, reset, settings, activeTheme, phase, dispatch, setSessionStartTime]);

    const handleSaveSettings = useCallback(async (s: TimerSettings) => {
        try {
            const updatedSettings = await upsertUserSettings(s);
            // Merge so client-only fields (e.g. useDefaultThemeIcon) survive the round-trip
            dispatch({ type: 'SAVE_SETTINGS', settings: { ...s, ...updatedSettings }, themes: [] });
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

    return {
        handleThemeChange,
        handleSaveSettings,
        handleThemesChange,
        setDocumentContext,
    };
};
