import { useCallback, useEffect, useRef, useState } from 'react';
import type { TFunction } from 'i18next';
import { getAuthHeaders } from '../../../api/client';
import type { Message } from '../types';

interface UseCozyPalChatOptions {
  t: TFunction;
  apiKey?: string;
  themeName: string;
  phase: string;
  timeLeft: number;
  currentLanguage: string;
  aiPersona: string;
  aiProvider?: string;
  aiModel?: string;
  dailyCompletedPomodoros: number;
  totalFocusMinutes: number;
  documentId?: number;
  documentTitle?: string;
  documentContent?: string;
  activeTopicId: number | null;
  onMemoryUpdate: () => void;
}

const useCozyPalChat = ({
  t,
  apiKey,
  themeName,
  phase,
  timeLeft,
  currentLanguage,
  aiPersona,
  aiProvider,
  aiModel,
  dailyCompletedPomodoros,
  totalFocusMinutes,
  documentId,
  documentTitle,
  documentContent,
  activeTopicId,
  onMemoryUpdate,
}: UseCozyPalChatOptions) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [avatarState, setAvatarState] = useState<'idle' | 'thinking' | 'speaking' | 'focused'>('idle');
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const speechBubbleTimerRef = useRef<any>(null);

  const loadHistory = useCallback(async (topicId: number | null) => {
    try {
      const url = topicId
        ? `/api/chat/history?topic_id=${topicId}&limit=10`
        : '/api/chat/history?limit=10';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages.map((msg: { role: Message['sender']; content: string }) => ({
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
  }, [t]);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (!isOpen && messages.length === 0) {
      setMessages([{ sender: 'ai', text: t('cozyPal.greeting') }]);
    }
  }, [isOpen, messages.length, t]);

  const sendMessage = useCallback(async (
    event?: React.FormEvent | React.KeyboardEvent,
    proactiveTrigger?: string,
    durationOverride?: number,
  ) => {
    if (event && 'key' in event && event.key !== 'Enter') return;
    if (event) event.preventDefault();

    const textToSend = proactiveTrigger || inputValue.trim();
    if (!textToSend || isLoading) return;

    if (proactiveTrigger && speechBubbleTimerRef.current) {
      clearTimeout(speechBubbleTimerRef.current);
      speechBubbleTimerRef.current = null;
    }

    if (!proactiveTrigger) {
      const userMessage: Message = { sender: 'user', text: textToSend };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
    } else {
      setSpeechBubble('');
    }

    setIsLoading(true);
    setAvatarState('thinking');
    if (!proactiveTrigger) {
      setMessages((prev) => [...prev, { sender: 'ai', text: '' }]);
    }

    try {
      const headers: HeadersInit = {
        ...getAuthHeaders(),
      };
      if (apiKey) {
        headers['x-google-api-key'] = apiKey;
      }

      const response = await fetch('/api/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: proactiveTrigger ? `[SYSTEM_TRIGGER:${proactiveTrigger}]` : textToSend,
          topic_id: activeTopicId,
          provider: aiProvider,
          model: aiModel,
          context: {
            theme_name: themeName,
            phase,
            time_left: durationOverride !== undefined ? durationOverride : timeLeft,
            language: currentLanguage,
            ai_persona: aiPersona,
            daily_completed_pomodoros: dailyCompletedPomodoros,
            total_focus_minutes: totalFocusMinutes,
          },
          document_id: documentId,
          document_title: documentTitle,
          document_content: documentContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedResponse = '';

      setAvatarState('speaking');

      while (!done && reader) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        accumulatedResponse += chunkValue;

        if (proactiveTrigger) {
          setSpeechBubble(accumulatedResponse);
        } else {
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { sender: 'ai', text: accumulatedResponse };
            return newMessages;
          });
        }
      }

      if (proactiveTrigger) {
        speechBubbleTimerRef.current = setTimeout(() => {
          setSpeechBubble(null);
          speechBubbleTimerRef.current = null;
        }, 10000);
      } else if (!isOpen) {
        setHasUnread(true);
      }
      setAvatarState('idle');
      setTimeout(() => {
        onMemoryUpdate();
      }, 3000);
    } catch (error) {
      console.error('Chat error:', error);
      if (proactiveTrigger) {
        setSpeechBubble(t('cozyPal.errorMessage'));
        speechBubbleTimerRef.current = setTimeout(() => {
          setSpeechBubble(null);
          speechBubbleTimerRef.current = null;
        }, 5000);
      } else {
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { sender: 'ai', text: t('cozyPal.errorMessage') };
          return newMessages;
        });
      }
      setAvatarState('idle');
    } finally {
      setIsLoading(false);
      setAvatarState('idle');
    }
  }, [
    activeTopicId,
    aiModel,
    aiPersona,
    aiProvider,
    apiKey,
    currentLanguage,
    dailyCompletedPomodoros,
    documentContent,
    documentId,
    documentTitle,
    inputValue,
    isLoading,
    isOpen,
    onMemoryUpdate,
    phase,
    t,
    themeName,
    timeLeft,
    totalFocusMinutes,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (phase === 'focus' && timeLeft > 0 && !isOpen && !isLoading) {
      setAvatarState('focused');
    } else if (!isLoading && avatarState !== 'thinking' && avatarState !== 'speaking') {
      setAvatarState('idle');
    }
  }, [messages, phase, timeLeft, isOpen, isLoading, avatarState]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTopicId !== null) {
      loadHistory(activeTopicId);
    }
  }, [activeTopicId, loadHistory]);

  return {
    isOpen,
    setIsOpen,
    toggleChat,
    messages,
    setMessages,
    inputValue,
    setInputValue,
    isLoading,
    hasUnread,
    avatarState,
    setAvatarState,
    speechBubble,
    setSpeechBubble,
    sendMessage,
    messagesEndRef,
    inputRef,
    speechBubbleTimerRef,
    loadHistory,
  };
};

export default useCozyPalChat;
