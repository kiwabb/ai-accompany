import { AnimatePresence, motion } from 'framer-motion';
import type { TFunction } from 'i18next';
import CozyAvatar from '../CozyAvatar';

interface CozyPalAvatarButtonProps {
  avatarState: 'idle' | 'thinking' | 'speaking' | 'focused';
  hasUnread: boolean;
  onToggle: () => void;
  t: TFunction;
}

const CozyPalAvatarButton = ({ avatarState, hasUnread, onToggle, t }: CozyPalAvatarButtonProps) => (
  <motion.button
    aria-label={t('cozyPal.avatarDescription')}
    className="w-20 h-20 rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:shadow-cozy-orange/50 transition-shadow relative"
    whileHover={{ scale: 1.1, rotate: 5 }}
    whileTap={{ scale: 0.9 }}
    onClick={onToggle}
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
);

export default CozyPalAvatarButton;
