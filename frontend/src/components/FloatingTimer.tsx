import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Coffee, Brain } from 'lucide-react';
import { useTimerContext } from '../contexts/TimerContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const FloatingTimer: React.FC = () => {
    const { state, timeLeft, isActive, handleToggle, activeTheme } = useTimerContext();
    const { phase } = state;
    const { t } = useTranslation();
    const navigate = useNavigate();

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getThemeColors = () => {
        switch (phase) {
            case 'focus':
                return {
                    bg: 'bg-gradient-to-r from-orange-400/90 to-amber-500/90',
                    shadow: 'shadow-orange-500/30',
                    icon: 'text-amber-50'
                };
            case 'shortBreak':
                return {
                    bg: 'bg-gradient-to-r from-emerald-400/90 to-green-500/90',
                    shadow: 'shadow-emerald-500/30',
                    icon: 'text-emerald-50'
                };
            case 'longBreak':
                return {
                    bg: 'bg-gradient-to-r from-sky-400/90 to-blue-500/90',
                    shadow: 'shadow-sky-500/30',
                    icon: 'text-sky-50'
                };
            default:
                return {
                    bg: 'bg-gray-800/90',
                    shadow: 'shadow-gray-500/30',
                    icon: 'text-gray-100'
                };
        }
    };

    const theme = getThemeColors();

    const getPhaseIcon = () => {
        switch (phase) {
            case 'focus': return <Brain size={18} className={theme.icon} />;
            case 'shortBreak':
            case 'longBreak': return <Coffee size={18} className={theme.icon} />;
            default: return null;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className="fixed bottom-32 right-6 z-[100]"
        >
            <motion.div
                className="relative group cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                {/* Active Pulse Glow */}
                {isActive && (
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className={`absolute inset-0 rounded-full blur-md ${getThemeColors().bg}`}
                    />
                )}

                <div
                    className={`relative flex items-center rounded-full shadow-2xl backdrop-blur-xl border border-white/20 text-white transition-all duration-300 ${theme.bg} ${theme.shadow}`}
                >
                    {/* Main Click Area - Navigates to Timer Page */}
                    <button
                        onClick={() => navigate(activeTheme ? `/timer/${activeTheme.id}` : '/')}
                        className="flex items-center gap-3 pl-5 pr-3 py-3.5 rounded-l-full hover:bg-white/10 transition-colors"
                    >
                        <motion.div
                            animate={isActive ? { rotate: [0, 10, -10, 0] } : {}}
                            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                        >
                            {getPhaseIcon()}
                        </motion.div>
                        <span className="font-mono text-xl font-bold tracking-widest tabular-nums leading-none pt-0.5" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            {formatTime(timeLeft)}
                        </span>
                    </button>

                    <div className="w-px h-6 bg-white/20" />

                    {/* Toggle Button Area */}
                    <div className="pl-3 pr-4 py-2 rounded-r-full">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggle();
                            }}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/30 transition-colors shadow-inner border border-white/10"
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={isActive ? 'pause' : 'play'}
                                    initial={{ scale: 0, rotate: -90 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 90 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {isActive ? (
                                        <Pause size={14} fill="currentColor" />
                                    ) : (
                                        <Play size={14} fill="currentColor" className="ml-0.5" />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default FloatingTimer;
