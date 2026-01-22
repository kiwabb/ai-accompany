import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { FocusTheme } from '../types/pomodoro';

interface ThemeSelectorProps {
  themes: FocusTheme[];
  activeThemeId: string;
  onSelect: (themeId: string) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ themes, activeThemeId, onSelect }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap justify-center lg:justify-start gap-3 md:gap-4 p-2 md:p-3 rounded-[2rem] lg:rounded-[2.5rem] bg-cozy-cream/30 border border-cozy-text/5 transition-all">
      {themes.map((theme) => (
        <motion.button
          key={theme.id}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(theme.id)}
          className={`
            px-5 py-2.5 md:px-7 md:py-3 rounded-full text-xs md:text-sm font-bold transition-all duration-300
            ${activeThemeId === theme.id
              ? 'bg-cozy-orange text-white shadow-lg shadow-cozy-orange/30 scale-105 md:scale-110'
              : 'bg-white/80 text-cozy-text-light hover:bg-white hover:text-cozy-text shadow-sm border border-cozy-text/5'}
          `}
        >
          {theme.isDefault ? t(`themes.${theme.name.toLowerCase()}`, theme.name) : theme.name}
        </motion.button>
      ))}
    </div>
  );
};

export default React.memo(ThemeSelector);
