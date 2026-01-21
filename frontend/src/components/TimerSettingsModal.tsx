
import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Settings } from 'lucide-react';
import { FocusTheme, TimerSettings } from '../types/pomodoro';

interface TimerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettings: TimerSettings;
  initialThemes: FocusTheme[];
  onSave: (settings: TimerSettings, themes: FocusTheme[]) => void;
}

const TimerSettingsModal: React.FC<TimerSettingsModalProps> = React.memo(
  ({ isOpen, onClose, initialSettings, initialThemes, onSave }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'themes'>('general');
    const [localSettings, setLocalSettings] = useState<TimerSettings>(initialSettings);
    const [localThemes, setLocalThemes] = useState<FocusTheme[]>(initialThemes);

    useEffect(() => {
      if (isOpen) {
        setLocalSettings(initialSettings);
        setLocalThemes(initialThemes);
      }
    }, [isOpen, initialSettings, initialThemes]);

    const handleSettingChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setLocalSettings((prev) => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : Math.max(1, Number(value)),
        }));
      },
      []
    );

    const handleThemeChange = useCallback(
      (id: string, field: keyof FocusTheme, value: any) => {
        setLocalThemes((prev) =>
          prev.map((theme) => {
            if (theme.id === id) {
              if (field === 'name' && !value.trim()) {
                return theme; 
              }
              if (field === 'focusDuration') {
                return { ...theme, [field]: Math.max(1, Number(value)) };
              }
              return { ...theme, [field]: value };
            }
            return theme;
          })
        );
      },
      []
    );

    const addTheme = useCallback(() => {
      const newTheme: FocusTheme = {
        id: `custom-${Date.now()}`,
        name: 'New Custom Theme',
        focusDuration: 25,
        isDefault: false,
      };
      setLocalThemes((prev) => [...prev, newTheme]);
    }, []);

    const deleteTheme = useCallback((id: string) => {
      setLocalThemes((prev) => prev.filter((theme) => theme.id !== id));
    }, []);

    const handleSave = useCallback(() => {
      onSave(localSettings, localThemes);
      onClose();
    }, [localSettings, localThemes, onSave, onClose]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        <div role="dialog" aria-modal="true" aria-labelledby="settings-title" className="relative w-full max-w-2xl transform rounded-2xl border border-zinc-700 bg-zinc-800 p-4 sm:p-8 text-white shadow-2xl transition-all duration-300 ease-out">
          <div className="mb-6 flex items-center justify-between">
            <h2 id="settings-title" className="flex items-center text-3xl font-bold tracking-tight text-white">
              <Settings className="mr-3 h-7 w-7 text-indigo-400" />
              Settings
            </h2>
            <button
              aria-label="Close settings"
              onClick={onClose}
              className="group rounded-full p-2 transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <X className="h-6 w-6 text-zinc-400 group-hover:text-white" />
            </button>
          </div>

          <div className="mb-6 border-b border-zinc-700">
            <nav className="-mb-px flex space-x-8">
              <button
                className={`whitespace-nowrap border-b-2 px-1 pb-3 text-lg font-medium transition-colors duration-200 ${
                  activeTab === 'general'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                }`}
                onClick={() => setActiveTab('general')}
              >
                General Settings
              </button>
              <button
                className={`whitespace-nowrap border-b-2 px-1 pb-3 text-lg font-medium transition-colors duration-200 ${
                  activeTab === 'themes'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                }`}
                onClick={() => setActiveTab('themes')}
              >
                Themes
              </button>
            </nav>
          </div>

          <div className="max-h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-track-zinc-700 scrollbar-thumb-zinc-500">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label htmlFor="shortBreakDuration" className="text-lg text-zinc-200">
                    Short Break Duration (minutes)
                  </label>
                  <input
                    type="number"
                    id="shortBreakDuration"
                    name="shortBreakDuration"
                    value={localSettings.shortBreakDuration}
                    onChange={handleSettingChange}
                    min="1"
                    className="w-24 rounded-md border border-zinc-600 bg-zinc-700 p-2 text-right text-lg text-white focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="longBreakDuration" className="text-lg text-zinc-200">
                    Long Break Duration (minutes)
                  </label>
                  <input
                    type="number"
                    id="longBreakDuration"
                    name="longBreakDuration"
                    value={localSettings.longBreakDuration}
                    onChange={handleSettingChange}
                    min="1"
                    className="w-24 rounded-md border border-zinc-600 bg-zinc-700 p-2 text-right text-lg text-white focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="longBreakInterval" className="text-lg text-zinc-200">
                    Long Break Interval (sessions)
                  </label>
                  <input
                    type="number"
                    id="longBreakInterval"
                    name="longBreakInterval"
                    value={localSettings.longBreakInterval}
                    onChange={handleSettingChange}
                    min="1"
                    className="w-24 rounded-md border border-zinc-600 bg-zinc-700 p-2 text-right text-lg text-white focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="autoStartNext" className="text-lg text-zinc-200">
                    Auto start next timer
                  </label>
                  <input
                    type="checkbox"
                    id="autoStartNext"
                    name="autoStartNext"
                    checked={localSettings.autoStartNext}
                    onChange={handleSettingChange}
                    className="h-6 w-6 cursor-pointer rounded border-zinc-600 bg-zinc-700 text-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {activeTab === 'themes' && (
              <div className="space-y-4">
                {localThemes.map((theme) => (
                  <div
                    key={theme.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-700 p-4 shadow-md"
                  >
                    <div className="flex-grow pr-4">
                      <label htmlFor={`theme-name-${theme.id}`} className="sr-only">
                        Theme Name
                      </label>
                      <input
                        type="text"
                        id={`theme-name-${theme.id}`}
                        value={theme.name}
                        onChange={(e) => handleThemeChange(theme.id, 'name', e.target.value)}
                        className="w-full rounded-md border border-zinc-600 bg-zinc-800 p-2 text-lg font-medium text-white focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex items-center space-x-3">
                      <label htmlFor={`theme-duration-${theme.id}`} className="sr-only">
                        Focus Duration
                      </label>
                      <input
                        type="number"
                        id={`theme-duration-${theme.id}`}
                        value={theme.focusDuration}
                        onChange={(e) =>
                          handleThemeChange(theme.id, 'focusDuration', Number(e.target.value))
                        }
                        min="1"
                        className="w-24 rounded-md border border-zinc-600 bg-zinc-800 p-2 text-right text-lg text-white focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      {!theme.isDefault && (
                        <button
                          onClick={() => deleteTheme(theme.id)}
                          className="group rounded-full p-2 transition-colors duration-200 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                          aria-label={`Delete ${theme.name} theme`}
                        >
                          <Trash2 className="h-5 w-5 text-zinc-400 group-hover:text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={addTheme}
                  className="mt-4 flex w-full items-center justify-center rounded-md border border-indigo-600 bg-indigo-700 py-3 text-lg font-semibold text-white transition-colors duration-200 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add New Theme
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end space-x-4 border-t border-zinc-700 pt-6">
            <button
              onClick={onClose}
              className="rounded-md border border-zinc-600 bg-zinc-700 px-6 py-3 text-lg font-medium text-white transition-colors duration-200 hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-md bg-indigo-600 px-6 py-3 text-lg font-semibold text-white transition-colors duration-200 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  }
);

export default TimerSettingsModal;
