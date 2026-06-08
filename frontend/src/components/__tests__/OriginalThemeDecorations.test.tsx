import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import OriginalThemeDecorations from '../OriginalThemeDecorations';
import { ORIGINAL_CARTOON_THEME_IDS, resolveVisualTheme } from '../../constants/themes';

describe('OriginalThemeDecorations', () => {
  it.each(ORIGINAL_CARTOON_THEME_IDS)('adds rich themed background motifs beyond floating mascots for %s', (themeId) => {
    render(<OriginalThemeDecorations theme={resolveVisualTheme(themeId)} enabled />);

    const motifLayer = screen.getByTestId('original-theme-background-motifs');
    const variants = Array.from(motifLayer.parentElement!.querySelectorAll('[data-mascot-variant]'))
      .map((node) => node.getAttribute('data-mascot-variant'));

    expect(motifLayer.querySelectorAll('[data-theme-background-motif]').length).toBeGreaterThanOrEqual(10);
    expect(motifLayer.querySelectorAll('[data-theme-background-cluster]').length).toBeGreaterThanOrEqual(4);
    expect(new Set(variants).size).toBeGreaterThanOrEqual(3);
  });
});
