import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StatsRangeResponse } from '../../api/client';
import type { TimeRange } from '../../hooks/useFocusStats';
import { ChartEmptyState } from './ChartEmptyState';
import MiniDonut from './MiniDonut';

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

const buildYAxisTicks = (maxValue: number): number[] => {
    if (maxValue <= 0) return [0, 15, 30, 45, 60];
    const step =
        maxValue <= 20 ? 5
            : maxValue <= 60 ? 15
                : maxValue <= 120 ? 30
                    : maxValue <= 240 ? 60
                        : maxValue <= 480 ? 120
                            : 240;
    const ceiling = Math.ceil(maxValue / step) * step;
    const ticks: number[] = [];
    for (let v = 0; v <= ceiling; v += step) ticks.push(v);
    return ticks;
};

const parseLocalDate = (s: string): Date => {
    const [yy, mm, dd] = s.split('-').map(Number);
    return new Date(yy, (mm || 1) - 1, dd || 1);
};

const todayStr = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
})();

export const DailyTrendChart: React.FC<DailyTrendChartProps> = ({
    stats,
    pieStats,
    trendLoading,
    timeRange,
    onTimeRangeChange,
    getChartColorForTheme,
    formatDuration,
}) => {
    const { t, i18n } = useTranslation();
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);

    const dailyStats = stats?.daily_stats || [];
    const themes = pieStats?.sessions_by_theme || {};

    const maxValue = dailyStats.reduce((m, d) => Math.max(m, d.total_focus_minutes), 0);
    const yTicks = useMemo(() => buildYAxisTicks(maxValue), [maxValue]);
    const yMax = yTicks[yTicks.length - 1];

    // 主题全局顺序：按整段时间内该主题总分钟数从大到小排列；
    // 用于柱内段堆叠时跨天保持相同顺序，避免颜色块在不同日跳来跳去。
    const themeOrder = useMemo(() => {
        const totals = new Map<string, number>();
        dailyStats.forEach(d => {
            Object.entries(d.sessions_by_theme).forEach(([theme, mins]) => {
                totals.set(theme, (totals.get(theme) || 0) + mins);
            });
        });
        return Array.from(totals.entries())
            .sort(([, a], [, b]) => b - a)
            .map(([theme]) => theme);
    }, [dailyStats]);

    const themeIndex = useMemo(() => {
        const m = new Map<string, number>();
        themeOrder.forEach((theme, i) => m.set(theme, i));
        return m;
    }, [themeOrder]);

    // 趋势图配套迷你饼图数据：同周期总专注次数按主题划分
    const trendPieData = useMemo(() => {
        const countByTheme = new Map<string, number>();
        const minutesByTheme = new Map<string, number>();
        (stats?.sessions_details || []).forEach(s => {
            countByTheme.set(s.theme_name, (countByTheme.get(s.theme_name) || 0) + 1);
            minutesByTheme.set(s.theme_name, (minutesByTheme.get(s.theme_name) || 0) + s.duration_minutes);
        });
        // 兜底用 minutes
        const source = countByTheme.size > 0 ? countByTheme : minutesByTheme;
        return Array.from(source.entries())
            .sort(([, a], [, b]) => b - a)
            .map(([name, value]) => ({ name, value }));
    }, [stats]);

    const hasData = dailyStats.some(d => d.total_focus_minutes > 0);
    const chartHeight = 240;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/70 backdrop-blur-2xl p-8 rounded-[40px] border border-white/80 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]"
        >
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h3 className="text-xl font-bold text-theme-text flex items-center gap-2">
                    <Calendar size={20} className="text-theme-text-muted/40" />
                    {t('stats.dailyTrend', 'Daily Trend')}
                </h3>
                <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest flex-wrap justify-end max-w-[60%]">
                    {(() => {
                        const legendThemes = themeOrder.length > 0 ? themeOrder : Object.keys(themes);
                        if (legendThemes.length === 0) {
                            return (
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 bg-theme-text-muted/20" />
                                    <span className="text-theme-text-muted">{t('common.focus', 'Focus')}</span>
                                </div>
                            );
                        }
                        return legendThemes.map((theme, index) => (
                            <div key={theme} className="flex items-center gap-1.5">
                                <div
                                    className="w-2.5 h-2.5 shadow-sm"
                                    style={{ backgroundColor: getChartColorForTheme(theme, index) }}
                                />
                                <span className="text-theme-text-muted">{theme}</span>
                            </div>
                        ));
                    })()}
                </div>
            </div>

            <div className="flex justify-center mb-6">
                <div className="bg-white/50 p-1 rounded-2xl flex items-center border border-white/80 shadow-inner">
                    {(['week', 'month'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => onTimeRangeChange(range)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${timeRange === range
                                ? 'bg-white text-cozy-orange shadow-md'
                                : 'text-cozy-text-light hover:text-cozy-text'
                                }`}
                        >
                            {t(`stats.ranges.${range}`, range)}
                        </button>
                    ))}
                </div>
            </div>

            {/* 主图表区域 */}
            <div className="relative">
                {trendLoading && (
                    <div className="absolute inset-0 z-30 bg-white/50 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-theme-primary" />
                    </div>
                )}

                <div
                    className="grid items-stretch"
                    style={{ gridTemplateColumns: '48px 1fr', columnGap: 4 }}
                >
                    {/* Y 轴单位标签 */}
                    <div className="flex flex-col justify-between text-right pr-2 relative" style={{ height: chartHeight }}>
                        <div className="absolute -top-5 left-0 right-0 text-[9px] font-bold uppercase tracking-widest text-theme-text-muted/60 text-right pr-2">
                            {t('stats.minutesAxis', '分钟')}
                        </div>
                        {[...yTicks].reverse().map((tick) => (
                            <div
                                key={tick}
                                className="text-[10px] font-bold text-theme-text-muted/70 tabular-nums leading-none -translate-y-1/2 first:translate-y-0 last:-translate-y-full"
                            >
                                {tick}
                            </div>
                        ))}
                    </div>

                    {/* 图表绘制区 */}
                    <div
                        className={`relative ${timeRange === 'month' ? 'overflow-x-auto pb-2 custom-scrollbar' : ''}`}
                    >
                        <div
                            className="relative"
                            style={{
                                height: chartHeight,
                                minWidth: timeRange === 'month' ? '780px' : '100%',
                                borderLeft: '1.5px solid rgba(0,0,0,0.3)',
                                borderBottom: '1.5px solid rgba(0,0,0,0.3)',
                                borderRadius: 0,
                            }}
                        >
                            {/* 横向网格线（Y 轴刻度） */}
                            {yTicks.map((tick) => {
                                if (tick === 0) return null;
                                const bottomPct = (tick / yMax) * 100;
                                return (
                                    <div
                                        key={tick}
                                        className="absolute left-0 right-0 border-t border-dashed border-theme-text-muted/15 pointer-events-none"
                                        style={{ bottom: `${bottomPct}%` }}
                                    />
                                );
                            })}

                            {/* 柱子 */}
                            <div className="absolute inset-0 flex items-end justify-around px-1">
                                {dailyStats.map((day, idx) => {
                                    const totalMin = day.total_focus_minutes;
                                    const heightPct = yMax > 0 ? (totalMin / yMax) * 100 : 0;
                                    const isToday = day.date === todayStr;
                                    const isHover = hoverIdx === idx;
                                    // 按全局顺序排序当天的主题，保持跨天一致的堆叠
                                    const themeEntries = Object.entries(day.sessions_by_theme)
                                        .sort(([a], [b]) => {
                                            const ai = themeIndex.get(a) ?? 999;
                                            const bi = themeIndex.get(b) ?? 999;
                                            return ai - bi;
                                        });

                                    return (
                                        <div
                                            key={day.date}
                                            className="flex-1 h-full flex items-end justify-center relative group min-w-0"
                                            onMouseEnter={() => setHoverIdx(idx)}
                                            onMouseLeave={() => setHoverIdx(null)}
                                        >
                                            {totalMin > 0 ? (
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${heightPct}%` }}
                                                    transition={{
                                                        duration: 0.9,
                                                        delay: 0.15 + idx * 0.05,
                                                        ease: [0.16, 1, 0.3, 1],
                                                    }}
                                                    className="relative w-full max-w-[36px] overflow-hidden flex flex-col-reverse shadow-sm"
                                                    style={{
                                                        opacity: isHover ? 1 : (isToday ? 1 : 0.92),
                                                        borderTopLeftRadius: 3,
                                                        borderTopRightRadius: 3,
                                                    }}
                                                >
                                                    {themeEntries.length > 0 ? (
                                                        themeEntries.map(([theme, mins]) => {
                                                            const segPct = totalMin > 0 ? (mins / totalMin) * 100 : 0;
                                                            const globalIdx = themeIndex.get(theme) ?? 0;
                                                            return (
                                                                <div
                                                                    key={theme}
                                                                    style={{
                                                                        height: `${segPct}%`,
                                                                        backgroundColor: getChartColorForTheme(theme, globalIdx),
                                                                    }}
                                                                />
                                                            );
                                                        })
                                                    ) : (
                                                        <div
                                                            className="h-full w-full"
                                                            style={{ backgroundColor: 'var(--theme-primary)' }}
                                                        />
                                                    )}
                                                </motion.div>
                                            ) : (
                                                <div
                                                    className="w-full max-w-[36px]"
                                                    style={{
                                                        height: 3,
                                                        backgroundColor: 'rgba(0,0,0,0.08)',
                                                    }}
                                                />
                                            )}

                                            {/* 柱顶数值（非 hover 时显示） */}
                                            {totalMin > 0 && !isHover && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.9 + idx * 0.05 }}
                                                    className={`absolute text-[10px] font-bold tabular-nums pointer-events-none ${isToday ? 'text-theme-primary' : 'text-theme-text-muted'}`}
                                                    style={{
                                                        bottom: `calc(${heightPct}% + 4px)`,
                                                    }}
                                                >
                                                    {formatDuration(totalMin)}
                                                </motion.div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {!hasData && !trendLoading && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <ChartEmptyState />
                                </div>
                            )}
                        </div>

                        {/* X 轴标签 */}
                        <div
                            className="flex justify-around px-1 mt-2"
                            style={{ minWidth: timeRange === 'month' ? '780px' : '100%' }}
                        >
                            {dailyStats.map((day, idx) => {
                                const date = parseLocalDate(day.date);
                                const isToday = day.date === todayStr;
                                const label = timeRange === 'month'
                                    ? String(date.getDate())
                                    : date.toLocaleDateString(i18n.language, { weekday: 'short' });
                                return (
                                    <div
                                        key={day.date}
                                        className={`flex-1 text-center text-[11px] font-bold uppercase tracking-wider min-w-0 ${isToday ? 'text-theme-primary' : 'text-theme-text-muted/80'}`}
                                        onMouseEnter={() => setHoverIdx(idx)}
                                        onMouseLeave={() => setHoverIdx(null)}
                                    >
                                        {label}
                                    </div>
                                );
                            })}
                        </div>

                        {/* tooltip */}
                        <AnimatePresence>
                            {hoverIdx !== null && dailyStats[hoverIdx] && dailyStats[hoverIdx].total_focus_minutes > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 4 }}
                                    className="absolute pointer-events-none z-20 bg-slate-900 text-white text-xs font-bold rounded-xl px-3 py-2 shadow-2xl border border-slate-700"
                                    style={{
                                        left: `${((hoverIdx + 0.5) / dailyStats.length) * 100}%`,
                                        top: -8,
                                        transform: 'translate(-50%, -100%)',
                                    }}
                                >
                                    <div className="flex flex-col items-center gap-1 min-w-[90px]">
                                        <span className="tabular-nums">
                                            {formatDuration(dailyStats[hoverIdx].total_focus_minutes)}
                                        </span>
                                        {Object.keys(dailyStats[hoverIdx].sessions_by_theme).length > 0 && (
                                            <span className="text-[10px] font-normal text-slate-300 border-t border-slate-700 pt-1 mt-0.5 w-full text-center">
                                                {Object.entries(dailyStats[hoverIdx].sessions_by_theme)
                                                    .sort(([, a], [, b]) => b - a)
                                                    .slice(0, 2)
                                                    .map(([theme]) => theme)
                                                    .join(', ')}
                                                {Object.keys(dailyStats[hoverIdx].sessions_by_theme).length > 2 && '…'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-slate-700" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* 配套迷你饼图：同周期主题分布 */}
            {trendPieData.length > 0 && (
                <div className="mt-8 pt-6 border-t border-theme-text-muted/10 flex items-center gap-6">
                    <MiniDonut
                        data={trendPieData}
                        getColor={(name) => {
                            const idx = themeIndex.get(name) ?? 0;
                            return getChartColorForTheme(name, idx);
                        }}
                        size={80}
                        thickness={14}
                        label={t('stats.sessions', '次')}
                    />
                    <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-theme-text-muted/70 mb-2">
                            {t('stats.themeBreakdown', '主题分布（同周期）')}
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                            {trendPieData.slice(0, 6).map((d) => {
                                const idx = themeIndex.get(d.name) ?? 0;
                                const color = getChartColorForTheme(d.name, idx);
                                const total = trendPieData.reduce((sum, x) => sum + x.value, 0);
                                const pct = total > 0 ? (d.value / total) * 100 : 0;
                                return (
                                    <div key={d.name} className="flex items-center justify-between gap-2 text-[11px]">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <div className="w-2 h-2 flex-shrink-0" style={{ backgroundColor: color }} />
                                            <span className="text-theme-text-muted/80 truncate" title={d.name}>{d.name}</span>
                                        </div>
                                        <span className="font-bold text-theme-text tabular-nums">
                                            {pct.toFixed(0)}%
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};
