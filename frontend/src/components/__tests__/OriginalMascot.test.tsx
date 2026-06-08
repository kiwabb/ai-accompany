import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import OriginalMascot from '../OriginalMascot';
import { ORIGINAL_CARTOON_THEME_IDS, resolveVisualTheme } from '../../constants/themes';

describe('OriginalMascot', () => {
  it('renders the selected original character as inline art with an accessible label', () => {
    const theme = resolveVisualTheme('mochi-camp');

    const { container } = render(
      <OriginalMascot theme={theme} state="focused" size={96} />
    );

    expect(screen.getByRole('img', { name: '糯糯队长' })).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('changes its rendered art when another original theme is selected', () => {
    const { rerender } = render(
      <OriginalMascot theme={resolveVisualTheme('stationery-town')} state="idle" size={80} />
    );

    expect(screen.getByRole('img', { name: '铅笔邮差' })).toHaveAttribute(
      'data-mascot',
      'Pencil'
    );

    rerender(
      <OriginalMascot theme={resolveVisualTheme('moon-library')} state="idle" size={80} />
    );

    expect(screen.getByRole('img', { name: '月页管理员' })).toHaveAttribute(
      'data-mascot',
      'Moon'
    );
  });

  it.each(ORIGINAL_CARTOON_THEME_IDS)('renders a richer icon scene for %s', (themeId) => {
    const { container } = render(
      <OriginalMascot theme={resolveVisualTheme(themeId)} state="idle" size={96} />
    );

    expect(container.querySelector('[data-theme-scene]')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-theme-detail]').length).toBeGreaterThanOrEqual(4);
  });

  it('renders a provided character variant instead of the theme default', () => {
    const theme = resolveVisualTheme('mochi-camp');
    const variant = theme.characterVariants!.find((item) => item.variantId === 'mochi-code')!;

    render(<OriginalMascot theme={theme} character={variant} state="focused" size={96} />);

    expect(screen.getByRole('img', { name: '算法旗手糯' })).toHaveAttribute('data-mascot-variant', 'mochi-code');
  });
});
