export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
}

function getStorageKey(topicId: number | null): string {
  const tid = topicId !== null ? topicId : 'default';
  return `cozypal_chat_history_${tid}`;
}

export async function getChatHistory(
  topicId: number | null,
  limit?: number
): Promise<ChatHistoryResponse> {
  const key = getStorageKey(topicId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { messages: [] };
    const parsed = JSON.parse(raw);
    const messages = Array.isArray(parsed) ? parsed : [];
    
    if (limit && limit > 0) {
      return { messages: messages.slice(-limit) };
    }
    return { messages };
  } catch {
    return { messages: [] };
  }
}

export async function saveChatMessage(
  topicId: number | null,
  role: 'user' | 'ai',
  content: string
): Promise<void> {
  const key = getStorageKey(topicId);
  const response = await getChatHistory(topicId);
  const messages = response.messages;
  messages.push({ role, content });
  localStorage.setItem(key, JSON.stringify(messages));
}
