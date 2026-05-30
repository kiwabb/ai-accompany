import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Plus, Trash2, X, Square, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TodoItem {
    id: string;
    text: string;
    done: boolean;
    createdAt: number;
}

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

interface TodoWidgetProps {
    isShinchanTheme?: boolean;
}

const TodoWidget: React.FC<TodoWidgetProps> = ({ isShinchanTheme = false }) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [todos, setTodos] = useState<TodoItem[]>(() => loadFromStorage());
    const [draft, setDraft] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }, [todos]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 80);
        }
    }, [open]);

    const addTodo = () => {
        const text = draft.trim();
        if (!text) return;
        setTodos(prev => [
            ...prev,
            { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text, done: false, createdAt: Date.now() },
        ]);
        setDraft('');
    };

    const toggleDone = (id: string) => {
        setTodos(prev => prev.map(item => (item.id === id ? { ...item, done: !item.done } : item)));
    };

    const removeTodo = (id: string) => {
        setTodos(prev => prev.filter(item => item.id !== id));
    };

    const remaining = todos.filter(t => !t.done).length;

    return (
        <div ref={containerRef} className="relative">
            <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setOpen(prev => !prev)}
                className={`py-2 px-3 md:py-3 md:px-5 bg-white/60 backdrop-blur-2xl shadow-xl rounded-2xl flex items-center gap-2 group transition-colors font-bold uppercase tracking-widest text-[10px] ${isShinchanTheme
                        ? 'border border-[#FF6B6B]/20 text-[#8D6E63] hover:text-[#5D4037] hover:bg-[#FF6B6B]/10'
                        : 'border border-white text-slate-400 hover:text-slate-900'
                    }`}
                aria-label={t('todo.title', '待办')}
                aria-expanded={open}
            >
                <CheckSquare size={16} className="group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline">{t('todo.title', '待办')}</span>
                {remaining > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] tabular-nums">
                        {remaining}
                    </span>
                )}
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-full right-0 mt-3 w-[320px] bg-white/90 backdrop-blur-2xl rounded-3xl border border-white shadow-[0_20px_50px_-10px_rgba(0,0,0,0.18)] p-4"
                    >
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 flex items-center gap-2">
                                <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                                {t('todo.title', '待办')}
                            </h3>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                aria-label={t('common.close', '关闭')}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
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
                                className="flex-1 bg-slate-50 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-500/30 transition-all"
                            />
                            <button
                                onClick={addTodo}
                                disabled={!draft.trim()}
                                className="p-2.5 rounded-xl bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-600 transition-colors active:scale-95"
                                aria-label={t('todo.add', '添加')}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="max-h-[280px] overflow-y-auto custom-scrollbar pr-1 space-y-1.5">
                            <AnimatePresence initial={false}>
                                {todos.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center justify-center py-8 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200"
                                    >
                                        <CheckCircle2 className="w-5 h-5 text-slate-200 mb-2" />
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
                                        className="group flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors"
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
                                            className="shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                            aria-label={t('todo.delete', '删除')}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {todos.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                <span>
                                    {remaining}/{todos.length} {t('todo.remaining', '未完成')}
                                </span>
                                {todos.some(t => t.done) && (
                                    <button
                                        onClick={() => setTodos(prev => prev.filter(t => !t.done))}
                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        {t('todo.clearCompleted', '清除已完成')}
                                    </button>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TodoWidget;
