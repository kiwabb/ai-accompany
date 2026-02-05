import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const StatsHeader: React.FC = () => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-4"
        >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-theme-surface/50 text-theme-primary text-[10px] font-bold uppercase tracking-widest mb-4 border border-theme-border">
                <Activity size={12} strokeWidth={3} />
                {t('stats.weeklyReport', 'Weekly Report')}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-theme-text mb-2 font-heading">
                {t('stats.focusInsights', 'Focus Insights')}
            </h1>
            <p className="text-theme-text-muted">
                {t('stats.subtitle', 'Your learning journey over the last 7 days')}
            </p>
        </motion.div>
    );
};
