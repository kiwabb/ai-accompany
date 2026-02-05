import React from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ResetMemoryButtonProps {
    onReset: () => void;
    isDisabled: boolean;
}

export const ResetMemoryButton: React.FC<ResetMemoryButtonProps> = ({ onReset, isDisabled }) => {
    const { t } = useTranslation();

    return (
        <div className="mt-auto pt-6 border-t border-indigo-50 flex justify-center">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onReset}
                disabled={isDisabled}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all border border-red-100 shadow-sm"
            >
                <Trash2 size={14} /> {t('cozyPal.memory.resetMemory')}
            </motion.button>
        </div>
    );
};
