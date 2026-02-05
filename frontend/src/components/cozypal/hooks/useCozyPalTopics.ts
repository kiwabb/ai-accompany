import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { cozyPalTopicsStore } from '../../../hooks/cozypal/topicsStore';

const useCozyPalTopics = () => {
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

  const handleCreateTopic = useCallback(async (name: string, description?: string) => {
    try {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (response.ok) {
        const newTopic = await response.json();
        cozyPalTopicsStore.addTopic(newTopic);
        setSelectedTopicId(newTopic.id);
        setShowTopicSelector(false);
      }
    } catch (error) {
      console.error('Failed to create topic', error);
    }
  }, []);

  const setActiveTopicId = useCallback((topicId: number | null) => {
    setSelectedTopicId(topicId);
  }, []);

  useEffect(() => {
    void cozyPalTopicsStore.fetchTopics();
  }, []);

  return {
    topics,
    activeTopicId,
    setActiveTopicId,
    showTopicSelector,
    setShowTopicSelector,
    handleCreateTopic,
  };
};

export default useCozyPalTopics;
