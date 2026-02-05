import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UserAchievementBackend } from '../api/client';

interface AchievementToastProps {
  achievement: UserAchievementBackend | null;
  onDismiss: () => void;
}

const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onDismiss }) => {
  const { t } = useTranslation();
  
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 flex justify-center pointer-events-none z-[100]"
        >
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-0.5 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden">
            <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl flex items-center gap-4 border border-white/20">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shadow-inner">
                <Trophy size={28} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <Star size={12} className="text-amber-500 fill-amber-500" />
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{t('achievements.title')}</span>
                </div>
                <h3 className="text-sm font-extrabold text-gray-900 leading-tight">
                  {t(`achievements.items.${achievement.achievement?.key}.name`, { defaultValue: achievement.achievement?.name })}
                </h3>
                <p className="text-[11px] text-gray-500 font-medium">
                  {t(`achievements.items.${achievement.achievement?.key}.description`, { defaultValue: achievement.achievement?.description })}
                </p>
              </div>
              <button 
                onClick={onDismiss}
                className="ml-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementToast;
