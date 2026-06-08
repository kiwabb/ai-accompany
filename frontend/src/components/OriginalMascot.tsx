import React from 'react';
import { motion } from 'framer-motion';
import type { VisualTheme, VisualThemeCharacter, VisualThemeCharacterScene } from '../types/pomodoro';

type MascotState = 'idle' | 'focused' | 'thinking' | 'speaking' | 'resting';

interface OriginalMascotProps {
  theme: VisualTheme;
  character?: VisualThemeCharacter;
  state?: MascotState;
  size?: number;
  className?: string;
}

interface ShapeRecipe {
  scene: React.ReactNode;
  body: React.ReactNode;
  accessory: React.ReactNode;
  eyeY: number;
  mouth: React.ReactNode;
}

const stateMotion: Record<MascotState, { y: number[]; rotate: number[]; scale: number[]; duration: number }> = {
  idle: { y: [0, -3, 0], rotate: [-1, 1, -1], scale: [1, 1.02, 1], duration: 3.6 },
  focused: { y: [0, -2, 0], rotate: [0, 0.8, 0], scale: [1, 1.015, 1], duration: 2.8 },
  thinking: { y: [0, -5, 0], rotate: [-2, 2, -2], scale: [1, 1.03, 1], duration: 2.4 },
  speaking: { y: [0, -4, 0], rotate: [2, -2, 2], scale: [1, 1.04, 1], duration: 1.8 },
  resting: { y: [0, 2, 0], rotate: [0, -0.5, 0], scale: [1, 0.99, 1], duration: 4.2 },
};

