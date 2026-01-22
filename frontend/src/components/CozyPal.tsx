import React, { useState, useRef, useEffect } from 'react';
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
}

const CozyPal: React.FC<CozyPalProps> = ({ themeName, phase, timeLeft, apiKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarState, setAvatarState] = useState<'idle' | 'thinking' | 'speaking' | 'focused'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    // Update avatar state based on context
    if (phase === 'focus' && timeLeft > 0 && !isOpen) {
      setAvatarState('focused');
    } else if (isLoading) {
      setAvatarState('thinking');
    } else if (messages.length > 0 && messages[messages.length - 1].sender === 'ai' && isOpen) {
       // Simple heuristic: if AI just sent a message, maybe it's "speaking" briefly? 
       // For now, let's keep it 'idle' or reset to 'idle' after speaking.
       // We'll handle 'speaking' during streaming.
       setAvatarState('idle');
    } else {
      setAvatarState('idle');
    }
  }, [phase, timeLeft, isOpen, isLoading, messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      setMessages([{ sender: 'ai', text: t('cozyPal.greeting') }]);
    }
  };

  const sendMessage = async (e: React.FormEvent | React.KeyboardEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();

    if (inputValue.trim() === '' || isLoading) return;

    const userMessage: Message = { sender: 'user', text: inputValue.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setAvatarState('thinking');

    setMessages((prev) => [...prev, { sender: 'ai', text: '' }]);

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
          message: userMessage.text,
          context: {
            theme_name: themeName,
            phase: phase,
            time_left: timeLeft
          }
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedResponse = '';
      
      setAvatarState('speaking'); // Start speaking animation when stream begins

      while (!done && reader) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        accumulatedResponse += chunkValue;

        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { sender: 'ai', text: accumulatedResponse };
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { sender: 'ai', text: t('cozyPal.errorMessage') };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 悬浮头像按钮 */}
      <motion.button
        aria-label={t('cozyPal.avatarDescription')}
        className="w-20 h-20 rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:shadow-cozy-orange/50 transition-shadow"
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleChat}
      >
        <CozyAvatar state={avatarState} size={80} />
      </motion.button>

      {/* 聊天窗口 */}
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
            {/* 头部 */}
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

            {/* 消息区域 */}
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

            {/* 输入区域 */}
            <form onSubmit={sendMessage} className="p-4 bg-gray-50/50 border-t border-gray-100">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(e)}
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
};

export default CozyPal;
