import React from 'react';
import { motion } from 'framer-motion';
import type { DailyStat } from '../../api/client';

interface MiniBarsProps {
    dailyStats: DailyStat[];
    getColor: (themeName: string, index: number) => string;
    height?: number;
    label?: string;
}

const parseLocalDate = (s: string): Date => {
    const [yy, mm, dd] = s.split('-').map(Number);
    return new Date(yy, (mm || 1) - 1, dd || 1);
};

const MiniBars: React.FC<MiniBarsProps> = ({ dailyStats, getColor, height = 56, label }) => {
    const yMax = Math.max(1, ...dailyStats.map(d => d.total_focus_minutes));
    return (
        <div className="w-full">
            {label && (
                <div className="text-[9px] font-bold uppercase tracking-widest text-theme-text-muted/70 mb-1.5">
                    {label}
                </div>
            )}
            <div
                className="flex items-end justify-around gap-[2px]"
                style={{
                    height,
                    borderBottom: '1px solid rgba(0,0,0,0.18)',
                    borderLeft: '1px solid rgba(0,0,0,0.18)',
                    paddingLeft: 4,
                    paddingRight: 2,
                    paddingTop: 2,
                }}
            >
                {dailyStats.map((day, idx) => {
                    const total = day.total_focus_minutes;
                    const heightPct = (total / yMax) * 100;
                    const themeEntries = Object.entries(day.sessions_by_theme);
                    return (
                        <div
                            key={day.date}
                            className="flex-1 h-full flex items-end justify-center min-w-0"
                        >
                            {total > 0 ? (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${heightPct}%` }}
                                    transition={{ duration: 0.5, delay: idx * 0.02, ease: 'easeOut' }}
                                    className="w-full max-w-[10px] flex flex-col-reverse overflow-hidden"
                                    style={{ borderTopLeftRadius: 1.5, borderTopRightRadius: 1.5 }}
                                >
                                    {themeEntries.length > 0 ? (
                                        themeEntries.map(([theme, mins], i) => {
                                            const segPct = total > 0 ? (mins / total) * 100 : 0;
                                            return (
                                                <div
                                                    key={theme + i}
                                                    style={{
                                                        height: `${segPct}%`,
                                                        backgroundColor: getColor(theme, i),
                                                    }}
                                                />
                                            );
                                        })
                                    ) : (
                                        <div className="h-full w-full bg-cozy-orange/70" />
                                    )}
                                </motion.div>
                            ) : (
                                <div
                                    className="w-full max-w-[10px]"
                                    style={{ height: 2, backgroundColor: 'rgba(0,0,0,0.08)' }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-around gap-[2px] mt-1 pl-1 pr-0.5">
                {dailyStats.map((day) => {
                    const date = parseLocalDate(day.date);
                    return (
                        <div
                            key={day.date}
                            className="flex-1 text-center text-[8px] font-bold uppercase tracking-wider text-theme-text-muted/70 min-w-0"
                        >
                            {date.getDate()}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MiniBars;