const renderSceneMarker = (
  scene: VisualThemeCharacterScene,
  colors: Pick<VisualTheme['colors'], 'primary' | 'secondary' | 'accent' | 'text'>
) => {
  const { primary, secondary, accent, text } = colors;

  switch (scene) {
    case 'language':
      return (
        <g data-theme-variant-scene="language">
          <rect data-theme-detail="true" x="32" y="24" width="21" height="16" rx="4" fill="white" opacity="0.52" />
          <path data-theme-detail="true" d="M37 31 H50 M37 36 H46" stroke={primary} strokeWidth="2" strokeLinecap="round" opacity="0.56" />
        </g>
      );
    case 'code':
      return (
        <g data-theme-variant-scene="code">
          <path data-theme-detail="true" d="M33 28 L26 35 L33 42 M49 28 L56 35 L49 42" stroke={primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.56" />
          <path data-theme-detail="true" d="M43 27 L38 43" stroke={text} strokeWidth="2" strokeLinecap="round" opacity="0.34" />
        </g>
      );
    case 'math':
      return (
        <g data-theme-variant-scene="math">
          <circle data-theme-detail="true" cx="43" cy="34" r="9" fill="none" stroke={primary} strokeWidth="2" opacity="0.5" />
          <path data-theme-detail="true" d="M37 40 L51 28" stroke={secondary} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        </g>
      );
    case 'review':
      return (
        <g data-theme-variant-scene="review">
          <rect data-theme-detail="true" x="33" y="27" width="20" height="16" rx="5" fill="white" opacity="0.54" />
          <path data-theme-detail="true" d="M38 35 L42 39 L49 31" stroke={secondary} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.68" />
        </g>
      );
    case 'rest':
      return (
        <g data-theme-variant-scene="rest">
          <path data-theme-detail="true" d="M35 34 C41 28 49 28 55 34" stroke={primary} strokeWidth="2.5" strokeLinecap="round" opacity="0.42" />
          <circle data-theme-detail="true" cx="55" cy="29" r="3" fill={accent} opacity="0.55" />
        </g>
      );
    case 'default':
    default:
      return null;
  }
};

const getRecipe = (theme: VisualTheme, character?: VisualThemeCharacter): ShapeRecipe => {
  const { primary, secondary, accent, text } = theme.colors;
  const activeCharacter = character ?? theme.character;
  const mascot = activeCharacter?.mascot;
  const scene = activeCharacter?.scene ?? 'default';
  const sceneMarker = renderSceneMarker(scene, { primary, secondary, accent, text });

  switch (mascot) {
    case 'Pencil':
      return {
        eyeY: 57,
        scene: (
          <g data-theme-scene="true">
            <rect data-theme-detail="true" x="18" y="28" width="31" height="48" rx="5" fill="white" opacity="0.72" transform="rotate(-9 33 52)" />
            <path data-theme-detail="true" d="M24 39 H43 M23 49 H42 M22 59 H39" stroke={primary} strokeWidth="2" strokeLinecap="round" opacity="0.42" transform="rotate(-9 33 52)" />
            <rect data-theme-detail="true" x="70" y="66" width="22" height="10" rx="3" fill={accent} opacity="0.86" transform="rotate(-12 81 71)" />
            <path data-theme-detail="true" d="M79 23 C91 23 91 42 79 42 C70 42 70 29 79 29 C84 29 84 36 79 36" stroke={secondary} strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle data-theme-detail="true" cx="89" cy="54" r="3" fill={secondary} opacity="0.9" />
            {sceneMarker}
          </g>
        ),
        body: (
          <>
            <path d="M53 17 L76 40 L47 92 L24 69 Z" fill={primary} />
            <path d="M24 69 L47 92 L34 99 Z" fill={accent} />
            <path d="M53 17 L62 8 L84 30 L76 40 Z" fill={secondary} />
            <path d="M62 8 L69 5 L87 24 L84 30 Z" fill={text} opacity="0.78" />
          </>
        ),
        accessory: <path d="M35 78 L64 49" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.55" />,
        mouth: <path d="M47 68 Q53 73 60 68" stroke={text} strokeWidth="3" fill="none" strokeLinecap="round" />,
      };
    case 'Cloud':
      return {
        eyeY: 58,
        scene: (
          <g data-theme-scene="true">
            <path data-theme-detail="true" d="M22 42 C19 36 23 31 30 32 C33 24 43 24 47 31 C54 30 59 35 57 42 Z" fill="white" opacity="0.72" />
            <path data-theme-detail="true" d="M22 88 L38 80 L55 88" stroke={secondary} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.72" />
            <path data-theme-detail="true" d="M84 26 L97 33 L85 39 L87 33 Z" fill={accent} opacity="0.82" />
            <path data-theme-detail="true" d="M29 55 V61 M38 51 V57 M83 70 V76 M92 66 V72" stroke={primary} strokeWidth="3" strokeLinecap="round" opacity="0.45" />
            <circle data-theme-detail="true" cx="89" cy="49" r="4" fill={secondary} opacity="0.9" />
            {sceneMarker}
          </g>
        ),
        body: (
          <path
            d="M31 75 C18 75 12 65 18 55 C21 48 28 45 35 48 C39 36 52 31 63 37 C70 41 73 47 73 54 C83 54 91 61 91 71 C91 83 81 90 67 90 L33 90 C22 90 16 84 16 75 Z"
            fill={primary}
          />
        ),
        accessory: (
          <>
            <circle cx="73" cy="31" r="8" fill={secondary} />
            <path d="M73 16 V10 M73 52 V46 M58 31 H52 M94 31 H88 M62 20 L58 16 M88 46 L84 42 M88 16 L84 20 M62 42 L58 46" stroke={secondary} strokeWidth="3" strokeLinecap="round" />
          </>
        ),
        mouth: <path d="M46 70 Q54 76 62 70" stroke={text} strokeWidth="3" fill="none" strokeLinecap="round" />,
      };
    case 'Bean':
      return {
        eyeY: 57,
        scene: (
          <g data-theme-scene="true">
            <ellipse data-theme-detail="true" cx="57" cy="60" rx="46" ry="20" fill="none" stroke={secondary} strokeWidth="3" opacity="0.28" transform="rotate(-12 57 60)" />
            <circle data-theme-detail="true" cx="25" cy="38" r="7" fill={accent} opacity="0.82" />
            <circle data-theme-detail="true" cx="91" cy="78" r="5" fill={secondary} opacity="0.78" />
            <path data-theme-detail="true" d="M31 78 L41 72 L45 83 Z" fill={primary} opacity="0.46" />
            <path data-theme-detail="true" d="M83 31 L92 35 L84 41 L78 37 Z" fill="white" stroke={secondary} strokeWidth="2" opacity="0.8" />
            {sceneMarker}
          </g>
        ),
        body: (
          <path
            d="M61 19 C83 24 94 46 86 69 C78 94 51 104 31 90 C13 78 11 51 26 33 C35 22 47 16 61 19 Z"
            fill={primary}
          />
        ),
        accessory: (
          <>
            <ellipse cx="58" cy="58" rx="46" ry="17" fill="none" stroke={secondary} strokeWidth="5" opacity="0.55" transform="rotate(-18 58 58)" />
            <circle cx="91" cy="46" r="6" fill={accent} />
          </>
        ),
        mouth: <path d="M47 68 Q55 72 64 66" stroke={text} strokeWidth="3" fill="none" strokeLinecap="round" />,
      };
    case 'Sprout':
      return {
        eyeY: 62,
        scene: (
          <g data-theme-scene="true">
            <path data-theme-detail="true" d="M20 84 C27 72 35 72 42 84 Z" fill={secondary} opacity="0.35" />
            <path data-theme-detail="true" d="M77 84 C84 70 94 70 101 84 Z" fill={primary} opacity="0.28" />
            <path data-theme-detail="true" d="M79 29 V65 M69 65 H91 L86 86 H74 Z" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.72" />
            <path data-theme-detail="true" d="M80 35 L100 23" stroke={secondary} strokeWidth="5" strokeLinecap="round" opacity="0.55" />
            <circle data-theme-detail="true" cx="27" cy="49" r="3" fill={accent} opacity="0.9" />
            <circle data-theme-detail="true" cx="96" cy="53" r="2.5" fill={secondary} opacity="0.9" />
            {sceneMarker}
          </g>
        ),
        body: (
          <>
            <rect x="29" y="45" width="58" height="49" rx="18" fill={primary} />
            <path d="M46 45 C41 29 51 21 58 37 C64 20 80 23 74 42 C66 40 60 43 58 48 C55 43 51 41 46 45 Z" fill={secondary} />
            <path d="M39 94 H77 L70 103 H46 Z" fill={accent} />
          </>
        ),
        accessory: <path d="M58 37 V52" stroke={theme.colors.text} strokeWidth="3" strokeLinecap="round" opacity="0.42" />,
        mouth: <path d="M49 73 Q58 79 67 73" stroke={text} strokeWidth="3" fill="none" strokeLinecap="round" />,
      };
    case 'Moon':
      return {
        eyeY: 57,
        scene: (
          <g data-theme-scene="true">
            <rect data-theme-detail="true" x="20" y="75" width="35" height="17" rx="4" fill="white" opacity="0.72" transform="rotate(8 37 84)" />
            <path data-theme-detail="true" d="M25 82 H49 M25 88 H43" stroke={primary} strokeWidth="2" strokeLinecap="round" opacity="0.42" transform="rotate(8 37 84)" />
            <path data-theme-detail="true" d="M90 26 L94 34 L103 35 L96 41 L98 50 L90 45 L82 50 L84 41 L77 35 L86 34 Z" fill={secondary} opacity="0.86" />
            <path data-theme-detail="true" d="M30 31 H42 M36 25 V37" stroke={accent} strokeWidth="3" strokeLinecap="round" opacity="0.72" />
            <rect data-theme-detail="true" x="78" y="75" width="18" height="7" rx="3.5" fill={accent} opacity="0.72" />
            {sceneMarker}
          </g>
        ),
        body: (
          <path
            d="M73 18 C53 24 39 42 39 62 C39 82 53 96 73 101 C64 107 44 105 30 92 C14 77 13 49 29 31 C43 15 63 12 73 18 Z"
            fill={primary}
          />
        ),
        accessory: (
          <>
            <path d="M75 36 L80 45 L90 47 L83 54 L84 64 L75 59 L66 64 L68 54 L60 47 L70 45 Z" fill={secondary} />
            <rect x="48" y="78" width="30" height="8" rx="4" fill={accent} opacity="0.85" />
          </>
        ),
        mouth: <path d="M51 68 Q58 72 65 68" stroke={text} strokeWidth="3" fill="none" strokeLinecap="round" />,
      };
    case 'Mochi':
    default:
      return {
        eyeY: 58,
        scene: (
          <g data-theme-scene="true">
            <path data-theme-detail="true" d="M18 79 L32 54 L46 79 Z" fill={secondary} opacity="0.62" />
            <path data-theme-detail="true" d="M23 79 L32 63 L41 79 Z" fill="white" opacity="0.52" />
            <path data-theme-detail="true" d="M82 32 H99 L96 38 H82 Z" fill={accent} opacity="0.86" />
            <path data-theme-detail="true" d="M82 32 V50" stroke={text} strokeWidth="3" strokeLinecap="round" opacity="0.38" />
            <path data-theme-detail="true" d="M80 84 L85 74 L90 84 M85 74 V68" stroke={secondary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.78" />
            <circle data-theme-detail="true" cx="27" cy="38" r="3" fill={accent} opacity="0.85" />
            {sceneMarker}
          </g>
        ),
        body: (
          <>
            <path
              d="M57 22 C77 22 91 38 91 60 C91 83 76 96 57 96 C38 96 23 83 23 60 C23 38 37 22 57 22 Z"
              fill={primary}
            />
            <path d="M42 23 C45 12 55 12 57 24 C62 13 73 16 72 29" fill="none" stroke={secondary} strokeWidth="7" strokeLinecap="round" />
          </>
        ),
        accessory: <circle cx="78" cy="41" r="8" fill={accent} opacity="0.9" />,
        mouth: <path d="M47 69 Q57 77 67 69" stroke={text} strokeWidth="3" fill="none" strokeLinecap="round" />,
      };
  }
};

const OriginalMascot: React.FC<OriginalMascotProps> = ({
  theme,
  character,
  state = 'idle',
  size = 96,
  className = '',
}) => {
  const activeCharacter = character ?? theme.character;
  const recipe = getRecipe(theme, activeCharacter);
  const motionConfig = stateMotion[state];
  const mascot = activeCharacter?.mascot ?? 'Cozy';
  const label = activeCharacter?.displayName ?? theme.name;

  return (
    <motion.svg
      role="img"
      aria-label={label}
      data-mascot={mascot}
      data-mascot-variant={activeCharacter?.variantId ?? 'default'}
      className={className}
      width={size}
      height={size}
      viewBox="0 0 114 114"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ y: motionConfig.y, rotate: motionConfig.rotate, scale: motionConfig.scale }}
      transition={{ duration: motionConfig.duration, repeat: Infinity, ease: 'easeInOut' }}
    >
      <circle cx="57" cy="57" r="53" fill={theme.colors.surface} />
      <circle cx="57" cy="57" r="48" fill={theme.colors.bg} opacity="0.78" />
      {recipe.scene}
      <g filter="url(#mascot-shadow)">
        {recipe.body}
        {recipe.accessory}
      </g>
      <circle cx="45" cy={recipe.eyeY} r="4" fill={theme.colors.text} />
      <circle cx="69" cy={recipe.eyeY} r="4" fill={theme.colors.text} />
      <circle cx="43" cy={recipe.eyeY - 2} r="1.4" fill="white" opacity="0.9" />
      <circle cx="67" cy={recipe.eyeY - 2} r="1.4" fill="white" opacity="0.9" />
      {recipe.mouth}
      <circle cx="35" cy={recipe.eyeY + 12} r="5" fill={theme.colors.accent} opacity="0.24" />
      <circle cx="79" cy={recipe.eyeY + 12} r="5" fill={theme.colors.accent} opacity="0.24" />
      <defs>
        <filter id="mascot-shadow" x="8" y="0" width="98" height="112" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor={theme.colors.primary} floodOpacity="0.22" />
        </filter>
      </defs>
    </motion.svg>
  );
};

export default OriginalMascot;
