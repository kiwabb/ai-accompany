import type { ChatRequestOptions, StreamCallbacks } from './chatTypes';
import type { Message } from '../../components/cozypal/types';

/**
 * Builds the context payload for local prompt generation
 */
export function buildChatContext(options: ChatRequestOptions): object {
  const { context, durationOverride } = options;
  return {
    theme_name: context.themeName,
    phase: context.phase,
    time_left: durationOverride !== undefined ? durationOverride : context.timeLeft,
    language: context.currentLanguage,
    ai_persona: context.aiPersona,
    daily_completed_pomodoros: context.dailyCompletedPomodoros,
    total_focus_minutes: context.totalFocusMinutes,
  };
}

/**
 * Streams a chat response from an AsyncIterable and calls the provided callbacks
 */
export async function streamChatResponse(
  stream: AsyncIterable<string>,
  callbacks: StreamCallbacks
): Promise<void> {
  let accumulatedResponse = '';
  try {
    for await (const chunkValue of stream) {
      accumulatedResponse += chunkValue;
      callbacks.onChunk(accumulatedResponse);
    }
    callbacks.onComplete(accumulatedResponse);
  } catch (error) {
    if (callbacks.onError) {
      callbacks.onError(error instanceof Error ? error.message : String(error));
    }
    throw error;
  }
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
