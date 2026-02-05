import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MemoryToastProps {
  message: string | null;
  onDismiss: () => void;
}

const MemoryToast: React.FC<MemoryToastProps> = ({ message }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed top-10 left-1/2 -translate-x-1/2 flex justify-center pointer-events-none z-[100]"
        >
          <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-purple-100 flex items-center gap-2 pointer-events-auto">
            <span className="text-lg">✨</span>
            <span className="text-xs font-semibold text-purple-800 tracking-wide">
              {message}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MemoryToast;
