import { motion } from 'framer-motion';
import type { TFunction } from 'i18next';
import type { Topic } from './types';

interface CozyPalTopicTabsProps {
  topics: Topic[];
  activeTopicId: number | null;
  onToggleTopicSelector: () => void;
  activeTab: 'chat' | 'memory' | 'debug';
  onTabChange: (tab: 'chat' | 'memory' | 'debug') => void;
  t: TFunction;
}

const CozyPalTopicTabs = ({
  topics,
  activeTopicId,
  onToggleTopicSelector,
  activeTab,
  onTabChange,
  t,
}: CozyPalTopicTabsProps) => (
  <div className="bg-indigo-50/30 px-4 py-2 border-b border-indigo-50 flex justify-between items-center">
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Topic:</span>
      <button
        onClick={onToggleTopicSelector}
        className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
      >
        {topics.find((topic) => topic.id === activeTopicId)?.name || 'Select Topic'}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>

    {(['chat', 'memory', 'debug'] as const).map((tab) => (
      <button
        key={tab}
        onClick={() => onTabChange(tab)}
        className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all relative ${activeTab === tab
          ? 'text-indigo-700'
          : 'text-indigo-300 hover:text-indigo-500'
        }`}
      >
        {activeTab === tab && (
          <motion.div
            layoutId="companion-tab-active"
            className="absolute inset-0 bg-indigo-100 rounded-full -z-10"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
        {t(`cozyPal.tabs.${tab}`)}
      </button>
    ))}
  </div>
);

export default CozyPalTopicTabs;
