export interface FocusTheme {
  id: string;
  name: string;
  focusDuration: number; // in minutes
  isDefault: boolean;
}

export interface TimerSettings {
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
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
  enableSounds?: boolean;
  enableBackgroundMusic?: boolean;
  soundVolume?: number;
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
