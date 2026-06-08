import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PdfReader from '../components/PdfReader';
import AmbientBackground from '../components/AmbientBackground';
import { useTimerContext } from '../contexts/useTimerContext';
import { getDocuments, getDocumentFile } from '../lib/storage/documents';

const ReaderPage: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const backToLibrary = () => {
        const theme = searchParams.get('theme');
        navigate(theme ? `/library?theme=${encodeURIComponent(theme)}` : '/library');
    };
    const { setDocumentContext } = useTimerContext();

    const [content, setContent] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [fileType, setFileType] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [pdfUrl, setPdfUrl] = useState<string>('');

    // Ref to track current PDF URL for cleanup
    const pdfUrlRef = React.useRef<string>('');

    const fetchDocumentContent = useCallback(async (docIdStr: string, signal: AbortSignal) => {
        setIsLoading(true);
        try {
            const docId = parseInt(docIdStr, 10);
            const documents = await getDocuments();
            const doc = documents.find(d => d.id === docId);

            if (doc) {
                const docTitle = doc.title || t('common.library');
                const docContent = ''; // Default client-side extracted empty context (handled by reader session layers)

                setContent(docContent || t('reader.noExtraction'));
                setTitle(docTitle);
                setFileType(doc.file_type || '');

                // Set Global AI Context
                setDocumentContext({
                    id: docId,
                    title: docTitle,
                    content: docContent
                });

                if (doc.file_type === 'pdf') {
                    try {
                        const blob = await getDocumentFile(docId);
                        const url = URL.createObjectURL(blob);

                        if (pdfUrlRef.current) {
                            URL.revokeObjectURL(pdfUrlRef.current);
                        }

                        pdfUrlRef.current = url;
                        setPdfUrl(url);
                    } catch (fileErr) {
                        console.error('Failed to load PDF file from IndexedDB:', fileErr);
                        setContent(t('reader.errorLoading'));
                    }
                }
            } else {
                setContent(t('reader.errorDetail'));
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return;
            console.error('Failed to fetch document content', error);
            setContent(t('reader.errorLoading'));
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    }, [setDocumentContext, t]);

    useEffect(() => {
        const abortController = new AbortController();

        if (id) {
            fetchDocumentContent(id, abortController.signal);
            // 记录最近打开时间，用于书库展示
            try {
                localStorage.setItem(`doc_last_opened_${id}`, new Date().toISOString());
            } catch {
                // ignore
            }
        }

        return () => {
            abortController.abort();
            setDocumentContext(undefined); // Clear context on exit
            if (pdfUrlRef.current) {
                URL.revokeObjectURL(pdfUrlRef.current);
                pdfUrlRef.current = '';
            }
        };
    }, [id, setDocumentContext, fetchDocumentContent]);

    return (
        <div className="h-screen bg-[#FCFAF7] flex flex-col overflow-hidden relative">
            <AmbientBackground />

            {/* PDF 模式下 header 已合并进 PdfReader 顶部工具栏；非 PDF 文档保留单独 header */}
            {fileType !== 'pdf' && (
                <div className="h-20 bg-white/60 backdrop-blur-3xl border-b border-slate-100 flex items-center justify-between px-8 z-50 flex-shrink-0">
                    <motion.button
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={backToLibrary}
                        className="flex items-center gap-2 group text-slate-400 hover:text-slate-900 transition-colors font-bold uppercase tracking-widest text-[10px]"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span>{t('common.back')}</span>
                    </motion.button>

                    <h1 className="font-bold text-slate-700 truncate text-center leading-tight text-base max-w-xl">
                        {title}
                    </h1>

                    <div className="w-20" />
                </div>
            )}

            <div className="flex flex-1 relative overflow-hidden h-full z-10">
                {/* Main Content Area */}
                <motion.div
                    className="flex-1 overflow-y-auto transition-all duration-300 ease-out h-full"
                    style={{ scrollbarGutter: 'stable' }}
                >
                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center h-full gap-4">
                            <Loader2 className="animate-spin text-indigo-500 w-10 h-10" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                {t('timer.loading')}
                            </span>
                        </div>
                    ) : fileType === 'pdf' ? (
                        <div className="w-full relative h-full bg-slate-50/50">
                            <PdfReader fileUrl={pdfUrl} title={title} documentId={id} />
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto px-8 py-16">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white/80 backdrop-blur-xl p-12 md:p-20 rounded-[48px] shadow-2xl border border-white prose prose-slate prose-lg lg:prose-xl whitespace-pre-wrap text-slate-800 leading-relaxed selection:bg-indigo-100 selection:text-indigo-900"
                            >
                                {content}
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ReaderPage;
