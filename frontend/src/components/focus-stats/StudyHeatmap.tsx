import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StatsRangeResponse } from '../../api/client';

interface StudyHeatmapProps {
    stats: StatsRangeResponse | null;
    formatDuration: (minutes: number) => string;
}

/** 把分钟数映射到 0-4 等级，便于颜色分层。 */
const intensityLevel = (mins: number): 0 | 1 | 2 | 3 | 4 => {
    if (mins <= 0) return 0;
    if (mins < 30) return 1;
    if (mins < 60) return 2;
    if (mins < 120) return 3;
    return 4;
};

// Tailwind 不支持运行时动态拼接 class，所以显式枚举颜色等级。
// 0 为空，1-4 为活跃强度，色调从浅 amber 逐级加深。
const cellColorClass: Record<0 | 1 | 2 | 3 | 4, string> = {
    0: 'bg-slate-200/50',
    1: 'bg-amber-300',
    2: 'bg-amber-400',
    3: 'bg-amber-500',
    4: 'bg-amber-600',
};

const todayStr = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
})();

export const StudyHeatmap: React.FC<StudyHeatmapProps> = ({ stats, formatDuration }) => {
    const { t, i18n } = useTranslation();
    const [hover, setHover] = useState<{ date: string; mins: number; x: number; y: number } | null>(null);

    // 把 daily_stats 按周组织成 7×N 网格：列=周（从最早到今天），行=周一..周日。
    const { weeks, monthLabels, totalMinutes, activeDays } = useMemo(() => {
        const daily = stats?.daily_stats || [];
        if (daily.length === 0) return { weeks: [], monthLabels: [], totalMinutes: 0, activeDays: 0 };

        // 找出第一周的周一作为对齐起点
        const firstDate = new Date(daily[0].date);
        const dow = firstDate.getDay(); // 0=Sun, 1=Mon..
        const offsetToMon = dow === 0 ? 6 : dow - 1;
        const gridStart = new Date(firstDate);
        gridStart.setDate(firstDate.getDate() - offsetToMon);

        // 用 date 索引方便填充
        const byDate = new Map(daily.map(d => [d.date, d]));

        const lastDate = new Date(daily[daily.length - 1].date);
        const totalDays = Math.floor((lastDate.getTime() - gridStart.getTime()) / 86400000) + 1;
        const totalWeeks = Math.ceil(totalDays / 7);

        const weeks: Array<Array<{ date: string; minutes: number; inRange: boolean } | null>> = [];
        for (let w = 0; w < totalWeeks; w++) {
            const week: Array<{ date: string; minutes: number; inRange: boolean } | null> = [];
            for (let d = 0; d < 7; d++) {
                const cellDate = new Date(gridStart);
                cellDate.setDate(gridStart.getDate() + w * 7 + d);
                const cellStr = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;
                const entry = byDate.get(cellStr);
                week.push({
                    date: cellStr,
                    minutes: entry?.total_focus_minutes ?? 0,
                    inRange: !!entry,
                });
            }
            weeks.push(week);
        }

        // 月份标签：每周第一天（周一）所属月份，相比上一周变化时显示
        const monthLabels: Array<{ index: number; label: string }> = [];
        let lastMonth = -1;
        weeks.forEach((week, idx) => {
            const monday = week[0];
            if (!monday) return;
            const date = new Date(monday.date);
            const month = date.getMonth();
            if (month !== lastMonth) {
                const isZh = (i18n.language || '').startsWith('zh');
                const label = isZh
                    ? `${month + 1}月`
                    : date.toLocaleDateString(i18n.language, { month: 'short' });
                monthLabels.push({ index: idx, label });
                lastMonth = month;
            }
        });

        const totalMinutes = daily.reduce((s, d) => s + d.total_focus_minutes, 0);
        const activeDays = daily.filter(d => d.total_focus_minutes > 0).length;

        return { weeks, monthLabels, totalMinutes, activeDays };
    }, [stats, i18n.language]);

    const hasData = activeDays > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white/70 backdrop-blur-2xl p-4 md:p-8 rounded-2xl md:rounded-[40px] border border-white/80 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]"
        >
            <div className="flex items-center justify-between mb-4 md:mb-6 flex-wrap gap-2">
                <h3 className="text-base md:text-xl font-bold text-theme-text flex items-center gap-2 min-w-0">
                    <Flame size={18} className="text-theme-text-muted/40 shrink-0" />
                    <span className="truncate">{t('stats.heatmapTitle', '学习热力图')}</span>
                </h3>
                <div className="text-[10px] md:text-xs font-bold text-theme-text-muted/70 tabular-nums flex items-center gap-3">
                    <span>
                        {activeDays} <span className="text-theme-text-muted/50 uppercase tracking-wider">{t('stats.activeDays', '活跃天')}</span>
                    </span>
                    <span className="text-theme-text-muted/30">·</span>
                    <span>{formatDuration(totalMinutes)}</span>
                </div>
            </div>

            <div className="overflow-x-auto heatmap-scroll -mx-1 px-1">
                <div className="flex flex-col gap-1.5 min-w-full">
                    {/* 月份标签行 */}
                    <div className="flex gap-[3px]">
                        {weeks.map((_, wIdx) => {
                            const label = monthLabels.find(m => m.index === wIdx)?.label;
                            return (
                                <span
                                    key={wIdx}
                                    className="text-[9px] md:text-[10px] font-bold text-theme-text-muted/60 tracking-wider whitespace-nowrap text-left flex-1 min-w-[18px] md:min-w-[14px] max-w-[28px]"
                                >
                                    {label || ''}
                                </span>
                            );
                        })}
                    </div>

                    {/* 网格主体：每列一周（7 个格子从周一到周日），flex-1 自动铺满宽度 */}
                    <div className="flex gap-[3px]">
                            {weeks.map((week, wIdx) => (
                                <div key={wIdx} className="flex flex-col gap-[3px] flex-1 min-w-[18px] md:min-w-[14px] max-w-[28px]">
                                    {week.map((cell, dIdx) => {
                                        if (!cell) {
                                            return <div key={`${wIdx}-${dIdx}-empty`} className="aspect-square" />;
                                        }
                                        const lvl = intensityLevel(cell.minutes);
                                        const isToday = cell.date === todayStr;
                                        const inFuture = new Date(cell.date) > new Date(todayStr);
                                        return (
                                            <button
                                                key={`${wIdx}-${dIdx}`}
                                                type="button"
                                                disabled={inFuture}
                                                onMouseEnter={(e) => {
                                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                    setHover({
                                                        date: cell.date,
                                                        mins: cell.minutes,
                                                        x: rect.left + rect.width / 2,
                                                        y: rect.top,
                                                    });
                                                }}
                                                onMouseLeave={() => setHover(null)}
                                                title={`${cell.date} · ${formatDuration(cell.minutes)}`}
                                                className={`aspect-square rounded-[3px] ${inFuture ? 'bg-transparent' : cellColorClass[lvl]} ${isToday ? 'ring-1 ring-theme-text/40' : ''} transition-transform active:scale-90 disabled:cursor-default`}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {/* 图例 */}
            <div className="flex items-center justify-end gap-1.5 mt-3 md:mt-4 text-[9px] md:text-[10px] font-bold text-theme-text-muted/60 tracking-wider">
                <span>{t('stats.heatmapLess', '少')}</span>
                {([0, 1, 2, 3, 4] as const).map(lvl => (
                    <span key={lvl} className={`inline-block w-2.5 h-2.5 md:w-3 md:h-3 rounded-[2px] ${cellColorClass[lvl]}`} />
                ))}
                <span>{t('stats.heatmapMore', '多')}</span>
            </div>

            {!hasData && (
                <div className="text-center text-xs text-theme-text-muted/60 mt-3">
                    {t('stats.heatmapEmpty', '今年还没有专注记录')}
                </div>
            )}

            {hover && (
                <div
                    className="hidden md:block pointer-events-none fixed z-[1000] bg-slate-900 text-white text-[11px] font-bold rounded-lg px-2.5 py-1.5 shadow-xl whitespace-nowrap"
                    style={{ left: hover.x, top: hover.y - 6, transform: 'translate(-50%, -100%)' }}
                >
                    {hover.date} · {formatDuration(hover.mins)}
                </div>
            )}
        </motion.div>
    );
};
