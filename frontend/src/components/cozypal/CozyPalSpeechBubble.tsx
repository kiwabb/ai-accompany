import { AnimatePresence, motion } from 'framer-motion';

interface CozyPalSpeechBubbleProps {
  speechBubble: string | null;
}

const CozyPalSpeechBubble = ({ speechBubble }: CozyPalSpeechBubbleProps) => (
  <AnimatePresence>
    {speechBubble && (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="absolute bottom-24 right-20 w-64 p-4 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 text-sm text-indigo-800 break-words"
      >
        {speechBubble}
      </motion.div>
    )}
  </AnimatePresence>
);

export default CozyPalSpeechBubble;
