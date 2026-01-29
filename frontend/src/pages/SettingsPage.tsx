import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useTimerContext } from '../contexts/TimerContext';
import { createUserTheme, deleteUserTheme, getProviderModels } from '../api/client';
import CustomSelect from '../components/ui/CustomSelect';
import type { FocusTheme, TimerSettings } from '../types/pomodoro';

const SettingsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { state, handleSaveSettings, handleThemesChange } = useTimerContext();
    const { settings: initialSettings, themes: initialThemes } = state;

    const [settings, setSettings] = useState<TimerSettings>(initialSettings);
    const [themes, setThemes] = useState<FocusTheme[]>(initialThemes);
    const [newThemeName, setNewThemeName] = useState('');
    const [newThemeDuration, setNewThemeDuration] = useState(25);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isFetchingModels, setIsFetchingModels] = useState(false);
    const [showSavedToast, setShowSavedToast] = useState(false);

    useEffect(() => {
        setSettings(initialSettings);
        setThemes(initialThemes);
    }, [initialSettings, initialThemes]);

    const fetchModels = useCallback(async (provider: string, apiKey?: string) => {
        if (!provider) return;
        setIsFetchingModels(true);
        try {
            const models = await getProviderModels(provider, apiKey);
            setAvailableModels(models);
        } catch (error) {
            console.error("Failed to fetch models:", error);
            setAvailableModels([]);
        } finally {
            setIsFetchingModels(false);
        }
    }, []);

    useEffect(() => {
        if (settings.aiProvider) {
            let key = undefined;
            if (settings.aiProvider === 'gemini') key = settings.googleApiKey;
            else if (settings.aiProvider === 'gpt') key = settings.openaiApiKey;
            else if (settings.aiProvider === 'deepseek') key = settings.deepseekApiKey;
            else if (settings.aiProvider === 'zhipu') key = settings.zhipuApiKey;

            fetchModels(settings.aiProvider, key);
        }
    }, [settings.aiProvider, settings.googleApiKey, settings.openaiApiKey, settings.deepseekApiKey, settings.zhipuApiKey, fetchModels]);

    const handleSettingChange = useCallback((key: keyof TimerSettings, value: number | boolean | string) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleThemeNameChange = useCallback((id: string, name: string) => {
        setThemes((prev) => prev.map((theme) => (theme.id === id ? { ...theme, name } : theme)));
    }, []);

    const handleThemeDurationChange = useCallback((id: string, duration: number) => {
        setThemes((prev) => prev.map((theme) => (theme.id === id ? { ...theme, focusDuration: Math.max(1, duration) } : theme)));
    }, []);

    const handleAddTheme = useCallback(async () => {
        if (newThemeName.trim() && newThemeDuration > 0) {
            const newTheme: FocusTheme = {
                id: uuidv4(),
                name: newThemeName.trim(),
                focusDuration: newThemeDuration,
                isDefault: false
            };

            try {
                await createUserTheme(newTheme);
                const updatedThemes = [...themes, newTheme];
                setThemes(updatedThemes);
                handleThemesChange(updatedThemes);
                setNewThemeName('');
                setNewThemeDuration(25);
            } catch (error) {
                console.error("Failed to create theme:", error);
            }
        }
    }, [newThemeName, newThemeDuration, themes, handleThemesChange]);

    const handleRemoveTheme = useCallback(async (id: string) => {
        try {
            await deleteUserTheme(id);
            const updatedThemes = themes.filter((theme) => theme.id !== id);
            setThemes(updatedThemes);
            handleThemesChange(updatedThemes);
        } catch (error) {
            console.error("Failed to delete theme:", error);
        }
    }, [themes, handleThemesChange]);

    const handleSave = async () => {
        await handleSaveSettings(settings);
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 3000);
    };

    return (
        <div className="min-h-screen bg-[#faf9f6] pb-20">
            {/* Header Area */}
            <div className="sticky top-0 z-50 bg-[#faf9f6]/90 backdrop-blur-md border-b border-[#e9e6da]">
                <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-[#6b6654] hover:text-gray-950 transition-colors px-4 py-2 hover:bg-black/5 rounded-2xl font-semibold"
                    >
                        <ArrowLeft size={20} />
                        <span>{t('common.back')}</span>
                    </button>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800">{t('common.settings')}</h1>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#4a4439] text-white rounded-2xl font-bold shadow-lg shadow-[#4a4439]/10 hover:bg-black transition-all"
                    >
                        <Save size={18} />
                        <span>{t('common.save')}</span>
                    </motion.button>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-6 pt-12">
                <div className="space-y-12">
                    {/* AI Provider Section */}
                    <section>
                        <h3 className="text-sm font-black uppercase tracking-[0.25em] text-[#8d8876] mb-8 flex items-center">
                            <span className="w-8 h-px bg-[#e9e6da] mr-3" />
                            {t('settings.aiProviderTitle')}
                        </h3>
                        <div className="grid gap-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white rounded-3xl border border-[#e9e6da] shadow-sm hover:shadow-md transition-shadow gap-4">
                                <label className="text-sm font-bold text-[#6b6654]">{t('settings.provider')}</label>
                                <div className="w-full md:w-64">
                                    <CustomSelect
                                        value={settings.aiProvider || 'gemini'}
                                        onChange={(val) => handleSettingChange('aiProvider', val)}
                                        options={[
                                            { value: 'gemini', label: 'Google Gemini' },
                                            { value: 'gpt', label: 'OpenAI (GPT)' },
                                            { value: 'deepseek', label: 'DeepSeek' },
                                            { value: 'zhipu', label: 'Zhipu AI (GLM)' },
                                            { value: 'ollama', label: 'Ollama (Local)' },
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white rounded-3xl border border-[#e9e6da] shadow-sm hover:shadow-md transition-shadow gap-4">
                                <label className="text-sm font-bold text-[#6b6654]">{t('settings.model')}</label>
                                <div className="w-full md:w-64">
                                    <CustomSelect
                                        value={settings.aiModel || ''}
                                        onChange={(val) => handleSettingChange('aiModel', val)}
                                        options={[
                                            { value: '', label: isFetchingModels ? t('settings.loading') : t('settings.default') },
                                            ...availableModels.map(model => ({ value: model, label: model }))
                                        ]}
                                        disabled={isFetchingModels}
                                    />
                                </div>
                            </div>

                            {['gemini', 'gpt', 'deepseek', 'zhipu'].includes(settings.aiProvider || '') && (
                                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white rounded-3xl border border-[#e9e6da] shadow-sm hover:shadow-md transition-shadow gap-4">
                                    <label className="text-sm font-bold text-[#6b6654]">
                                        {settings.aiProvider === 'gemini' ? 'Gemini' :
                                            settings.aiProvider === 'gpt' ? 'OpenAI' :
                                                settings.aiProvider === 'deepseek' ? 'DeepSeek' : 'Zhipu'} API Key
                                    </label>
                                    <input
                                        type="password"
                                        value={(settings as any)[`${settings.aiProvider === 'gpt' ? 'openai' : settings.aiProvider}ApiKey`] || ''}
                                        onChange={(e) => handleSettingChange(`${settings.aiProvider === 'gpt' ? 'openai' : settings.aiProvider}ApiKey` as any, e.target.value)}
                                        placeholder={t('settings.enterKey')}
                                        className="w-full md:w-64 bg-[#f0eee9]/50 px-4 py-3 rounded-xl font-bold text-[#d97706] focus:outline-none focus:ring-2 focus:ring-[#d97706]/20 transition-all text-sm"
                                    />
                                </div>
                            )}

                            {settings.aiProvider === 'ollama' && (
                                <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 text-sm text-indigo-600 italic">
                                    {t('settings.ollamaInfo')}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Preferences Section */}
                    <section>
                        <h3 className="text-sm font-black uppercase tracking-[0.25em] text-[#8d8876] mb-8 flex items-center">
                            <span className="w-8 h-px bg-[#e9e6da] mr-3" />
                            {t('settings.aiPersonaTitle')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                'gentle_encourager',
                                'strict_coach',
                                'logical_analyst',
                                'humorous_buddy'
                            ].map((persona) => (
                                <motion.button
                                    key={persona}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSettingChange('aiPersona', persona)}
                                    className={`p-6 rounded-3xl border text-left transition-all ${settings.aiPersona === persona
                                        ? 'bg-[#4a4439] border-[#4a4439] text-white shadow-xl shadow-[#4a4439]/20'
                                        : 'bg-white border-[#e9e6da] text-[#6b6654] hover:border-[#6b6654]/30 shadow-sm'
                                        }`}
                                >
                                    <div className="font-bold text-base mb-1">{t(`settings.personas.${persona}`)}</div>
                                    <div className={`text-xs opacity-70 ${settings.aiPersona === persona ? 'text-white' : 'text-[#8d8876]'}`}>
                                        {t('settings.aiPersonaDescription', { persona: t(`settings.personas.${persona}`) })}
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </section>

                    {/* Language Section */}
                    <section>
                        <h3 className="text-sm font-black uppercase tracking-[0.25em] text-[#8d8876] mb-8 flex items-center">
                            <span className="w-8 h-px bg-[#e9e6da] mr-3" />
                            {t('settings.language')}
                        </h3>
                        <div className="flex bg-white p-2 rounded-[2rem] border border-[#e9e6da] shadow-sm">
                            <button
                                onClick={() => i18n.changeLanguage('en')}
                                className={`flex-1 py-4 px-6 rounded-[1.5rem] font-bold transition-all ${i18n.language === 'en' ? 'bg-[#4a4439] text-white shadow-lg' : 'text-[#6b6654] hover:bg-black/5'}`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => i18n.changeLanguage('zh')}
                                className={`flex-1 py-4 px-6 rounded-[1.5rem] font-bold transition-all ${i18n.language === 'zh' ? 'bg-[#4a4439] text-white shadow-lg' : 'text-[#6b6654] hover:bg-black/5'}`}
                            >
                                中文
                            </button>
                        </div>
                    </section>

                    {/* Durations Section */}
                    <section>
                        <h3 className="text-sm font-black uppercase tracking-[0.25em] text-[#8d8876] mb-8 flex items-center">
                            <span className="w-8 h-px bg-[#e9e6da] mr-3" />
                            {t('settings.durations')}
                        </h3>
                        <div className="grid gap-4">
                            {[
                                { key: 'shortBreakDuration', label: t('common.shortBreak') },
                                { key: 'longBreakDuration', label: t('common.longBreak') },
                                { key: 'longBreakInterval', label: t('settings.longBreakInterval') },
                            ].map(({ key, label }) => (
                                <div key={key} className="flex items-center justify-between p-6 bg-white rounded-3xl border border-[#e9e6da] shadow-sm">
                                    <label className="text-sm font-bold text-[#6b6654]">{label}</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min={1}
                                            value={settings[key as keyof TimerSettings] as number}
                                            onChange={(e) => handleSettingChange(key as keyof TimerSettings, parseInt(e.target.value))}
                                            className="w-24 bg-[#f0eee9]/50 px-4 py-3 rounded-xl text-center font-bold text-[#d97706] focus:outline-none focus:ring-2 focus:ring-[#d97706]/20 transition-all"
                                        />
                                        <span className="text-xs font-bold text-[#8d8876]">{t('timer.minutes')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Themes Section */}
                    <section>
                        <h3 className="text-sm font-black uppercase tracking-[0.25em] text-[#8d8876] mb-8 flex items-center">
                            <span className="w-8 h-px bg-[#e9e6da] mr-3" />
                            {t('settings.themes')}
                        </h3>
                        <div className="space-y-4">
                            {themes.map((theme) => (
                                <div key={theme.id} className="group flex flex-col md:flex-row md:items-center gap-4 p-4 bg-white rounded-3xl border border-[#e9e6da] shadow-sm">
                                    <input
                                        type="text"
                                        value={theme.name}
                                        onChange={(e) => handleThemeNameChange(theme.id, e.target.value)}
                                        className="flex-grow bg-transparent font-bold text-[#4a4439] focus:outline-none disabled:opacity-50 px-2"
                                        disabled={theme.isDefault}
                                    />
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center bg-[#f0eee9]/50 rounded-xl px-4 py-2 border border-[#e9e6da]">
                                            <input
                                                type="number"
                                                min={1}
                                                value={theme.focusDuration}
                                                onChange={(e) => handleThemeDurationChange(theme.id, parseInt(e.target.value))}
                                                className="w-10 bg-transparent text-center font-bold text-[#d97706] focus:outline-none"
                                            />
                                            <span className="text-xs font-bold text-[#8d8876] ml-1">{t('timer.minutes')}</span>
                                        </div>
                                        {!theme.isDefault && (
                                            <button
                                                onClick={() => handleRemoveTheme(theme.id)}
                                                className="p-3 text-[#b4afa1] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="mt-8 p-6 bg-white/50 border-2 border-dashed border-[#e9e6da] rounded-[2.5rem]">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <input
                                        placeholder={t('settings.newThemeName')}
                                        value={newThemeName}
                                        onChange={(e) => setNewThemeName(e.target.value)}
                                        className="flex-grow bg-white px-6 py-4 rounded-2xl border border-[#e9e6da] font-bold text-[#4a4439] focus:outline-none focus:ring-2 focus:ring-[#d97706]/20 placeholder:text-[#b4afa1]"
                                    />
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center bg-white px-4 py-4 rounded-2xl border border-[#e9e6da]">
                                            <input
                                                type="number"
                                                min={1}
                                                value={newThemeDuration}
                                                onChange={(e) => setNewThemeDuration(parseInt(e.target.value))}
                                                className="w-12 bg-transparent text-center font-bold text-[#d97706] focus:outline-none"
                                            />
                                            <span className="text-xs font-bold text-[#8d8876] ml-1">{t('timer.minutes')}</span>
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleAddTheme}
                                            className="px-6 py-4 bg-[#d97706] text-white rounded-2xl shadow-lg shadow-[#d97706]/20 font-bold"
                                        >
                                            <Plus size={20} strokeWidth={3} />
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* Saved Toast Notification */}
            <AnimatePresence>
                {showSavedToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-[#4a4439] text-white rounded-3xl shadow-2xl flex items-center gap-3 font-bold"
                    >
                        <div className="bg-green-500 rounded-full p-1">
                            <Check size={16} strokeWidth={4} />
                        </div>
                        {t('common.savedSuccess')}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SettingsPage;
