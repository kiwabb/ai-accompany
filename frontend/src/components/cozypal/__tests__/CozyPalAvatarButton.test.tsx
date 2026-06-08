import { render, screen } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import { resolveThemeCharacterForProject, resolveVisualTheme } from '../../../constants/themes';
import CozyPalAvatarButton from '../CozyPalAvatarButton';

const t = ((key: string) => key) as TFunction;

describe('CozyPalAvatarButton', () => {
  it('keeps the Chiikawa avatar artwork for the legacy Chiikawa theme', () => {
    render(
      <CozyPalAvatarButton
        avatarState="idle"
        hasUnread={false}
        onToggle={vi.fn()}
        t={t}
        visualTheme={resolveVisualTheme('chiikawa')}
      />
    );

    expect(screen.getByAltText('Chiikawa')).toHaveAttribute(
      'src',
      '/assets/chiikawa/sticker-0.png'
    );
  });

  it('keeps the Shin-chan avatar artwork for the legacy Shin-chan theme', () => {
    render(
      <CozyPalAvatarButton
        avatarState="focused"
        hasUnread={false}
        onToggle={vi.fn()}
        t={t}
        visualTheme={resolveVisualTheme('shinchan')}
      />
    );

    expect(screen.getByAltText('Shin-chan')).toHaveAttribute(
      'src',
      '/assets/shinchan/shiro-animated.gif'
    );
  });

  it('renders the active focus project character for original themes', () => {
    const visualTheme = resolveVisualTheme('mochi-camp');
    const activeCharacter = resolveThemeCharacterForProject(visualTheme, {
      id: '408',
      name: '408',
      focusDuration: 45,
      isDefault: true,
    });

    render(
      <CozyPalAvatarButton
        avatarState="focused"
        hasUnread={false}
        onToggle={vi.fn()}
        t={t}
        visualTheme={visualTheme}
        activeCharacter={activeCharacter}
      />
    );

    expect(screen.getByRole('img', { name: '算法旗手糯' })).toHaveAttribute('data-mascot-variant', 'mochi-code');
  });
});
