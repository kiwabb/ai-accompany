import React from 'react';
import { motion } from 'framer-motion';

const AmbientBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {/* Primary Glow */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    x: [0, 20, 0],
                    y: [0, 15, 0],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-cozy-orange/10 rounded-full blur-[140px]"
            />

            {/* Secondary Glow */}
            <motion.div
                animate={{
                    scale: [1.1, 1, 1.1],
                    x: [0, -25, 0],
                    y: [0, -10, 0],
                    opacity: [0.4, 0.6, 0.4]
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-cozy-green/10 rounded-full blur-[160px]"
            />

            {/* Subtle Texture Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] mix-blend-overlay" />

            {/* Soft Grain for Depth */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] blur-[1px]" />
        </div>
    );
};

export default AmbientBackground;
