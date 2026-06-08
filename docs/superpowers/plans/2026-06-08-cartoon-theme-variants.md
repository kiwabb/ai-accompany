# Cartoon Theme Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multiple original cartoon character variants per visual theme, assign them to focus projects, and enrich the original-theme backgrounds with the full theme cast.

**Architecture:** Extend the existing frontend-only visual theme model with `VisualThemeCharacter` and `characterVariants`, then centralize project-to-character lookup in theme helpers. Reuse the current inline SVG mascot renderer by passing a resolved character variant into `OriginalMascot`, project cards, timer display, CozyPal, and background decorations.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, React Testing Library, framer-motion, Tailwind CSS.

---

## File Structure

- Modify `frontend/src/types/pomodoro.ts`: add `VisualThemeCharacter`, `VisualThemeAccentShape`, `VisualThemeCharacterScene`, and `VisualThemeCharacterTone`; update `VisualTheme.character`.
- Modify `frontend/src/constants/themes.ts`: add helpers for character resolution and add at least five variants to each original theme.
- Modify `frontend/src/constants/__tests__/themes.test.ts`: test variant metadata and deterministic project resolution.
- Modify `frontend/src/components/OriginalMascot.tsx`: accept optional `character` prop and use it to choose the rendered recipe, label, and symbols.
- Modify `frontend/src/components/__tests__/OriginalMascot.test.tsx`: test variant rendering.
- Create `frontend/src/components/OriginalProjectCardArt.tsx`: reusable project-specific original-theme card art.
- Modify `frontend/src/pages/FocusListPage.tsx`: use `OriginalProjectCardArt` and project-specific resolved characters.
- Modify `frontend/src/pages/__tests__/FocusListPage.test.tsx`: verify default focus projects render distinct variants.
- Modify `frontend/src/components/TimerDisplay.tsx`: resolve active focus project character for original themes and pass it to `OriginalMascot`.
- Modify `frontend/src/App.tsx`: pass the active focus theme into CozyPal.
- Modify `frontend/src/components/CozyPal.tsx`: accept `activeFocusTheme?: FocusTheme`.
- Modify `frontend/src/components/cozypal/CozyPalAvatarButton.tsx`: accept and render an optional original character.
- Modify `frontend/src/components/cozypal/CozyPalHeader.tsx`: accept and render an optional original character.
- Modify `frontend/src/components/cozypal/CozyPalDrawer.tsx` and `frontend/src/components/cozypal/CozyPalBottomSheet.tsx`: pass the original character to `CozyPalHeader`.
- Modify `frontend/src/components/OriginalThemeDecorations.tsx`: rotate floating background characters through variants and add variant-aware symbols.
- Modify `frontend/src/components/__tests__/OriginalThemeDecorations.test.tsx`: verify background uses multiple variants.

## Task 1: Theme Character Types And Resolver

**Files:**
- Modify: `frontend/src/types/pomodoro.ts`
- Modify: `frontend/src/constants/themes.ts`
- Modify: `frontend/src/constants/__tests__/themes.test.ts`

- [ ] **Step 1: Add failing resolver tests**

Add these imports to `frontend/src/constants/__tests__/themes.test.ts`:

```ts
import type { FocusTheme } from '../../types/pomodoro';
import {
  getThemeCharacterVariants,
  resolveThemeCharacter,
  resolveThemeCharacterForProject,
} from '../themes';
```

Add these tests inside `describe('visual themes', () => { ... })`:

```ts
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
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
cd frontend && pnpm test -- src/constants/__tests__/themes.test.ts --run
```

Expected: FAIL because `getThemeCharacterVariants`, `resolveThemeCharacter`, `resolveThemeCharacterForProject`, and the new fields do not exist.

- [ ] **Step 3: Add character types**

In `frontend/src/types/pomodoro.ts`, replace the inline `character` type with named exports:

```ts
export type VisualThemeAccentShape =
  | 'sprout'
  | 'pencil'
  | 'cloud'
  | 'planet'
  | 'lamp'
  | 'moon'
  | 'cozy'
  | 'night';

export type VisualThemeCharacterScene =
  | 'language'
  | 'code'
  | 'math'
  | 'review'
  | 'rest'
  | 'default';

export type VisualThemeCharacterTone =
  | 'steady'
  | 'bright'
  | 'curious'
  | 'quiet'
  | 'restful';

export interface VisualThemeCharacter {
  variantId: string;
  displayName: string;
  companionTitle: string;
  companionSubtitle: string;
  mascot: string;
  focusLabel: string;
  accentShape: VisualThemeAccentShape;
  projectIds?: string[];
  scene?: VisualThemeCharacterScene;
  tone?: VisualThemeCharacterTone;
  phaseSymbols: Record<Phase, string>;
}
```

