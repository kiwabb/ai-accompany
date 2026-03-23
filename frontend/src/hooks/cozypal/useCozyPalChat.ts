import { useCallback, useEffect, useRef, useState } from 'react';
import type { TFunction } from 'i18next';
import type { Message } from '../../components/cozypal/types';
import type { ChatContext } from './chatTypes';
import {
  buildChatRequestBody,
  buildChatHeaders,
  streamChatResponse,
  updateLastAiMessage,
  addPlaceholderAiMessage,
  addUserMessage,
} from './chatStreamingUtils';
import { getAuthHeaders } from '../../api/client';

interface UseCozyPalChatOptions {
  t: TFunction;
  apiKey?: string;
  context: ChatContext;
  aiProvider?: string;
  aiModel?: string;
  documentId?: number;
  documentTitle?: string;
  documentContent?: string;
  isOpen: boolean;
  activeTopicId: number | null;
  onMemoryUpdateCheck: () => void;
}

interface CozyPalChatState {
  messages: Message[];
  inputValue: string;
  setInputValue: (value: string) => void;
  isLoading: boolean;
  hasUnread: boolean;
  setHasUnread: (value: boolean) => void;
  avatarState: 'idle' | 'thinking' | 'speaking' | 'focused';
  speechBubble: string | null;
  sendMessage: (e?: { preventDefault: () => void; key?: string }, proactiveTrigger?: string, durationOverride?: number) => Promise<void>;
  ensureGreeting: () => void;
}

export const useCozyPalChat = ({
  t,
  apiKey,
  context,
  aiProvider,
  aiModel,
  documentId,
  documentTitle,
  documentContent,
  isOpen,
  activeTopicId,
  onMemoryUpdateCheck,
}: UseCozyPalChatOptions): CozyPalChatState => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [avatarState, setAvatarState] = useState<'idle' | 'thinking' | 'speaking' | 'focused'>('idle');
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const speechBubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchHistory = useCallback(async () => {
    if (activeTopicId === null) return;
    try {
      const url = activeTopicId
        ? `/api/chat/history?topic_id=${activeTopicId}&limit=10`
        : '/api/chat/history?limit=10';
      const response = await fetch(url, { headers: getAuthHeaders() });
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
  }, [activeTopicId, t]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (context.phase === 'focus' && context.timeLeft > 0 && !isOpen && !isLoading) {
      setAvatarState('focused');
    } else if (!isLoading && avatarState !== 'thinking' && avatarState !== 'speaking') {
      setAvatarState('idle');
    }
  }, [isOpen, isLoading, context.phase, context.timeLeft, avatarState]);

  const sendMessage = useCallback(async (
    e?: { preventDefault: () => void; key?: string },
    proactiveTrigger?: string,
    durationOverride?: number
  ) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    if (e) e.preventDefault();

    const textToSend = proactiveTrigger || inputValue.trim();
    if (!textToSend || isLoading) return;

    // Clear any existing speech bubble timer
    if (proactiveTrigger && speechBubbleTimerRef.current) {
      clearTimeout(speechBubbleTimerRef.current);
      speechBubbleTimerRef.current = null;
    }

    // Setup UI state before request
    if (!proactiveTrigger) {
      addUserMessage(setMessages, textToSend);
      setInputValue('');
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
          } else if (!isOpen) {
            setHasUnread(true);
          }
          setAvatarState('idle');
          setTimeout(onMemoryUpdateCheck, 3000);
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
    activeTopicId, aiModel, aiProvider, apiKey, context,
    documentContent, documentId, documentTitle, inputValue,
    isLoading, isOpen, onMemoryUpdateCheck, t,
  ]);

  const ensureGreeting = useCallback(() => {
    if (messages.length === 0) {
      setMessages([{ sender: 'ai', text: t('cozyPal.greeting') }]);
    }
  }, [messages.length, t]);

  return {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    hasUnread,
    setHasUnread,
    avatarState,
    speechBubble,
    sendMessage,
    ensureGreeting,
  };
};
