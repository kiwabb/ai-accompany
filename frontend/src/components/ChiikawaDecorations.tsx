import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CHIIKAWA_ELEMENTS } from '../constants/themes';

interface FloatingElement {
  id: number;
  content: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  type: 'character' | 'sparkle' | 'heart';
}

interface ChiikawaDecorationsProps {
  enabled: boolean;
}

const ChiikawaDecorations: React.FC<ChiikawaDecorationsProps> = ({ enabled }) => {
  const [elements, setElements] = useState<FloatingElement[]>([]);
  const [mouseSparkles, setMouseSparkles] = useState<{ id: number; x: number; y: number }[]>([]);

  // Generate initial floating elements
  useEffect(() => {
    if (!enabled) {
      setElements([]);
      return;
    }

    const generateElements = (): FloatingElement[] => {
      const items: FloatingElement[] = [];

      // Add floating characters
      for (let i = 0; i < 6; i++) {
        items.push({
          id: i,
          content: CHIIKAWA_ELEMENTS.characters[i % CHIIKAWA_ELEMENTS.characters.length],
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 20 + Math.random() * 16,
          duration: 15 + Math.random() * 10,
          delay: Math.random() * 5,
          type: 'character',
        });
      }

      // Add sparkles
      for (let i = 6; i < 18; i++) {
        items.push({
          id: i,
          content: CHIIKAWA_ELEMENTS.sparkles[i % CHIIKAWA_ELEMENTS.sparkles.length],
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 12 + Math.random() * 10,
          duration: 8 + Math.random() * 6,
          delay: Math.random() * 3,
          type: 'sparkle',
        });
      }

      // Add floating hearts
      for (let i = 18; i < 24; i++) {
        items.push({
          id: i,
          content: ['♡', '♥', '❤', '💕', '💖', '💗'][i % 6],
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 14 + Math.random() * 12,
          duration: 12 + Math.random() * 8,
          delay: Math.random() * 4,
          type: 'heart',
        });
      }

      return items;
    };

    setElements(generateElements());
  }, [enabled]);

  // Mouse sparkle trail effect
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!enabled || Math.random() > 0.15) return;

    const sparkle = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY,
    };

    setMouseSparkles(prev => [...prev.slice(-8), sparkle]);

    setTimeout(() => {
      setMouseSparkles(prev => prev.filter(s => s.id !== sparkle.id));
    }, 1000);
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [enabled, handleMouseMove]);

  if (!enabled) return null;

  return (
    <>
      {/* Background pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(255, 181, 197, 0.3) 0%, transparent 25%),
            radial-gradient(circle at 80% 70%, rgba(184, 230, 240, 0.3) 0%, transparent 25%),
            radial-gradient(circle at 50% 50%, rgba(255, 250, 205, 0.2) 0%, transparent 30%)
          `,
        }}
      />

      {/* Cute dot pattern */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(255, 181, 197, 0.5) 2px, transparent 2px)
          `,
          backgroundSize: '40px 40px',
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
              fontSize: `${el.size}px`,
              filter: el.type === 'sparkle' ? 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.6))' : 'none',
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.4, 0.8, 0.4],
              scale: [0.8, 1.1, 0.8],
              y: [0, -30, 0],
              x: [0, el.type === 'sparkle' ? 10 : 5, 0],
              rotate: el.type === 'heart' ? [0, 10, -10, 0] : [0, 5, -5, 0],
            }}
            transition={{
              duration: el.duration,
              delay: el.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {el.content}
          </motion.div>
        ))}
      </div>

      {/* Mouse sparkle trail */}
      <AnimatePresence>
        {mouseSparkles.map(sparkle => (
          <motion.div
            key={sparkle.id}
            className="fixed pointer-events-none z-50 text-lg"
            style={{
              left: sparkle.x,
              top: sparkle.y,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ opacity: 1, scale: 0.5 }}
            animate={{ opacity: 0, scale: 1.5, y: -20 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            {CHIIKAWA_ELEMENTS.sparkles[Math.floor(Math.random() * CHIIKAWA_ELEMENTS.sparkles.length)]}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Corner decorations */}
      <div className="fixed top-4 left-4 pointer-events-none z-10 opacity-60">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="text-3xl"
        >
          🌸
        </motion.div>
      </div>

      <div className="fixed top-4 right-4 pointer-events-none z-10 opacity-60">
        <motion.div
          animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          className="text-3xl"
        >
          🎀
        </motion.div>
      </div>

      <div className="fixed bottom-4 left-4 pointer-events-none z-10 opacity-60">
        <motion.div
          animate={{ y: [0, -5, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-2xl"
        >
          🐱
        </motion.div>
      </div>

      <div className="fixed bottom-4 right-4 pointer-events-none z-10 opacity-60">
        <motion.div
          animate={{ y: [0, -5, 0], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
          className="text-2xl"
        >
          🐰
        </motion.div>
      </div>

      {/* Subtle gradient border glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          boxShadow: 'inset 0 0 100px rgba(255, 181, 197, 0.15)',
        }}
      />
    </>
  );
};

export default ChiikawaDecorations;
