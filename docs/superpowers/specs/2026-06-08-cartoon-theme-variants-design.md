# Cartoon Theme Variants Design

## Context

AI Accompany already has an original cartoon visual theme system. The current frontend defines six original themes in `frontend/src/constants/themes.ts`, renders one inline SVG character per theme through `OriginalMascot`, and adds themed background motifs through `OriginalThemeDecorations`. The home focus project cards use the active visual theme, but every focus project currently receives the same character inside that theme.

The requested change is to give each theme multiple cartoon characters, assign those characters to different focus projects, and enrich the background so the theme feels like a small cast and scene instead of a single mascot.

## Goals

- Each original cartoon theme has several distinct character variants.
- Default focus projects get stable, intentional character assignments.
- Custom focus projects get a deterministic fallback character so their card does not collapse back to a generic mascot.
- Home project cards show the project-specific character and a project-specific mini background.
- Global background decorations use multiple characters and richer motifs from the active theme.
- Timer and CozyPal surfaces can resolve the active project character without duplicating mapping logic.
- Existing legacy themes and non-original themes keep their current behavior.

## Non-Goals

- Do not add new backend storage for character assignment in this pass.
- Do not generate or download bitmap assets.
- Do not expand each project into a separate visual theme.
- Do not remove legacy theme support while it still exists in the codebase.

## Recommended Approach

Add a structured character variant model to the existing `VisualTheme` shape.

Each original theme keeps its existing `character` as the default companion, then gains a `characterVariants` array. A helper resolves the best variant for a `FocusTheme` using this order:

1. Direct project id match.
2. Project icon type match, when the user has configured an icon.
3. Deterministic hash fallback using the project id.
4. Theme default character if variants are unavailable.

This keeps the implementation local to the frontend visual theme system and avoids changing persisted settings.

## Character Sets

Each original theme should ship with at least five variants for the existing default focus projects:

- `english`: language or reading-oriented character.
- `408`: algorithm, computer science, or exam-training character.
- `math`: geometry, formula, or calculation character.
- `momonga`: relaxed review or light-focus character.
- `kurimanju`: short-session or rest-adjacent character.

Proposed theme casts:

- `mochi-camp`: vocabulary backpack mochi, algorithm flag mochi, compass mochi, tea-break mochi, night-reading mochi.
- `stationery-town`: dictionary pencil, grid eraser, compass clerk, memo post pal, tape rest helper.
- `cloud-academy`: word cloud, formula rain cloud, geometry sun cloud, nap cloud, lightning review cloud.
- `bean-planet`: language bean, code bean, math bean, oxygen bean, telescope bean.
- `forest-lighthouse`: reading lamp sprout, algorithm lighthouse sprout, geometry sapling, tea firefly, night-navigation sprout.
- `moon-library`: word-card moon page, formula star page, compass moon page, cushion bookmark, deep-night librarian.

Names can be stored in Chinese for accessible labels and in short English identifiers for stable `variantId` values.

## UI Behavior

### Home Focus Cards

When an original visual theme is active, each focus project card resolves a character variant from that theme. The card preview uses:

- the resolved character variant,
- the active theme color palette,
- a small project-specific background scene,
- stable dimensions so cards do not shift when characters change.

The current generic original card preview becomes a reusable component that accepts `{ visualTheme, focusTheme }`.

### Timer Page

The timer page should resolve the active project's character variant and pass it to timer display surfaces that currently render `OriginalMascot`. This makes the in-session character match the project selected from the home page.

### CozyPal

CozyPal should keep using the active visual theme style, but its avatar button/header can receive the active project character when available. This makes the companion feel attached to the current focus project while preserving the broader theme identity.

### Background

`OriginalThemeDecorations` should use all variants for the active theme:

- floating characters rotate through the theme's variants instead of repeating the default character,
- motif clusters include project-flavored scene props,
- symbol chips can use variant focus symbols in addition to the theme phase symbols.

The background remains decorative, fixed behind content, pointer-events disabled, and low opacity.

## Data Model

Add a reusable character type:

```ts
export interface VisualThemeCharacter {
  variantId: string;
  displayName: string;
  companionTitle: string;
  companionSubtitle: string;
  mascot: string;
  focusLabel: string;
  accentShape: VisualThemeAccentShape;
  projectIds?: string[];
  scene?: 'language' | 'code' | 'math' | 'review' | 'rest' | 'default';
  phaseSymbols: Record<Phase, string>;
}
```

Then update `VisualTheme.character` to use that type and add:

```ts
characterVariants?: VisualThemeCharacter[];
```

`OriginalMascot` should accept an optional `character` prop. If present, it renders that character with the parent theme palette. If omitted, it uses `theme.character` as it does now.

## Helper API

Add helper functions near the theme constants:

- `resolveThemeCharacter(theme, focusThemeOrId?)`
- `resolveThemeCharacterForProject(theme, focusTheme)`
- `getThemeCharacterVariants(theme)`

These helpers centralize fallback behavior so pages and components do not copy mapping logic.

## Accessibility

- Every rendered character remains an inline SVG with `role="img"` and an accessible label from the variant display name.
- Decorative background character instances remain inside `aria-hidden` containers.
- Icon-only controls are not introduced by this change.
- Project card text remains the actual focus project name, not only a visual label.

## Performance

- Continue using inline SVG and CSS/framer-motion primitives; no network image loading for the new original characters.
- Keep background opacity low and element count bounded.
- Reuse the existing small SVG viewBox instead of adding large illustrations.
- Preserve stable preview dimensions to avoid layout shift.

## Testing

Add or update tests to prove:

- every original cartoon theme publishes multiple variants,
- each variant has complete metadata and no legacy IP names,
- default project ids resolve to distinct variants within a theme,
- unknown custom project ids resolve deterministically,
- `OriginalMascot` can render a provided variant,
- home cards render different original character variants for different focus projects,
- background decorations use multiple variants and still provide rich motif clusters.

## Acceptance Criteria

- Each original theme has at least five character variants.
- The home focus list shows different characters for different default focus projects under the same active original theme.
- Custom focus projects receive a stable variant without manual configuration.
- Timer and CozyPal render the active project character where original mascots are shown.
- The background includes multiple themed characters and scene motifs, not only repeated copies of the default mascot.
- Existing non-original and legacy themes still render as before.
- Focused tests for theme metadata, character resolution, mascot rendering, project cards, and background decorations pass.
