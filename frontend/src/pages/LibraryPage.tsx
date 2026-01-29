import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2, FileText, BookOpen, Loader2, ArrowLeft, AlertTriangle, X, LayoutGrid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuthHeaders } from '../api/client';
import FloatingTimer from '../components/FloatingTimer';
import CozyPal from '../components/CozyPal';
import { useTimerContext } from '../contexts/TimerContext';

interface Document {
    id: number;
    title: string;
    filename: string;
    file_type: string;
    created_at: string;
}

const LibraryPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isActive } = useTimerContext();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState<Document | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/documents/', {
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

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name.replace(/\.[^/.]+$/, ""));

        try {
            const { 'Content-Type': contentType, ...authHeaders } = getAuthHeaders();
            const response = await fetch('/api/documents/upload', {
                method: 'POST',
                headers: {
                    ...authHeaders,
                },
                body: formData,
            });

            if (response.ok) {
                await fetchDocuments();
            } else {
                const errorText = await response.text();
                console.error('Upload failed:', response.status, errorText);
                alert(`Upload failed: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert(`Network error: ${error}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, doc: Document) => {
        e.stopPropagation();
        setDocToDelete(doc);
        setIsDeleteModalOpen(true);
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

    return (
        <div className="min-h-screen bg-cozy-cream p-4 sm:p-6 md:p-8 relative">
            <FloatingTimer />
            {isActive && <CozyPal />}

            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-cozy-orange/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-cozy-green/5 rounded-full blur-[140px] animate-pulse" />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-cozy-text-light hover:text-cozy-text transition-colors"
                    >
                        <ArrowLeft size={20} />
                        {t('common.backToTimer')}
                    </button>
                    <h1 className="text-3xl font-bold text-cozy-text font-heading flex items-center gap-3">
                        <BookOpen className="text-indigo-500" />
                        {t('common.library')}
                    </h1>
                </div>

                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm border border-white">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-700">{t('common.yourDocuments')}</h2>
                        <div className="flex items-center gap-4">
                            <div className="flex bg-gray-100/50 p-1 rounded-xl border border-gray-200">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    title={t('common.gridView')}
                                >
                                    <LayoutGrid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    title={t('common.listView')}
                                >
                                    <List size={18} />
                                </button>
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-200 transition-all flex items-center gap-2 text-sm"
                            >
                                {isUploading ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload className="w-4 h-4" />}
                                {isUploading ? t('common.uploading') : t('common.uploadNew')}
                            </button>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".pdf,.docx,.txt,.md"
                            onChange={handleFileUpload}
                        />
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="animate-spin text-indigo-500" />
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>{t('common.noDocuments')}</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {documents.map((doc) => (
                                <motion.div
                                    key={doc.id}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate(`/read/${doc.id}`)}
                                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl shrink-0">
                                            <FileText size={24} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-gray-800 truncate mb-1" title={doc.title}>{doc.title}</h3>
                                            <p className="text-xs text-gray-400 uppercase tracking-wider">{doc.file_type}</p>
                                            <p className="text-xs text-gray-300 mt-2">{new Date(doc.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteClick(e, doc)}
                                        className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title={t('common.delete')}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {documents.map((doc) => (
                                <motion.div
                                    key={doc.id}
                                    whileHover={{ x: 4, backgroundColor: '#f9fafb' }}
                                    whileTap={{ scale: 0.995 }}
                                    onClick={() => navigate(`/read/${doc.id}`)}
                                    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl shrink-0">
                                            <FileText size={20} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-gray-800 truncate" title={doc.title}>{doc.title}</h3>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{doc.file_type}</span>
                                                <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                                <span className="text-[11px] text-gray-400">{new Date(doc.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteClick(e, doc)}
                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 shrink-0"
                                        title={t('common.delete')}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-white"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="p-4 bg-red-50 text-red-500 rounded-2xl mb-4">
                                    <AlertTriangle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{t('common.deleteConfirmTitle')}</h3>
                                <p className="text-gray-500 mb-8 leading-relaxed">
                                    {t('common.deleteConfirmMessage', { title: docToDelete?.title })}
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => {
                                            setIsDeleteModalOpen(false);
                                            setDocToDelete(null);
                                        }}
                                        className="flex-1 py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl font-semibold transition-colors"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold shadow-md shadow-red-100 transition-colors"
                                    >
                                        {t('common.delete')}
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setDocToDelete(null);
                                }}
                                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-gray-500 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LibraryPage;