Update `VisualTheme`:

```ts
  character?: VisualThemeCharacter;
  characterVariants?: VisualThemeCharacter[];
```

- [ ] **Step 4: Add resolver helpers**

In `frontend/src/constants/themes.ts`, update the import:

```ts
import type { FocusTheme, VisualTheme, VisualThemeCharacter } from '../types/pomodoro';
```

Add these helpers after `isOriginalCartoonThemeId`:

```ts
const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

export const getThemeCharacterVariants = (theme: VisualTheme): VisualThemeCharacter[] => {
  if (theme.characterVariants && theme.characterVariants.length > 0) {
    return theme.characterVariants;
  }

  return theme.character ? [theme.character] : [];
};

export const resolveThemeCharacter = (
  theme: VisualTheme,
  focusThemeOrId?: FocusTheme | string
): VisualThemeCharacter => {
  const variants = getThemeCharacterVariants(theme);
  const fallback = theme.character ?? variants[0];

  if (!focusThemeOrId || variants.length === 0) {
    return fallback;
  }

  const projectId = typeof focusThemeOrId === 'string' ? focusThemeOrId : focusThemeOrId.id;
  const iconType = typeof focusThemeOrId === 'string' ? undefined : focusThemeOrId.iconType;

  const directMatch = variants.find((variant) => variant.projectIds?.includes(projectId));
  if (directMatch) return directMatch;

  if (iconType) {
    const iconMatch = variants.find((variant) => variant.projectIds?.includes(iconType));
    if (iconMatch) return iconMatch;
  }

  return variants[hashString(projectId) % variants.length] ?? fallback;
};

export const resolveThemeCharacterForProject = (
  theme: VisualTheme,
  focusTheme: FocusTheme
): VisualThemeCharacter => {
  return resolveThemeCharacter(theme, focusTheme);
};
```

- [ ] **Step 5: Run tests**

Run:

```bash
cd frontend && pnpm test -- src/constants/__tests__/themes.test.ts --run
```

Expected: tests still FAIL because original themes do not yet publish multiple variants.

## Task 2: Original Theme Variant Metadata

**Files:**
- Modify: `frontend/src/constants/themes.ts`
- Modify: `frontend/src/constants/__tests__/themes.test.ts`

- [ ] **Step 1: Add the variant metadata**

For each object inside `originalCartoonThemes`, keep the existing `character` and add a `characterVariants` array. For `mochi-camp`, use this exact structure:

```ts
    characterVariants: [
      {
        variantId: 'mochi-language',
        displayName: '单词背包糯',
        companionTitle: 'Mochi Word Scout',
        companionSubtitle: 'Carries new words through every focus trail',
        mascot: 'Mochi',
        focusLabel: 'WORD TRAIL',
        accentShape: 'sprout',
        projectIds: ['english'],
        scene: 'language',
        tone: 'bright',
        phaseSymbols: { focus: '词', shortBreak: '茶', longBreak: '眠' },
      },
      {
        variantId: 'mochi-code',
        displayName: '算法旗手糯',
        companionTitle: 'Mochi Algorithm Lead',
        companionSubtitle: 'Marks checkpoints for long exam climbs',
        mascot: 'Mochi',
        focusLabel: 'ALGO CAMP',
        accentShape: 'sprout',
        projectIds: ['408', 'work'],
        scene: 'code',
        tone: 'steady',
        phaseSymbols: { focus: '算', shortBreak: '旗', longBreak: '营' },
      },
      {
        variantId: 'mochi-math',
        displayName: '圆规糯糯',
        companionTitle: 'Mochi Compass Mate',
        companionSubtitle: 'Keeps formulas soft but precise',
        mascot: 'Mochi',
        focusLabel: 'GEOMETRY CAMP',
        accentShape: 'sprout',
        projectIds: ['math'],
        scene: 'math',
        tone: 'curious',
        phaseSymbols: { focus: '几', shortBreak: '圆', longBreak: '梦' },
      },
      {
        variantId: 'mochi-review',
        displayName: '复盘茶点糯',
        companionTitle: 'Mochi Review Baker',
        companionSubtitle: 'Turns small reviews into warm progress',
        mascot: 'Mochi',
        focusLabel: 'REVIEW CAMP',
        accentShape: 'sprout',
        projectIds: ['momonga', 'study'],
        scene: 'review',
        tone: 'restful',
        phaseSymbols: { focus: '复', shortBreak: '点', longBreak: '香' },
      },
      {
        variantId: 'mochi-rest',
        displayName: '夜读被窝糯',
        companionTitle: 'Mochi Night Reader',
        companionSubtitle: 'Keeps short sessions calm and tucked in',
        mascot: 'Mochi',
        focusLabel: 'COZY CAMP',
        accentShape: 'sprout',
        projectIds: ['kurimanju', 'rest'],
        scene: 'rest',
        tone: 'quiet',
        phaseSymbols: { focus: '阅', shortBreak: '被', longBreak: '月' },
      },
    ],
```

