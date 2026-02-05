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
    name: 'Chiikawa',
    colors: {
      bg: '#FFF0F5',
      surface: 'rgba(255, 255, 255, 0.6)',
      glass: 'rgba(255, 255, 255, 0.4)',
      primary: '#FFB6C1',
      secondary: '#E0FFFF',
      accent: '#FFFACD',
      text: '#452A22',
      textMuted: '#7D6B66',
      border: '#FFC0CB',
    },
    shadows: {
      cozy: '0 20px 50px -10px rgba(0, 0, 0, 0.1)',
      elevated: '0 40px 100px -20px rgba(0, 0, 0, 0.15)',
    },
    borderRadius: '4rem',
    fontHeading: '"Varela Round"',
    fontSans: '"Quicksand"',
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
