// Session types
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

// Stats types
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

// User settings types
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
  target_rounds?: number;
  ai_proactivity?: boolean;
  ai_actionable?: boolean;
  auto_start_next?: boolean;
  active_theme_id?: string;
  created_at: string;
  updated_at: string;
}

// Theme types
export interface UserThemeBackend {
  id: number;
  user_id: string;
  theme_id: string;
  name: string;
  focus_duration: number;
  is_default: boolean;
  icon_type?: string | null;
  created_at: string;
}

export interface ThemeCreate {
  theme_id: string;
  name: string;
  focus_duration: number;
  is_default: boolean;
  icon_type?: string | null;
}

export interface ThemeUpdate {
  name?: string;
  focus_duration?: number;
  icon_type?: string | null;
}

// Countdown types
export interface CountdownBackend {
  id: number;
  user_id: string;
  title: string;
  target_date: string;
  created_at: string;
}

// Achievement types
export interface AchievementResponse {
  id: number;
  key: string;
  name: string;
  description: string;
  category: string;
  target_type: string;
  target_value: number;
  is_hidden: boolean;
}

export interface UserAchievementResponse {
  id: number;
  achievement_id: number;
  current_progress: number;
  status: 'in_progress' | 'unlocked';
  unlocked_at?: string;
  updated_at: string;
  achievement: AchievementResponse;
}

export type UserAchievementBackend = UserAchievementResponse;
