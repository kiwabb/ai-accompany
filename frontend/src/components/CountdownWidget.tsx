import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCountdowns, createCountdown, deleteCountdown } from '../api/client';
import type { CountdownEvent } from '../types/pomodoro';

interface CountdownWidgetProps {
    variant?: 'full' | 'minimal';
    textColor?: string;
    /** 外层自己渲染标题与添加按钮时，隐藏组件内部的 header */
    hideHeader?: boolean;
    /** 受控的"添加表单"开关；不传则组件内部自管 */
    isAdding?: boolean;
    onIsAddingChange?: (value: boolean) => void;
}

const CountdownWidget: React.FC<CountdownWidgetProps> = ({ variant = 'full', textColor, hideHeader = false, isAdding: isAddingProp, onIsAddingChange }) => {
    const { t } = useTranslation();
    const [countdowns, setCountdowns] = useState<CountdownEvent[]>([]);
    const [internalIsAdding, setInternalIsAdding] = useState(false);
    const isAdding = isAddingProp !== undefined ? isAddingProp : internalIsAdding;
    const setIsAdding = (value: boolean) => {
        if (isAddingProp === undefined) setInternalIsAdding(value);
        onIsAddingChange?.(value);
    };
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

    if (variant === 'minimal') {
        return (
            <div className="flex flex-col space-y-1.5 w-full select-none">
                <AnimatePresence mode="popLayout">
                    {countdowns.slice(0, 3).map((c) => {
                        const days = calculateDays(c.targetDate);
                        const isToday = days === 0;
                        const isPast = days < 0;
                        return (
                            <motion.div
                                key={c.id}
                                layout
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center justify-between gap-2 text-[11px]"
                            >
                                <span className={`truncate flex-1 font-black uppercase tracking-wider ${textColor || 'text-slate-600'}`}>{c.title}</span>
                                <span className={`font-black tabular-nums transition-colors ${isToday ? 'text-orange-600' : isPast ? 'text-slate-400' : (textColor || 'text-slate-800')} text-[12px]`}>
                                    {Math.abs(days)}D
                                </span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-4 w-full select-none">
            {!hideHeader && (
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center">
                        <Calendar className="w-3 h-3 mr-2 text-indigo-500" />
                        {t('countdown.title')}
                    </h3>
                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: '#f8fafc' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsAdding(true)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-500 transition-colors border border-transparent hover:border-slate-100"
                        aria-label={`Add ${t('countdown.title')}`}
                    >
                        <Plus className="w-4 h-4" />
                    </motion.button>
                </div>
            )}

            <div className="space-y-2.5">
                <AnimatePresence mode="popLayout">
                    {countdowns.map((c) => {
                        const days = calculateDays(c.targetDate);
                        const isToday = days === 0;
                        const isPast = days < 0;

                        return (
                            <motion.div
                                key={c.id}
                                layout
                                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -10, scale: 0.9 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                className="group relative flex items-center gap-3 p-3.5 bg-gradient-to-br from-white to-slate-50/50 rounded-2xl border border-slate-100/80 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.06)] transition-all duration-300"
                            >
                                <p className="flex-1 min-w-0 text-xs font-bold text-slate-500 truncate uppercase tracking-wider">
                                    {c.title}
                                </p>
                                <div className="flex items-baseline gap-1 shrink-0">
                                    <span className={`text-3xl font-black tabular-nums leading-none transition-colors ${isToday ? 'text-orange-500' : isPast ? 'text-slate-300' : 'text-slate-800'}`}>
                                        {Math.abs(days)}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        {isToday ? t('countdown.today') : isPast ? t('countdown.daysAgo') : t('countdown.daysLeft')}
                                    </span>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1, backgroundColor: '#fef2f2', color: '#ef4444' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDelete(c.id)}
                                    className="shrink-0 p-2 rounded-xl text-slate-300 hover:text-red-500 transition-all border border-transparent hover:border-red-100"
                                    aria-label={`Delete ${c.title}`}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </motion.button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {countdowns.length === 0 && !isAdding && (
                    <div className="flex flex-col items-center justify-center py-8 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <Calendar className="w-5 h-5 text-slate-200 mb-2" />
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                            {t('countdown.noCountdowns')}
                        </p>
                    </div>
                )}

                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xl"
                        >
                            <form onSubmit={handleCreate} className="space-y-3">
                                <div className="space-y-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder={t('countdown.eventName')}
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        className="w-full bg-slate-50 p-2.5 rounded-xl text-xs font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-500/30 transition-all"
                                    />
                                    <input
                                        type="date"
                                        value={newDate}
                                        onChange={(e) => setNewDate(e.target.value)}
                                        className="w-full bg-slate-50 p-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-500/30 transition-all"
                                    />
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button
                                        type="submit"
                                        className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg shadow-indigo-500/20 active:scale-95 duration-200"
                                    >
                                        {t('countdown.save')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAdding(false)}
                                        className="p-2.5 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors active:scale-95 duration-200"
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
