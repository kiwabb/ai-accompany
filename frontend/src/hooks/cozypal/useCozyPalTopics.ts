import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { cozyPalTopicsStore } from './topicsStore';

export const useCozyPalTopics = () => {
  const topics = useSyncExternalStore(
    cozyPalTopicsStore.subscribe,
    cozyPalTopicsStore.getSnapshot,
    cozyPalTopicsStore.getSnapshot
  );
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [showTopicSelector, setShowTopicSelector] = useState(false);

  const activeTopicId = useMemo(() => {
    if (selectedTopicId !== null && topics.some((topic) => topic.id === selectedTopicId)) {
      return selectedTopicId;
    }
    return topics[0]?.id ?? null;
  }, [selectedTopicId, topics]);

  const handleCreateTopic = async (name: string, description?: string) => {
    try {
      const newTopic = await cozyPalTopicsStore.addTopicLocally(name, description);
      setSelectedTopicId(newTopic.id);
      setShowTopicSelector(false);
    } catch (error) {
      console.error('Failed to create topic', error);
    }
  };

  const handleSelectTopic = (topicId: number) => {
    setSelectedTopicId(topicId);
    setShowTopicSelector(false);
  };

  useEffect(() => {
    void cozyPalTopicsStore.fetchTopics();
  }, []);

  return {
    topics,
    activeTopicId,
    showTopicSelector,
    setShowTopicSelector,
    handleSelectTopic,
    handleCreateTopic,
  };
};
