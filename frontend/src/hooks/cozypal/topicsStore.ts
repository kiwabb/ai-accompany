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

const addTopic = (topic: Topic) => {
  topics = [...topics, topic];
  notify();
};

const fetchTopics = async () => {
  if (isFetching) return;
  isFetching = true;
  try {
    const response = await fetch('/api/topics');
    if (response.ok) {
      const data = await response.json();
      setTopics(data);
    }
  } catch (error) {
    console.error('Failed to fetch topics', error);
  } finally {
    isFetching = false;
  }
};

export const cozyPalTopicsStore = {
  subscribe,
  getSnapshot,
  fetchTopics,
  addTopic,
};
