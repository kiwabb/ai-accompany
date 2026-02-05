import React from 'react';
import { motion } from 'framer-motion';
import { VISUAL_THEMES } from '../constants/themes';
import { useTimerContext } from '../contexts/TimerContext';
import { Check } from 'lucide-react';


const VisualThemeSelector: React.FC = () => {
  const { state, handleVisualThemeChange } = useTimerContext();
  const { activeVisualThemeId } = state;

  return (
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
  );
};

export default VisualThemeSelector;
