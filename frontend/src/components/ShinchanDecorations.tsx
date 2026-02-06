import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SHINCHAN_ELEMENTS } from '../constants/themes';

// Character sticker images
const SHINCHAN_STICKERS = [
  '/assets/shinchan/shinchan.png',
  '/assets/shinchan/shinchan-shiro.png',  // 小新和小白合照
  '/assets/shinchan/nene.png',
  '/assets/shinchan/masao.png',
  '/assets/shinchan/kazama.png',
  '/assets/shinchan/bo-chan.png',
  '/assets/shinchan/action-mask.png',
];

interface FloatingElement {
  id: number;
  content: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  type: 'sticker' | 'action' | 'chocobi' | 'star';
  isImage?: boolean;
}

interface ShinchanDecorationsProps {
  enabled: boolean;
}

const ShinchanDecorations: React.FC<ShinchanDecorationsProps> = ({ enabled }) => {
  const [elements, setElements] = useState<FloatingElement[]>([]);
  const [mouseTrail, setMouseTrail] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);
  const [cornerStickers, setCornerStickers] = useState<string[]>([]);

  // Generate random corner stickers
  useEffect(() => {
    if (enabled) {
      const shuffled = [...SHINCHAN_STICKERS].sort(() => Math.random() - 0.5);
      setCornerStickers(shuffled.slice(0, 4));
    }
  }, [enabled]);

  // Generate initial floating elements
  useEffect(() => {
    if (!enabled) {
      setElements([]);
      return;
    }

    const generateElements = (): FloatingElement[] => {
      const items: FloatingElement[] = [];

      // Floating character sticker images
      for (let i = 0; i < 6; i++) {
        items.push({
          id: i,
          content: SHINCHAN_STICKERS[i % SHINCHAN_STICKERS.length],
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 44 + Math.random() * 28,
          duration: 18 + Math.random() * 12,
          delay: Math.random() * 6,
          type: 'sticker',
          isImage: true,
        });
      }

      // Action stars and symbols
      for (let i = 6; i < 16; i++) {
        items.push({
          id: i,
          content: SHINCHAN_ELEMENTS.actionSymbols[i % SHINCHAN_ELEMENTS.actionSymbols.length],
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 14 + Math.random() * 12,
          duration: 8 + Math.random() * 6,
          delay: Math.random() * 3,
          type: 'action',
        });
      }

      // Chocobi snack emojis
      for (let i = 16; i < 24; i++) {
        items.push({
          id: i,
          content: SHINCHAN_ELEMENTS.chocobiSnacks[i % SHINCHAN_ELEMENTS.chocobiSnacks.length],
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 16 + Math.random() * 14,
          duration: 12 + Math.random() * 8,
          delay: Math.random() * 4,
          type: 'chocobi',
        });
      }

      // Floating stars
      for (let i = 24; i < 30; i++) {
        items.push({
          id: i,
          content: ['⭐', '🌟', '💫', '✨', '⚡', '🔥'][i % 6],
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 14 + Math.random() * 10,
          duration: 10 + Math.random() * 6,
          delay: Math.random() * 3,
          type: 'star',
        });
      }

      return items;
    };

    setElements(generateElements());
  }, [enabled]);

  // Mouse trail effect
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!enabled || Math.random() > 0.12) return;

    const trailEmojis = ['★', '⚡', '🌟', '💥', '🍫', '🐾'];
    const trail = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY,
      emoji: trailEmojis[Math.floor(Math.random() * trailEmojis.length)],
    };

    setMouseTrail(prev => [...prev.slice(-10), trail]);

    setTimeout(() => {
      setMouseTrail(prev => prev.filter(s => s.id !== trail.id));
    }, 1200);
  }, [enabled]);

  // Click burst effect
  const handleClick = useCallback((e: MouseEvent) => {
    if (!enabled) return;

    const burstCount = 6;
    const newElements: FloatingElement[] = [];
    const burstEmojis = ['⭐', '💥', '⚡', '🌟', '🔥', '🍫'];

    for (let i = 0; i < burstCount; i++) {
      newElements.push({
        id: Date.now() + i,
        content: burstEmojis[i % burstEmojis.length],
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
        size: 20 + Math.random() * 20,
        duration: 1 + Math.random(),
        delay: 0,
        type: Math.random() > 0.5 ? 'action' : 'star',
      });
    }

    setElements(prev => [...prev, ...newElements]);

    setTimeout(() => {
      setElements(prev => prev.filter(el => !newElements.find(ne => ne.id === el.id)));
    }, 2000);
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('click', handleClick);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('click', handleClick);
      };
    }
  }, [enabled, handleMouseMove, handleClick]);

  if (!enabled) return null;

  return (
    <>
      {/* Background gradient overlay - energetic warm colors */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 25%, rgba(255, 77, 77, 0.25) 0%, transparent 28%),
            radial-gradient(circle at 85% 75%, rgba(64, 196, 255, 0.25) 0%, transparent 28%),
            radial-gradient(circle at 50% 50%, rgba(255, 235, 59, 0.2) 0%, transparent 35%),
            radial-gradient(circle at 25% 80%, rgba(178, 255, 89, 0.15) 0%, transparent 20%),
            radial-gradient(circle at 75% 20%, rgba(255, 235, 59, 0.15) 0%, transparent 20%)
          `,
        }}
      />

      {/* Comic halftone dot pattern */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(255, 77, 77, 0.5) 1.5px, transparent 1.5px),
            radial-gradient(circle, rgba(255, 235, 59, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px, 28px 28px',
          backgroundPosition: '0 0, 14px 14px',
        }}
      />

      {/* Floating elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
        {elements.map(el => (
          <motion.div
            key={el.id}
            className="absolute select-none"
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              fontSize: el.isImage ? undefined : `${el.size}px`,
              width: el.isImage ? `${el.size}px` : undefined,
              height: el.isImage ? `${el.size}px` : undefined,
              filter: el.type === 'action'
                ? 'drop-shadow(0 0 6px rgba(255, 235, 59, 0.7))'
                : el.type === 'star'
                  ? 'drop-shadow(0 0 4px rgba(255, 77, 77, 0.5))'
                  : el.type === 'chocobi'
                    ? 'drop-shadow(0 0 4px rgba(141, 110, 99, 0.4))'
                    : 'drop-shadow(0 2px 8px rgba(55, 71, 79, 0.3))',
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.5, 0.9, 0.5],
              scale: [0.85, 1.1, 0.85],
              y: [0, -35, 0],
              x: [0, el.type === 'action' ? 15 : 8, 0],
              rotate: el.type === 'action' ? [0, 15, -15, 0] : [0, 8, -8, 0],
            }}
            transition={{
              duration: el.duration,
              delay: el.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {el.isImage ? (
              <img
                src={el.content}
                alt="shinchan"
                className="w-full h-full object-contain"
                draggable={false}
              />
            ) : (
              el.content
            )}
          </motion.div>
        ))}
      </div>

      {/* Mouse trail */}
      <AnimatePresence>
        {mouseTrail.map(trail => (
          <motion.div
            key={trail.id}
            className="fixed pointer-events-none z-50"
            style={{
              left: trail.x,
              top: trail.y,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ opacity: 1, scale: 0.3 }}
            animate={{ opacity: 0, scale: 1.8, y: -25, rotate: 180 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <span className="text-xl" style={{
              filter: 'drop-shadow(0 0 4px rgba(255, 235, 59, 0.8))',
            }}>
              {trail.emoji}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Corner sticker decorations */}
      {cornerStickers.length >= 4 && (
        <>
          <div className="fixed top-3 left-3 pointer-events-none z-10">
            <motion.img
              src={cornerStickers[0]}
              alt="shinchan"
              className="w-16 h-16 object-contain"
              animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{ filter: 'drop-shadow(2px 2px 0px rgba(55, 71, 79, 0.3))' }}
              draggable={false}
            />
          </div>

          <div className="fixed top-3 right-3 pointer-events-none z-10">
            <motion.img
              src={cornerStickers[1]}
              alt="shinchan"
              className="w-16 h-16 object-contain"
              animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              style={{ filter: 'drop-shadow(2px 2px 0px rgba(55, 71, 79, 0.3))' }}
              draggable={false}
            />
          </div>

          <div className="fixed bottom-3 left-3 pointer-events-none z-10">
            <motion.img
              src={cornerStickers[2]}
              alt="shinchan"
              className="w-14 h-14 object-contain"
              animate={{ y: [0, -6, 0], rotate: [0, 6, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ filter: 'drop-shadow(2px 2px 0px rgba(55, 71, 79, 0.3))' }}
              draggable={false}
            />
          </div>

          <div className="fixed bottom-3 right-3 pointer-events-none z-10">
            <motion.img
              src={cornerStickers[3]}
              alt="shinchan"
              className="w-14 h-14 object-contain"
              animate={{ y: [0, -6, 0], rotate: [0, -6, 6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
              style={{ filter: 'drop-shadow(2px 2px 0px rgba(55, 71, 79, 0.3))' }}
              draggable={false}
            />
          </div>
        </>
      )}

      {/* Animated Shiro GIF (bottom-left) */}
      <div className="fixed bottom-20 left-6 pointer-events-none z-10">
        <motion.img
          src="/assets/shinchan/shiro-animated.gif"
          alt="shiro"
          className="w-20 h-20 object-contain"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(2px 2px 0px rgba(55, 71, 79, 0.2))' }}
          draggable={false}
        />
      </div>

      {/* Dancing Shin-chan GIF (top area, subtle) */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 pointer-events-none z-10 opacity-70">
        <motion.img
          src="/assets/shinchan/shinchan-dance.gif"
          alt="shinchan dancing"
          className="w-16 h-16 object-contain"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(2px 2px 0px rgba(55, 71, 79, 0.15))' }}
          draggable={false}
        />
      </div>

      {/* Comic-style border glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          boxShadow: 'inset 0 0 120px rgba(255, 235, 59, 0.12), inset 0 0 60px rgba(255, 77, 77, 0.08)',
        }}
      />
    </>
  );
};

export default ShinchanDecorations;
