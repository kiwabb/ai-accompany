import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Upload, Check, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from '../ui/CustomSelect';
import { useTimerContext } from '../../contexts/TimerContext';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
  defaultTopicId?: string | null;
  initialFile?: File | null;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
  defaultTopicId,
  initialFile,
}) => {
  const { t } = useTranslation();
  const { state } = useTimerContext();
  const fallbackTopicId = defaultTopicId ?? state.activeThemeId ?? null;
  const themes = state.themes;

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'info' | 'uploading' | 'complete'>('info');
  const [isDragging, setIsDragging] = useState(false);

  const ACCEPTED_EXTS = ['pdf', 'docx', 'txt', 'md'];

  const acceptFile = (selected: File) => {
    const ext = selected.name.split('.').pop()?.toLowerCase() || '';
    if (!ACCEPTED_EXTS.includes(ext)) {
      setError(t('common.unsupportedFile', '不支持的文件类型：') + selected.name);
      return;
    }
    setError(null);
    setFile(selected);
    if (!title) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) acceptFile(dropped);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    if (isOpen) {
      setStep('info');
      setFile(null);
      setTitle('');
      setSelectedTopicId(fallbackTopicId);
      setProgress(0);
      setError(null);
      if (initialFile) {
        acceptFile(initialFile);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, fallbackTopicId, initialFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) acceptFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !title) return;

    setIsUploading(true);
    setStep('uploading');
    setError(null);

    try {
      // 1. Get presigned URL
      const authHeaders = getAuthHeaders();
      const uploadUrlResponse = await axios.post('/api/documents/upload_url', {
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        title: title,
        topic_id: selectedTopicId,
      }, {
        headers: authHeaders,
      });

      const { presigned_url, document_id } = uploadUrlResponse.data;

      // 2. Upload to MinIO
      await axios.put(presigned_url, file, {
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || file.size)
          );
          setProgress(percentCompleted);
        },
      });

      // 3. Confirm completion
      await axios.post(`/api/documents/${document_id}/complete`, {}, {
        headers: authHeaders,
      });

      setStep('complete');
      setTimeout(() => {
        onUploadComplete();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Upload failed:', err);
      const errorMessage = err.response?.data?.detail || err.response?.statusText || err.message || 'Upload failed';
      setError(`${errorMessage} (${err.response?.status || 'network error'})`);
      setStep('info');
    } finally {
      setIsUploading(false);
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
              {step === 'complete' ? t('common.uploadComplete', '上传完成') : t('common.uploadNew', '上传文档')}
            </h2>
            <button
              onClick={onClose}
              disabled={isUploading}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="p-8">
            {step === 'info' && (
              <div className="space-y-6">
                {/* File Dropzone */}
                {!file ? (
                  <label
                    onDrop={handleDrop}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border-4 border-dashed rounded-[32px] p-10 flex flex-col items-center justify-center cursor-pointer transition-colors group ${isDragging
                        ? 'border-indigo-400 bg-indigo-50/70 scale-[1.01]'
                        : 'border-slate-100 hover:bg-slate-50'
                      }`}
                  >
                    <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.txt,.md" />
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform ${isDragging
                        ? 'bg-indigo-500 text-white scale-110'
                        : 'bg-indigo-50 text-indigo-500 group-hover:scale-110'
                      }`}>
                      <Upload size={32} />
                    </div>
                    <p className="text-slate-600 font-bold">
                      {isDragging
                        ? t('common.dropToUpload', '释放以上传')
                        : t('common.selectOrDrop', '点击或拖拽文件到此')}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">PDF, DOCX, TXT, MD</p>
                  </label>
                ) : (
                  <div className="bg-indigo-50/50 rounded-[32px] p-6 flex items-center gap-4 border border-indigo-100">
                    <div className="w-12 h-12 bg-white text-indigo-500 rounded-xl flex items-center justify-center shadow-sm">
                      <Upload size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 font-bold truncate">{file.name}</p>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button onClick={() => setFile(null)} className="p-2 hover:text-red-500 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                )}

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

                <button
                  onClick={handleUpload}
                  disabled={!file || !title || isUploading}
                  className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-bold uppercase tracking-[2px] text-xs shadow-xl shadow-slate-200 hover:shadow-indigo-200/50 hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {t('common.startUpload', '开始上传')}
                </button>
              </div>
            )}

            {step === 'uploading' && (
              <div className="py-12 flex flex-col items-center text-center">
                <div className="relative w-32 h-32 mb-8">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-slate-100 stroke-current"
                      strokeWidth="8"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-indigo-500 stroke-current"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - progress / 100)}
                      strokeLinecap="round"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-800">
                    {progress}%
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{t('common.uploading', '正在上传...')}</h3>
                <p className="text-slate-400 font-medium">{title}</p>
              </div>
            )}

            {step === 'complete' && (
              <div className="py-12 flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center mb-8 shadow-xl shadow-green-200"
                >
                  <Check size={48} />
                </motion.div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('common.done', '完成')}</h3>
                <p className="text-slate-400 font-medium">{t('common.uploadSuccess', '文件已成功上传')}</p>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DocumentUploadModal;
