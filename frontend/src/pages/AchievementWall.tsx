import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Lock, CheckCircle2, Sparkles, Target, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getAchievements } from '../api/client';
import type { UserAchievementBackend } from '../api/client';
import AmbientBackground from '../components/AmbientBackground';
import { ACHIEVEMENT_TO_ICON } from '../constants/achievementIcons';

type Filter = 'all' | 'unlocked' | 'in_progress';

const AchievementWall: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [achievements, setAchievements] = useState<UserAchievementBackend[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>('all');

    useEffect(() => {
        const fetchAchievements = async () => {
            try {
                const data = await getAchievements();
                setAchievements(data);
            } catch (error) {
                console.error('Failed to fetch achievements:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAchievements();
    }, []);

    const stats = useMemo(() => {
        const total = achievements.length;
        const unlocked = achievements.filter(a => a.status === 'unlocked').length;
        const percent = total > 0 ? Math.round((unlocked / total) * 100) : 0;
        const nextToUnlock = achievements
            .filter(a => a.status !== 'unlocked' && a.achievement && !a.achievement.is_hidden)
            .map(a => ({
                a,
                ratio: a.achievement ? a.current_progress / a.achievement.target_value : 0,
            }))
            .sort((x, y) => y.ratio - x.ratio)
            .slice(0, 1)[0]?.a;
        return { total, unlocked, percent, nextToUnlock };
    }, [achievements]);

    const grouped = useMemo(() => {
        const filtered = achievements.filter(a => {
            if (filter === 'unlocked') return a.status === 'unlocked';
            if (filter === 'in_progress') return a.status !== 'unlocked';
            return true;
        });
        const map = new Map<string, UserAchievementBackend[]>();
        filtered.forEach(a => {
            const key = a.achievement?.category || 'general';
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(a);
        });
        return Array.from(map.entries());
    }, [achievements, filter]);

    return (
        <div className="min-h-screen bg-cozy-cream relative overflow-hidden flex flex-col items-center">
            <AmbientBackground />

            {/* 移动端：紧凑顶栏 */}
            <div className="md:hidden sticky top-0 z-[100] w-full bg-white/60 backdrop-blur-2xl border-b border-white/10 shadow-sm py-3 px-3 mb-6">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <motion.button
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-cozy-text-light hover:text-cozy-text transition-colors font-bold uppercase tracking-widest text-[10px]"
                    >
                        <ArrowLeft size={16} />
                    </motion.button>

                    <h1 className="text-base font-extrabold text-cozy-text uppercase tracking-wider font-heading flex items-center gap-2">
                        <Trophy size={18} className="text-amber-500" />
                        {t('achievements.title', 'Achievement Wall')}
                    </h1>

                    <div className="w-6" />
                </div>
            </div>

            {/* 桌面端：浮动卡片式返回按钮（对齐专注分析） */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/')}
                className="hidden md:flex fixed top-8 left-8 py-3 px-6 bg-white/70 backdrop-blur-2xl border border-white/80 shadow-xl rounded-2xl items-center gap-2 group z-50 text-cozy-text-light hover:text-cozy-text transition-colors font-bold uppercase tracking-widest text-[10px]"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span>{t('common.back')}</span>
            </motion.button>

            <main className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-12 pb-32 relative z-10">
                {/* 桌面端：大号页面标题 */}
                <h1 className="hidden md:flex text-2xl md:text-4xl font-extrabold text-cozy-text tracking-tight items-center gap-4 font-heading mb-6">
                    <Trophy className="text-amber-500" size={32} />
                    {t('achievements.title', 'Achievement Wall')}
                </h1>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-8 h-8 border-4 border-cozy-orange border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Summary header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8"
                        >
                            <div className="relative ach-summary-card p-3 md:p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 shadow-sm overflow-hidden">
                                <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-200/40 rounded-full blur-2xl" />
                                <div className="flex items-start justify-between relative gap-1">
                                    <div className="min-w-0">
                                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-amber-500/70 mb-1 md:mb-2 truncate">
                                            {t('achievements.unlockedCount', '已解锁')}
                                        </p>
                                        <p className="text-2xl md:text-4xl font-black text-amber-500 tabular-nums">
                                            {stats.unlocked}
                                            <span className="text-xs md:text-base text-amber-300 ml-1">/ {stats.total}</span>
                                        </p>
                                    </div>
                                    <Trophy size={18} className="md:hidden text-amber-400 shrink-0" />
                                    <Trophy size={24} className="hidden md:block text-amber-400 shrink-0" />
                                </div>
                                <div className="mt-2 md:mt-4 h-1.5 md:h-2 w-full bg-amber-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats.percent}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                                    />
                                </div>
                            </div>

                            <div className="relative ach-summary-card p-3 md:p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 shadow-sm overflow-hidden">
                                <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-200/40 rounded-full blur-2xl" />
                                <div className="flex items-start justify-between relative gap-1">
                                    <div className="min-w-0">
                                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-emerald-500/70 mb-1 md:mb-2 truncate">
                                            {t('achievements.completion', '完成度')}
                                        </p>
                                        <p className="text-2xl md:text-4xl font-black text-emerald-500 tabular-nums">
                                            {stats.percent}<span className="text-xs md:text-base ml-0.5">%</span>
                                        </p>
                                    </div>
                                    <Target size={18} className="md:hidden text-emerald-400 shrink-0" />
                                    <Target size={24} className="hidden md:block text-emerald-400 shrink-0" />
                                </div>
                                <p className="hidden md:block text-[10px] mt-4 font-bold uppercase tracking-widest text-emerald-500/50">
                                    {stats.percent < 30 ? t('achievements.justStarted', '刚刚起步') : stats.percent < 70 ? t('achievements.makingProgress', '稳步前进') : t('achievements.almostThere', '即将完成')}
                                </p>
                            </div>

                            <div className="relative ach-summary-card p-3 md:p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-sm overflow-hidden">
                                <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-200/40 rounded-full blur-2xl" />
                                <div className="flex items-start justify-between relative mb-1 md:mb-2 gap-1">
                                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-indigo-500/70 truncate">
                                        {t('achievements.nextUp', '即将解锁')}
                                    </p>
                                    <Flame size={18} className="md:hidden text-indigo-400 shrink-0" />
                                    <Flame size={24} className="hidden md:block text-indigo-400 shrink-0" />
                                </div>
                                {stats.nextToUnlock && stats.nextToUnlock.achievement ? (
                                    <div>
                                        <p className="text-xs md:text-sm font-bold text-indigo-900 mb-1 truncate">
                                            {t(`achievements.items.${stats.nextToUnlock.achievement.key}.name`, { defaultValue: stats.nextToUnlock.achievement.name })}
                                        </p>
                                        <p className="text-[10px] md:text-[11px] font-bold text-indigo-400 tabular-nums">
                                            {stats.nextToUnlock.current_progress} / {stats.nextToUnlock.achievement.target_value}
                                        </p>
                                        <div className="mt-1.5 md:mt-2 h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, (stats.nextToUnlock.current_progress / stats.nextToUnlock.achievement.target_value) * 100)}%` }}
                                                transition={{ duration: 1, ease: 'easeOut' }}
                                                className="h-full bg-indigo-400 rounded-full"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs md:text-sm font-bold text-indigo-300 italic">
                                        {t('achievements.allDone', '已全部解锁 ✨')}
                                    </p>
                                )}
                            </div>
                        </motion.div>

                        {/* Milestone header（移到 filter 上方） */}
                        <div className="flex items-center gap-3 mb-4 px-1">
                            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200" />
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                {t('achievements.categories.milestone', '里程碑')}
                            </h2>
                            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200" />
                        </div>

                        {/* Filter tabs */}
                        <div className="flex justify-center mt-4 mb-2">
                            <div className="bg-white/70 p-1 rounded-[10px] md:rounded-2xl flex items-center border border-white shadow-inner backdrop-blur">
                                {([
                                    { id: 'all', label: t('achievements.filterAll', '全部') },
                                    { id: 'unlocked', label: t('achievements.filterUnlocked', '已解锁') },
                                    { id: 'in_progress', label: t('achievements.filterInProgress', '进行中') },
                                ] as { id: Filter; label: string }[]).map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFilter(f.id)}
                                        className={`px-4 py-1.5 rounded-md md:rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === f.id
                                                ? 'bg-white text-cozy-orange shadow-md'
                                                : 'text-cozy-text-light hover:text-cozy-text'
                                            }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {grouped.length === 0 && (
                            <div className="text-center py-20 bg-white/40 rounded-xl md:rounded-2xl border border-dashed border-slate-200">
                                <Sparkles size={32} className="text-slate-200 mx-auto mb-3" />
                                <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
                                    {t('achievements.empty', '暂无符合条件的成就')}
                                </p>
                            </div>
                        )}

                        <AnimatePresence mode="popLayout">
                            {grouped.map(([category, items]) => (
                                <motion.section
                                    key={category}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mb-10"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {items.map((ua, idx) => {
                                            const isUnlocked = ua.status === 'unlocked';
                                            const isHidden = ua.achievement?.is_hidden && !isUnlocked;
                                            const percent = ua.achievement
                                                ? Math.min(100, (ua.current_progress / ua.achievement.target_value) * 100)
                                                : 0;

                                            return (
                                                <motion.div
                                                    key={ua.achievement_id || idx}
                                                    layout
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    whileHover={{ y: -2 }}
                                                    className={`
                                                        relative group p-4 md:p-6 rounded-[2rem] md:rounded-[2rem] border transition-all duration-500
                                                        ${isUnlocked
                                                            ? 'bg-white/80 border-amber-200 shadow-lg shadow-amber-500/10'
                                                            : 'bg-white/40 border-black/5 shadow-sm hover:shadow-md'
                                                        }
                                                    `}
                                                >
                                                    {isUnlocked && (
                                                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                                            <CheckCircle2 size={10} />
                                                            {t('achievements.unlockedTag', '已解锁')}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-4 md:gap-5">
                                                        <div
                                                            className={`
                                                                w-20 h-20 md:w-24 md:h-24 rounded-3xl flex items-center justify-center shrink-0 transition-all p-2 md:p-3 relative
                                                                ${isUnlocked
                                                                    ? 'bg-gradient-to-br from-amber-200/60 to-amber-100/60 shadow-md shadow-amber-200/50'
                                                                    : 'bg-slate-100'
                                                                }
                                                            `}
                                                        >
                                                            {(() => {
                                                                const iconDef = ua.achievement ? ACHIEVEMENT_TO_ICON[ua.achievement.key] : undefined;
                                                                if (isHidden || !iconDef) {
                                                                    return isHidden
                                                                        ? <Lock size={28} className="text-slate-400" />
                                                                        : <Trophy size={28} className={isUnlocked ? 'text-amber-500' : 'text-slate-400'} />;
                                                                }
                                                                return (
                                                                    <>
                                                                        <img
                                                                            src={iconDef.img}
                                                                            alt={iconDef.iconKey}
                                                                            className={`w-full h-full object-contain transition-all ${isUnlocked ? '' : 'grayscale opacity-40'}`}
                                                                        />
                                                                        {!isUnlocked && (
                                                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shadow-sm">
                                                                                <Lock size={10} className="text-slate-500" />
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <h3 className={`text-lg font-bold truncate mb-1 ${isUnlocked ? 'text-cozy-text' : 'text-cozy-text-light'}`}>
                                                                {isHidden
                                                                    ? '???'
                                                                    : t(`achievements.items.${ua.achievement?.key}.name`, { defaultValue: ua.achievement?.name })}
                                                            </h3>

                                                            <p className="text-sm text-cozy-text-light font-medium line-clamp-2 mb-3 md:mb-4">
                                                                {isHidden
                                                                    ? t('achievements.hiddenDescription')
                                                                    : t(`achievements.items.${ua.achievement?.key}.description`, { defaultValue: ua.achievement?.description })}
                                                            </p>

                                                            {!isUnlocked && ua.achievement && (
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-cozy-text-light/40">
                                                                        <span>{t('achievements.progress')}</span>
                                                                        <span className="tabular-nums">
                                                                            {ua.current_progress} / {ua.achievement.target_value}
                                                                        </span>
                                                                    </div>
                                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${percent}%` }}
                                                                            transition={{ duration: 1, ease: 'easeOut' }}
                                                                            className="h-full bg-gradient-to-r from-amber-300 to-amber-400"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {isUnlocked && ua.unlocked_at && (
                                                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                                                                    {t('achievements.unlockedOn', { date: new Date(ua.unlocked_at).toLocaleDateString() })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </motion.section>
                            ))}
                        </AnimatePresence>
                    </>
                )}
            </main>
        </div>
    );
};

export default AchievementWall;