Add analogous arrays for the other five original themes using these variant ids and display names:

```ts
// stationery-town
'stationery-language' -> '词典铅笔'
'stationery-code' -> '网格橡皮'
'stationery-math' -> '圆规书记'
'stationery-review' -> '便签邮差'
'stationery-rest' -> '胶带休息员'

// cloud-academy
'cloud-language' -> '单词云朵'
'cloud-code' -> '公式雨云'
'cloud-math' -> '几何太阳云'
'cloud-review' -> '复盘闪电云'
'cloud-rest' -> '梦游小云'

// bean-planet
'bean-language' -> '语言豆豆'
'bean-code' -> '代码豆豆'
'bean-math' -> '数学豆豆'
'bean-review' -> '氧气豆豆'
'bean-rest' -> '望远镜豆豆'

// forest-lighthouse
'forest-language' -> '阅读灯芽'
'forest-code' -> '算法灯塔芽'
'forest-math' -> '几何树苗'
'forest-review' -> '茶杯萤光'
'forest-rest' -> '夜航灯芽'

// moon-library
'moon-language' -> '词卡月页'
'moon-code' -> '公式星页'
'moon-math' -> '圆规月页'
'moon-review' -> '靠枕书签'
'moon-rest' -> '深夜管理员'
```

For each array, use the same project mapping as `mochi-camp`: language maps to `['english']`, code maps to `['408', 'work']`, math maps to `['math']`, review maps to `['momonga', 'study']`, rest maps to `['kurimanju', 'rest']`.

- [ ] **Step 2: Run metadata tests**

Run:

```bash
cd frontend && pnpm test -- src/constants/__tests__/themes.test.ts --run
```

Expected: PASS for metadata and resolver tests.

- [ ] **Step 3: Commit metadata**

Run:

```bash
git add frontend/src/types/pomodoro.ts frontend/src/constants/themes.ts frontend/src/constants/__tests__/themes.test.ts
git commit -m "feat: add original theme character variants"
```

Expected: commit succeeds with only these files staged.

## Task 3: Variant-Aware Mascot Rendering

**Files:**
- Modify: `frontend/src/components/OriginalMascot.tsx`
- Modify: `frontend/src/components/__tests__/OriginalMascot.test.tsx`

- [ ] **Step 1: Add failing mascot variant test**

Add this test to `frontend/src/components/__tests__/OriginalMascot.test.tsx`:

```ts
  it('renders a provided character variant instead of the theme default', () => {
    const theme = resolveVisualTheme('mochi-camp');
    const variant = theme.characterVariants!.find((item) => item.variantId === 'mochi-code')!;

    render(<OriginalMascot theme={theme} character={variant} state="focused" size={96} />);

    expect(screen.getByRole('img', { name: '算法旗手糯' })).toHaveAttribute('data-mascot-variant', 'mochi-code');
  });
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
cd frontend && pnpm test -- src/components/__tests__/OriginalMascot.test.tsx --run
```

Expected: FAIL because `OriginalMascot` does not accept a `character` prop and does not set `data-mascot-variant`.

- [ ] **Step 3: Update `OriginalMascot` props**

Update imports and props in `frontend/src/components/OriginalMascot.tsx`:

