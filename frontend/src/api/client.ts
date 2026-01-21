import { getFormattedDate } from "../utils/date";

// TypeScript interfaces mirroring backend Pydantic schemas
export interface SessionCreate {
  theme_name: string;
  duration_seconds: number;
  phase_type: 'focus' | 'shortBreak' | 'longBreak';
  status: 'completed' | 'skipped' | 'interrupted';
  start_time: string; // ISO 8601 string
  end_time: string;   // ISO 8601 string
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

const API_BASE_URL = '/api'; // Vite proxy will handle this

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
    url += `?target_date=${getFormattedDate(date)}`; // Use YYYY-MM-DD
  }
  const response = await fetch(url);
  return handleResponse<DailyStats>(response);
};

// Helper to format date to YYYY-MM-DD string
// TODO: move to a utils file if it becomes common
/*
function getFormattedDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
*/
