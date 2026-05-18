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

                // 后端用户主题覆盖前端默认；不在默认列表的用户主题追加在末尾
                const overrideMap = new Map(fetchedThemes.map(t => [t.id, t]));
                const combinedThemes = [
                    ...DEFAULT_THEMES.map(t => overrideMap.get(t.id) ?? t),
                    ...fetchedThemes.filter(t => !DEFAULT_THEMES.find(d => d.id === t.id)),
                ];

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