```ts
import type { VisualTheme, VisualThemeCharacter } from '../types/pomodoro';

interface OriginalMascotProps {
  theme: VisualTheme;
  character?: VisualThemeCharacter;
  state?: MascotState;
  size?: number;
  className?: string;
}
```

Change `getRecipe` to accept a character:

```ts
const getRecipe = (theme: VisualTheme, character?: VisualThemeCharacter): ShapeRecipe => {
  const { primary, secondary, accent, text } = theme.colors;
  const activeCharacter = character ?? theme.character;
  const mascot = activeCharacter?.mascot;
  const scene = activeCharacter?.scene ?? 'default';
```

Inside each `case`, add at least one scene-dependent visual detail. For example, in the `Mochi` default scene fragment, add this before `</g>`:

```tsx
            {scene === 'language' && <path data-theme-detail="true" d="M37 28 H52 M37 34 H48" stroke={primary} strokeWidth="2" strokeLinecap="round" opacity="0.52" />}
            {scene === 'code' && <path data-theme-detail="true" d="M34 27 L27 34 L34 41 M48 27 L55 34 L48 41" stroke={primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.52" />}
            {scene === 'math' && <circle data-theme-detail="true" cx="43" cy="34" r="9" fill="none" stroke={primary} strokeWidth="2" opacity="0.46" />}
            {scene === 'review' && <rect data-theme-detail="true" x="33" y="28" width="18" height="14" rx="4" fill="white" opacity="0.54" />}
            {scene === 'rest' && <path data-theme-detail="true" d="M35 33 C41 27 48 27 54 33" stroke={primary} strokeWidth="2.5" strokeLinecap="round" opacity="0.42" />}
```

Update the component body:

```ts
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
```

Add attributes to the `<motion.svg>`:

```tsx
      data-mascot={mascot}
      data-mascot-variant={activeCharacter?.variantId ?? 'default'}
```

- [ ] **Step 4: Run mascot tests**

Run:

```bash
cd frontend && pnpm test -- src/components/__tests__/OriginalMascot.test.tsx --run
```

Expected: PASS.

- [ ] **Step 5: Commit mascot changes**

Run:

```bash
git add frontend/src/components/OriginalMascot.tsx frontend/src/components/__tests__/OriginalMascot.test.tsx
git commit -m "feat: render original mascot variants"
```

Expected: commit succeeds with only these files staged.

## Task 4: Project-Specific Home Card Art

**Files:**
- Create: `frontend/src/components/OriginalProjectCardArt.tsx`
- Modify: `frontend/src/pages/FocusListPage.tsx`
- Modify: `frontend/src/pages/__tests__/FocusListPage.test.tsx`

- [ ] **Step 1: Add failing FocusListPage test**

Update the existing original-theme home-card test to collect `data-mascot-variant` values:

```ts
    const variants = ['english', '408', 'math'].map((themeId) => {
      const preview = screen.getByTestId(`home-original-theme-icon-${themeId}`);
      const mascot = preview.querySelector('[data-mascot-variant]');

      expect(preview.querySelector('[data-theme-scene]')).toBeInTheDocument();
      expect(preview.querySelectorAll('[data-theme-card-element]').length).toBeGreaterThanOrEqual(4);
      expect(mascot).toBeInTheDocument();

      return mascot?.getAttribute('data-mascot-variant');
    });

    expect(new Set(variants).size).toBe(3);
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
cd frontend && pnpm test -- src/pages/__tests__/FocusListPage.test.tsx --run
```

Expected: FAIL because all original-theme project cards still render the same variant.

- [ ] **Step 3: Create card art component**

Create `frontend/src/components/OriginalProjectCardArt.tsx`:

