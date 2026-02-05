import React from 'react';
import type { Message, Topic } from './types';
import { useChatLogic } from '../../hooks/useChatLogic';
import { ChatHeader } from './chat/ChatHeader';
import { MessageList } from './chat/MessageList';
import { ChatInputForm } from './chat/ChatInputForm';

interface ChatPanelProps {
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
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setHasUnread: React.Dispatch<React.SetStateAction<boolean>>;
    setAvatarState: React.Dispatch<React.SetStateAction<'idle' | 'thinking' | 'speaking' | 'focused'>>;
    setSpeechBubble: React.Dispatch<React.SetStateAction<string | null>>;
    speechBubbleTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
    checkForMemoryUpdates: () => void;
    topics: Topic[];
    activeTopicId: number | null;
    setActiveTopicId: React.Dispatch<React.SetStateAction<number | null>>;
    showTopicSelector: boolean;
    setShowTopicSelector: React.Dispatch<React.SetStateAction<boolean>>;
    onHandleCreateTopic: (name: string, description?: string) => Promise<void>;
    inputRef: React.RefObject<HTMLInputElement | null>;
}

const ChatPanel: React.FC<ChatPanelProps> = (props) => {
    const { sendMessage } = useChatLogic({
        context: {
            themeName: props.themeName,
            phase: props.phase,
            timeLeft: props.timeLeft,
            currentLanguage: props.currentLanguage,
            aiPersona: props.aiPersona,
            dailyCompletedPomodoros: props.dailyCompletedPomodoros,
            totalFocusMinutes: props.totalFocusMinutes,
        },
        apiKey: props.apiKey,
        aiProvider: props.aiProvider,
        aiModel: props.aiModel,
        documentId: props.documentId,
        documentTitle: props.documentTitle,
        documentContent: props.documentContent,
        activeTopicId: props.activeTopicId,
        checkForMemoryUpdates: props.checkForMemoryUpdates,
        setMessages: props.setMessages,
        setIsLoading: props.setIsLoading,
        isLoading: props.isLoading,
        setHasUnread: props.setHasUnread,
        setAvatarState: props.setAvatarState,
        setSpeechBubble: props.setSpeechBubble,
        speechBubbleTimerRef: props.speechBubbleTimerRef,
    });

    return (
        <>
            <ChatHeader
                topics={props.topics}
                activeTopicId={props.activeTopicId}
                showTopicSelector={props.showTopicSelector}
                setShowTopicSelector={props.setShowTopicSelector}
                setActiveTopicId={props.setActiveTopicId}
                onHandleCreateTopic={props.onHandleCreateTopic}
            />

            <MessageList
                messages={props.messages}
                isLoading={props.isLoading}
            />

            <ChatInputForm
                inputRef={props.inputRef}
                isLoading={props.isLoading}
                onSendMessage={sendMessage}
            />
        </>
    );
};

export default ChatPanel;
