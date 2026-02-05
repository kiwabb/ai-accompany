import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EditingFragment, EditingProfileItem } from '../components/cozypal/types';

interface UseMemoryManagementProps {
    fetchDiagnostics: () => Promise<void>;
    fetchMemoryFragments: () => Promise<void>;
    knownFactsRef: React.MutableRefObject<Set<string>>;
    knownPrefsRef: React.MutableRefObject<Set<string>>;
}

export const useMemoryManagement = ({
    fetchDiagnostics,
    fetchMemoryFragments,
    knownFactsRef,
    knownPrefsRef,
}: UseMemoryManagementProps) => {
    const { t } = useTranslation();
    const [editingFragment, setEditingFragment] = useState<EditingFragment | null>(null);
    const [editingProfileItem, setEditingProfileItem] = useState<EditingProfileItem | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const handleUpdateFragment = async () => {
        if (!editingFragment) return;
        setIsSavingEdit(true);
        try {
            const response = await fetch(`/api/diagnostics/memory/fragments/${editingFragment.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editValue }),
            });
            if (response.ok) {
                setEditingFragment(null);
                fetchDiagnostics();
                fetchMemoryFragments();
            }
        } catch (error) {
            console.error('Failed to update fragment', error);
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleDeleteFragment = async (id: number) => {
        try {
            const response = await fetch(`/api/diagnostics/memory/fragments/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                fetchMemoryFragments();
                fetchDiagnostics();
            }
        } catch (error) {
            console.error('Failed to delete fragment', error);
        }
    };

    const handleDeleteProfileItem = async (category: 'facts' | 'preferences', value: string) => {
        try {
            const response = await fetch(`/api/diagnostics/profile/${category}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value }),
            });
            if (response.ok) {
                if (category === 'facts') knownFactsRef.current.delete(value);
                else knownPrefsRef.current.delete(value);

                fetchDiagnostics();
            }
        } catch (error) {
            console.error(`Failed to delete ${category} item`, error);
        }
    };

    const handleUpdateProfileItem = async () => {
        if (!editingProfileItem) return;
        setIsSavingEdit(true);
        try {
            const response = await fetch(`/api/diagnostics/profile/${editingProfileItem.category}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    old_value: editingProfileItem.value,
                    new_value: editValue
                }),
            });
            if (response.ok) {
                if (editingProfileItem.category === 'facts') {
                    knownFactsRef.current.delete(editingProfileItem.value);
                    knownFactsRef.current.add(editValue);
                } else {
                    knownPrefsRef.current.delete(editingProfileItem.value);
                    knownPrefsRef.current.add(editValue);
                }

                setEditingProfileItem(null);
                fetchDiagnostics();
            }
        } catch (error) {
            console.error(`Failed to update ${editingProfileItem.category} item`, error);
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleResetMemory = async () => {
        if (!window.confirm(t('cozyPal.memory.resetConfirm'))) return;
        setIsSavingEdit(true);
        try {
            const response = await fetch('/api/diagnostics/reset', { method: 'POST' });
            if (response.ok) {
                knownFactsRef.current.clear();
                knownPrefsRef.current.clear();
                fetchDiagnostics();
                fetchMemoryFragments();
            }
        } catch (error) {
            console.error('Failed to reset memory', error);
        } finally {
            setIsSavingEdit(false);
        }
    };

    // Helper to start editing
    const startEditingFragment = (fragment: { id: number; content: string }) => {
        setEditingFragment(fragment);
        setEditValue(fragment.content);
    };

    const startEditingProfileItem = (category: 'facts' | 'preferences', value: string) => {
        setEditingProfileItem({ category, value });
        setEditValue(value);
    };

    return {
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
    };
};
