import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Trash2, Edit3, X, Check } from 'lucide-react';
import CozyAvatar from './CozyAvatar';
import TopicSelector from './TopicSelector';
import MemoryToast from './MemoryToast';
import { getAuthHeaders } from '../api/client';

interface Topic {
  id: number;
  name: string;
  description?: string;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface DiagnosticData {
  system_prompt: string;
  memory_fragments: { id: number; content: string; score: number }[];
  user_profile: { facts?: string[]; preferences?: string[] };
  full_prompt: string;
  timestamp: string | null;
}

interface CozyPalProps {
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
  onDimensionsChange?: (width: number) => void;
}

export interface CozyPalHandle {
  triggerProactiveMessage: (type: 'focus_start' | 'focus_end' | 'break_start' | 'break_end' | 'focus_near_end' | 'break_near_end' | 'focus_completed', durationOverride?: number) => void;
}

const CozyPal = forwardRef<CozyPalHandle, CozyPalProps>(({ themeName, phase, timeLeft, apiKey, currentLanguage, aiPersona, aiProvider, aiModel, dailyCompletedPomodoros, totalFocusMinutes, documentId, documentTitle, documentContent, onDimensionsChange }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const [mainTab, setMainTab] = useState<'companion' | 'gemini'>('companion');
  const [activeTab, setActiveTab] = useState<'chat' | 'memory' | 'debug'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [avatarState, setAvatarState] = useState<'idle' | 'thinking' | 'speaking' | 'focused'>('idle');
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeTopicId, setActiveTopicId] = useState<number | null>(null);
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticData | null>(null);
  const [memoryFragments, setMemoryFragments] = useState<{ id: number; content: string; created_at: string }[]>([]);
  const [isDiagLoading, setIsDiagLoading] = useState(false);
  const [editingFragment, setEditingFragment] = useState<{ id: number; content: string } | null>(null);
  const [editingProfileItem, setEditingProfileItem] = useState<{ category: 'facts' | 'preferences'; value: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const speechBubbleTimerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const knownFactsRef = useRef<Set<string>>(new Set());
  const knownPrefsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);
  const { t } = useTranslation();

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

  const checkForMemoryUpdates = useCallback(async () => {
    try {
      const response = await fetch('/api/diagnostics/latest-memory-update');
      if (response.ok) {
        const data = await response.json();
        if (data.has_update) {
          const newFacts = (data.facts as string[]) || [];
          const newPrefs = (data.preferences as string[]) || [];

          let addedFact = null;
          let addedPref = null;

          if (!isInitializedRef.current) {
            newFacts.forEach(f => knownFactsRef.current.add(f));
            newPrefs.forEach(p => knownPrefsRef.current.add(p));
            isInitializedRef.current = true;
            return;
          }

          for (const f of newFacts) {
            if (!knownFactsRef.current.has(f)) {
              addedFact = f;
              knownFactsRef.current.add(f);
            }
          }
          for (const p of newPrefs) {
            if (!knownPrefsRef.current.has(p)) {
              addedPref = p;
              knownPrefsRef.current.add(p);
            }
          }

          if (addedFact) {
            setToastMessage(`${t('cozyPal.memory.learned')}: ${addedFact}`);
            fetchMemoryFragments();
            setTimeout(() => setToastMessage(null), 4000);
          } else if (addedPref) {
            setToastMessage(`${t('cozyPal.memory.learned')}: ${addedPref}`);
            fetchMemoryFragments();
            setTimeout(() => setToastMessage(null), 4000);
          }
        } else {
          isInitializedRef.current = true;
        }
      }
    } catch (error) {
      console.error('Failed to check memory updates', error);
    }
  }, [t]);

  // Initial populate of known facts
  useEffect(() => {
    // Fetch once to seed the cache so we don't alert on existing memories
    checkForMemoryUpdates();
  }, []);

  const fetchDiagnostics = useCallback(async () => {
    setIsDiagLoading(true);
    try {
      const response = await fetch('/api/diagnostics/last-exchange');
      if (response.ok) {
        const data = await response.json();
        setDiagnostics(data);
      }
    } catch (error) {
      console.error('Failed to fetch diagnostics', error);
    } finally {
      setIsDiagLoading(false);
    }
  }, []);

  const fetchMemoryFragments = useCallback(async () => {
    try {
      const response = await fetch('/api/diagnostics/memory/fragments');
      if (response.ok) {
        const data = await response.json();
        setMemoryFragments(data);
      }
    } catch (error) {
      console.error('Failed to fetch memory fragments', error);
    }
  }, []);

  const handleUpdateFragment = async () => {
    if (!editingFragment) return;
    setIsSavingEdit(true);
    try {
      const response = await fetch(`/api/diagnostics/memory/fragments/${editingFragment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editValue }),
      });
      if (response.ok) {
        setEditingFragment(null);
        fetchDiagnostics();
        fetchMemoryFragments();
      }
    } catch (error) {
      console.error('Failed to update fragment', error);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteFragment = async (id: number) => {
    try {
      const response = await fetch(`/api/diagnostics/memory/fragments/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchMemoryFragments();
        fetchDiagnostics();
      }
    } catch (error) {
      console.error('Failed to delete fragment', error);
    }
  };

  const handleDeleteProfileItem = async (category: 'facts' | 'preferences', value: string) => {
    try {
      const response = await fetch(`/api/diagnostics/profile/${category}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      if (response.ok) {
        if (category === 'facts') knownFactsRef.current.delete(value);
        else knownPrefsRef.current.delete(value);

        fetchDiagnostics();
      }
    } catch (error) {
      console.error(`Failed to delete ${category} item`, error);
    }
  };

  const handleUpdateProfileItem = async () => {
    if (!editingProfileItem) return;
    setIsSavingEdit(true);
    try {
      const response = await fetch(`/api/diagnostics/profile/${editingProfileItem.category}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          old_value: editingProfileItem.value,
          new_value: editValue
        }),
      });
      if (response.ok) {
        if (editingProfileItem.category === 'facts') {
          knownFactsRef.current.delete(editingProfileItem.value);
          knownFactsRef.current.add(editValue);
        } else {
          knownPrefsRef.current.delete(editingProfileItem.value);
          knownPrefsRef.current.add(editValue);
        }

        setEditingProfileItem(null);
        fetchDiagnostics();
      }
    } catch (error) {
      console.error(`Failed to update ${editingProfileItem.category} item`, error);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleResetMemory = async () => {
    if (!window.confirm(t('cozyPal.memory.resetConfirm'))) return;
    setIsSavingEdit(true);
    try {
      const response = await fetch('/api/diagnostics/reset', { method: 'POST' });
      if (response.ok) {
        knownFactsRef.current.clear();
        knownPrefsRef.current.clear();
        setDiagnostics(null);
        setMemoryFragments([]);
        fetchDiagnostics();
        fetchMemoryFragments();
        setToastMessage(t('common.reset'));
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (error) {
      console.error('Failed to reset memory', error);
    } finally {
      setIsSavingEdit(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'debug' || activeTab === 'memory') {
      fetchDiagnostics();
    }
    if (activeTab === 'memory') {
      fetchMemoryFragments();
    }
  }, [activeTab, fetchDiagnostics, fetchMemoryFragments]);

  const renderHighlightedPrompt = () => {
    if (!diagnostics || !diagnostics.full_prompt) return 'No prompt data.';

    let content = diagnostics.full_prompt;
    const fragments = diagnostics.memory_fragments || [];

    // Sort fragments by length descending to match longer strings first
    const sortedFragments = [...fragments].sort((a, b) => b.content.length - a.content.length);

    // Simple replacement for now, could be improved with a proper parser
    // for handling overlapping fragments.
    let parts: (string | JSX.Element)[] = [content];

    sortedFragments.forEach((fragment) => {
      const newParts: (string | JSX.Element)[] = [];
      parts.forEach((part) => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }

        const subParts = part.split(fragment.content);
        subParts.forEach((subPart, idx) => {
          newParts.push(subPart);
          if (idx < subParts.length - 1) {
            newParts.push(
              <motion.span
                key={`${fragment.id}-${idx}`}
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  setEditingFragment({ id: fragment.id, content: fragment.content });
                  setEditValue(fragment.content);
                }}
                className="bg-purple-100 text-purple-900 px-1 rounded border border-purple-200 cursor-pointer hover:bg-purple-200 transition-colors relative group mx-0.5 inline-block"
              >
                {fragment.content}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-[8px] py-1 px-2 rounded whitespace-nowrap z-40 shadow-xl">
                  {t('cozyPal.debug.score')}: {fragment.score.toFixed(4)} ({t('cozyPal.debug.clickToEdit')})
                </span>
              </motion.span>
            );
          }
        });
      });
      parts = newParts;
    });

    return parts;
  };

  const fetchTopics = useCallback(async () => {
    try {
      const response = await fetch('/api/topics');
      if (response.ok) {
        const data = await response.json();
        setTopics(data);
      }
    } catch (error) {
      console.error('Failed to fetch topics', error);
    }
  }, []);

  const handleCreateTopic = async (name: string, description?: string) => {
    try {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (response.ok) {
        const newTopic = await response.json();
        setTopics(prev => [...prev, newTopic]);
        setActiveTopicId(newTopic.id);
        setShowTopicSelector(false);
      }
    } catch (error) {
      console.error('Failed to create topic', error);
    }
  };

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
  }, [t]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  useEffect(() => {
    if (topics.length > 0 && activeTopicId === null) {
      setActiveTopicId(topics[0].id);
    }
  }, [topics, activeTopicId]);

  useEffect(() => {
    if (activeTopicId !== null) {
      fetchHistory(activeTopicId);
    }
  }, [activeTopicId, fetchHistory]);

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
      // Auto-focus the input field when chat opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (e?: React.FormEvent | React.KeyboardEvent, proactiveTrigger?: string, durationOverride?: number) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    if (e) e.preventDefault();

    const textToSend = proactiveTrigger || inputValue.trim();
    if (!textToSend || isLoading) return;

    // Clear any existing speech bubble timer if a new proactive message is coming
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
      } else if (!isOpen) {
        setHasUnread(true);
      }
      setAvatarState('idle');
      // Trigger memory check shortly after response finishes
      setTimeout(() => {
        checkForMemoryUpdates();
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
  }, [inputValue, isLoading, apiKey, themeName, phase, timeLeft, t, isOpen, currentLanguage, aiPersona, aiProvider, aiModel, dailyCompletedPomodoros, totalFocusMinutes]);

  useImperativeHandle(ref, () => ({
    triggerProactiveMessage: (type, durationOverride) => {
      sendMessage(undefined, type, durationOverride);
    }
  }));

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
    if (!isOpen && messages.length === 0) {
      setMessages([{ sender: 'ai', text: t('cozyPal.greeting') }]);
    }
  }, [isOpen, messages.length, t]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <MemoryToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      <motion.button
        aria-label={t('cozyPal.avatarDescription')}
        className="w-20 h-20 rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:shadow-cozy-orange/50 transition-shadow relative"
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleChat}
      >
        <CozyAvatar state={avatarState} size={80} />
        <AnimatePresence>
          {hasUnread && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-0 right-0 w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {speechBubble && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute bottom-24 right-20 w-64 p-4 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 text-sm text-indigo-800 break-words"
          >
            {speechBubble}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>

        {isOpen && (
          <motion.div
            aria-label={t('cozyPal.chatDescription')}
            role="dialog"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{ width }}
            className="fixed top-0 right-0 h-full bg-white/95 backdrop-blur-xl shadow-2xl z-40 border-l border-white/40 flex flex-col"
          >
            {/* Resize Handle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-indigo-500/50 transition-colors z-50 transform -translate-x-1/2"
              onMouseDown={startResizing}
            />
            {/* Overlay to capture mouse events during resize (fixes iframe stuck issue) */}
            {isResizing && (
              <div
                className="fixed inset-0 z-[60] cursor-ew-resize bg-transparent"
                style={{ userSelect: 'none' }}
              />
            )}
            {/* Top Header & Main Tabs */}
            <div className="flex-none p-4 pb-2 border-b border-indigo-100 bg-white/50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-indigo-100">
                    <CozyAvatar state={avatarState === 'focused' ? 'idle' : avatarState} size={32} />
                  </div>
                  Cozy Assistant
                </h2>
                <button onClick={toggleChat} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                  <X size={20} />
                </button>
              </div>

              <div className="flex p-1 bg-gray-100/80 rounded-xl">
                <button
                  onClick={() => setMainTab('companion')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mainTab === 'companion'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {t('cozyPal.mainTabs.companion', 'AI Companion')}
                </button>
                <button
                  onClick={() => setMainTab('gemini')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mainTab === 'gemini'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Gemini
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-hidden relative flex flex-col">
              {mainTab === 'companion' ? (
                <>
                  <div className="bg-indigo-50/30 px-4 py-2 border-b border-indigo-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Topic:</span>
                      <button
                        onClick={() => setShowTopicSelector(!showTopicSelector)}
                        className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
                      >
                        {topics.find(t => t.id === activeTopicId)?.name || 'Select Topic'}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>

                    {/* Sub-tabs for Companion */}
                    <div className="flex gap-1">
                      {(['chat', 'memory', 'debug'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition-colors ${activeTab === tab
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'text-indigo-300 hover:bg-indigo-50 hover:text-indigo-500'
                            }`}
                        >
                          {t(`cozyPal.tabs.${tab}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence>
                    {showTopicSelector && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-b border-indigo-100 bg-white"
                      >
                        <TopicSelector
                          topics={topics}
                          activeTopicId={activeTopicId}
                          onSelect={(id) => {
                            setActiveTopicId(id);
                            setShowTopicSelector(false);
                          }}
                          onCreate={handleCreateTopic}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Existing Content rendering logic adapted to fill remaining space */}
                  <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col">
                    {/* ... Content mapped from activeTab ... */
                      // Note: We need to use the same logic as before but wrapped here
                    }
                    <AnimatePresence mode="wait">
                      {activeTab === 'chat' && (
                        <motion.div
                          key="chat"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="p-4 space-y-4 flex flex-col flex-grow"
                        >
                          {messages.map((msg, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`${msg.sender === 'user'
                                ? 'bg-indigo-500 text-white self-end rounded-tr-none'
                                : 'bg-indigo-50 text-indigo-800 self-start rounded-tl-none border border-indigo-100'
                                } p-3 rounded-2xl text-sm shadow-sm max-w-[85%] break-words`}
                            >
                              {msg.text || (idx === messages.length - 1 && isLoading ? <span className="animate-pulse italic text-indigo-400">Typing...</span> : '')}
                            </motion.div>
                          ))}
                          <div ref={messagesEndRef} />
                        </motion.div>
                      )}

                      {activeTab === 'memory' && (
                        <motion.div
                          key="memory"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="p-4 space-y-4"
                        >
                          {/* Memory Content Logic - Keeping same block structure */}
                          <div className="space-y-3">
                            {/* Facts */}
                            <div className="bg-white/50 rounded-xl p-3 border border-indigo-100 shadow-sm">
                              <h4 className="text-[10px] font-bold text-indigo-400 uppercase mb-2">{t('cozyPal.memory.facts')}</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {diagnostics?.user_profile?.facts?.length ? diagnostics.user_profile.facts.map((f, i) => (
                                  <motion.div
                                    key={i}
                                    whileHover={{ scale: 1.02 }}
                                    className="group relative text-[10px] bg-indigo-100 text-indigo-700 pl-2 pr-2 py-0.5 rounded-full border border-indigo-200/50 flex items-center gap-1"
                                  >
                                    <span>{f}</span>
                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1 border-l border-indigo-300/30 pl-1">
                                      <button onClick={() => { setEditingProfileItem({ category: 'facts', value: f }); setEditValue(f); }} className="p-0.5 hover:text-indigo-900 transition-colors"><Edit3 size={10} /></button>
                                      <button onClick={() => handleDeleteProfileItem('facts', f)} className="p-0.5 hover:text-red-600 transition-colors"><Trash2 size={10} /></button>
                                    </div>
                                  </motion.div>
                                )) : <p className="text-[10px] text-gray-400 italic">{t('cozyPal.memory.noFacts')}</p>}
                              </div>
                            </div>
                            {/* Preferences */}
                            <div className="bg-white/50 rounded-xl p-3 border border-indigo-100 shadow-sm">
                              <h4 className="text-[10px] font-bold text-indigo-400 uppercase mb-2">{t('cozyPal.memory.preferences')}</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {diagnostics?.user_profile?.preferences?.length ? diagnostics.user_profile.preferences.map((p, i) => (
                                  <motion.div
                                    key={i}
                                    whileHover={{ scale: 1.02 }}
                                    className="group relative text-[10px] bg-amber-100 text-amber-700 pl-2 pr-2 py-0.5 rounded-full border border-amber-200/50 flex items-center gap-1"
                                  >
                                    <span>{p}</span>
                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1 border-l border-amber-300/30 pl-1">
                                      <button onClick={() => { setEditingProfileItem({ category: 'preferences', value: p }); setEditValue(p); }} className="p-0.5 hover:text-amber-900 transition-colors"><Edit3 size={10} /></button>
                                      <button onClick={() => handleDeleteProfileItem('preferences', p)} className="p-0.5 hover:text-red-600 transition-colors"><Trash2 size={10} /></button>
                                    </div>
                                  </motion.div>
                                )) : <p className="text-[10px] text-gray-400 italic">{t('cozyPal.memory.noPreferences')}</p>}
                              </div>
                            </div>
                          </div>

                          {/* Timeline */}
                          <div>
                            <h4 className="text-[10px] font-bold text-indigo-400 uppercase mb-2 px-1">{t('cozyPal.memory.timeline')}</h4>
                            <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                              {memoryFragments.length > 0 ? memoryFragments.map((f) => (
                                <div key={f.id} className="bg-white/30 p-2 rounded-lg border border-white/50 text-[10px] text-indigo-900 group">
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="text-[8px] text-indigo-400 font-medium">{new Date(f.created_at).toLocaleString()}</span>
                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1 pl-1 gap-1">
                                      <button onClick={() => { setEditingFragment({ id: f.id, content: f.content }); setEditValue(f.content); }} className="p-0.5 hover:text-indigo-600 transition-colors"><Edit3 size={10} /></button>
                                      <button onClick={() => handleDeleteFragment(f.id)} className="p-0.5 hover:text-red-600 transition-colors"><Trash2 size={10} /></button>
                                    </div>
                                  </div>
                                  <div className="italic">"{f.content}"</div>
                                </div>
                              )) : <div className="text-[10px] text-gray-400 italic px-1">{t('cozyPal.memory.noFragments')}</div>}
                            </div>
                          </div>

                          <div className="pt-2 mt-4 border-t border-indigo-100/50 flex justify-center">
                            <button onClick={handleResetMemory} disabled={isSavingEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-600 hover:bg-red-50 transition-all border border-red-100/50">
                              <Trash2 size={12} /> {t('cozyPal.memory.resetMemory')}
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'debug' && (
                        <motion.div
                          key="debug"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="p-4 font-mono text-[10px]"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-gray-500 uppercase tracking-widest text-[8px] font-bold">// {t('cozyPal.debug.title')}</p>
                            <button
                              onClick={fetchDiagnostics}
                              className="text-indigo-400 hover:text-indigo-600 transition-colors p-1"
                              title={t('cozyPal.debug.refresh')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${isDiagLoading ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                          <div className="bg-gray-900 text-gray-300 p-4 rounded-xl border border-gray-800 shadow-inner overflow-x-auto min-h-[250px] leading-relaxed relative">
                            {isDiagLoading ? (
                              <div className="flex items-center justify-center h-full animate-pulse text-indigo-400">
                                {t('cozyPal.debug.loading')}
                              </div>
                            ) : (diagnostics?.full_prompt ? renderHighlightedPrompt() : <div className="text-gray-500 italic">{t('cozyPal.debug.noData')}</div>)}

                            <AnimatePresence>
                              {editingFragment && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm z-50 p-4 flex flex-col"
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-purple-400 font-bold uppercase text-[8px]">{t('cozyPal.debug.editTitle')}</h4>
                                    <button onClick={() => setEditingFragment(null)} className="text-gray-500 hover:text-white">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                  </div>
                                  <textarea
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="flex-grow bg-gray-800 border border-purple-500/30 rounded-lg p-3 text-[10px] text-purple-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    placeholder="Edit memory content..."
                                  />
                                  <div className="mt-3 flex justify-end gap-2">
                                    <button
                                      onClick={() => setEditingFragment(null)}
                                      className="px-3 py-1.5 text-[8px] font-bold text-gray-400 uppercase"
                                    >
                                      {t('common.cancel')}
                                    </button>
                                    <button
                                      onClick={handleUpdateFragment}
                                      disabled={isSavingEdit}
                                      className="px-3 py-1.5 text-[8px] font-bold bg-purple-600 text-white rounded-md uppercase shadow-lg shadow-purple-900/20 disabled:opacity-50"
                                    >
                                      {isSavingEdit ? 'Saving...' : t('cozyPal.debug.saveAndRescan')}
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </div>
                </>

              ) : (
                /* GEMINI IFRAME VIEW */
                <div className="flex-grow w-full h-full bg-white">
                  <iframe
                    src="https://gemini.google.com/app"
                    className="w-full h-full border-none"
                    title="Gemini"
                    allow="clipboard-write"
                  />
                </div>
              )}
            </div>


            {/* Input Area - Only for Companion mode and Chat tab */}
            {mainTab === 'companion' && activeTab === 'chat' && (
              <form onSubmit={(e) => sendMessage(e)} className="p-4 bg-gray-50/50 border-t border-gray-100 flex-none">
                <div className="flex gap-2 items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={t('cozyPal.placeholder')}
                    className="flex-grow bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm placeholder-gray-400 text-gray-800"
                    disabled={isLoading}
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    )}
                  </motion.button>
                </div>
                <div className="text-[9px] text-center mt-2 text-gray-400 font-medium">
                  {t('cozyPal.disclaimer', 'AI can make mistakes. Please verify important info.')}
                </div>
              </form>
            )}

            <AnimatePresence>
              {editingProfileItem && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 p-6 flex flex-col items-center justify-center text-center"
                >
                  <h4 className="text-indigo-900 font-bold uppercase text-xs mb-4">
                    {t('cozyPal.debug.editTitle')}
                  </h4>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-sm text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditingProfileItem(null)}
                      className="px-4 py-2 text-xs font-bold text-gray-400 uppercase hover:text-gray-600 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={handleUpdateProfileItem}
                      disabled={isSavingEdit}
                      className="px-6 py-2 text-xs font-bold bg-indigo-600 text-white rounded-full uppercase shadow-lg shadow-indigo-900/20 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSavingEdit ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : <Check size={14} />}
                      {t('cozyPal.debug.saveAndRescan')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
});

export default CozyPal;
