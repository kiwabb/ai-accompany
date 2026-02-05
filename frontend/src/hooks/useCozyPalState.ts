import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fetchLatestMemoryUpdate,
  seedKnownMemory,
  detectNewMemoryItems,
  showMemoryLearnedToast,
} from './cozypal/memoryCheckUtils';

export interface CozyPalState {
    isOpen: boolean;
    width: number;
    isResizing: boolean;
    mainTab: 'companion' | 'gemini';
    activeTab: 'chat' | 'memory' | 'debug';
    hasUnread: boolean;
    avatarState: 'idle' | 'thinking' | 'speaking' | 'focused';
    speechBubble: string | null;
    toastMessage: string | null;
    speechBubbleTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
    knownFactsRef: React.MutableRefObject<Set<string>>;
    knownPrefsRef: React.MutableRefObject<Set<string>>;
    isInitializedRef: React.MutableRefObject<boolean>;
}

export interface CozyPalActions {
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setWidth: React.Dispatch<React.SetStateAction<number>>;
    setIsResizing: React.Dispatch<React.SetStateAction<boolean>>;
    setMainTab: React.Dispatch<React.SetStateAction<'companion' | 'gemini'>>;
    setActiveTab: React.Dispatch<React.SetStateAction<'chat' | 'memory' | 'debug'>>;
    setHasUnread: React.Dispatch<React.SetStateAction<boolean>>;
    setAvatarState: React.Dispatch<React.SetStateAction<'idle' | 'thinking' | 'speaking' | 'focused'>>;
    setSpeechBubble: React.Dispatch<React.SetStateAction<string | null>>;
    setToastMessage: React.Dispatch<React.SetStateAction<string | null>>;
    startResizing: (mouseDownEvent: React.MouseEvent) => void;
    toggleChat: () => void;
    checkForMemoryUpdates: () => void;
}

export const useCozyPalState = (onDimensionsChange?: (width: number) => void): [CozyPalState, CozyPalActions] => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [width, setWidth] = useState(450);
    const [isResizing, setIsResizing] = useState(false);
    const [mainTab, setMainTab] = useState<'companion' | 'gemini'>('companion');
    const [activeTab, setActiveTab] = useState<'chat' | 'memory' | 'debug'>('chat');
    const [hasUnread, setHasUnread] = useState(false);
    const [avatarState, setAvatarState] = useState<'idle' | 'thinking' | 'speaking' | 'focused'>('idle');
    const [speechBubble, setSpeechBubble] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const speechBubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const knownFactsRef = useRef<Set<string>>(new Set());
    const knownPrefsRef = useRef<Set<string>>(new Set());
    const isInitializedRef = useRef(false);

    const refs = { knownFactsRef, knownPrefsRef, isInitializedRef };

    useEffect(() => {
        if (onDimensionsChange) {
            onDimensionsChange(isOpen ? width : 0);
        }
    }, [isOpen, width, onDimensionsChange]);

    const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        setIsResizing(true);
    }, []);

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 300 && newWidth < 800) {
                setWidth(newWidth);
            }
        };
        const handleMouseUp = () => setIsResizing(false);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const checkForMemoryUpdates = useCallback(async () => {
        const data = await fetchLatestMemoryUpdate();
        if (!data) return;

        if (data.has_update) {
            const newFacts = data.facts || [];
            const newPrefs = data.preferences || [];

            if (!isInitializedRef.current) {
                seedKnownMemory(newFacts, newPrefs, refs);
                return;
            }

            const result = detectNewMemoryItems(newFacts, newPrefs, refs);
            showMemoryLearnedToast(result, t, setToastMessage);
        } else {
            isInitializedRef.current = true;
        }
    }, [t]);

    useEffect(() => {
        void checkForMemoryUpdates();
    }, [checkForMemoryUpdates]);

    const toggleChat = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const state: CozyPalState = {
        isOpen, width, isResizing, mainTab, activeTab, hasUnread,
        avatarState, speechBubble, toastMessage, speechBubbleTimerRef,
        knownFactsRef, knownPrefsRef, isInitializedRef,
    };

    const actions: CozyPalActions = {
        setIsOpen, setWidth, setIsResizing, setMainTab, setActiveTab,
        setHasUnread, setAvatarState, setSpeechBubble, setToastMessage,
        startResizing, toggleChat, checkForMemoryUpdates,
    };

    return [state, actions];
};
