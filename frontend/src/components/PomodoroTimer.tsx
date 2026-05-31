import React, { useRef, useState, useEffect } from 'react';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, Bell, BellOff, Minus, Plus, Coffee } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TimerDisplay } from './TimerDisplay';
import TimerControls from './TimerControls';
import CountdownWidget from './CountdownWidget';
import { useTimerContext } from '../contexts/TimerContext';

const PomodoroTimer: React.FC = () => {
  const { t } = useTranslation();

  const {
    state,
    timeLeft,
    isActive,
    totalTimeValue,
    todayStats,
    handleToggle,
    handleReset,
    handleSkip,
    handleUpdateSetting,
    initialLoaded
  } = useTimerContext();

  const { phase, completedSessions, settings } = state;
  const soundEnabled = settings.enableSounds !== false;

  const cardRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <LayoutGroup>
      <motion.div
        ref={cardRef}
        layout
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-5xl rounded-2xl md:rounded-[64px] p-5 sm:p-10 md:p-16 flex flex-col lg:flex-row items-center gap-0 lg:gap-24 relative transition-all duration-700 mx-auto bg-white/60 backdrop-blur-3xl border border-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)]"
      >
        {/* Top-right card controls */}
        <div className="absolute top-3 right-3 md:top-6 md:right-6 flex items-center gap-2 z-20">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleUpdateSetting({ enableSounds: !soundEnabled })}
            title={soundEnabled ? t('settings.soundEffects', '关闭提示音') : t('settings.soundEffects', '开启提示音')}
            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-colors border ${
              soundEnabled
                ? 'bg-indigo-50 border-indigo-100 text-indigo-500 hover:bg-indigo-100'
                : 'bg-slate-50 border-slate-100 text-slate-300 hover:bg-slate-100 hover:text-slate-500'
            }`}
          >
            {soundEnabled ? <Bell size={15} strokeWidth={2.5} /> : <BellOff size={15} strokeWidth={2.5} />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleFullscreen}
            title={isFullscreen ? t('reader.exitFullscreen', '退出全屏') : t('reader.fullscreen', '全屏')}
            className="w-9 h-9 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            {isFullscreen ? <Minimize2 size={15} strokeWidth={2.5} /> : <Maximize2 size={15} strokeWidth={2.5} />}
          </motion.button>
        </div>

        <AnimatePresence>
          {!initialLoaded && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/40 backdrop-blur-3xl flex items-center justify-center rounded-2xl md:rounded-[64px]"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                <div className="text-slate-900 font-bold uppercase tracking-[0.2em] text-[10px]">{t('timer.loading')}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top-left compact title (portrait only) */}
        <div className="lg:hidden absolute top-3 left-3 md:top-6 md:left-6 z-20">
          <h1 className="text-sm font-bold text-slate-900 font-heading">
            {t('timer.studyBuddy')}
          </h1>
        </div>

        {/* Left Side: Timer Circle */}
        <motion.div layout className="flex-shrink-0 flex flex-col items-center justify-center">
          <TimerDisplay timeLeft={timeLeft} totalTime={totalTimeValue} phase={phase} />
          <div className="hidden lg:block w-full">
            <CountdownWidget />
          </div>
        </motion.div>

        {/* Right Side: Info & Controls */}
        <motion.div layout className="flex-grow flex flex-col items-center lg:items-start justify-center relative z-10 w-full min-w-0">
          <div className="hidden lg:block w-full mb-10 text-center lg:text-left">
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

          <div className="w-full flex flex-col items-center lg:items-start space-y-4 md:space-y-8">
            {/* Cycle indicator */}
            {(() => {
              const interval = Math.max(1, settings.longBreakInterval || 4);
              const targetRounds = Math.max(1, settings.targetRounds || 4);
              // cyclePos: 1-indexed position in the current round
              const cyclePos = phase === 'focus'
                ? (completedSessions % interval) + 1
                : ((completedSessions - 1 + interval) % interval) + 1;
              const dotColor = (i: number) => {
                if (i < cyclePos - 1) return 'bg-slate-300';
                if (i === cyclePos - 1) {
                  if (phase === 'focus') return 'bg-indigo-500';
                  if (phase === 'shortBreak') return 'bg-emerald-400';
                  return 'bg-orange-400';
                }
                return 'bg-slate-100 border border-slate-200';
              };
              return (
                <motion.div
                  key={completedSessions}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col items-center lg:items-start gap-2 md:gap-3"
                >
                  {/* Dots row */}
                  <div className="flex items-center gap-2">
                    {Array.from({ length: interval }).map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <motion.div
                          key={`dot-${i}-${cyclePos}`}
                          animate={i === cyclePos - 1 && phase === 'focus' && isActive ? { scale: [1, 1.25, 1] } : {}}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className={`w-3 h-3 rounded-full transition-colors duration-300 ${dotColor(i)}`}
                        />
                        {i === interval - 1 && (
                          <Coffee size={8} className="text-orange-400 opacity-80" />
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Stepper: 循环 / 轮数 */}
                  <div className="flex items-center gap-4 md:gap-6 flex-wrap">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {t('timer.totalRounds', '轮数')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => handleUpdateSetting({ longBreakInterval: Math.max(1, interval - 1) })}
                          className="w-5 h-5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
                        >
                          <Minus size={10} strokeWidth={3} />
                        </motion.button>
                        <span className="min-w-[1.25rem] text-center text-sm font-bold text-slate-700 tabular-nums">{interval}</span>
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => handleUpdateSetting({ longBreakInterval: Math.min(8, interval + 1) })}
                          className="w-5 h-5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
                        >
                          <Plus size={10} strokeWidth={3} />
                        </motion.button>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {t('timer.cycle', '循环')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => handleUpdateSetting({ targetRounds: Math.max(1, targetRounds - 1) })}
                          className="w-5 h-5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
                        >
                          <Minus size={10} strokeWidth={3} />
                        </motion.button>
                        <span className="min-w-[1.25rem] text-center text-sm font-bold text-slate-700 tabular-nums">{targetRounds}</span>
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => handleUpdateSetting({ targetRounds: Math.min(12, targetRounds + 1) })}
                          className="w-5 h-5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
                        >
                          <Plus size={10} strokeWidth={3} />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

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
                className="pt-4 md:pt-8 border-t border-slate-100 w-full flex flex-row sm:flex-row gap-6 md:gap-8 justify-center lg:justify-start"
              >
                <div className="space-y-1 text-center lg:text-left">
                  <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{t('timer.todayFocus')}</div>
                  <div className="text-xl md:text-2xl font-bold text-indigo-500">{todayStats.total_focus_minutes} <span className="text-xs uppercase font-bold text-slate-400">{t('timer.minutes')}</span></div>
                </div>
                <div className="space-y-1 text-center lg:text-left">
                  <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{t('timer.totalSessions')}</div>
                  <div className="text-xl md:text-2xl font-bold text-rose-500">{todayStats.total_sessions}</div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Bottom CountdownWidget (portrait only) */}
        <div className="lg:hidden w-full">
          <CountdownWidget />
        </div>

      </motion.div>
    </LayoutGroup>
  );
};

export default PomodoroTimer;
