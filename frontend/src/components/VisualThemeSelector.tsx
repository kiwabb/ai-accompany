import React from 'react';
import { motion } from 'framer-motion';
import { VISUAL_THEMES } from '../constants/themes';
import { useTimerContext } from '../contexts/TimerContext';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';


const VisualThemeSelector: React.FC = () => {
  const { t } = useTranslation();
  const { state, handleVisualThemeChange, handleUpdateSetting } = useTimerContext();
  const { activeVisualThemeId, settings } = state;
  const useDefaultIcon = settings.useDefaultThemeIcon !== false;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {VISUAL_THEMES.map((theme) => (
        <motion.button
          key={theme.id}
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleVisualThemeChange(theme.id)}
          className={`
            relative p-4 rounded-3xl border-2 transition-all duration-300 flex flex-col items-start gap-3
            ${activeVisualThemeId === theme.id
              ? 'border-cozy-orange bg-white shadow-xl'
              : 'border-transparent bg-slate-50 hover:bg-white hover:shadow-md'}
          `}
        >
          <div className="flex items-center justify-between w-full">
            <span className={`text-sm font-bold ${activeVisualThemeId === theme.id ? 'text-slate-900' : 'text-slate-500'}`}>
              {theme.name}
            </span>
            {activeVisualThemeId === theme.id && (
              <div className="w-5 h-5 rounded-full bg-cozy-orange flex items-center justify-center">
                <Check size={12} className="text-white" strokeWidth={3} />
              </div>
            )}
          </div>
          
          <div className="flex gap-1.5">
            <div className="w-6 h-6 rounded-full border border-black/5" style={{ backgroundColor: theme.colors.bg }} />
            <div className="w-6 h-6 rounded-full border border-black/5" style={{ backgroundColor: theme.colors.primary }} />
            <div className="w-6 h-6 rounded-full border border-black/5" style={{ backgroundColor: theme.colors.accent }} />
          </div>

          {theme.id === 'chiikawa' && (
             <div className="absolute -top-2 -right-2 bg-pink-400 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter animate-bounce-gentle">
               New
             </div>
          )}
        </motion.button>
      ))}
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-[24px] p-5 border border-white shadow-sm flex items-center gap-6">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">
            {t('settings.useDefaultThemeIcon', '使用主题默认图标')}
          </label>
          <p className="text-sm text-slate-400 font-medium">
            {t('settings.useDefaultThemeIconDesc', '开:首页显示主题自带图标;关:使用专注主题列表里设置的图标')}
          </p>
        </div>
        <button
          onClick={() => handleUpdateSetting({ useDefaultThemeIcon: !useDefaultIcon })}
          className={`w-16 h-8 rounded-full transition-all duration-300 relative shrink-0
            ${useDefaultIcon ? 'bg-indigo-500' : 'bg-slate-200'}`}
        >
          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300
            ${useDefaultIcon ? 'left-9' : 'left-1'}`} />
        </button>
      </div>
    </div>
  );
};

export default VisualThemeSelector;
