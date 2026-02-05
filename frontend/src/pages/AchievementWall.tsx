import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Lock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getAchievements } from '../api/client';
import type { UserAchievementBackend } from '../api/client';
import AmbientBackground from '../components/AmbientBackground';

const AchievementWall: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [achievements, setAchievements] = useState<UserAchievementBackend[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAchievements = async () => {
            try {
                const data = await getAchievements();
                setAchievements(data);
            } catch (error) {
                console.error("Failed to fetch achievements:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAchievements();
    }, []);

    return (
        <div className="min-h-screen bg-cozy-cream relative overflow-hidden flex flex-col items-center">
            <AmbientBackground />
            
            <div className="sticky top-0 z-[100] w-full bg-white/60 backdrop-blur-2xl border-b border-black/5 shadow-sm py-4 px-6 mb-12">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <motion.button
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-cozy-text-light hover:text-cozy-text transition-colors font-bold uppercase tracking-widest text-[10px]"
                    >
                        <ArrowLeft size={16} />
                        <span>{t('common.back')}</span>
                    </motion.button>

                    <h1 className="text-xl font-bold text-cozy-text uppercase tracking-widest font-heading">
                        {t('achievements.title', 'Achievement Wall')}
                    </h1>
                    
                    <div className="w-20" />
                </div>
            </div>

            <main className="w-full max-w-4xl px-8 pb-32 relative z-10">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-8 h-8 border-4 border-cozy-orange border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {achievements.map((ua, idx) => {
                            const isUnlocked = ua.status === 'unlocked';
                            const isHidden = ua.achievement?.is_hidden && !isUnlocked;
                            
                            return (
                                <motion.div
                                    key={ua.achievement_id || idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`
                                        relative group p-6 rounded-[2rem] border transition-all duration-500
                                        ${isUnlocked 
                                            ? 'bg-white/80 border-amber-200 shadow-lg shadow-amber-500/10' 
                                            : 'bg-white/40 border-black/5 shadow-sm grayscale opacity-70'}
                                    `}
                                >
                                    <div className="flex items-start gap-5">
                                        <div className={`
                                            w-16 h-16 rounded-2xl flex items-center justify-center shrink-0
                                            ${isUnlocked ? 'bg-amber-100 text-amber-500' : 'bg-slate-100 text-slate-400'}
                                        `}>
                                            {isUnlocked ? <Trophy size={32} /> : (isHidden ? <Lock size={32} /> : <Trophy size={32} />)}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-bold text-cozy-text truncate">
                                                    {isHidden ? '???' : t(`achievement_items.${ua.achievement?.key}.name`, { defaultValue: ua.achievement?.name })}
                                                </h3>
                                                {isUnlocked && <CheckCircle2 size={16} className="text-emerald-500" />}
                                            </div>
                                            
                                            <p className="text-sm text-cozy-text-light font-medium line-clamp-2 mb-4">
                                                {isHidden ? t('achievements.hiddenDescription') : t(`achievement_items.${ua.achievement?.key}.description`, { defaultValue: ua.achievement?.description })}
                                            </p>
                                            
                                            {!isUnlocked && ua.achievement && (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-cozy-text-light/40">
                                                        <span>{t('achievements.progress')}</span>
                                                        <span>{ua.current_progress} / {ua.achievement.target_value}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(100, (ua.current_progress / ua.achievement.target_value) * 100)}%` }}
                                                            className="h-full bg-amber-400"
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
                )}
            </main>
        </div>
    );
};

export default AchievementWall;
