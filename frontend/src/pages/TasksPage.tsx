import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ChevronLeft,
    CheckSquare,
    Plus,
    Trash2,
    Square,
    CheckCircle2,
    Calendar,
    Flame,
    Clock,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Pencil,
    Check,
    X,
    ArrowUpDown,
    Eraser,
} from 'lucide-react';
import AmbientBackground from '../components/AmbientBackground';

type Priority = 'high' | 'medium' | 'low';

interface TodoItem {
    id: string;
    text: string;
    done: boolean;
    createdAt: number;
    completedAt?: number;
    priority?: Priority;
    dueDate?: string; // YYYY-MM-DD
    notes?: string;
}

type FilterMode = 'all' | 'active' | 'completed';
type SortMode = 'manual' | 'priority' | 'due' | 'created';

// 与 TodoWidget 共用同一 localStorage key
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

const todayDateStr = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const startOfTodayMs = (): number => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
};

const isOverdue = (item: TodoItem): boolean => {
    if (item.done || !item.dueDate) return false;
    return item.dueDate < todayDateStr();
};

const PRIORITY_STYLE: Record<Priority, { dot: string; bg: string; label: string }> = {
    high: { dot: 'bg-rose-500', bg: 'bg-rose-50 text-rose-600', label: '高' },
    medium: { dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-600', label: '中' },
    low: { dot: 'bg-sky-500', bg: 'bg-sky-50 text-sky-600', label: '低' },
};

const TasksPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [todos, setTodos] = useState<TodoItem[]>(() => loadFromStorage());
    const [draft, setDraft] = useState('');
    const [draftPriority, setDraftPriority] = useState<Priority | undefined>(undefined);
    const [draftDueDate, setDraftDueDate] = useState<string>(todayDateStr());
    const [filter, setFilter] = useState<FilterMode>('all');
    const [sortBy, setSortBy] = useState<SortMode>('manual');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }, [todos]);

    // ----------------- 操作 -----------------

    const addTodo = () => {
        const text = draft.trim();
        if (!text) return;
        setTodos(prev => [
            ...prev,
            {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                text,
                done: false,
                createdAt: Date.now(),
                priority: draftPriority,
                dueDate: draftDueDate || undefined,
            },
        ]);
        setDraft('');
        // 重置 quick-pick，避免下一条任务意外继承
        setDraftPriority(undefined);
        setDraftDueDate(todayDateStr());
        inputRef.current?.focus();
    };

    const updateTodo = (id: string, patch: Partial<TodoItem>) => {
        setTodos(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)));
    };

    const toggleDone = (id: string) => {
        setTodos(prev =>
            prev.map(item =>
                item.id === id
                    ? {
                        ...item,
                        done: !item.done,
                        completedAt: !item.done ? Date.now() : undefined,
                    }
                    : item,
            ),
        );
    };

    const removeTodo = (id: string) => {
        if (expandedId === id) setExpandedId(null);
        if (editingId === id) setEditingId(null);
        setTodos(prev => prev.filter(item => item.id !== id));
    };

    const clearCompleted = () => {
        setTodos(prev => prev.filter(item => !item.done));
    };

    const startEdit = (item: TodoItem) => {
        setEditingId(item.id);
        setEditText(item.text);
    };

    const commitEdit = () => {
        if (!editingId) return;
        const trimmed = editText.trim();
        if (trimmed) {
            updateTodo(editingId, { text: trimmed });
        }
        setEditingId(null);
        setEditText('');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditText('');
    };

    // ----------------- 统计 -----------------

    const stats = useMemo(() => {
        const todayMs = startOfTodayMs();
        const today = todayDateStr();
        return {
            todayDone: todos.filter(t => t.done && t.completedAt && t.completedAt >= todayMs).length,
            pending: todos.filter(t => !t.done).length,
            overdue: todos.filter(t => !t.done && t.dueDate && t.dueDate < today).length,
        };
    }, [todos]);

    // ----------------- 筛选 + 排序 -----------------

    const visibleTodos = useMemo(() => {
        let list = todos;
        if (filter === 'active') list = list.filter(item => !item.done);
        else if (filter === 'completed') list = list.filter(item => item.done);

        if (sortBy === 'priority') {
            const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
            list = [...list].sort((a, b) => {
                const ra = order[a.priority || ''] ?? 3;
                const rb = order[b.priority || ''] ?? 3;
                return ra - rb;
            });
        } else if (sortBy === 'due') {
            list = [...list].sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return a.dueDate.localeCompare(b.dueDate);
            });
        } else if (sortBy === 'created') {
            list = [...list].sort((a, b) => b.createdAt - a.createdAt);
        }
        // manual: 保持插入顺序
        return list;
    }, [todos, filter, sortBy]);

    const hasCompleted = todos.some(item => item.done);

    
    const renderTodoItems = (items: TodoItem[], emptyText: string) => (
        <AnimatePresence initial={false}>
            {items.length === 0 && (
                <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200"
                >
                    <CheckCircle2 className="w-6 h-6 text-slate-200 mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {emptyText}
                    </p>
                </motion.div>
            )}
            {items.map(item => {
                                const expanded = expandedId === item.id;
                                const editing = editingId === item.id;
                                const overdue = isOverdue(item);
                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 8, height: 0, padding: 0, margin: 0 }}
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                        className={`group rounded-xl transition-colors ${expanded ? 'bg-slate-50/80' : 'hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-center gap-3 px-3 py-2.5">
                                            <button
                                                onClick={() => toggleDone(item.id)}
                                                className={`shrink-0 transition-colors ${item.done ? 'text-emerald-500' : 'text-slate-300 hover:text-slate-500'}`}
                                                aria-label={t(item.done ? 'todo.uncheck' : 'todo.check', item.done ? '取消勾选' : '完成')}
                                            >
                                                {item.done ? <CheckCircle2 className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                            </button>

                                            {item.priority && (
                                                <span
                                                    className={`shrink-0 w-2 h-2 rounded-full ${PRIORITY_STYLE[item.priority].dot}`}
                                                    title={PRIORITY_STYLE[item.priority].label}
                                                />
                                            )}

                                            {editing ? (
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={editText}
                                                    onChange={e => setEditText(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') commitEdit();
                                                        else if (e.key === 'Escape') cancelEdit();
                                                    }}
                                                    onBlur={commitEdit}
                                                    className="flex-1 bg-white px-2 py-1 rounded-md text-base md:text-lg font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-indigo-200"
                                                />
                                            ) : (
                                                <button
                                                    onClick={() => setExpandedId(expanded ? null : item.id)}
                                                    className={`flex-1 text-left text-base md:text-lg font-bold break-words transition-all ${item.done ? 'line-through text-slate-300' : 'text-slate-700'}`}
                                                >
                                                    {item.text}
                                                </button>
                                            )}

                                            {item.dueDate && !editing && (
                                                <span
                                                    className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest ${overdue ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}
                                                >
                                                    <Calendar size={10} />
                                                    {item.dueDate.slice(5)}
                                                </span>
                                            )}

                                            {!editing && (
                                                <button
                                                    onClick={() => setExpandedId(expanded ? null : item.id)}
                                                    className="shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-slate-700 hover:bg-white transition-colors"
                                                    aria-label={expanded ? t('common.collapse', '收起') : t('common.expand', '展开')}
                                                >
                                                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </button>
                                            )}

                                            {!editing && (
                                                <button
                                                    onClick={() => removeTodo(item.id)}
                                                    className="shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all active:scale-90"
                                                    aria-label={t('todo.delete', '删除')}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* 展开面板 */}
                                        <AnimatePresence initial={false}>
                                            {expanded && (
                                                <motion.div
                                                    key="panel"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-3 pb-3 pt-1 space-y-3 border-t border-slate-200/60">
                                                        {/* 内联编辑入口 */}
                                                        <div className="flex items-center gap-2 pt-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 w-16 shrink-0">
                                                                {t('todo.title', '待办')}
                                                            </span>
                                                            {editing ? (
                                                                <div className="flex items-center gap-1 flex-1">
                                                                    <input
                                                                        autoFocus
                                                                        value={editText}
                                                                        onChange={e => setEditText(e.target.value)}
                                                                        onKeyDown={e => {
                                                                            if (e.key === 'Enter') commitEdit();
                                                                            else if (e.key === 'Escape') cancelEdit();
                                                                        }}
                                                                        className="flex-1 bg-white px-2 py-1 rounded-md text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-indigo-200"
                                                                    />
                                                                    <button
                                                                        onClick={commitEdit}
                                                                        className="p-1 rounded-md text-emerald-500 hover:bg-emerald-50"
                                                                        aria-label={t('common.save', '保存')}
                                                                    >
                                                                        <Check size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={cancelEdit}
                                                                        className="p-1 rounded-md text-slate-400 hover:bg-slate-100"
                                                                        aria-label={t('common.cancel', '取消')}
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => startEdit(item)}
                                                                    className="flex-1 flex items-center justify-between text-xs text-slate-700 hover:text-slate-900 group/edit"
                                                                >
                                                                    <span className="truncate">{item.text}</span>
                                                                    <Pencil size={12} className="text-slate-300 group-hover/edit:text-slate-600 ml-2 shrink-0" />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* 优先级 */}
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 w-16 shrink-0">
                                                                {t('todo.priority', '优先级')}
                                                            </span>
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                {(['high', 'medium', 'low'] as Priority[]).map(p => (
                                                                    <button
                                                                        key={p}
                                                                        onClick={() => updateTodo(item.id, { priority: item.priority === p ? undefined : p })}
                                                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${item.priority === p
                                                                            ? PRIORITY_STYLE[p].bg
                                                                            : 'bg-white text-slate-400 hover:text-slate-700 border border-slate-200'}`}
                                                                    >
                                                                        <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_STYLE[p].dot}`} />
                                                                        {PRIORITY_STYLE[p].label}
                                                                    </button>
                                                                ))}
                                                                {item.priority && (
                                                                    <button
                                                                        onClick={() => updateTodo(item.id, { priority: undefined })}
                                                                        className="px-1.5 py-1 rounded-md text-[10px] text-slate-300 hover:text-rose-500"
                                                                        aria-label={t('common.clear', '清除')}
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* 截止日期 */}
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 w-16 shrink-0">
                                                                {t('todo.dueDate', '截止日')}
                                                            </span>
                                                            <input
                                                                type="date"
                                                                value={item.dueDate || ''}
                                                                onChange={e => updateTodo(item.id, { dueDate: e.target.value || undefined })}
                                                                className="text-xs px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                            />
                                                            {item.dueDate && (
                                                                <button
                                                                    onClick={() => updateTodo(item.id, { dueDate: undefined })}
                                                                    className="p-1 rounded-md text-slate-300 hover:text-rose-500"
                                                                    aria-label={t('common.clear', '清除')}
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* 备注 */}
                                                        <div className="flex items-start gap-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 w-16 shrink-0 pt-2">
                                                                {t('todo.notes', '备注')}
                                                            </span>
                                                            <textarea
                                                                value={item.notes || ''}
                                                                onChange={e => updateTodo(item.id, { notes: e.target.value || undefined })}
                                                                placeholder={t('todo.notesPlaceholder', '添加备注...')}
                                                                rows={2}
                                                                className="flex-1 text-xs px-2 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
        </AnimatePresence>
    );

    return (
        <div className="min-h-screen bg-[#FCFAF7] relative overflow-hidden flex flex-col items-center">
            <AmbientBackground />

            {/* 移动端：紧凑顶栏 */}
            <div className="md:hidden sticky top-0 z-[100] w-full bg-white/60 backdrop-blur-2xl border-b border-white shadow-sm py-3 px-3">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
                    <motion.button
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold uppercase tracking-widest text-[10px]"
                    >
                        <ChevronLeft size={16} />
                    </motion.button>

                    <h1 className="text-base font-extrabold text-slate-900 uppercase tracking-wider font-heading flex items-center gap-2">
                        <CheckSquare size={18} className="text-indigo-500" />
                        {t('todo.title', '待办')}
                    </h1>

                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 tabular-nums">
                        {stats.pending}/{todos.length}
                    </span>
                </div>
            </div>

            {/* 桌面端：浮动卡片式返回按钮（对齐专注分析） */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/')}
                className="hidden md:flex fixed top-8 left-8 py-3 px-6 bg-white/70 backdrop-blur-2xl border border-white/80 shadow-xl rounded-2xl items-center gap-2 group z-50 text-slate-400 hover:text-slate-900 transition-colors font-bold uppercase tracking-widest text-[10px]"
            >
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span>{t('common.back', '返回')}</span>
            </motion.button>

            <main className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-12 pb-32 relative z-10 space-y-4">
                {/* 桌面端：大号页面标题 */}
                <h1 className="hidden md:flex text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight items-center gap-4 font-heading mb-6">
                    <CheckSquare className="text-indigo-500" size={32} />
                    {t('todo.title', '待办')}
                </h1>

                {/* 顶部统计 */}
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                    <StatCard
                        icon={<Flame size={16} className="text-emerald-500" />}
                        value={stats.todayDone}
                        label={t('todo.todayDone', '今日完成')}
                        accent="emerald"
                    />
                    <StatCard
                        icon={<Clock size={16} className="text-indigo-500" />}
                        value={stats.pending}
                        label={t('todo.pending', '待办')}
                        accent="indigo"
                    />
                    <StatCard
                        icon={<AlertTriangle size={16} className="text-rose-500" />}
                        value={stats.overdue}
                        label={t('todo.overdue', '超期')}
                        accent="rose"
                    />
                </div>

                {/* 输入区：文本 + 内联优先级 + 截止日 */}
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl md:rounded-[28px] p-3 md:p-4 border border-white shadow-sm space-y-2">
                    <div className="flex items-center gap-2">
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
                            className="flex-1 bg-slate-50 px-4 py-3 rounded-xl text-base md:text-lg font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-500/30 transition-all"
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

                    {/* 快捷选项：优先级 + 截止日，建立时一步设好 */}
                    <div className="flex items-center gap-2 flex-wrap text-[10px]">
                        <div className="flex items-center gap-1">
                            {(['high', 'medium', 'low'] as Priority[]).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setDraftPriority(draftPriority === p ? undefined : p)}
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-bold uppercase tracking-widest transition-all ${draftPriority === p
                                        ? PRIORITY_STYLE[p].bg
                                        : 'bg-white text-slate-400 hover:text-slate-700 border border-slate-200'}`}
                                    title={t('todo.priority', '优先级')}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_STYLE[p].dot}`} />
                                    {PRIORITY_STYLE[p].label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-1">
                            <label className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer">
                                <Calendar size={12} />
                                <input
                                    type="date"
                                    value={draftDueDate}
                                    onChange={e => setDraftDueDate(e.target.value)}
                                    className="bg-transparent text-[10px] font-bold uppercase tracking-widest focus:outline-none cursor-pointer w-[88px]"
                                />
                            </label>
                            {draftDueDate && (
                                <button
                                    onClick={() => setDraftDueDate('')}
                                    className="p-1 rounded-md text-slate-300 hover:text-rose-500"
                                    aria-label={t('common.clear', '清除')}
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 筛选 + 排序 + 清空 */}
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl md:rounded-[28px] p-2 md:p-3 border border-white shadow-sm flex items-center gap-2 flex-wrap">
                    <div className="flex bg-slate-100/70 rounded-lg p-0.5 text-[10px] font-bold uppercase tracking-widest">
                        {([
                            { id: 'all', label: t('todo.filterAll', '全部') },
                            { id: 'active', label: t('todo.filterActive', '进行中') },
                            { id: 'completed', label: t('todo.filterCompleted', '已完成') },
                        ] as { id: FilterMode; label: string }[]).map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                className={`px-2.5 py-1.5 rounded-md transition-colors ${filter === f.id
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-700'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                        <ArrowUpDown size={12} className="text-slate-300" />
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as SortMode)}
                            className="text-[10px] font-bold uppercase tracking-widest bg-transparent text-slate-500 hover:text-slate-900 focus:outline-none cursor-pointer"
                        >
                            <option value="manual">{t('todo.sortManual', '手动')}</option>
                            <option value="priority">{t('todo.sortPriority', '优先级')}</option>
                            <option value="due">{t('todo.sortDue', '截止日')}</option>
                            <option value="created">{t('todo.sortCreated', '创建时间')}</option>
                        </select>
                        {hasCompleted && (
                            <button
                                onClick={clearCompleted}
                                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title={t('todo.clearCompleted', '清除已完成')}
                            >
                                <Eraser size={12} />
                                <span>{t('todo.clear', '清除')}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 列表 */}
                <div className={`grid grid-cols-1 gap-4 md:gap-6 ${filter === 'all' ? 'md:grid-cols-2' : ''}`}>
                    {(filter === 'all' || filter === 'active') && (
                        <div className="bg-white/60 backdrop-blur-xl rounded-2xl md:rounded-[28px] p-2 md:p-3 border border-white shadow-sm">
                            {filter === 'all' && (
                                <h2 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 mt-1 px-2 flex items-center gap-1.5">
                                    <Clock size={14} className="text-indigo-400" />
                                    {t('todo.filterActive', '进行中')}
                                </h2>
                            )}
                            <div className="space-y-1">
                                {renderTodoItems(visibleTodos.filter(t => !t.done), t('todo.emptyActive', '没有进行中的待办'))}
                            </div>
                        </div>
                    )}

                    {(filter === 'all' || filter === 'completed') && (
                        <div className="bg-white/60 backdrop-blur-xl rounded-2xl md:rounded-[28px] p-2 md:p-3 border border-white shadow-sm">
                            {filter === 'all' && (
                                <h2 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 mt-1 px-2 flex items-center gap-1.5">
                                    <CheckCircle2 size={14} className="text-emerald-400" />
                                    {t('todo.filterCompleted', '已完成')}
                                </h2>
                            )}
                            <div className="space-y-1">
                                {renderTodoItems(visibleTodos.filter(t => t.done), t('todo.emptyCompleted', '还没有完成的待办'))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

// ===== 子组件 =====

interface StatCardProps {
    icon: React.ReactNode;
    value: number;
    label: string;
    accent: 'emerald' | 'indigo' | 'rose';
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, accent }) => {
    const accentMap = {
        emerald: 'text-emerald-500',
        indigo: 'text-indigo-500',
        rose: 'text-rose-500',
    } as const;
    return (
        <div className="bg-white/70 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-4 border border-white shadow-sm flex flex-col items-start gap-1">
            <div className="flex items-center gap-1.5">
                {icon}
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
            </div>
            <span className={`text-2xl md:text-4xl font-black tabular-nums ${accentMap[accent]}`}>{value}</span>
        </div>
    );
};

export default TasksPage;
