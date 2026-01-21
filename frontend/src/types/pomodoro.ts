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
}

export type Phase = 'focus' | 'shortBreak' | 'longBreak';

export interface TimerState {
  timeLeft: number; // in seconds
  isActive: boolean;
  currentPhase: Phase;
  completedSessions: number;
}
