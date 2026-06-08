import React from 'react';
import { motion } from 'framer-motion';
import type { VisualTheme } from '../types/pomodoro';
import OriginalMascot from './OriginalMascot';
import { getThemeCharacterVariants } from '../constants/themes';

interface OriginalThemeDecorationsProps {
  theme: VisualTheme;
  enabled: boolean;
}

const positions = [
  { left: '7%', top: '18%', scale: 0.74, delay: 0 },
  { left: '84%', top: '14%', scale: 0.62, delay: 0.4 },
  { left: '10%', top: '74%', scale: 0.58, delay: 0.8 },
  { left: '82%', top: '70%', scale: 0.7, delay: 1.2 },
];

const motifClusters = [
  { left: '18%', top: '12%', scale: 0.86, rotate: -8, delay: 0.1 },
  { left: '72%', top: '22%', scale: 0.74, rotate: 10, delay: 0.7 },
  { left: '4%', top: '49%', scale: 0.68, rotate: 8, delay: 1.1 },
  { left: '63%', top: '60%', scale: 0.82, rotate: -12, delay: 0.4 },
  { left: '30%', top: '78%', scale: 0.72, rotate: 12, delay: 1.4 },
  { left: '89%', top: '44%', scale: 0.58, rotate: -6, delay: 0.9 },
];

const renderMotifCluster = (theme: VisualTheme, index: number) => {
  const { primary, secondary, accent, text } = theme.colors;
  const shape = theme.character?.accentShape;

  switch (shape) {
    case 'pencil':
      return (
        <>
          <rect data-theme-background-motif="true" x="14" y="18" width="42" height="24" rx="6" fill="white" opacity="0.48" transform="rotate(-8 35 30)" />
          <path data-theme-background-motif="true" d="M21 28 H48 M20 35 H43" stroke={primary} strokeWidth="2.4" strokeLinecap="round" opacity="0.36" transform="rotate(-8 35 30)" />
          <path data-theme-background-motif="true" d="M61 14 L78 31 L55 58 L38 41 Z" fill={primary} opacity="0.34" />
          <path data-theme-background-motif="true" d="M78 31 L84 38 L61 65 L55 58 Z" fill={accent} opacity="0.5" />
          <path data-theme-background-motif="true" d="M76 58 C89 54 90 73 76 70 C66 68 67 55 76 58 Z" stroke={secondary} strokeWidth="3" fill="none" opacity="0.5" />
        </>
      );
    case 'cloud':
      return (
        <>
          <path data-theme-background-motif="true" d="M18 43 C12 43 9 38 12 33 C15 27 22 27 26 31 C30 22 43 22 47 32 C54 31 60 35 60 43 Z" fill="white" opacity="0.5" />
          <path data-theme-background-motif="true" d="M28 58 V67 M39 54 V63 M69 58 V66" stroke={primary} strokeWidth="3" strokeLinecap="round" opacity="0.32" />
          <path data-theme-background-motif="true" d="M67 20 L88 29 L67 39 L72 29 Z" fill={accent} opacity="0.46" />
          <path data-theme-background-motif="true" d="M15 75 L35 63 L55 76" stroke={secondary} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.38" />
          <circle data-theme-background-motif="true" cx="82" cy="59" r="5" fill={secondary} opacity="0.45" />
        </>
      );
    case 'planet':
      return (
        <>
          <ellipse data-theme-background-motif="true" cx="49" cy="45" rx="43" ry="15" fill="none" stroke={secondary} strokeWidth="3" opacity="0.32" transform="rotate(-14 49 45)" />
          <circle data-theme-background-motif="true" cx="49" cy="45" r="20" fill={primary} opacity="0.3" />
          <circle data-theme-background-motif="true" cx="23" cy="20" r="8" fill={accent} opacity="0.42" />
          <path data-theme-background-motif="true" d="M72 20 L87 27 L74 35 L65 29 Z" fill="white" stroke={secondary} strokeWidth="2" opacity="0.52" />
          <path data-theme-background-motif="true" d="M21 71 L34 63 L40 77 Z" fill={primary} opacity="0.28" />
        </>
      );
    case 'lamp':
      return (
        <>
          <path data-theme-background-motif="true" d="M18 70 C28 53 43 53 53 70 Z" fill={secondary} opacity="0.28" />
          <path data-theme-background-motif="true" d="M61 17 V58 M49 58 H74 L69 82 H54 Z" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.52" />
          <path data-theme-background-motif="true" d="M62 22 L89 9" stroke={secondary} strokeWidth="5" strokeLinecap="round" opacity="0.4" />
          <path data-theme-background-motif="true" d="M77 71 C84 57 94 57 101 71 Z" fill={primary} opacity="0.22" />
          <circle data-theme-background-motif="true" cx="33" cy="30" r="4" fill={accent} opacity="0.5" />
        </>
      );
    case 'moon':
      return (
        <>
          <path data-theme-background-motif="true" d="M54 13 C42 18 34 31 34 45 C34 59 43 69 56 74 C41 79 20 68 18 47 C16 25 36 10 54 13 Z" fill={primary} opacity="0.32" />
          <rect data-theme-background-motif="true" x="18" y="66" width="42" height="18" rx="5" fill="white" opacity="0.46" transform="rotate(7 39 75)" />
          <path data-theme-background-motif="true" d="M25 74 H52 M25 80 H45" stroke={primary} strokeWidth="2" strokeLinecap="round" opacity="0.32" transform="rotate(7 39 75)" />
          <path data-theme-background-motif="true" d="M82 18 L87 28 L98 29 L90 36 L92 47 L82 41 L73 47 L75 36 L67 29 L78 28 Z" fill={secondary} opacity="0.48" />
          <path data-theme-background-motif="true" d="M72 72 H91" stroke={accent} strokeWidth="6" strokeLinecap="round" opacity="0.42" />
        </>
      );
    case 'sprout':
    default:
      return (
        <>
          <path data-theme-background-motif="true" d="M12 68 L30 36 L48 68 Z" fill={secondary} opacity="0.36" />
          <path data-theme-background-motif="true" d="M20 68 L30 49 L40 68 Z" fill="white" opacity="0.34" />
          <path data-theme-background-motif="true" d="M67 22 H91 L87 31 H67 Z" fill={accent} opacity="0.48" />
          <path data-theme-background-motif="true" d="M67 22 V50" stroke={text} strokeWidth="3" strokeLinecap="round" opacity="0.25" />
          <path data-theme-background-motif="true" d="M67 76 L74 61 L81 76 M74 61 V52" stroke={secondary} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.44" />
          <circle data-theme-background-motif="true" cx={index % 2 === 0 ? 88 : 21} cy="48" r="4" fill={primary} opacity="0.34" />
        </>
      );
  }
};

