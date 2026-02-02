import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Using a stable CDN worker for the PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfReaderProps {
    fileUrl: string;
    title: string;
}

// Sub-component for Lazy Loading Individual Pages
const LazyPage: React.FC<{
    pageNumber: number;
    scale: number;
    onVisible: (page: number) => void;
}> = ({ pageNumber, scale, onVisible }) => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    onVisible(pageNumber);
                } else {
                    // Optional: Unload pages that are far away to save memory
                    // We keep a buffer zone (rootMargin) so they don't flicker
                    setIsVisible(false);
                }
            });
        }, {
            rootMargin: '600px 0px', // Pre-load pages 600px before they appear
            threshold: 0.01
        });

        if (containerRef.current) obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, [pageNumber, onVisible]);

    return (
        <div
            ref={containerRef}
            className="pdf-page-wrapper w-full flex justify-center py-4"
            style={{ minHeight: isVisible ? 'auto' : `${800 * scale}px` }}
            data-page-number={pageNumber}
        >
            {isVisible ? (
                <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#e9e6da]"
                    loading={
                        <div className="w-full flex items-center justify-center p-20 bg-white/50 rounded-lg animate-pulse" style={{ height: `${800 * scale}px`, width: `${595 * scale}px` }}>
                            <p className="text-[#8d8876] text-xs font-medium">{t('reader.loadingPage', { pageNumber })}</p>
                        </div>
                    }
                />
            ) : (
                <div
                    className="bg-[#f0eee9]/30 rounded-lg border border-[#e9e6da]/50 animate-shimmer"
                    style={{ height: `${842 * scale}px`, width: `${595 * scale}px` }}
                />
            )}
        </div>
    );
};

const PdfReader: React.FC<PdfReaderProps> = ({ fileUrl }) => {
    const { t } = useTranslation();
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [firstPageRendered, setFirstPageRendered] = useState(false);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        // Don't set isLoaded here immediately, wait for first page render
    }

    // Callback when the first page finishes rendering
    const onFirstPageRenderSuccess = () => {
        if (!firstPageRendered) {
            setFirstPageRendered(true);
            setTimeout(() => setIsLoaded(true), 100); // Small buffer to ensure visual readiness
        }
    };

    return (
        <div className="flex flex-col items-center w-full transition-all duration-500">
            {/* Minimalist Cozy Toolbar - Simplified for Scrolling */}
            <div className="w-full bg-[#faf9f6]/95 backdrop-blur-md border-b border-[#e9e6da] px-4 md:px-8 py-3 flex items-center sticky top-0 z-50">
                {/* Left space for the back button in ReaderPage */}
                <div className="w-20 md:w-32 shrink-0 hidden sm:block"></div>

                {/* Center: Page Indicator */}
                <div className="flex-1 flex justify-center overflow-hidden">
                    <div className="flex items-center bg-[#f0eee9]/50 rounded-lg px-3 md:px-4 py-1.5 border border-[#e9e6da] max-w-full">
                        <div className="text-[10px] md:text-xs font-semibold text-[#6b6654] text-center whitespace-nowrap">
                            {t('reader.page')} <span className="mx-0.5 md:mx-1">{pageNumber}</span> <span className="opacity-40 mx-0.5">/</span> {numPages || '-'}
                        </div>
                    </div>
                </div>

                {/* Right: Zoom Controls */}
                <div className="flex items-center gap-1 bg-[#f0eee9]/50 rounded-lg p-0.5 border border-[#e9e6da] shrink-0">
                    <button
                        onClick={() => setScale(s => Math.max(0.3, s - 0.1))} // Allow smaller scale for large docs
                        className="p-1 md:p-1.5 hover:bg-white rounded-md transition-all text-[#6b6654]"
                    >
                        <ZoomOut size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                    <span className="text-[9px] md:text-[10px] font-bold text-[#6b6654] min-w-[35px] md:min-w-[40px] text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={() => setScale(s => Math.min(2.0, s + 0.2))}
                        className="p-1 md:p-1.5 hover:bg-white rounded-md transition-all text-[#6b6654]"
                    >
                        <ZoomIn size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                </div>
            </div>

            {/* Content Area - Virtualized Scrolling List */}
            <div className={`w-full flex flex-col items-center py-8 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                {/* Custom Loading State - Shown until first page is ready */}
                {!isLoaded && (
                    <div className="absolute inset-0 top-20 flex flex-col items-center justify-center gap-4 z-40 bg-[#faf9f6]">
                        <Loader2 className="animate-spin text-[#d97706] w-10 h-10" />
                        <p className="text-[#8d8876] font-medium animate-pulse">{t('reader.opening')}</p>
                    </div>
                )}

                <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="flex flex-col items-center min-h-screen"
                    loading={null} // We handle loading state externally
                    error={
                        <div className="text-red-500 p-8 bg-red-50 rounded-2xl border border-red-100 mt-10">
                            <p className="font-semibold">{t('reader.loadError')}</p>
                            <p className="text-sm opacity-70">{t('reader.checkFile')}</p>
                        </div>
                    }
                >
                    {numPages > 0 && (
                        /* First Page - Critical for initial load */
                        <div className="pdf-page-wrapper w-full flex justify-center py-4 mb-4">
                            <Page
                                pageNumber={1}
                                scale={scale}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                className="shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#e9e6da]"
                                onRenderSuccess={onFirstPageRenderSuccess}
                                loading={null}
                            />
                        </div>
                    )}

                    {/* Remaining Pages - Lazy Loaded */}
                    {numPages > 1 && Array.from(new Array(numPages - 1), (_, index) => (
                        <LazyPage
                            key={`page_${index + 2}`}
                            pageNumber={index + 2}
                            scale={scale}
                            onVisible={(pg) => setPageNumber(pg)}
                        />
                    ))}
                </Document>
            </div>
        </div>
    );
};

export default PdfReader;
