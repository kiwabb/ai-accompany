import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { EditingProfileItem } from '../../types';

interface EditProfileItemModalProps {
    editingProfileItem: EditingProfileItem | null;
    editValue: string;
    setEditValue: (value: string) => void;
    onClose: () => void;
    onSave: () => void;
    isSavingEdit: boolean;
}

export const EditProfileItemModal: React.FC<EditProfileItemModalProps> = ({
    editingProfileItem,
    editValue,
    setEditValue,
    onClose,
    onSave,
    isSavingEdit,
}) => {
    const { t } = useTranslation();

    return (
        <AnimatePresence>
            {editingProfileItem && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 p-6 flex flex-col items-center justify-center text-center"
                >
                    <h4 className="text-indigo-900 font-bold uppercase text-xs mb-4">
                        {t('cozyPal.debug.editTitle')}
                    </h4>
                    <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-sm text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                        autoFocus
                    />
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-gray-400 uppercase hover:text-gray-600 transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={onSave}
                            disabled={isSavingEdit}
                            className="px-6 py-2 text-xs font-bold bg-indigo-600 text-white rounded-full uppercase shadow-lg shadow-indigo-900/20 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSavingEdit ? (
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : <Check size={14} />}
                            {t('cozyPal.debug.saveAndRescan')}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
