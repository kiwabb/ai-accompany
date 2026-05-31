import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft, User, Trophy, BarChart3, Settings as SettingsIcon,
    LogOut, Clock, Flame, Calendar, Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTimerContext } from '../contexts/TimerContext';
import { getStatsRange, getAchievements } from '../api/client';
import type { StatsRangeResponse, UserAchievementBackend } from '../api/client';
import AmbientBackground from '../components/AmbientBackground';
import { getUserProfile } from '../lib/storage/userProfile';

const ProfilePage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated, logout } = useAuth();
    const username = getUserProfile().name ?? '学子';
    const { todayStats } = useTimerContext();
    const [rangeStats, setRangeStats] = useState<StatsRangeResponse | null>(null);
    const [achievements, setAchievements] = useState<UserAchievementBackend[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Always authenticated in guest mode, no redirect needed
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const end = new Date();
                const start = new Date('2020-01-01');
                const [stats, ach] = await Promise.all([
                    getStatsRange(start, end),
                    getAchievements(),
                ]);
                setRangeStats(stats);
                setAchievements(ach);
            } catch (e) {
                console.error('Failed to load profile data', e);
            } finally {
                setLoading(false);
            }
        };
        if (isAuthenticated) fetchData();
    }, [isAuthenticated]);

    const summary = useMemo(() => {
        const totalMinutes = rangeStats?.total_focus_minutes ?? 0;
        const totalSessions = rangeStats?.total_sessions ?? 0;
        const unlocked = achievements.filter(a => a.status === 'unlocked').length;
        const totalAch = achievements.length;
        const activeDays = rangeStats?.daily_stats?.filter(d => d.total_focus_minutes > 0).length ?? 0;
        const topTheme = Object.entries(rangeStats?.sessions_by_theme ?? {})
            .sort((a, b) => b[1] - a[1])[0];
        return { totalMinutes, totalSessions, unlocked, totalAch, activeDays, topTheme };
    }, [rangeStats, achievements]);

    const initial = (username || '?').charAt(0).toUpperCase();

    return (
        <div className="min-h-screen w-full bg-[#FCFAF7] relative overflow-hidden">
            <AmbientBackground />

            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/')}
                className="fixed top-8 left-8 py-3 px-6 bg-white/70 backdrop-blur-2xl border border-white/80 shadow-xl rounded-2xl flex items-center gap-2 group z-50 text-cozy-text-light hover:text-cozy-text transition-colors font-bold uppercase tracking-widest text-[10px]"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span>{t('common.back', 'Back')}</span>
            </motion.button>

            <main className="relative z-10 w-full max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-12 pb-32">
                {/* Profile header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/70 backdrop-blur-2xl rounded-[40px] border border-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] p-8 md:p-12 mb-10 flex flex-col md:flex-row items-center md:items-start gap-8"
                >
                    <div className="relative shrink-0">
                        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-cozy-warmOrange via-orange-300 to-pink-300 flex items-center justify-center text-5xl font-black text-white shadow-xl shadow-orange-200/50">
                            {initial}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-emerald-400 border-4 border-white flex items-center justify-center">
                            <Sparkles size={16} className="text-white" />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">
                            {t('profile.welcomeBack', '欢迎回来')}
                        </p>
                        <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 font-heading mb-4 break-all">
                            {username || t('profile.guest', '访客')}
                        </h1>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            <button
                                onClick={() => navigate('/settings')}
                                className="px-4 py-2 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <SettingsIcon size={14} />
                                {t('common.settings', '设置')}
                            </button>
                            <button
                                onClick={() => {
                                    logout();
                                    navigate('/');
                                }}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <LogOut size={14} />
                                {t('profile.logout', '退出登录')}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Stat tiles */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        {
                            label: t('profile.todayFocus', '今日专注'),
                            value: `${todayStats?.total_focus_minutes ?? 0}`,
                            unit: t('timer.minutes', '分钟'),
                            icon: <Clock size={20} />,
                            color: 'text-indigo-500 bg-indigo-50 border-indigo-100',
                        },
                        {
                            label: t('profile.totalMinutes', '累计专注'),
                            value: `${summary.totalMinutes}`,
                            unit: t('timer.minutes', '分钟'),
                            icon: <Flame size={20} />,
                            color: 'text-rose-500 bg-rose-50 border-rose-100',
                        },
                        {
                            label: t('profile.activeDays', '坚持天数'),
                            value: `${summary.activeDays}`,
                            unit: t('profile.days', '天'),
                            icon: <Calendar size={20} />,
                            color: 'text-emerald-500 bg-emerald-50 border-emerald-100',
                        },
                        {
                            label: t('profile.achievements', '成就'),
                            value: `${summary.unlocked}`,
                            unit: `/ ${summary.totalAch}`,
                            icon: <Trophy size={20} />,
                            color: 'text-amber-500 bg-amber-50 border-amber-100',
                        },
                    ].map((card, i) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                            className="p-5 bg-white/70 backdrop-blur-xl rounded-3xl border border-white shadow-sm"
                        >
                            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center mb-3 ${card.color}`}>
                                {card.icon}
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                {card.label}
                            </p>
                            <p className="text-2xl md:text-4xl font-black text-slate-900 tabular-nums">
                                {loading ? '—' : card.value}
                                <span className="text-xs text-slate-400 font-bold ml-1">{card.unit}</span>
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Top theme */}
                {summary.topTheme && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-white to-cozy-cream rounded-3xl border border-white shadow-sm p-6 mb-10"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                {t('profile.topTheme', '最专注的主题')}
                            </p>
                            <Flame size={16} className="text-cozy-warmOrange" />
                        </div>
                        <p className="text-2xl md:text-4xl font-bold text-slate-900 font-heading">
                            {summary.topTheme[0]}
                        </p>
                        <p className="text-sm font-bold text-slate-400 mt-1 tabular-nums">
                            {summary.topTheme[1]} {t('timer.minutes', '分钟')}
                        </p>
                    </motion.div>
                )}

                {/* Quick navigation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        {
                            label: t('common.stats', '专注分析'),
                            description: t('profile.statsDescription', '查看你的专注趋势与主题分布'),
                            icon: <BarChart3 size={22} />,
                            to: '/stats',
                            color: 'from-emerald-400 to-teal-400 shadow-emerald-200/50',
                        },
                        {
                            label: t('common.achievements', '成就墙'),
                            description: t('profile.achievementsDescription', '查看已解锁与正在解锁的成就'),
                            icon: <Trophy size={22} />,
                            to: '/achievements',
                            color: 'from-amber-400 to-orange-400 shadow-amber-200/50',
                        },
                        {
                            label: t('common.settings', '设置'),
                            description: t('profile.settingsDescription', '管理 AI、主题、计时与账号偏好'),
                            icon: <User size={22} />,
                            to: '/settings',
                            color: 'from-indigo-400 to-purple-400 shadow-indigo-200/50',
                        },
                    ].map((item, i) => (
                        <motion.button
                            key={item.to}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.05 }}
                            whileHover={{ y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(item.to)}
                            className="group p-6 bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-sm hover:shadow-lg transition-all text-left"
                        >
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-3 shadow-lg`}>
                                {item.icon}
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mb-1 font-heading group-hover:text-slate-700 transition-colors">
                                {item.label}
                            </h3>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                {item.description}
                            </p>
                        </motion.button>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
