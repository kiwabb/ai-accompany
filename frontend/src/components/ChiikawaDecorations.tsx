import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CHIIKAWA_ELEMENTS } from '../constants/themes';

// Real Chiikawa sticker images
const CHIIKAWA_STICKERS = [
  '/assets/chiikawa/sticker-0.png',
  '/assets/chiikawa/sticker-1.png',
  '/assets/chiikawa/sticker-2.png',
  '/assets/chiikawa/sticker-3.png',
  '/assets/chiikawa/sticker-4.png',
  '/assets/chiikawa/sticker-5.png',
  '/assets/chiikawa/sticker-6.png',
  '/assets/chiikawa/sticker-7.png',
  '/assets/chiikawa/sticker-8.png',
  '/assets/chiikawa/sticker-9.png',
  '/assets/chiikawa/sticker-10.png',
  '/assets/chiikawa/sticker-11.png',
];

interface FloatingElement {
  id: number;
  content: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  type: 'sticker' | 'sparkle' | 'heart';
  isImage?: boolean;
}

interface ChiikawaDecorationsProps {
  enabled: boolean;
}

const MOUSE_SPARKLE_SYMBOLS = ['✦', '✧', '★', '☆', '💖', '🩷'];

const selectCornerStickers = () => [...CHIIKAWA_STICKERS]
  .sort(() => Math.random() - 0.5)
  .slice(0, 4);

