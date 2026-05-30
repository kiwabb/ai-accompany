import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2, Edit2, FileText, BookOpen, Loader2, ChevronLeft as ChevronLeftIcon, LayoutGrid, List, Tag } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuthHeaders, getUserThemes } from '../api/client';
import type { FocusTheme } from '../types/pomodoro';

import DocumentUploadModal from '../components/documents/DocumentUploadModal';
import DocumentEditModal from '../components/documents/DocumentEditModal';

interface Document {
    id: number;
    title: string;
    filename: string;
    file_type: string;
    created_at: string;
    topic_id?: string;
    status: string;
}

import AmbientBackground from '../components/AmbientBackground';
import ConfirmModal from '../components/ConfirmModal';
import { useIsMobile } from '../hooks/useIsMobile';
import BottomNav from '../components/BottomNav';

const LibraryPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const themeFilter = searchParams.get('theme');
    const [documents, setDocuments] = useState<Document[]>([]);
    const [themes, setThemes] = useState<FocusTheme[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState<Document | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const isMobile = useIsMobile();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [docToEdit, setDocToEdit] = useState<Document | null>(null);
    const [progressMap, setProgressMap] = useState<Record<number, number>>({});
    const [lastOpenedMap, setLastOpenedMap] = useState<Record<number, string>>({});
    const [draggedFile, setDraggedFile] = useState<File | null>(null);
    const [isPageDragging, setIsPageDragging] = useState(false);
    const dragDepthRef = React.useRef(0);

    useEffect(() => {
        fetchDocuments();
        fetchThemes();
    }, []);

    // Load progress and last opened for all documents
    useEffect(() => {
        if (documents.length > 0) {
            const newProgressMap: Record<number, number> = {};
            const newLastOpenedMap: Record<number, string> = {};
            documents.forEach(doc => {
                if (doc.file_type === 'pdf') {
                    const saved = localStorage.getItem(`pdf_progress_${doc.id}`);
                    if (saved) {
                        try {
                            const parsed = JSON.parse(saved);
                            if (parsed.page && parsed.total && parsed.total > 0) {
                                newProgressMap[doc.id] = Math.round((parsed.page / parsed.total) * 100);
                            }
                        } catch {
                            // Ignore legacy format or errors
                        }
                    }
                }
                const last = localStorage.getItem(`doc_last_opened_${doc.id}`);
                if (last) newLastOpenedMap[doc.id] = last;
            });
            setProgressMap(newProgressMap);
            setLastOpenedMap(newLastOpenedMap);
        }
    }, [documents]);

    const formatRelative = (iso: string): string => {
        const t0 = new Date(iso).getTime();
        const diff = Date.now() - t0;
        if (diff < 60_000) return t('common.justNow', '刚刚');
        const min = Math.floor(diff / 60_000);
        if (min < 60) return t('common.minutesAgo', { defaultValue: '{{n}} 分钟前', n: min });
        const hr = Math.floor(min / 60);
        if (hr < 24) return t('common.hoursAgo', { defaultValue: '{{n}} 小时前', n: hr });
        const day = Math.floor(hr / 24);
        if (day < 30) return t('common.daysAgoN', { defaultValue: '{{n}} 天前', n: day });
        return new Date(iso).toLocaleDateString();
    };

    const fetchThemes = async () => {
        try {
            const fetchedThemes = await getUserThemes();
            setThemes(fetchedThemes);
        } catch (error) {
            console.error('Failed to fetch themes', error);
        }
    };

    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/documents', {
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                const data = await response.json();
                setDocuments(data);
            }
        } catch (error) {
            console.error('Failed to fetch documents', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, doc: Document) => {
        e.stopPropagation();
        setDocToDelete(doc);
        setIsDeleteModalOpen(true);
    };

    const handleEditClick = (e: React.MouseEvent, doc: Document) => {
        e.stopPropagation();
        setDocToEdit(doc);
        setIsEditModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!docToDelete) return;

        try {
            const response = await fetch(`/api/documents/${docToDelete.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                setDocuments(prev => prev.filter(d => d.id !== docToDelete.id));
                setIsDeleteModalOpen(false);
                setDocToDelete(null);
            }
        } catch (error) {
            console.error('Failed to delete document', error);
        }
    };

    const handlePageDragEnter = (e: React.DragEvent) => {
        if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            dragDepthRef.current += 1;
            setIsPageDragging(true);
        }
    };

    const handlePageDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) setIsPageDragging(false);
    };

    const handlePageDragOver = (e: React.DragEvent) => {
        if (e.dataTransfer.types.includes('Files')) e.preventDefault();
    };

    const handlePageDrop = (e: React.DragEvent) => {
        e.preventDefault();
        dragDepthRef.current = 0;
        setIsPageDragging(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) {
            setDraggedFile(dropped);
            setIsUploadModalOpen(true);
        }
    };

    return (
        <div
            className="min-h-screen bg-[#FCFAF7] relative overflow-hidden flex flex-col items-center py-16 md:py-12 px-3 md:px-6 pb-32"
            onDragEnter={handlePageDragEnter}
            onDragLeave={handlePageDragLeave}
            onDragOver={handlePageDragOver}
            onDrop={handlePageDrop}
        >
            <AmbientBackground />

            {isPageDragging && (
                <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center bg-indigo-500/15 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl border-4 border-dashed border-indigo-400 p-12 flex flex-col items-center gap-3">
                        <Upload size={48} className="text-indigo-500" />
                        <p className="text-lg font-bold text-slate-900">{t('common.dropToUpload', '释放以上传')}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">PDF · DOCX · TXT · MD</p>
                    </div>
                </div>
            )}

            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/')}
                className="fixed top-3 left-3 md:top-8 md:left-8 py-2 px-3 md:py-3 md:px-6 bg-white/60 backdrop-blur-2xl shadow-xl rounded-2xl flex items-center gap-2 group z-50 transition-colors font-bold uppercase tracking-widest text-[10px] border border-white text-slate-400 hover:text-slate-900"
            >
                <ChevronLeftIcon size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="hidden md:inline">{t('common.backToTimer')}</span>
            </motion.button>

            <div className="w-full max-w-5xl relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-8 md:mb-12">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight flex items-center gap-4 font-heading">
                            <BookOpen className="text-indigo-500" size={32} />
                            {t('common.library')}
                        </h1>
                        {themeFilter && (
                            <div className="flex items-center gap-2 mt-3">
                                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-widest border border-indigo-100">
                                    <Tag size={12} />
                                    {themes.find(t => t.id === themeFilter)?.name || themeFilter}
                                </span>
                                <button
                                    onClick={() => navigate('/library')}
                                    className="text-xs text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest"
                                >
                                    {t('common.clear', '清除筛选')}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="flex bg-slate-100/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/50">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <List size={20} />
                            </button>
                        </div>
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="
                                flex items-center gap-2 md:gap-3 px-4 py-3 md:px-8 md:py-4 bg-slate-900 text-white
                                rounded-2xl md:rounded-3xl font-bold uppercase tracking-widest text-[10px] md:text-xs
                                shadow-xl hover:shadow-indigo-200/50 hover:bg-slate-800
                                transition-all active:scale-95
                            "
                        >
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('common.uploadNew')}</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white/40 backdrop-blur-3xl rounded-[24px] md:rounded-[56px] p-4 md:p-12 border border-white shadow-[0_30px_100px_-30px_rgba(0,0,0,0.1)]">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="animate-spin text-indigo-500 w-10 h-10" />
                        </div>
                    ) : (themeFilter ? documents.filter(d => d.topic_id === themeFilter) : documents).length === 0 ? (
                        <div className="text-center py-24 rounded-[40px] border-4 border-dashed border-slate-100 bg-slate-50/30 flex flex-col items-center">
                            <div className="w-20 h-20 bg-white rounded-3xl shadow-inner flex items-center justify-center text-slate-200 mb-6 border border-white">
                                <FileText size={40} />
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">{t('common.noDocuments')}</p>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6" : "grid grid-cols-2 md:flex md:flex-col gap-3 md:gap-4"}>
                            {(themeFilter ? documents.filter(d => d.topic_id === themeFilter) : documents).map((doc) => (
                                <motion.div
                                    key={doc.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={() => navigate(`/read/${doc.id}${themeFilter ? `?theme=${encodeURIComponent(themeFilter)}` : ''}`)}
                                    className={`
                                        group relative bg-white/60 hover:bg-white border border-white/80
                                        transition-all duration-300 cursor-pointer overflow-hidden
                                        ${viewMode === 'grid'
                                            ? 'p-4 md:p-8 rounded-[28px] md:rounded-[40px] shadow-sm hover:shadow-2xl hover:-translate-y-2'
                                            : 'p-3 pr-14 md:p-6 md:pr-6 rounded-2xl md:rounded-[32px] flex items-center md:justify-between gap-2 md:gap-6 hover:shadow-xl'}
                                    `}
                                >
                                    <div className={`flex items-center gap-2 md:gap-6 min-w-0 ${viewMode === 'list' ? 'w-full' : ''} ${viewMode === 'grid' ? 'flex-col text-center' : 'flex-row'}`}>
                                        <div className={`p-2 md:p-5 bg-indigo-50 text-indigo-500 rounded-xl md:rounded-3xl shadow-inner border border-white transition-transform group-hover:scale-110 duration-500 shrink-0`}>
                                            <FileText size={viewMode === 'grid' ? 28 : 18} />
                                        </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className={`text-base md:text-xl font-bold text-slate-800 mb-1 ${viewMode === 'grid' ? 'line-clamp-2 break-words' : 'truncate'}`} title={doc.title}>
                                                    {doc.title}
                                                </h3>
                                                {/* Progress Bar (Only for PDFs with progress) */}
                                                 {doc.file_type === 'pdf' && progressMap[doc.id] !== undefined && (
                                                     <div className={`h-1.5 bg-slate-100 rounded-full mb-2 overflow-hidden ${viewMode === 'grid' ? 'w-full max-w-[160px] mx-auto' : 'w-full max-w-[120px]'}`}>
                                                         <div
                                                             className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                                             style={{ width: `${progressMap[doc.id]}%` }}
                                                         />
                                                     </div>
                                                 )}
                                                 <div className={`flex items-center gap-x-2 md:gap-x-3 gap-y-1.5 flex-wrap ${viewMode === 'grid' ? 'justify-center' : ''}`}>
                                                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{doc.file_type}</span>
                                                     {progressMap[doc.id] !== undefined && (
                                                         <>
                                                             <div className="w-1.5 h-1.5 rounded-full bg-slate-200 hidden md:block" />
                                                             <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                                                                 {progressMap[doc.id]}%
                                                             </span>
                                                         </>
                                                     )}
                                                     {doc.topic_id && (
                                                    <>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 hidden md:block" />
                                                        <div className={`items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-lg ${viewMode === 'list' ? 'hidden md:inline-flex' : 'inline-flex'}`}>
                                                            <Tag size={10} />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                                                                {themes.find(t => t.id === doc.topic_id)?.name || t('common.unknownTopic', '未知主题')}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 hidden md:block" />
                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap">
                                                    {new Date(doc.created_at).toLocaleDateString()}
                                                </span>
                                                {lastOpenedMap[doc.id] && (
                                                    <>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 hidden md:block" />
                                                        <span className={`text-[10px] font-bold text-indigo-400 uppercase tracking-widest whitespace-nowrap ${viewMode === 'list' ? 'hidden md:inline' : ''}`} title={t('common.lastOpened', '上次打开')}>
                                                            ⏱ {formatRelative(lastOpenedMap[doc.id])}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`flex items-center gap-1 md:gap-2 shrink-0 absolute top-2 right-2 md:static ${viewMode === 'grid' ? 'md:absolute md:top-3 md:right-3' : ''}`}>
                                        <button
                                            onClick={(e) => handleEditClick(e, doc)}
                                            className={`text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl md:rounded-2xl transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 active:scale-90 p-1.5 bg-white/80 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none ${viewMode === 'grid' ? 'md:p-2 md:bg-white/80 md:backdrop-blur-sm' : 'md:p-3'}`}
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteClick(e, doc)}
                                            className={`text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl md:rounded-2xl transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 active:scale-90 p-1.5 bg-white/80 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none ${viewMode === 'grid' ? 'md:p-2 md:bg-white/80 md:backdrop-blur-sm' : 'md:p-3'}`}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title={t('common.deleteConfirmTitle', '确认删除')}
                message={t('common.deleteConfirmMessage', { defaultValue: `确定要永久删除 "${docToDelete?.title}" 吗？此操作无法撤销。`, title: docToDelete?.title })}
                confirmLabel={t('common.delete', '彻底删除')}
                cancelLabel={t('common.cancel', '取消')}
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
                type="danger"
            />

            <DocumentUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => {
                    setIsUploadModalOpen(false);
                    setDraggedFile(null);
                }}
                onUploadComplete={() => {
                    setDraggedFile(null);
                    fetchDocuments();
                }}
                defaultTopicId={themeFilter}
                initialFile={draggedFile}
            />

            <DocumentEditModal
                isOpen={isEditModalOpen}
                document={docToEdit}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setDocToEdit(null);
                }}
                onUpdateComplete={fetchDocuments}
            />

            <BottomNav />
        </div>
    );
};


export default LibraryPage;
