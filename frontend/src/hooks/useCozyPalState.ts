import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

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
    speechBubbleTimerRef: React.MutableRefObject<any>;
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

    const speechBubbleTimerRef = useRef<any>(null);
    const knownFactsRef = useRef<Set<string>>(new Set());
    const knownPrefsRef = useRef<Set<string>>(new Set());
    const isInitializedRef = useRef(false);

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
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizing) {
                const newWidth = window.innerWidth - e.clientX;
                if (newWidth > 300 && newWidth < 800) {
                    setWidth(newWidth);
                }
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const seedKnownMemory = useCallback((facts: string[], prefs: string[]) => {
        facts.forEach((fact) => knownFactsRef.current.add(fact));
        prefs.forEach((pref) => knownPrefsRef.current.add(pref));
        isInitializedRef.current = true;
    }, []);

    const fetchLatestMemoryUpdate = useCallback(async () => {
        const response = await fetch('/api/diagnostics/latest-memory-update');
        if (!response.ok) return null;
        return response.json();
    }, []);

    const seedMemoryCache = useCallback(async () => {
        try {
            const data = await fetchLatestMemoryUpdate();
            if (!data) return;
            if (data.has_update) {
                const newFacts = (data.facts as string[]) || [];
                const newPrefs = (data.preferences as string[]) || [];
                seedKnownMemory(newFacts, newPrefs);
            } else {
                isInitializedRef.current = true;
            }
        } catch (error) {
            console.error('Failed to check memory updates', error);
        }
    }, [fetchLatestMemoryUpdate, seedKnownMemory]);

    const checkForMemoryUpdates = useCallback(async () => {
        try {
            const data = await fetchLatestMemoryUpdate();
            if (!data) return;
            if (data.has_update) {
                const newFacts = (data.facts as string[]) || [];
                const newPrefs = (data.preferences as string[]) || [];

                if (!isInitializedRef.current) {
                    seedKnownMemory(newFacts, newPrefs);
                    return;
                }

                let addedFact = null;
                let addedPref = null;

                for (const fact of newFacts) {
                    if (!knownFactsRef.current.has(fact)) {
                        addedFact = fact;
                        knownFactsRef.current.add(fact);
                    }
                }
                for (const pref of newPrefs) {
                    if (!knownPrefsRef.current.has(pref)) {
                        addedPref = pref;
                        knownPrefsRef.current.add(pref);
                    }
                }

                if (addedFact) {
                    setToastMessage(`${t('cozyPal.memory.learned')}: ${addedFact}`);
                    setTimeout(() => setToastMessage(null), 4000);
                } else if (addedPref) {
                    setToastMessage(`${t('cozyPal.memory.learned')}: ${addedPref}`);
                    setTimeout(() => setToastMessage(null), 4000);
                }
            } else {
                isInitializedRef.current = true;
            }
        } catch (error) {
            console.error('Failed to check memory updates', error);
        }
    }, [fetchLatestMemoryUpdate, seedKnownMemory, t]);

    // Initial populate of known facts
    useEffect(() => {
        // Fetch once to seed the cache so we don't alert on existing memories
        void seedMemoryCache();
    }, [seedMemoryCache]);

    const toggleChat = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const state: CozyPalState = {
        isOpen,
        width,
        isResizing,
        mainTab,
        activeTab,
        hasUnread,
        avatarState,
        speechBubble,
        toastMessage,
        speechBubbleTimerRef,
        knownFactsRef,
        knownPrefsRef,
        isInitializedRef,
    };

    const actions: CozyPalActions = {
        setIsOpen,
        setWidth,
        setIsResizing,
        setMainTab,
        setActiveTab,
        setHasUnread,
        setAvatarState,
        setSpeechBubble,
        setToastMessage,
        startResizing,
        toggleChat,
        checkForMemoryUpdates,
    };

    return [state, actions];
};
