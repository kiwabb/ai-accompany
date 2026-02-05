import React from 'react';
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
}

export const ThemeDistributionChart: React.FC<ThemeDistributionChartProps> = ({
    pieStats,
    pieRange,
    onPieRangeChange,
    getChartColorForTheme,
    formatDuration,
}) => {
    const { t } = useTranslation();

    // Pie Chart Helpers
    const themeEntries = Object.entries(pieStats?.sessions_by_theme || {});
    const totalMinutes = pieStats?.total_focus_minutes || 0;
    
    let currentPercentage = 0;
    const pieSegments = themeEntries.map(([theme, minutes]) => {
        const percentage = totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0;
        const start = currentPercentage;
        currentPercentage += percentage;
        return { theme, minutes, percentage, start };
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-theme-surface/80 backdrop-blur-xl p-8 rounded-[var(--radius-theme)] border border-white/10 shadow-sm flex flex-col"
        >
            <div className="flex items-center justify-between mb-8 flex-shrink-0">
                <h3 className="text-xl font-bold text-theme-text flex items-center gap-2">
                    <PieChart size={20} className="text-theme-text-muted/40" />
                    {t('stats.themes', 'Themes')}
                </h3>
                
                <div className="bg-theme-surface/50 p-1 rounded-xl flex items-center border border-theme-border">
                    {(['day', 'week', 'month'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => onPieRangeChange(range)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                                pieRange === range 
                                ? 'bg-theme-surface text-theme-primary shadow-sm' 
                                : 'text-theme-text-muted hover:text-theme-text'
                            }`}
                        >
                            {t(`stats.ranges.${range}`, range)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col items-center gap-8 flex-1 overflow-hidden">
                {/* SVG Pie Chart */}
                <div className="relative w-48 h-48 flex-shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {pieSegments.length > 0 ? pieSegments.map((seg, i) => {
                            const color = getChartColorForTheme(seg.theme, i);
                            const circumference = 251.32;
                            const offset = circumference - (seg.percentage / 100) * circumference;
                            // Adjust rotation so segments stack correctly
                            const rotation = (seg.start / 100) * 360;
                            
                            return (
                                <motion.circle
                                    key={i}
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    stroke={color}
                                    strokeWidth="12"
                                    strokeDasharray={`${circumference} ${circumference}`}
                                    strokeDashoffset={offset}
                                    initial={{ strokeDashoffset: circumference }}
                                    animate={{ strokeDashoffset: offset }}
                                    transition={{ duration: 1.5, delay: 0.8 + (i * 0.1), ease: "easeOut" }}
                                    transform={`rotate(${rotation} 50 50)`}
                                />
                            );
                        }) : (
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-border)" strokeWidth="12" />
                        )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-black text-theme-text">{pieStats?.total_sessions || 0}</span>
                        <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-widest">{t('stats.completed', 'Completed')}</span>
                    </div>
                </div>

                {/* Theme List / Breakdown - Scrollable if needed */}
                <div className="w-full space-y-4 overflow-y-auto pr-2 max-h-[200px] custom-scrollbar">
                    {pieSegments.map((seg, index) => {
                        const color = getChartColorForTheme(seg.theme, index);

                        return (
                            <motion.div 
                                key={seg.theme} 
                                className="group"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + (index * 0.1) }}
                            >
                                <div className="flex justify-between items-center mb-1.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                        <span className="font-bold text-theme-text text-sm truncate" title={seg.theme}>{seg.theme}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-xs font-medium text-theme-text-muted/60">{formatDuration(seg.minutes)}</span>
                                        <span className="text-sm font-black w-[36px] text-right" style={{ color: color }}>{Math.round(seg.percentage)}%</span>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-theme-surface/50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${seg.percentage}%` }}
                                        transition={{ duration: 1.2, delay: 0.9 + (index * 0.1), ease: "circOut" }}
                                        className="h-full rounded-full relative"
                                        style={{ backgroundColor: color }}
                                    >
                                        <div className="absolute inset-0 bg-white/10" />
                                    </motion.div>
                                </div>
                            </motion.div>
                        );
                    })}
                    
                    {pieSegments.length === 0 && (
                        <div className="text-center py-16 text-theme-text-muted/40 bg-theme-text/5 rounded-[radius-theme] border border-dashed border-theme-border">
                            <div className="w-16 h-16 bg-theme-surface rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <Activity size={24} className="opacity-20" />
                            </div>
                            <p className="text-sm font-bold uppercase tracking-widest">{t('stats.noData', 'No data collected')}</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
