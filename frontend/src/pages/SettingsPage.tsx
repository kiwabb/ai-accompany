import React from 'react';
import { ArrowLeft, Save, Check, Palette, User, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import AmbientBackground from '../components/AmbientBackground';
import TimerSettingsSection from '../components/settings/TimerSettings';
import AISettings from '../components/settings/AISettings';
import ThemeManagement from '../components/settings/ThemeManagement';
import VisualThemeSelector from '../components/VisualThemeSelector';
import { useSettingsPageLogic } from '../hooks/useSettingsPageLogic';

const SettingsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { username } = useAuth();
    const {
        settings,
        themes,
        showSavedToast,
        handleSettingChange,
        handleSave,
        setThemes,
        handleThemesChange,
    } = useSettingsPageLogic();

    return (
        <div className="min-h-screen bg-[#FCFAF7] relative overflow-hidden flex flex-col items-center">
            <AmbientBackground />

            <div className="sticky top-0 z-[100] w-full bg-white/60 backdrop-blur-2xl border-b border-white shadow-sm py-3 md:py-4 px-3 md:px-6 mb-6 md:mb-12">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
                    <motion.button
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold uppercase tracking-widest text-[10px]"
                    >
                        <ArrowLeft size={16} />
                        <span className="hidden md:inline">{t('common.back')}</span>
                    </motion.button>

                    <h1 className="text-base md:text-xl font-extrabold text-slate-900 uppercase tracking-wider font-heading">
                        {t('common.settings')}
                    </h1>

                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        className="flex items-center gap-2 md:gap-3 px-3 md:px-8 py-2 md:py-3 bg-slate-900 text-white rounded-xl md:rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl hover:shadow-slate-300/50 transition-all hover:bg-slate-800"
                    >
                        <Save size={14} />
                        <span className="hidden sm:inline">{t('common.save')}</span>
                    </motion.button>
                </div>
            </div>

            <main className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-12 pb-32 relative z-10 space-y-8 md:space-y-16">
                <section>
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-6 px-1">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center shadow-lg">
                            <User size={18} className="text-white md:hidden" />
                            <User size={20} className="text-white hidden md:block" />
                        </div>
                        <h2 className="text-lg md:text-2xl font-bold text-slate-900 uppercase tracking-widest font-heading">
                            {t('settings.account', 'Account')}
                        </h2>
                    </div>
                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => navigate('/profile')}
                        className="w-full bg-white/60 backdrop-blur-xl rounded-2xl md:rounded-[32px] p-4 md:p-8 border border-white shadow-xl flex items-center justify-between text-left hover:bg-white/80 hover:shadow-2xl transition-all"
                    >
                        <div className="flex items-center gap-3 md:gap-4 min-w-0">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-cozy-text font-bold text-base md:text-lg shrink-0 bg-cozy-pastelBlue">
                                {username?.charAt(0).toUpperCase() || '你'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-slate-900 font-bold font-heading truncate">
                                    {username || '学子'}
                                </p>
                                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold truncate">
                                    {t('settings.viewProfile', '查看个人主页')}
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-300 shrink-0" />
                    </motion.button>
                </section>

                <section>
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-6 px-1">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center shadow-lg">
                            <Palette size={18} className="text-white md:hidden" />
                            <Palette size={20} className="text-white hidden md:block" />
                        </div>
                        <h2 className="text-lg md:text-2xl font-bold text-slate-900 uppercase tracking-widest font-heading">
                            {t('settings.visualTheme', 'Visual Theme')}
                        </h2>
                    </div>
                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl md:rounded-[32px] p-4 md:p-8 border border-white shadow-xl space-y-4 md:space-y-6">
                        <VisualThemeSelector />

                        <div className="pt-4 md:pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-2 md:gap-3 mb-3 px-1">
                                <div className="h-[2px] w-6 bg-blue-400 rounded-full" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                                    {t('settings.language', '语言')}
                                </span>
                            </div>
                            <div className="flex bg-white/40 backdrop-blur-xl p-1 md:p-2 rounded-xl md:rounded-2xl border border-white shadow-sm w-full md:max-w-md">
                                {[
                                    { code: 'en', label: 'English' },
                                    { code: 'zh', label: '简体中文' },
                                ].map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => i18n.changeLanguage(lang.code)}
                                        className={`flex-1 py-2.5 md:py-3 px-3 md:px-6 rounded-lg md:rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all
                                            ${i18n.language === lang.code
                                                ? 'bg-slate-900 text-white shadow-md'
                                                : 'text-slate-400 hover:text-slate-900 hover:bg-white'}`}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <TimerSettingsSection settings={settings} handleSettingChange={handleSettingChange} />
                <ThemeManagement
                    themes={themes}
                    setThemes={setThemes}
                    handleThemesChange={handleThemesChange}
                />
                <AISettings settings={settings} handleSettingChange={handleSettingChange} />
            </main>

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
