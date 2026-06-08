import { useTimerContext } from '../contexts/useTimerContext';
import { VISUAL_THEMES, DEFAULT_VISUAL_THEME_ID } from '../constants/themes';

export const useChartTheme = () => {
    const { state } = useTimerContext();
    const activeVisualThemeId = state.activeVisualThemeId || DEFAULT_VISUAL_THEME_ID;
    
    const activeVisualTheme = VISUAL_THEMES.find(t => t.id === activeVisualThemeId) || VISUAL_THEMES[0];

    const chartColors = [
        activeVisualTheme.colors.primary,
        activeVisualTheme.colors.secondary,
        activeVisualTheme.colors.accent,
        '#FBBF24', // A yellow that works in most themes
        '#A78BFA', // A lavender that works in most themes
    ];

    const getChartColorForTheme = (themeName: string) => {
        // Simple hashing function to get a consistent color index for a theme name
        let hash = 0;
        for (let i = 0; i < themeName.length; i++) {
            hash = themeName.charCodeAt(i) + ((hash << 5) - hash);
        }
        return chartColors[Math.abs(hash) % chartColors.length];
    };

    return { chartColors, getChartColorForTheme, activeVisualTheme };
};