```tsx
import OriginalMascot from './OriginalMascot';
import { resolveThemeCharacterForProject } from '../constants/themes';
import type { FocusTheme, VisualTheme, VisualThemeCharacterScene } from '../types/pomodoro';

interface OriginalProjectCardArtProps {
  focusTheme: FocusTheme;
  visualTheme: VisualTheme;
}

const sceneLayout: Record<VisualThemeCharacterScene, { badge: string; side: 'left' | 'right' | 'center' }> = {
  language: { badge: 'Aa', side: 'right' },
  code: { badge: '</>', side: 'center' },
  math: { badge: '∑', side: 'left' },
  review: { badge: '✓', side: 'right' },
  rest: { badge: '…', side: 'left' },
  default: { badge: '•', side: 'center' },
};

const OriginalProjectCardArt = ({ focusTheme, visualTheme }: OriginalProjectCardArtProps) => {
  const character = resolveThemeCharacterForProject(visualTheme, focusTheme);
  const scene = character.scene ?? 'default';
  const layout = sceneLayout[scene];

  return (
    <div
      data-testid={`home-original-theme-icon-${focusTheme.id}`}
      className="relative z-10 h-[92px] w-full max-w-[160px] md:h-[156px] md:max-w-[230px] rounded-[22px] md:rounded-[36px] overflow-hidden border border-white/70 shadow-inner flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${visualTheme.colors.bg} 0%, ${visualTheme.colors.surface} 48%, ${visualTheme.colors.glass} 100%)`,
      }}
    >
      <div data-theme-card-element="true" className="absolute inset-x-4 bottom-3 h-7 md:h-10 rounded-full opacity-45" style={{ backgroundColor: visualTheme.colors.secondary }} />
      <div data-theme-card-element="true" className={`absolute top-4 h-3 w-9 md:h-4 md:w-14 rounded-full opacity-70 ${layout.side === 'right' ? 'right-5' : 'left-5'}`} style={{ backgroundColor: visualTheme.colors.primary }} />
      <div data-theme-card-element="true" className={`absolute h-5 w-5 md:h-8 md:w-8 rounded-full opacity-75 ${layout.side === 'center' ? 'right-6 top-8' : 'left-5 top-8'}`} style={{ backgroundColor: visualTheme.colors.accent }} />
      <div data-theme-card-element="true" className={`absolute bottom-7 h-8 w-8 md:bottom-10 md:h-12 md:w-12 rounded-[12px] md:rounded-[18px] border-2 opacity-45 rotate-12 ${layout.side === 'left' ? 'right-5' : 'left-5'}`} style={{ borderColor: visualTheme.colors.primary, backgroundColor: visualTheme.colors.glass }} />
      <div data-theme-card-element="true" className={`absolute h-2 w-2 md:h-3 md:w-3 rounded-full opacity-80 ${layout.side === 'right' ? 'left-10 bottom-9' : 'right-10 top-7'}`} style={{ backgroundColor: visualTheme.colors.secondary }} />
      <div data-theme-card-element="true" className="absolute right-4 bottom-4 rounded-full border px-2 py-1 text-[10px] font-black shadow-sm backdrop-blur-md" style={{ color: visualTheme.colors.text, borderColor: visualTheme.colors.border, backgroundColor: visualTheme.colors.glass }}>
        {layout.badge}
      </div>
      <OriginalMascot character={character} theme={visualTheme} size={layout.side === 'center' ? 86 : 78} className="relative z-10 md:scale-125" />
    </div>
  );
};

