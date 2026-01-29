import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCountdowns, createCountdown, deleteCountdown } from '../api/client';
import type { CountdownEvent } from '../types/pomodoro';

const CountdownWidget: React.FC = () => {
    const { t } = useTranslation();
    const [countdowns, setCountdowns] = useState<CountdownEvent[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDate, setNewDate] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchCountdowns = useCallback(async () => {
        try {
            const data = await getCountdowns();
            setCountdowns(data);
        } catch (error) {
            console.error('Failed to fetch countdowns:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCountdowns();
    }, [fetchCountdowns]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle || !newDate) return;

        try {
            const created = await createCountdown(newTitle, new Date(newDate));
            setCountdowns(prev => [...prev, created].sort((a, b) =>
                new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
            ));
            setNewTitle('');
            setNewDate('');
            setIsAdding(false);
        } catch (error) {
            console.error('Failed to create countdown:', error);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteCountdown(id);
            setCountdowns(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error('Failed to delete countdown:', error);
        }
    };

    const calculateDays = (targetDate: string) => {
        const target = new Date(targetDate);
        target.setHours(0, 0, 0, 0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const diffTime = target.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (isLoading) return null;

    return (
        <div className="flex flex-col space-y-4 max-w-xs">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cozy-text-light/40 flex items-center">
                    <Calendar className="w-3 h-3 mr-2" />
                    {t('countdown.title')}
                </h3>
                <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsAdding(true)}
                    className="p-1.5 glass-surface rounded-full text-cozy-text-light/50 hover:text-cozy-orange transition-all duration-300"
                    aria-label={`Add ${t('countdown.title')}`}
                >
                    <Plus className="w-4 h-4" />
                </motion.button>
            </div>

            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {countdowns.map((c) => {
                        const days = calculateDays(c.targetDate);
                        return (
                            <motion.div
                                key={c.id}
                                layout
                                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -10, scale: 0.9 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="group relative flex items-center justify-between p-4 glass-surface rounded-2xl shadow-sm lift-hover cursor-default"
                            >
                                <div>
                                    <p className="text-xs font-bold text-cozy-text-light/60 line-clamp-1">{c.title}</p>
                                    <p className="text-lg font-black text-cozy-text">
                                        {days === 0 ? t('countdown.today') : days > 0 ? `${days} ${t('countdown.daysLeft')}` : `${Math.abs(days)} ${t('countdown.daysAgo')}`}
                                    </p>
                                </div>
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDelete(c.id)}
                                    className="opacity-0 group-hover:opacity-100 p-2 glass-surface hover:bg-red-50 text-red-400 rounded-xl transition-all"
                                    aria-label={`Delete ${c.title}`}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </motion.button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {countdowns.length === 0 && !isAdding && (
                    <p className="text-[10px] text-center text-cozy-text-light/30 italic py-4">
                        {t('countdown.noCountdowns')}
                    </p>
                )}

                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="p-4 bg-cozy-cream rounded-2xl border border-cozy-text/5 shadow-inner"
                        >
                            <form onSubmit={handleCreate} className="space-y-3">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder={t('countdown.eventName')}
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="w-full bg-white/60 p-2 rounded-xl text-xs font-bold text-cozy-text placeholder:text-cozy-text-light/30 focus:outline-none focus:ring-1 focus:ring-cozy-orange"
                                />
                                <input
                                    type="date"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    className="w-full bg-white/60 p-2 rounded-xl text-xs font-bold text-cozy-text focus:outline-none focus:ring-1 focus:ring-cozy-orange"
                                />
                                <div className="flex space-x-2">
                                    <button
                                        type="submit"
                                        className="flex-1 py-2 bg-cozy-orange text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-cozy-orange/20"
                                    >
                                        {t('countdown.save')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAdding(false)}
                                        className="p-2 bg-white/60 text-cozy-text-light rounded-xl"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CountdownWidget;
