import { describe, expect, it } from 'vitest';
import type { FocusTheme } from '../../types/pomodoro';
import {
  DEFAULT_VISUAL_THEME_ID,
  ORIGINAL_CARTOON_THEME_IDS,
  VISUAL_THEMES,
  getThemeCharacterVariants,
  resolveThemeCharacter,
  resolveThemeCharacterForProject,
  resolveVisualTheme,
} from '../themes';

const forbiddenIpPattern = /chiikawa|shin-?chan|hachiware|usagi|kazama|shiro|action-mask/i;

describe('visual themes', () => {
  it('publishes six original cartoon themes without legacy IP identifiers', () => {
    expect(ORIGINAL_CARTOON_THEME_IDS).toEqual([
      'mochi-camp',
      'stationery-town',
      'cloud-academy',
      'bean-planet',
      'forest-lighthouse',
      'moon-library',
    ]);

    const originalThemes = VISUAL_THEMES.filter((theme) =>
      ORIGINAL_CARTOON_THEME_IDS.includes(theme.id as (typeof ORIGINAL_CARTOON_THEME_IDS)[number])
    );

    for (const theme of originalThemes) {
      expect(theme.id).not.toMatch(forbiddenIpPattern);
      expect(theme.name).not.toMatch(forbiddenIpPattern);
      expect(theme.decorations?.pattern ?? '').not.toMatch(forbiddenIpPattern);
      expect(theme.decorations?.cursorStyle ?? '').not.toMatch(forbiddenIpPattern);
    }
  });

  it('keeps the existing visual themes available alongside the originals', () => {
    const publishedIds = VISUAL_THEMES.map((theme) => theme.id);

    expect(publishedIds).toEqual(
      expect.arrayContaining([
        ...ORIGINAL_CARTOON_THEME_IDS,
        DEFAULT_VISUAL_THEME_ID,
        'chiikawa',
        'shinchan',
        'dark',
      ])
    );
    expect(resolveVisualTheme('chiikawa').id).toBe('chiikawa');
    expect(resolveVisualTheme('shinchan').id).toBe('shinchan');
  });

  it('gives every original cartoon theme enough character metadata to render the UI', () => {
    const originalThemes = VISUAL_THEMES.filter((theme) =>
      ORIGINAL_CARTOON_THEME_IDS.includes(theme.id as (typeof ORIGINAL_CARTOON_THEME_IDS)[number])
    );

    expect(originalThemes).toHaveLength(6);

    for (const theme of originalThemes) {
      expect(theme.character).toEqual(
        expect.objectContaining({
          displayName: expect.any(String),
          companionTitle: expect.any(String),
          companionSubtitle: expect.any(String),
          mascot: expect.any(String),
          focusLabel: expect.any(String),
        })
      );
      expect(theme.character!.displayName.length).toBeGreaterThan(1);
      expect(theme.character!.companionSubtitle).not.toMatch(forbiddenIpPattern);
      expect(theme.character!.phaseSymbols).toEqual(
        expect.objectContaining({
          focus: expect.any(String),
          shortBreak: expect.any(String),
          longBreak: expect.any(String),
        })
      );
    }
  });

  it('resolves unknown theme ids back to the default theme', () => {
    expect(resolveVisualTheme('not-a-real-theme').id).toBe(DEFAULT_VISUAL_THEME_ID);
  });

  it('publishes multiple complete character variants for every original cartoon theme', () => {
    for (const themeId of ORIGINAL_CARTOON_THEME_IDS) {
      const theme = resolveVisualTheme(themeId);
      const variants = getThemeCharacterVariants(theme);

      expect(variants.length).toBeGreaterThanOrEqual(5);

      for (const variant of variants) {
        expect(variant.variantId).toMatch(/^[a-z0-9-]+$/);
        expect(variant.displayName.length).toBeGreaterThan(1);
        expect(variant.companionTitle.length).toBeGreaterThan(1);
        expect(variant.companionSubtitle).not.toMatch(forbiddenIpPattern);
        expect(variant.focusLabel.length).toBeGreaterThan(1);
        expect(variant.projectIds?.length ?? 0).toBeGreaterThanOrEqual(1);
        expect(variant.phaseSymbols).toEqual(
          expect.objectContaining({
            focus: expect.any(String),
            shortBreak: expect.any(String),
            longBreak: expect.any(String),
          })
        );
      }
    }
  });

  it('resolves default focus projects to distinct variants within the same original theme', () => {
    const theme = resolveVisualTheme('mochi-camp');
    const projects: FocusTheme[] = [
      { id: 'english', name: 'English', focusDuration: 25, isDefault: true },
      { id: '408', name: '408', focusDuration: 45, isDefault: true },
      { id: 'math', name: 'Math', focusDuration: 60, isDefault: true },
    ];

    const resolvedIds = projects.map((project) =>
      resolveThemeCharacterForProject(theme, project).variantId
    );

    expect(new Set(resolvedIds).size).toBe(3);
  });

  it('resolves custom focus projects deterministically', () => {
    const theme = resolveVisualTheme('moon-library');
    const customProject: FocusTheme = {
      id: 'custom-linear-algebra',
      name: 'Linear Algebra',
      focusDuration: 50,
      isDefault: false,
    };

    const first = resolveThemeCharacterForProject(theme, customProject);
    const second = resolveThemeCharacterForProject(theme, customProject);

    expect(first.variantId).toBe(second.variantId);
    expect(getThemeCharacterVariants(theme).map((variant) => variant.variantId)).toContain(first.variantId);
  });

  it('falls back to the default character for non-original themes', () => {
    const cozy = resolveVisualTheme('cozy');

    expect(resolveThemeCharacter(cozy).displayName).toBe(cozy.character?.displayName);
    expect(getThemeCharacterVariants(cozy)).toHaveLength(1);
  });
});
