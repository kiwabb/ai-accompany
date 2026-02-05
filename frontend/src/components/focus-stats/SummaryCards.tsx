import React from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StatsRangeResponse } from '../../api/client';

interface SummaryCardsProps {
    stats: StatsRangeResponse | null;
    chartColors: string[];
    formatDuration: (minutes: number) => string;
    onViewDetailsClick: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
    stats,
    chartColors,
    formatDuration,
    onViewDetailsClick,
}) => {
    const { t } = useTranslation();

    const summaryItems = [
        {
            label: t('timer.totalFocusTime', 'Total Focus'),
            value: formatDuration(stats?.total_focus_minutes || 0),
            icon: <Clock size={20} />,
            color: chartColors[0],
            sub: `${stats?.total_focus_minutes || 0} ${t('timer.minutes', 'mins')}`
        },
        {
            label: t('timer.dailyAverage', 'Daily Average'),
            value: (() => {
                const totalMins = stats?.total_focus_minutes || 0;
                const focusedDays = stats?.daily_stats.filter(day => day.total_focus_minutes > 0).length || 1;
                const averageMins = Math.round(totalMins / focusedDays);
                return formatDuration(averageMins);
            })(),
            icon: <TrendingUp size={20} />,
            color: chartColors[1],
            sub: t('stats.perDay', 'per day')
        },
        {
            label: t('stats.totalSessions', 'Total Sessions'),
            value: stats?.total_sessions || 0,
            icon: <BarChart2 size={20} />,
            color: chartColors[2],
            sub: (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onViewDetailsClick}
                    className="mt-2 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-theme-surface text-theme-primary shadow-sm hover:shadow-md transition-all border border-theme-border"
                >
                    {t('stats.viewDetails', 'View Details')}
                </motion.button>
            )
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {summaryItems.map((item, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-theme-surface/80 backdrop-blur-xl p-6 rounded-[var(--radius-theme)] border border-theme-border shadow-sm hover:shadow-md transition-shadow"
                >
                    <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
                        style={{
                            backgroundColor: `${item.color}33`,
                            color: item.color
                        }}
                    >
                        {item.icon}
                    </div>
                    <div className="flex-grow flex flex-col justify-between items-start">
                        <div className="text-theme-text-muted text-xs font-bold uppercase tracking-wider mb-1">{item.label}</div>
                        <div className="text-3xl font-bold text-theme-text mb-1">{item.value}</div>
                        <div className="text-theme-text-muted/60 text-sm mt-auto">{item.sub}</div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
