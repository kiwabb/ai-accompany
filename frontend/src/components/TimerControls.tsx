import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  return (
    <div className="flex items-center space-x-6 md:space-x-10 lg:space-x-12">
      <motion.button
        whileHover={{ scale: 1.15, rotate: -15 }}
        whileTap={{ scale: 0.9 }}
        onClick={onReset}
        className="p-4 md:p-5 lg:p-6 rounded-3xl md:rounded-[2rem] bg-cozy-cream text-cozy-text-light hover:text-cozy-red transition-colors border border-cozy-text/5 shadow-sm flex items-center justify-center"
        aria-label={t('common.reset')}
      >
        <RotateCcw className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" strokeWidth={2.5} />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={onStartPause}
        className={`
          w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-[2.2rem] md:rounded-[3rem] lg:rounded-[3.5rem] flex items-center justify-center transition-all duration-500
          ${isActive 
            ? 'bg-white text-cozy-orange border-4 md:border-[6px] border-cozy-orange shadow-inner' 
            : 'bg-cozy-orange text-white shadow-xl shadow-cozy-orange/40'}
        `}
        aria-label={isActive ? t('common.pause') : t('common.start')}
      >
        {isActive 
          ? <Pause className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14" fill="currentColor" /> 
          : <Play className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 ml-1 md:ml-1.5" fill="currentColor" />
        }
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.15, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
        onClick={onSkip}
        className="p-4 md:p-5 lg:p-6 rounded-3xl md:rounded-[2rem] bg-cozy-cream text-cozy-text-light hover:text-cozy-blue transition-colors border border-cozy-text/5 shadow-sm flex items-center justify-center"
        aria-label={t('common.skip')}
      >
        <SkipForward className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" strokeWidth={2.5} />
      </motion.button>
    </div>
  );
};

export default TimerControls;
