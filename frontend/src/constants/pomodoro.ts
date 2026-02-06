import type { FocusTheme, TimerSettings } from '../types/pomodoro';

export const DEFAULT_THEMES: FocusTheme[] = [
  { id: 'english', name: 'English', focusDuration: 25, isDefault: true },
  { id: '408', name: '408', focusDuration: 45, isDefault: true },
  { id: 'math', name: 'Math', focusDuration: 60, isDefault: true },
  { id: 'momonga', name: 'Momonga Focus', focusDuration: 30, isDefault: true },
  { id: 'kurimanju', name: 'Kurimanju Drink', focusDuration: 15, isDefault: true },
];

export const DEFAULT_SETTINGS: TimerSettings = {
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartNext: false,
  googleApiKey: '',
  aiPersona: 'gentle_encourager',
  enableSounds: true,
  enableBackgroundMusic: true,
  soundVolume: 0.5,
  focusTrack: 'lofi-beats',
  breakTrack: 'rain-sounds',
};

export const FOCUS_TRACKS = [
  { id: 'lofi-beats', name: 'Lofi Beats', url: '/sounds/lofi-beats.mp3' },
  { id: 'classical', name: 'Classical Focus', url: '/sounds/classical.mp3' },
  { id: 'white-noise', name: 'White Noise', url: '/sounds/white-noise.mp3' },
];

export const BREAK_TRACKS = [
  { id: 'rain-sounds', name: 'Rain Sounds', url: '/sounds/rain.mp3' },
  { id: 'forest', name: 'Forest Ambience', url: '/sounds/forest.mp3' },
  { id: 'ocean-waves', name: 'Ocean Waves', url: '/sounds/ocean.mp3' },
];
