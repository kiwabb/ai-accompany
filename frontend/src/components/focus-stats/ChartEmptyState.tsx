import React from 'react';
import { BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ChartEmptyState: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
            <div className="w-16 h-16 bg-theme-text/5 rounded-full flex items-center justify-center mb-3">
                <BarChart2 size={24} className="text-theme-text-muted/20" />
            </div>
            <p className="text-sm font-bold text-theme-text-muted/30 uppercase tracking-widest">
                {t('stats.noData', 'No activity')}
            </p>
        </div>
    );
};
