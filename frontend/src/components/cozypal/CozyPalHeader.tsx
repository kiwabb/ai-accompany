import { motion } from 'framer-motion';
import type { TFunction } from 'i18next';
import { X } from 'lucide-react';
import CozyAvatar from '../CozyAvatar';

interface CozyPalHeaderProps {
  avatarState: 'idle' | 'thinking' | 'speaking' | 'focused';
  onClose: () => void;
  t: TFunction;
}

const CozyPalHeader = ({ avatarState, onClose, t }: CozyPalHeaderProps) => (
  <div className="flex justify-between items-center mb-5">
    <h2 className="text-xl font-bold text-indigo-950 flex items-center gap-3 tracking-tight">
      <motion.div
        whileHover={{ rotate: 10, scale: 1.1 }}
        className="w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center bg-indigo-50 shadow-inner border border-white"
      >
        <CozyAvatar state={avatarState === 'focused' ? 'idle' : avatarState} size={40} />
      </motion.div>
      <div className="flex flex-col">
        <span className="leading-none">Cozy Pal</span>
        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">AI Study Companion</span>
      </div>
    </h2>
    <motion.button
      whileHover={{ rotate: 90, scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClose}
      className="p-2.5 hover:bg-red-50 rounded-2xl transition-all text-gray-400 hover:text-red-500 border border-transparent hover:border-red-100 shadow-sm hover:shadow-red-100/50"
      aria-label={t('common.close', 'Close')}
    >
      <X size={20} />
    </motion.button>
  </div>
);

export default CozyPalHeader;