export default OriginalProjectCardArt;
```

- [ ] **Step 4: Replace local card-art function**

In `frontend/src/pages/FocusListPage.tsx`, import the component:

```ts
import OriginalProjectCardArt from '../components/OriginalProjectCardArt';
```

Delete the local `getOriginalCardIcon` function. Replace its usage:

```tsx
{getOriginalCardIcon(theme)}
```

with:

```tsx
<OriginalProjectCardArt focusTheme={theme} visualTheme={visualTheme} />
```

- [ ] **Step 5: Run FocusListPage test**

Run:

```bash
cd frontend && pnpm test -- src/pages/__tests__/FocusListPage.test.tsx --run
```

Expected: PASS.

- [ ] **Step 6: Commit home-card changes**

Run:

```bash
git add frontend/src/components/OriginalProjectCardArt.tsx frontend/src/pages/FocusListPage.tsx frontend/src/pages/__tests__/FocusListPage.test.tsx
git commit -m "feat: assign original characters to focus cards"
```

Expected: commit succeeds with only these files staged.

## Task 5: Timer And CozyPal Project Character

**Files:**
- Modify: `frontend/src/components/TimerDisplay.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/CozyPal.tsx`
- Modify: `frontend/src/components/cozypal/CozyPalAvatarButton.tsx`
- Modify: `frontend/src/components/cozypal/CozyPalHeader.tsx`
- Modify: `frontend/src/components/cozypal/CozyPalDrawer.tsx`
- Modify: `frontend/src/components/cozypal/CozyPalBottomSheet.tsx`
- Modify: `frontend/src/components/cozypal/__tests__/CozyPalAvatarButton.test.tsx`

- [ ] **Step 1: Add failing CozyPal avatar test**

In `frontend/src/components/cozypal/__tests__/CozyPalAvatarButton.test.tsx`, add:

```tsx
import { resolveThemeCharacterForProject, resolveVisualTheme } from '../../../constants/themes';

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
      t={(key: string) => key}
      visualTheme={visualTheme}
      activeCharacter={activeCharacter}
    />
  );

  expect(screen.getByRole('img', { name: '算法旗手糯' })).toHaveAttribute('data-mascot-variant', 'mochi-code');
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
cd frontend && pnpm test -- src/components/cozypal/__tests__/CozyPalAvatarButton.test.tsx --run
```

Expected: FAIL because `activeCharacter` is not a prop.

- [ ] **Step 3: Update TimerDisplay**

In `frontend/src/components/TimerDisplay.tsx`, update imports:

```ts
import { isOriginalCartoonThemeId, resolveThemeCharacterForProject, resolveVisualTheme } from '../constants/themes';
```

After `isOriginalTheme`, add:

```ts
  const activeFocusTheme = state.themes.find((theme) => theme.id === state.activeThemeId);
  const activeCharacter = isOriginalTheme && activeFocusTheme
    ? resolveThemeCharacterForProject(visualTheme, activeFocusTheme)
    : visualTheme.character;
```

Change original emoji and mascot usage:

```ts
        ? activeCharacter?.phaseSymbols[phase] ?? phaseEmojis[phase]
```

```tsx
<OriginalMascot character={activeCharacter} theme={visualTheme} state={phase === 'focus' ? 'focused' : 'resting'} size={86} />
```

```tsx
{activeCharacter?.focusLabel}
```

- [ ] **Step 4: Pass active focus theme from App to CozyPal**

In `frontend/src/App.tsx`, derive the active focus theme inside `AppContent`:

```ts
  const activeFocusTheme = state.themes.find((theme) => theme.id === state.activeThemeId);
```

Pass it to `CozyPal`:

```tsx
          activeFocusTheme={activeFocusTheme}
```

- [ ] **Step 5: Update CozyPal prop chain**

In `frontend/src/components/CozyPal.tsx`, import `FocusTheme`, `VisualThemeCharacter`, and resolver:

```ts
import type { FocusTheme, VisualTheme, VisualThemeCharacter } from '../types/pomodoro';
import { isOriginalCartoonThemeId, resolveThemeCharacterForProject } from '../constants/themes';
```

Add prop:

```ts
  activeFocusTheme?: FocusTheme;
```

Inside component:

```ts
  const activeCharacter: VisualThemeCharacter | undefined =
    visualTheme && activeFocusTheme && isOriginalCartoonThemeId(visualTheme.id)
      ? resolveThemeCharacterForProject(visualTheme, activeFocusTheme)
      : visualTheme?.character;
```

Pass `activeCharacter={activeCharacter}` to `CozyPalAvatarButton`, `CozyPalBottomSheet`, and `CozyPalDrawer`.

In `CozyPalAvatarButton`, `CozyPalHeader`, `CozyPalDrawer`, and `CozyPalBottomSheet`, add an optional `activeCharacter?: VisualThemeCharacter` prop and pass it through to the header.

Use it in original renders:

```tsx
<OriginalMascot character={activeCharacter} theme={visualTheme} state={avatarState} size={76} />
```

```ts
const title = isChiikawaTheme
  ? 'Chiikawa Pal'
  : isShinchanTheme
    ? 'Shin-chan Pal'
    : activeCharacter?.companionTitle ?? visualTheme?.character?.companionTitle ?? 'Cozy Pal';
```

```ts
const subtitle = isChiikawaTheme
  ? '✦ Kawaii Companion ♡'
  : isShinchanTheme
    ? '★ Action Companion ★'
    : activeCharacter?.companionSubtitle ?? visualTheme?.character?.companionSubtitle ?? 'AI Study Companion';
