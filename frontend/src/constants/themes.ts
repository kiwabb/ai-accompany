import type { VisualTheme } from '../types/pomodoro';

export const VISUAL_THEMES: VisualTheme[] = [
  {
    id: 'cozy',
    name: 'Cozy',
    colors: {
      bg: '#FDF7E4',
      surface: 'rgba(255, 253, 250, 0.75)',
      glass: 'rgba(255, 253, 250, 0.5)',
      primary: '#FFB766',
      secondary: '#D4EDDA',
      accent: '#FF6B6B',
      text: '#2D2923',
      textMuted: '#6D6556',
      border: 'rgba(74, 68, 57, 0.1)',
    },
    shadows: {
      cozy: '0 10px 30px -5px rgba(74, 68, 57, 0.1), 0 4px 15px -5px rgba(74, 68, 57, 0.05)',
      elevated: '0 20px 40px -10px rgba(74, 68, 57, 0.15), 0 8px 24px -8px rgba(74, 68, 57, 0.1)',
    },
    borderRadius: '2rem',
    fontHeading: '"Fredoka"',
    fontSans: '"Nunito"',
  },
  {
    id: 'chiikawa',
    name: 'Chiikawa ♡',
    colors: {
      bg: '#FFF5F8',           // 超柔和的粉色背景
      surface: 'rgba(255, 255, 255, 0.85)',
      glass: 'rgba(255, 248, 250, 0.7)',
      primary: '#FFB5C5',      // Chiikawa的经典粉色
      secondary: '#B8E6F0',    // Hachiware的蓝绿色
      accent: '#FFFACD',       // Usagi的黄色
      text: '#5D4037',         // 温暖的棕色文字
      textMuted: '#A1887F',
      border: 'rgba(255, 182, 193, 0.5)',
    },
    shadows: {
      cozy: '0 8px 32px rgba(255, 182, 193, 0.25), 0 4px 16px rgba(255, 182, 193, 0.15)',
      elevated: '0 16px 48px rgba(255, 182, 193, 0.3), 0 8px 24px rgba(255, 182, 193, 0.2)',
    },
    borderRadius: '2.5rem',
    fontHeading: '"Zen Maru Gothic", "Kiwi Maru", "M PLUS Rounded 1c", "Nunito"',
    fontSans: '"Zen Maru Gothic", "Kiwi Maru", "M PLUS Rounded 1c", "Nunito"',
    decorations: {
      enabled: true,
      pattern: 'chiikawa-dots',
      floatingElements: true,
      cursorStyle: 'chiikawa',
    },
  },
  {
    id: 'dark',
    name: 'Deep Night',
    colors: {
      bg: '#0F172A',
      surface: 'rgba(30, 41, 40, 0.95)',
      glass: 'rgba(30, 41, 59, 0.8)',
      primary: '#818CF8',
      secondary: '#34D399',
      accent: '#FB7185',
      text: '#FFFFFF',
      textMuted: '#CBD5E1',
      border: 'rgba(255, 255, 255, 0.2)',
    },
    shadows: {
      cozy: '0 10px 30px -5px rgba(0, 0, 0, 0.5)',
      elevated: '0 20px 40px -10px rgba(0, 0, 0, 0.7)',
    },
    borderRadius: '1.5rem',
    fontHeading: '"Fredoka"',
    fontSans: '"Nunito"',
  }
];

export const DEFAULT_VISUAL_THEME_ID = 'cozy';

// Chiikawa character emojis and decorative elements
export const CHIIKAWA_ELEMENTS = {
  characters: ['🐱', '🐰', '🦔', '🐻', '🌸', '✨', '💫', '🎀', '🌷', '🍀'],
  stickers: [
    '( ˘ω˘ )', '(◕‿◕)', '(｡♥‿♥｡)', '(◠‿◠)', '♡(◕ᗜ◕✿)',
    '(◕ᴗ◕✿)', '(✿◠‿◠)', '٩(◕‿◕)۶', '(◕દ◕)', '♪(´ε｀ )'
  ],
  sparkles: ['✦', '✧', '★', '☆', '✩', '✪', '✫', '✬', '✭', '✮'],
};
