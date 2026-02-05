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
                    className="bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-white/80 overflow-hidden"
                >
                    {/* Modal Header */}
                    <div className="p-8 flex items-center justify-between border-b border-black/5 flex-shrink-0">
                        <div>
                            <h2 className="text-2xl font-black text-cozy-text tracking-tight">{t('stats.totalSessions', 'History of your focus sessions')}</h2>
                            <p className="text-sm text-cozy-text-light font-medium mt-1">{t('stats.reviewSessions', 'Review your past performance and find patterns.')}</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="p-3 rounded-2xl bg-slate-100 text-slate-400 hover:text-cozy-text hover:bg-slate-200 transition-colors"
                        >
                            <X size={20} strokeWidth={3} />
                        </motion.button>
                    </div>

                    {/* Table Body */}
                    <div className="p-4 sm:p-8 overflow-y-auto flex-grow custom-scrollbar">
                        <div className="space-y-3">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 pb-2 text-[10px] font-black text-cozy-text-light/30 uppercase tracking-[0.2em]">
                                <div className="col-span-5">{t('stats.theme', 'Theme')}</div>
                                <div className="col-span-3 text-right">{t('stats.duration', 'Duration')}</div>
                                <div className="col-span-4 pl-4">{t('stats.time', 'Time')}</div>
                            </div>

                            {(() => {
                                if (!stats?.sessions_details || stats.sessions_details.length === 0) {
                                    return (
                                        <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                                            <p className="text-cozy-text-light/40 font-bold uppercase tracking-widest text-xs">{t('stats.noData', 'No session data available.')}</p>
                                        </div>
                                    );
                                }

                                const ITEMS_PER_PAGE = 10;
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
                                                    className={`grid grid-cols-12 gap-4 items-center p-5 rounded-3xl ${index % 2 === 1 ? 'bg-slate-50/50' : 'bg-transparent'} hover:bg-white hover:shadow-xl hover:scale-[1.01] transition-all duration-300 border border-transparent hover:border-white/80 group`}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                >
                                                    {/* Theme */}
                                                    <div className="col-span-5 flex items-center gap-4">
                                                        <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: color }}></div>
                                                        <div className="font-black text-cozy-text truncate text-base" title={session.theme_name}>
                                                            {session.theme_name}
                                                        </div>
                                                    </div>

                                                    <div className="col-span-3 text-right font-mono font-black tabular-nums text-lg" style={{ color: color }}>
                                                        {formatDuration(session.duration_minutes)}
                                                    </div>

                                                    {/* Time Range */}
                                                    <div className="col-span-4 pl-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-cozy-text text-sm">{new Date(session.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                            <span className="text-[10px] font-bold text-cozy-text-light/50 tabular-nums uppercase tracking-tighter">
                                                                {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
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
                        <div className="p-6 bg-slate-50/80 backdrop-blur-md flex items-center justify-between border-t border-black/5 flex-shrink-0">
                            <motion.button
                                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="py-2.5 px-6 rounded-2xl text-xs font-black uppercase tracking-widest bg-white text-cozy-text-light hover:text-cozy-orange disabled:opacity-30 disabled:grayscale transition-all shadow-sm border border-white/80"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {t('common.previous', 'Prev')}
                            </motion.button>
                            <span className="text-[10px] font-black text-cozy-text-light/40 uppercase tracking-[0.2em] tabular-nums">
                                {t('common.page', 'Page {{currentPage}} / {{totalPages}}', {
                                    currentPage,
                                    totalPages: Math.ceil((stats?.sessions_details?.length || 0) / 10)
                                })}
                            </span>
                            <motion.button
                                onClick={() => onPageChange(Math.min(Math.ceil((stats?.sessions_details?.length || 0) / 10), currentPage + 1))}
                                disabled={currentPage === Math.ceil((stats?.sessions_details?.length || 0) / 10)}
                                className="py-2.5 px-6 rounded-2xl text-xs font-black uppercase tracking-widest bg-white text-cozy-text-light hover:text-cozy-orange disabled:opacity-30 disabled:grayscale transition-all shadow-sm border border-white/80"
                                whileHover={{ scale: 1.05, y: -2 }}
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
