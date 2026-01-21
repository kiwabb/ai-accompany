import React from 'react';
import { motion } from 'framer-motion';
import type { FocusTheme } from '../types/pomodoro';

interface ThemeSelectorProps {
  themes: FocusTheme[];
  activeThemeId: string;
  onSelect: (themeId: string) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ themes, activeThemeId, onSelect }) => {
  return (
    <div className="flex flex-wrap justify-center gap-2.5 p-1.5 rounded-[2rem] bg-cozy-cream/30 border border-cozy-text/5">
      {themes.map((theme) => (
        <motion.button
          key={theme.id}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(theme.id)}
          className={`
            px-5 py-2 rounded-full text-xs font-bold transition-all duration-300
            ${activeThemeId === theme.id
              ? 'bg-cozy-orange text-white shadow-lg shadow-cozy-orange/30 scale-105'
              : 'bg-white/80 text-cozy-text-light hover:bg-white hover:text-cozy-text shadow-sm border border-cozy-text/5'}
          `}
        >
          {theme.name}
        </motion.button>
      ))}
    </div>
  );
};

export default React.memo(ThemeSelector);
