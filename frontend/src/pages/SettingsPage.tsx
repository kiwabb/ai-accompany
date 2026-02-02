import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Trash2, Save, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useTimerContext } from '../contexts/TimerContext';
import { createUserTheme, deleteUserTheme, getProviderModels } from '../api/client';
import CustomSelect from '../components/ui/CustomSelect';
import type { FocusTheme, TimerSettings } from '../types/pomodoro';

import AmbientBackground from '../components/AmbientBackground';

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
        <div className="min-h-screen bg-[#FCFAF7] relative overflow-hidden flex flex-col items-center">
            <AmbientBackground />

            {/* Premium Sticky Header */}
            <div className="sticky top-0 z-[100] w-full bg-white/60 backdrop-blur-2xl border-b border-white shadow-sm py-4 px-6 mb-12">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <motion.button
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold uppercase tracking-widest text-[10px]"
                    >
                        <ArrowLeft size={16} />
                        <span>{t('common.back')}</span>
                    </motion.button>

                    <h1 className="text-xl font-bold text-slate-900 uppercase tracking-widest font-heading">
                        {t('common.settings')}
                    </h1>

                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        className="flex items-center gap-3 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl hover:shadow-slate-300/50 transition-all hover:bg-slate-800"
                    >
                        <Save size={14} />
                        <span>{t('common.save')}</span>
                    </motion.button>
                </div>
            </div>

            <main className="w-full max-w-4xl px-8 pb-32 relative z-10 space-y-16">
                {/* AI Configuration Section */}
                <section className="space-y-6">
                    <header className="flex items-center gap-4">
                        <div className="h-[2px] w-8 bg-indigo-500 rounded-full" />
                        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
                            {t('settings.aiProviderTitle')}
                        </h2>
                    </header>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 border border-white shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:shadow-xl transition-all duration-500">
                            <div className="w-full md:w-1/3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">{t('settings.provider')}</label>
                                <p className="text-sm text-slate-400 font-medium">使用的 AI 核心服务商</p>
                            </div>
                            <div className="w-full md:flex-1">
                                <CustomSelect
                                    value={settings.aiProvider || 'gemini'}
                                    onChange={(val) => handleSettingChange('aiProvider', val)}
                                    options={[
                                        { value: 'gemini', label: 'Google Gemini Pro 1.5' },
                                        { value: 'gpt', label: 'OpenAI (GPT-4o)' },
                                        { value: 'deepseek', label: 'DeepSeek V3' },
                                        { value: 'zhipu', label: '智谱 AI (GLM-4)' },
                                        { value: 'ollama', label: 'Ollama (Local Provider)' },
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 border border-white shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:shadow-xl transition-all duration-500">
                            <div className="w-full md:w-1/3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">{t('settings.model')}</label>
                                <p className="text-sm text-slate-400 font-medium">选择具体的 AI 模型版本</p>
                            </div>
                            <div className="w-full md:flex-1">
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

                        {/* Automatic Start Switch */}
                        <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 border border-white shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:shadow-xl transition-all duration-500">
                            <div className="w-full md:w-1/3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">{t('settings.autoStart')}</label>
                                <p className="text-sm text-slate-400 font-medium">专注或休息结束，无缝进入下一段旅程</p>
                            </div>
                            <div className="w-full md:flex-1 flex justify-end">
                                <button
                                    onClick={() => handleSettingChange('autoStartNext', !settings.autoStartNext)}
                                    className={`
                                        w-16 h-8 rounded-full transition-all duration-300 relative
                                        ${settings.autoStartNext ? 'bg-indigo-500' : 'bg-slate-200'}
                                    `}
                                >
                                    <div className={`
                                        absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300
                                        ${settings.autoStartNext ? 'left-9' : 'left-1'}
                                    `} />
                                </button>
                            </div>
                        </div>

                        {['gemini', 'gpt', 'deepseek', 'zhipu'].includes(settings.aiProvider || '') && (
                            <div className="bg-amber-500/10 backdrop-blur-xl rounded-[32px] p-8 border border-amber-500/20 shadow-inner group transition-all duration-500">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-500/20 rounded-[18px] flex items-center justify-center text-amber-600 border border-amber-500/30">
                                            <Save size={20} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block mb-1">
                                                {settings.aiProvider?.toUpperCase()} API KEY
                                            </label>
                                            <p className="text-sm text-amber-600/80 font-medium">密钥将加密存储在您的设备中</p>
                                        </div>
                                    </div>
                                    <input
                                        type="password"
                                        value={
                                            settings.aiProvider === 'gemini' ? settings.googleApiKey :
                                                settings.aiProvider === 'gpt' ? settings.openaiApiKey :
                                                    (settings as any)[`${settings.aiProvider}ApiKey`] || ''
                                        }
                                        onChange={(e) => {
                                            const key = settings.aiProvider === 'gemini' ? 'googleApiKey' :
                                                settings.aiProvider === 'gpt' ? 'openaiApiKey' :
                                                    `${settings.aiProvider}ApiKey` as keyof TimerSettings;
                                            handleSettingChange(key, e.target.value);
                                        }}
                                        placeholder={t('settings.enterKey')}
                                        className="w-full md:w-80 bg-white/80 px-6 py-4 rounded-2xl font-mono text-xs text-slate-700 border border-amber-200/50 focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* AI Persona Section */}
                <section className="space-y-6">
                    <header className="flex items-center gap-4">
                        <div className="h-[2px] w-8 bg-purple-500 rounded-full" />
                        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
                            {t('settings.aiPersonaTitle')}
                        </h2>
                    </header>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            'gentle_encourager',
                            'strict_coach',
                            'logical_analyst',
                            'humorous_buddy'
                        ].map((persona) => (
                            <button
                                key={persona}
                                onClick={() => handleSettingChange('aiPersona', persona)}
                                className={`
                                    p-8 rounded-[40px] border-2 text-left transition-all duration-500 relative overflow-hidden group
                                    ${settings.aiPersona === persona
                                        ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.02]'
                                        : 'bg-white/40 backdrop-blur-xl border-white text-slate-700 hover:border-slate-200 shadow-sm hover:shadow-xl'
                                    }`}
                            >
                                {settings.aiPersona === persona && (
                                    <div className="absolute top-8 right-8 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white scale-125 shadow-lg">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                )}
                                <div className="font-bold text-xl mb-3 uppercase tracking-tight font-heading">
                                    {t(`settings.personas.${persona}`)}
                                </div>
                                <div className={`text-sm leading-relaxed font-medium ${settings.aiPersona === persona ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {t('settings.aiPersonaDescription', { persona: t(`settings.personas.${persona}`) })}
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Duration Configuration */}
                <section className="space-y-6">
                    <header className="flex items-center gap-4">
                        <div className="h-[2px] w-8 bg-cozy-orange rounded-full" />
                        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
                            {t('settings.durations')}
                        </h2>
                    </header>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { key: 'shortBreakDuration', label: t('common.shortBreak'), color: 'bg-emerald-50 text-emerald-600' },
                            { key: 'longBreakDuration', label: t('common.longBreak'), color: 'bg-indigo-50 text-indigo-600' },
                            { key: 'longBreakInterval', label: t('settings.longBreakInterval'), color: 'bg-orange-50 text-orange-600' },
                        ].map(({ key, label, color }) => (
                            <div
                                key={key}
                                className="bg-white/60 backdrop-blur-xl rounded-[32px] p-8 border border-white shadow-sm group hover:shadow-xl transition-all duration-500 flex flex-col items-center text-center gap-4"
                            >
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="number"
                                        min={1}
                                        value={settings[key as keyof TimerSettings] as number}
                                        onChange={(e) => handleSettingChange(key as keyof TimerSettings, parseInt(e.target.value))}
                                        className={`w-24 text-4xl font-bold bg-transparent text-center focus:outline-none focus:scale-110 transition-transform ${color.split(' ')[1]}`}
                                    />
                                </div>
                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{t('timer.minutes')}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Language Configuration */}
                <section className="space-y-6">
                    <header className="flex items-center gap-4">
                        <div className="h-[2px] w-8 bg-blue-400 rounded-full" />
                        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
                            {t('settings.language')}
                        </h2>
                    </header>
                    <div className="flex bg-white/40 backdrop-blur-xl p-2 rounded-[32px] border border-white shadow-sm max-w-md">
                        {[
                            { code: 'en', label: 'English' },
                            { code: 'zh', label: '简体中文' }
                        ].map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => i18n.changeLanguage(lang.code)}
                                className={`
                                    flex-1 py-4 px-6 rounded-[24px] font-bold uppercase tracking-widest text-[10px] transition-all
                                    ${i18n.language === lang.code
                                        ? 'bg-slate-900 text-white shadow-xl'
                                        : 'text-slate-400 hover:text-slate-900 hover:bg-white'}
                                `}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Themes Configuration */}
                <section className="space-y-6">
                    <header className="flex items-center gap-4">
                        <div className="h-[2px] w-8 bg-rose-400 rounded-full" />
                        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
                            {t('settings.themes')}
                        </h2>
                    </header>

                    <div className="grid grid-cols-1 gap-4">
                        {themes.map((theme) => (
                            <div
                                key={theme.id}
                                className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 border border-white shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:shadow-xl transition-all duration-500"
                            >
                                <div className="flex-1 w-full">
                                    <input
                                        type="text"
                                        value={theme.name}
                                        onChange={(e) => handleThemeNameChange(theme.id, e.target.value)}
                                        disabled={theme.isDefault}
                                        placeholder="Theme name"
                                        className="w-full bg-transparent font-bold text-xl text-slate-800 focus:outline-none placeholder:text-slate-300 disabled:opacity-50"
                                    />
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">卡片标题</div>
                                </div>

                                <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                                    <input
                                        type="number"
                                        min={1}
                                        value={theme.focusDuration}
                                        onChange={(e) => handleThemeDurationChange(theme.id, parseInt(e.target.value))}
                                        className="w-16 bg-transparent text-center font-bold text-slate-700 focus:outline-none"
                                    />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l border-slate-200 pl-4">MINUTES</span>
                                </div>

                                {!theme.isDefault && (
                                    <button
                                        onClick={() => handleRemoveTheme(theme.id)}
                                        className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Add New Theme Card */}
                        <div className="bg-slate-900/5 border-2 border-dashed border-slate-200 rounded-[40px] p-8 mt-4">
                            <div className="flex flex-col md:flex-row gap-6 items-end">
                                <div className="flex-1 space-y-2 w-full">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">新主题名称</label>
                                    <input
                                        type="text"
                                        value={newThemeName}
                                        onChange={(e) => setNewThemeName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddTheme()}
                                        placeholder={t('settings.newThemeName')}
                                        className="w-full bg-white px-8 py-5 rounded-[24px] border border-slate-100 font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all"
                                    />
                                </div>
                                <div className="space-y-2 w-full md:w-32">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">时长</label>
                                    <div className="bg-white px-6 py-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-center">
                                        <input
                                            type="number"
                                            min={1}
                                            value={newThemeDuration}
                                            onChange={(e) => setNewThemeDuration(parseInt(e.target.value))}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTheme()}
                                            className="w-full bg-transparent text-center font-bold text-slate-700 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleAddTheme}
                                    className="w-full md:w-auto px-10 py-5 bg-slate-900 text-white rounded-[24px] font-bold uppercase tracking-widest text-[10px] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95"
                                >
                                    {t('common.add')}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Premium Toast Notification */}
            <AnimatePresence>
                {showSavedToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.9 }}
                        className="fixed bottom-12 z-[200] px-10 py-5 bg-white/80 backdrop-blur-2xl text-slate-900 rounded-[32px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border border-white flex items-center gap-4"
                    >
                        <div className="bg-emerald-500 w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                            <Check size={20} strokeWidth={3} />
                        </div>
                        <span className="font-bold uppercase tracking-widest text-xs font-heading">{t('common.savedSuccess')}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SettingsPage;
