import React from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StatsRangeResponse } from '../../api/client';
import type { TimeRange } from '../../hooks/useFocusStats';
import { ChartBarSegment, EmptyBarSegment } from './ChartBarSegment';
import { ChartTooltip } from './ChartTooltip';
import { ChartEmptyState } from './ChartEmptyState';

interface DailyTrendChartProps {
    stats: StatsRangeResponse | null;
    pieStats: StatsRangeResponse | null;
    trendLoading: boolean;
    timeRange: TimeRange;
    onTimeRangeChange: (range: TimeRange) => void;
    scrollContainerRef: React.RefObject<HTMLDivElement | null>;
    maxDailyMinutes: number;
    getChartColorForTheme: (themeName: string, index: number) => string;
    formatDuration: (minutes: number) => string;
    activeVisualTheme: { colors: { primary: string } };
}

export const DailyTrendChart: React.FC<DailyTrendChartProps> = ({
    stats, pieStats, trendLoading, timeRange, onTimeRangeChange, scrollContainerRef,
    maxDailyMinutes, getChartColorForTheme, formatDuration, activeVisualTheme,
}) => {
    const { t } = useTranslation();
    const themes = pieStats?.sessions_by_theme || {};

    const renderBar = (day: NonNullable<StatsRangeResponse['daily_stats']>[number], index: number) => {
        const totalMinutes = day.total_focus_minutes;
        const heightPct = maxDailyMinutes > 0 ? Math.max((totalMinutes / maxDailyMinutes) * 100, totalMinutes > 0 ? 5 : 0) : 0;
        const date = new Date(day.date);
        const dayName = timeRange === 'month' ? date.getDate().toString() : date.toLocaleDateString(undefined, { weekday: 'short' });
        const isToday = new Date().toDateString() === date.toDateString();
        const themeEntries = Object.entries(day.sessions_by_theme);

        return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end z-10 relative min-w-[40px]">
                <div className="relative w-full flex justify-center h-full items-end">
                    <div className="absolute bottom-0 w-full max-w-[40px] h-full bg-theme-text/5 rounded-t-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {totalMinutes > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 + (index * 0.1) }}
                            className={`absolute mb-2 text-[10px] font-bold ${isToday ? 'text-theme-primary' : 'text-theme-text-muted'} group-hover:opacity-0 transition-opacity duration-200`}
                            style={{ bottom: `${heightPct}%` }}>
                            {formatDuration(totalMinutes)}
                        </motion.div>
                    )}
                    <motion.div initial={{ height: 0 }} animate={{ height: `${heightPct}%` }}
                        transition={{ duration: 1, delay: 0.4 + (index * 0.1), ease: "easeOut" }}
                        className="w-full max-w-[40px] relative flex flex-col-reverse rounded-t-2xl overflow-hidden">
                        {themeEntries.length > 0 ? themeEntries.map(([theme, mins], i) => (
                            <ChartBarSegment key={theme} theme={theme} minutes={mins} totalMinutes={totalMinutes}
                                color={getChartColorForTheme(theme, i)} index={i} totalSegments={themeEntries.length}
                                isToday={isToday} activeVisualTheme={activeVisualTheme} />
                        )) : <EmptyBarSegment isToday={isToday} activeVisualTheme={activeVisualTheme} />}
                        {!isToday && <div className="absolute inset-0 bg-theme-surface/30 pointer-events-none" />}
                    </motion.div>
                    <ChartTooltip totalMinutes={totalMinutes} sessionsByTheme={day.sessions_by_theme} formatDuration={formatDuration} />
                </div>
                <span className={`text-xs font-bold uppercase ${isToday ? 'text-theme-primary' : 'text-theme-text-muted'}`}>{dayName}</span>
            </div>
        );
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white/70 backdrop-blur-2xl p-8 rounded-[40px] border border-white/80 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-theme-text flex items-center gap-2">
                    <Calendar size={20} className="text-theme-text-muted/40" />
                    {t('stats.dailyTrend', 'Daily Trend')}
                </h3>
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest flex-wrap justify-end max-w-[50%]">
                    {Object.keys(themes).length === 0 ? (
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 bg-theme-text-muted/20 rounded-sm"></div>
                            <span className="text-theme-text-muted">Focus</span>
                        </div>
                    ) : Object.keys(themes).slice(0, 4).map((theme, index) => (
                        <div key={theme} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ backgroundColor: getChartColorForTheme(theme, index) }}></div>
                            <span className="text-theme-text-muted">{theme}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-center mb-8">
                <div className="bg-white/50 p-1 rounded-2xl flex items-center border border-white/80 shadow-inner">
                    {(['week', 'month'] as const).map((range) => (
                        <button key={range} onClick={() => onTimeRangeChange(range)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                timeRange === range ? 'bg-white text-cozy-orange shadow-md' : 'text-cozy-text-light hover:text-cozy-text'
                            }`}>
                            {t(`stats.ranges.${range}`, range)}
                        </button>
                    ))}
                </div>
            </div>
            <div className="h-64 mt-4 relative">
                {trendLoading && (
                    <div className="absolute inset-0 z-20 bg-theme-surface/50 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-theme-primary"></div>
                    </div>
                )}
                <div ref={scrollContainerRef} className="h-full overflow-x-auto pb-2 custom-scrollbar scroll-smooth">
                    <div className="h-full flex items-end justify-between gap-2 md:gap-4 relative min-w-full px-1"
                        style={{ width: timeRange === 'month' ? 'max(100%, 800px)' : '100%' }}>
                        {stats?.daily_stats?.map((day, index) => renderBar(day, index))}
                    </div>
                </div>
                {(!stats || stats.total_focus_minutes === 0) && !trendLoading && <ChartEmptyState />}
            </div>
        </motion.div>
    );
};
