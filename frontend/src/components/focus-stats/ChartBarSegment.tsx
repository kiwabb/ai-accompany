import React from 'react';

interface ChartBarSegmentProps {
    theme: string;
    minutes: number;
    totalMinutes: number;
    color: string;
    index: number;
    totalSegments: number;
    isToday: boolean;
    activeVisualTheme: { colors: { primary: string } };
}

export const ChartBarSegment: React.FC<ChartBarSegmentProps> = ({
    minutes,
    totalMinutes,
    color,
    index,
    totalSegments,
}) => {
    const percentage = (minutes / totalMinutes) * 100;

    return (
        <div
            className="w-full transition-colors relative group/segment"
            style={{ height: `${percentage}%`, backgroundColor: color }}
        >
            {index < totalSegments - 1 && (
                <div className="absolute top-0 left-0 w-full h-[1px] bg-theme-bg/50" />
            )}
        </div>
    );
};

interface EmptyBarSegmentProps {
    isToday: boolean;
    activeVisualTheme: { colors: { primary: string } };
}

export const EmptyBarSegment: React.FC<EmptyBarSegmentProps> = ({
    isToday,
    activeVisualTheme,
}) => (
    <div
        className="w-full h-full"
        style={{
            backgroundColor: isToday
                ? activeVisualTheme.colors.primary
                : `${activeVisualTheme.colors.primary}33`,
        }}
    />
);
