import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTimerContext } from '../contexts/TimerContext';
import { Book as BookIcon, Settings as SettingsIcon, Rocket as RocketIcon, Brain as BrainIcon, Coffee as CoffeeIcon, Sparkles as SparklesIcon } from 'lucide-react';
import CozyPal from '../components/CozyPal';
import FloatingTimer from '../components/FloatingTimer';

const FocusListPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { state, isActive } = useTimerContext();
    const { themes } = state;

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

    return (
        <main className="min-h-screen w-full bg-[#FCFAF7] flex flex-col items-center justify-center p-6 selection:bg-cozy-orange/30 relative overflow-hidden">
            {/* Premium Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                        y: [0, 30, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-cozy-orange/10 rounded-full blur-[160px]"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        x: [0, -40, 0],
                        y: [0, -20, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-20%] right-[-10%] w-[80vw] h-[80vw] bg-cozy-green/10 rounded-full blur-[180px]"
                />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay" />
            </div>

            <div className="relative z-10 w-full max-w-[1100px] flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "circOut" }}
                    className="text-center mb-16"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cozy-orange/10 text-cozy-orange text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-cozy-orange/20"
                    >
                        <SparklesIcon size={12} />
                        {t('timer.focusCompanion')}
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[#2D2926] mb-6 font-heading drop-shadow-sm">
                        {t('timer.studyBuddy')}
                    </h1>
                    <p className="text-[#6B6661] text-lg font-medium max-w-lg mx-auto leading-relaxed">
                        开启沉浸式学习体验，<br className="sm:hidden" />选择一个您想要深入探索的领域
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8 w-full px-4">
                    {themes.map((theme, index) => {
                        const style = getCardTheme(theme.id);
                        return (
                            <motion.button
                                key={theme.id}
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + index * 0.1, duration: 0.6, ease: "backOut" }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate(`/timer/${theme.id}`)}
                                className={`group relative flex flex-row md:flex-col items-center p-5 md:p-10 rounded-[32px] md:rounded-[60px] bg-white/60 backdrop-blur-3xl border ${style.border} shadow-[0_15px_40px_-15px_rgba(0,0,0,0.06)] transition-all duration-500 overflow-hidden ${style.glow}`}
                            >
                                {/* Inner Gradient Glow - Desktop Only */}
                                <div className={`hidden md:block absolute inset-0 bg-gradient-to-br ${style.grad} translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-out opacity-60`} />

                                {/* Floating Icon Wrapper */}
                                <motion.div
                                    animate={{ y: [0, -3, 0] }}
                                    transition={{ duration: 3 + index, repeat: Infinity, ease: "easeInOut" }}
                                    className={`relative z-10 p-4 md:p-6 rounded-2xl md:rounded-[32px] ${style.icon} flex-shrink-0 mr-4 md:mr-0 md:mb-8 shadow-inner border border-white/50 transition-transform duration-500`}
                                >
                                    {getIcon(theme.id)}
                                </motion.div>

                                <div className="relative z-10 text-left md:text-center flex-grow">
                                    <h3 className="text-lg md:text-2xl font-black text-[#2D2926] mb-1 md:mb-3 group-hover:text-black transition-colors">{theme.name}</h3>
                                    <div className="inline-flex items-center gap-2 px-3 md:px-5 py-1 md:py-2 rounded-full bg-white/40 border border-white/60 shadow-sm">
                                        <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${style.icon.split(' ')[0]}`} />
                                        <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[1px] md:tracking-[2px] text-[#8C867E]">
                                            {theme.focusDuration} {t('timer.minutes')}
                                        </span>
                                    </div>
                                </div>

                                {/* Arrow Indicator */}
                                <div className="relative z-10 md:absolute md:bottom-8 md:right-10 opacity-40 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 md:translate-x-4 md:group-hover:translate-x-0">
                                    <motion.div
                                        animate={{ x: [0, 3, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        <RocketIcon size={20} className={`${style.icon.split(' ')[0]}/40`} />
                                    </motion.div>
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
                        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[1px] md:tracking-[2px]">{t('common.library')}</span>
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
                        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[1px] md:tracking-[2px]">{t('common.settings')}</span>
                    </motion.button>
                </motion.div>
            </div>

            {/* Conditionally Render AI Companion and Timer if Timer is Active */}
            {isActive && (
                <>
                    <CozyPal />
                    <FloatingTimer />
                </>
            )}
        </main>
    );
};

export default FocusListPage;
