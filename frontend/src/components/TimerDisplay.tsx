import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { Phase } from '../types/pomodoro';
import { useTimerContext } from '../contexts/TimerContext';

interface TimerDisplayProps {
  timeLeft: number;
  totalTime: number;
  phase: Phase;
}

const phaseColors: Record<Phase, string> = {
  focus: 'var(--color-cozy-red)',
  shortBreak: 'var(--color-cozy-green)',
  longBreak: 'var(--color-cozy-blue)',
};

const phaseEmojis: Record<Phase, string> = {
  focus: '✍️',
  shortBreak: '☕',
  longBreak: '🧘',
};

const chiikawaPhaseEmojis: Record<Phase, string> = {
  focus: '📖',
  shortBreak: '🍜',
  longBreak: '💤',
};

const chiikawaCharacters = [
  '/assets/chiikawa/sticker-0.png',
  '/assets/chiikawa/sticker-1.png',
  '/assets/chiikawa/sticker-2.png',
];

const shinchanCharacters = [
  '/assets/shinchan/shinchan.png',
  '/assets/shinchan/shiro-animated.gif',
  '/assets/shinchan/bo-chan.png',
];

const shinchanEmojis: Record<Phase, string> = {
  focus: '/assets/shinchan/action-mask.png',
  shortBreak: '/assets/shinchan/dino-small.gif',
  longBreak: '/assets/shinchan/shiro-animated.gif',
};

export const TimerDisplay = React.memo(({ timeLeft, totalTime, phase }: TimerDisplayProps) => {
  const { t } = useTranslation();
  const { state } = useTimerContext();
  const isChiikawaTheme = state.activeVisualThemeId === 'chiikawa';
  const isShinchanTheme = state.activeVisualThemeId === 'shinchan';

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = totalTime > 0 ? timeLeft / totalTime : 1;
  const circumference = 2 * Math.PI * 120;

  const color = isChiikawaTheme
    ? (phase === 'focus' ? '#FFB5C5' : phase === 'shortBreak' ? '#B8E6F0' : '#FFFACD')
    : isShinchanTheme
      ? (phase === 'focus' ? '#FF4D4D' : phase === 'shortBreak' ? '#FFEB3B' : '#2196F3')
      : phaseColors[phase];

  const emoji = isChiikawaTheme
    ? chiikawaPhaseEmojis[phase]
    : isShinchanTheme
      ? shinchanEmojis[phase]
      : phaseEmojis[phase];

  const label = t(`common.${phase}`);

  // SVG 整体 -rotate-90 后 path 起点位于视觉 12 点；y-down 系统下 cos/sin 角度递减对应视觉顺时针。
  const angle = -(1 - progress) * 360;
  const radius = 120;
  const charX = 160 + radius * Math.cos((angle * Math.PI) / 180);
  const charY = 160 + radius * Math.sin((angle * Math.PI) / 180);

  return (
    <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-[420px] lg:h-[420px] transition-all duration-500 overflow-visible">
      {/* Outer Glow */}
      <motion.div
        animate={{
          boxShadow: [
            `0 0 0 0px ${color}15`,
            `0 0 0 25px ${color}00`
          ]
        }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="absolute inset-4 md:inset-6 rounded-full"
      />

      <svg className="w-full h-full -rotate-90 drop-shadow-sm overflow-visible" viewBox="0 0 320 320">
        <circle
          cx="160"
          cy="160"
          r="120"
          fill="transparent"
          stroke={
            isChiikawaTheme ? 'rgba(255, 181, 197, 0.15)' :
              isShinchanTheme ? (phase === 'focus' ? 'rgba(255, 77, 77, 0.15)' : phase === 'shortBreak' ? 'rgba(255, 235, 59, 0.15)' : 'rgba(33, 150, 243, 0.15)') :
                "var(--color-cozy-cream)"
          }
          strokeWidth={isChiikawaTheme || isShinchanTheme ? "12" : "10"}
        />
        <motion.circle
          cx="160"
          cy="160"
          r="120"
          fill="transparent"
          stroke={color}
          strokeWidth={isChiikawaTheme || isShinchanTheme ? "14" : "10"}
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ duration: 1, ease: "linear" }}
          strokeLinecap="round"
          className="transition-colors duration-500"
          style={isShinchanTheme ? { stroke: color, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))', strokeDashoffset: (circumference * (1 - progress)) } : {}}
        />

        {isChiikawaTheme && (
          <motion.g
            animate={{ x: charX, y: charY }}
            transition={{ duration: 1, ease: "linear" }}
          >
            <circle cx="0" cy="0" r="18" fill="white" stroke={color} strokeWidth="2" />
            <image
              href={chiikawaCharacters[phase === 'focus' ? 0 : phase === 'shortBreak' ? 1 : 2]}
              x="-13"
              y="-13"
              width="26"
              height="26"
            />
          </motion.g>
        )}

        {isShinchanTheme && (
          <motion.g
            animate={{ x: charX, y: charY }}
            transition={{ duration: 1, ease: "linear" }}
          >
            <circle cx="0" cy="0" r="22" fill="white" stroke={color} strokeWidth="3" />
            <image
              href={shinchanCharacters[phase === 'focus' ? 0 : phase === 'shortBreak' ? 1 : 2]}
              x="-19"
              y="-19"
              width="38"
              height="38"
            />
          </motion.g>
        )}
      </svg>

      <div className="absolute flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
            className="mb-2 lg:mb-4 drop-shadow-sm flex justify-center items-center h-12 md:h-16 lg:h-20"
          >
            {emoji.startsWith('/') ? (
              <img
                src={emoji}
                alt={phase}
                className="h-full w-auto object-contain drop-shadow-md"
              />
            ) : (
              <span className="text-4xl md:text-6xl lg:text-7xl">{emoji}</span>
            )}
          </motion.div>
        </AnimatePresence>

        <div className={`flex items-baseline font-sans font-bold ${isChiikawaTheme || isShinchanTheme ? 'text-[#5D4037]' : 'text-cozy-text'}`}>
          <span className="text-5xl md:text-7xl lg:text-8xl tracking-tighter">{String(minutes).padStart(2, '0')}</span>
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="text-4xl md:text-6xl lg:text-7xl mx-1 mb-1 lg:mb-2"
          >
            :
          </motion.span>
          <span className="text-5xl md:text-7xl lg:text-8xl tracking-tighter">{String(seconds).padStart(2, '0')}</span>
        </div>

        <motion.span
          key={label}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-[10px] md:text-xs lg:text-sm font-bold uppercase tracking-[0.3em] mt-3 lg:mt-6 ml-1 ${isChiikawaTheme || isShinchanTheme ? 'text-[#8D6E63]' : 'text-cozy-text-light/70'}`}
        >
          {label}
        </motion.span>

        {isChiikawaTheme && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-[10px] text-[#FFB5C5] font-bold tracking-widest bg-white/50 px-3 py-1 rounded-full border border-[#FFB5C5]/30"
          >
            CHIIKAWA MODE ♡
          </motion.div>
        )}

        {isShinchanTheme && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-[10px] text-[#FF6B6B] font-bold tracking-widest bg-white/50 px-3 py-1 rounded-full border border-[#FF6B6B]/30"
          >
            SHIN-CHAN MODE ★
          </motion.div>
        )}
      </div>
    </div>
  );
});
