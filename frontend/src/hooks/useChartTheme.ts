import { useTimerContext } from '../contexts/TimerContext';

export const useChartTheme = () => {
    const { activeVisualTheme } = useTimerContext();

    const chartColors = [
        activeVisualTheme.colors.primary,
        activeVisualTheme.colors.secondary,
        activeVisualTheme.colors.accent,
        '#FBBF24', // A yellow that works in most themes
        '#A78BFA', // A lavender that works in most themes
    ];

    const getChartColorForTheme = (themeName: string, _index: number) => {
        // Simple hashing function to get a consistent color index for a theme name
        let hash = 0;
        for (let i = 0; i < themeName.length; i++) {
            hash = themeName.charCodeAt(i) + ((hash << 5) - hash);
        }
        return chartColors[Math.abs(hash) % chartColors.length];
    };

    return { chartColors, getChartColorForTheme, activeVisualTheme };
};
