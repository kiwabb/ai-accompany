import { motion } from 'framer-motion';
import type { TFunction } from 'i18next';

interface CozyPalMainTabsProps {
  mainTab: 'companion' | 'gemini';
  onChange: (tab: 'companion' | 'gemini') => void;
  t: TFunction;
}

const CozyPalMainTabs = ({ mainTab, onChange, t }: CozyPalMainTabsProps) => (
  <div className="flex p-1.5 bg-gray-100/50 backdrop-blur-sm rounded-2xl border border-white/50">
    <button
      onClick={() => onChange('companion')}
      className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all relative ${mainTab === 'companion'
        ? 'text-indigo-600'
        : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {mainTab === 'companion' && (
        <motion.div layoutId="main-tab-bg" className="absolute inset-0 bg-white shadow-md rounded-xl -z-10 border border-white" />
      )}
      {t('cozyPal.mainTabs.companion', 'Companion')}
    </button>
    <button
      onClick={() => onChange('gemini')}
      className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all relative ${mainTab === 'gemini'
        ? 'text-blue-600'
        : 'text-gray-400 hover:text-gray-700'
      }`}
    >
      {mainTab === 'gemini' && (
        <motion.div layoutId="main-tab-bg" className="absolute inset-0 bg-white shadow-md rounded-xl -z-10 border border-white" />
      )}
      Gemini
    </button>
  </div>
);

export default CozyPalMainTabs;
