import React from 'react';

interface ChartTooltipProps {
    totalMinutes: number;
    sessionsByTheme: Record<string, number>;
    formatDuration: (minutes: number) => string;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
    totalMinutes,
    sessionsByTheme,
    formatDuration,
}) => {
    const themeNames = Object.entries(sessionsByTheme)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([theme]) => theme)
        .join(', ');
    const hasMoreThemes = Object.keys(sessionsByTheme).length > 2;

    return (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-full bg-theme-text text-theme-bg text-xs font-bold py-2 px-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:-translate-y-full whitespace-nowrap pointer-events-none z-50 shadow-xl border border-theme-border flex flex-col items-center gap-1 min-w-[80px]">
            <span>{formatDuration(totalMinutes)}</span>
            {Object.keys(sessionsByTheme).length > 0 && (
                <span className="text-[10px] font-normal text-theme-bg/60 border-t border-theme-border pt-1 mt-0.5 w-full text-center">
                    {themeNames}
                    {hasMoreThemes && '...'}
                </span>
            )}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-theme-text rotate-45 border-r border-b border-theme-border" />
        </div>
    );
};
