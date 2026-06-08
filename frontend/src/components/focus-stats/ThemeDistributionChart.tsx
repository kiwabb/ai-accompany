import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StatsRangeResponse } from '../../api/client';
import type { TimeRange } from '../../hooks/useFocusStats';

interface ThemeDistributionChartProps {
    pieStats: StatsRangeResponse | null;
    pieRange: TimeRange;
    onPieRangeChange: (range: TimeRange) => void;
    getChartColorForTheme: (themeName: string, index: number) => string;
    formatDuration: (minutes: number) => string;
    /** 嵌入到其他卡片内部时，去掉自身的外层卡片样式（背景、圆角、边框），只渲染内容 */
    inline?: boolean;
}

const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
        x: cx + r * Math.cos(angleRad),
        y: cy + r * Math.sin(angleRad),
    };
};

const describeDonutSlice = (
    cx: number,
    cy: number,
    rOuter: number,
    rInner: number,
    startAngle: number,
    endAngle: number,
): string => {
    const sweep = endAngle - startAngle;
    if (sweep <= 0) return '';
    if (sweep >= 360 - 0.0001) {
        const half = startAngle + 180;
        return [
            describeDonutSlice(cx, cy, rOuter, rInner, startAngle, half),
            describeDonutSlice(cx, cy, rOuter, rInner, half, endAngle),
        ].join(' ');
    }
    const largeArc = sweep > 180 ? 1 : 0;
    const outerStart = polarToCartesian(cx, cy, rOuter, startAngle);
    const outerEnd = polarToCartesian(cx, cy, rOuter, endAngle);
    const innerEnd = polarToCartesian(cx, cy, rInner, endAngle);
    const innerStart = polarToCartesian(cx, cy, rInner, startAngle);
    return [
        `M ${outerStart.x} ${outerStart.y}`,
        `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
        `L ${innerEnd.x} ${innerEnd.y}`,
        `A ${rInner} ${rInner} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
        'Z',
    ].join(' ');
};

export const ThemeDistributionChart: React.FC<ThemeDistributionChartProps> = ({
    pieStats,
    pieRange,
    onPieRangeChange,
    getChartColorForTheme,
    formatDuration,
    inline = false,
}) => {
    const { t } = useTranslation();

    // 从 sessions_details 计算每个主题的「专注次数」(session count)
    // 主题颜色依据 sessions_by_theme 中的索引保持一致
    const segments = useMemo(() => {
        const details = pieStats?.sessions_details || [];
        const minutesByTheme = pieStats?.sessions_by_theme || {};
        const countMap = new Map<string, number>();
        const minuteMap = new Map<string, number>();
        details.forEach(s => {
            countMap.set(s.theme_name, (countMap.get(s.theme_name) || 0) + 1);
            minuteMap.set(s.theme_name, (minuteMap.get(s.theme_name) || 0) + s.duration_minutes);
        });
        // 兜底：如果 details 为空但有 sessions_by_theme，用分钟数作为权重展示
        const entries = countMap.size > 0
            ? Array.from(countMap.entries())
            : Object.entries(minutesByTheme).filter(([, m]) => m > 0);

        const totalCount = entries.reduce((sum, [, c]) => sum + c, 0);
        let cumulative = 0;
        return entries.map(([theme, count], i) => {
            const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
            const startAngle = cumulative;
            const endAngle = cumulative + percentage * 3.6;
            cumulative = endAngle;
            return {
                theme,
                count,
                minutes: minuteMap.get(theme) ?? minutesByTheme[theme] ?? 0,
                percentage,
                startAngle,
                endAngle,
                color: getChartColorForTheme(theme, i),
            };
        });
    }, [pieStats, getChartColorForTheme]);

    const totalSessions = segments.reduce((sum, s) => sum + s.count, 0) || pieStats?.total_sessions || 0;

    // viewBox 留出更多 padding 防止边缘被裁剪；外径 40 + 中心 60 + 边距 20 = 120
    const cx = 60;
    const cy = 60;
    const rOuter = 40;
    const rInner = 26;

    const content = (
        <>
            <div className="flex items-center justify-between mb-4 md:mb-8 flex-shrink-0 gap-2">
                <h3 className="text-base md:text-xl font-bold text-theme-text flex items-center gap-2 min-w-0 truncate">
                    <PieChart size={18} className="text-theme-text-muted/40 shrink-0" />
                    <span className="truncate">{t('stats.themes', 'Themes')}</span>
                </h3>

                <div className="bg-white/50 p-1 rounded-lg md:rounded-2xl flex items-center border border-white/80 shadow-inner shrink-0">
                    {(['day', 'week', 'month'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => onPieRangeChange(range)}
                            className={`px-2 md:px-3 py-1 rounded-md md:rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${pieRange === range
                                ? 'bg-white text-cozy-orange shadow-md'
                                : 'text-cozy-text-light hover:text-cozy-text'
                                }`}
                        >
                            {t(`stats.ranges.${range}`, range)}
                        </button>
                    ))}
                </div>
            </div>

            {segments.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8 md:py-12 text-center">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-theme-surface/70 flex items-center justify-center shadow-inner">
                        <Activity size={22} className="text-theme-text-muted/50" strokeWidth={1.8} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-theme-text">
                            {t('stats.noData', '暂无数据记录')}
                        </p>
                        <p className="text-xs text-theme-text-muted/70">
                            {t('stats.noDataHint', '完成一次专注后，主题分布会显示在这里')}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-6 md:gap-8 flex-1">
                    <div className="relative w-44 h-44 md:w-56 md:h-56 flex-shrink-0">
                        <svg
                            viewBox="0 0 120 120"
                            className="w-full h-full"
                            style={{ overflow: 'visible' }}
                        >
                            {segments.map((seg, i) => (
                                <motion.path
                                    key={seg.theme}
                                    d={describeDonutSlice(cx, cy, rOuter, rInner, seg.startAngle, seg.endAngle)}
                                    fill={seg.color}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.35, delay: i * 0.06, ease: 'easeOut' }}
                                />
                            ))}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl md:text-4xl font-black text-theme-text tabular-nums">{totalSessions}</span>
                            <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-widest">
                                {t('stats.completed', '次专注')}
                            </span>
                        </div>
                    </div>

                    <div className="w-full space-y-3 md:space-y-4 pr-1">
                        {segments.map((seg, index) => (
                            <motion.div
                                key={seg.theme}
                                className="group"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + index * 0.08 }}
                            >
                                <div className="flex justify-between items-center mb-1.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                                        <span className="font-bold text-theme-text text-sm truncate" title={seg.theme}>
                                            {seg.theme}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-xs font-medium text-theme-text-muted/60 tabular-nums">
                                            {seg.count} {t('stats.sessions', '次')} · {formatDuration(seg.minutes)}
                                        </span>
                                        <span className="text-sm font-black w-[44px] text-right tabular-nums" style={{ color: seg.color }}>
                                            {seg.percentage.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-theme-surface/50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${seg.percentage}%` }}
                                        transition={{ duration: 1.2, delay: 0.7 + index * 0.08, ease: 'circOut' }}
                                        className="h-full rounded-full relative"
                                        style={{ backgroundColor: seg.color }}
                                    >
                                        <div className="absolute inset-0 bg-white/10" />
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

        </>
    );

    if (inline) {
        return (
            <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-theme-text-muted/10 flex flex-col">
                {content}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/70 backdrop-blur-2xl p-4 md:p-8 rounded-2xl md:rounded-[40px] border border-white/80 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] flex flex-col"
        >
            {content}
        </motion.div>
    );
};
