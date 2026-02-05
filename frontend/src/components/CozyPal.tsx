import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import MemoryToast from './MemoryToast';
import CozyPalAvatarButton from './cozypal/CozyPalAvatarButton';
import CozyPalSpeechBubble from './cozypal/CozyPalSpeechBubble';
import CozyPalDrawer from './cozypal/CozyPalDrawer';
import CozyPalChatTab from './cozypal/CozyPalChatTab';
import CozyPalMemoryTab from './cozypal/CozyPalMemoryTab';
import CozyPalDebugTab from './cozypal/CozyPalDebugTab';
import CozyPalInputArea from './cozypal/CozyPalInputArea';
import CozyPalProfileEditOverlay from './cozypal/CozyPalProfileEditOverlay';
import { useResizablePanel } from '../hooks/cozypal/useResizablePanel';
import { useCozyPalDiagnostics, type CozyPalDiagnosticsState } from '../hooks/cozypal/useCozyPalDiagnostics';
import { useCozyPalTopics } from '../hooks/cozypal/useCozyPalTopics';
import { useCozyPalChat } from '../hooks/cozypal/useCozyPalChat';

interface CozyPalProps {
  themeName: string;
  phase: string;
  timeLeft: number;
  apiKey?: string;
  currentLanguage: string;
  aiPersona: string;
  aiProvider?: string;
  aiModel?: string;
  dailyCompletedPomodoros: number;
  totalFocusMinutes: number;
  documentId?: number;
  documentTitle?: string;
  documentContent?: string;
  onDimensionsChange?: (width: number) => void;
}

export interface CozyPalHandle {
  triggerProactiveMessage: (
    type:
      | 'focus_start'
      | 'focus_end'
      | 'break_start'
      | 'break_end'
      | 'focus_near_end'
      | 'break_near_end'
      | 'focus_completed',
    durationOverride?: number
  ) => void;
}

const CozyPal = React.forwardRef<CozyPalHandle, CozyPalProps>(({
  themeName,
  phase,
  timeLeft,
  apiKey,
  currentLanguage,
  aiPersona,
  aiProvider,
  aiModel,
  dailyCompletedPomodoros,
  totalFocusMinutes,
  documentId,
  documentTitle,
  documentContent,
  onDimensionsChange,
}, ref) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [mainTab, setMainTab] = React.useState<'companion' | 'gemini'>('companion');
  const [activeTab, setActiveTab] = React.useState<'chat' | 'memory' | 'debug'>('chat');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { width, isResizing, startResizing } = useResizablePanel(450);

  const diagnosticsState = useCozyPalDiagnostics({ t }) as CozyPalDiagnosticsState;
  const {
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
  } = diagnosticsState;

  const {
    topics,
    activeTopicId,
    showTopicSelector,
    setShowTopicSelector,
    handleSelectTopic,
    handleCreateTopic,
  } = useCozyPalTopics();

  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    hasUnread,
    setHasUnread,
    avatarState,
    speechBubble,
    sendMessage,
    ensureGreeting,
  } = useCozyPalChat({
    t,
    apiKey,
    themeName,
    phase,
    timeLeft,
    currentLanguage,
    aiPersona,
    aiProvider,
    aiModel,
    dailyCompletedPomodoros,
    totalFocusMinutes,
    documentId,
    documentTitle,
    documentContent,
    isOpen,
    activeTopicId,
    onMemoryUpdateCheck: checkForMemoryUpdates,
  });

  React.useEffect(() => {
    if (onDimensionsChange) {
      onDimensionsChange(isOpen ? width : 0);
    }
  }, [isOpen, width, onDimensionsChange]);

  React.useEffect(() => {
    if (activeTab === 'debug' || activeTab === 'memory') {
      fetchDiagnostics();
    }
    if (activeTab === 'memory') {
      fetchMemoryFragments();
    }
  }, [activeTab, fetchDiagnostics, fetchMemoryFragments]);

  React.useEffect(() => {
    if (!isOpen) return;
    setHasUnread(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [isOpen, setHasUnread]);

  const toggleChat = React.useCallback(() => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      ensureGreeting();
    }
  }, [ensureGreeting, isOpen]);

  const handleEditProfileItem = React.useCallback((category: 'facts' | 'preferences', value: string) => {
    setEditingProfileItem({ category, value });
    setEditValue(value);
  }, [setEditValue, setEditingProfileItem]);

  const handleEditFragment = React.useCallback((id: number, content: string) => {
    setEditingFragment({ id, content });
    setEditValue(content);
  }, [setEditingFragment, setEditValue]);

  React.useImperativeHandle(ref, () => ({
    triggerProactiveMessage: (type, durationOverride) => {
      sendMessage(undefined, type, durationOverride);
    },
  }));

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <MemoryToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      <CozyPalAvatarButton
        avatarState={avatarState}
        hasUnread={hasUnread}
        onToggle={toggleChat}
        t={t}
      />
      {!isOpen && <CozyPalSpeechBubble speechBubble={speechBubble} />}

      <AnimatePresence>
        {isOpen && (
          <CozyPalDrawer
            width={width}
            isResizing={isResizing}
            onStartResizing={startResizing}
            onClose={toggleChat}
            avatarState={avatarState}
            mainTab={mainTab}
            onMainTabChange={setMainTab}
            activeTab={activeTab}
            onActiveTabChange={setActiveTab}
            topics={topics}
            activeTopicId={activeTopicId}
            showTopicSelector={showTopicSelector}
            onToggleTopicSelector={() => setShowTopicSelector(!showTopicSelector)}
            onSelectTopic={handleSelectTopic}
            onCreateTopic={handleCreateTopic}
            chatTab={(
              <CozyPalChatTab
                key="chat"
                messages={messages}
                isLoading={isLoading}
              />
            )}
            memoryTab={(
              <CozyPalMemoryTab
                key="memory"
                diagnostics={diagnostics}
                memoryFragments={memoryFragments}
                onEditProfileItem={handleEditProfileItem}
                onDeleteProfileItem={handleDeleteProfileItem}
                onEditFragment={handleEditFragment}
                onDeleteFragment={handleDeleteFragment}
                onResetMemory={handleResetMemory}
                isSavingEdit={isSavingEdit}
                t={t}
              />
            )}
            debugTab={(
              <CozyPalDebugTab
                key="debug"
                diagnostics={diagnostics}
                isDiagLoading={isDiagLoading}
                onRefresh={fetchDiagnostics}
                onStartEditFragment={handleEditFragment}
                editingFragment={editingFragment}
                editValue={editValue}
                onEditValueChange={setEditValue}
                onCloseEdit={() => setEditingFragment(null)}
                onSaveEdit={handleUpdateFragment}
                isSavingEdit={isSavingEdit}
                t={t}
              />
            )}
            inputArea={(
              <CozyPalInputArea
                inputRef={inputRef}
                inputValue={inputValue}
                onInputChange={setInputValue}
                isLoading={isLoading}
                onSend={(event) => sendMessage(event)}
                t={t}
              />
            )}
            profileEditOverlay={(
              <CozyPalProfileEditOverlay
                editingProfileItem={editingProfileItem}
                editValue={editValue}
                onEditValueChange={setEditValue}
                onCancel={() => setEditingProfileItem(null)}
                onSave={handleUpdateProfileItem}
                isSavingEdit={isSavingEdit}
                t={t}
              />
            )}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

export default CozyPal;
