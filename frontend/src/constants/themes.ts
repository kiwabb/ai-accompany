import type {
  FocusTheme,
  VisualTheme,
  VisualThemeAccentShape,
  VisualThemeCharacter,
  VisualThemeCharacterScene,
  VisualThemeCharacterTone,
} from '../types/pomodoro';

export const DEFAULT_VISUAL_THEME_ID = 'cozy';

export const ORIGINAL_CARTOON_THEME_IDS = [
  'mochi-camp',
  'stationery-town',
  'cloud-academy',
  'bean-planet',
  'forest-lighthouse',
  'moon-library',
] as const;

export type OriginalCartoonThemeId = (typeof ORIGINAL_CARTOON_THEME_IDS)[number];

export const isOriginalCartoonThemeId = (id?: string): id is OriginalCartoonThemeId => {
  return ORIGINAL_CARTOON_THEME_IDS.includes(id as OriginalCartoonThemeId);
};

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

  if (!fallback) {
    throw new Error(`Visual theme "${theme.id}" does not define a character`);
  }

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

type VariantDraft = {
  suffix: string;
  displayName: string;
  companionTitle: string;
  companionSubtitle: string;
  focusLabel: string;
  projectIds: string[];
  scene: VisualThemeCharacterScene;
  tone: VisualThemeCharacterTone;
  phaseSymbols: VisualThemeCharacter['phaseSymbols'];
};

const createCharacterVariants = (
  prefix: string,
  mascot: string,
  accentShape: VisualThemeAccentShape,
  drafts: VariantDraft[]
): VisualThemeCharacter[] => drafts.map((draft) => ({
  variantId: `${prefix}-${draft.suffix}`,
  displayName: draft.displayName,
  companionTitle: draft.companionTitle,
  companionSubtitle: draft.companionSubtitle,
  mascot,
  focusLabel: draft.focusLabel,
  accentShape,
  projectIds: draft.projectIds,
  scene: draft.scene,
  tone: draft.tone,
  phaseSymbols: draft.phaseSymbols,
}));

const baseTheme: VisualTheme = {
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
  character: {
    variantId: 'cozy-default',
    displayName: 'Cozy Pal',
    companionTitle: 'Cozy Pal',
    companionSubtitle: 'AI Study Companion',
    mascot: 'Cozy',
    focusLabel: 'Cozy Mode',
    accentShape: 'cozy',
    phaseSymbols: {
      focus: '✍',
      shortBreak: '☕',
      longBreak: '◦',
    },
  },
};

