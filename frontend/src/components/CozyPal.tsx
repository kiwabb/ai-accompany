import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import CozyAvatar from './CozyAvatar';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface CozyPalProps {
  themeName: string;
  phase: string;
  timeLeft: number;
  apiKey?: string;
  currentLanguage: string;
  aiPersona: string;
  dailyCompletedPomodoros: number;
  totalFocusMinutes: number;
}

export interface CozyPalHandle {
  triggerProactiveMessage: (type: 'focus_start' | 'focus_end' | 'break_start' | 'break_end' | 'focus_near_end' | 'break_near_end' | 'focus_completed', durationOverride?: number) => void;
}

const CozyPal = forwardRef<CozyPalHandle, CozyPalProps>(({ themeName, phase, timeLeft, apiKey, currentLanguage, aiPersona, dailyCompletedPomodoros, totalFocusMinutes }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [avatarState, setAvatarState] = useState<'idle' | 'thinking' | 'speaking' | 'focused'>('idle');
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const speechBubbleTimerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      if (speechBubbleTimerRef.current) {
        clearTimeout(speechBubbleTimerRef.current);
        speechBubbleTimerRef.current = null;
      }
      setSpeechBubble(null);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (speechBubbleTimerRef.current) {
        clearTimeout(speechBubbleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/chat/history?limit=10');
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
    };
    
    if (messages.length === 0) {
        fetchHistory();
    }
  }, [t, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (phase === 'focus' && timeLeft > 0 && !isOpen && !isLoading) {
      setAvatarState('focused');
    } else if (!isLoading && avatarState !== 'thinking' && avatarState !== 'speaking') {
      setAvatarState('idle');
    }
  }, [messages, phase, timeLeft, isOpen, isLoading, avatarState]);

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
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['x-google-api-key'] = apiKey;
      }

      const response = await fetch('/api/chat/completions', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          message: proactiveTrigger ? `[SYSTEM_TRIGGER:${proactiveTrigger}]` : textToSend,
          context: {
            theme_name: themeName,
            phase: phase,
            time_left: durationOverride !== undefined ? durationOverride : timeLeft,
            language: currentLanguage,
            ai_persona: aiPersona,
            daily_completed_pomodoros: dailyCompletedPomodoros,
            total_focus_minutes: totalFocusMinutes
          }
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
  }, [inputValue, isLoading, apiKey, themeName, phase, timeLeft, t, isOpen, currentLanguage, aiPersona, dailyCompletedPomodoros, totalFocusMinutes]);

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
            initial={{ opacity: 0, y: 40, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-20 right-0 w-80 sm:w-96 max-h-[500px] bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/40"
          >
            <div className="bg-indigo-500/10 p-4 border-b border-indigo-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white/50">
                 <CozyAvatar state={avatarState === 'focused' ? 'idle' : avatarState} size={40} />
              </div>
              <div>
                <h3 className="font-bold text-indigo-900 text-sm">Cozy Pal</h3>
                <p className="text-[10px] text-indigo-400 uppercase tracking-wider font-semibold">Online</p>
              </div>
              <button onClick={toggleChat} className="ml-auto text-indigo-300 hover:text-indigo-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4 min-h-[300px] flex flex-col custom-scrollbar">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`${
                    msg.sender === 'user'
                      ? 'bg-indigo-500 text-white self-end rounded-tr-none'
                      : 'bg-indigo-50 text-indigo-800 self-start rounded-tl-none border border-indigo-100'
                  } p-3 rounded-2xl text-sm shadow-sm max-w-[85%] break-words`}
                >
                  {msg.text || (idx === messages.length - 1 && isLoading ? <span className="animate-pulse italic text-indigo-400">Typing...</span> : '')}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={(e) => sendMessage(e)} className="p-4 bg-gray-50/50 border-t border-gray-100">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                  placeholder={t('cozyPal.typeMessagePlaceholder')}
                  className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all text-sm shadow-inner disabled:bg-gray-100"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-md disabled:bg-gray-300 disabled:shadow-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default CozyPal;
