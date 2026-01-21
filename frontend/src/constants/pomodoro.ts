import type { FocusTheme, TimerSettings } from '../types/pomodoro';

export const DEFAULT_THEMES: FocusTheme[] = [
  { id: 'english', name: 'English', focusDuration: 25, isDefault: true },
  { id: '408', name: '408', focusDuration: 45, isDefault: true },
  { id: 'math', name: 'Math', focusDuration: 60, isDefault: true },
];

export const DEFAULT_SETTINGS: TimerSettings = {
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartNext: false,
};
