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
    <div className="flex flex-wrap justify-center lg:justify-start gap-3 md:gap-4 p-2 md:p-3 rounded-[2rem] lg:rounded-[2.5rem] glass-surface transition-all">
      {themes.map((theme) => (
        <motion.button
          key={theme.id}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(theme.id)}
          className={`
            px-5 py-2.5 md:px-7 md:py-3 rounded-full text-xs md:text-sm font-bold transition-all duration-300
            ${activeThemeId === theme.id
              ? 'bg-gradient-to-br from-[#FFB766] to-[#FF9A33] text-white shadow-lg glow-hover scale-105 md:scale-110'
              : 'glass-surface text-cozy-text-light hover:text-cozy-text shadow-sm lift-hover'}
          `}
          aria-pressed={activeThemeId === theme.id}
        >
          {theme.isDefault ? t(`themes.${theme.name.toLowerCase()}`, theme.name) : theme.name}
        </motion.button>
      ))}
    </div>
  );
};

export default React.memo(ThemeSelector);
