import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Square, SkipForward } from 'lucide-react';
import { useTimerContext } from '../contexts/TimerContext';

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
  const { state } = useTimerContext();
  const isChiikawaTheme = state.activeVisualThemeId === 'chiikawa';
  const isShinchanTheme = state.activeVisualThemeId === 'shinchan';

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        onStartPause();
      } else if (e.code === 'KeyR' && e.ctrlKey) {
        e.preventDefault();
        onReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartPause, onReset]);

  const chiikawaButtonStyles = isActive
    ? 'bg-white text-[#FFB5C5] border-4 md:border-[6px] border-[#FFB5C5] shadow-inner'
    : 'bg-[#FFB5C5] text-white shadow-[0_10px_25px_-5px_rgba(255,181,197,0.5)] border-4 border-white';

  const chiikawaResetStyle = 'bg-[#B8E6F0] text-[#5D4037] border-4 border-white shadow-[0_8px_20px_-5px_rgba(184,230,240,0.5)]';
  const chiikawaSkipStyle = 'bg-[#FFFACD] text-[#5D4037] border-4 border-white shadow-[0_8px_20px_-5px_rgba(255,250,205,0.5)]';

  const shinchanBaseStyle = "border-4 border-white shadow-[0_8px_20px_-5px_rgba(33,150,243,0.3)]";
  const shinchanActiveStyle = "active:scale-95 active:shadow-sm";

  return (
    <div className="flex items-center space-x-6 md:space-x-10 lg:space-x-12" role="group" aria-label="Timer controls">
      <motion.button
        whileHover={{ scale: 1.15, y: -4 }}
        whileTap={{ scale: 0.9, y: 0 }}
        onClick={onReset}
        className={`p-4 md:p-5 lg:p-6 rounded-3xl md:rounded-[2rem] transition-all duration-300 flex items-center justify-center group ${isChiikawaTheme ? chiikawaResetStyle :
            isShinchanTheme ? `bg-[#4FC3F7] text-white ${shinchanBaseStyle.replace('rgba(33,150,243,0.3)', 'rgba(79,195,247,0.4)')} ${shinchanActiveStyle}` :
              'glass-surface text-cozy-text-light hover:text-cozy-red shadow-sm'
          }`}
        aria-label={`${t('common.stop', '结束')} (Ctrl+R)`}
        title="Ctrl+R"
      >
        <Square className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" fill="currentColor" strokeWidth={0} />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1, y: -6 }}
        whileTap={{ scale: 0.92, y: 0 }}
        onClick={onStartPause}
        className={`
          w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-[2.5rem] md:rounded-[3.2rem] lg:rounded-[3.8rem] flex items-center justify-center transition-all duration-500
          ${isChiikawaTheme ? chiikawaButtonStyles :
            isShinchanTheme ? `text-white ${shinchanBaseStyle.replace('rgba(33,150,243,0.3)', isActive ? 'rgba(85,139,47,0.4)' : 'rgba(255,107,107,0.4)')} ${shinchanActiveStyle} ${isActive ? 'bg-[#37474F]' : 'bg-[#FF6B6B]'}` :
              (
                isActive
                  ? 'bg-white text-cozy-orange border-4 md:border-[6px] border-cozy-orange shadow-inner'
                  : 'bg-gradient-to-br from-[#FFB766] to-[#FF9A33] text-white shadow-xl hover:shadow-2xl glow-hover'
              )}
        `}
        aria-label={`${isActive ? t('common.pause') : t('common.start')} (Space)`}
        aria-pressed={isActive}
        title="Space"
      >
        <div className="relative">
          {isActive
            ? <Pause className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14" fill="currentColor" />
            : <Play className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 ml-1 md:ml-1.5" fill="currentColor" />
          }
          {isChiikawaTheme && !isActive && (
            <motion.span
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-6 -right-6 text-2xl"
            >
              ✨
            </motion.span>
          )}
        </div>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.15, rotate: 15, y: -4 }}
        whileTap={{ scale: 0.9, y: 0 }}
        onClick={onSkip}
        className={`p-4 md:p-5 lg:p-6 rounded-3xl md:rounded-[2rem] transition-all duration-300 flex items-center justify-center group ${isChiikawaTheme ? chiikawaSkipStyle :
            isShinchanTheme ? `bg-[#FFF176] text-[#5D4037] ${shinchanBaseStyle.replace('rgba(33,150,243,0.3)', 'rgba(255,241,118,0.5)')} ${shinchanActiveStyle}` :
              'glass-surface text-cozy-text-light hover:text-cozy-blue shadow-sm'
          }`}
        aria-label={t('common.skip')}
      >
        <SkipForward className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" strokeWidth={isChiikawaTheme || isShinchanTheme ? 3 : 2.5} />
      </motion.button>

    </div>
  );
};

export default TimerControls;
