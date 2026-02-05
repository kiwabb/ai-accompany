import { useCallback, useEffect, useRef, useState } from 'react';
import type { TFunction } from 'i18next';
import type { DiagnosticData, EditingFragment, EditingProfileItem } from '../types';

interface MemoryFragment {
  id: number;
  content: string;
  created_at: string;
}

interface UseCozyPalMemoryOptions {
  activeTab: 'chat' | 'memory' | 'debug';
  t: TFunction;
}

const useCozyPalMemory = ({ activeTab, t }: UseCozyPalMemoryOptions) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticData | null>(null);
  const [memoryFragments, setMemoryFragments] = useState<MemoryFragment[]>([]);
  const [isDiagLoading, setIsDiagLoading] = useState(false);
  const [editingFragment, setEditingFragment] = useState<EditingFragment | null>(null);
  const [editingProfileItem, setEditingProfileItem] = useState<EditingProfileItem | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const knownFactsRef = useRef<Set<string>>(new Set());
  const knownPrefsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);

  const fetchDiagnostics = useCallback(async () => {
    setIsDiagLoading(true);
    try {
      const response = await fetch('/api/diagnostics/last-exchange');
      if (response.ok) {
        const data = await response.json();
        setDiagnostics(data);
      }
    } catch (error) {
      console.error('Failed to fetch diagnostics', error);
    } finally {
      setIsDiagLoading(false);
    }
  }, []);

  const fetchMemoryFragments = useCallback(async () => {
    try {
      const response = await fetch('/api/diagnostics/memory/fragments');
      if (response.ok) {
        const data = await response.json();
        setMemoryFragments(data);
      }
    } catch (error) {
      console.error('Failed to fetch memory fragments', error);
    }
  }, []);

  const checkForMemoryUpdates = useCallback(async () => {
    try {
      const response = await fetch('/api/diagnostics/latest-memory-update');
      if (response.ok) {
        const data = await response.json();
        if (data.has_update) {
          const newFacts = (data.facts as string[]) || [];
          const newPrefs = (data.preferences as string[]) || [];

          let addedFact: string | null = null;
          let addedPref: string | null = null;

          if (!isInitializedRef.current) {
            newFacts.forEach((fact) => knownFactsRef.current.add(fact));
            newPrefs.forEach((pref) => knownPrefsRef.current.add(pref));
            isInitializedRef.current = true;
            return;
          }

          for (const fact of newFacts) {
            if (!knownFactsRef.current.has(fact)) {
              addedFact = fact;
              knownFactsRef.current.add(fact);
            }
          }
          for (const pref of newPrefs) {
            if (!knownPrefsRef.current.has(pref)) {
              addedPref = pref;
              knownPrefsRef.current.add(pref);
            }
          }

          if (addedFact) {
            setToastMessage(`${t('cozyPal.memory.learned')}: ${addedFact}`);
            fetchMemoryFragments();
            setTimeout(() => setToastMessage(null), 4000);
          } else if (addedPref) {
            setToastMessage(`${t('cozyPal.memory.learned')}: ${addedPref}`);
            fetchMemoryFragments();
            setTimeout(() => setToastMessage(null), 4000);
          }
        } else {
          isInitializedRef.current = true;
        }
      }
    } catch (error) {
      console.error('Failed to check memory updates', error);
    }
  }, [fetchMemoryFragments, t]);

  useEffect(() => {
    checkForMemoryUpdates();
  }, [checkForMemoryUpdates]);

  const handleUpdateFragment = useCallback(async () => {
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
  }, [editValue, editingFragment, fetchDiagnostics, fetchMemoryFragments]);

  const handleDeleteFragment = useCallback(async (id: number) => {
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
  }, [fetchDiagnostics, fetchMemoryFragments]);

  const handleDeleteProfileItem = useCallback(async (category: 'facts' | 'preferences', value: string) => {
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
  }, [fetchDiagnostics]);

  const handleUpdateProfileItem = useCallback(async () => {
    if (!editingProfileItem) return;
    setIsSavingEdit(true);
    try {
      const response = await fetch(`/api/diagnostics/profile/${editingProfileItem.category}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          old_value: editingProfileItem.value,
          new_value: editValue,
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
  }, [editValue, editingProfileItem, fetchDiagnostics]);

  const handleResetMemory = useCallback(async () => {
    if (!window.confirm(t('cozyPal.memory.resetConfirm'))) return;
    setIsSavingEdit(true);
    try {
      const response = await fetch('/api/diagnostics/reset', { method: 'POST' });
      if (response.ok) {
        knownFactsRef.current.clear();
        knownPrefsRef.current.clear();
        setDiagnostics(null);
        setMemoryFragments([]);
        fetchDiagnostics();
        fetchMemoryFragments();
        setToastMessage(t('common.reset'));
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (error) {
      console.error('Failed to reset memory', error);
    } finally {
      setIsSavingEdit(false);
    }
  }, [fetchDiagnostics, fetchMemoryFragments, t]);

  useEffect(() => {
    if (activeTab === 'debug' || activeTab === 'memory') {
      fetchDiagnostics();
    }
    if (activeTab === 'memory') {
      fetchMemoryFragments();
    }
  }, [activeTab, fetchDiagnostics, fetchMemoryFragments]);

  return {
    diagnostics,
    memoryFragments,
    isDiagLoading,
    editingFragment,
    setEditingFragment,
    editingProfileItem,
    setEditingProfileItem,
    editValue,
    setEditValue,
    isSavingEdit,
    toastMessage,
    setToastMessage,
    knownFactsRef,
    knownPrefsRef,
    fetchDiagnostics,
    fetchMemoryFragments,
    checkForMemoryUpdates,
    handleUpdateFragment,
    handleDeleteFragment,
    handleDeleteProfileItem,
    handleUpdateProfileItem,
    handleResetMemory,
  };
};

export default useCozyPalMemory;
