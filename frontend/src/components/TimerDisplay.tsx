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
    <div className="relative flex items-center justify-center w-72 h-72 md:w-80 md:h-80">
      {/* Outer Glow */}
      <motion.div 
        animate={{ 
          boxShadow: [
            `0 0 0 0px ${current.color}10`,
            `0 0 0 20px ${current.color}00`
          ]
        }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="absolute inset-4 rounded-full"
      />

      <svg className="w-full h-full -rotate-90 drop-shadow-sm" viewBox="0 0 256 256">
        <circle
          cx="128"
          cy="128"
          r="120"
          fill="transparent"
          stroke="var(--color-cozy-cream)"
          strokeWidth="12"
        />
        <motion.circle
          cx="128"
          cy="128"
          r="120"
          fill="transparent"
          stroke={current.color}
          strokeWidth="12"
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
            className="text-4xl mb-2"
          >
            {current.emoji}
          </motion.div>
        </AnimatePresence>
        
        <div className="flex items-baseline font-sans font-bold text-cozy-text">
          <span className="text-6xl tracking-tighter">{String(minutes).padStart(2, '0')}</span>
          <motion.span 
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="text-5xl mx-0.5 mb-1"
          >
            :
          </motion.span>
          <span className="text-6xl tracking-tighter">{String(seconds).padStart(2, '0')}</span>
        </div>

        <motion.span 
          key={current.label}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-bold uppercase tracking-[0.25em] text-cozy-text-light/70 mt-3 ml-1"
        >
          {current.label}
        </motion.span>
      </div>
    </div>
  );
});
