import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTimerContext } from '../contexts/TimerContext';
import { Book as BookIcon, Rocket as RocketIcon, Brain as BrainIcon, Coffee as CoffeeIcon, Sparkles as SparklesIcon, CheckCircle2 } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { getStatsRange } from '../api/client';
import type { FocusTheme } from '../types/pomodoro';

import ConfirmModal from '../components/ConfirmModal';
import AmbientBackground from '../components/AmbientBackground';

const FocusListPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { state, isActive, timeLeft, totalTimeValue, reset } = useTimerContext();
    const { themes } = state;

    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
    const [pendingThemeId, setPendingThemeId] = React.useState<string | null>(null);
    const [confirmMessage, setConfirmMessage] = React.useState('');

    const [menuState, setMenuState] = React.useState<{ theme: FocusTheme; x: number; y: number } | null>(null);
    const [completion, setCompletion] = React.useState<{ themeName: string; minutes: number } | null>(null);
    const longPressTimer = React.useRef<number | null>(null);

    const openMenuAt = (theme: FocusTheme, x: number, y: number) => {
        const pad = 12;
        const w = 180;
        const h = 80;
        const clampedX = Math.min(window.innerWidth - w - pad, Math.max(pad, x));
        const clampedY = Math.min(window.innerHeight - h - pad, Math.max(pad, y));
        setMenuState({ theme, x: clampedX, y: clampedY });
    };

    const handleContextMenu = (e: React.MouseEvent, theme: FocusTheme) => {
        e.preventDefault();
        openMenuAt(theme, e.clientX, e.clientY);
    };

    const handleTouchStart = (e: React.TouchEvent, theme: FocusTheme) => {
        const touch = e.touches[0];
        if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
        longPressTimer.current = window.setTimeout(() => {
            openMenuAt(theme, touch.clientX, touch.clientY);
            longPressTimer.current = null;
        }, 500);
    };

    const cancelLongPress = () => {
        if (longPressTimer.current) {
            window.clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleComplete = async () => {
        if (!menuState) return;
        const theme = menuState.theme;
        setMenuState(null);
        try {
            const startDate = new Date('2020-01-01');
            const endDate = new Date();
            const stats = await getStatsRange(startDate, endDate);
            const minutes = stats.sessions_by_theme?.[theme.name] || 0;
            setCompletion({ themeName: theme.name, minutes });
        } catch {
            setCompletion({ themeName: theme.name, minutes: 0 });
        }
    };

    React.useEffect(() => {
        if (!menuState) return;
        const close = () => setMenuState(null);
        window.addEventListener('click', close);
        window.addEventListener('scroll', close);
        return () => {
            window.removeEventListener('click', close);
            window.removeEventListener('scroll', close);
        };
    }, [menuState]);

    const isChiikawaTheme = state.activeVisualThemeId === 'chiikawa';
    const isShinchanTheme = state.activeVisualThemeId === 'shinchan';
    const useDefaultIcon = state.settings.useDefaultThemeIcon !== false;

    const getIcon = (theme: any) => {
        const id = theme.id;
        const iconType = theme.iconType;

        if (isChiikawaTheme) {
            const effectiveIcon = useDefaultIcon ? id : (iconType || id);
            switch (effectiveIcon) {
                case 'english':
                case 'hachiware': return <img src="/assets/chiikawa/sticker-1.png" alt="Hachiware" className="w-10 h-10 object-contain" />;
                case '408':
                case 'chiikawa': return <img src="/assets/chiikawa/sticker-0.png" alt="Chiikawa" className="w-10 h-10 object-contain" />;
                case 'math':
                case 'usagi': return <img src="/assets/chiikawa/sticker-2.png" alt="Usagi" className="w-10 h-10 object-contain" />;
                case 'momonga': return <img src="/assets/chiikawa/sticker-5.png" alt="Momonga" className="w-10 h-10 object-contain" />;
                case 'kurimanju': return <img src="/assets/chiikawa/sticker-10.png" alt="Kurimanju" className="w-10 h-10 object-contain" />;
                case 'shisa': return <img src="/assets/chiikawa/sticker-6.png" alt="Shisa" className="w-10 h-10 object-contain" />;
                case 'rakko': return <img src="/assets/chiikawa/sticker-11.png" alt="Rakko" className="w-10 h-10 object-contain" />;
                default: return <img src="/assets/chiikawa/sticker-3.png" alt="Chiikawa" className="w-10 h-10 object-contain" />;
            }
        }

        if (isShinchanTheme) {
            const effectiveIcon = useDefaultIcon ? id : (iconType || id);
            switch (effectiveIcon) {
                case 'english':
                case 'kazama': return <img src="/assets/shinchan/kazama.png" alt="Kazama" className="w-10 h-10 object-contain" />;
                case '408':
                case 'shinchan': return <img src="/assets/shinchan/shinchan.png" alt="Shinchan" className="w-10 h-10 object-contain" />;
                case 'math':
                case 'bo-chan': return <img src="/assets/shinchan/bo-chan.png" alt="Bo-chan" className="w-10 h-10 object-contain" />;
                case 'masao': return <img src="/assets/shinchan/masao.png" alt="Masao" className="w-10 h-10 object-contain" />;
                case 'nene': return <img src="/assets/shinchan/nene.png" alt="Nene" className="w-10 h-10 object-contain" />;
                case 'shiro': return <img src="/assets/shinchan/shiro-animated.gif" alt="Shiro" className="w-10 h-10 object-contain" />;
                case 'action-mask': return <img src="/assets/shinchan/action-mask.png" alt="Action Mask" className="w-10 h-10 object-contain" />;
                default: return <img src="/assets/shinchan/shinchan.png" alt="Shinchan" className="w-10 h-10 object-contain" />;
            }
        }

        const effectiveIcon = useDefaultIcon ? id : (iconType || id);
        switch (effectiveIcon) {
            case 'english': return <BrainIcon size={28} />;
            case '408': return <RocketIcon size={28} />;
            case 'math': return <BookIcon size={28} />;
            case 'study': return <BookIcon size={28} />;
            case 'work': return <RocketIcon size={28} />;
            case 'rest': return <CoffeeIcon size={28} />;
            default: return <CoffeeIcon size={28} />;
        }
    };

    const getCardTheme = (id: string) => {
        if (isChiikawaTheme) {
            switch (id) {
                case 'english': return {
                    bg: 'bg-[#B8E6F0]/10 chiikawa-card-bg-blue',
                    border: 'border-[#B8E6F0]/30',
                    glow: 'group-hover:shadow-[0_0_40px_rgba(184,230,240,0.3)]',
                    icon: 'text-[#5D4037] bg-[#B8E6F0]/30',
                    grad: 'from-[#B8E6F0]/30 via-[#B8E6F0]/10 to-transparent',
                    pattern: 'chiikawa-card-bg-blue'
                };
                case '408': return {
                    bg: 'bg-[#FFB5C5]/10 chiikawa-card-bg',
                    border: 'border-[#FFB5C5]/30',
                    glow: 'group-hover:shadow-[0_0_40px_rgba(255,181,197,0.3)]',
                    icon: 'text-[#5D4037] bg-[#FFB5C5]/30',
                    grad: 'from-[#FFB5C5]/30 via-[#FFB5C5]/10 to-transparent',
                    pattern: 'chiikawa-card-bg'
                };
                case 'math': return {
                    bg: 'bg-[#FFFACD]/10 chiikawa-card-bg-yellow',
                    border: 'border-[#FFFACD]/30',
                    glow: 'group-hover:shadow-[0_0_40px_rgba(255,250,205,0.3)]',
                    icon: 'text-[#5D4037] bg-[#FFFACD]/30',
                    grad: 'from-[#FFFACD]/30 via-[#FFFACD]/10 to-transparent',
                    pattern: 'chiikawa-card-bg-yellow'
                };
                default: return {
                    bg: 'bg-[#FFB5C5]/10 chiikawa-card-bg',
                    border: 'border-[#FFB5C5]/30',
                    glow: 'group-hover:shadow-[0_0_40px_rgba(255,181,197,0.3)]',
                    icon: 'text-[#5D4037] bg-[#FFB5C5]/30',
                    grad: 'from-[#FFB5C5]/30 via-[#FFB5C5]/10 to-transparent',
                    pattern: 'chiikawa-card-bg'
                };
            }
        }

        if (isShinchanTheme) {
            switch (id) {
                case 'english': return {
                    bg: `bg-[#40C4FF]/10`,
                    border: 'border-transparent',
                    glow: 'group-hover:shadow-[0_8px_30px_rgba(64,196,255,0.2),_0_4px_12px_rgba(64,196,255,0.1)] group-hover:border-[#40C4FF]/20',
                    icon: 'text-[#0277BD] bg-[#40C4FF]/20',
                    grad: 'from-[#40C4FF]/20 via-[#40C4FF]/5 to-transparent',
                    pattern: ''
                };
                case '408': return {
                    bg: `bg-[#FF6B6B]/10`,
                    border: 'border-transparent',
                    glow: 'group-hover:shadow-[0_8px_30px_rgba(255,107,107,0.2),_0_4px_12px_rgba(255,107,107,0.1)] group-hover:border-[#FF6B6B]/20',
                    icon: 'text-[#C62828] bg-[#FF6B6B]/20',
                    grad: 'from-[#FF6B6B]/20 via-[#FF6B6B]/5 to-transparent',
                    pattern: ''
                };
                case 'math': return {
                    bg: `bg-[#FDD835]/10`,
                    border: 'border-transparent',
                    glow: 'group-hover:shadow-[0_8px_30px_rgba(253,216,53,0.2),_0_4px_12px_rgba(253,216,53,0.1)] group-hover:border-[#FDD835]/20',
                    icon: 'text-[#F57F17] bg-[#FDD835]/20',
                    grad: 'from-[#FDD835]/20 via-[#FDD835]/5 to-transparent',
                    pattern: ''
                };
                default: return {
                    bg: `bg-[#AED581]/10`,
                    border: 'border-transparent',
                    glow: 'group-hover:shadow-[0_8px_30px_rgba(174,213,129,0.2),_0_4px_12px_rgba(174,213,129,0.1)] group-hover:border-[#AED581]/20',
                    icon: 'text-[#558B2F] bg-[#AED581]/20',
                    grad: 'from-[#AED581]/20 via-[#AED581]/5 to-transparent',
                    pattern: ''
                };
            }
        }
        switch (id) {
            case 'english': return {
                bg: 'bg-indigo-500/10',
                border: 'border-indigo-500/20',
                glow: 'group-hover:shadow-[0_0_40px_rgba(99,102,241,0.2)]',
                icon: 'text-indigo-500 bg-indigo-50/50',
                grad: 'from-indigo-500/20 via-blue-500/10 to-transparent'
            };
            case '408': return {
                bg: 'bg-orange-500/10',
                border: 'border-orange-500/20',
                glow: 'group-hover:shadow-[0_0_40px_rgba(249,115,22,0.2)]',
                icon: 'text-orange-500 bg-orange-50/50',
                grad: 'from-orange-500/20 via-red-500/10 to-transparent'
            };
            case 'math': return {
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/20',
                glow: 'group-hover:shadow-[0_0_40px_rgba(16,185,129,0.2)]',
                icon: 'text-emerald-500 bg-emerald-50/50',
                grad: 'from-emerald-500/20 via-teal-500/10 to-transparent'
            };
            default: return {
                bg: 'bg-purple-500/10',
                border: 'border-purple-500/20',
                glow: 'group-hover:shadow-[0_0_40px_rgba(168,85,247,0.2)]',
                icon: 'text-purple-500 bg-purple-50/50',
                grad: 'from-purple-500/20 via-pink-500/10 to-transparent'
            };
        }
    };

    const handleThemeSelect = (themeId: string) => {
        const isOngoing = isActive || (timeLeft > 0 && timeLeft < totalTimeValue);

        if (isOngoing && state.activeThemeId !== themeId) {
            const currentThemeName = themes.find(t => t.id === state.activeThemeId)?.name || t('timer.focus');
            const targetThemeName = themes.find(t => t.id === themeId)?.name || '';
            setPendingThemeId(themeId);
            setConfirmMessage(
                t('timer.switchConfirm', {
                    defaultValue: `您正在进行 "${currentThemeName}" 的专注任务。确定要停止并切换到 "${targetThemeName}" 吗？`,
                    current: currentThemeName,
                    target: targetThemeName
                })
            );
            setIsConfirmOpen(true);
            return;
        }
        navigate(`/timer/${themeId}`);
    };

    const confirmSwitch = () => {
        if (pendingThemeId) {
            reset();
            navigate(`/timer/${pendingThemeId}`);
        }
        setIsConfirmOpen(false);
        setPendingThemeId(null);
        setConfirmMessage('');
    };

    const cancelSwitch = () => {
        setIsConfirmOpen(false);
        setPendingThemeId(null);
        setConfirmMessage('');
    };

    return (
        <main className="min-h-screen w-full bg-[#FCFAF7] flex flex-col items-center md:justify-center p-3 pt-8 md:p-6 pb-28 md:pb-36 selection:bg-cozy-orange/30 relative overflow-hidden">
            <AmbientBackground />

            <div className="relative z-10 w-full max-w-[1100px] flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center mb-6 md:mb-20"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="inline-flex items-center gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-cozy-orange/10 text-cozy-orange text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-6 border border-cozy-orange/20"
                    >
                        <SparklesIcon size={12} strokeWidth={3} />
                        {t('timer.focusCompanion')}
                    </motion.div>

                    <h1 className="text-4xl md:text-8xl font-bold tracking-normal text-slate-900 mb-3 md:mb-8 font-heading leading-tight">
                        {t('timer.studyBuddy')}
                    </h1>
                    <p className="hidden md:block text-slate-500 text-lg font-medium max-w-lg mx-auto leading-relaxed">
                        开启沉浸式学习体验，选择一个您想要深入探索的领域
                    </p>
                </motion.div>


                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-10 w-full px-1 md:px-4">
                    {themes.map((theme, index) => {
                        const style = getCardTheme(theme.id);
                        return (
                            <motion.button
                                key={theme.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleThemeSelect(theme.id)}
                                onContextMenu={(e) => handleContextMenu(e, theme)}
                                onTouchStart={(e) => handleTouchStart(e, theme)}
                                onTouchEnd={cancelLongPress}
                                onTouchMove={cancelLongPress}
                                onTouchCancel={cancelLongPress}
                                className={`
                                    group relative flex flex-col items-center p-4 md:p-12
                                    rounded-2xl md:rounded-[64px] bg-white/70 backdrop-blur-2xl
                                    border ${style.border} shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)]
                                    transition-all duration-500 overflow-hidden cursor-pointer
                                    hover:bg-white/90 ${style.glow}
                                `}
                            >
                                {isChiikawaTheme && (
                                    <div className={`absolute inset-0 pointer-events-none opacity-40 ${style.bg.split(' ').pop()}`} />
                                )}

                                {isShinchanTheme && style.pattern && (
                                    <div className={`absolute inset-0 pointer-events-none ${style.pattern}`} />
                                )}

                                {/* Inner Gradient Glow - Desktop Only */}
                                <div className={`hidden md:block absolute inset-0 bg-gradient-to-br ${style.grad} translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-out opacity-40`} />

                                {isChiikawaTheme && (
                                    <div className="absolute bottom-[-20px] right-[-20px] opacity-[0.08] pointer-events-none group-hover:opacity-15 group-hover:scale-110 transition-all duration-700">
                                        <div className="scale-[4] rotate-[-15deg]">
                                            {getIcon(theme)}
                                        </div>
                                    </div>
                                )}

                                {isShinchanTheme && (
                                    <div className="absolute bottom-[-10px] right-[-10px] opacity-[0.08] pointer-events-none group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
                                        <div className="scale-[4]">
                                            {getIcon(theme)}
                                        </div>
                                    </div>
                                )}

                                {/* Icon Wrapper - Animation on hover only */}
                                <motion.div
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    className={`relative z-10 p-3 md:p-8 rounded-xl md:rounded-[40px] ${style.icon} flex-shrink-0 mb-3 md:mb-10 shadow-inner border border-white/60 transition-all duration-300`}
                                >
                                    {getIcon(theme)}
                                </motion.div>

                                <div className="relative z-10 text-center flex-grow w-full min-w-0">
                                    <h3 className="text-sm md:text-3xl font-bold text-slate-800 mb-2 md:mb-4 group-hover:text-black transition-colors truncate">{theme.name}</h3>
                                    <div className="inline-flex items-center gap-1.5 md:gap-2.5 px-2.5 md:px-6 py-1 md:py-2.5 rounded-full bg-white/50 border border-white/80 shadow-sm backdrop-blur-md">
                                        <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${style.icon.split(' ')[0]} animate-pulse`} />
                                        <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-slate-500">
                                            {theme.focusDuration} {t('timer.minutes')}
                                        </span>
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                <BottomNav />
            </div>

            <ConfirmModal
                isOpen={isConfirmOpen}
                title={t('common.confirm', '确认切换')}
                message={confirmMessage}
                confirmLabel={t('common.confirmSwitch', '确认切换')}
                cancelLabel={t('common.cancel', '继续专注')}
                onConfirm={confirmSwitch}
                onCancel={cancelSwitch}
                type="warning"
            />

            <AnimatePresence>
                {menuState && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.92 }}
                        transition={{ duration: 0.12 }}
                        style={{ position: 'fixed', left: menuState.x, top: menuState.y, zIndex: 1000 }}
                        className="bg-white rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)] border border-slate-100 p-2 min-w-[180px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleComplete}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors font-bold text-sm"
                        >
                            <CheckCircle2 size={18} className="text-emerald-500" />
                            <span>{t('common.complete', '完成')}</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {completion && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setCompletion(null)}
                        className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/40 p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.7, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.85, y: 20 }}
                            transition={{ type: 'spring', damping: 18, stiffness: 280 }}
                            className="relative bg-white rounded-[40px] shadow-2xl border border-white px-12 py-14 max-w-md w-full text-center overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {['🎉', '✨', '🌟', '💫', '🎊', '⭐'].map((emoji, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
                                    animate={{
                                        opacity: [0, 1, 1, 0],
                                        y: [0, -80 - Math.random() * 60, -120 - Math.random() * 80],
                                        x: [(i - 2.5) * 10, (i - 2.5) * 40, (i - 2.5) * 80],
                                        scale: [0, 1.2, 0.8],
                                        rotate: [0, 180, 360],
                                    }}
                                    transition={{ duration: 1.6, delay: i * 0.05, ease: 'easeOut' }}
                                    className="absolute top-1/2 left-1/2 text-3xl pointer-events-none"
                                    style={{ transformOrigin: 'center' }}
                                >
                                    {emoji}
                                </motion.span>
                            ))}

                            <motion.div
                                initial={{ scale: 0, rotate: -10 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.15, type: 'spring', damping: 12, stiffness: 280 }}
                                className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-200"
                            >
                                <CheckCircle2 size={40} className="text-white" strokeWidth={2.5} />
                            </motion.div>

                            <h3 className="text-2xl font-bold text-slate-900 mb-3 font-heading">
                                {completion.themeName} {t('focus.completed', '完成了!')}
                            </h3>
                            <p className="text-slate-500 text-sm font-medium mb-2">
                                {t('focus.totalSpent', '累计专注时长')}
                            </p>
                            <div className="text-5xl font-bold text-emerald-500 tabular-nums mb-6">
                                {completion.minutes}
                                <span className="text-base text-slate-400 font-bold uppercase tracking-widest ml-2">{t('timer.minutes', '分钟')}</span>
                            </div>

                            <button
                                onClick={() => setCompletion(null)}
                                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-all active:scale-95"
                            >
                                {t('common.close', '关闭')}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
};

export default FocusListPage;