const legacyVisualThemes: VisualTheme[] = [
  {
    id: 'chiikawa',
    name: 'Chiikawa ♡',
    colors: {
      bg: '#FFF5F8',
      surface: 'rgba(255, 255, 255, 0.85)',
      glass: 'rgba(255, 248, 250, 0.7)',
      primary: '#FFB5C5',
      secondary: '#B8E6F0',
      accent: '#FFFACD',
      text: '#5D4037',
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
    id: 'shinchan',
    name: 'Shin-chan ★',
    colors: {
      bg: '#FFFDE7',
      surface: 'rgba(255, 255, 255, 0.9)',
      glass: 'rgba(255, 253, 231, 0.75)',
      primary: '#FF6B6B',
      secondary: '#FFF176',
      accent: '#4FC3F7',
      text: '#5D4037',
      textMuted: '#8D6E63',
      border: 'rgba(255, 107, 107, 0.3)',
    },
    shadows: {
      cozy: '0 10px 30px rgba(255, 77, 77, 0.15), 0 4px 15px rgba(255, 235, 59, 0.15)',
      elevated: '0 20px 45px rgba(255, 77, 77, 0.2), 0 8px 25px rgba(33, 150, 243, 0.15)',
    },
    borderRadius: '1.8rem',
    fontHeading: '"Zen Maru Gothic", "Kiwi Maru", "M PLUS Rounded 1c", "Nunito"',
    fontSans: '"Zen Maru Gothic", "Kiwi Maru", "M PLUS Rounded 1c", "Nunito"',
    decorations: {
      enabled: true,
      pattern: 'shinchan-stars',
      floatingElements: true,
      cursorStyle: 'shinchan',
    },
  },
];

const originalCartoonThemes: VisualTheme[] = [
  {
    id: 'mochi-camp',
    name: '糯米团训练营',
    colors: {
      bg: '#FFF8EC',
      surface: 'rgba(255, 251, 244, 0.88)',
      glass: 'rgba(255, 248, 236, 0.66)',
      primary: '#E94F64',
      secondary: '#8ACB88',
      accent: '#F6C85F',
      text: '#3D2D28',
      textMuted: '#826B61',
      border: 'rgba(151, 91, 75, 0.16)',
    },
    shadows: {
      cozy: '0 14px 34px -12px rgba(233, 79, 100, 0.28), 0 8px 18px -14px rgba(61, 45, 40, 0.18)',
      elevated: '0 26px 58px -24px rgba(233, 79, 100, 0.35), 0 12px 28px -18px rgba(61, 45, 40, 0.22)',
    },
    borderRadius: '2rem',
    fontHeading: '"Fredoka"',
    fontSans: '"Nunito"',
    decorations: {
      enabled: true,
      pattern: 'mochi-seeds',
      floatingElements: true,
      cursorStyle: 'mochi',
    },
    character: {
      variantId: 'mochi-default',
      displayName: '糯糯队长',
      companionTitle: 'Mochi Coach',
      companionSubtitle: 'Soft focus training buddy',
      mascot: 'Mochi',
      focusLabel: 'MOCHI CAMP',
      accentShape: 'sprout',
      phaseSymbols: {
        focus: '芽',
        shortBreak: '茶',
        longBreak: '眠',
      },
    },
    characterVariants: createCharacterVariants('mochi', 'Mochi', 'sprout', [
      {
        suffix: 'language',
        displayName: '单词背包糯',
        companionTitle: 'Mochi Word Scout',
        companionSubtitle: 'Carries new words through every focus trail',
        focusLabel: 'WORD TRAIL',
        projectIds: ['english'],
        scene: 'language',
        tone: 'bright',
        phaseSymbols: { focus: '词', shortBreak: '茶', longBreak: '眠' },
      },
      {
        suffix: 'code',
        displayName: '算法旗手糯',
        companionTitle: 'Mochi Algorithm Lead',
        companionSubtitle: 'Marks checkpoints for long exam climbs',
        focusLabel: 'ALGO CAMP',
        projectIds: ['408', 'work'],
        scene: 'code',
        tone: 'steady',
        phaseSymbols: { focus: '算', shortBreak: '旗', longBreak: '营' },
      },
      {
        suffix: 'math',
        displayName: '圆规糯糯',
        companionTitle: 'Mochi Compass Mate',
        companionSubtitle: 'Keeps formulas soft but precise',
        focusLabel: 'GEOMETRY CAMP',
        projectIds: ['math'],
        scene: 'math',
        tone: 'curious',
        phaseSymbols: { focus: '几', shortBreak: '圆', longBreak: '梦' },
      },
      {
        suffix: 'review',
        displayName: '复盘茶点糯',
        companionTitle: 'Mochi Review Baker',
        companionSubtitle: 'Turns small reviews into warm progress',
        focusLabel: 'REVIEW CAMP',
        projectIds: ['momonga', 'study'],
        scene: 'review',
        tone: 'restful',
        phaseSymbols: { focus: '复', shortBreak: '点', longBreak: '香' },
      },
      {
        suffix: 'rest',
        displayName: '夜读被窝糯',
        companionTitle: 'Mochi Night Reader',
        companionSubtitle: 'Keeps short sessions calm and tucked in',
        focusLabel: 'COZY CAMP',
        projectIds: ['kurimanju', 'rest'],
        scene: 'rest',
        tone: 'quiet',
        phaseSymbols: { focus: '阅', shortBreak: '被', longBreak: '月' },
      },
    ]),
  },
  {
    id: 'stationery-town',
    name: '文具小镇',
    colors: {
      bg: '#FAF3E8',
      surface: 'rgba(255, 252, 247, 0.88)',
      glass: 'rgba(250, 243, 232, 0.66)',
      primary: '#3F7CAC',
      secondary: '#F3B33D',
      accent: '#E76F51',
      text: '#27313D',
      textMuted: '#6D7480',
      border: 'rgba(63, 124, 172, 0.16)',
    },
    shadows: {
      cozy: '0 14px 34px -12px rgba(63, 124, 172, 0.28), 0 8px 18px -14px rgba(39, 49, 61, 0.18)',
      elevated: '0 26px 58px -24px rgba(63, 124, 172, 0.34), 0 12px 28px -18px rgba(39, 49, 61, 0.22)',
    },
    borderRadius: '1.6rem',
    fontHeading: '"Fredoka"',
    fontSans: '"Nunito"',
    decorations: {
      enabled: true,
      pattern: 'stationery-grid',
      floatingElements: true,
      cursorStyle: 'pencil',
    },
    character: {
      variantId: 'stationery-default',
      displayName: '铅笔邮差',
      companionTitle: 'Pencil Post Pal',
      companionSubtitle: 'Tiny planner from Stationery Town',
      mascot: 'Pencil',
      focusLabel: 'STATIONERY TOWN',
      accentShape: 'pencil',
      phaseSymbols: {
        focus: '写',
        shortBreak: '剪',
        longBreak: '贴',
      },
    },
    characterVariants: createCharacterVariants('stationery', 'Pencil', 'pencil', [
      {
        suffix: 'language',
        displayName: '词典铅笔',
        companionTitle: 'Dictionary Pencil',
        companionSubtitle: 'Underlines words with tidy little routes',
        focusLabel: 'WORD DESK',
        projectIds: ['english'],
        scene: 'language',
        tone: 'bright',
        phaseSymbols: { focus: '词', shortBreak: '剪', longBreak: '贴' },
      },
      {
        suffix: 'code',
        displayName: '网格橡皮',
        companionTitle: 'Grid Eraser',
        companionSubtitle: 'Clears messy logic one square at a time',
        focusLabel: 'GRID LAB',
        projectIds: ['408', 'work'],
        scene: 'code',
        tone: 'steady',
        phaseSymbols: { focus: '码', shortBreak: '格', longBreak: '擦' },
      },
      {
        suffix: 'math',
        displayName: '圆规书记',
        companionTitle: 'Compass Clerk',
        companionSubtitle: 'Keeps formulas filed in neat arcs',
        focusLabel: 'FORMULA OFFICE',
        projectIds: ['math'],
        scene: 'math',
        tone: 'curious',
        phaseSymbols: { focus: '圆', shortBreak: '尺', longBreak: '案' },
      },
      {
        suffix: 'review',
        displayName: '便签邮差',
        companionTitle: 'Memo Post Pal',
        companionSubtitle: 'Delivers tiny review notes before they fade',
        focusLabel: 'MEMO ROUTE',
        projectIds: ['momonga', 'study'],
        scene: 'review',
        tone: 'restful',
        phaseSymbols: { focus: '记', shortBreak: '邮', longBreak: '签' },
      },
      {
        suffix: 'rest',
        displayName: '胶带休息员',
        companionTitle: 'Tape Rest Helper',
        companionSubtitle: 'Patches short sessions with gentle pauses',
        focusLabel: 'TAPE BREAK',
        projectIds: ['kurimanju', 'rest'],
        scene: 'rest',
        tone: 'quiet',
        phaseSymbols: { focus: '轻', shortBreak: '带', longBreak: '眠' },
      },
    ]),
  },
  {
    id: 'cloud-academy',
    name: '云朵补习社',
    colors: {
      bg: '#F2FAFF',
      surface: 'rgba(255, 255, 255, 0.86)',
      glass: 'rgba(242, 250, 255, 0.72)',
      primary: '#4CA6D8',
      secondary: '#F7D46C',
      accent: '#F28BA8',
      text: '#263746',
      textMuted: '#6D8192',
      border: 'rgba(76, 166, 216, 0.18)',
    },
    shadows: {
      cozy: '0 14px 34px -12px rgba(76, 166, 216, 0.26), 0 8px 18px -14px rgba(38, 55, 70, 0.16)',
      elevated: '0 26px 58px -24px rgba(76, 166, 216, 0.34), 0 12px 28px -18px rgba(38, 55, 70, 0.2)',
    },
    borderRadius: '2.25rem',
    fontHeading: '"Fredoka"',
    fontSans: '"Nunito"',
    decorations: {
      enabled: true,
      pattern: 'cloud-puffs',
      floatingElements: true,
      cursorStyle: 'cloud',
    },
    character: {
      variantId: 'cloud-default',
      displayName: '云团老师',
      companionTitle: 'Cloud Tutor',
      companionSubtitle: 'Gentle sky-side study coach',
      mascot: 'Cloud',
      focusLabel: 'CLOUD ACADEMY',
      accentShape: 'cloud',
      phaseSymbols: {
        focus: '光',
        shortBreak: '雨',
        longBreak: '梦',
      },
    },
    characterVariants: createCharacterVariants('cloud', 'Cloud', 'cloud', [
      {
        suffix: 'language',
        displayName: '单词云朵',
        companionTitle: 'Word Cloud Tutor',
        companionSubtitle: 'Floats new phrases into easy memory',
        focusLabel: 'WORD SKY',
        projectIds: ['english'],
        scene: 'language',
        tone: 'bright',
        phaseSymbols: { focus: '词', shortBreak: '雨', longBreak: '梦' },
      },
      {
        suffix: 'code',
        displayName: '公式雨云',
        companionTitle: 'Formula Rain Cloud',
        companionSubtitle: 'Drops logic clues in steady showers',
        focusLabel: 'LOGIC SKY',
        projectIds: ['408', 'work'],
        scene: 'code',
        tone: 'steady',
        phaseSymbols: { focus: '码', shortBreak: '雨', longBreak: '光' },
      },
      {
        suffix: 'math',
        displayName: '几何太阳云',
        companionTitle: 'Geometry Sun Cloud',
        companionSubtitle: 'Makes angles feel warm and visible',
        focusLabel: 'GEOMETRY SKY',
        projectIds: ['math'],
        scene: 'math',
        tone: 'curious',
        phaseSymbols: { focus: '几', shortBreak: '晴', longBreak: '梦' },
      },
      {
        suffix: 'review',
        displayName: '复盘闪电云',
        companionTitle: 'Lightning Review Cloud',
        companionSubtitle: 'Flashes quick summaries at the right moment',
        focusLabel: 'REVIEW SKY',
        projectIds: ['momonga', 'study'],
        scene: 'review',
        tone: 'bright',
        phaseSymbols: { focus: '复', shortBreak: '闪', longBreak: '云' },
      },
      {
        suffix: 'rest',
        displayName: '梦游小云',
        companionTitle: 'Dream Drift Cloud',
        companionSubtitle: 'Keeps shorter sessions light and quiet',
        focusLabel: 'DRIFT SKY',
        projectIds: ['kurimanju', 'rest'],
        scene: 'rest',
        tone: 'quiet',
        phaseSymbols: { focus: '轻', shortBreak: '眠', longBreak: '星' },
      },
    ]),
  },
  {
    id: 'bean-planet',
    name: '豆豆星球研究所',
    colors: {
      bg: '#F4FFF9',
      surface: 'rgba(255, 255, 255, 0.86)',
      glass: 'rgba(244, 255, 249, 0.7)',
      primary: '#2FAF8F',
      secondary: '#6874D6',
      accent: '#FFD166',
      text: '#223735',
      textMuted: '#647D79',
      border: 'rgba(47, 175, 143, 0.18)',
    },
    shadows: {
      cozy: '0 14px 34px -12px rgba(47, 175, 143, 0.26), 0 8px 18px -14px rgba(34, 55, 53, 0.16)',
      elevated: '0 26px 58px -24px rgba(47, 175, 143, 0.34), 0 12px 28px -18px rgba(34, 55, 53, 0.2)',
    },
    borderRadius: '1.9rem',
    fontHeading: '"Fredoka"',
    fontSans: '"Nunito"',
    decorations: {
      enabled: true,
      pattern: 'bean-orbits',
      floatingElements: true,
      cursorStyle: 'bean',
    },
    character: {
      variantId: 'bean-default',
      displayName: '豆豆研究员',
      companionTitle: 'Bean Lab Mate',
      companionSubtitle: 'Curious little focus explorer',
      mascot: 'Bean',
      focusLabel: 'BEAN PLANET',
      accentShape: 'planet',
      phaseSymbols: {
        focus: '研',
        shortBreak: '氧',
        longBreak: '星',
      },
    },
    characterVariants: createCharacterVariants('bean', 'Bean', 'planet', [
      {
        suffix: 'language',
        displayName: '语言豆豆',
        companionTitle: 'Language Bean',
        companionSubtitle: 'Collects phrases like tiny space samples',
        focusLabel: 'WORD ORBIT',
        projectIds: ['english'],
        scene: 'language',
        tone: 'bright',
        phaseSymbols: { focus: '词', shortBreak: '氧', longBreak: '星' },
      },
      {
        suffix: 'code',
        displayName: '代码豆豆',
        companionTitle: 'Code Bean',
        companionSubtitle: 'Tests logic paths around the focus planet',
        focusLabel: 'CODE ORBIT',
        projectIds: ['408', 'work'],
        scene: 'code',
        tone: 'steady',
        phaseSymbols: { focus: '码', shortBreak: '轨', longBreak: '舱' },
      },
      {
        suffix: 'math',
        displayName: '数学豆豆',
        companionTitle: 'Math Bean',
        companionSubtitle: 'Measures formulas with curious instruments',
        focusLabel: 'MATH ORBIT',
        projectIds: ['math'],
        scene: 'math',
        tone: 'curious',
        phaseSymbols: { focus: '数', shortBreak: '量', longBreak: '星' },
      },
      {
        suffix: 'review',
        displayName: '氧气豆豆',
        companionTitle: 'Oxygen Review Bean',
        companionSubtitle: 'Brings air back into dense review blocks',
        focusLabel: 'REVIEW ORBIT',
        projectIds: ['momonga', 'study'],
        scene: 'review',
        tone: 'restful',
        phaseSymbols: { focus: '复', shortBreak: '氧', longBreak: '眠' },
      },
      {
        suffix: 'rest',
        displayName: '望远镜豆豆',
        companionTitle: 'Telescope Bean',
        companionSubtitle: 'Looks after calm sessions from far away',
        focusLabel: 'QUIET ORBIT',
        projectIds: ['kurimanju', 'rest'],
        scene: 'rest',
        tone: 'quiet',
        phaseSymbols: { focus: '望', shortBreak: '星', longBreak: '梦' },
      },
    ]),
  },
  {
    id: 'forest-lighthouse',
    name: '森林灯塔队',
    colors: {
      bg: '#F6FAEF',
      surface: 'rgba(255, 255, 249, 0.88)',
      glass: 'rgba(246, 250, 239, 0.7)',
      primary: '#5E9F62',
      secondary: '#F2C14E',
      accent: '#3B7A78',
      text: '#263328',
      textMuted: '#697866',
      border: 'rgba(94, 159, 98, 0.18)',
    },
    shadows: {
      cozy: '0 14px 34px -12px rgba(94, 159, 98, 0.26), 0 8px 18px -14px rgba(38, 51, 40, 0.16)',
      elevated: '0 26px 58px -24px rgba(94, 159, 98, 0.34), 0 12px 28px -18px rgba(38, 51, 40, 0.2)',
    },
    borderRadius: '1.75rem',
    fontHeading: '"Fredoka"',
    fontSans: '"Nunito"',
    decorations: {
      enabled: true,
      pattern: 'forest-lights',
      floatingElements: true,
      cursorStyle: 'lamp',
    },
    character: {
      variantId: 'forest-default',
      displayName: '灯泡芽芽',
      companionTitle: 'Lighthouse Sprout',
      companionSubtitle: 'Keeps a warm light on your desk',
      mascot: 'Sprout',
      focusLabel: 'FOREST LIGHTHOUSE',
      accentShape: 'lamp',
      phaseSymbols: {
        focus: '灯',
        shortBreak: '叶',
        longBreak: '萤',
      },
    },
    characterVariants: createCharacterVariants('forest', 'Sprout', 'lamp', [
      {
        suffix: 'language',
        displayName: '阅读灯芽',
        companionTitle: 'Reading Lamp Sprout',
        companionSubtitle: 'Lights up words under quiet leaves',
        focusLabel: 'READING LIGHT',
        projectIds: ['english'],
        scene: 'language',
        tone: 'bright',
        phaseSymbols: { focus: '阅', shortBreak: '叶', longBreak: '萤' },
      },
      {
        suffix: 'code',
        displayName: '算法灯塔芽',
        companionTitle: 'Algorithm Lighthouse Sprout',
        companionSubtitle: 'Points through complex paths without glare',
        focusLabel: 'ALGO LIGHT',
        projectIds: ['408', 'work'],
        scene: 'code',
        tone: 'steady',
        phaseSymbols: { focus: '算', shortBreak: '灯', longBreak: '塔' },
      },
      {
        suffix: 'math',
        displayName: '几何树苗',
        companionTitle: 'Geometry Sapling',
        companionSubtitle: 'Grows angles into something visible',
        focusLabel: 'MATH GROVE',
        projectIds: ['math'],
        scene: 'math',
        tone: 'curious',
        phaseSymbols: { focus: '几', shortBreak: '枝', longBreak: '林' },
      },
      {
        suffix: 'review',
        displayName: '茶杯萤光',
        companionTitle: 'Tea Firefly',
        companionSubtitle: 'Keeps review notes glowing softly',
        focusLabel: 'REVIEW GLOW',
        projectIds: ['momonga', 'study'],
        scene: 'review',
        tone: 'restful',
        phaseSymbols: { focus: '复', shortBreak: '茶', longBreak: '光' },
      },
      {
        suffix: 'rest',
        displayName: '夜航灯芽',
        companionTitle: 'Night Navigation Sprout',
        companionSubtitle: 'Guides short calm sessions through the dark',
        focusLabel: 'NIGHT LIGHT',
        projectIds: ['kurimanju', 'rest'],
        scene: 'rest',
        tone: 'quiet',
        phaseSymbols: { focus: '夜', shortBreak: '萤', longBreak: '眠' },
      },
    ]),
  },
  {
    id: 'moon-library',
    name: '月亮图书馆',
    colors: {
      bg: '#F8F6FF',
      surface: 'rgba(255, 255, 255, 0.86)',
      glass: 'rgba(248, 246, 255, 0.7)',
      primary: '#6E77D8',
      secondary: '#F6D36F',
      accent: '#8CC6C1',
      text: '#2D3047',
      textMuted: '#717792',
      border: 'rgba(110, 119, 216, 0.18)',
    },
    shadows: {
      cozy: '0 14px 34px -12px rgba(110, 119, 216, 0.26), 0 8px 18px -14px rgba(45, 48, 71, 0.16)',
      elevated: '0 26px 58px -24px rgba(110, 119, 216, 0.34), 0 12px 28px -18px rgba(45, 48, 71, 0.2)',
    },
    borderRadius: '2rem',
    fontHeading: '"Fredoka"',
    fontSans: '"Nunito"',
    decorations: {
      enabled: true,
      pattern: 'moon-pages',
      floatingElements: true,
      cursorStyle: 'moon',
    },
    character: {
      variantId: 'moon-default',
      displayName: '月页管理员',
      companionTitle: 'Moon Librarian',
      companionSubtitle: 'Quiet guide for deep reading nights',
      mascot: 'Moon',
      focusLabel: 'MOON LIBRARY',
      accentShape: 'moon',
      phaseSymbols: {
        focus: '阅',
        shortBreak: '灯',
        longBreak: '星',
      },
    },
    characterVariants: createCharacterVariants('moon', 'Moon', 'moon', [
      {
        suffix: 'language',
        displayName: '词卡月页',
        companionTitle: 'Word Card Moon Page',
        companionSubtitle: 'Files vocabulary under a calm moon mark',
        focusLabel: 'WORD STACK',
        projectIds: ['english'],
        scene: 'language',
        tone: 'bright',
        phaseSymbols: { focus: '词', shortBreak: '灯', longBreak: '星' },
      },
      {
        suffix: 'code',
        displayName: '公式星页',
        companionTitle: 'Formula Star Page',
        companionSubtitle: 'Indexes logic patterns for deep study',
        focusLabel: 'LOGIC STACK',
        projectIds: ['408', 'work'],
        scene: 'code',
        tone: 'steady',
        phaseSymbols: { focus: '码', shortBreak: '星', longBreak: '页' },
      },
      {
        suffix: 'math',
        displayName: '圆规月页',
        companionTitle: 'Compass Moon Page',
        companionSubtitle: 'Keeps formulas quiet, crisp, and aligned',
        focusLabel: 'MATH STACK',
        projectIds: ['math'],
        scene: 'math',
        tone: 'curious',
        phaseSymbols: { focus: '圆', shortBreak: '尺', longBreak: '月' },
      },
      {
        suffix: 'review',
        displayName: '靠枕书签',
        companionTitle: 'Cushion Bookmark',
        companionSubtitle: 'Holds your review spot without pressure',
        focusLabel: 'REVIEW STACK',
        projectIds: ['momonga', 'study'],
        scene: 'review',
        tone: 'restful',
        phaseSymbols: { focus: '复', shortBreak: '枕', longBreak: '签' },
      },
      {
        suffix: 'rest',
        displayName: '深夜管理员',
        companionTitle: 'Deep Night Librarian',
        companionSubtitle: 'Watches over short quiet sessions after dark',
        focusLabel: 'NIGHT STACK',
        projectIds: ['kurimanju', 'rest'],
        scene: 'rest',
        tone: 'quiet',
        phaseSymbols: { focus: '夜', shortBreak: '灯', longBreak: '梦' },
      },
    ]),
  },
];

const darkTheme: VisualTheme = {
  id: 'dark',
  name: 'Deep Night',
  colors: {
    bg: '#101622',
    surface: 'rgba(29, 37, 52, 0.95)',
    glass: 'rgba(30, 41, 59, 0.78)',
    primary: '#8B9CFF',
    secondary: '#55D6A3',
    accent: '#FF8DA1',
    text: '#FFFFFF',
    textMuted: '#CBD5E1',
    border: 'rgba(255, 255, 255, 0.18)',
  },
  shadows: {
    cozy: '0 10px 30px -5px rgba(0, 0, 0, 0.5)',
    elevated: '0 20px 40px -10px rgba(0, 0, 0, 0.7)',
  },
  borderRadius: '1.5rem',
  fontHeading: '"Fredoka"',
  fontSans: '"Nunito"',
  character: {
    variantId: 'night-default',
    displayName: 'Night Pal',
    companionTitle: 'Night Pal',
    companionSubtitle: 'Low-light AI study companion',
    mascot: 'Night',
    focusLabel: 'DEEP NIGHT',
    accentShape: 'night',
    phaseSymbols: {
      focus: '◐',
      shortBreak: '◒',
      longBreak: '●',
    },
  },
};

export const VISUAL_THEMES: VisualTheme[] = [
  baseTheme,
  ...legacyVisualThemes,
  ...originalCartoonThemes,
  darkTheme,
];

export const resolveVisualTheme = (id?: string): VisualTheme => {
  return VISUAL_THEMES.find((theme) => theme.id === id)
    || VISUAL_THEMES.find((theme) => theme.id === DEFAULT_VISUAL_THEME_ID)
    || VISUAL_THEMES[0];
};

export const getThemeById = resolveVisualTheme;

export const CHIIKAWA_ELEMENTS = {
  characters: ['🐱', '🐰', '🦔', '🐻', '🌸', '✨', '💫', '🎀', '🌷', '🍀'],
  stickers: [
    '( ˘ω˘ )', '(◕‿◕)', '(｡♥‿♥｡)', '(◠‿◠)', '♡(◕ᗜ◕✿)',
    '(◕ᴗ◕✿)', '(✿◠‿◠)', '٩(◕‿◕)۶', '(◕દ◕)', '♪(´ε｀ )',
  ],
  sparkles: ['✦', '✧', '★', '☆', '✩', '✪', '✫', '✬', '✭', '✮'],
};

export const SHINCHAN_ELEMENTS = {
  actionSymbols: ['★', '⚡', '💥', '🔥', '✦', '⭐', '✧', '🌟', '💫', '✨'],
  chocobiSnacks: ['🍫', '🍪', '🍩', '🍬', '🍭', '🧁', '🍡', '🥤'],
  expressions: [
    '(°∀°)', '(≧∇≦)', '(｀・ω・´)', 'ヽ(>∀<☆)☆',
    '(ﾉ´ヮ`)ﾉ*: ・゚✧', '(๑•̀ㅂ•́)و✧', '٩(๑❛ᴗ❛๑)۶', '(≧◡≦)',
  ],
  catchphrases: ['🐘', '💃', '🎭', '🎪', '🎬', '🏃'],
};
