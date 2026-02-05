import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTimerContext } from '../contexts/TimerContext';
import { Book as BookIcon, Settings as SettingsIcon, Rocket as RocketIcon, Brain as BrainIcon, Coffee as CoffeeIcon, Sparkles as SparklesIcon, Trophy as TrophyIcon, BarChart3 as BarChartIcon } from 'lucide-react';

import ConfirmModal from '../components/ConfirmModal';
import AmbientBackground from '../components/AmbientBackground';
import CozyPal, { type CozyPalHandle } from '../components/CozyPal';

const FocusListPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { state, isActive, timeLeft, totalTimeValue, reset, todayStats } = useTimerContext();
    const { themes } = state;
    const cozyPalRef = useRef<CozyPalHandle>(null);

    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
    const [pendingThemeId, setPendingThemeId] = React.useState<string | null>(null);
    const [confirmMessage, setConfirmMessage] = React.useState('');

    const getIcon = (id: string) => {
        switch (id) {
            case 'english': return <BrainIcon size={28} />;
            case '408': return <RocketIcon size={28} />;
            case 'math': return <BookIcon size={28} />;
            default: return <CoffeeIcon size={28} />;
        }
    };

    const getCardTheme = (id: string) => {
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
        <main className="min-h-screen w-full bg-[#FCFAF7] flex flex-col items-center justify-center p-6 selection:bg-cozy-orange/30 relative overflow-hidden">
            <AmbientBackground />

            <div className="relative z-10 w-full max-w-[1100px] flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center mb-20"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cozy-orange/10 text-cozy-orange text-[10px] font-bold uppercase tracking-widest mb-6 border border-cozy-orange/20"
                    >
                        <SparklesIcon size={12} strokeWidth={3} />
                        {t('timer.focusCompanion')}
                    </motion.div>

                    <h1 className="text-6xl md:text-8xl font-bold tracking-normal text-slate-900 mb-8 font-heading leading-tight">
                        {t('timer.studyBuddy')}
                    </h1>
                    <p className="text-slate-500 text-lg font-medium max-w-lg mx-auto leading-relaxed">
                        开启沉浸式学习体验，选择一个您想要深入探索的领域
                    </p>
                </motion.div>


                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 w-full px-4">
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
                                className={`
                                    group relative flex flex-row md:flex-col items-center p-6 md:p-12
                                    rounded-[40px] md:rounded-[64px] bg-white/70 backdrop-blur-2xl
                                    border ${style.border} shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)]
                                    transition-all duration-500 overflow-hidden cursor-pointer
                                    hover:bg-white/90 ${style.glow}
                                `}
                            >
                                {/* Inner Gradient Glow - Desktop Only */}
                                <div className={`hidden md:block absolute inset-0 bg-gradient-to-br ${style.grad} translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-out opacity-40`} />

                                {/* Icon Wrapper - Animation on hover only */}
                                <motion.div
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    className={`relative z-10 p-5 md:p-8 rounded-[24px] md:rounded-[40px] ${style.icon} flex-shrink-0 mr-5 md:mr-0 md:mb-10 shadow-inner border border-white/60 transition-all duration-300`}
                                >
                                    {getIcon(theme.id)}
                                </motion.div>

                                <div className="relative z-10 text-left md:text-center flex-grow">
                                    <h3 className="text-xl md:text-3xl font-bold text-slate-800 mb-2 md:mb-4 group-hover:text-black transition-colors">{theme.name}</h3>
                                    <div className="inline-flex items-center gap-2.5 px-4 md:px-6 py-1.5 md:py-2.5 rounded-full bg-white/50 border border-white/80 shadow-sm backdrop-blur-md">
                                        <div className={`w-1.5 h-1.5 rounded-full ${style.icon.split(' ')[0]} animate-pulse`} />
                                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500">
                                            {theme.focusDuration} {t('timer.minutes')}
                                        </span>
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Premium Floating Nav */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="fixed bottom-6 md:bottom-10 flex w-full md:w-auto px-6 md:p-2 bg-transparent md:bg-white/60 md:backdrop-blur-2xl md:border md:border-white/80 md:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] z-50 overflow-hidden justify-around md:justify-center rounded-[32px]"
                >
                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(99, 102, 241, 0.05)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/library')}
                        className="flex flex-col md:flex-row items-center gap-1 md:gap-2.5 px-6 md:px-8 py-3 md:py-4 rounded-2xl text-indigo-500 transition-all group"
                    >
                        <div className="p-2 md:p-0 bg-white/80 md:bg-transparent rounded-xl md:rounded-none shadow-sm md:shadow-none border border-white md:border-none">
                            <BookIcon size={20} strokeWidth={2.5} className="group-hover:rotate-3" />
                        </div>
                        <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">{t('common.library')}</span>
                    </motion.button>

                    <div className="hidden md:block w-px h-8 bg-[#E6E2DE] self-center mx-2" />

                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/settings')}
                        className="flex flex-col md:flex-row items-center gap-1 md:gap-2.5 px-6 md:px-8 py-3 md:py-4 rounded-2xl text-orange-500 transition-all group"
                    >
                        <div className="p-2 md:p-0 bg-white/80 md:bg-transparent rounded-xl md:rounded-none shadow-sm md:shadow-none border border-white md:border-none">
                            <SettingsIcon size={20} strokeWidth={2.5} className="group-hover:rotate-3" />
                        </div>
                        <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">{t('common.settings')}</span>
                    </motion.button>

                    <div className="hidden md:block w-px h-8 bg-[#E6E2DE] self-center mx-2" />

                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(16, 185, 129, 0.05)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/stats')}
                        className="flex flex-col md:flex-row items-center gap-1 md:gap-2.5 px-6 md:px-8 py-3 md:py-4 rounded-2xl text-emerald-500 transition-all group"
                    >
                        <div className="p-2 md:p-0 bg-white/80 md:bg-transparent rounded-xl md:rounded-none shadow-sm md:shadow-none border border-white md:border-none">
                            <BarChartIcon size={20} strokeWidth={2.5} className="group-hover:rotate-3" />
                        </div>
                        <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">{t('common.stats', '专注分析')}</span>
                    </motion.button>

                    <div className="hidden md:block w-px h-8 bg-[#E6E2DE] self-center mx-2" />

                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(234, 179, 8, 0.05)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/achievements')}
                        className="flex flex-col md:flex-row items-center gap-1 md:gap-2.5 px-6 md:px-8 py-3 md:py-4 rounded-2xl text-yellow-500 transition-all group"
                    >
                        <div className="p-2 md:p-0 bg-white/80 md:bg-transparent rounded-xl md:rounded-none shadow-sm md:shadow-none border border-white md:border-none">
                            <TrophyIcon size={20} strokeWidth={2.5} className="group-hover:rotate-3" />
                        </div>
                        <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">{t('common.achievements', '成就墙')}</span>
                    </motion.button>
                </motion.div>
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

            {/* AI Chat Companion */}
            <CozyPal
                ref={cozyPalRef}
                themeName={state.activeThemeId || 'default'}
                phase={state.phase}
                timeLeft={timeLeft}
                apiKey={state.settings?.openaiApiKey}
                currentLanguage={i18n.language}
                aiPersona={state.settings?.aiPersona || 'friendly'}
                aiProvider={state.settings?.aiProvider}
                aiModel={state.settings?.aiModel}
                dailyCompletedPomodoros={todayStats?.total_sessions || 0}
                totalFocusMinutes={todayStats?.total_focus_minutes || 0}
                isChiikawaTheme={state.activeVisualThemeId === 'chiikawa'}
            />
        </main>
    );
};

export default FocusListPage;
