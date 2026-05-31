import { motion } from 'framer-motion';
import { useState } from 'react';
import type { TFunction } from 'i18next';
import { Copy, Check, RefreshCw } from 'lucide-react';
import type { DiagnosticData } from './types';

interface CozyPalDebugTabProps {
  diagnostics: DiagnosticData | null;
  isDiagLoading: boolean;
  onRefresh: () => void;
  t: TFunction;
  // Optional legacy props to satisfy TypeScript and CozyPal.tsx
  onStartEditFragment?: any;
  editingFragment?: any;
  editValue?: any;
  onEditValueChange?: any;
  onCloseEdit?: any;
  onSaveEdit?: any;
  isSavingEdit?: any;
}

const CozyPalDebugTab = ({
  diagnostics,
  isDiagLoading,
  onRefresh,
  t,
}: CozyPalDebugTabProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!diagnostics?.full_prompt) return;
    try {
      await navigator.clipboard.writeText(diagnostics.full_prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy prompt to clipboard:', e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="p-4 font-mono text-[10px] space-y-3 flex flex-col flex-grow max-h-[80vh] overflow-hidden"
    >
      <div className="flex justify-between items-center flex-shrink-0">
        <p className="text-slate-500 uppercase tracking-widest text-[8px] font-bold">
          // {t('cozyPal.debug.title', 'System Prompt Debugger')}
        </p>
        <div className="flex items-center gap-1">
          {diagnostics?.full_prompt && (
            <button
              onClick={handleCopy}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
              title="Copy system prompt"
            >
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
            </button>
          )}
          <button
            onClick={onRefresh}
            className="text-indigo-400 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
            title={t('cozyPal.debug.refresh', 'Refresh prompt')}
          >
            <RefreshCw size={12} className={isDiagLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex-grow bg-slate-900 text-slate-300 p-4 rounded-2xl border border-slate-800 shadow-inner overflow-y-auto leading-relaxed text-[11px] font-mono select-text max-h-[50vh]">
        {isDiagLoading ? (
          <div className="flex items-center justify-center h-full animate-pulse text-indigo-400">
            {t('cozyPal.debug.loading', 'Compiling System Prompt...')}
          </div>
        ) : diagnostics?.full_prompt ? (
          <pre className="whitespace-pre-wrap break-all pr-2">{diagnostics.full_prompt}</pre>
        ) : (
          <div className="text-slate-500 italic text-center py-12">
            {t('cozyPal.debug.noData', 'No compiled prompt data. Try clicking refresh.')}
          </div>
        )}
      </div>

      <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-3 text-[10px] text-indigo-600/90 leading-relaxed font-sans flex-shrink-0 select-none">
        <strong>提示：</strong>此处展示的是根据您的 Timer 状态、当前阅读的书籍上下文以及手动录入的<strong>个人事实/喜好偏好</strong>，在本地合成编译的真实系统提示词 (System Prompt)。这是 CozyPal 在开始每一次流式对话时获得的初始设定。
      </div>
    </motion.div>
  );
};

export default CozyPalDebugTab;
