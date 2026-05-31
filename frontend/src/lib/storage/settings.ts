import type { TimerSettings, FocusTheme } from '../../types/pomodoro';
import { DEFAULT_SETTINGS, DEFAULT_THEMES } from '../../constants/pomodoro';

const SETTINGS_KEY = 'pomodoro_settings';
const THEMES_KEY = 'pomodoro_themes';

export async function getUserSettings(): Promise<TimerSettings> {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function upsertUserSettings(settings: TimerSettings): Promise<TimerSettings> {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  return settings;
}

export async function getUserThemes(): Promise<FocusTheme[]> {
  try {
    const raw = localStorage.getItem(THEMES_KEY);
    if (!raw) return DEFAULT_THEMES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_THEMES;
  } catch {
    return DEFAULT_THEMES;
  }
}

export async function createUserTheme(theme: FocusTheme): Promise<void> {
  const themes = await getUserThemes();
  if (themes.some(t => t.id === theme.id)) {
    throw new Error('Theme ID already exists');
  }
  themes.push(theme);
  localStorage.setItem(THEMES_KEY, JSON.stringify(themes));
}

export async function updateUserTheme(
  themeId: string,
  patch: { name?: string; focus_duration?: number; icon_type?: string | null }
): Promise<FocusTheme> {
  const themes = await getUserThemes();
  const index = themes.findIndex(t => t.id === themeId);
  if (index === -1) {
    throw new Error('Theme not found');
  }

  const updatedTheme = {
    ...themes[index],
    name: patch.name !== undefined ? patch.name : themes[index].name,
    focusDuration: patch.focus_duration !== undefined ? patch.focus_duration : themes[index].focusDuration,
    iconType: patch.icon_type !== undefined ? (patch.icon_type || undefined) : themes[index].iconType,
  };

  themes[index] = updatedTheme;
  localStorage.setItem(THEMES_KEY, JSON.stringify(themes));
  return updatedTheme;
}

export async function deleteUserTheme(themeId: string): Promise<void> {
  const themes = await getUserThemes();
  const updatedThemes = themes.filter(t => t.id !== themeId);
  localStorage.setItem(THEMES_KEY, JSON.stringify(updatedThemes));
}
