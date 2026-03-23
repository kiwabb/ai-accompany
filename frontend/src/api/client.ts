import { getFormattedDate } from "../utils/date";
import type { TimerSettings, FocusTheme, CountdownEvent } from "../types/pomodoro";
import type {
  SessionCreate,
  SessionResponse,
  DailyStats,
  StatsRangeResponse,
  UserSettingsBackend,
  UserThemeBackend,
  ThemeCreate,
  CountdownBackend,
  UserAchievementResponse,
} from "./types";
import { backendToFrontendSettings, frontendToBackendSettings } from "./settingsTransformer";

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

const API_BASE_URL = '/api';

const parseErrorMessage = async (response: Response): Promise<string> => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const errorData = await response
      .json()
      .then((payload) => payload as { detail?: string; message?: string })
      .catch(() => null);

    if (errorData) {
      if (errorData.detail) {
        return errorData.detail;
      }
      if (errorData.message) {
        return errorData.message;
      }
    }
  }

  const text = await response.text().catch(() => '');
  if (text.trim()) {
    return text;
  }

  return response.statusText || `Request failed with status ${response.status}`;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response);
    throw new Error(errorMessage || 'Something went wrong');
  }
  return response.json();
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    headers['Authorization'] = `Bearer user-123`;
  }
  
  return headers;
};

// Session API
export const saveSession = async (session: SessionCreate): Promise<SessionResponse> => {
  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(session),
  });
  return handleResponse<SessionResponse>(response);
};

// Stats API
export const getDailyStats = async (date?: Date): Promise<DailyStats> => {
  let url = `${API_BASE_URL}/stats/daily`;
  if (date) {
    url += `?target_date=${getFormattedDate(date)}`;
  }
  const response = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse<DailyStats>(response);
};

export const getStatsRange = async (startDate: Date, endDate: Date): Promise<StatsRangeResponse> => {
  const startStr = getFormattedDate(startDate);
  const endStr = getFormattedDate(endDate);
  const response = await fetch(
    `${API_BASE_URL}/stats/range?start_date=${startStr}&end_date=${endStr}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<StatsRangeResponse>(response);
};

// Settings API
export const getUserSettings = async (): Promise<TimerSettings> => {
  const response = await fetch(`${API_BASE_URL}/settings`, { headers: getAuthHeaders() });
  const backend = await handleResponse<UserSettingsBackend>(response);
  return backendToFrontendSettings(backend);
};

export const upsertUserSettings = async (settings: TimerSettings): Promise<TimerSettings> => {
  const response = await fetch(`${API_BASE_URL}/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(frontendToBackendSettings(settings)),
  });
  const backend = await handleResponse<UserSettingsBackend>(response);
  return backendToFrontendSettings(backend, settings);
};

// Theme API
export const getUserThemes = async (): Promise<FocusTheme[]> => {
  const response = await fetch(`${API_BASE_URL}/themes`, { headers: getAuthHeaders() });
  const backend = await handleResponse<UserThemeBackend[]>(response);
  return backend.map(t => ({
    id: t.theme_id,
    name: t.name,
    focusDuration: t.focus_duration,
    isDefault: t.is_default,
  }));
};

export const createUserTheme = async (theme: FocusTheme): Promise<void> => {
  const payload: ThemeCreate = {
    theme_id: theme.id,
    name: theme.name,
    focus_duration: theme.focusDuration,
    is_default: theme.isDefault,
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
    const errorMessage = await parseErrorMessage(response);
    throw new Error(errorMessage || 'Failed to delete theme');
  }
};

// AI Models API
export const getProviderModels = async (provider: string, apiKey?: string): Promise<string[]> => {
  let url = `${API_BASE_URL}/chat/models/${provider}`;
  if (apiKey) {
    url += `?api_key=${encodeURIComponent(apiKey)}`;
  }
  const response = await fetch(url, { headers: getAuthHeaders() });
  const data = await handleResponse<{ provider: string; models: string[] }>(response);
  return data.models;
};

// Countdown API
export const getCountdowns = async (): Promise<CountdownEvent[]> => {
  const response = await fetch(`${API_BASE_URL}/countdowns`, { headers: getAuthHeaders() });
  const data = await handleResponse<CountdownBackend[]>(response);
  return data.map(item => ({
    id: item.id,
    title: item.title,
    targetDate: item.target_date,
  }));
};

export const createCountdown = async (title: string, targetDate: Date): Promise<CountdownEvent> => {
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
    const errorMessage = await parseErrorMessage(response);
    throw new Error(errorMessage || 'Failed to delete countdown');
  }
};

// Auth API
export const login = async (formData: FormData): Promise<{ access_token: string; token_type: string }> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<{ access_token: string; token_type: string }>(response);
};

export const signup = async (userData: any): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  return handleResponse<any>(response);
};

// Achievement API
export const getAchievements = async (): Promise<UserAchievementResponse[]> => {
  const response = await fetch(`${API_BASE_URL}/achievements`, { headers: getAuthHeaders() });
  return handleResponse<UserAchievementResponse[]>(response);
};

export const getLatestUnlocks = async (minutes: number = 5): Promise<UserAchievementResponse[]> => {
  const response = await fetch(
    `${API_BASE_URL}/achievements/latest-unlocks?minutes=${minutes}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<UserAchievementResponse[]>(response);
};
