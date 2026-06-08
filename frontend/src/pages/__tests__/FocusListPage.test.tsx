import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import FocusListPage from '../FocusListPage';
import { ORIGINAL_CARTOON_THEME_IDS } from '../../constants/themes';

const mockTimerState = vi.hoisted(() => ({
  activeVisualThemeId: 'mochi-camp',
}));

vi.mock('../../contexts/useTimerContext', () => ({
  useTimerContext: () => ({
    state: {
      activeThemeId: 'english',
      activeVisualThemeId: mockTimerState.activeVisualThemeId,
      phase: 'focus',
      settings: {
        useDefaultThemeIcon: true,
      },
      themes: [
        { id: 'english', name: '英语', focusDuration: 25, isDefault: true },
        { id: '408', name: '408', focusDuration: 25, isDefault: true },
        { id: 'math', name: '数学', focusDuration: 25, isDefault: true },
      ],
    },
    isActive: false,
    timeLeft: 1500,
    totalTimeValue: 1500,
    reset: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'zh' },
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key,
  }),
}));

describe('FocusListPage', () => {
  it.each(ORIGINAL_CARTOON_THEME_IDS)('uses rich original-theme scenes for home theme icons with %s', (visualThemeId) => {
    mockTimerState.activeVisualThemeId = visualThemeId;

    render(
      <MemoryRouter>
        <FocusListPage />
      </MemoryRouter>
    );

    const variants = ['english', '408', 'math'].map((themeId) => {
      const preview = screen.getByTestId(`home-original-theme-icon-${themeId}`);
      const mascot = preview.querySelector('[data-mascot-variant]');

      expect(preview.querySelector('[data-theme-scene]')).toBeInTheDocument();
      expect(preview.querySelectorAll('[data-theme-card-element]').length).toBeGreaterThanOrEqual(4);
      expect(mascot).toBeInTheDocument();

      return mascot?.getAttribute('data-mascot-variant');
    });

    expect(new Set(variants).size).toBe(3);
  });
});
