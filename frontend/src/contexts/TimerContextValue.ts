import { createContext, type Dispatch } from 'react';
import type { DailyStats } from '../api/client';
import type { PomodoroAction, PomodoroState } from '../hooks/usePomodoroState';
import type { FocusTheme, TimerSettings } from '../types/pomodoro';

export interface TimerContextType {
    state: PomodoroState;
    dispatch: Dispatch<PomodoroAction>;
    timeLeft: number;
    isActive: boolean;
    hasStarted: boolean;
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

export const TimerContext = createContext<TimerContextType | undefined>(undefined);
