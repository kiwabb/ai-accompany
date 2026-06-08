import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import VisualThemeSelector from '../VisualThemeSelector';
import { ORIGINAL_CARTOON_THEME_IDS } from '../../constants/themes';

vi.mock('../../contexts/useTimerContext', () => ({
  useTimerContext: () => ({
    state: {
      activeVisualThemeId: 'cozy',
      settings: {
        useDefaultThemeIcon: true,
      },
    },
    handleVisualThemeChange: vi.fn(),
    handleUpdateSetting: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

describe('VisualThemeSelector', () => {
  it('gives every original cartoon theme a larger scene preview in the theme card', () => {
    render(<VisualThemeSelector />);

    for (const themeId of ORIGINAL_CARTOON_THEME_IDS) {
      const preview = screen.getByTestId(`original-theme-preview-${themeId}`);
      const mascot = within(preview).getByRole('img');

      expect(mascot).toHaveAttribute('width', '72');
      expect(preview.querySelector('[data-theme-scene]')).toBeInTheDocument();
      expect(preview.querySelectorAll('[data-theme-detail]').length).toBeGreaterThanOrEqual(4);
    }
  });
});
