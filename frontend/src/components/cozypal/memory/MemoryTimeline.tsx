import React from 'react';
import { motion } from 'framer-motion';
import { Edit3, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MemoryTimelineProps {
    memoryFragments: { id: number; content: string; created_at: string }[];
    onEdit: (fragment: { id: number; content: string }) => void;
    onDelete: (id: number) => void;
}

export const MemoryTimeline: React.FC<MemoryTimelineProps> = ({
    memoryFragments,
    onEdit,
    onDelete,
}) => {
    const { t } = useTranslation();

    return (
        <div className="glass-surface rounded-2xl p-4 shadow-sm">
            <h4 className="text-[11px] font-bold text-indigo-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                {t('cozyPal.memory.timeline')}
            </h4>
            <div className="space-y-3">
                {memoryFragments.length > 0 ? memoryFragments.map((f) => (
                    <motion.div
                        key={f.id}
                        whileHover={{ x: 4 }}
                        className="bg-white/60 p-3 rounded-xl border border-white text-xs text-indigo-900 group shadow-sm transition-all"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] bg-indigo-50 text-indigo-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                {new Date(f.created_at).toLocaleDateString()}
                            </span>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all gap-1">
                                <button 
                                    onClick={() => onEdit({ id: f.id, content: f.content })} 
                                    className="p-1.5 hover:bg-indigo-50 rounded-lg transition-colors text-indigo-400 hover:text-indigo-600"
                                >
                                    <Edit3 size={12} />
                                </button>
                                <button 
                                    onClick={() => onDelete(f.id)} 
                                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-indigo-400 hover:text-red-500"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                        <div className="leading-relaxed">"{f.content}"</div>
                    </motion.div>
                )) : <div className="text-xs text-gray-400 px-1">{t('cozyPal.memory.noFragments')}</div>}
            </div>
        </div>
    );
};
