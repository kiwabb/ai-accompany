import { useEffect, useMemo } from 'react';
import { VISUAL_THEMES, DEFAULT_VISUAL_THEME_ID } from '../constants/themes';
import type { VisualTheme } from '../types/pomodoro';

interface UseVisualThemeProps {
  activeVisualThemeId?: string;
}

export const useVisualTheme = ({ activeVisualThemeId }: UseVisualThemeProps) => {
  const themeId = activeVisualThemeId || DEFAULT_VISUAL_THEME_ID;

  const activeTheme = useMemo(() => {
    return VISUAL_THEMES.find(t => t.id === themeId) || VISUAL_THEMES[0];
  }, [themeId]);

  // Apply theme CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;
    const { colors, shadows, borderRadius, fontHeading, fontSans } = activeTheme;

    // Set CSS custom properties
    root.style.setProperty('--theme-bg', colors.bg);
    root.style.setProperty('--theme-surface', colors.surface);
    root.style.setProperty('--theme-glass', colors.glass);
    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-secondary', colors.secondary);
    root.style.setProperty('--theme-accent', colors.accent);
    root.style.setProperty('--theme-text', colors.text);
    root.style.setProperty('--theme-text-muted', colors.textMuted);
    root.style.setProperty('--theme-border', colors.border);
    root.style.setProperty('--theme-shadow-cozy', shadows.cozy);
    root.style.setProperty('--theme-shadow-elevated', shadows.elevated);
    root.style.setProperty('--theme-border-radius', borderRadius);
    root.style.setProperty('--font-heading', fontHeading);
    root.style.setProperty('--font-sans', fontSans);

    // Apply theme-specific body class
    document.body.classList.remove('theme-cozy', 'theme-chiikawa', 'theme-dark');
    document.body.classList.add(`theme-${activeTheme.id}`);

    // Update background color immediately
    document.body.style.backgroundColor = colors.bg;
    document.body.style.color = colors.text;

  }, [activeTheme]);

  const isChiikawaTheme = activeTheme.id === 'chiikawa';
  const showDecorations = activeTheme.decorations?.enabled ?? false;
  const showFloatingElements = activeTheme.decorations?.floatingElements ?? false;

  return {
    activeTheme,
    isChiikawaTheme,
    showDecorations,
    showFloatingElements,
    themeColors: activeTheme.colors,
  };
};

export const getThemeById = (id: string): VisualTheme => {
  return VISUAL_THEMES.find(t => t.id === id) || VISUAL_THEMES[0];
};
