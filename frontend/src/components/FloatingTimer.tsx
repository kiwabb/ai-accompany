import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { useTimerContext } from '../contexts/TimerContext';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import CountdownWidget from './CountdownWidget';

const POSITION_STORAGE_KEY = 'floating_timer_position';

const FloatingTimer: React.FC = () => {
    const { state, timeLeft, isActive, handleToggle, activeTheme } = useTimerContext();
    const { phase, activeVisualThemeId } = state;
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const wasDragged = useRef(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(POSITION_STORAGE_KEY);
            if (saved) {
                const pos = JSON.parse(saved);
                if (typeof pos.x === 'number') x.set(pos.x);
                if (typeof pos.y === 'number') y.set(pos.y);
            }
        } catch {
            // ignore corrupted state
        }
    }, [x, y]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return {
            m: mins.toString().padStart(2, '0'),
            s: secs.toString().padStart(2, '0')
        };
    };

    const timeObj = formatTime(timeLeft);

    const getTheme = () => {
        const isShinchan = activeVisualThemeId === 'shinchan';
        const isChiikawa = activeVisualThemeId === 'chiikawa';

        switch (phase) {
            case 'focus': return {
                text: isShinchan ? 'text-[#5D4037]' : isChiikawa ? 'text-[#5D4037]' : 'text-orange-500',
                bg: isShinchan ? 'bg-[#FF6B6B]' : isChiikawa ? 'bg-[#FFB5C5]' : 'bg-orange-500',
                border: 'border-white/40',
                lightBg: isShinchan ? 'bg-[#FF6B6B]/10' : isChiikawa ? 'bg-[#FFB5C5]/10' : 'bg-orange-500/10',
                shadow: isShinchan
                    ? 'shadow-[0_20px_50px_-10px_rgba(255,107,107,0.25)]'
                    : isChiikawa
                        ? 'shadow-[0_20px_50px_-10px_rgba(255,181,197,0.25)]'
                        : 'shadow-[0_20px_50px_-10px_rgba(249,115,22,0.15)]'
            };
            case 'shortBreak': return {
                text: isShinchan ? 'text-[#5D4037]' : isChiikawa ? 'text-[#5D4037]' : 'text-emerald-500',
                bg: isShinchan ? 'bg-[#FFF176]' : isChiikawa ? 'bg-[#B8E6F0]' : 'bg-emerald-500',
                border: 'border-white/40',
                lightBg: isShinchan ? 'bg-[#FFF176]/20' : isChiikawa ? 'bg-[#B8E6F0]/20' : 'bg-emerald-500/10',
                shadow: isShinchan
                    ? 'shadow-[0_20px_50px_-10px_rgba(255,241,118,0.25)]'
                    : isChiikawa
                        ? 'shadow-[0_20px_50px_-10px_rgba(184,230,240,0.25)]'
                        : 'shadow-[0_20px_50px_-10px_rgba(16,185,129,0.15)]'
            };
            case 'longBreak': return {
                text: isShinchan ? 'text-[#5D4037]' : isChiikawa ? 'text-[#5D4037]' : 'text-indigo-500',
                bg: isShinchan ? 'bg-[#4FC3F7]' : isChiikawa ? 'bg-[#FFFACD]' : 'bg-indigo-500',
                border: 'border-white/40',
                lightBg: isShinchan ? 'bg-[#4FC3F7]/10' : isChiikawa ? 'bg-[#FFFACD]/20' : 'bg-indigo-500/10',
                shadow: isShinchan
                    ? 'shadow-[0_20px_50px_-10px_rgba(79,195,247,0.25)]'
                    : isChiikawa
                        ? 'shadow-[0_20px_50px_-10px_rgba(255,250,205,0.25)]'
                        : 'shadow-[0_20px_50px_-10px_rgba(99,102,241,0.15)]'
            };
            default: return {
                text: 'text-slate-600',
                bg: 'bg-slate-600',
                border: 'border-white/40',
                lightBg: 'bg-slate-600/10',
                shadow: 'shadow-[0_20px_50px_-10px_rgba(71,85,105,0.1)]'
            };
        }
    };

    const theme = getTheme();

    const getTotalDuration = () => {
        if (phase === 'focus') {
            return (activeTheme?.focusDuration || 25) * 60;
        } else if (phase === 'shortBreak') {
            return (state.settings.shortBreakDuration || 5) * 60;
        } else {
            return (state.settings.longBreakDuration || 15) * 60;
        }
    };

    const totalDuration = getTotalDuration();
    const progress = timeLeft / totalDuration;

    const isTimerPage = location.pathname.startsWith('/timer/');
    const isIdle = !isActive && timeLeft === totalDuration;

    if (isTimerPage || isIdle) {
        return null;
    }

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            drag
            dragMomentum={false}
            dragElastic={0.05}
            dragConstraints={{
                left: -window.innerWidth + 100,
                right: window.innerWidth - 200,
                top: -50,
                bottom: window.innerHeight - 200,
            }}
            style={{ x, y }}
            onDragStart={() => { wasDragged.current = true; }}
            onDragEnd={() => {
                try {
                    localStorage.setItem(
                        POSITION_STORAGE_KEY,
                        JSON.stringify({ x: x.get(), y: y.get() })
                    );
                } catch {
                    // ignore quota errors
                }
                setTimeout(() => { wasDragged.current = false; }, 50);
            }}
            whileDrag={{ scale: 1.02, rotate: 1 }}
            className="fixed top-24 left-8 z-[100] cursor-grab active:cursor-grabbing select-none group/timer"
        >
            <div
                className={`
                    relative flex items-center h-[80px] gap-5 pl-7 pr-4
                    bg-white/94 backdrop-blur-3xl
                    rounded-[36px] ${theme.shadow}
                    border border-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]
                    transition-all duration-300
                `}
            >
                {/* Slim Progress Bar */}
                <div className="absolute inset-x-8 bottom-0 h-0.5 bg-slate-100/50 rounded-full overflow-hidden">
                    <motion.div
                        className={`h-full ${theme.bg}`}
                        animate={{ width: `${progress * 100}%` }}
                        transition={{ duration: 1, ease: 'linear' }}
                    />
                </div>

                <div
                    onClick={() => {
                        if (wasDragged.current) return;
                        navigate(activeTheme ? `/timer/${activeTheme.id}` : '/');
                    }}
                    className="flex flex-col min-w-[100px] cursor-pointer"
                >
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-300 leading-none mb-1 group-hover/timer:text-slate-400 transition-colors">
                        {t(`common.${phase}`)}
                    </span>
                    <span className="text-[12px] font-black text-slate-800 truncate max-w-[110px] leading-tight mb-2">
                        {activeTheme?.name || t('timer.focus')}
                    </span>
                    {/* Integrated Minimalist Countdown Under Subject Name */}
                    <div className="w-full">
                        <CountdownWidget variant="minimal" textColor={theme.text} />
                    </div>
                </div>

                <div className="w-px h-8 bg-slate-100/60" />

                <div className="flex flex-col items-center justify-center min-w-[60px]">
                    <div className={`text-xl font-black tracking-tighter tabular-nums ${theme.text} leading-none`}>
                        {timeObj.m}:{timeObj.s}
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleToggle}
                    className={`
                        w-9 h-9 flex items-center justify-center rounded-xl 
                        ${theme.lightBg} ${theme.text} 
                        border border-white/80 transition-all
                    `}
                >
                    {isActive ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                </motion.button>
            </div>
        </motion.div>
    );
};

export default FloatingTimer;
