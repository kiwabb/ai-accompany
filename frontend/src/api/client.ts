import type { TimerSettings, FocusTheme, CountdownEvent } from '../types/pomodoro';
import type {
  SessionCreate,
  SessionResponse,
  DailyStats,
  StatsRangeResponse,
  UserAchievementResponse
} from './types';
import * as sessionsStorage from '../lib/storage/sessions';
import * as settingsStorage from '../lib/storage/settings';
import * as countdownsStorage from '../lib/storage/countdowns';
import { listModels } from '../lib/ai/models';
import { computeAchievements } from '../lib/achievements/engine';

// Re-export types for backwards compatibility
export type {
  SessionCreate,
  SessionResponse,
  DailyStats,
  DailyStat,
  SessionDetail,
  StatsRangeResponse,
  UserSettingsBackend,
  UserThemeBackend,
  ThemeCreate,
  CountdownBackend,
  AchievementResponse,
  UserAchievementResponse,
  UserAchievementBackend,
} from "./types";

export const getAuthHeaders = (): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
  };
};

// Session API
export const saveSession = async (session: SessionCreate): Promise<SessionResponse> => {
  return sessionsStorage.saveSession(session);
};

// Stats API
export const getDailyStats = async (date?: Date): Promise<DailyStats> => {
  return sessionsStorage.getDailyStats(date);
};

export const getStatsRange = async (startDate: Date, endDate: Date): Promise<StatsRangeResponse> => {
  return sessionsStorage.getStatsRange(startDate, endDate);
};

// Settings API
export const getUserSettings = async (): Promise<TimerSettings> => {
  return settingsStorage.getUserSettings();
};

export const upsertUserSettings = async (settings: TimerSettings): Promise<TimerSettings> => {
  return settingsStorage.upsertUserSettings(settings);
};

// Theme API
export const getUserThemes = async (): Promise<FocusTheme[]> => {
  return settingsStorage.getUserThemes();
};

export const createUserTheme = async (theme: FocusTheme): Promise<void> => {
  return settingsStorage.createUserTheme(theme);
};

export const updateUserTheme = async (
  themeId: string,
  patch: { name?: string; focus_duration?: number; icon_type?: string | null }
): Promise<FocusTheme> => {
  return settingsStorage.updateUserTheme(themeId, patch);
};

export const deleteUserTheme = async (themeId: string): Promise<void> => {
  return settingsStorage.deleteUserTheme(themeId);
};

// AI Models API
export const getProviderModels = async (provider: string, apiKey?: string): Promise<string[]> => {
  void apiKey;
  return listModels(provider);
};

// Countdown API
export const getCountdowns = async (): Promise<CountdownEvent[]> => {
  return countdownsStorage.getCountdowns();
};

export const createCountdown = async (title: string, targetDate: Date): Promise<CountdownEvent> => {
  return countdownsStorage.createCountdown(title, targetDate);
};

export const deleteCountdown = async (id: number): Promise<void> => {
  return countdownsStorage.deleteCountdown(id);
};

// Auth API stub
export const login = async (formData: FormData): Promise<{ access_token: string; token_type: string }> => {
  void formData;
  return { access_token: 'guest-token', token_type: 'bearer' };
};

export const signup = async (userData: unknown): Promise<{ success: boolean }> => {
  void userData;
  return { success: true };
};

// Achievement API
export const getAchievements = async (): Promise<UserAchievementResponse[]> => {
  const sessions = sessionsStorage.getRawSessions();
  return computeAchievements(sessions);
};

// Detect and return newly unlocked achievements using local storage cache comparison
export const getLatestUnlocks = async (minutes: number = 5): Promise<UserAchievementResponse[]> => {
  void minutes;
  const allAchievements = await getAchievements();
  const unlocked = allAchievements.filter(a => a.status === 'unlocked');

  const CACHE_KEY = 'unlocked_achievements_cache';
  let cachedKeys: string[] = [];
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      cachedKeys = JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  // Find newly unlocked ones
  const newlyUnlocked = unlocked.filter(a => !cachedKeys.includes(a.achievement.key));

  // Update cache
  const allUnlockedKeys = unlocked.map(a => a.achievement.key);
  localStorage.setItem(CACHE_KEY, JSON.stringify(allUnlockedKeys));

  return newlyUnlocked;
};
