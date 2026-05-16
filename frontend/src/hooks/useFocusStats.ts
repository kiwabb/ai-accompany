import { useState, useEffect } from 'react';
import { getStatsRange } from '../api/client';
import type { StatsRangeResponse, DailyStat } from '../api/client';

export type TimeRange = 'day' | 'week' | 'month';

const formatDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// 返回本周一到周日 7 个日期（YYYY-MM-DD），周一为一周开始。
const getCurrentWeekDates = (): string[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const offsetToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - offsetToMonday);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return formatDate(d);
    });
};

// 把后端返回的 daily_stats 与给定日期序列对齐：缺失的日期补 0，保持顺序。
const fillDailyStats = (stats: DailyStat[] | undefined, dates: string[]): DailyStat[] => {
    const byDate = new Map((stats || []).map(s => [s.date, s] as const));
    return dates.map(d => byDate.get(d) ?? {
        date: d,
        total_focus_minutes: 0,
        sessions_by_theme: {},
    });
};

export const useTrendStats = (timeRange: TimeRange) => {
    const [stats, setStats] = useState<StatsRangeResponse | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [trendLoading, setTrendLoading] = useState(false);

    useEffect(() => {
        const fetchTrendStats = async () => {
            setTrendLoading(true);
            try {
                let startDate: Date;
                let endDate: Date;
                let expectedDates: string[] | null = null;

                if (timeRange === 'week') {
                    expectedDates = getCurrentWeekDates();
                    startDate = new Date(expectedDates[0]);
                    // 周日可能在未来，后端只会返回到 today；下面 fillDailyStats 会补 0。
                    const sunday = new Date(expectedDates[6]);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    endDate = sunday.getTime() > today.getTime() ? today : sunday;
                } else if (timeRange === 'month') {
                    endDate = new Date();
                    startDate = new Date();
                    startDate.setDate(endDate.getDate() - 29);
                } else {
                    endDate = new Date();
                    startDate = new Date();
                }

                const data = await getStatsRange(startDate, endDate);
                if (expectedDates) {
                    data.daily_stats = fillDailyStats(data.daily_stats, expectedDates);
                }
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setTrendLoading(false);
                setInitialLoading(false);
            }
        };

        fetchTrendStats();
    }, [timeRange]);

    return { stats, trendLoading, initialLoading };
};

export const usePieStats = (pieRange: TimeRange) => {
    const [pieStats, setPieStats] = useState<StatsRangeResponse | null>(null);

    useEffect(() => {
        const fetchPieStats = async () => {
            try {
                const endDate = new Date();
                const startDate = new Date();

                if (pieRange === 'week') {
                    const weekDates = getCurrentWeekDates();
                    startDate.setTime(new Date(weekDates[0]).getTime());
                    // endDate 保持今天
                } else if (pieRange === 'month') {
                    startDate.setDate(endDate.getDate() - 29);
                }
                // pieRange === 'day' 时 startDate=endDate=今天

                const data = await getStatsRange(startDate, endDate);
                setPieStats(data);
            } catch (error) {
                console.error('Failed to fetch pie stats:', error);
            }
        };

        fetchPieStats();
    }, [pieRange]);

    return { pieStats };
};
