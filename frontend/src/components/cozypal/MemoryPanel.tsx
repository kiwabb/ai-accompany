import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { DiagnosticData } from './types';
import { useMemoryManagement } from '../../hooks/useMemoryManagement';
import { ProfileSection } from './memory/ProfileSection';
import { MemoryTimeline } from './memory/MemoryTimeline';
import { EditFragmentModal } from './memory/EditFragmentModal';
import { EditProfileItemModal } from './memory/EditProfileItemModal';
import { ResetMemoryButton } from './memory/ResetMemoryButton';

interface MemoryPanelProps {
    diagnostics: DiagnosticData | null;
    memoryFragments: { id: number; content: string; created_at: string }[];
    fetchDiagnostics: () => Promise<void>;
    fetchMemoryFragments: () => Promise<void>;
    knownFactsRef: React.MutableRefObject<Set<string>>;
    knownPrefsRef: React.MutableRefObject<Set<string>>;
}

const MemoryPanel: React.FC<MemoryPanelProps> = ({
    diagnostics,
    memoryFragments,
    fetchDiagnostics,
    fetchMemoryFragments,
    knownFactsRef,
    knownPrefsRef,
}) => {
    const { t } = useTranslation();
    
    const {
        editingFragment,
        setEditingFragment,
        editingProfileItem,
        setEditingProfileItem,
        editValue,
        setEditValue,
        isSavingEdit,
        handleUpdateFragment,
        handleDeleteFragment,
        handleDeleteProfileItem,
        handleUpdateProfileItem,
        handleResetMemory,
        startEditingFragment,
        startEditingProfileItem
    } = useMemoryManagement({
        fetchDiagnostics,
        fetchMemoryFragments,
        knownFactsRef,
        knownPrefsRef
    });

    return (
        <motion.div
            key="memory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 space-y-6 flex flex-col flex-grow"
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                    <ProfileSection 
                        title={t('cozyPal.memory.facts')} 
                        items={diagnostics?.user_profile?.facts} 
                        color="indigo" 
                        category="facts"
                        onEdit={startEditingProfileItem}
                        onDelete={handleDeleteProfileItem}
                    />

                    <ProfileSection 
                        title={t('cozyPal.memory.preferences')} 
                        items={diagnostics?.user_profile?.preferences} 
                        color="amber" 
                        category="preferences"
                        onEdit={startEditingProfileItem}
                        onDelete={handleDeleteProfileItem}
                    />
                </div>

                <MemoryTimeline 
                    memoryFragments={memoryFragments} 
                    onEdit={startEditingFragment} 
                    onDelete={handleDeleteFragment} 
                />
            </div>

            <ResetMemoryButton 
                onReset={handleResetMemory} 
                isDisabled={isSavingEdit} 
            />

            <EditFragmentModal 
                editingFragment={editingFragment}
                editValue={editValue}
                setEditValue={setEditValue}
                onClose={() => setEditingFragment(null)}
                onSave={handleUpdateFragment}
                isSavingEdit={isSavingEdit}
            />

            <EditProfileItemModal 
                editingProfileItem={editingProfileItem}
                editValue={editValue}
                setEditValue={setEditValue}
                onClose={() => setEditingProfileItem(null)}
                onSave={handleUpdateProfileItem}
                isSavingEdit={isSavingEdit}
            />
        </motion.div>
    );
};

export default MemoryPanel;
