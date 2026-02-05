import { useCallback, useEffect, useRef, useState } from 'react';
import type { TFunction } from 'i18next';
import type { DiagnosticData, EditingFragment, EditingProfileItem } from '../../components/cozypal/types';
import {
  fetchLatestMemoryUpdate,
  seedKnownMemory,
  detectNewMemoryItems,
  showMemoryLearnedToast,
} from './memoryCheckUtils';
import {
  updateFragment,
  deleteFragment,
  deleteProfileItem,
  updateProfileItem,
  resetMemory,
  removeFromKnownRefs,
  updateKnownRefs,
} from './profileUtils';

interface UseCozyPalDiagnosticsOptions {
  t: TFunction;
}

export interface CozyPalDiagnosticsState {
  diagnostics: DiagnosticData | null;
  memoryFragments: { id: number; content: string; created_at: string }[];
  isDiagLoading: boolean;
  editingFragment: EditingFragment | null;
  setEditingFragment: (value: EditingFragment | null) => void;
  editingProfileItem: EditingProfileItem | null;
  setEditingProfileItem: (value: EditingProfileItem | null) => void;
  editValue: string;
  setEditValue: (value: string) => void;
  isSavingEdit: boolean;
  toastMessage: string | null;
  setToastMessage: (value: string | null) => void;
  fetchDiagnostics: () => Promise<void>;
  fetchMemoryFragments: () => Promise<void>;
  checkForMemoryUpdates: () => Promise<void>;
  handleUpdateFragment: () => Promise<void>;
  handleDeleteFragment: (id: number) => Promise<void>;
  handleDeleteProfileItem: (category: 'facts' | 'preferences', value: string) => Promise<void>;
  handleUpdateProfileItem: () => Promise<void>;
  handleResetMemory: () => Promise<void>;
}

export const useCozyPalDiagnostics = ({ t }: UseCozyPalDiagnosticsOptions): CozyPalDiagnosticsState => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticData | null>(null);
  const [memoryFragments, setMemoryFragments] = useState<{ id: number; content: string; created_at: string }[]>([]);
  const [isDiagLoading, setIsDiagLoading] = useState(false);
  const [editingFragment, setEditingFragment] = useState<EditingFragment | null>(null);
  const [editingProfileItem, setEditingProfileItem] = useState<EditingProfileItem | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const knownFactsRef = useRef<Set<string>>(new Set());
  const knownPrefsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);

  const refs = { knownFactsRef, knownPrefsRef, isInitializedRef };

  const fetchDiagnostics = useCallback(async () => {
    setIsDiagLoading(true);
    try {
      const response = await fetch('/api/diagnostics/last-exchange');
      if (response.ok) {
        setDiagnostics(await response.json());
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
        setMemoryFragments(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch memory fragments', error);
    }
  }, []);

  const checkForMemoryUpdates = useCallback(async () => {
    const data = await fetchLatestMemoryUpdate();
    if (!data) return;

    if (data.has_update) {
      const newFacts = data.facts || [];
      const newPrefs = data.preferences || [];

      if (!isInitializedRef.current) {
        seedKnownMemory(newFacts, newPrefs, refs);
        return;
      }

      const result = detectNewMemoryItems(newFacts, newPrefs, refs);
      if (showMemoryLearnedToast(result, t, setToastMessage)) {
        fetchMemoryFragments();
      }
    } else {
      isInitializedRef.current = true;
    }
  }, [fetchMemoryFragments, t]);

  useEffect(() => {
    checkForMemoryUpdates();
  }, [checkForMemoryUpdates]);

  const handleUpdateFragment = async () => {
    if (!editingFragment) return;
    setIsSavingEdit(true);
    try {
      if (await updateFragment(editingFragment.id, editValue)) {
        setEditingFragment(null);
        fetchDiagnostics();
        fetchMemoryFragments();
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteFragment = async (id: number) => {
    if (await deleteFragment(id)) {
      fetchMemoryFragments();
      fetchDiagnostics();
    }
  };

  const handleDeleteProfileItem = async (category: 'facts' | 'preferences', value: string) => {
    if (await deleteProfileItem(category, value)) {
      removeFromKnownRefs(category, value, knownFactsRef, knownPrefsRef);
      fetchDiagnostics();
    }
  };

  const handleUpdateProfileItem = async () => {
    if (!editingProfileItem) return;
    setIsSavingEdit(true);
    try {
      if (await updateProfileItem(editingProfileItem.category, editingProfileItem.value, editValue)) {
        updateKnownRefs(editingProfileItem.category, editingProfileItem.value, editValue, knownFactsRef, knownPrefsRef);
        setEditingProfileItem(null);
        fetchDiagnostics();
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleResetMemory = async () => {
    if (!window.confirm(t('cozyPal.memory.resetConfirm'))) return;
    setIsSavingEdit(true);
    try {
      if (await resetMemory()) {
        knownFactsRef.current.clear();
        knownPrefsRef.current.clear();
        setDiagnostics(null);
        setMemoryFragments([]);
        fetchDiagnostics();
        fetchMemoryFragments();
        setToastMessage(t('common.reset'));
        setTimeout(() => setToastMessage(null), 3000);
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

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
