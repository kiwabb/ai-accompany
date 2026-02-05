import { getAuthHeaders } from '../../api/client';
import type { ChatRequestOptions, StreamCallbacks } from './chatTypes';
import type { Message } from '../../components/cozypal/types';

/**
 * Builds the request body for the chat API
 */
export function buildChatRequestBody(options: ChatRequestOptions): object {
  const {
    message,
    topicId,
    provider,
    model,
    context,
    documentId,
    documentTitle,
    documentContent,
    proactiveTrigger,
    durationOverride,
  } = options;

  return {
    message: proactiveTrigger ? `[SYSTEM_TRIGGER:${proactiveTrigger}]` : message,
    topic_id: topicId,
    provider,
    model,
    context: {
      theme_name: context.themeName,
      phase: context.phase,
      time_left: durationOverride !== undefined ? durationOverride : context.timeLeft,
      language: context.currentLanguage,
      ai_persona: context.aiPersona,
      daily_completed_pomodoros: context.dailyCompletedPomodoros,
      total_focus_minutes: context.totalFocusMinutes,
    },
    document_id: documentId,
    document_title: documentTitle,
    document_content: documentContent,
  };
}

/**
 * Builds headers for the chat API request
 */
export function buildChatHeaders(apiKey?: string): HeadersInit {
  const headers: HeadersInit = { ...getAuthHeaders() };
  if (apiKey) {
    headers['x-google-api-key'] = apiKey;
  }
  return headers;
}

/**
 * Streams a chat response and calls the provided callbacks
 */
export async function streamChatResponse(
  response: Response,
  callbacks: StreamCallbacks
): Promise<void> {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let accumulatedResponse = '';

  while (!done && reader) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    const chunkValue = decoder.decode(value);
    accumulatedResponse += chunkValue;
    callbacks.onChunk(accumulatedResponse);
  }

  callbacks.onComplete(accumulatedResponse);
}

/**
 * Updates the last AI message in the messages array
 */
export function updateLastAiMessage(
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  text: string
): void {
  setMessages((prev) => {
    const newMessages = [...prev];
    newMessages[newMessages.length - 1] = { sender: 'ai', text };
    return newMessages;
  });
}

/**
 * Adds a placeholder AI message for streaming
 */
export function addPlaceholderAiMessage(
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
): void {
  setMessages((prev) => [...prev, { sender: 'ai', text: '' }]);
}

/**
 * Adds a user message to the messages array
 */
export function addUserMessage(
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  text: string
): void {
  setMessages((prev) => [...prev, { sender: 'user', text }]);
}
