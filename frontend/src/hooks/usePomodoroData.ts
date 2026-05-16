import { useState, useCallback, useEffect } from 'react';
import type { DailyStats, SessionCreate } from '../api/client';
import { getDailyStats, saveSession, getUserSettings, getUserThemes } from '../api/client';
import type { FocusTheme, TimerSettings, Phase } from '../types/pomodoro';
import type { PomodoroAction } from './usePomodoroState';
import { DEFAULT_THEMES } from '../constants/pomodoro';

export const usePomodoroData = (dispatch: React.Dispatch<PomodoroAction>) => {
    const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
    const [initialLoaded, setInitialLoaded] = useState(false);

    const fetchDailyStats = useCallback(async () => {
        try {
            const stats = await getDailyStats();
            setTodayStats(stats);
        } catch (error) {
            console.error('Failed to fetch daily stats', error);
        }
    }, []);

    const saveLearningSession = useCallback(async (
        activeTheme: FocusTheme | undefined,
        phase: Phase,
        settings: TimerSettings,
        status: SessionCreate['status'],
        duration: number,
        start: Date,
        end: Date
    ) => {
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
    }, [fetchDailyStats]);

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
    }, [fetchDailyStats, dispatch]);

    return { todayStats, setTodayStats, initialLoaded, fetchDailyStats, saveLearningSession };
};
