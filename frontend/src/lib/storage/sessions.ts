import { getFormattedDate } from '../../utils/date';
import type { SessionCreate, SessionResponse, DailyStats, StatsRangeResponse } from '../../api/types';

const STORAGE_KEY = 'pomodoro_sessions';

export function getRawSessions(): SessionResponse[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRawSessions(sessions: SessionResponse[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export async function saveSession(session: SessionCreate): Promise<SessionResponse> {
  const sessions = getRawSessions();
  const newSession: SessionResponse = {
    id: Date.now(),
    theme_name: session.theme_name,
    duration_seconds: session.duration_seconds,
    phase_type: session.phase_type,
    status: session.status,
    start_time: session.start_time,
    end_time: session.end_time,
    created_at: new Date().toISOString(),
  };
  sessions.push(newSession);
  saveRawSessions(sessions);
  return newSession;
}

export async function getDailyStats(date?: Date): Promise<DailyStats> {
  const targetDate = date ? new Date(date) : new Date();
  const dateStr = getFormattedDate(targetDate);
  const sessions = getRawSessions();

  // Filter sessions that started on targetDate
  const dailySessions = sessions.filter(s => {
    // start_time is usually an ISO string
    return s.start_time.startsWith(dateStr);
  });

  const totalSessions = dailySessions.length;

  // sum total focus duration_seconds for phase_type == 'focus'
  const focusSessions = dailySessions.filter(s => s.phase_type === 'focus' && s.status === 'completed');
  const totalFocusSeconds = focusSessions.reduce((acc, curr) => acc + curr.duration_seconds, 0);
  const totalFocusMinutes = Math.round(totalFocusSeconds / 60);

  // stats by theme (only focus type)
  const sessionsByTheme: { [key: string]: number } = {};
  focusSessions.forEach(s => {
    const theme = s.theme_name;
    const minutes = Math.round(s.duration_seconds / 60);
    sessionsByTheme[theme] = (sessionsByTheme[theme] || 0) + minutes;
  });

  return {
    date: dateStr,
    total_focus_minutes: totalFocusMinutes,
    total_sessions: totalSessions,
    sessions_by_theme: sessionsByTheme,
  };
}

export async function getStatsRange(startDate: Date, endDate: Date): Promise<StatsRangeResponse> {
  const sessions = getRawSessions();
  const startStr = getFormattedDate(startDate);
  const endStr = getFormattedDate(endDate);

  // Date parsing bounds
  const start = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T23:59:59');

  const inRangeSessions = sessions.filter(s => {
    const sDate = new Date(s.start_time);
    return sDate >= start && sDate <= end;
  }).sort((a, b) => b.id - a.id); // Descending order (newest first)

  let totalFocusSeconds = 0;
  const totalSessions = inRangeSessions.length;
  const themeDistribution: { [key: string]: number } = {};
  const dailyStatsMap: { [dateStr: string]: { focusSeconds: number; sessions: number; themes: { [theme: string]: number } } } = {};

  inRangeSessions.forEach(s => {
    const dStr = s.start_time.split('T')[0];
    if (!dailyStatsMap[dStr]) {
      dailyStatsMap[dStr] = { focusSeconds: 0, sessions: 0, themes: {} };
    }

    dailyStatsMap[dStr].sessions += 1;

    if (s.phase_type === 'focus' && s.status === 'completed') {
      dailyStatsMap[dStr].focusSeconds += s.duration_seconds;
      totalFocusSeconds += s.duration_seconds;

      const theme = s.theme_name;
      dailyStatsMap[dStr].themes[theme] = (dailyStatsMap[dStr].themes[theme] || 0) + s.duration_seconds;
      themeDistribution[theme] = (themeDistribution[theme] || 0) + s.duration_seconds;
    }
  });

  const dailyStatsList = Object.keys(dailyStatsMap).sort().map(dStr => {
    const data = dailyStatsMap[dStr];
    const themesMinutes: { [key: string]: number } = {};
    Object.keys(data.themes).forEach(t => {
      themesMinutes[t] = Math.round(data.themes[t] / 60);
    });

    return {
      date: dStr,
      total_focus_minutes: Math.round(data.focusSeconds / 60),
      total_sessions: data.sessions,
      sessions_by_theme: themesMinutes,
    };
  });

  const sessionsDetails = inRangeSessions.map(s => ({
    theme_name: s.theme_name,
    duration_minutes: Math.round(s.duration_seconds / 60),
    start_time: s.start_time,
    end_time: s.end_time,
  }));

  const globalThemeDistribution: { [key: string]: number } = {};
  Object.keys(themeDistribution).forEach(t => {
    globalThemeDistribution[t] = Math.round(themeDistribution[t] / 60);
  });

  return {
    total_focus_minutes: Math.round(totalFocusSeconds / 60),
    total_sessions: totalSessions,
    daily_stats: dailyStatsList,
    sessions_by_theme: globalThemeDistribution,
    sessions_details: sessionsDetails,
  };
}
