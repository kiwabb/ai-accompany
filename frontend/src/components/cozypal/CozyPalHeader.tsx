import { motion } from 'framer-motion';
import type { TFunction } from 'i18next';
import { X } from 'lucide-react';
import CozyAvatar from '../CozyAvatar';
import OriginalMascot from '../OriginalMascot';
import type { VisualTheme, VisualThemeCharacter } from '../../types/pomodoro';
import { isOriginalCartoonThemeId } from '../../constants/themes';

const CHIIKAWA_HEADER_AVATARS = [
  '/assets/chiikawa/sticker-0.png',
  '/assets/chiikawa/sticker-1.png',
  '/assets/chiikawa/sticker-2.png',
];

interface CozyPalHeaderProps {
  avatarState: 'idle' | 'thinking' | 'speaking' | 'focused';
  onClose: () => void;
  t: TFunction;
  visualTheme?: VisualTheme;
  activeCharacter?: VisualThemeCharacter;
}

const CozyPalHeader = ({ avatarState, onClose, t, visualTheme, activeCharacter }: CozyPalHeaderProps) => {
  const isChiikawaTheme = visualTheme?.id === 'chiikawa';
  const isShinchanTheme = visualTheme?.id === 'shinchan';
  const isOriginalTheme = isOriginalCartoonThemeId(visualTheme?.id);
  const title = isChiikawaTheme
    ? 'Chiikawa Pal'
    : isShinchanTheme
      ? 'Shin-chan Pal'
      : activeCharacter?.companionTitle ?? visualTheme?.character?.companionTitle ?? 'Cozy Pal';
  const subtitle = isChiikawaTheme
    ? '✦ Kawaii Companion ♡'
    : isShinchanTheme
      ? '★ Action Companion ★'
      : activeCharacter?.companionSubtitle ?? visualTheme?.character?.companionSubtitle ?? 'AI Study Companion';
  const chiikawaAvatar = CHIIKAWA_HEADER_AVATARS[
    avatarState === 'thinking' ? 1 :
      avatarState === 'speaking' ? 2 : 0
  ];

  return (
    <div className="flex justify-between items-center mb-5">
      <h2
        className={`text-xl font-bold flex items-center gap-3 tracking-tight ${isShinchanTheme ? 'text-[#5D4037]' : 'text-indigo-950'}`}
        style={isOriginalTheme || (!isChiikawaTheme && !isShinchanTheme && visualTheme?.character) ? { color: visualTheme.colors.text } : undefined}
      >
        <motion.div
          whileHover={{ rotate: isOriginalTheme || isChiikawaTheme ? [-5, 5, -5] : isShinchanTheme ? -5 : 10, scale: 1.1 }}
          className={`w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner border ${
            isChiikawaTheme
              ? 'bg-gradient-to-br from-pink-100 to-pink-200 border-white'
              : isShinchanTheme
                ? 'bg-[#FFF176] border-white'
                : 'bg-indigo-50 shadow-cozy-sm border-white'
          }`}
          style={isOriginalTheme || (!isChiikawaTheme && !isShinchanTheme && visualTheme?.character) ? { backgroundColor: visualTheme.colors.glass } : undefined}
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
          ) : isShinchanTheme ? (
            <motion.img
              src={avatarState === 'thinking' ? '/assets/shinchan/shinchan-dance.gif' : '/assets/shinchan/shinchan-animated.gif'}
              alt="Shin-chan"
              className="w-8 h-8 object-contain"
              animate={
                avatarState === 'thinking'
                  ? { rotate: [0, 10, -10, 0], transition: { duration: 1.5, repeat: Infinity } }
                  : { y: [0, -2, 0], transition: { duration: 2, repeat: Infinity } }
              }
            />
          ) : isOriginalTheme && visualTheme ? (
            <OriginalMascot character={activeCharacter} theme={visualTheme} state={avatarState} size={40} />
          ) : (
            <CozyAvatar state={avatarState === 'focused' ? 'idle' : avatarState} size={40} />
          )}
        </motion.div>

        <div className="flex flex-col">
          <span className="leading-none">{title}</span>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${
              isChiikawaTheme ? 'text-pink-400' : isShinchanTheme ? 'text-[#8D6E63]' : 'text-indigo-400'
            }`}
            style={isOriginalTheme || (!isChiikawaTheme && !isShinchanTheme && visualTheme?.character) ? { color: visualTheme.colors.primary } : undefined}
          >
            {subtitle}
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
            : isShinchanTheme
              ? 'hover:bg-yellow-50 text-[#37474F]/40 hover:text-[#37474F] hover:border-yellow-200 hover:shadow-yellow-100/50'
              : 'hover:bg-red-50 text-gray-400 hover:text-red-500 hover:border-red-100 hover:shadow-red-100/50'
        }`}
        aria-label={t('common.close', 'Close')}
      >
        <X size={20} strokeWidth={isShinchanTheme ? 3 : 2} />
      </motion.button>
    </div>
  );
};


export default CozyPalHeader;
