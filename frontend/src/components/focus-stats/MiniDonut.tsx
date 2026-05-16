import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface MiniDonutProps {
    data: Array<{ name: string; value: number }>;
    getColor: (name: string, index: number) => string;
    size?: number;
    thickness?: number;
    label?: string;
}

const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
};

const describeDonutSlice = (
    cx: number, cy: number, rOuter: number, rInner: number, startAngle: number, endAngle: number,
) => {
    const sweep = endAngle - startAngle;
    if (sweep <= 0) return '';
    if (sweep >= 360 - 0.0001) {
        const half = startAngle + 180;
        return [
            describeDonutSlice(cx, cy, rOuter, rInner, startAngle, half),
            describeDonutSlice(cx, cy, rOuter, rInner, half, endAngle),
        ].join(' ');
    }
    const largeArc = sweep > 180 ? 1 : 0;
    const oStart = polarToCartesian(cx, cy, rOuter, startAngle);
    const oEnd = polarToCartesian(cx, cy, rOuter, endAngle);
    const iEnd = polarToCartesian(cx, cy, rInner, endAngle);
    const iStart = polarToCartesian(cx, cy, rInner, startAngle);
    return [
        `M ${oStart.x} ${oStart.y}`,
        `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${oEnd.x} ${oEnd.y}`,
        `L ${iEnd.x} ${iEnd.y}`,
        `A ${rInner} ${rInner} 0 ${largeArc} 0 ${iStart.x} ${iStart.y}`,
        'Z',
    ].join(' ');
};

const MiniDonut: React.FC<MiniDonutProps> = ({ data, getColor, size = 80, thickness = 16, label }) => {
    const segments = useMemo(() => {
        const total = data.reduce((sum, d) => sum + d.value, 0);
        let cum = 0;
        return data
            .filter(d => d.value > 0)
            .map((d, i) => {
                const percentage = total > 0 ? (d.value / total) * 100 : 0;
                const startAngle = cum;
                const endAngle = cum + percentage * 3.6;
                cum = endAngle;
                return {
                    ...d,
                    percentage,
                    startAngle,
                    endAngle,
                    color: getColor(d.name, i),
                };
            });
    }, [data, getColor]);

    const total = data.reduce((sum, d) => sum + d.value, 0);
    const cx = 60;
    const cy = 60;
    const rOuter = 40;
    const rInner = Math.max(10, rOuter - thickness);

    return (
        <div className="flex flex-col items-center" style={{ width: size }}>
            <svg viewBox="0 0 120 120" style={{ width: size, height: size, overflow: 'visible' }}>
                {segments.length > 0 ? (
                    segments.map((seg, i) => (
                        <motion.path
                            key={seg.name}
                            d={describeDonutSlice(cx, cy, rOuter, rInner, seg.startAngle, seg.endAngle)}
                            fill={seg.color}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                        />
                    ))
                ) : (
                    <circle
                        cx={cx}
                        cy={cy}
                        r={(rOuter + rInner) / 2}
                        fill="transparent"
                        stroke="rgba(0,0,0,0.08)"
                        strokeWidth={rOuter - rInner}
                    />
                )}
            </svg>
            {label && (
                <div className="text-center mt-1">
                    <div className="text-lg font-black text-theme-text tabular-nums leading-none">{total}</div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-theme-text-muted/70">
                        {label}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MiniDonut;
