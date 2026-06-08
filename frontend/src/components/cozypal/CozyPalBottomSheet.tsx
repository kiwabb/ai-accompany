import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
import TopicSelector from '../TopicSelector';
import CozyPalHeader from './CozyPalHeader';
import CozyPalMainTabs from './CozyPalMainTabs';
import CozyPalTopicTabs from './CozyPalTopicTabs';
import type { Topic } from './types';
import type { VisualTheme, VisualThemeCharacter } from '../../types/pomodoro';

interface CozyPalBottomSheetProps {
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

const CozyPalBottomSheet = ({
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
}: CozyPalBottomSheetProps) => {
  const dragY = useMotionValue(0);
  const backdropOpacity = useTransform(dragY, [0, 300], [1, 0.3]);

  return (
    <>
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ opacity: backdropOpacity }}
        onClick={onClose}
        className="fixed inset-0 bg-black/30 z-[105]"
      />
      <motion.div
        aria-label={t('cozyPal.chatDescription')}
        role="dialog"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        style={{
          y: dragY,
          height: 'calc(var(--vh, 1vh) * 80)',
          ...(visualTheme ? {
            backgroundColor: visualTheme.colors.surface,
            borderColor: visualTheme.colors.border,
            boxShadow: visualTheme.shadows.elevated,
          } : {}),
        }}
        className="fixed inset-x-0 bottom-0 z-[110] rounded-t-3xl shadow-2xl backdrop-blur-3xl border-t flex flex-col bg-white/95 border-white/40"
      >
        {/* Drag handle —— 仅此处可下拉关闭，避免与消息列表滚动冲突 */}
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDrag={(_, info) => dragY.set(Math.max(0, info.offset.y))}
          onDragEnd={(_, info) => {
            if (info.offset.y > 100 || info.velocity.y > 500) {
              onClose();
            } else {
              dragY.set(0);
            }
          }}
          className="flex-none flex justify-center pt-2 pb-1 touch-none cursor-grab active:cursor-grabbing"
        >
          <div className="w-12 h-1.5 rounded-full bg-slate-300" />
        </motion.div>

        <div
          className="flex-none px-5 pt-2 pb-3 border-b border-indigo-50 bg-white/40"
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

        {mainTab === 'companion' && activeTab === 'chat' && (
          <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {inputArea}
          </div>
        )}
        {profileEditOverlay}
      </motion.div>
    </>
  );
};

export default CozyPalBottomSheet;