const OriginalThemeDecorations: React.FC<OriginalThemeDecorationsProps> = ({ theme, enabled }) => {
  if (!enabled || !theme.character) return null;

  const variants = getThemeCharacterVariants(theme);
  const symbols = variants.flatMap((variant) => Object.values(variant.phaseSymbols)).slice(0, 8);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div data-testid="original-theme-background-motifs" className="absolute inset-0">
        {motifClusters.map((item, index) => (
          <motion.svg
            key={`${theme.id}-motif-${index}`}
            data-theme-background-cluster="true"
            className="absolute"
            style={{ left: item.left, top: item.top, opacity: 0.5 }}
            width={104 * item.scale}
            height={88 * item.scale}
            viewBox="0 0 104 88"
            fill="none"
            initial={{ opacity: 0, y: 10, rotate: item.rotate }}
            animate={{ opacity: [0.28, 0.56, 0.28], y: [0, -12, 0], rotate: [item.rotate, item.rotate + 5, item.rotate] }}
            transition={{ duration: 9 + index, repeat: Infinity, ease: 'easeInOut', delay: item.delay }}
          >
            {renderMotifCluster(theme, index)}
          </motion.svg>
        ))}
      </div>

      {positions.map((item, index) => (
        <motion.div
          key={`${theme.id}-${index}`}
          className="absolute opacity-70"
          style={{ left: item.left, top: item.top }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 0.72, y: [0, -14, 0], rotate: [-4, 4, -4] }}
          transition={{ duration: 7 + index, repeat: Infinity, ease: 'easeInOut', delay: item.delay }}
        >
          <OriginalMascot
            character={variants[index % variants.length]}
            theme={theme}
            state="idle"
            size={64 * item.scale}
          />
        </motion.div>
      ))}

      {symbols.map((symbol, index) => (
        <motion.span
          key={`${theme.id}-symbol-${symbol}-${index}`}
          className="absolute rounded-full border px-2 py-1 text-xs font-black shadow-sm backdrop-blur-md"
          style={{
            left: `${26 + index * 22}%`,
            top: `${18 + index * 19}%`,
            color: theme.colors.text,
            backgroundColor: theme.colors.glass,
            borderColor: theme.colors.border,
          }}
          animate={{ y: [0, -10, 0], opacity: [0.42, 0.78, 0.42] }}
          transition={{ duration: 5 + index, repeat: Infinity, ease: 'easeInOut', delay: index * 0.7 }}
        >
          {symbol}
        </motion.span>
      ))}
    </div>
  );
};

export default OriginalThemeDecorations;