const createFloatingElements = (): FloatingElement[] => {
  const items: FloatingElement[] = [];

  // Add floating sticker images
  for (let i = 0; i < 8; i++) {
    items.push({
      id: i,
      content: CHIIKAWA_STICKERS[i % CHIIKAWA_STICKERS.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 48 + Math.random() * 32,
      duration: 18 + Math.random() * 12,
      delay: Math.random() * 6,
      type: 'sticker',
      isImage: true,
    });
  }

  // Add sparkles
  for (let i = 8; i < 20; i++) {
    items.push({
      id: i,
      content: CHIIKAWA_ELEMENTS.sparkles[i % CHIIKAWA_ELEMENTS.sparkles.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 14 + Math.random() * 12,
      duration: 8 + Math.random() * 6,
      delay: Math.random() * 3,
      type: 'sparkle',
    });
  }

  // Add floating hearts
  for (let i = 20; i < 28; i++) {
    items.push({
      id: i,
      content: ['♡', '♥', '❤', '💕', '💖', '💗', '🩷', '🩵'][i % 8],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 16 + Math.random() * 14,
      duration: 12 + Math.random() * 8,
      delay: Math.random() * 4,
      type: 'heart',
    });
  }

  return items;
};

const ChiikawaDecorations: React.FC<ChiikawaDecorationsProps> = ({ enabled }) => {
  const [elements, setElements] = useState<FloatingElement[]>(createFloatingElements);
  const [mouseSparkles, setMouseSparkles] = useState<{ id: number; x: number; y: number; symbol: string }[]>([]);
  const [cornerStickers] = useState<string[]>(selectCornerStickers);

  // Mouse sparkle trail effect
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!enabled || Math.random() > 0.12) return;

    const sparkle = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY,
      symbol: MOUSE_SPARKLE_SYMBOLS[Math.floor(Math.random() * MOUSE_SPARKLE_SYMBOLS.length)],
    };

    setMouseSparkles(prev => [...prev.slice(-10), sparkle]);

    setTimeout(() => {
      setMouseSparkles(prev => prev.filter(s => s.id !== sparkle.id));
    }, 1200);
  }, [enabled]);

  const handleClick = useCallback((e: MouseEvent) => {
    if (!enabled) return;
    
    const burstCount = 6;
    const newElements: FloatingElement[] = [];
    
    for (let i = 0; i < burstCount; i++) {
      newElements.push({
        id: Date.now() + i,
        content: ['♡', '✨', '🌸', '🍓', '🎀', '🍬'][i % 6],
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
        size: 20 + Math.random() * 20,
        duration: 1 + Math.random(),
        delay: 0,
        type: Math.random() > 0.5 ? 'heart' : 'sparkle',
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
      {/* Background pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 25%, rgba(255, 181, 197, 0.35) 0%, transparent 28%),
            radial-gradient(circle at 85% 75%, rgba(184, 230, 240, 0.35) 0%, transparent 28%),
            radial-gradient(circle at 50% 50%, rgba(255, 250, 205, 0.25) 0%, transparent 35%),
            radial-gradient(circle at 25% 80%, rgba(255, 182, 193, 0.2) 0%, transparent 20%),
            radial-gradient(circle at 75% 20%, rgba(173, 216, 230, 0.2) 0%, transparent 20%)
          `,
        }}
      />

      {/* Cute dot pattern */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-25"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(255, 181, 197, 0.6) 2px, transparent 2px),
            radial-gradient(circle, rgba(184, 230, 240, 0.4) 1.5px, transparent 1.5px)
          `,
          backgroundSize: '48px 48px, 32px 32px',
          backgroundPosition: '0 0, 16px 16px',
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
              filter: el.type === 'sparkle'
                ? 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.7))'
                : el.type === 'heart'
                ? 'drop-shadow(0 0 4px rgba(255, 182, 193, 0.6))'
                : 'drop-shadow(0 2px 8px rgba(255, 182, 193, 0.4))',
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.5, 0.9, 0.5],
              scale: [0.85, 1.1, 0.85],
              y: [0, -35, 0],
              x: [0, el.type === 'sparkle' ? 12 : 6, 0],
              rotate: el.type === 'heart' ? [0, 12, -12, 0] : [0, 6, -6, 0],
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
                alt="chiikawa"
                className="w-full h-full object-contain"
                draggable={false}
              />
            ) : (
              el.content
            )}
          </motion.div>
        ))}
      </div>

      {/* Mouse sparkle trail */}
      <AnimatePresence>
        {mouseSparkles.map(sparkle => (
          <motion.div
            key={sparkle.id}
            className="fixed pointer-events-none z-50"
            style={{
              left: sparkle.x,
              top: sparkle.y,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ opacity: 1, scale: 0.3 }}
            animate={{ opacity: 0, scale: 1.8, y: -25, rotate: 180 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <span className="text-xl" style={{
              filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))',
            }}>
              {sparkle.symbol}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Corner sticker decorations with real images */}
      {cornerStickers.length >= 4 && (
        <>
          <div className="fixed top-3 left-3 pointer-events-none z-10">
            <motion.img
              src={cornerStickers[0]}
              alt="chiikawa"
              className="w-16 h-16 object-contain"
              animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{ filter: 'drop-shadow(0 2px 8px rgba(255, 182, 193, 0.5))' }}
              draggable={false}
            />
          </div>

          <div className="fixed top-3 right-3 pointer-events-none z-10">
            <motion.img
              src={cornerStickers[1]}
              alt="chiikawa"
              className="w-16 h-16 object-contain"
              animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              style={{ filter: 'drop-shadow(0 2px 8px rgba(255, 182, 193, 0.5))' }}
              draggable={false}
            />
          </div>

          <div className="fixed bottom-3 left-3 pointer-events-none z-10">
            <motion.img
              src={cornerStickers[2]}
              alt="chiikawa"
              className="w-14 h-14 object-contain"
              animate={{ y: [0, -6, 0], rotate: [0, 6, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ filter: 'drop-shadow(0 2px 8px rgba(255, 182, 193, 0.5))' }}
              draggable={false}
            />
          </div>

          <div className="fixed bottom-3 right-3 pointer-events-none z-10">
            <motion.img
              src={cornerStickers[3]}
              alt="chiikawa"
              className="w-14 h-14 object-contain"
              animate={{ y: [0, -6, 0], rotate: [0, -6, 6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
              style={{ filter: 'drop-shadow(0 2px 8px rgba(255, 182, 193, 0.5))' }}
              draggable={false}
            />
          </div>
        </>
      )}

      {/* Animated center Chiikawa GIF */}
      <div className="fixed bottom-20 right-6 pointer-events-none z-10">
        <motion.img
          src="/assets/chiikawa/chiikawa-animated.gif"
          alt="chiikawa"
          className="w-20 h-20 object-contain"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 4px 12px rgba(255, 182, 193, 0.6))' }}
          draggable={false}
        />
      </div>

      {/* Subtle gradient border glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          boxShadow: 'inset 0 0 120px rgba(255, 181, 197, 0.18), inset 0 0 60px rgba(184, 230, 240, 0.1)',
        }}
      />
    </>
  );
};

export default ChiikawaDecorations;
