import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAuthHeaders } from '../api/client';
import PdfReader from '../components/PdfReader';
import CozyPal from '../components/CozyPal';

import FloatingTimer from '../components/FloatingTimer';

const ReaderPage: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [content, setContent] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [fileType, setFileType] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [documentId, setDocumentId] = useState<number | null>(null);
    const [documentTitle, setDocumentTitle] = useState<string>('');
    const [documentContent, setDocumentContent] = useState<string>('');
    const [apiKey, setApiKey] = useState<string>('');
    const [currentLanguage, setCurrentLanguage] = useState<string>('zh');
    const [aiPersona, setAiPersona] = useState<string>('friendly');
    const [aiProvider, setAiProvider] = useState<string>('gemini');
    const [aiModel, setAiModel] = useState<string>('');
    const [dailyCompletedPomodoros, setDailyCompletedPomodoros] = useState<number>(0);
    const [totalFocusMinutes, setTotalFocusMinutes] = useState<number>(0);

    // Sidebar States
    const [sidebarWidth, setSidebarWidth] = useState(0);

    useEffect(() => {
        if (id) {
            fetchDocumentContent(id);
        }
        return () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
    }, [id]);

    const fetchDocumentContent = async (docId: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/documents/${docId}`, {
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                const data = await response.json();
                setContent(data.content || t('reader.noExtraction'));
                setTitle(data.title || t('common.library'));
                setFileType(data.file_type || '');
                setDocumentId(parseInt(docId));
                setDocumentTitle(data.title || '');
                setDocumentContent(data.content || '');

                if (data.file_type === 'pdf') {
                    const fileResponse = await fetch(`/api/documents/${docId}/file`, {
                        headers: getAuthHeaders(),
                    });
                    if (fileResponse.ok) {
                        const blob = await fileResponse.blob();
                        const url = URL.createObjectURL(blob);
                        setPdfUrl(url);
                    }
                }
            } else {
                setContent(t('reader.errorDetail'));
            }
        } catch (error) {
            console.error('Failed to fetch document content', error);
            setContent(t('reader.errorLoading'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen bg-[#faf9f6] flex flex-col overflow-hidden relative">
            <FloatingTimer />
            {/* Header */}
            <div className="h-16 bg-white/90 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-4 md:px-8 z-50 flex-shrink-0">
                <button
                    onClick={() => navigate('/library')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                >
                    <ArrowLeft size={20} />
                    <span className="hidden sm:inline">{t('common.back')}</span>
                </button>

                <h1 className="font-semibold text-gray-800 truncate max-w-md text-center">{title}</h1>

                {/* Placeholders for header right side if needed */}
                <div className="w-10"></div>
            </div>

            <div className="flex flex-1 relative overflow-hidden h-full">
                {/* Main Content Area */}
                <motion.div
                    className="flex-1 overflow-y-auto pb-20 px-0 transition-all duration-300 ease-out h-full"
                    animate={{ marginRight: sidebarWidth }}
                >
                    {isLoading ? (
                        <div className="flex justify-center items-center h-80 pt-24">
                            <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
                        </div>
                    ) : fileType === 'pdf' ? (
                        <div className="w-full relative h-full">
                            {/* Make PDF reader fill the available space */}
                            <PdfReader fileUrl={pdfUrl} title={title} />
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-8">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="prose prose-indigo md:prose-lg lg:prose-xl whitespace-pre-wrap font-serif text-gray-800 leading-relaxed selection:bg-indigo-100 selection:text-indigo-900"
                            >
                                {content}
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Cozy Pal AI Companion with Document Context */}
            <CozyPal
                themeName="default"
                phase="focus"
                timeLeft={0}
                apiKey={apiKey}
                currentLanguage={currentLanguage}
                aiPersona={aiPersona}
                aiProvider={aiProvider}
                aiModel={aiModel}
                dailyCompletedPomodoros={dailyCompletedPomodoros}
                totalFocusMinutes={totalFocusMinutes}
                documentId={documentId || undefined}
                documentTitle={documentTitle}
                documentContent={documentContent}
                onDimensionsChange={setSidebarWidth}
            />
        </div>
    );
};

export default ReaderPage;
