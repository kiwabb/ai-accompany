import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopicSelector from '../../TopicSelector';
import type { Topic } from '../types';

interface ChatHeaderProps {
    topics: Topic[];
    activeTopicId: number | null;
    showTopicSelector: boolean;
    setShowTopicSelector: (show: boolean) => void;
    setActiveTopicId: (id: number | null) => void;
    onHandleCreateTopic: (name: string, description?: string) => Promise<void>;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    topics,
    activeTopicId,
    showTopicSelector,
    setShowTopicSelector,
    setActiveTopicId,
    onHandleCreateTopic,
}) => {
    return (
        <>
            <div className="bg-indigo-50/30 px-4 py-2 border-b border-indigo-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Topic:</span>
                    <button
                        onClick={() => setShowTopicSelector(!showTopicSelector)}
                        className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
                    >
                        {topics.find(t => t.id === activeTopicId)?.name || 'Select Topic'}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>

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
                            onSelect={(id) => {
                                setActiveTopicId(id);
                                setShowTopicSelector(false);
                            }}
                            onCreate={onHandleCreateTopic}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
