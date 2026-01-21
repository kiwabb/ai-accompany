import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';

interface TimerControlsProps {
  isActive: boolean;
  onStartPause: () => void;
  onReset: () => void;
  onSkip: () => void;
}

const TimerControls: React.FC<TimerControlsProps> = ({
  isActive,
  onStartPause,
  onReset,
  onSkip,
}) => {
  return (
    <div className="flex items-center space-x-8">
      <motion.button
        whileHover={{ scale: 1.1, rotate: -15 }}
        whileTap={{ scale: 0.9 }}
        onClick={onReset}
        className="p-4 rounded-3xl bg-cozy-cream text-cozy-text-light hover:text-cozy-red transition-colors border border-cozy-text/5"
        aria-label="Reset Timer"
      >
        <RotateCcw size={22} strokeWidth={2.5} />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStartPause}
        className={`
          w-24 h-24 rounded-[2.5rem] flex items-center justify-center transition-all duration-500
          ${isActive 
            ? 'bg-white text-cozy-orange border-4 border-cozy-orange shadow-inner' 
            : 'bg-cozy-orange text-white shadow-xl shadow-cozy-orange/40'}
        `}
        aria-label={isActive ? "Pause Timer" : "Start Timer"}
      >
        {isActive ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
        onClick={onSkip}
        className="p-4 rounded-3xl bg-cozy-cream text-cozy-text-light hover:text-cozy-blue transition-colors border border-cozy-text/5"
        aria-label="Skip Period"
      >
        <SkipForward size={22} strokeWidth={2.5} />
      </motion.button>
    </div>
  );
};

export default TimerControls;
