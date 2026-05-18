import type { TimerSettings } from "../types/pomodoro";
import type { UserSettingsBackend } from "./types";

/**
 * Converts backend settings format to frontend TimerSettings format
 */
export function backendToFrontendSettings(backend: UserSettingsBackend, fallback?: Partial<TimerSettings>): TimerSettings {
  return {
    googleApiKey: backend.google_api_key,
    aiProvider: backend.ai_provider,
    aiModel: backend.ai_model,
    openaiApiKey: backend.openai_api_key,
    deepseekApiKey: backend.deepseek_api_key,
    zhipuApiKey: backend.zhipu_api_key,
    aiPersona: backend.ai_persona,
    shortBreakDuration: backend.short_break_duration,
    longBreakDuration: backend.long_break_duration,
    longBreakInterval: backend.long_break_interval,
    targetRounds: backend.target_rounds ?? fallback?.targetRounds ?? 4,
    aiProactivity: backend.ai_proactivity,
    aiActionable: backend.ai_actionable,
    autoStartNext: backend.auto_start_next ?? fallback?.autoStartNext ?? false,
    activeThemeId: backend.active_theme_id,
  };
}

/**
 * Converts frontend TimerSettings format to backend payload format
 */
export function frontendToBackendSettings(settings: TimerSettings): Record<string, unknown> {
  return {
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
    target_rounds: settings.targetRounds,
    ai_proactivity: settings.aiProactivity,
    ai_actionable: settings.aiActionable,
    auto_start_next: settings.autoStartNext,
    active_theme_id: settings.activeThemeId,
  };
}
