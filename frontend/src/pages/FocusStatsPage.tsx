import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import AmbientBackground from '../components/AmbientBackground';
import { formatDuration } from '../utils/date';
import { useChartTheme } from '../hooks/useChartTheme';
import { useTrendStats, usePieStats } from '../hooks/useFocusStats';
import type { TimeRange } from '../hooks/useFocusStats';
import { StatsHeader } from '../components/focus-stats/StatsHeader';
import { SummaryCards } from '../components/focus-stats/SummaryCards';
import { DailyTrendChart } from '../components/focus-stats/DailyTrendChart';
import { ThemeDistributionChart } from '../components/focus-stats/ThemeDistributionChart';
import { SessionDetailsModal } from '../components/focus-stats/SessionDetailsModal';
import type { DailyStat } from '../api/client';

const FocusStatsPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Hooks
    const { chartColors, getChartColorForTheme, activeVisualTheme } = useChartTheme();
    const [timeRange, setTimeRange] = useState<TimeRange>('week');
    const [pieRange, setPieRange] = useState<TimeRange>('day');
    
    const { stats, trendLoading, initialLoading } = useTrendStats(timeRange);
    const { pieStats } = usePieStats(pieRange);

    // Local State
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Effects
    useEffect(() => {
        if (timeRange === 'month' && scrollContainerRef.current) {
            setTimeout(() => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
                }
            }, 100);
        }
    }, [timeRange, stats]);

    // Helpers
    const formatDurationWithT = (minutes: number) => formatDuration(minutes, t);

    const maxDailyMinutes = stats?.daily_stats.reduce((max: number, day: DailyStat) => Math.max(max, day.total_focus_minutes), 0) || 1;

    return (
        <main className="min-h-screen w-full bg-theme-bg flex flex-col items-center p-6 relative overflow-hidden">
            <AmbientBackground />

            {/* Back Button */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/')}
                className="fixed top-8 left-8 py-3 px-6 bg-theme-surface/60 backdrop-blur-2xl border border-theme-border shadow-xl rounded-2xl flex items-center gap-2 group z-50 text-theme-text-muted hover:text-theme-text transition-colors font-bold uppercase tracking-widest text-[10px]"
            >
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span>{t('common.back', 'Back')}</span>
            </motion.button>

            <div className="relative z-10 w-full max-w-5xl flex flex-col gap-8 py-12">
                
                <StatsHeader />

                {initialLoading ? (
                    <div className="w-full h-64 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
                    </div>
                ) : (
                    <>
                        <SummaryCards 
                            stats={stats} 
                            chartColors={chartColors}
                            formatDuration={formatDurationWithT}
                            onViewDetailsClick={() => setShowDetails(true)}
                        />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <DailyTrendChart 
                                stats={stats}
                                pieStats={pieStats}
                                trendLoading={trendLoading}
                                timeRange={timeRange}
                                onTimeRangeChange={setTimeRange}
                                scrollContainerRef={scrollContainerRef}
                                maxDailyMinutes={maxDailyMinutes}
                                getChartColorForTheme={getChartColorForTheme}
                                formatDuration={formatDurationWithT}
                                activeVisualTheme={activeVisualTheme}
                            />

                            <ThemeDistributionChart 
                                pieStats={pieStats}
                                pieRange={pieRange}
                                onPieRangeChange={setPieRange}
                                getChartColorForTheme={getChartColorForTheme}
                                formatDuration={formatDurationWithT}
                            />
                        </div>
                    </>
                )}
            </div>

            <SessionDetailsModal 
                showDetails={showDetails}
                onClose={() => {
                    setShowDetails(false);
                    setCurrentPage(1);
                }}
                stats={stats}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                getChartColorForTheme={getChartColorForTheme}
                formatDuration={formatDurationWithT}
            />
        </main>
    );
};

export default FocusStatsPage;
