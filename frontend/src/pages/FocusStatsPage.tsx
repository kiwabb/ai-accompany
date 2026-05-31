import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import AmbientBackground from '../components/AmbientBackground';
import { formatDuration } from '../utils/date';
import { useChartTheme } from '../hooks/useChartTheme';
import { useTrendStats, usePieStats, useHeatmapStats } from '../hooks/useFocusStats';
import type { TimeRange } from '../hooks/useFocusStats';
import { StatsHeader } from '../components/focus-stats/StatsHeader';
import { SummaryCards } from '../components/focus-stats/SummaryCards';
import { DailyTrendChart } from '../components/focus-stats/DailyTrendChart';
import { ThemeDistributionChart } from '../components/focus-stats/ThemeDistributionChart';
import { StudyHeatmap } from '../components/focus-stats/StudyHeatmap';
import { SessionDetailsModal } from '../components/focus-stats/SessionDetailsModal';
import type { DailyStat } from '../api/client';

const FocusStatsPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const highlightDate = searchParams.get('date') || undefined;

    // Hooks
    const { chartColors, getChartColorForTheme, activeVisualTheme } = useChartTheme();
    // 来自 ?date=YYYY-MM-DD 时默认切到 month 视图，便于在趋势图里看到该日
    const [timeRange, setTimeRange] = useState<TimeRange>(highlightDate ? 'month' : 'week');
    const [pieRange, setPieRange] = useState<TimeRange>('day');
    
    const { stats, trendLoading, initialLoading } = useTrendStats(timeRange);
    const { pieStats } = usePieStats(pieRange);
    const { heatmapStats } = useHeatmapStats();

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

    const maxDailyMinutes = stats?.daily_stats?.reduce((max: number, day: DailyStat) => Math.max(max, day.total_focus_minutes), 0) || 1;

    return (
        <div className="min-h-screen w-full bg-[#FCFAF7] flex flex-col items-center pb-32 selection:bg-cozy-orange/30 relative overflow-x-hidden">
            <AmbientBackground />

            {/* 移动端：紧凑顶栏 */}
            <div className="md:hidden sticky top-0 z-[100] w-full bg-white/60 backdrop-blur-2xl border-b border-white/10 shadow-sm py-3 px-3 mb-6">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <motion.button
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-cozy-text-light hover:text-cozy-text transition-colors font-bold uppercase tracking-widest text-[10px]"
                    >
                        <ChevronLeft size={16} />
                    </motion.button>

                    <h1 className="text-base font-extrabold text-cozy-text uppercase tracking-wider font-heading flex items-center gap-2">
                        {t('stats.focusInsights', 'Focus Insights')}
                    </h1>

                    <div className="w-6" />
                </div>
            </div>

            {/* 桌面端：浮动卡片式返回按钮 */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/')}
                className="hidden md:flex fixed top-8 left-8 py-3 px-6 bg-white/70 backdrop-blur-2xl border border-white/80 shadow-xl rounded-2xl items-center gap-2 group z-50 text-cozy-text-light hover:text-cozy-text transition-colors font-bold uppercase tracking-widest text-[10px]"
            >
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span>{t('common.back', 'Back')}</span>
            </motion.button>

            <main className="relative z-10 w-full max-w-5xl px-4 md:px-8 flex flex-col gap-6 md:gap-8 py-4 md:py-12">
                
                <StatsHeader />

                {initialLoading ? (
                    <div className="w-full h-64 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cozy-orange"></div>
                    </div>
                ) : (
                    <>
                        <SummaryCards
                            stats={stats}
                            chartColors={chartColors}
                            formatDuration={formatDurationWithT}
                            onViewDetailsClick={() => setShowDetails(true)}
                        />

                        <StudyHeatmap
                            stats={heatmapStats}
                            formatDuration={formatDurationWithT}
                        />

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
                            highlightDate={highlightDate}
                            footer={
                                <ThemeDistributionChart
                                    inline
                                    pieStats={pieStats}
                                    pieRange={pieRange}
                                    onPieRangeChange={setPieRange}
                                    getChartColorForTheme={getChartColorForTheme}
                                    formatDuration={formatDurationWithT}
                                />
                            }
                        />
                    </>
                )}
            </main>

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
        </div>
    );
};

export default FocusStatsPage;
