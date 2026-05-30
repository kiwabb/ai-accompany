import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTimerContext } from '../contexts/TimerContext';
import PomodoroTimer from '../components/PomodoroTimer';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft as ChevronLeftIcon, BookOpen as BookOpenIcon, Calendar, X } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { useTranslation } from 'react-i18next';
import AmbientBackground from '../components/AmbientBackground';
import { useVisualTheme } from '../hooks/useVisualTheme';
import TodoWidget from '../components/TodoWidget';
import CountdownWidget from '../components/CountdownWidget';

const TimerPage: React.FC = () => {
    const { themeId } = useParams<{ themeId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { handleThemeChange, state, isActive, timeLeft, totalTimeValue, reset, activeTheme } = useTimerContext();

    const { isShinchanTheme } = useVisualTheme({
        activeVisualThemeId: state.activeVisualThemeId,
    });

    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
    const [pendingThemeId, setPendingThemeId] = React.useState<string | null>(null);
    const lastHandledThemeIdRef = React.useRef<string | null>(null);
    const [countdownOpen, setCountdownOpen] = useState(false);
    const countdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!countdownOpen) return;
        const handler = (e: MouseEvent) => {
            if (countdownRef.current && !countdownRef.current.contains(e.target as Node)) {
                setCountdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [countdownOpen]);

    const isOngoing = isActive || (timeLeft > 0 && timeLeft < totalTimeValue);

    useEffect(() => {
        if (!themeId) return;
        if (state.activeThemeId === themeId) {
            lastHandledThemeIdRef.current = themeId;
            return;
        }

        if (isOngoing) {
            if (pendingThemeId === themeId && isConfirmOpen) return;
            queueMicrotask(() => {
                setPendingThemeId(themeId);
                setIsConfirmOpen(true);
            });
            return;
        }

        if (lastHandledThemeIdRef.current === themeId) return;
        lastHandledThemeIdRef.current = themeId;
        handleThemeChange(themeId);
    }, [themeId, state.activeThemeId, handleThemeChange, isOngoing, pendingThemeId, isConfirmOpen]);

    const handleConfirm = () => {
        if (pendingThemeId) {
            reset();
            handleThemeChange(pendingThemeId);
        }
        setIsConfirmOpen(false);
        setPendingThemeId(null);
    };

    const handleCancel = () => {
        setIsConfirmOpen(false);
        setPendingThemeId(null);
        navigate(-1);
    };


    return (
        <main className="min-h-screen w-full bg-[#FCFAF7] flex flex-col items-center justify-start p-6 relative overflow-hidden"> {/* Changed justify-center to justify-start for better vertical space */}
            <AmbientBackground />

            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/')}
                className={`fixed top-3 left-3 md:top-8 md:left-8 py-2 px-3 md:py-3 md:px-6 bg-white/60 backdrop-blur-2xl shadow-xl rounded-2xl flex items-center gap-2 group z-50 transition-colors font-bold uppercase tracking-widest text-[10px] ${isShinchanTheme
                        ? 'border border-[#FF6B6B]/20 text-[#8D6E63] hover:text-[#5D4037] hover:bg-[#FF6B6B]/10'
                        : 'border border-white text-slate-400 hover:text-slate-900'
                    }`}
            >
                <ChevronLeftIcon size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="hidden md:inline">返回列表</span>
            </motion.button>

            <div className="fixed top-3 right-3 md:top-8 md:right-8 z-50 flex flex-wrap items-center justify-end gap-2 md:gap-3 max-w-[70vw] md:max-w-none">
                {/* Countdown toggle */}
                <div ref={countdownRef} className="relative">
                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setCountdownOpen(prev => !prev)}
                        className={`py-2 px-3 md:py-3 md:px-5 bg-white/60 backdrop-blur-2xl shadow-xl rounded-2xl flex items-center gap-2 group transition-colors font-bold uppercase tracking-widest text-[10px] ${isShinchanTheme
                                ? 'border border-[#FF6B6B]/20 text-[#8D6E63] hover:text-[#5D4037] hover:bg-[#FF6B6B]/10'
                                : 'border border-white text-slate-400 hover:text-slate-900'
                            }`}
                        aria-label={t('countdown.title', '倒数日')}
                    >
                        <Calendar size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="hidden md:inline">{t('countdown.title', '倒数日')}</span>
                    </motion.button>

                    <AnimatePresence>
                        {countdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute top-full right-0 mt-3 w-[min(320px,90vw)] bg-white/90 backdrop-blur-2xl rounded-3xl border border-white shadow-[0_20px_50px_-10px_rgba(0,0,0,0.18)] p-4"
                            >
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                        {t('countdown.title', '倒数日')}
                                    </h3>
                                    <button
                                        onClick={() => setCountdownOpen(false)}
                                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <CountdownWidget />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <TodoWidget isShinchanTheme={isShinchanTheme} />
                {activeTheme && (
                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/library?theme=${activeTheme.id}`)}
                        className={`py-2 px-3 md:py-3 md:px-6 bg-white/60 backdrop-blur-2xl shadow-xl rounded-2xl flex items-center gap-2 group transition-colors font-bold uppercase tracking-widest text-[10px] ${isShinchanTheme
                                ? 'border border-[#FF6B6B]/20 text-[#8D6E63] hover:text-[#5D4037] hover:bg-[#FF6B6B]/10'
                                : 'border border-white text-slate-400 hover:text-slate-900'
                            }`}
                    >
                        <BookOpenIcon size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="hidden md:inline">
                            {t('common.themeLibrary', {
                                theme: t(`themes.${activeTheme.id}`, { defaultValue: activeTheme.name }),
                                defaultValue: `{{theme}} ${t('common.library', '书架')}`,
                            })}
                        </span>
                    </motion.button>
                )}
            </div>

            <div className="relative z-10 w-full max-w-6xl flex items-center justify-center py-12">
                <PomodoroTimer />
            </div>

            <ConfirmModal
                isOpen={isConfirmOpen}
                title={t('common.confirm', '确认切换')}
                message={t('timer.switchConfirmSimple', '您当前有正在进行的专注任务。确定要停止并切换到新主题吗？')}
                confirmLabel={t('common.confirmSwitch', '确认切换')}
                cancelLabel={t('common.cancel', '继续专注')}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                type="warning"
            />
        </main>
    );
};


export default TimerPage;
