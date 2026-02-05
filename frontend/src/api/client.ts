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

export interface SessionDetail {
    theme_name: string;
    duration_minutes: number;
    start_time: string;
    end_time: string;
}

export interface DailyStat {
    date: string;
    total_focus_minutes: number;
    sessions_by_theme: { [key: string]: number };
}

export interface StatsRangeResponse {
    total_focus_minutes: number;
    total_sessions: number;
    daily_stats: DailyStat[];
    sessions_by_theme: { [key: string]: number };
    sessions_details: SessionDetail[];
}

export interface UserSettingsBackend {
  id: number;
  user_id: string;
  google_api_key?: string;
  openai_api_key?: string;
  deepseek_api_key?: string;
  zhipu_api_key?: string;
  ai_provider?: string;
  ai_model?: string;
  ai_persona?: string;
  short_break_duration: number;
  long_break_duration: number;
  long_break_interval: number;
  ai_proactivity?: boolean;
  ai_actionable?: boolean;
  auto_start_next?: boolean;
  active_theme_id?: string;
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
    headers: getAuthHeaders(),
    body: JSON.stringify(session),
  });
  return handleResponse<SessionResponse>(response);
};

export const getDailyStats = async (date?: Date): Promise<DailyStats> => {
  let url = `${API_BASE_URL}/stats/daily`;
  if (date) {
    url += `?target_date=${getFormattedDate(date)}`;
  }
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  return handleResponse<DailyStats>(response);
};

export const getStatsRange = async (startDate: Date, endDate: Date): Promise<StatsRangeResponse> => {
    const startStr = getFormattedDate(startDate);
    const endStr = getFormattedDate(endDate);
    const response = await fetch(`${API_BASE_URL}/stats/range?start_date=${startStr}&end_date=${endStr}`, {
        headers: getAuthHeaders(),
    });
    return handleResponse<StatsRangeResponse>(response);
};

export const getAuthHeaders = () => {
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
    aiProvider: backendSettings.ai_provider,
    aiModel: backendSettings.ai_model,
    openaiApiKey: backendSettings.openai_api_key,
    deepseekApiKey: backendSettings.deepseek_api_key,
    zhipuApiKey: backendSettings.zhipu_api_key,
    aiPersona: backendSettings.ai_persona,
    shortBreakDuration: backendSettings.short_break_duration,
    longBreakDuration: backendSettings.long_break_duration,
    longBreakInterval: backendSettings.long_break_interval,
    aiProactivity: backendSettings.ai_proactivity,
    aiActionable: backendSettings.ai_actionable,
    autoStartNext: backendSettings.auto_start_next ?? false,
    activeThemeId: backendSettings.active_theme_id,
  };
};

export const upsertUserSettings = async (settings: TimerSettings): Promise<TimerSettings> => {
  const backendPayload = {
    google_api_key: settings.googleApiKey,
    ai_provider: settings.aiProvider,
    ai_model: settings.aiModel,
    openai_api_key: settings.openaiApiKey,
    deepseek_api_key: settings.deepseekApiKey,
    zhipu_api_key: settings.zhipuApiKey,
    ai_persona: settings.aiPersona,
    short_break_duration: settings.shortBreakDuration,
    long_break_duration: settings.longBreakDuration,
    long_break_interval: settings.longBreakInterval,
    ai_proactivity: settings.aiProactivity,
    ai_actionable: settings.aiActionable,
    auto_start_next: settings.autoStartNext,
    active_theme_id: settings.activeThemeId,
  };

  const response = await fetch(`${API_BASE_URL}/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(backendPayload),
  });
  const updatedBackendSettings = await handleResponse<UserSettingsBackend>(response);

  return {
    googleApiKey: updatedBackendSettings.google_api_key,
    aiProvider: updatedBackendSettings.ai_provider,
    aiModel: updatedBackendSettings.ai_model,
    openaiApiKey: updatedBackendSettings.openai_api_key,
    deepseekApiKey: updatedBackendSettings.deepseek_api_key,
    zhipuApiKey: updatedBackendSettings.zhipu_api_key,
    aiPersona: updatedBackendSettings.ai_persona,
    shortBreakDuration: updatedBackendSettings.short_break_duration,
    longBreakDuration: updatedBackendSettings.long_break_duration,
    longBreakInterval: updatedBackendSettings.long_break_interval,
    aiProactivity: updatedBackendSettings.ai_proactivity,
    aiActionable: updatedBackendSettings.ai_actionable,
    autoStartNext: updatedBackendSettings.auto_start_next ?? settings.autoStartNext,
    activeThemeId: updatedBackendSettings.active_theme_id,
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

export const getProviderModels = async (provider: string, apiKey?: string): Promise<string[]> => {
  let url = `${API_BASE_URL}/chat/models/${provider}`;
  if (apiKey) {
    url += `?api_key=${encodeURIComponent(apiKey)}`;
  }
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ provider: string; models: string[] }>(response);
  return data.models;
};

export interface CountdownBackend {
  id: number;
  user_id: string;
  title: string;
  target_date: string;
  created_at: string;
}

export const getCountdowns = async (): Promise<import("../types/pomodoro").CountdownEvent[]> => {
  const response = await fetch(`${API_BASE_URL}/countdowns`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<CountdownBackend[]>(response);
  return data.map(item => ({
    id: item.id,
    title: item.title,
    targetDate: item.target_date,
  }));
};

export const createCountdown = async (title: string, targetDate: Date): Promise<import("../types/pomodoro").CountdownEvent> => {
  const response = await fetch(`${API_BASE_URL}/countdowns`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title, target_date: targetDate.toISOString() }),
  });
  const data = await handleResponse<CountdownBackend>(response);
  return {
    id: data.id,
    title: data.title,
    targetDate: data.target_date,
  };
};

export const deleteCountdown = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/countdowns/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to delete countdown');
  }
};
