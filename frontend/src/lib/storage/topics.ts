import type { Topic } from '../../components/cozypal/types';

const STORAGE_KEY = 'cozypal_topics';

const DEFAULT_TOPICS: Topic[] = [
  { id: 1, name: '默认学习对话', description: '日常的专注与学习陪伴交流' }
];

export async function getTopics(): Promise<Topic[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TOPICS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TOPICS;
  } catch {
    return DEFAULT_TOPICS;
  }
}

export async function createTopic(name: string, description?: string): Promise<Topic> {
  const list = await getTopics();
  const newTopic: Topic = {
    id: Date.now(),
    name,
    description,
  };
  list.push(newTopic);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return newTopic;
}

export async function deleteTopic(id: number): Promise<void> {
  const list = await getTopics();
  const updated = list.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Also clean up associated chat history
  try {
    localStorage.removeItem(`cozypal_chat_history_${id}`);
  } catch {
    // ignore
  }
}
