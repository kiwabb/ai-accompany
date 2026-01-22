import { getFormattedDate } from "../utils/date";
import type { TimerSettings } from "../types/pomodoro";

export interface SessionCreate {
  theme_name: string;
  duration_seconds: number;
  phase_type: 'focus' | 'shortBreak' | 'longBreak';
  status: 'completed' | 'skipped' | 'interrupted';
  start_time: string;
  end_time: string;
  ai_persona?: string;
}

export interface SessionResponse {
  id: number;
  theme_name: string;
  duration_seconds: number;
  phase_type: 'focus' | 'shortBreak' | 'longBreak';
  status: 'completed' | 'skipped' | 'interrupted';
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface DailyStats {
  date: string;
  total_focus_minutes: number;
  total_sessions: number;
  sessions_by_theme: { [key: string]: number };
}

export interface UserSettingsBackend {
  id: number;
  user_id: string;
  google_api_key?: string;
  ai_persona?: string;
  short_break_duration: number;
  long_break_duration: number;
  long_break_interval: number;
  ai_proactivity?: boolean;
  ai_actionable?: boolean;
  auto_start_next?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserThemeBackend {
  id: number;
  user_id: string;
  theme_id: string;
  name: string;
  focus_duration: number;
  is_default: boolean;
  created_at: string;
}

export interface ThemeCreate {
  theme_id: string;
  name: string;
  focus_duration: number;
  is_default: boolean;
}

const API_BASE_URL = '/api';

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Something went wrong');
  }
  return response.json();
};

export const saveSession = async (session: SessionCreate): Promise<SessionResponse> => {
  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(session),
  });
  return handleResponse<SessionResponse>(response);
};

export const getDailyStats = async (date?: Date): Promise<DailyStats> => {
  let url = `${API_BASE_URL}/stats/daily`;
  if (date) {
    url += `?target_date=${getFormattedDate(date)}`;
  }
  const response = await fetch(url);
  return handleResponse<DailyStats>(response);
};

const getAuthHeaders = () => {
  const userId = "user-123";
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userId}`,
  };
};

export const getUserSettings = async (): Promise<TimerSettings> => {
  const response = await fetch(`${API_BASE_URL}/settings`, {
    headers: getAuthHeaders(),
  });
  const backendSettings = await handleResponse<UserSettingsBackend>(response);
  
  return {
    googleApiKey: backendSettings.google_api_key,
    aiPersona: backendSettings.ai_persona,
    shortBreakDuration: backendSettings.short_break_duration,
    longBreakDuration: backendSettings.long_break_duration,
    longBreakInterval: backendSettings.long_break_interval,
    aiProactivity: backendSettings.ai_proactivity,
    aiActionable: backendSettings.ai_actionable,
    autoStartNext: backendSettings.auto_start_next ?? false,
  };
};

export const upsertUserSettings = async (settings: TimerSettings): Promise<TimerSettings> => {
  const backendPayload = {
    google_api_key: settings.googleApiKey,
    ai_persona: settings.aiPersona,
    short_break_duration: settings.shortBreakDuration,
    long_break_duration: settings.longBreakDuration,
    long_break_interval: settings.longBreakInterval,
    ai_proactivity: settings.aiProactivity,
    ai_actionable: settings.aiActionable,
    auto_start_next: settings.autoStartNext,
  };

  const response = await fetch(`${API_BASE_URL}/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(backendPayload),
  });
  const updatedBackendSettings = await handleResponse<UserSettingsBackend>(response);

  return {
    googleApiKey: updatedBackendSettings.google_api_key,
    aiPersona: updatedBackendSettings.ai_persona,
    shortBreakDuration: updatedBackendSettings.short_break_duration,
    longBreakDuration: updatedBackendSettings.long_break_duration,
    longBreakInterval: updatedBackendSettings.long_break_interval,
    aiProactivity: updatedBackendSettings.ai_proactivity,
    aiActionable: updatedBackendSettings.ai_actionable,
    autoStartNext: updatedBackendSettings.auto_start_next ?? settings.autoStartNext,
  };
};

export const getUserThemes = async (): Promise<import("../types/pomodoro").FocusTheme[]> => {
  const response = await fetch(`${API_BASE_URL}/themes`, {
    headers: getAuthHeaders(),
  });
  const backendThemes = await handleResponse<UserThemeBackend[]>(response);
  return backendThemes.map(t => ({
    id: t.theme_id,
    name: t.name,
    focusDuration: t.focus_duration,
    isDefault: t.is_default
  }));
};

export const createUserTheme = async (theme: import("../types/pomodoro").FocusTheme): Promise<void> => {
  const payload: ThemeCreate = {
    theme_id: theme.id,
    name: theme.name,
    focus_duration: theme.focusDuration,
    is_default: theme.isDefault
  };
  const response = await fetch(`${API_BASE_URL}/themes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  await handleResponse<UserThemeBackend>(response);
};

export const deleteUserTheme = async (themeId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/themes/${themeId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to delete theme');
  }
};
