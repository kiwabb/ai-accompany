import { AnimatePresence, motion } from 'framer-motion';
import type { TFunction } from 'i18next';
import CozyAvatar from '../CozyAvatar';

// Chiikawa stickers for avatar
const CHIIKAWA_AVATARS = [
  '/assets/chiikawa/sticker-0.png',
  '/assets/chiikawa/sticker-1.png',
  '/assets/chiikawa/sticker-2.png',
  '/assets/chiikawa/sticker-3.png',
];

interface CozyPalAvatarButtonProps {
  avatarState: 'idle' | 'thinking' | 'speaking' | 'focused';
  hasUnread: boolean;
  onToggle: () => void;
  t: TFunction;
  isChiikawaTheme?: boolean;
}

const CozyPalAvatarButton = ({ avatarState, hasUnread, onToggle, t, isChiikawaTheme }: CozyPalAvatarButtonProps) => {
  // Pick a Chiikawa avatar based on state
  const chiikawaAvatar = CHIIKAWA_AVATARS[
    avatarState === 'thinking' ? 1 :
    avatarState === 'speaking' ? 2 :
    avatarState === 'focused' ? 3 : 0
  ];

  return (
    <motion.button
      aria-label={t('cozyPal.avatarDescription')}
      className={`w-20 h-20 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-shadow relative ${
        isChiikawaTheme
          ? 'bg-gradient-to-br from-pink-100 to-pink-200 hover:shadow-pink-300/50 border-4 border-white'
          : 'hover:shadow-cozy-orange/50'
      }`}
      whileHover={{ scale: 1.1, rotate: isChiikawaTheme ? [-5, 5, -5] : 5 }}
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
    >
      {isChiikawaTheme ? (
        <motion.img
          src={chiikawaAvatar}
          alt="Chiikawa"
          className="w-16 h-16 object-contain"
          animate={
            avatarState === 'thinking'
              ? { rotate: [0, 10, -10, 0], transition: { duration: 2, repeat: Infinity } }
              : avatarState === 'speaking'
              ? { scale: [1, 1.1, 1], transition: { duration: 0.3, repeat: Infinity } }
              : avatarState === 'focused'
              ? { y: [0, -3, 0], transition: { duration: 2, repeat: Infinity } }
              : { y: [0, -5, 0], rotate: [0, 3, -3, 0], transition: { duration: 3, repeat: Infinity } }
          }
          draggable={false}
        />
      ) : (
        <CozyAvatar state={avatarState} size={80} />
      )}

      <AnimatePresence>
        {hasUnread && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className={`absolute top-0 right-0 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
              isChiikawaTheme ? 'bg-pink-400' : 'bg-red-500'
            }`}
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chiikawa sparkle decorations */}
      {isChiikawaTheme && (
        <>
          <motion.span
            className="absolute -top-1 -right-1 text-sm"
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ✦
          </motion.span>
          <motion.span
            className="absolute -bottom-1 -left-1 text-sm"
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          >
            ♡
          </motion.span>
        </>
      )}
    </motion.button>
  );
};

export default CozyPalAvatarButton;
