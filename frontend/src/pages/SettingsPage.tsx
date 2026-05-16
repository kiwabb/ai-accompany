import React from 'react';
import { ArrowLeft, Save, Check, Palette, User, ChevronRight, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AmbientBackground from '../components/AmbientBackground';
import GeneralSettings from '../components/settings/GeneralSettings';
import TimerSettingsSection from '../components/settings/TimerSettings';
import AISettings from '../components/settings/AISettings';
import ThemeManagement from '../components/settings/ThemeManagement';
import VisualThemeSelector from '../components/VisualThemeSelector';
import { useSettingsPageLogic } from '../hooks/useSettingsPageLogic';

const SettingsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated, username } = useAuth();
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
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center shadow-lg">
                            <User size={20} className="text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 uppercase tracking-widest font-heading">
                            {t('settings.account', 'Account')}
                        </h2>
                    </div>
                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
                        className="w-full bg-white/60 backdrop-blur-xl rounded-[32px] p-8 border border-white shadow-xl flex items-center justify-between text-left hover:bg-white/80 hover:shadow-2xl transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-cozy-text font-bold text-lg ${isAuthenticated ? 'bg-cozy-pastelBlue' : 'bg-slate-100 text-slate-400'}`}>
                                {isAuthenticated ? username?.charAt(0).toUpperCase() : <LogIn size={20} />}
                            </div>
                            <div>
                                <p className="text-slate-900 font-bold font-heading">
                                    {isAuthenticated ? username : t('settings.notLoggedIn', '未登录')}
                                </p>
                                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                                    {isAuthenticated
                                        ? t('settings.viewProfile', '查看个人主页')
                                        : t('settings.tapToLogin', '点击登录')}
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-300" />
                    </motion.button>
                </section>

                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center shadow-lg">
                            <Palette size={20} className="text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 uppercase tracking-widest font-heading">
                            {t('settings.visualTheme', 'Visual Theme')}
                        </h2>
                    </div>
                    <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-8 border border-white shadow-xl">
                        <VisualThemeSelector />
                    </div>
                </section>

                <TimerSettingsSection settings={settings} handleSettingChange={handleSettingChange} />
                <GeneralSettings settings={settings} handleSettingChange={handleSettingChange} i18n={i18n} />
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
