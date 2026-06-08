import { AnimatePresence, motion } from 'framer-motion';
import type { TFunction } from 'i18next';
import type { DiagnosticData, EditingFragment } from './types';

interface DebugTabProps {
  diagnostics: DiagnosticData | null;
  isDiagLoading: boolean;
  editingFragment: EditingFragment | null;
  editValue: string;
  isSavingEdit: boolean;
  onRefresh: () => void;
  onSelectFragment: (fragment: EditingFragment) => void;
  onEditValueChange: (value: string) => void;
  onCloseEditingFragment: () => void;
  onSaveFragment: () => void;
  t: TFunction;
}

const getHighlightedPromptParts = (
  diagnostics: DiagnosticData | null,
  onSelectFragment: (fragment: EditingFragment) => void,
  t: TFunction,
): (string | React.ReactNode)[] | string => {
  if (!diagnostics || !diagnostics.full_prompt) return 'No prompt data.';

  const content = diagnostics.full_prompt;
  const fragments = diagnostics.memory_fragments || [];
  const sortedFragments = [...fragments].sort((a, b) => b.content.length - a.content.length);
  let parts: (string | React.ReactNode)[] = [content];

  sortedFragments.forEach((fragment) => {
    const newParts: (string | React.ReactNode)[] = [];
    parts.forEach((part) => {
      if (typeof part !== 'string') {
        newParts.push(part);
        return;
      }

      const subParts = part.split(fragment.content);
      subParts.forEach((subPart, idx) => {
        newParts.push(subPart);
        if (idx < subParts.length - 1) {
          newParts.push(
            <motion.span
              key={`${fragment.id}-${idx}`}
              whileHover={{ scale: 1.02 }}
              onClick={() => onSelectFragment({ id: fragment.id, content: fragment.content })}
              className="bg-purple-100 text-purple-900 px-1 rounded border border-purple-200 cursor-pointer hover:bg-purple-200 transition-colors relative group mx-0.5 inline-block"
            >
              {fragment.content}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-[8px] py-1 px-2 rounded whitespace-nowrap z-40 shadow-xl">
                {t('cozyPal.debug.score')}: {fragment.score.toFixed(4)} ({t('cozyPal.debug.clickToEdit')})
              </span>
            </motion.span>
          );
        }
      });
    });
    parts = newParts;
  });

  return parts;
};

const DebugTab = ({
  diagnostics,
  isDiagLoading,
  editingFragment,
  editValue,
  isSavingEdit,
  onRefresh,
  onSelectFragment,
  onEditValueChange,
  onCloseEditingFragment,
  onSaveFragment,
  t,
}: DebugTabProps) => (
  <motion.div
    key="debug"
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 10 }}
    className="p-4 font-mono text-[10px]"
  >
    <div className="flex justify-between items-center mb-2">
      <p className="text-gray-500 uppercase tracking-widest text-[8px] font-bold">// {t('cozyPal.debug.title')}</p>
      <button
        onClick={onRefresh}
        className="text-indigo-400 hover:text-indigo-600 transition-colors p-1"
        title={t('cozyPal.debug.refresh')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${isDiagLoading ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
    <div className="bg-gray-900 text-gray-300 p-4 rounded-xl border border-gray-800 shadow-inner overflow-x-auto min-h-[250px] leading-relaxed relative">
      {isDiagLoading ? (
        <div className="flex items-center justify-center h-full animate-pulse text-indigo-400">
          {t('cozyPal.debug.loading')}
        </div>
      ) : (
        diagnostics?.full_prompt ? getHighlightedPromptParts(diagnostics, onSelectFragment, t) : <div className="text-gray-500">{t('cozyPal.debug.noData')}</div>
      )}

      <AnimatePresence>
        {editingFragment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm z-50 p-4 flex flex-col"
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-purple-400 font-bold uppercase text-[8px]">{t('cozyPal.debug.editTitle')}</h4>
              <button onClick={onCloseEditingFragment} className="text-gray-500 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <textarea
              value={editValue}
              onChange={(event) => onEditValueChange(event.target.value)}
              className="flex-grow bg-gray-800 border border-purple-500/30 rounded-lg p-3 text-[10px] text-purple-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Edit memory content..."
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={onCloseEditingFragment}
                className="px-3 py-1.5 text-[8px] font-bold text-gray-400 uppercase"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={onSaveFragment}
                disabled={isSavingEdit}
                className="px-3 py-1.5 text-[8px] font-bold bg-purple-600 text-white rounded-md uppercase shadow-lg shadow-purple-900/20 disabled:opacity-50"
              >
                {isSavingEdit ? 'Saving...' : t('cozyPal.debug.saveAndRescan')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </motion.div>
);

export default DebugTab;
