import { motion } from 'framer-motion';
import type { Message } from './types';

interface ChatTabProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatTab = ({ messages, isLoading, messagesEndRef }: ChatTabProps) => (
  <motion.div
    key="chat"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="p-4 space-y-4 flex flex-col flex-grow bg-indigo-50/20"
  >
    {messages.map((msg, idx) => (
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`${msg.sender === 'user'
          ? 'bg-indigo-600 text-white self-end rounded-2xl rounded-tr-none shadow-indigo-200'
          : 'bg-white text-indigo-900 self-start rounded-2xl rounded-tl-none border border-indigo-50 shadow-sm'
        } p-3.5 text-sm shadow-md max-w-[88%] break-words leading-relaxed`}
      >
        <div className="font-medium">
          {msg.text || (idx === messages.length - 1 && isLoading ? (
            <div className="flex gap-1 py-1">
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-indigo-300 rounded-full" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-300 rounded-full" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-300 rounded-full" />
            </div>
          ) : '')}
        </div>
      </motion.div>
    ))}
    <div ref={messagesEndRef} />
  </motion.div>
);

export default ChatTab;