```

- [ ] **Step 6: Run tests**

Run:

```bash
cd frontend && pnpm test -- src/components/cozypal/__tests__/CozyPalAvatarButton.test.tsx --run
```

Expected: PASS.

- [ ] **Step 7: Commit timer and CozyPal changes**

Run:

```bash
git add frontend/src/components/TimerDisplay.tsx frontend/src/App.tsx frontend/src/components/CozyPal.tsx frontend/src/components/cozypal/CozyPalAvatarButton.tsx frontend/src/components/cozypal/CozyPalHeader.tsx frontend/src/components/cozypal/CozyPalDrawer.tsx frontend/src/components/cozypal/CozyPalBottomSheet.tsx frontend/src/components/cozypal/__tests__/CozyPalAvatarButton.test.tsx
git commit -m "feat: use project characters in timer and cozypal"
```

Expected: commit succeeds with only these files staged.

## Task 6: Variant-Rich Background Decorations

**Files:**
- Modify: `frontend/src/components/OriginalThemeDecorations.tsx`
- Modify: `frontend/src/components/__tests__/OriginalThemeDecorations.test.tsx`

- [ ] **Step 1: Add failing background test**

In `frontend/src/components/__tests__/OriginalThemeDecorations.test.tsx`, add variant checks:

```ts
    const variants = Array.from(motifLayer.parentElement!.querySelectorAll('[data-mascot-variant]'))
      .map((node) => node.getAttribute('data-mascot-variant'));

    expect(new Set(variants).size).toBeGreaterThanOrEqual(3);
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
cd frontend && pnpm test -- src/components/__tests__/OriginalThemeDecorations.test.tsx --run
```

Expected: FAIL because background floating mascots all render the default character.

- [ ] **Step 3: Update decorations**

In `frontend/src/components/OriginalThemeDecorations.tsx`, update imports:

```ts
import { getThemeCharacterVariants } from '../constants/themes';
```

Inside the component:

```ts
  const variants = getThemeCharacterVariants(theme);
  const symbols = variants.flatMap((variant) => Object.values(variant.phaseSymbols)).slice(0, 8);
```

Change the floating mascot render:

```tsx
          <OriginalMascot
            character={variants[index % variants.length]}
            theme={theme}
            state="idle"
            size={64 * item.scale}
          />
```

Keep motif cluster count bounded by the existing `motifClusters` array.

- [ ] **Step 4: Run background tests**

Run:

```bash
cd frontend && pnpm test -- src/components/__tests__/OriginalThemeDecorations.test.tsx --run
```

Expected: PASS.

- [ ] **Step 5: Commit background changes**

Run:

```bash
git add frontend/src/components/OriginalThemeDecorations.tsx frontend/src/components/__tests__/OriginalThemeDecorations.test.tsx
git commit -m "feat: enrich original theme backgrounds"
```

Expected: commit succeeds with only these files staged.

## Task 7: Full Verification

**Files:**
- No planned source edits.

- [ ] **Step 1: Run focused tests**

Run:

```bash
cd frontend && pnpm test -- src/constants/__tests__/themes.test.ts src/components/__tests__/OriginalMascot.test.tsx src/components/__tests__/OriginalThemeDecorations.test.tsx src/pages/__tests__/FocusListPage.test.tsx src/components/cozypal/__tests__/CozyPalAvatarButton.test.tsx --run
```

Expected: PASS.

- [ ] **Step 2: Run build**

Run:

```bash
cd frontend && pnpm build
```

Expected: PASS with TypeScript and Vite production build completing.

- [ ] **Step 3: Inspect changed files**

Run:

```bash
git status --short
git diff --stat HEAD
```

Expected: only intended implementation files remain changed relative to the latest implementation commit, and unrelated pre-existing worktree changes are not reverted.

- [ ] **Step 4: Final completion audit**

Check these evidence points before declaring the goal complete:

- `frontend/src/constants/themes.ts` contains `characterVariants` for each id in `ORIGINAL_CARTOON_THEME_IDS`.
- `resolveThemeCharacterForProject(resolveVisualTheme('mochi-camp'), { id: 'english', ... })` and the same call for `408` and `math` return different `variantId` values.
- `FocusListPage` uses `OriginalProjectCardArt`.
- `TimerDisplay` passes `activeCharacter` to `OriginalMascot`.
- `CozyPalAvatarButton` and `CozyPalHeader` accept and pass `activeCharacter`.
- `OriginalThemeDecorations` renders multiple `data-mascot-variant` values.
- Focused tests and build pass.
