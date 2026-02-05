import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuthHeaders } from '../../api/client';
import type { Message } from '../../components/cozypal/types';

interface UseChatLogicProps {
    themeName: string;
    phase: string;
    timeLeft: number;
    apiKey?: string;
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
    checkForMemoryUpdates: () => void;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    isLoading: boolean;
    setHasUnread: React.Dispatch<React.SetStateAction<boolean>>;
    setAvatarState: React.Dispatch<React.SetStateAction<'idle' | 'thinking' | 'speaking' | 'focused'>>;
    setSpeechBubble: React.Dispatch<React.SetStateAction<string | null>>;
    speechBubbleTimerRef: React.MutableRefObject<any>;
}

export const useChatLogic = ({
    themeName,
    phase,
    timeLeft,
    apiKey,
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
                    setMessages(data.messages.map((msg: any) => ({
                        sender: msg.role,
                        text: msg.content
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

    const sendMessage = useCallback(async (text: string, proactiveTrigger?: string, durationOverride?: number) => {
        if (isLoading) return;

        const textToSend = proactiveTrigger || text.trim();
        if (!textToSend) return;

        if (proactiveTrigger && speechBubbleTimerRef.current) {
            clearTimeout(speechBubbleTimerRef.current);
            speechBubbleTimerRef.current = null;
        }

        if (!proactiveTrigger) {
            const userMessage: Message = { sender: 'user', text: textToSend };
            setMessages((prev) => [...prev, userMessage]);
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
                headers: headers,
                body: JSON.stringify({
                    message: proactiveTrigger ? `[SYSTEM_TRIGGER:${proactiveTrigger}]` : textToSend,
                    topic_id: activeTopicId,
                    provider: aiProvider,
                    model: aiModel,
                    context: {
                        theme_name: themeName,
                        phase: phase,
                        time_left: durationOverride !== undefined ? durationOverride : timeLeft,
                        language: currentLanguage,
                        ai_persona: aiPersona,
                        daily_completed_pomodoros: dailyCompletedPomodoros,
                        total_focus_minutes: totalFocusMinutes
                    },
                    document_id: documentId,
                    document_title: documentTitle,
                    document_content: documentContent
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
            } else {
                setHasUnread(true);
            }
            setAvatarState('idle');
            setTimeout(() => {
                checkForMemoryUpdates();
            }, 3000);
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
                setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { sender: 'ai', text: errorMessage };
                    return newMessages;
                });
            }
            setAvatarState('idle');
        } finally {
            setIsLoading(false);
            setAvatarState('idle');
        }
    }, [isLoading, apiKey, themeName, phase, timeLeft, t, currentLanguage, aiPersona, aiProvider, aiModel, dailyCompletedPomodoros, totalFocusMinutes, documentId, documentTitle, documentContent, activeTopicId, checkForMemoryUpdates, setMessages, setSpeechBubble, setIsLoading, setAvatarState, setHasUnread, speechBubbleTimerRef]);

    return {
        sendMessage
    };
};
