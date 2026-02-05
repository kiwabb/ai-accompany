import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Message } from '../components/cozypal/types';
import type { ChatContext } from './cozypal/chatTypes';
import {
  buildChatRequestBody,
  buildChatHeaders,
  streamChatResponse,
  updateLastAiMessage,
  addPlaceholderAiMessage,
  addUserMessage,
} from './cozypal/chatStreamingUtils';

interface UseChatLogicProps {
  context: ChatContext;
  apiKey?: string;
  aiProvider?: string;
  aiModel?: string;
  documentId?: number;
  documentTitle?: string;
  documentContent?: string;
  activeTopicId: number | null;
  checkForMemoryUpdates: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  setHasUnread: React.Dispatch<React.SetStateAction<boolean>>;
  setAvatarState: React.Dispatch<React.SetStateAction<'idle' | 'thinking' | 'speaking' | 'focused'>>;
  setSpeechBubble: React.Dispatch<React.SetStateAction<string | null>>;
  speechBubbleTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

export const useChatLogic = ({
  context,
  apiKey,
  aiProvider,
  aiModel,
  documentId,
  documentTitle,
  documentContent,
  activeTopicId,
  checkForMemoryUpdates,
  setMessages,
  setIsLoading,
  isLoading,
  setHasUnread,
  setAvatarState,
  setSpeechBubble,
  speechBubbleTimerRef,
}: UseChatLogicProps) => {
  const { t } = useTranslation();

  const fetchHistory = useCallback(async (topicId: number | null) => {
    try {
      const url = topicId
        ? `/api/chat/history?topic_id=${topicId}&limit=10`
        : '/api/chat/history?limit=10';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages.map((msg: { role: string; content: string }) => ({
            sender: msg.role,
            text: msg.content,
          })));
        } else {
          setMessages([{ sender: 'ai', text: t('cozyPal.greeting') }]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch chat history', error);
    }
  }, [t, setMessages]);

  useEffect(() => {
    if (activeTopicId !== null) {
      fetchHistory(activeTopicId);
    }
  }, [activeTopicId, fetchHistory]);

  const sendMessage = useCallback(async (
    text: string,
    proactiveTrigger?: string,
    durationOverride?: number
  ) => {
    if (isLoading) return;

    const textToSend = proactiveTrigger || text.trim();
    if (!textToSend) return;

    // Clear any existing speech bubble timer
    if (proactiveTrigger && speechBubbleTimerRef.current) {
      clearTimeout(speechBubbleTimerRef.current);
      speechBubbleTimerRef.current = null;
    }

    // Setup UI state before request
    if (!proactiveTrigger) {
      addUserMessage(setMessages, textToSend);
      addPlaceholderAiMessage(setMessages);
    } else {
      setSpeechBubble('');
    }

    setIsLoading(true);
    setAvatarState('thinking');

    try {
      const response = await fetch('/api/chat/completions', {
        method: 'POST',
        headers: buildChatHeaders(apiKey),
        body: JSON.stringify(buildChatRequestBody({
          message: textToSend,
          topicId: activeTopicId,
          apiKey,
          provider: aiProvider,
          model: aiModel,
          context,
          documentId,
          documentTitle,
          documentContent,
          proactiveTrigger,
          durationOverride,
        })),
      });

      if (!response.ok) throw new Error('Failed to fetch');

      setAvatarState('speaking');

      await streamChatResponse(response, {
        onChunk: (accumulated) => {
          if (proactiveTrigger) {
            setSpeechBubble(accumulated);
          } else {
            updateLastAiMessage(setMessages, accumulated);
          }
        },
        onComplete: () => {
          if (proactiveTrigger) {
            speechBubbleTimerRef.current = setTimeout(() => {
              setSpeechBubble(null);
              speechBubbleTimerRef.current = null;
            }, 10000);
          } else {
            setHasUnread(true);
          }
          setAvatarState('idle');
          setTimeout(checkForMemoryUpdates, 3000);
        },
        onError: () => {},
      });
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = t('cozyPal.errorMessage');

      if (proactiveTrigger) {
        setSpeechBubble(errorMessage);
        speechBubbleTimerRef.current = setTimeout(() => {
          setSpeechBubble(null);
          speechBubbleTimerRef.current = null;
        }, 5000);
      } else {
        updateLastAiMessage(setMessages, errorMessage);
      }
      setAvatarState('idle');
    } finally {
      setIsLoading(false);
      setAvatarState('idle');
    }
  }, [
    isLoading, apiKey, context, t, aiProvider, aiModel,
    documentId, documentTitle, documentContent, activeTopicId,
    checkForMemoryUpdates, setMessages, setSpeechBubble, setIsLoading,
    setAvatarState, setHasUnread, speechBubbleTimerRef,
  ]);

  return { sendMessage };
};
