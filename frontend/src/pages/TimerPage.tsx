import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTimerContext } from '../contexts/TimerContext';
import PomodoroTimer from '../components/PomodoroTimer';
import { motion } from 'framer-motion';
import { ChevronLeft as ChevronLeftIcon } from 'lucide-react';

const TimerPage: React.FC = () => {
    const { themeId } = useParams<{ themeId: string }>();
    const navigate = useNavigate();
    const { handleThemeChange, start, state, isActive } = useTimerContext();

    useEffect(() => {
        if (themeId && state.activeThemeId !== themeId) {
            handleThemeChange(themeId);
        }
    }, [themeId, state.activeThemeId, handleThemeChange]);

    useEffect(() => {
        if (themeId && state.activeThemeId === themeId && !isActive) {
            const timer = setTimeout(() => {
                start();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [themeId, state.activeThemeId, isActive, start]);

    return (
        <main className="min-h-screen w-full bg-cozy-cream flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 selection:bg-cozy-orange/30 relative overflow-x-hidden">
            {/* Dynamic background ambient lights */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-cozy-orange/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-cozy-green/5 rounded-full blur-[140px] animate-pulse" />
            </div>

            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.1, x: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/')}
                className="fixed top-8 left-8 p-4 rounded-full bg-white/90 backdrop-blur-xl shadow-xl border border-white text-cozy-text flex items-center gap-2 px-6 z-50 group"
            >
                <ChevronLeftIcon size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider">返回列表</span>
            </motion.button>

            <div className="relative z-10 w-full max-w-[1200px] flex justify-center py-6 sm:py-10">
                <PomodoroTimer />
            </div>
        </main>
    );
};

export default TimerPage;
