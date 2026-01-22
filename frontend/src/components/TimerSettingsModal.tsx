import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { FocusTheme, TimerSettings } from '../types/pomodoro';
import { v4 as uuidv4 } from 'uuid';

interface TimerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettings: TimerSettings;
  initialThemes: FocusTheme[];
  onSave: (settings: TimerSettings, themes: FocusTheme[]) => void;
}

const TimerSettingsModal: React.FC<TimerSettingsModalProps> = ({
  isOpen,
  onClose,
  initialSettings,
  initialThemes,
  onSave,
}) => {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<TimerSettings>(initialSettings);
  const [themes, setThemes] = useState<FocusTheme[]>(initialThemes);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeDuration, setNewThemeDuration] = useState(25);

  useEffect(() => {
    if (isOpen) {
      setSettings(initialSettings);
      setThemes(initialThemes);
    }
  }, [isOpen, initialSettings, initialThemes]);

  const handleSettingChange = useCallback((key: keyof TimerSettings, value: number | boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleThemeNameChange = useCallback((id: string, name: string) => {
    setThemes((prev) => prev.map((theme) => (theme.id === id ? { ...theme, name } : theme)));
  }, []);

  const handleThemeDurationChange = useCallback((id: string, duration: number) => {
    setThemes((prev) => prev.map((theme) => (theme.id === id ? { ...theme, focusDuration: Math.max(1, duration) } : theme)));
  }, []);

  const handleAddTheme = useCallback(() => {
    if (newThemeName.trim() && newThemeDuration > 0) {
      setThemes((prev) => [
        ...prev,
        { id: uuidv4(), name: newThemeName.trim(), focusDuration: newThemeDuration, isDefault: false },
      ]);
      setNewThemeName('');
      setNewThemeDuration(25);
    }
  }, [newThemeName, newThemeDuration]);

  const handleRemoveTheme = useCallback((id: string) => {
    setThemes((prev) => prev.filter((theme) => theme.id !== id));
  }, []);

  const handleSave = useCallback(() => {
    onSave(settings, themes);
    onClose();
  }, [settings, themes, onSave, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-cozy-text/40 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-cozy-cream rounded-[3rem] p-10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-cozy-text">{t('common.settings')}</h2>
              <motion.button
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2.5 rounded-2xl bg-white/50 text-cozy-text-light hover:text-cozy-red transition-colors shadow-sm"
              >
                <X size={20} strokeWidth={2.5} />
              </motion.button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-10 pr-2 custom-scrollbar">
                <section>
                <h3 className="text-xs font-black uppercase tracking-[0.25em] text-cozy-text-light/50 mb-6 flex items-center">
                  <span className="w-8 h-px bg-cozy-text-light/20 mr-3" />
                  API Keys
                </h3>
                <div className="flex items-center justify-between p-4 bg-white/40 rounded-[1.5rem] border border-white">
                  <label className="text-sm font-bold text-cozy-text-light">Google Gemini API Key</label>
                  <input
                    type="password"
                    value={settings.googleApiKey || ''}
                    onChange={(e) => handleSettingChange('googleApiKey', e.target.value)}
                    placeholder="Enter key..."
                    className="w-48 bg-transparent text-right font-bold text-cozy-orange focus:outline-none placeholder:text-cozy-text-light/30"
                  />
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.25em] text-cozy-text-light/50 mb-6 flex items-center">
                  <span className="w-8 h-px bg-cozy-text-light/20 mr-3" />
                  {t('settings.language')}
                </h3>
                <div className="flex items-center justify-between p-4 bg-white/40 rounded-[1.5rem] border border-white">
                  <label className="text-sm font-bold text-cozy-text-light">{t('settings.language')}</label>
                  <div className="relative">
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => i18n.changeLanguage('en')}
                        className={`px-4 py-2 rounded-xl font-bold transition-colors ${
                          i18n.language === 'en' ? 'bg-cozy-orange text-white shadow-lg' : 'bg-cozy-cream text-cozy-text-light hover:bg-white'
                        }`}
                      >
                        English
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => i18n.changeLanguage('zh')}
                        className={`px-4 py-2 rounded-xl font-bold transition-colors ${
                          i18n.language === 'zh' ? 'bg-cozy-orange text-white shadow-lg' : 'bg-cozy-cream text-cozy-text-light hover:bg-white'
                        }`}
                      >
                        中文
                      </motion.button>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.25em] text-cozy-text-light/50 mb-6 flex items-center">
                  <span className="w-8 h-px bg-cozy-text-light/20 mr-3" />
                  {t('settings.aiPersona')}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'gentle_encourager',
                    'strict_coach',
                    'logical_analyst',
                    'humorous_buddy'
                  ].map((persona) => (
                    <motion.button
                      key={persona}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSettingChange('aiPersona', persona)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        settings.aiPersona === persona
                          ? 'bg-cozy-orange border-cozy-orange text-white shadow-lg shadow-cozy-orange/20'
                          : 'bg-white/40 border-white text-cozy-text-light hover:bg-white/60'
                      }`}
                    >
                      <div className="font-bold text-sm">{t(`settings.personas.${persona}`)}</div>
                    </motion.button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.25em] text-cozy-text-light/50 mb-6 flex items-center">
                  <span className="w-8 h-px bg-cozy-text-light/20 mr-3" />
                  {t('settings.durations')}
                </h3>
                <div className="space-y-4">
                  {[ 
                    { key: 'shortBreakDuration', label: t('common.shortBreak') },
                    { key: 'longBreakDuration', label: t('common.longBreak') },
                    { key: 'longBreakInterval', label: t('settings.longBreakInterval') },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-white/40 rounded-[1.5rem] border border-white">
                      <label className="text-sm font-bold text-cozy-text-light">{label}</label>
                      <input
                        type="number"
                        min={1}
                        value={settings[key as keyof TimerSettings] as number}
                        onChange={(e) => handleSettingChange(key as keyof TimerSettings, parseInt(e.target.value))}
                        className="w-16 bg-transparent text-right font-bold text-cozy-orange focus:outline-none"
                      />
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-4 bg-white/40 rounded-[1.5rem] border border-white">
                    <label className="text-sm font-bold text-cozy-text-light">{t('settings.autoStart')}</label>
                    <button 
                      onClick={() => handleSettingChange('autoStartNext', !settings.autoStartNext)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoStartNext ? 'bg-cozy-green' : 'bg-gray-300'}`}
                    >
                      <motion.div 
                        animate={{ x: settings.autoStartNext ? 26 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                      />
                    </button>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black uppercase tracking-[0.25em] text-cozy-text-light/50 mb-6 flex items-center">
                  <span className="w-8 h-px bg-cozy-text-light/20 mr-3" />
                  {t('settings.themes')}
                </h3>
                <div className="space-y-3">
                  {themes.map((theme) => (
                    <div key={theme.id} className="flex items-center space-x-3 p-3 bg-white/60 rounded-[1.5rem] shadow-sm border border-white">
                      <input
                        type="text"
                        value={theme.name}
                        onChange={(e) => handleThemeNameChange(theme.id, e.target.value)}
                        className="flex-grow bg-transparent font-bold text-cozy-text focus:outline-none disabled:opacity-50"
                        disabled={theme.isDefault}
                      />
                      <div className="flex items-center bg-cozy-cream rounded-xl px-2 py-1">
                        <input
                          type="number"
                          min={1}
                          value={theme.focusDuration}
                          onChange={(e) => handleThemeDurationChange(theme.id, parseInt(e.target.value))}
                          className="w-10 bg-transparent text-center font-bold text-cozy-orange focus:outline-none"
                        />
                        <span className="text-[10px] font-bold text-cozy-text-light/50 mr-1">m</span>
                      </div>
                      {!theme.isDefault && (
                        <button
                          onClick={() => handleRemoveTheme(theme.id)}
                          className="p-2 text-cozy-text-light/30 hover:text-cozy-red transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-cozy-orange/10 rounded-[2rem] border border-dashed border-cozy-orange/30">
                  <div className="flex space-x-2">
                    <input
                      placeholder={t('settings.newThemeName')}
                      value={newThemeName}
                      onChange={(e) => setNewThemeName(e.target.value)}
                      className="flex-grow bg-transparent font-bold text-cozy-text focus:outline-none placeholder:text-cozy-orange/30"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min={1}
                        value={newThemeDuration}
                        onChange={(e) => setNewThemeDuration(parseInt(e.target.value))}
                        className="w-12 bg-white/50 rounded-xl px-2 py-1 text-center font-bold text-cozy-orange focus:outline-none"
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleAddTheme}
                        className="p-2 bg-cozy-orange text-white rounded-xl shadow-lg shadow-cozy-orange/20"
                      >
                        <Plus size={18} strokeWidth={3} />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-10 pt-6 border-t border-cozy-text/5 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                className="px-10 py-4 bg-cozy-text text-white rounded-[1.5rem] font-bold shadow-xl transition-all"
              >
                {t('common.save')}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TimerSettingsModal;
