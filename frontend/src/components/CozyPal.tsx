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
import { useCozyPalCallbacks } from '../hooks/cozypal/useCozyPalCallbacks';

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
  isChiikawaTheme?: boolean;
  isShinchanTheme?: boolean;
}

export interface CozyPalHandle {
  triggerProactiveMessage: (type: string, durationOverride?: number) => void;
}

const CozyPal = React.forwardRef<CozyPalHandle, CozyPalProps>(({
  themeName, phase, timeLeft, apiKey, currentLanguage, aiPersona,
  aiProvider, aiModel, dailyCompletedPomodoros, totalFocusMinutes,
  documentId, documentTitle, documentContent, onDimensionsChange, isChiikawaTheme, isShinchanTheme,
}, ref) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [mainTab, setMainTab] = React.useState<'companion' | 'gemini'>('companion');
  const [activeTab, setActiveTab] = React.useState<'chat' | 'memory' | 'debug'>('chat');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { width, isResizing, startResizing } = useResizablePanel(450);
  const diagnosticsState = useCozyPalDiagnostics({ t }) as CozyPalDiagnosticsState;
  const topicsState = useCozyPalTopics();

  const chatState = useCozyPalChat({
    t, apiKey,
    context: { themeName, phase, timeLeft, currentLanguage, aiPersona, dailyCompletedPomodoros, totalFocusMinutes },
    aiProvider, aiModel, documentId, documentTitle, documentContent, isOpen,
    activeTopicId: topicsState.activeTopicId,
    onMemoryUpdateCheck: diagnosticsState.checkForMemoryUpdates,
  });

  const callbacks = useCozyPalCallbacks({
    isOpen, ensureGreeting: chatState.ensureGreeting,
    setEditingProfileItem: diagnosticsState.setEditingProfileItem,
    setEditingFragment: diagnosticsState.setEditingFragment,
    setEditValue: diagnosticsState.setEditValue,
    setIsOpen, setHasUnread: chatState.setHasUnread,
    sendMessage: chatState.sendMessage, inputRef,
  });

  React.useEffect(() => {
    onDimensionsChange?.(isOpen ? width : 0);
  }, [isOpen, width, onDimensionsChange]);

  React.useEffect(() => {
    if (activeTab === 'debug' || activeTab === 'memory') diagnosticsState.fetchDiagnostics();
    if (activeTab === 'memory') diagnosticsState.fetchMemoryFragments();
  }, [activeTab, diagnosticsState.fetchDiagnostics, diagnosticsState.fetchMemoryFragments]);

  React.useEffect(() => {
    if (isOpen) callbacks.handleOpenChange();
  }, [isOpen, callbacks.handleOpenChange]);

  React.useImperativeHandle(ref, () => ({
    triggerProactiveMessage: callbacks.triggerProactiveMessage,
  }));

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <MemoryToast message={diagnosticsState.toastMessage} onDismiss={() => diagnosticsState.setToastMessage(null)} />
      <CozyPalAvatarButton 
        avatarState={chatState.avatarState} 
        hasUnread={chatState.hasUnread} 
        onToggle={callbacks.toggleChat} 
        t={t} 
        isChiikawaTheme={isChiikawaTheme} 
        isShinchanTheme={isShinchanTheme} 
      />
      {!isOpen && <CozyPalSpeechBubble speechBubble={chatState.speechBubble} />}

      <AnimatePresence>
        {isOpen && (
          <CozyPalDrawer
            width={width} isResizing={isResizing} onStartResizing={startResizing} onClose={callbacks.toggleChat}
            avatarState={chatState.avatarState} mainTab={mainTab} onMainTabChange={setMainTab}
            activeTab={activeTab} onActiveTabChange={setActiveTab}
            topics={topicsState.topics} activeTopicId={topicsState.activeTopicId}
            showTopicSelector={topicsState.showTopicSelector}
            onToggleTopicSelector={() => topicsState.setShowTopicSelector(!topicsState.showTopicSelector)}
            onSelectTopic={topicsState.handleSelectTopic} onCreateTopic={topicsState.handleCreateTopic}
            chatTab={<CozyPalChatTab key="chat" messages={chatState.messages} isLoading={chatState.isLoading} />}
            memoryTab={
              <CozyPalMemoryTab key="memory" diagnostics={diagnosticsState.diagnostics} memoryFragments={diagnosticsState.memoryFragments}
                onEditProfileItem={callbacks.handleEditProfileItem} onDeleteProfileItem={diagnosticsState.handleDeleteProfileItem}
                onEditFragment={callbacks.handleEditFragment} onDeleteFragment={diagnosticsState.handleDeleteFragment}
                onResetMemory={diagnosticsState.handleResetMemory} isSavingEdit={diagnosticsState.isSavingEdit} t={t} />
            }
            debugTab={
              <CozyPalDebugTab key="debug" diagnostics={diagnosticsState.diagnostics} isDiagLoading={diagnosticsState.isDiagLoading}
                onRefresh={diagnosticsState.fetchDiagnostics} onStartEditFragment={callbacks.handleEditFragment}
                editingFragment={diagnosticsState.editingFragment} editValue={diagnosticsState.editValue}
                onEditValueChange={diagnosticsState.setEditValue} onCloseEdit={() => diagnosticsState.setEditingFragment(null)}
                onSaveEdit={diagnosticsState.handleUpdateFragment} isSavingEdit={diagnosticsState.isSavingEdit} t={t} />
            }
            inputArea={
              <CozyPalInputArea inputRef={inputRef} inputValue={chatState.inputValue} onInputChange={chatState.setInputValue}
                isLoading={chatState.isLoading} onSend={(e) => chatState.sendMessage(e)} t={t} />
            }
            profileEditOverlay={
              <CozyPalProfileEditOverlay editingProfileItem={diagnosticsState.editingProfileItem} editValue={diagnosticsState.editValue}
                onEditValueChange={diagnosticsState.setEditValue} onCancel={() => diagnosticsState.setEditingProfileItem(null)}
                onSave={diagnosticsState.handleUpdateProfileItem} isSavingEdit={diagnosticsState.isSavingEdit} t={t} />
            }
            t={t}
            isChiikawaTheme={isChiikawaTheme}
            isShinchanTheme={isShinchanTheme}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

export default CozyPal;
