import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, AlertCircle, Loader2 } from 'lucide-react';
import { getUserThemes } from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import type { FocusTheme } from '../../types/pomodoro';
import CustomSelect from '../ui/CustomSelect';
import { updateDocumentMetadata } from '../../lib/storage/documents';

interface Document {
  id: number;
  title: string;
  topic_id?: string | null;
}

interface DocumentEditModalProps {
  isOpen: boolean;
  document: Document | null;
  onClose: () => void;
  onUpdateComplete: () => void;
}

const DocumentEditModal: React.FC<DocumentEditModalProps> = ({
  isOpen,
  document,
  onClose,
  onUpdateComplete,
}) => {
  const { t } = useTranslation();
  const [themes, setThemes] = useState<FocusTheme[]>([]);

  const [title, setTitle] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThemes = async () => {
    try {
      const fetchedThemes = await getUserThemes();
      setThemes(fetchedThemes);
    } catch (err) {
      console.error('Failed to fetch themes', err);
    }
  };

  useEffect(() => {
    if (isOpen && document) {
      fetchThemes();
      setTitle(document.title);
      setSelectedTopicId(document.topic_id || null);
      setError(null);
    }
  }, [isOpen, document]);

  const handleUpdate = async () => {
    if (!document || !title) return;

    setIsUpdating(true);
    setError(null);

    try {
      await updateDocumentMetadata(document.id, {
        title: title,
        topic_id: selectedTopicId || null,
      });

      onUpdateComplete();
      onClose();
    } catch (err: unknown) {
      console.error('Update failed:', err);
      setError(err instanceof Error && err.message ? err.message : '更新书籍元数据失败');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden relative"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 font-heading">
              {t('common.editDocument', '编辑文档')}
            </h2>
            <button
              onClick={onClose}
              disabled={isUpdating}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="p-8 space-y-6">
            {/* Title Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                {t('common.documentTitle', '文档标题')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('common.enterTitle', '输入文档标题')}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
              />
            </div>

            {/* Topic Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                {t('common.categorize', '绑定专注主题')}
              </label>
              <CustomSelect
                options={themes.map(t => ({ value: t.id, label: t.name }))}
                value={selectedTopicId || ''}
                onChange={(val) => setSelectedTopicId(val)}
                placeholder={t('common.noTopic', '不选择专注主题')}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                onClick={onClose}
                disabled={isUpdating}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[20px] font-bold uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all active:scale-95"
              >
                {t('common.cancel', '取消')}
              </button>
              <button
                onClick={handleUpdate}
                disabled={!title || isUpdating}
                className="flex-[2] py-4 bg-slate-900 text-white rounded-[20px] font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
              >
                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {t('common.save', '保存修改')}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DocumentEditModal;
