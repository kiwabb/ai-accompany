import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Phase } from '../types/pomodoro';

interface TimerDisplayProps {
  timeLeft: number;
  totalTime: number;
  phase: Phase;
}

const phaseConfig: Record<Phase, { emoji: string; color: string; label: string }> = {
  focus: { emoji: '✍️', color: 'var(--color-cozy-red)', label: 'Focus' },
  shortBreak: { emoji: '☕', color: 'var(--color-cozy-green)', label: 'Short Break' },
  longBreak: { emoji: '🧘', color: 'var(--color-cozy-blue)', label: 'Long Break' },
};

export const TimerDisplay = React.memo(({ timeLeft, totalTime, phase }: TimerDisplayProps) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = timeLeft / totalTime;
  const circumference = 2 * Math.PI * 120;
  
  const current = phaseConfig[phase];

  return (
    <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-[380px] lg:h-[380px] transition-all duration-500">
      {/* Outer Glow */}
      <motion.div 
        animate={{ 
          boxShadow: [
            `0 0 0 0px ${current.color}15`,
            `0 0 0 25px ${current.color}00`
          ]
        }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="absolute inset-4 md:inset-6 rounded-full"
      />

      <svg className="w-full h-full -rotate-90 drop-shadow-sm" viewBox="0 0 256 256">
        <circle
          cx="128"
          cy="128"
          r="120"
          fill="transparent"
          stroke="var(--color-cozy-cream)"
          strokeWidth="10"
        />
        <motion.circle
          cx="128"
          cy="128"
          r="120"
          fill="transparent"
          stroke={current.color}
          strokeWidth="10"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ duration: 1, ease: "linear" }}
          strokeLinecap="round"
          className="transition-colors duration-500"
        />
      </svg>

      <div className="absolute flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="text-3xl md:text-5xl lg:text-6xl mb-2 lg:mb-4"
          >
            {current.emoji}
          </motion.div>
        </AnimatePresence>
        
        <div className="flex items-baseline font-sans font-bold text-cozy-text">
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
          key={current.label}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] md:text-xs lg:text-sm font-bold uppercase tracking-[0.3em] text-cozy-text-light/70 mt-3 lg:mt-6 ml-1"
        >
          {current.label}
        </motion.span>
      </div>
    </div>
  );
});
