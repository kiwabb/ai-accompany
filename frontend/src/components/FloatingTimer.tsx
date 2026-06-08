import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useDragControls } from 'framer-motion';
import { Play, Pause, Square, SkipForward, Maximize2 } from 'lucide-react';
import { useTimerContext } from '../contexts/useTimerContext';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { resolveVisualTheme } from '../constants/themes';

const POSITION_STORAGE_KEY = 'floating_timer_position';
const SIZE_STORAGE_KEY = 'floating_timer_size';

// 自由调整：直径范围
const MIN_SIZE = 64;
const MAX_SIZE = 200;
// 边缘热区宽度：从外边缘往内收 EDGE_BAND px 算作 "边缘"
const EDGE_BAND = 12;

const FloatingTimer: React.FC = () => {
    const { state, timeLeft, isActive, hasStarted, handleToggle, handleReset, handleSkip, activeTheme } = useTimerContext();
    const { phase, activeVisualThemeId } = state;
    const visualTheme = resolveVisualTheme(activeVisualThemeId);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const wasDragged = useRef(false);

    const [size, setSize] = useState<number>(() => {
        try {
            const saved = localStorage.getItem(SIZE_STORAGE_KEY);
            const parsed = saved ? parseInt(saved, 10) : NaN;
            if (!isNaN(parsed) && parsed >= MIN_SIZE && parsed <= MAX_SIZE) return parsed;
        } catch {
            // ignore
        }
        return 96;
    });

    const [isResizing, setIsResizing] = useState(false);
    const dragControls = useDragControls();
    const resizeStartRef = useRef<{ cx: number; cy: number } | null>(null);
    const circleRef = useRef<HTMLDivElement | null>(null);

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
        switch (phase) {
            case 'focus': return {
                text: 'text-orange-500',
                color: visualTheme.colors.primary,
                bg: 'bg-orange-500',
                border: 'border-white/40',
                lightBg: 'bg-orange-500/10',
                shadow: 'shadow-[0_20px_50px_-10px_rgba(249,115,22,0.15)]'
            };
            case 'shortBreak': return {
                text: 'text-emerald-500',
                color: visualTheme.colors.secondary,
                bg: 'bg-emerald-500',
                border: 'border-white/40',
                lightBg: 'bg-emerald-500/10',
                shadow: 'shadow-[0_20px_50px_-10px_rgba(16,185,129,0.15)]'
            };
            case 'longBreak': return {
                text: 'text-indigo-500',
                color: visualTheme.colors.accent,
                bg: 'bg-indigo-500',
                border: 'border-white/40',
                lightBg: 'bg-indigo-500/10',
                shadow: 'shadow-[0_20px_50px_-10px_rgba(99,102,241,0.15)]'
            };
            default: return {
                text: 'text-slate-600',
                color: visualTheme.colors.textMuted,
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
    // 一旦 session 启动过，就锁定浮动器显示——阶段切换/Stop 重置后 timeLeft 回到 totalDuration
    // 不应让它消失。只有用户从未启动过任何 session 时才隐藏（避免一打开 app 就看到漂浮）。
    const isFresh = !isActive && timeLeft === totalDuration && !hasStarted;

    if (isTimerPage || isFresh) {
        return null;
    }

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            drag
            dragListener={false}
            dragControls={dragControls}
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
            {(() => {
                // 圆形进度环参数：随 size 自适应
                const stroke = size <= 80 ? 4 : size <= 110 ? 5 : 6;
                const r = (size - stroke) / 2;
                const circ = 2 * Math.PI * r;
                const dashOffset = circ * (1 - progress);
                // 字号/按钮尺寸跟随 size 缩放
                const phaseFontPx = Math.max(7, Math.round(size * 0.085));
                const timeFontPx = Math.max(16, Math.round(size * 0.26));
                const btnDim = Math.max(18, Math.round(size * 0.18));
                const btnIcon = Math.max(8, Math.round(size * 0.085));
                // 中间播放/暂停按钮稍大，作为主操作视觉焦点
                const centerBtnDim = Math.round(btnDim * 1.3);
                const centerBtnIcon = Math.round(btnIcon * 1.3);

                const distFromCenter = (e: React.PointerEvent) => {
                    const rect = circleRef.current!.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    return { dist: Math.hypot(e.clientX - cx, e.clientY - cy), cx, cy };
                };

                const handlePointerDown = (e: React.PointerEvent) => {
                    if (!circleRef.current) return;
                    const { dist, cx, cy } = distFromCenter(e);
                    const radius = size / 2;
                    if (dist > radius - EDGE_BAND) {
                        // 边缘：进入缩放模式
                        e.stopPropagation();
                        e.preventDefault();
                        try { circleRef.current.setPointerCapture(e.pointerId); } catch { /* noop */ }
                        resizeStartRef.current = { cx, cy };
                        setIsResizing(true);
                    } else {
                        // 中央：交给 framer drag 移动
                        dragControls.start(e);
                    }
                };

                const handlePointerMove = (e: React.PointerEvent) => {
                    if (isResizing && resizeStartRef.current) {
                        const { cx, cy } = resizeStartRef.current;
                        const d = Math.hypot(e.clientX - cx, e.clientY - cy);
                        const next = Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(d * 2)));
                        setSize(next);
                    } else if (!isResizing && circleRef.current) {
                        // 鼠标在边缘 → 根据角度选对应方向的 resize 光标；中间 → grab
                        const { dist, cx, cy } = distFromCenter(e);
                        const radius = size / 2;
                        if (dist > radius - EDGE_BAND) {
                            // 屏幕坐标 y 轴向下，所以取负翻转成数学坐标
                            const angle = Math.atan2(-(e.clientY - cy), e.clientX - cx);
                            const deg = (angle * 180 / Math.PI + 360) % 360;
                            let cursor: string;
                            if (deg < 22.5 || deg >= 337.5) cursor = 'ew-resize';      // 右
                            else if (deg < 67.5) cursor = 'nesw-resize';               // 右上
                            else if (deg < 112.5) cursor = 'ns-resize';                // 上
                            else if (deg < 157.5) cursor = 'nwse-resize';              // 左上
                            else if (deg < 202.5) cursor = 'ew-resize';                // 左
                            else if (deg < 247.5) cursor = 'nesw-resize';              // 左下
                            else if (deg < 292.5) cursor = 'ns-resize';                // 下
                            else cursor = 'nwse-resize';                                // 右下
                            circleRef.current.style.cursor = cursor;
                        } else {
                            circleRef.current.style.cursor = 'grab';
                        }
                    }
                };

                const handlePointerUp = (e: React.PointerEvent) => {
                    if (isResizing) {
                        try { circleRef.current?.releasePointerCapture(e.pointerId); } catch { /* noop */ }
                        resizeStartRef.current = null;
                        setIsResizing(false);
                        try {
                            localStorage.setItem(SIZE_STORAGE_KEY, String(size));
                        } catch {
                            // ignore
                        }
                    }
                };

                return (
                    <motion.div
                        ref={circleRef}
                        layout
                        onClick={(e) => {
                            // 点击中央切换播放/暂停（拖拽过 / resize 中 / 点到子按钮时跳过）
                            if (wasDragged.current || isResizing) return;
                            if ((e.target as HTMLElement).closest('button')) return;
                            handleToggle();
                        }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        style={{ width: size, height: size, touchAction: 'none' }}
                        className={`relative rounded-full bg-white/95 backdrop-blur-3xl ${theme.shadow} border border-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)] flex items-center justify-center transition-shadow duration-300`}
                        title={activeTheme?.name || t('timer.focus')}
                    >
                        {/* 圆环进度 */}
                        <svg width={size} height={size} className="absolute inset-0 -rotate-90 pointer-events-none">
                            <circle
                                cx={size / 2}
                                cy={size / 2}
                                r={r}
                                fill="none"
                                strokeWidth={stroke}
                                className="stroke-slate-100"
                            />
                            <motion.circle
                                cx={size / 2}
                                cy={size / 2}
                                r={r}
                                fill="none"
                                strokeWidth={stroke}
                                strokeLinecap="round"
                                className={theme.text}
                                style={{ color: theme.color }}
                                stroke="currentColor"
                                strokeDasharray={circ}
                                animate={{ strokeDashoffset: dashOffset }}
                                transition={{ duration: 1, ease: 'linear' }}
                            />
                        </svg>

                        {/* 中央：阶段 + 时间，暂停时下方显示一行控制按钮 */}
                        <div className="flex flex-col items-center justify-center select-none">
                            <span
                                className="font-black uppercase tracking-[0.2em] text-slate-300 leading-none mb-2.5 pointer-events-none"
                                style={{ fontSize: phaseFontPx }}
                            >
                                {t(`common.${phase}`)}
                            </span>
                            <span
                                className={`font-black tracking-tight tabular-nums ${theme.text} leading-none pointer-events-none`}
                                style={{ fontSize: timeFontPx, color: theme.color }}
                            >
                                {timeObj.m}:{timeObj.s}
                            </span>
                            {/* 始终显示 Stop / Play-Pause / Skip 三按钮，低饱和度配色降低存在感 */}
                            <div className="flex items-center gap-1 mt-2 opacity-60 hover:opacity-100 transition-opacity">
                                <motion.button
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.9 }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleReset();
                                    }}
                                    style={{ width: btnDim, height: btnDim }}
                                    className="flex items-center justify-center rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50/60 transition-colors"
                                    title={t('common.stop', '结束')}
                                    aria-label={t('common.stop', '结束')}
                                >
                                    <Square size={btnIcon} strokeWidth={2.2} />
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.9 }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggle();
                                    }}
                                    style={{ width: centerBtnDim, height: centerBtnDim }}
                                    className={`flex items-center justify-center rounded-full ${theme.text} hover:bg-slate-100/80 transition-colors`}
                                    title={isActive ? t('common.pause', '暂停') : t('common.start', '开始')}
                                    aria-label={isActive ? t('common.pause', '暂停') : t('common.start', '开始')}
                                >
                                    {isActive
                                        ? <Pause size={centerBtnIcon} strokeWidth={2.2} />
                                        : <Play size={centerBtnIcon} strokeWidth={2.2} className="ml-[1px]" />}
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.9 }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSkip();
                                        // 跳过后自动进入下一阶段计时，让用户不用再点一次 Play
                                        if (!isActive) {
                                            setTimeout(() => handleToggle(), 0);
                                        }
                                    }}
                                    style={{ width: btnDim, height: btnDim }}
                                    className="flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors"
                                    title={t('timer.skip', '跳过')}
                                    aria-label={t('timer.skip', '跳过')}
                                >
                                    <SkipForward size={btnIcon} strokeWidth={2.2} />
                                </motion.button>
                            </div>
                        </div>

                        {/* 右上：放大图标 → 进入时钟界面 */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(activeTheme ? `/timer/${activeTheme.id}` : '/');
                            }}
                            className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center rounded-full bg-white text-slate-500 hover:text-slate-800 border-2 border-white shadow-md transition-all"
                            title={t('timer.openTimer', '展开计时器')}
                            aria-label={t('timer.openTimer', '展开计时器')}
                        >
                            <Maximize2 size={10} strokeWidth={2.5} />
                        </motion.button>
                    </motion.div>
                );
            })()}
        </motion.div>
    );
};

export default FloatingTimer;
