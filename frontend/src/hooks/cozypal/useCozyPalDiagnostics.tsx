import { useCallback, useState } from 'react';
import type { TFunction } from 'i18next';
import type { DiagnosticData, EditingFragment, EditingProfileItem } from '../../components/cozypal/types';
import { getUserProfile, saveUserProfile, type UserProfile } from '../../lib/storage/userProfile';
import { constructSystemPrompt } from '../../lib/ai/systemPrompt';

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
  const [isDiagLoading, setIsDiagLoading] = useState(false);
  const [editingFragment, setEditingFragment] = useState<EditingFragment | null>(null);
  const [editingProfileItem, setEditingProfileItem] = useState<EditingProfileItem | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchDiagnostics = useCallback(async () => {
    setIsDiagLoading(true);
    try {
      const profile = getUserProfile();
      
      // Load current timer context to build visual preview of system prompt
      let savedContext = null;
      try {
        const raw = localStorage.getItem('pomodoro_context_state');
        if (raw) savedContext = JSON.parse(raw);
      } catch (e) {
        // ignore
      }

      const activeThemeName = savedContext?.themes?.find((t: any) => t.id === savedContext.activeThemeId)?.name || 'Focus';
      const promptContext = {
        themeName: activeThemeName,
        phase: savedContext?.phase || 'focus',
        timeLeft: savedContext?.timeLeft || 1500,
        aiPersona: savedContext?.settings?.aiPersona || 'gentle_encourager',
      };

      const systemPrompt = constructSystemPrompt(
        promptContext,
        0, 0,
        t('common.langCode', 'zh'),
        '',
        profile
      );

      setDiagnostics({
        system_prompt: systemPrompt,
        memory_fragments: [],
        user_profile: {
          facts: profile.facts,
          preferences: profile.preferences,
        },
        full_prompt: systemPrompt,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to compile diagnostics', error);
    } finally {
      setIsDiagLoading(false);
    }
  }, [t]);

  // Memory fragments are retired and thus kept empty
  const fetchMemoryFragments = useCallback(async () => {
    // No-op in client-only mode
  }, []);

  const checkForMemoryUpdates = useCallback(async () => {
    // No-op in client-only mode
  }, []);

  // Fragment CRUD operations are retired (we simplify memory to profile items)
  const handleUpdateFragment = async () => {
    setEditingFragment(null);
  };

  const handleDeleteFragment = async (_id: number) => {
    // No-op
  };

  // Profile facts & preferences manual updates
  const handleDeleteProfileItem = async (category: 'facts' | 'preferences', value: string) => {
    const profile = getUserProfile();
    if (category === 'facts') {
      profile.facts = profile.facts.filter(f => f !== value);
    } else {
      profile.preferences = profile.preferences.filter(p => p !== value);
    }
    saveUserProfile(profile);
    await fetchDiagnostics();
  };

  const handleUpdateProfileItem = async () => {
    if (!editingProfileItem || !editValue.trim()) return;
    setIsSavingEdit(true);
    try {
      const profile = getUserProfile();
      const list = categoryList(profile, editingProfileItem.category);
      const index = list.indexOf(editingProfileItem.value);
      
      if (index !== -1) {
        list[index] = editValue.trim();
        saveUserProfile(profile);
      }
      setEditingProfileItem(null);
      setEditValue('');
      await fetchDiagnostics();
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleResetMemory = async () => {
    if (!window.confirm(t('cozyPal.memory.resetConfirm', '确定要重置记忆吗？'))) return;
    setIsSavingEdit(true);
    try {
      const defaultProfile: UserProfile = {
        name: '学子',
        learningGoals: '深入掌握计算机软硬件知识，养成规律专注的学习习惯',
        facts: [
          '正在备考或进行高强度自主学习',
          '喜欢舒适、有陪伴感的学习环境'
        ],
        preferences: [
          '喜欢温和鼓励的声音，拒绝打压',
          '希望 AI 的回答言简意赅，不要啰嗦'
        ]
      };
      saveUserProfile(defaultProfile);
      setToastMessage(t('common.reset', '重置成功'));
      setTimeout(() => setToastMessage(null), 3000);
      await fetchDiagnostics();
    } finally {
      setIsSavingEdit(false);
    }
  };

  function categoryList(profile: UserProfile, category: 'facts' | 'preferences'): string[] {
    return category === 'facts' ? profile.facts : profile.preferences;
  }

  return {
    diagnostics,
    memoryFragments: [],
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
