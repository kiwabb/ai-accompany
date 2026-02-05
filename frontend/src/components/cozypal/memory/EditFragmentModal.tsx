import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { EditingFragment } from '../types';

interface EditFragmentModalProps {
    editingFragment: EditingFragment | null;
    editValue: string;
    setEditValue: (value: string) => void;
    onClose: () => void;
    onSave: () => void;
    isSavingEdit: boolean;
}

export const EditFragmentModal: React.FC<EditFragmentModalProps> = ({
    editingFragment,
    editValue,
    setEditValue,
    onClose,
    onSave,
    isSavingEdit,
}) => {
    const { t } = useTranslation();

    return (
        <AnimatePresence>
            {editingFragment && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm z-50 p-4 flex flex-col"
                >
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-purple-400 font-bold uppercase text-[8px]">{t('cozyPal.debug.editTitle')}</h4>
                        <button onClick={onClose} className="text-gray-500 hover:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-grow bg-gray-800 border border-purple-500/30 rounded-lg p-3 text-[10px] text-purple-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="Edit memory content..."
                    />
                    <div className="mt-3 flex justify-end gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 text-[8px] font-bold text-gray-400 uppercase"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={onSave}
                            disabled={isSavingEdit}
                            className="px-3 py-1.5 text-[8px] font-bold bg-purple-600 text-white rounded-md uppercase shadow-lg shadow-purple-900/20 disabled:opacity-50"
                        >
                            {isSavingEdit ? 'Saving...' : t('cozyPal.debug.saveAndRescan')}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
