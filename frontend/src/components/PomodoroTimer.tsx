import { Settings as SettingsIcon, Book as BookIcon } from 'lucide-react';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TimerDisplay } from './TimerDisplay';
import TimerControls from './TimerControls';
import CountdownWidget from './CountdownWidget';
import { useTimerContext } from '../contexts/TimerContext';
import { useNavigate } from 'react-router-dom';

const PomodoroTimer: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    state,
    timeLeft,
    isActive,
    totalTimeValue,
    todayStats,
    handleToggle,
    handleReset,
    handleSkip,
    initialLoaded
  } = useTimerContext();

  const isShinchanTheme = state.activeVisualThemeId === 'shinchan';

  const { phase, completedSessions } = state;

  return (
    <LayoutGroup>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-5xl rounded-[64px] p-10 md:p-16 flex flex-col lg:flex-row items-center gap-12 md:gap-24 relative transition-all duration-700 mx-auto bg-white/60 backdrop-blur-3xl border border-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)]"
      >
        <AnimatePresence>
          {!initialLoaded && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/40 backdrop-blur-3xl flex items-center justify-center rounded-[64px]"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                <div className="text-slate-900 font-bold uppercase tracking-[0.2em] text-[10px]">{t('timer.loading')}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left Side: Timer Circle */}
        <motion.div layout className="flex-shrink-0 flex flex-col items-center justify-center gap-8">
          <TimerDisplay timeLeft={timeLeft} totalTime={totalTimeValue} phase={phase} />
          <CountdownWidget />
        </motion.div>

        {/* Right Side: Info & Controls */}
        <motion.div layout className="flex-grow flex flex-col items-center lg:items-start justify-center relative z-10 w-full min-w-0">
          <div className="w-full mb-10 text-center lg:text-left">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4 border border-slate-200"
            >
              {t('timer.focusCompanion')}
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-normal text-slate-900 leading-tight font-heading">
              {t('timer.studyBuddy')}
            </h1>
          </div>

          <div className="w-full flex flex-col items-center lg:items-start space-y-8">
            <motion.div
              key={completedSessions}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="px-8 py-3 bg-white/80 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-400 border border-slate-100 shadow-sm"
            >
              {t('timer.cycle')} #{completedSessions + 1}
            </motion.div>

            <TimerControls
              isActive={isActive}
              onStartPause={handleToggle}
              onReset={handleReset}
              onSkip={handleSkip}
            />

            {todayStats && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="pt-8 border-t border-slate-100 w-full flex flex-col sm:flex-row gap-8 justify-center lg:justify-start"
              >
                <div className="space-y-1 text-center lg:text-left">
                  <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{t('timer.todayFocus')}</div>
                  <div className="text-2xl font-bold text-indigo-500">{todayStats.total_focus_minutes} <span className="text-xs uppercase font-bold text-slate-400">{t('timer.minutes')}</span></div>
                </div>
                <div className="space-y-1 text-center lg:text-left">
                  <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{t('timer.totalSessions')}</div>
                  <div className="text-2xl font-bold text-rose-500">{todayStats.total_sessions}</div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Right Floating Nav (Pro Max Design) */}
        <div className="absolute right-[-40px] top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4">
          <motion.button
            whileHover={{ x: 8 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/library')}
            className={`w-20 h-20 bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl flex items-center justify-center group border ${isShinchanTheme
                ? 'border-[#40C4FF]/30 text-[#0277BD] hover:bg-[#40C4FF]/10'
                : 'border-white text-indigo-500'
              }`}
          >
            <BookIcon size={24} strokeWidth={2.5} className="group-hover:rotate-6 transition-transform" />
          </motion.button>
          <motion.button
            whileHover={{ x: 8 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/settings')}
            className={`w-20 h-20 bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl flex items-center justify-center group border ${isShinchanTheme
                ? 'border-[#FF6B6B]/30 text-[#C62828] hover:bg-[#FF6B6B]/10'
                : 'border-white text-orange-500'
              }`}
          >
            <SettingsIcon size={24} strokeWidth={2.5} className="group-hover:rotate-6 transition-transform" />
          </motion.button>
        </div>
      </motion.div>
    </LayoutGroup>
  );
};

export default PomodoroTimer;
