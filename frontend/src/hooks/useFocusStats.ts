import { useState, useEffect } from 'react';
import { getStatsRange } from '../api/client';
import type { StatsRangeResponse } from '../api/client';

export type TimeRange = 'day' | 'week' | 'month';

export const useTrendStats = (timeRange: TimeRange) => {
    const [stats, setStats] = useState<StatsRangeResponse | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [trendLoading, setTrendLoading] = useState(false);

    useEffect(() => {
        const fetchTrendStats = async () => {
            setTrendLoading(true);
            try {
                const endDate = new Date();
                const startDate = new Date();
                
                if (timeRange === 'week') {
                    startDate.setDate(endDate.getDate() - 6);
                } else if (timeRange === 'month') {
                    startDate.setDate(endDate.getDate() - 29);
                }

                const data = await getStatsRange(startDate, endDate);
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
                
                if (pieRange === 'day') {
                    // Today - start date is implicitly today if we don't change it, 
                    // but getStatsRange logic might strictly need start/end.
                    // Assuming default start is today if not manipulated? 
                    // Let's keep logic consistent with original file.
                    // Original file comment: // Today
                    // It meant startDate is already new Date(), endDate is new Date().
                } else if (pieRange === 'week') {
                    startDate.setDate(endDate.getDate() - 6);
                } else if (pieRange === 'month') {
                    startDate.setDate(endDate.getDate() - 29);
                }

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
