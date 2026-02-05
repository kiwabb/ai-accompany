import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface ChatInputFormProps {
    inputRef: React.RefObject<HTMLInputElement | null>;
    isLoading: boolean;
    onSendMessage: (text: string) => Promise<void>;
}

export const ChatInputForm: React.FC<ChatInputFormProps> = ({ inputRef, isLoading, onSendMessage }) => {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = inputValue.trim();
        if (!text || isLoading) return;
        
        await onSendMessage(text);
        setInputValue('');
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50/50 border-t border-gray-100 flex-none">
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
    );
};
