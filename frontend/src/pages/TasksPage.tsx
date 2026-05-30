import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, CheckSquare, Plus, Trash2, Square, CheckCircle2 } from 'lucide-react';
import AmbientBackground from '../components/AmbientBackground';
import BottomNav from '../components/BottomNav';

interface TodoItem {
    id: string;
    text: string;
    done: boolean;
    createdAt: number;
}

// 与 TodoWidget 共用同一 localStorage key，确保番茄钟里和 Tasks 页面看到的是同一份数据。
const STORAGE_KEY = 'pomodoro_todo_items';

const loadFromStorage = (): TodoItem[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((t): t is TodoItem =>
            typeof t === 'object' && t !== null && typeof t.id === 'string' && typeof t.text === 'string'
        );
    } catch {
        return [];
    }
};

const TasksPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [todos, setTodos] = useState<TodoItem[]>(() => loadFromStorage());
    const [draft, setDraft] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }, [todos]);

    const addTodo = () => {
        const text = draft.trim();
        if (!text) return;
        setTodos(prev => [
            ...prev,
            { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text, done: false, createdAt: Date.now() },
        ]);
        setDraft('');
        inputRef.current?.focus();
    };

    const toggleDone = (id: string) => {
        setTodos(prev => prev.map(item => (item.id === id ? { ...item, done: !item.done } : item)));
    };

    const removeTodo = (id: string) => {
        setTodos(prev => prev.filter(item => item.id !== id));
    };

    const remaining = todos.filter(t => !t.done).length;

    return (
        <div className="min-h-screen bg-[#FCFAF7] relative overflow-hidden flex flex-col items-center">
            <AmbientBackground />

            <div className="sticky top-0 z-[100] w-full bg-white/60 backdrop-blur-2xl border-b border-white shadow-sm py-3 md:py-4 px-3 md:px-6">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
                    <motion.button
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold uppercase tracking-widest text-[10px]"
                    >
                        <ChevronLeft size={16} />
                        <span className="hidden md:inline">{t('common.back', '返回')}</span>
                    </motion.button>

                    <h1 className="text-base md:text-xl font-bold text-slate-900 uppercase tracking-widest font-heading flex items-center gap-2">
                        <CheckSquare size={18} className="text-indigo-500" />
                        {t('todo.title', '待办')}
                    </h1>

                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 tabular-nums">
                        {remaining}/{todos.length}
                    </span>
                </div>
            </div>

            <main className="w-full max-w-3xl px-3 md:px-8 py-4 md:py-8 pb-32 relative z-10">
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl md:rounded-[32px] p-4 md:p-6 border border-white shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <input
                            ref={inputRef}
                            type="text"
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addTodo();
                                }
                            }}
                            placeholder={t('todo.placeholder', '添加一个待办...')}
                            className="flex-1 bg-slate-50 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-500/30 transition-all"
                        />
                        <button
                            onClick={addTodo}
                            disabled={!draft.trim()}
                            className="p-3 rounded-xl bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-600 transition-colors active:scale-95"
                            aria-label={t('todo.add', '添加')}
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-1.5">
                        <AnimatePresence initial={false}>
                            {todos.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200"
                                >
                                    <CheckCircle2 className="w-6 h-6 text-slate-200 mb-2" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {t('todo.empty', '暂无待办')}
                                    </p>
                                </motion.div>
                            )}

                            {todos.map(item => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 8, height: 0, padding: 0, margin: 0 }}
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    <button
                                        onClick={() => toggleDone(item.id)}
                                        className={`shrink-0 transition-colors ${item.done ? 'text-emerald-500' : 'text-slate-300 hover:text-slate-500'}`}
                                        aria-label={t(item.done ? 'todo.uncheck' : 'todo.check', item.done ? '取消勾选' : '完成')}
                                    >
                                        {item.done ? <CheckCircle2 className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                    </button>
                                    <span
                                        className={`flex-1 text-sm font-medium break-words transition-all ${item.done ? 'line-through text-slate-300' : 'text-slate-700'
                                            }`}
                                    >
                                        {item.text}
                                    </span>
                                    <button
                                        onClick={() => removeTodo(item.id)}
                                        className="shrink-0 p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all active:scale-90"
                                        aria-label={t('todo.delete', '删除')}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default TasksPage;
