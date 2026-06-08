import { AnimatePresence, motion } from 'framer-motion';
import type { MouseEvent, ReactNode } from 'react';
import type { TFunction } from 'i18next';
import TopicSelector from '../TopicSelector';
import CozyPalHeader from './CozyPalHeader';
import CozyPalMainTabs from './CozyPalMainTabs';
import CozyPalResizeHandle from './CozyPalResizeHandle';
import CozyPalTopicTabs from './CozyPalTopicTabs';
import type { Topic } from './types';
import type { VisualTheme, VisualThemeCharacter } from '../../types/pomodoro';

interface CozyPalDrawerProps {
  width: number;
  isResizing: boolean;
  onStartResizing: (event: MouseEvent) => void;
  onClose: () => void;
  avatarState: 'idle' | 'thinking' | 'speaking' | 'focused';
  mainTab: 'companion' | 'gemini';
  onMainTabChange: (tab: 'companion' | 'gemini') => void;
  activeTab: 'chat' | 'memory' | 'debug';
  onActiveTabChange: (tab: 'chat' | 'memory' | 'debug') => void;
  topics: Topic[];
  activeTopicId: number | null;
  showTopicSelector: boolean;
  onToggleTopicSelector: () => void;
  onSelectTopic: (id: number) => void;
  onCreateTopic: (name: string, description?: string) => void;
  chatTab: ReactNode;
  memoryTab: ReactNode;
  debugTab: ReactNode;
  inputArea: ReactNode;
  profileEditOverlay: ReactNode;
  t: TFunction;
  visualTheme?: VisualTheme;
  activeCharacter?: VisualThemeCharacter;
}

const CozyPalDrawer = ({
  width,
  isResizing,
  onStartResizing,
  onClose,
  avatarState,
  mainTab,
  onMainTabChange,
  activeTab,
  onActiveTabChange,
  topics,
  activeTopicId,
  showTopicSelector,
  onToggleTopicSelector,
  onSelectTopic,
  onCreateTopic,
  chatTab,
  memoryTab,
  debugTab,
  inputArea,
  profileEditOverlay,
  t,
  visualTheme,
  activeCharacter,
}: CozyPalDrawerProps) => (
  <motion.div
    aria-label={t('cozyPal.chatDescription')}
    role="dialog"
    initial={{ x: '100%' }}
    animate={{ x: 0 }}
    exit={{ x: '100%' }}
    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    style={{
      width,
      ...(visualTheme ? {
        backgroundColor: visualTheme.colors.surface,
        borderColor: visualTheme.colors.border,
        boxShadow: visualTheme.shadows.elevated,
      } : {}),
    }}
    className="fixed top-0 right-0 h-full backdrop-blur-3xl shadow-2xl z-40 border-l flex flex-col bg-white/80 border-white/40"
  >
    <CozyPalResizeHandle isResizing={isResizing} onStartResizing={onStartResizing} />

    <div
      className="flex-none p-5 pb-3 border-b backdrop-blur-md border-indigo-50 bg-white/40"
      style={visualTheme ? { borderColor: visualTheme.colors.border, backgroundColor: visualTheme.colors.glass } : undefined}
    >
      <CozyPalHeader avatarState={avatarState} onClose={onClose} t={t} visualTheme={visualTheme} activeCharacter={activeCharacter} />
      <CozyPalMainTabs mainTab={mainTab} onChange={onMainTabChange} t={t} />
    </div>

    <div className="flex-grow overflow-hidden relative flex flex-col">
      {mainTab === 'companion' ? (
        <>
          <CozyPalTopicTabs
            topics={topics}
            activeTopicId={activeTopicId}
            onToggleTopicSelector={onToggleTopicSelector}
            activeTab={activeTab}
            onTabChange={onActiveTabChange}
            t={t}
          />

          <AnimatePresence>
            {showTopicSelector && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-b border-indigo-100 bg-white"
              >
                <TopicSelector
                  topics={topics}
                  activeTopicId={activeTopicId}
                  onSelect={onSelectTopic}
                  onCreate={onCreateTopic}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col">
            <AnimatePresence mode="wait">
              {activeTab === 'chat' && chatTab}
              {activeTab === 'memory' && memoryTab}
              {activeTab === 'debug' && debugTab}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <div className="flex-grow w-full h-full bg-white">
          <iframe
            src="https://gemini.google.com/app"
            className="w-full h-full border-none"
            title="Gemini"
            allow="clipboard-write"
          />
        </div>
      )}
    </div>

    {mainTab === 'companion' && activeTab === 'chat' && inputArea}
    {profileEditOverlay}
  </motion.div>
);

export default CozyPalDrawer;
