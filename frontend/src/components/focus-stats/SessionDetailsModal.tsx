import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StatsRangeResponse } from '../../api/client';

interface SessionDetailsModalProps {
    showDetails: boolean;
    onClose: () => void;
    stats: StatsRangeResponse | null;
    currentPage: number;
    onPageChange: (page: number) => void;
    getChartColorForTheme: (themeName: string, index: number) => string;
    formatDuration: (minutes: number) => string;
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
    showDetails,
    onClose,
    stats,
    currentPage,
    onPageChange,
    getChartColorForTheme,
    formatDuration,
}) => {
    const { t } = useTranslation();

    if (!showDetails) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-theme-surface rounded-[var(--radius-theme)] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-white/10"
                >
                    {/* Modal Header */}
                    <div className="p-6 flex items-center justify-between border-b border-theme-border flex-shrink-0">
                        <div>
                            <h2 className="text-xl font-bold text-theme-text">{t('stats.totalSessions', 'History of your focus sessions')}</h2>
                            <p className="text-sm text-theme-text-muted mt-1">{t('stats.reviewSessions', 'Review your past performance and find patterns.')}</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="p-2 rounded-full bg-theme-text/5 hover:bg-theme-text/10 text-theme-text-muted transition-colors"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </motion.button>
                    </div>

                    {/* Table Body */}
                    <div className="p-2 sm:p-4 md:p-6 overflow-y-auto flex-grow">
                        <div className="space-y-2">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-4 px-4 pb-2 text-[10px] font-bold text-theme-text-muted/40 uppercase tracking-wider">
                                <div className="col-span-5">{t('stats.theme', 'Theme')}</div>
                                <div className="col-span-3 text-right">{t('stats.duration', 'Duration')}</div>
                                <div className="col-span-4">{t('stats.time', 'Time')}</div>
                            </div>

                            {(() => {
                                if (!stats?.sessions_details || stats.sessions_details.length === 0) {
                                    return <p className="text-theme-text-muted/40 text-center py-12">{t('stats.noData', 'No session data available.')}</p>;
                                }

                                const ITEMS_PER_PAGE = 10;
                                // unused: const totalPages = Math.ceil(stats.sessions_details.length / ITEMS_PER_PAGE);
                                const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                                const endIndex = startIndex + ITEMS_PER_PAGE;
                                const paginatedSessions = stats.sessions_details.slice(startIndex, endIndex);

                                return (
                                    <>
                                        {paginatedSessions.map((session, index) => {
                                            const color = getChartColorForTheme(session.theme_name, index);

                                            return (
                                                <motion.div
                                                    key={startIndex + index}
                                                    className={`grid grid-cols-12 gap-4 items-center p-4 rounded-2xl ${index % 2 === 1 ? 'bg-theme-text/5' : 'bg-transparent'} hover:bg-theme-surface/80 transition-colors duration-200 border border-transparent`}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                >
                                                    {/* Theme */}
                                                    <div className="col-span-5 flex items-center gap-3">
                                                        <div className="w-2 h-8 rounded-full opacity-80" style={{ backgroundColor: color }}></div>
                                                        <div className="font-bold text-theme-text truncate" title={session.theme_name}>
                                                            {session.theme_name}
                                                        </div>
                                                    </div>

                                                    {/* Duration - COLORIZED and BOLD */}
                                                    <div className="col-span-3 text-right font-mono font-bold tabular-nums" style={{ color: color }}>
                                                        {formatDuration(session.duration_minutes)}
                                                    </div>

                                                    {/* Time Range */}
                                                    <div className="col-span-4 text-theme-text-muted text-sm">
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                                            <span className="font-medium">{new Date(session.start_time).toLocaleDateString()}</span>
                                                            <span className="text-xs text-theme-text-muted/40 tabular-nums">
                                                                {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Modal Footer (Pagination) */}
                    {stats && stats.sessions_details && stats.sessions_details.length > 10 && (
                        <div className="p-4 flex items-center justify-between border-t border-theme-border flex-shrink-0">
                            <motion.button
                                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="py-2 px-4 rounded-xl text-sm font-bold bg-theme-surface text-theme-text-muted hover:text-theme-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-theme-border"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {t('common.previous', 'Previous')}
                            </motion.button>
                            <span className="text-sm font-medium text-theme-text-muted/60 tabular-nums">
                                {t('common.page', 'Page {{currentPage}} of {{totalPages}}', {
                                    currentPage,
                                    totalPages: Math.ceil((stats?.sessions_details?.length || 0) / 10)
                                })}
                            </span>
                            <motion.button
                                onClick={() => onPageChange(Math.min(Math.ceil((stats?.sessions_details?.length || 0) / 10), currentPage + 1))}
                                disabled={currentPage === Math.ceil((stats?.sessions_details?.length || 0) / 10)}
                                className="py-2 px-4 rounded-xl text-sm font-bold bg-theme-surface text-theme-text-muted hover:text-theme-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-theme-border"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {t('common.next', 'Next')}
                            </motion.button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
