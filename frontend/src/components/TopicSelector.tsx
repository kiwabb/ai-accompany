import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CircleDot } from 'lucide-react';

interface Topic {
  id: number;
  name: string;
  description?: string;
}

interface TopicSelectorProps {
  topics: Topic[];
  activeTopicId: number | null;
  onSelect: (topicId: number) => void;
  onCreate: (name: string, description?: string) => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
  topics,
  activeTopicId,
  onSelect,
  onCreate,
}) => {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');

  const handleCreateNewTopic = () => {
    if (newTopicName.trim()) {
      onCreate(newTopicName.trim(), newTopicDescription.trim() || undefined);
      setNewTopicName('');
      setNewTopicDescription('');
      setIsCreatingNew(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-lg font-sans text-gray-800 border border-gray-100">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">Topics</h3>

      <div className="space-y-2">
        <AnimatePresence>
          {topics.map((topic, index) => (
            <motion.button
              key={topic.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, delay: index * 0.05, ease: "easeOut" }}
              className={`flex items-center w-full p-3 rounded-lg text-left transition-all duration-200 ease-in-out
                ${activeTopicId === topic.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-700'
                } focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-75`}
              onClick={() => onSelect(topic.id)}
            >
              <CircleDot
                className={`w-4 h-4 mr-3 ${activeTopicId === topic.id ? 'text-white' : 'text-blue-400'}`}
              />
              <div className="flex-grow">
                <p className={`font-medium ${activeTopicId === topic.id ? '' : 'group-hover:text-blue-700'}`}>
                  {topic.name}
                </p>
                {topic.description && (
                  <p className={`text-sm opacity-80 ${activeTopicId === topic.id ? 'text-blue-100' : 'text-gray-500'}`}>
                    {topic.description}
                  </p>
                )}
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <motion.div layout transition={{ duration: 0.2 }}>
        {!isCreatingNew ? (
          <motion.button
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: topics.length * 0.05 + 0.1, duration: 0.2 }}
            className="mt-4 flex items-center justify-center w-full p-3 border border-dashed border-gray-300 rounded-lg
                       text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors duration-200 ease-in-out
                       focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-75"
            onClick={() => setIsCreatingNew(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Topic
          </motion.button>
        ) : (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3"
          >
            <input
              type="text"
              className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-transparent text-gray-800"
              placeholder="Topic Name"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateNewTopic()}
            />
            <input
              type="text"
              className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-transparent text-gray-800"
              placeholder="Description (Optional)"
              value={newTopicDescription}
              onChange={(e) => setNewTopicDescription(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateNewTopic()}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors duration-200"
                onClick={() => setIsCreatingNew(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200"
                onClick={handleCreateNewTopic}
                disabled={!newTopicName.trim()}
              >
                Create
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default TopicSelector;
