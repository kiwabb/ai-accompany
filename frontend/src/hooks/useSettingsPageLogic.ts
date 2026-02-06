import { useState, useCallback } from 'react';
import { useTimerContext } from '../contexts/TimerContext';
import type { TimerSettings, FocusTheme } from '../types/pomodoro';

export const useSettingsPageLogic = () => {
  const { state, handleSaveSettings, handleThemesChange } = useTimerContext();
  const { settings: initialSettings, themes: initialThemes } = state;

  const [draftSettings, setDraftSettings] = useState<TimerSettings | null>(null);
  const [draftThemes, setDraftThemes] = useState<FocusTheme[] | null>(null);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const settings = draftSettings ?? initialSettings;
  const themes = draftThemes ?? initialThemes;

  const handleSettingChange = useCallback((key: keyof TimerSettings, value: number | boolean | string) => {
    setDraftSettings((prev) => ({ ...(prev ?? initialSettings), [key]: value }));
  }, [initialSettings]);

  const updateThemes = useCallback((action: React.SetStateAction<FocusTheme[]>) => {
    setDraftThemes((prev) => {
        const current = prev ?? initialThemes;
        return typeof action === 'function' ? action(current) : action;
    });
  }, [initialThemes]);

  const handleSave = useCallback(async () => {
    await handleSaveSettings(settings);
    setShowSavedToast(true);
    setDraftSettings(null);
    setDraftThemes(null);
    setTimeout(() => setShowSavedToast(false), 3000);
  }, [handleSaveSettings, settings]);

  return {
    settings,
    themes,
    showSavedToast,
    handleSettingChange,
    handleSave,
    setThemes: updateThemes,
    handleThemesChange,
  };
};
