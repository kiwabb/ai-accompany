import { motion } from 'framer-motion';
import { Edit3, Trash2 } from 'lucide-react';
import type { TFunction } from 'i18next';
import type { DiagnosticData, EditingFragment, EditingProfileItem } from './types';

interface MemoryFragment {
  id: number;
  content: string;
  created_at: string;
}

interface MemoryTabProps {
  diagnostics: DiagnosticData | null;
  memoryFragments: MemoryFragment[];
  isSavingEdit: boolean;
  onEditProfileItem: (item: EditingProfileItem) => void;
  onDeleteProfileItem: (category: 'facts' | 'preferences', value: string) => void;
  onEditFragment: (fragment: EditingFragment) => void;
  onDeleteFragment: (id: number) => void;
  onResetMemory: () => void;
  t: TFunction;
}

const MemoryTab = ({
  diagnostics,
  memoryFragments,
  isSavingEdit,
  onEditProfileItem,
  onDeleteProfileItem,
  onEditFragment,
  onDeleteFragment,
  onResetMemory,
  t,
}: MemoryTabProps) => (
  <motion.div
    key="memory"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="p-4 space-y-6 flex flex-col flex-grow"
  >
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <div className="glass-surface rounded-2xl p-4 shadow-sm">
          <h4 className="text-[11px] font-bold text-indigo-400 uppercase mb-3 tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            {t('cozyPal.memory.facts')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {diagnostics?.user_profile?.facts?.length ? diagnostics.user_profile.facts.map((fact) => (
              <motion.div
                key={fact}
                whileHover={{ scale: 1.05, y: -2 }}
                className="group relative text-xs bg-white text-indigo-700 pl-3 pr-2 py-1.5 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-2"
              >
                <span className="font-medium">{fact}</span>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all ml-1 border-l border-indigo-50 pl-1 gap-1">
                  <button
                    onClick={() => onEditProfileItem({ category: 'facts', value: fact })}
                    className="p-1 hover:bg-indigo-50 rounded transition-colors text-indigo-400 hover:text-indigo-600"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={() => onDeleteProfileItem('facts', fact)}
                    className="p-1 hover:bg-red-50 rounded transition-colors text-indigo-400 hover:text-red-500"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            )) : <p className="text-xs text-gray-400 font-medium">{t('cozyPal.memory.noFacts')}</p>}
          </div>
        </div>

        <div className="glass-surface rounded-2xl p-4 shadow-sm">
          <h4 className="text-[11px] font-bold text-amber-500 uppercase mb-3 tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {t('cozyPal.memory.preferences')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {diagnostics?.user_profile?.preferences?.length ? diagnostics.user_profile.preferences.map((pref) => (
              <motion.div
                key={pref}
                whileHover={{ scale: 1.05, y: -2 }}
                className="group relative text-xs bg-white text-amber-700 pl-3 pr-2 py-1.5 rounded-xl border border-amber-100 shadow-sm flex items-center gap-2"
              >
                <span className="font-medium">{pref}</span>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all ml-1 border-l border-amber-50 pl-1 gap-1">
                  <button
                    onClick={() => onEditProfileItem({ category: 'preferences', value: pref })}
                    className="p-1 hover:bg-amber-50 rounded transition-colors text-amber-400 hover:text-amber-600"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={() => onDeleteProfileItem('preferences', pref)}
                    className="p-1 hover:bg-red-50 rounded transition-colors text-amber-400 hover:text-red-500"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            )) : <p className="text-xs text-gray-400 font-medium">{t('cozyPal.memory.noPreferences')}</p>}
          </div>
        </div>
      </div>

      <div className="glass-surface rounded-2xl p-4 shadow-sm">
        <h4 className="text-[11px] font-bold text-indigo-400 uppercase mb-4 tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          {t('cozyPal.memory.timeline')}
        </h4>
        <div className="space-y-3">
          {memoryFragments.length > 0 ? memoryFragments.map((fragment) => (
            <motion.div
              key={fragment.id}
              whileHover={{ x: 4 }}
              className="bg-white/60 p-3 rounded-xl border border-white text-xs text-indigo-900 group shadow-sm transition-all"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] bg-indigo-50 text-indigo-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  {new Date(fragment.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all gap-1">
                  <button
                    onClick={() => onEditFragment({ id: fragment.id, content: fragment.content })}
                    className="p-1.5 hover:bg-indigo-50 rounded-lg transition-colors text-indigo-400 hover:text-indigo-600"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={() => onDeleteFragment(fragment.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-indigo-400 hover:text-red-500"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div className="leading-relaxed">"{fragment.content}"</div>
            </motion.div>
          )) : <div className="text-xs text-gray-400 px-1">{t('cozyPal.memory.noFragments')}</div>}
        </div>
      </div>
    </div>

    <div className="mt-auto pt-6 border-t border-indigo-50 flex justify-center">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onResetMemory}
        disabled={isSavingEdit}
        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all border border-red-100 shadow-sm"
      >
        <Trash2 size={14} /> {t('cozyPal.memory.resetMemory')}
      </motion.button>
    </div>
  </motion.div>
);

export default MemoryTab;
