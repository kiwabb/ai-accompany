import React from 'react';
import { motion } from 'framer-motion';
import { Edit3, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProfileSectionProps {
    title: string;
    items: string[] | undefined;
    color: 'indigo' | 'amber';
    category: 'facts' | 'preferences';
    onEdit: (category: 'facts' | 'preferences', value: string) => void;
    onDelete: (category: 'facts' | 'preferences', value: string) => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
    title,
    items,
    color,
    category,
    onEdit,
    onDelete,
}) => {
    const { t } = useTranslation();
    const colorClass = color === 'indigo' ? 'text-indigo-400' : 'text-amber-500';
    const bgClass = color === 'indigo' ? 'bg-indigo-400' : 'bg-amber-500';
    const textClass = color === 'indigo' ? 'text-indigo-700' : 'text-amber-700';
    const borderClass = color === 'indigo' ? 'border-indigo-100' : 'border-amber-100';
    const hoverBgClass = color === 'indigo' ? 'hover:bg-indigo-50' : 'hover:bg-amber-50';
    const hoverTextClass = color === 'indigo' ? 'hover:text-indigo-600' : 'hover:text-amber-600';
    
    // We can map these dynamic classes better or stick to the original if complexity is high.
    // Given the props, let's keep it simple.

    return (
        <div className="glass-surface rounded-2xl p-4 shadow-sm">
            <h4 className={`text-[11px] font-bold ${colorClass} uppercase mb-3 tracking-widest flex items-center gap-2`}>
                <div className={`w-1.5 h-1.5 rounded-full ${bgClass}`} />
                {title}
            </h4>
            <div className="flex flex-wrap gap-2">
                {items && items.length > 0 ? items.map((item, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ scale: 1.05, y: -2 }}
                        className={`group relative text-xs bg-white ${textClass} pl-3 pr-2 py-1.5 rounded-xl border ${borderClass} shadow-sm flex items-center gap-2`}
                    >
                        <span className="font-medium">{item}</span>
                        <div className={`flex items-center opacity-0 group-hover:opacity-100 transition-all ml-1 border-l ${color === 'indigo' ? 'border-indigo-50' : 'border-amber-50'} pl-1 gap-1`}>
                            <button 
                                onClick={() => onEdit(category, item)} 
                                className={`p-1 ${hoverBgClass} rounded transition-colors ${color === 'indigo' ? 'text-indigo-400' : 'text-amber-400'} ${hoverTextClass}`}
                            >
                                <Edit3 size={12} />
                            </button>
                            <button 
                                onClick={() => onDelete(category, item)} 
                                className="p-1 hover:bg-red-50 rounded transition-colors text-indigo-400 hover:text-red-500"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </motion.div>
                )) : (
                    <p className="text-xs text-gray-400 font-medium">
                        {category === 'facts' ? t('cozyPal.memory.noFacts') : t('cozyPal.memory.noPreferences')}
                    </p>
                )}
            </div>
        </div>
    );
};
