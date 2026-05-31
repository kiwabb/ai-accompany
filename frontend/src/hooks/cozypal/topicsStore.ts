import { getTopics, createTopic as localCreateTopic } from '../../lib/storage/topics';
import type { Topic } from '../../components/cozypal/types';

type TopicsListener = () => void;

let topics: Topic[] = [];
let isFetching = false;
const listeners = new Set<TopicsListener>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: TopicsListener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => topics;

const setTopics = (nextTopics: Topic[]) => {
  topics = nextTopics;
  notify();
};

const fetchTopics = async () => {
  if (isFetching) return;
  isFetching = true;
  try {
    const data = await getTopics();
    setTopics(data);
  } catch (error) {
    console.error('Failed to fetch topics', error);
  } finally {
    isFetching = false;
  }
};

const addTopicLocally = async (name: string, description?: string): Promise<Topic> => {
  const newTopic = await localCreateTopic(name, description);
  topics = [...topics, newTopic];
  notify();
  return newTopic;
};

export const cozyPalTopicsStore = {
  subscribe,
  getSnapshot,
  fetchTopics,
  addTopicLocally,
};
