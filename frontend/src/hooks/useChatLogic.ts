import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Message } from '../components/cozypal/types';
import type { ChatContext } from './cozypal/chatTypes';
import {
  streamChatResponse,
  updateLastAiMessage,
  addPlaceholderAiMessage,
  addUserMessage,
} from './cozypal/chatStreamingUtils';
import { getChatHistory, saveChatMessage } from '../lib/storage/chatHistory';
import { getUserProfile } from '../lib/storage/userProfile';
import { constructSystemPrompt } from '../lib/ai/systemPrompt';
import { streamChatDirect } from '../lib/ai/providers';

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
    if (topicId === null) return;
    try {
      const data = await getChatHistory(topicId, 10);
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages.map((msg: { role: string; content: string }) => ({
          sender: msg.role as 'user' | 'ai',
          text: msg.content,
        })));
      } else {
        setMessages([{ sender: 'ai', text: t('cozyPal.greeting') }]);
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
      // 1. Compile System Prompt combining UserProfile and current Pomodoro Context
      const userProfile = getUserProfile();
      
      // Inject Document context if reading a document
      const docSuffix = documentId && documentTitle && documentContent 
        ? `\n\n[Current Document Context]\nDocument ID: ${documentId}\nTitle: ${documentTitle}\nContent Snippet: ${documentContent.slice(0, 800)}\n[End of Document Context]`
        : '';
        
      const systemPrompt = constructSystemPrompt(
        {
          themeName: context.themeName,
          phase: context.phase,
          timeLeft: durationOverride !== undefined ? durationOverride : context.timeLeft,
          aiPersona: context.aiPersona,
        },
        context.totalFocusMinutes,
        context.dailyCompletedPomodoros,
        context.currentLanguage,
        textToSend,
        userProfile
      ) + docSuffix;

      // 2. Fetch history
      const historyData = await getChatHistory(activeTopicId, 10);
      const history = (historyData.messages || []).map((m: any) => ({
        sender: m.role as 'user' | 'ai',
        text: m.content,
      }));

      // 3. Connect browser direct streaming APIs
      const stream = streamChatDirect({
        message: textToSend,
        systemPrompt,
        history,
        apiKey: apiKey || '',
        provider: aiProvider || 'gemini',
        model: aiModel,
      });

      setAvatarState('speaking');

      await streamChatResponse(stream, {
        onChunk: (accumulated) => {
          if (proactiveTrigger) {
            setSpeechBubble(accumulated);
          } else {
            updateLastAiMessage(setMessages, accumulated);
          }
        },
        onComplete: async (accumulated) => {
          // Persist the dialog locally
          try {
            await saveChatMessage(activeTopicId, 'user', textToSend);
            await saveChatMessage(activeTopicId, 'ai', accumulated);
          } catch (storageErr) {
            console.error('Failed to save message to local storage:', storageErr);
          }

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
