export interface FocusTheme {
  id: string;
  name: string;
  focusDuration: number; // in minutes
  isDefault: boolean;
  iconType?: string;
}

export interface TimerSettings {
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  targetRounds: number;
  autoStartNext: boolean;
  googleApiKey?: string;
  openaiApiKey?: string;
  aiProvider?: string;
  aiModel?: string;
  deepseekApiKey?: string;
  zhipuApiKey?: string;
  aiPersona?: string;
  aiProactivity?: boolean;
  aiActionable?: boolean;
  activeThemeId?: string;
  enableSounds?: boolean;
  enableBackgroundMusic?: boolean;
  soundVolume?: number;
  focusTrack?: string;
  breakTrack?: string;
  useDefaultThemeIcon?: boolean;
}

export type Phase = 'focus' | 'shortBreak' | 'longBreak';

export interface TimerState {
  timeLeft: number; // in seconds
  isActive: boolean;
  currentPhase: Phase;
  completedSessions: number;
}
export interface CountdownEvent {
  id: number;
  title: string;
  targetDate: string;
}

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

export interface VisualTheme {
  id: string;
  name: string;
  colors: {
    bg: string;
    surface: string;
    glass: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textMuted: string;
    border: string;
  };
  shadows: {
    cozy: string;
    elevated: string;
  };
  borderRadius: string;
  fontHeading: string;
  fontSans: string;
  decorations?: {
    enabled: boolean;
    pattern?: string;
    floatingElements?: boolean;
    cursorStyle?: string;
  };
  character?: VisualThemeCharacter;
  characterVariants?: VisualThemeCharacter[];
}
