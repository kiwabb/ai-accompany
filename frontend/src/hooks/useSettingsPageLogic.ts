import { useState, useCallback } from 'react';
import { useTimerContext } from '../contexts/useTimerContext';
import { updateUserTheme } from '../api/client';
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

    // Persist changed themes (name / focusDuration / iconType) to backend
    if (draftThemes) {
      const initialMap = new Map(initialThemes.map((t) => [t.id, t]));
      const changedThemes = draftThemes.filter((t) => {
        const orig = initialMap.get(t.id);
        return (
          !orig ||
          orig.name !== t.name ||
          orig.focusDuration !== t.focusDuration ||
          orig.iconType !== t.iconType
        );
      });
      if (changedThemes.length > 0) {
        try {
          await Promise.all(
            changedThemes.map((t) =>
              updateUserTheme(t.id, {
                name: t.name,
                focus_duration: t.focusDuration,
                icon_type: t.iconType ?? null,
              })
            )
          );
          handleThemesChange(draftThemes);
        } catch (error) {
          console.error('Failed to save theme edits:', error);
        }
      }
    }

    setShowSavedToast(true);
    setDraftSettings(null);
    setDraftThemes(null);
    setTimeout(() => setShowSavedToast(false), 3000);
  }, [handleSaveSettings, settings, draftThemes, initialThemes, handleThemesChange]);

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
