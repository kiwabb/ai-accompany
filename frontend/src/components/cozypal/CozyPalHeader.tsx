import { motion } from 'framer-motion';
import type { TFunction } from 'i18next';
import { X } from 'lucide-react';
import CozyAvatar from '../CozyAvatar';

// Chiikawa stickers for header avatar
const CHIIKAWA_HEADER_AVATARS = [
  '/assets/chiikawa/sticker-0.png',
  '/assets/chiikawa/sticker-1.png',
  '/assets/chiikawa/sticker-2.png',
];

interface CozyPalHeaderProps {
  avatarState: 'idle' | 'thinking' | 'speaking' | 'focused';
  onClose: () => void;
  t: TFunction;
  isChiikawaTheme?: boolean;
}

const CozyPalHeader = ({ avatarState, onClose, t, isChiikawaTheme }: CozyPalHeaderProps) => {
  const chiikawaAvatar = CHIIKAWA_HEADER_AVATARS[
    avatarState === 'thinking' ? 1 :
    avatarState === 'speaking' ? 2 : 0
  ];

  return (
    <div className="flex justify-between items-center mb-5">
      <h2 className="text-xl font-bold text-indigo-950 flex items-center gap-3 tracking-tight">
        <motion.div
          whileHover={{ rotate: isChiikawaTheme ? [-5, 5, -5] : 10, scale: 1.1 }}
          className={`w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner border border-white ${
            isChiikawaTheme
              ? 'bg-gradient-to-br from-pink-100 to-pink-200'
              : 'bg-indigo-50'
          }`}
        >
          {isChiikawaTheme ? (
            <motion.img
              src={chiikawaAvatar}
              alt="Chiikawa"
              className="w-8 h-8 object-contain"
              animate={
                avatarState === 'thinking'
                  ? { rotate: [0, 8, -8, 0], transition: { duration: 1.5, repeat: Infinity } }
                  : avatarState === 'speaking'
                  ? { scale: [1, 1.1, 1], transition: { duration: 0.3, repeat: Infinity } }
                  : { y: [0, -2, 0], transition: { duration: 2, repeat: Infinity } }
              }
              draggable={false}
            />
          ) : (
            <CozyAvatar state={avatarState === 'focused' ? 'idle' : avatarState} size={40} />
          )}
        </motion.div>
        <div className="flex flex-col">
          <span className="leading-none">{isChiikawaTheme ? 'Chiikawa Pal' : 'Cozy Pal'}</span>
          <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${
            isChiikawaTheme ? 'text-pink-400' : 'text-indigo-400'
          }`}>
            {isChiikawaTheme ? '✦ Kawaii Companion ♡' : 'AI Study Companion'}
          </span>
        </div>
      </h2>
      <motion.button
        whileHover={{ rotate: 90, scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClose}
        className={`p-2.5 rounded-2xl transition-all border border-transparent shadow-sm ${
          isChiikawaTheme
            ? 'hover:bg-pink-50 text-gray-400 hover:text-pink-500 hover:border-pink-100 hover:shadow-pink-100/50'
            : 'hover:bg-red-50 text-gray-400 hover:text-red-500 hover:border-red-100 hover:shadow-red-100/50'
        }`}
        aria-label={t('common.close', 'Close')}
      >
        <X size={20} />
      </motion.button>
    </div>
  );
};

export default CozyPalHeader;
