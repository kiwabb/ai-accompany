import React from 'react';
import { motion } from 'framer-motion';

interface CozyAvatarProps {
  state: 'idle' | 'thinking' | 'speaking' | 'focused';
  size?: number;
}

const CozyAvatar: React.FC<CozyAvatarProps> = ({ state, size = 64 }) => {
  // Base colors
  const skinColor = "#FFDFC4";
  const blushColor = "#FFB7B2";
  const eyeColor = "#4A5568";

  // Animation variants
  const containerVariants = {
    idle: { 
      y: [0, -8, 0], 
      rotate: [0, -1, 1, 0],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } 
    },
    speaking: { 
      y: [0, -2, 0], 
      scale: [1, 1.08, 1], 
      transition: { duration: 0.3, repeat: Infinity } 
    },
    thinking: { 
      rotate: [0, 8, -8, 0], 
      scale: [1, 0.95, 1],
      transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } 
    },
    focused: { 
      scale: 1.1,
      y: [0, -2, 0],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    }
  };

  const eyeVariants = {
    idle: { 
      scaleY: [1, 1, 0.1, 1], 
      transition: { duration: 5, repeat: Infinity, times: [0, 0.85, 0.9, 1] } 
    },
    thinking: { 
      x: [0, 4, -4, 0], 
      transition: { duration: 3, repeat: Infinity } 
    },
    speaking: { scaleY: 1.1 },
    focused: { scaleY: 0.7, y: 1 } 
  };

  const mouthVariants = {
    idle: { d: "M 20 45 Q 32 50 44 45", transition: { duration: 1 } }, // Smile
    speaking: { d: ["M 20 45 Q 32 55 44 45", "M 20 45 Q 32 35 44 45"], transition: { duration: 0.3, repeat: Infinity } }, // Talking
    thinking: { d: "M 25 45 Q 32 45 39 45", transition: { duration: 0.5 } }, // Flat/Thinking line
    focused: { d: "M 25 45 Q 32 40 39 45" } // Determined
  };

  return (
    <motion.div
      style={{ width: size, height: size }}
      className="relative"
      variants={containerVariants}
      animate={state}
    >
      {/* Background/Face Shape */}
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
        <circle cx="32" cy="32" r="30" fill={skinColor} stroke="white" strokeWidth="2" />
        
        {/* Cheeks/Blush */}
        <circle cx="14" cy="36" r="4" fill={blushColor} opacity="0.6" />
        <circle cx="50" cy="36" r="4" fill={blushColor} opacity="0.6" />

        {/* Eyes */}
        <motion.g variants={eyeVariants} animate={state}>
          <circle cx="20" cy="28" r="4" fill={eyeColor} />
          <circle cx="44" cy="28" r="4" fill={eyeColor} />
          {/* Highlights */}
          <circle cx="22" cy="26" r="1.5" fill="white" />
          <circle cx="46" cy="26" r="1.5" fill="white" />
        </motion.g>

        {/* Mouth */}
        <motion.path 
          stroke={eyeColor} 
          strokeWidth="3" 
          strokeLinecap="round" 
          fill="none"
          variants={mouthVariants}
          animate={state}
        />

        {/* Accessories for Focus Mode */}
        {state === 'focused' && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Headphones Band */}
            <path d="M 4 32 C 4 10 60 10 60 32" stroke="#6366F1" strokeWidth="4" fill="none" />
            {/* Earcup Left */}
            <rect x="2" y="28" width="6" height="12" rx="2" fill="#4F46E5" />
            {/* Earcup Right */}
            <rect x="56" y="28" width="6" height="12" rx="2" fill="#4F46E5" />
          </motion.g>
        )}
      </svg>
    </motion.div>
  );
};

export default CozyAvatar;
