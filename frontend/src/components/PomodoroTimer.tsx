import React, { useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Book as BookIcon } from 'lucide-react';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { CozyPalHandle } from './CozyPal';
import CozyPal from './CozyPal';
import { TimerDisplay } from './TimerDisplay';
import TimerControls from './TimerControls';
import CountdownWidget from './CountdownWidget';
import { useTimerContext } from '../contexts/TimerContext';
import { useNavigate } from 'react-router-dom';

const PomodoroTimer: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const currentLanguage = i18n.language;

  const {
    state,
    timeLeft,
    isActive,
    totalTimeValue,
    todayStats,
    handleToggle,
    handleReset,
    handleSkip,
    activeTheme,
    initialLoaded
  } = useTimerContext();

  const { phase, completedSessions, settings } = state;

  const cozyPalRef = useRef<CozyPalHandle>(null);
  const prevPhaseRef = useRef(phase);

  // AI Proactive Messages (UI Side)
  // We keep this here because CozyPal is part of the view.
  // If the user navigates away, they won't see the message, which is expected behavior for now.
  useEffect(() => {
    if (prevPhaseRef.current !== phase) {
      if (phase === 'focus') {
        cozyPalRef.current?.triggerProactiveMessage('focus_start', totalTimeValue);
      } else if (phase === 'shortBreak' || phase === 'longBreak') {
        cozyPalRef.current?.triggerProactiveMessage('break_start', totalTimeValue);
      }
      prevPhaseRef.current = phase;
    }
  }, [phase, totalTimeValue]);

  useEffect(() => {
    if (isActive) {
      if (phase === 'focus' && timeLeft === 60) {
        cozyPalRef.current?.triggerProactiveMessage('focus_near_end', 60);
      } else if (phase !== 'focus' && timeLeft === 30) {
        cozyPalRef.current?.triggerProactiveMessage('break_near_end', 30);
      }
    }
  }, [timeLeft, phase, isActive]);

  const handleStartCallback = React.useCallback(() => {
    // Trigger message on manual start if at beginning
    if (timeLeft === totalTimeValue) {
      if (phase === 'focus') {
        cozyPalRef.current?.triggerProactiveMessage('focus_start', totalTimeValue);
      } else {
        cozyPalRef.current?.triggerProactiveMessage('break_start', totalTimeValue);
      }
    }
    handleToggle();
  }, [timeLeft, totalTimeValue, phase, handleToggle]);


  return (
    <LayoutGroup>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[420px] md:max-w-[480px] lg:max-w-[1024px] xl:max-w-[1100px] rounded-[48px] md:rounded-[72px] p-6 md:p-10 lg:p-16 flex flex-col lg:flex-row items-center lg:items-center gap-6 md:gap-10 lg:gap-24 relative transition-all duration-700 mx-auto"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF9F0 50%, #FFFFFF 100%)',
          boxShadow: '0 20px 60px -10px rgba(74, 68, 57, 0.12), 0 8px 30px -8px rgba(74, 68, 57, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
        }}
      >
        <AnimatePresence>
          {!initialLoaded && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/90 flex items-center justify-center rounded-[56px] md:rounded-[72px]"
            >
              <div className="text-cozy-text font-bold">Loading settings...</div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div layout className="flex-shrink-0 flex flex-col items-center justify-center gap-6">
          <TimerDisplay timeLeft={timeLeft} totalTime={totalTimeValue} phase={phase} />
          <CountdownWidget />
        </motion.div>

        <motion.div layout className="flex-grow flex flex-col items-center lg:items-start justify-center relative z-10 w-full lg:max-w-[420px] min-w-0">
          <div className="w-full mb-8 lg:mb-12">
            <div className="flex flex-col">
              <span className="text-[11px] md:text-xs font-black uppercase tracking-[0.3em] text-cozy-text-light/50 ml-1 mb-2">{t('timer.focusCompanion')}</span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-normal text-cozy-text/90 leading-tight font-heading">{t('timer.studyBuddy')}</h1>
            </div>
          </div>


          <div className="w-full flex flex-col items-center lg:items-start">
            <motion.div
              key={completedSessions}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 lg:mb-14 px-8 py-2.5 bg-cozy-cream/50 rounded-full text-xs md:text-sm font-black uppercase tracking-[0.2em] text-cozy-text-light/70 border border-white shadow-sm"
            >
              {t('timer.cycle')} #{completedSessions + 1}
            </motion.div>
            <div className="lg:pl-2">
              <TimerControls
                isActive={isActive}
                onStartPause={handleStartCallback}
                onReset={handleReset}
                onSkip={handleSkip}
              />
            </div>

            {todayStats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6 lg:mt-8 text-sm text-cozy-text-light/80 text-center lg:text-left"
              >
                {t('timer.todayFocus')}: <span className="font-bold text-cozy-orange">{todayStats.total_focus_minutes} {t('timer.minutes')}</span>
                <br />{t('timer.totalSessions')}: <span className="font-bold text-cozy-orange">{todayStats.total_sessions}</span>
              </motion.div>
            )}

          </div>
        </motion.div>

        {/* Responsive Navigation Bar */}
        <div className="absolute lg:right-[-28px] xl:right-[-40px] lg:top-1/2 lg:-translate-y-1/2 bottom-[-20px] left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 flex flex-col gap-3 z-50">
          <motion.div
            initial={{ opacity: 0, y: 20, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-row lg:flex-col bg-white/90 backdrop-blur-2xl p-1.5 rounded-[32px] lg:rounded-[40px] shadow-2xl border border-white items-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(99, 102, 241, 0.05)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/library')}
              className="flex flex-col items-center gap-1 p-3 md:p-4 rounded-[24px] lg:rounded-[32px] text-indigo-500 transition-all group min-w-[70px] md:min-w-0"
            >
              <div className="p-2 md:p-2.5 bg-indigo-50/50 group-hover:bg-indigo-100/50 rounded-xl lg:rounded-2xl transition-colors">
                <BookIcon size={20} strokeWidth={2.5} />
              </div>
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-indigo-400/80 group-hover:text-indigo-600 transition-colors">
                {t('common.library')}
              </span>
            </motion.button>

            <div className="w-px h-8 lg:w-10 lg:h-px bg-gray-100/80 mx-2 lg:mx-auto lg:my-1" />

            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/settings')}
              className="flex flex-col items-center gap-1 p-3 md:p-4 rounded-[24px] lg:rounded-[32px] text-orange-500 transition-all group min-w-[70px] md:min-w-0"
            >
              <div className="p-2 md:p-2.5 bg-orange-50/50 group-hover:bg-orange-100/50 rounded-xl lg:rounded-2xl transition-colors">
                <SettingsIcon size={20} strokeWidth={2.5} />
              </div>
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-orange-400/80 group-hover:text-orange-600 transition-colors">
                {t('common.settings')}
              </span>
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
      <CozyPal
        ref={cozyPalRef}
        themeName={activeTheme?.name || 'English'}
        phase={phase}
        timeLeft={timeLeft}
        apiKey={settings.googleApiKey}
        currentLanguage={currentLanguage}
        aiPersona={settings.aiPersona || 'gentle_encourager'}
        aiProvider={settings.aiProvider || 'gemini'}
        aiModel={settings.aiModel}
        dailyCompletedPomodoros={todayStats?.total_sessions || 0}
        totalFocusMinutes={todayStats?.total_focus_minutes || 0}
      />
    </LayoutGroup>
  );
};

export default PomodoroTimer;
