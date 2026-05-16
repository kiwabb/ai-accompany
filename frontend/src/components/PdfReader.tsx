import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Loader2, ZoomIn, ZoomOut, ListTree, Bookmark, Trash2, Pencil, Check, X, Search, Copy, PenLine, Eraser, NotebookPen, RotateCw, Download, Maximize2, Minimize2, ChevronLeft, ChevronRight, Sun, Moon, Coffee, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { createWorker } from 'tesseract.js';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { getAuthHeaders } from '../api/client';

// Using a local worker for better performance and offline support
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface BookmarkType {
    id: string;
    page: number;
    createdAt: string;
    note?: string;
    fullText?: string;
    linkedHighlightId?: string;
}

interface HighlightRect {
    left: number;
    top: number;
    width: number;
    height: number;
}

type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

interface HighlightItem {
    id: string;
    page: number;
    rects: HighlightRect[];
    createdAt: string;
    text?: string;
    linkedBookmarkId?: string;
    color?: HighlightColor;
}

const HIGHLIGHT_COLORS: Record<HighlightColor, { bg: string; border: string; swatch: string }> = {
    yellow: { bg: 'rgba(250, 204, 21, 0.30)', border: 'rgba(202, 138, 4, 0.45)', swatch: '#facc15' },
    green: { bg: 'rgba(74, 222, 128, 0.28)', border: 'rgba(22, 163, 74, 0.45)', swatch: '#4ade80' },
    blue: { bg: 'rgba(96, 165, 250, 0.30)', border: 'rgba(37, 99, 235, 0.45)', swatch: '#60a5fa' },
    pink: { bg: 'rgba(244, 114, 182, 0.28)', border: 'rgba(219, 39, 119, 0.45)', swatch: '#f472b6' },
};

interface PxRect {
    left: number;
    top: number;
    width: number;
    height: number;
}

interface AreaSelectionState {
    page: number;
    rect: HighlightRect;
    anchorX: number;
    anchorY: number;
}

interface AreaDragState {
    page: number;
    pageElement: HTMLElement;
    startX: number;
    startY: number;
}

interface ReaderNotice {
    text: string;
    tone: 'success' | 'error';
}

interface HighlightActionArea {
    id: string;
    left: number;
    top: number;
    width: number;
    height: number;
}

interface PenPoint {
    x: number;
    y: number;
}

interface PenStroke {
    id: string;
    page: number;
    path: string;
    width: number;
    color: string;
    createdAt: string;
    bounds?: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    };
}

interface PenDraftState {
    page: number;
    pageElement: HTMLElement;
    points: PenPoint[];
}

interface PenEraseState {
    page: number;
    pageElement: HTMLElement;
}

const EMPTY_HIGHLIGHT_MENU = {
    visible: false,
    x: 0,
    y: 0,
    highlightId: null as string | null,
};

const PEN_COLORS = ['#2563eb', '#dc2626', '#059669', '#7c3aed', '#111827'];
const PEN_WIDTHS = [0.34, 0.52, 0.74];

type CursorMode = 'auto' | 'text' | 'crosshair';

interface PdfReaderProps {
    fileUrl: string;
    title: string;
    documentId?: string;
}

interface ColoredHighlightRect extends HighlightRect {
    color: HighlightColor;
}

const HighlightInteractiveLayer: React.FC<{
    pageNumber: number;
    highlightRects: ColoredHighlightRect[];
    highlightActionAreas: HighlightActionArea[];
    onHighlightHover: (event: React.MouseEvent<HTMLButtonElement>, highlightId: string) => void;
    onHighlightLeave: () => void;
    actionTitle: string;
    disabled?: boolean;
}> = ({ pageNumber, highlightRects, highlightActionAreas, onHighlightHover, onHighlightLeave, actionTitle, disabled = false }) => (
    <>
        {highlightRects.map((rect, idx) => {
            const palette = HIGHLIGHT_COLORS[rect.color] ?? HIGHLIGHT_COLORS.yellow;
            return (
                <div
                    key={`${pageNumber}-${idx}`}
                    className="absolute rounded-[2px] pointer-events-none"
                    style={{
                        left: `${rect.left}%`,
                        top: `${rect.top}%`,
                        width: `${rect.width}%`,
                        height: `${rect.height}%`,
                        backgroundColor: palette.bg,
                        border: `1px solid ${palette.border}`,
                        mixBlendMode: 'multiply',
                    }}
                />
            );
        })}
        {!disabled && highlightActionAreas.map((area) => (
            <button
                key={`hit-${pageNumber}-${area.id}`}
                type="button"
                onClick={(event) => onHighlightHover(event, area.id)}
                onMouseLeave={onHighlightLeave}
                className="absolute z-20 bg-transparent cursor-pointer hover:outline hover:outline-1 hover:outline-amber-500/70"
                style={{
                    left: `${area.left}%`,
                    top: `${area.top}%`,
                    width: `${area.width}%`,
                    height: `${area.height}%`,
                }}
                aria-label="highlight-actions"
                title={actionTitle}
            />
        ))}
    </>
);

const HandwritingLayer: React.FC<{ strokes: PenStroke[]; draftPath?: string }> = ({ strokes, draftPath }) => (
    <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
    >
        {strokes.map((stroke) => (
            <g key={stroke.id}>
                <path
                    d={stroke.path}
                    fill="none"
                    stroke="rgba(15, 23, 42, 0.18)"
                    strokeWidth={stroke.width + 0.22}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d={stroke.path}
                    fill="none"
                    stroke={stroke.color}
                    strokeWidth={stroke.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d={stroke.path}
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth={Math.max(0.12, stroke.width * 0.45)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>
        ))}
        {draftPath && (
            <path
                d={draftPath}
                fill="none"
                stroke="rgba(59,130,246,0.8)"
                strokeWidth={0.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        )}
    </svg>
);

// Sub-component for Lazy Loading Individual Pages
const PageThumbnail: React.FC<{
    pdf: PDFDocumentProxy;
    pageNumber: number;
    isActive: boolean;
    onClick: () => void;
}> = ({ pdf, pageNumber, isActive, onClick }) => {
    const wrapRef = useRef<HTMLButtonElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) {
                        setIsVisible(true);
                        io.disconnect();
                        break;
                    }
                }
            },
            { rootMargin: '240px 0px' }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    // 直接用 pdfjs 把页面渲染到 canvas，共享 PDFDocumentProxy 缓存，避免重新解析。
    useEffect(() => {
        if (!isVisible) return;
        let cancelled = false;
        const renderThumb = async () => {
            try {
                const page = await pdf.getPage(pageNumber);
                if (cancelled) return;
                const viewport = page.getViewport({ scale: 0.3 });
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                const dpr = Math.min(2, window.devicePixelRatio || 1);
                canvas.width = Math.floor(viewport.width * dpr);
                canvas.height = Math.floor(viewport.height * dpr);
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                const renderTask = page.render({ canvas, canvasContext: ctx, viewport });
                await renderTask.promise;
                if (!cancelled) setIsReady(true);
            } catch (err) {
                if (!cancelled) console.warn('thumbnail render failed', err);
            }
        };
        void renderThumb();
        return () => {
            cancelled = true;
        };
    }, [isVisible, pdf, pageNumber]);

    useEffect(() => {
        if (isActive && wrapRef.current) {
            wrapRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [isActive]);

    return (
        <button
            ref={wrapRef}
            onClick={onClick}
            className={`group w-full flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${isActive ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'hover:bg-slate-50'}`}
        >
            <div className="w-full aspect-[3/4] bg-white border border-[#e9e6da] rounded overflow-hidden flex items-center justify-center">
                <canvas
                    ref={canvasRef}
                    style={{ display: isReady ? 'block' : 'none', width: '100%', height: 'auto' }}
                />
                {!isReady && <div className="w-full h-full bg-slate-50 animate-pulse" />}
            </div>
            <span className={`text-[10px] font-bold tabular-nums ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                {pageNumber}
            </span>
        </button>
    );
};

const LazyPage = React.memo(({
    pageNumber,
    pageWidth,
    rotation,
    onVisible,
    highlightRects,
    highlightActionAreas,
    onHighlightHover,
    onHighlightLeave,
    highlightActionsDisabled,
    penStrokes,
    draftPenPath,
    areaDraftRect,
    areaSelectedRect,
}: {
    pageNumber: number;
    rotation: 0 | 90 | 180 | 270;
    pageWidth: number;
    onVisible: (page: number) => void;
    highlightRects: ColoredHighlightRect[];
    highlightActionAreas: HighlightActionArea[];
    onHighlightHover: (event: React.MouseEvent<HTMLButtonElement>, highlightId: string) => void;
    onHighlightLeave: () => void;
    highlightActionsDisabled?: boolean;
    penStrokes: PenStroke[];
    draftPenPath?: string;
    areaDraftRect?: HighlightRect;
    areaSelectedRect?: HighlightRect;
}) => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    onVisible(pageNumber);
                }
            });
        }, {
            rootMargin: '320px 0px',
            threshold: 0.01
        });

        if (containerRef.current) obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, [pageNumber, onVisible]);

    return (
        <div
            ref={containerRef}
            className="pdf-page-wrapper relative w-full flex justify-center py-2"
            style={{ minHeight: isVisible ? 'auto' : `${Math.round(pageWidth * 1.35)}px` }}
            data-page-number={pageNumber}
        >
            {isVisible ? (
                <Page
                    pageNumber={pageNumber}
                    width={pageWidth}
                    rotate={rotation}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    devicePixelRatio={Math.max(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)}
                    className="shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#e9e6da]"
                    loading={
                        <div className="w-full flex items-center justify-center p-20 bg-white/50 rounded-lg animate-pulse" style={{ height: `${Math.round(pageWidth * 1.35)}px`, width: `${pageWidth}px` }}>
                            <p className="text-[#8d8876] text-xs font-medium">{t('reader.loadingPage', { pageNumber })}</p>
                        </div>
                    }
                />
            ) : (
                <div
                    className="bg-[#f0eee9]/30 rounded-lg border border-[#e9e6da]/50 animate-shimmer"
                    style={{ height: `${Math.round(pageWidth * 1.42)}px`, width: `${pageWidth}px` }}
                />
            )}
            <HighlightInteractiveLayer
                pageNumber={pageNumber}
                highlightRects={highlightRects}
                highlightActionAreas={highlightActionAreas}
                onHighlightHover={onHighlightHover}
                onHighlightLeave={onHighlightLeave}
                actionTitle={t('reader.highlightActions', '高亮操作')}
                disabled={highlightActionsDisabled}
            />
            <HandwritingLayer strokes={penStrokes} draftPath={draftPenPath} />
            {areaDraftRect && (
                <div
                    className="absolute border-2 border-amber-400 bg-amber-200/20 pointer-events-none"
                    style={{
                        left: `${areaDraftRect.left}%`,
                        top: `${areaDraftRect.top}%`,
                        width: `${areaDraftRect.width}%`,
                        height: `${areaDraftRect.height}%`,
                    }}
                />
            )}
            {areaSelectedRect && (
                <div
                    className="absolute border-2 border-amber-500 bg-amber-300/25 pointer-events-none"
                    style={{
                        left: `${areaSelectedRect.left}%`,
                        top: `${areaSelectedRect.top}%`,
                        width: `${areaSelectedRect.width}%`,
                        height: `${areaSelectedRect.height}%`,
                    }}
                />
            )}
        </div>
    );
});

const OutlineItem: React.FC<{ item: any; onClick: (item: any) => void; level: number }> = ({ item, onClick, level }) => {
    const hasChildren = item.items && item.items.length > 0;
    const [isOpen, setIsOpen] = useState(true);

    return (
        <li className="text-sm">
            <div
                className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-[#f0eee9] transition-colors"
                onClick={() => hasChildren ? setIsOpen(!isOpen) : onClick(item)}
                style={{ paddingLeft: `${0.5 + level * 1}rem` }}
            >
                {hasChildren && (
                    <motion.div animate={{ rotate: isOpen ? 90 : 0 }} className="text-slate-400">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 1.5L5.5 4L3 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </motion.div>
                )}
                <span className={`flex-1 truncate ${!hasChildren ? 'text-[#4b483e]' : 'font-semibold text-[#6b6654]'}`}>
                    {item.title}
                </span>
                {!hasChildren && (
                    <span className="text-xs text-slate-400/80 font-mono">
                        {item.pageNumber || (typeof item.dest === 'string' ? item.dest : '')}
                    </span>
                )}
            </div>
            {hasChildren && isOpen && (
                <ul className="pl-4 border-l border-slate-200/80 ml-2">
                    {item.items.map((child: any, index: number) => (
                        <OutlineItem key={index} item={child} onClick={onClick} level={level + 1} />
                    ))}
                </ul>
            )}
        </li>
    );
};

const PdfReader: React.FC<PdfReaderProps> = ({ fileUrl, documentId }) => {
    const { t } = useTranslation();
    const [numPages, setNumPages] = useState<number>(0);
    const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
    const [pageNumber, setPageNumber] = useState<number>(() => {
        if (!documentId) return 1;
        const saved = localStorage.getItem(`pdf_progress_${documentId}`);
        if (!saved) return 1;
        
        // Handle both old format (string number) and new format (JSON)
        try {
            const parsed = JSON.parse(saved);
            return typeof parsed === 'object' && parsed.page ? parsed.page : 1;
        } catch {
            // Fallback for old format (simple number string)
            return parseInt(saved, 10) || 1;
        }
    });
    const [scale, setScale] = useState<number>(1);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [isManualZoom, setIsManualZoom] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [firstPageRendered, setFirstPageRendered] = useState(false);
    const [outline, setOutline] = useState<any[] | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<'outline' | 'bookmarks' | 'search' | 'thumbnails'>('outline');
    const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
    const [highlights, setHighlights] = useState<HighlightItem[]>([]);
    const [bookmarkQuery, setBookmarkQuery] = useState('');
    const [selectionMenu, setSelectionMenu] = useState<{ visible: boolean; x: number; y: number; page: number | null }>({
        visible: false,
        x: 0,
        y: 0,
        page: null,
    });
    const [highlightMenu, setHighlightMenu] = useState<{ visible: boolean; x: number; y: number; highlightId: string | null }>(EMPTY_HIGHLIGHT_MENU);
    const [areaDrag, setAreaDrag] = useState<AreaDragState | null>(null);
    const [areaDraft, setAreaDraft] = useState<AreaSelectionState | null>(null);
    const [areaSelection, setAreaSelection] = useState<AreaSelectionState | null>(null);
    const [isPenMode, setIsPenMode] = useState(false);
    const [penStrokes, setPenStrokes] = useState<PenStroke[]>([]);
    const penDraftRef = useRef<PenDraftState | null>(null);
    const [penDraftView, setPenDraftView] = useState<{ page: number; path: string } | null>(null);
    const [penErase, setPenErase] = useState<PenEraseState | null>(null);
    const [penTool, setPenTool] = useState<'draw' | 'erase'>('draw');
    const [penColor, setPenColor] = useState<string>(PEN_COLORS[0]);
    const [penWidth, setPenWidth] = useState<number>(PEN_WIDTHS[1]);
    const [cursorMode, setCursorMode] = useState<CursorMode>('auto');
    const [isAltPressed, setIsAltPressed] = useState(false);
    const [notice, setNotice] = useState<ReaderNotice | null>(null);
    const [isNotebookOpen, setIsNotebookOpen] = useState(true);
    const [notePanelWidth, setNotePanelWidth] = useState(520);
    const [noteMarkdown, setNoteMarkdown] = useState('');
    const [noteDraft, setNoteDraft] = useState('');
    const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
    const [editNote, setEditNote] = useState('');
    const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isEditingPage, setIsEditingPage] = useState(false);
    const [pageInputValue, setPageInputValue] = useState('');
    const [readingMode, setReadingMode] = useState<'day' | 'sepia' | 'night'>(() => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('pdf_reading_mode') : null;
        if (saved === 'day' || saved === 'sepia' || saved === 'night') return saved;
        return 'day';
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{ page: number; snippet: string; offset: number }>>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchCursor, setSearchCursor] = useState(0);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [currentHighlightColor, setCurrentHighlightColor] = useState<HighlightColor>(() => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('pdf_highlight_color') : null;
        if (saved === 'yellow' || saved === 'green' || saved === 'blue' || saved === 'pink') return saved;
        return 'yellow';
    });

    useEffect(() => {
        try { localStorage.setItem('pdf_highlight_color', currentHighlightColor); } catch { /* ignore */ }
    }, [currentHighlightColor]);

    useEffect(() => {
        try {
            localStorage.setItem('pdf_reading_mode', readingMode);
        } catch {
            // ignore
        }
    }, [readingMode]);
    const mainContainerRef = useRef<HTMLDivElement>(null);
    const selectedRangeRef = useRef<Range | null>(null);
    const ocrWorkerRef = useRef<{ recognize: (image: Blob) => Promise<{ data: { text: string } }>; terminate: () => Promise<void> } | null>(null);
    const bookmarksRef = useRef<BookmarkType[]>([]);
    const highlightsRef = useRef<HighlightItem[]>([]);
    const penStrokesRef = useRef<PenStroke[]>([]);
    const ocrQueueRef = useRef<Promise<void>>(Promise.resolve());
    const highlightMenuHideTimerRef = useRef<number | null>(null);
    const lastPenMoveRef = useRef(0);
    const lastAreaMoveRef = useRef(0);
    const lastCursorMoveRef = useRef(0);
    const penDraftRafRef = useRef<number | null>(null);
    const resizeStartRef = useRef<{ startX: number; startWidth: number } | null>(null);

    const saveReaderState = React.useCallback(async (nextBookmarks: BookmarkType[], nextHighlights: HighlightItem[]) => {
        if (!documentId) return;
        await fetch(`/api/documents/${documentId}/reader-state`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                bookmarks: nextBookmarks,
                highlights: nextHighlights,
            }),
        });
    }, [documentId]);

    const saveNotebook = React.useCallback(async (nextMarkdown: string, options?: { silent?: boolean }) => {
        if (!documentId) return;
        try {
            await fetch(`/api/documents/${documentId}/notebook`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ markdown: nextMarkdown }),
            });
            setNoteMarkdown(nextMarkdown);
            if (!options?.silent) {
                showNotice(t('reader.noteSaved', '笔记已保存'), 'success');
            }
        } catch {
            showNotice(t('reader.noteSaveFailed', '笔记保存失败'), 'error');
        }
    }, [documentId, t]);

    const noteEditor = useCreateBlockNote({}, [documentId]);

    const filteredBookmarks = React.useMemo(() => {
        const q = bookmarkQuery.trim().toLowerCase();
        if (!q) return bookmarks;
        return bookmarks.filter((bookmark) => {
            const pageText = String(bookmark.page);
            const noteText = (bookmark.note || '').toLowerCase();
            const fullText = (bookmark.fullText || '').toLowerCase();
            return pageText.includes(q) || noteText.includes(q) || fullText.includes(q);
        });
    }, [bookmarks, bookmarkQuery]);

    const noteDirty = React.useMemo(() => {
        return noteDraft !== noteMarkdown;
    }, [noteDraft, noteMarkdown]);

    useEffect(() => {
        if (!documentId) return;
        if (!noteDirty) return;

        const timer = window.setTimeout(() => {
            void saveNotebook(noteDraft, { silent: true });
        }, 900);

        return () => window.clearTimeout(timer);
    }, [documentId, noteDraft, noteDirty, saveNotebook]);

    useEffect(() => {
        const root = document.documentElement;
        const offset = isNotebookOpen ? notePanelWidth : 0;
        root.style.setProperty('--reader-notes-offset', `${offset}px`);
        return () => {
            root.style.setProperty('--reader-notes-offset', '0px');
        };
    }, [isNotebookOpen, notePanelWidth]);

    useEffect(() => {
        const onMouseMove = (event: MouseEvent) => {
            if (!resizeStartRef.current) return;
            const deltaX = event.clientX - resizeStartRef.current.startX;
            const nextWidth = clampNotePanelWidth(resizeStartRef.current.startWidth - deltaX);
            setNotePanelWidth(nextWidth);
        };

        const onMouseUp = () => {
            resizeStartRef.current = null;
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, []);

    useEffect(() => {
        bookmarksRef.current = bookmarks;
    }, [bookmarks]);

    useEffect(() => {
        highlightsRef.current = highlights;
    }, [highlights]);

    useEffect(() => {
        penStrokesRef.current = penStrokes;
    }, [penStrokes]);

    const getBookmarkPreviewText = (bookmark: BookmarkType): string => {
        const source = (bookmark.note || bookmark.fullText || '').replace(/\s+/g, ' ').trim();
        if (!source) return '';
        const limit = 56;
        return source.length <= limit ? source : `${source.slice(0, limit)}...`;
    };

    const getOcrWorker = async () => {
        if (ocrWorkerRef.current) return ocrWorkerRef.current;

        const worker = await createWorker('chi_sim+eng');
        ocrWorkerRef.current = worker as unknown as { recognize: (image: Blob) => Promise<{ data: { text: string } }>; terminate: () => Promise<void> };
        return ocrWorkerRef.current;
    };

    useEffect(() => {
        const loadReaderState = async () => {
            if (!documentId) return;
            try {
                const response = await fetch(`/api/documents/${documentId}/reader-state`, {
                    headers: getAuthHeaders(),
                });
                if (!response.ok) {
                    setBookmarks([]);
                    setHighlights([]);
                    return;
                }
                const data = await response.json();
                setBookmarks(Array.isArray(data.bookmarks) ? data.bookmarks : []);
                setHighlights(Array.isArray(data.highlights) ? data.highlights : []);
            } catch {
                setBookmarks([]);
                setHighlights([]);
            }
        };

        loadReaderState();
    }, [documentId]);

    useEffect(() => {
        const loadNotebook = async () => {
            if (!documentId) {
                setNoteMarkdown('');
                setNoteDraft('');
                return;
            }
            try {
                const response = await fetch(`/api/documents/${documentId}/notebook`, {
                    headers: getAuthHeaders(),
                });
                if (!response.ok) {
                    setNoteMarkdown('');
                    setNoteDraft('');
                    return;
                }
                const data = await response.json();
                const markdown = typeof data.markdown === 'string' ? data.markdown : '';
                setNoteMarkdown(markdown);
                setNoteDraft(markdown);
            } catch {
                setNoteMarkdown('');
                setNoteDraft('');
            }
        };

        loadNotebook();
    }, [documentId]);

    useEffect(() => {
        if (!noteEditor) return;
        try {
            const currentMarkdown = noteEditor.blocksToMarkdownLossy(noteEditor.document).trim();
            const targetMarkdown = (noteDraft || '').trim();
            if (currentMarkdown === targetMarkdown) return;

            const sourceMarkdown = targetMarkdown.length > 0 ? targetMarkdown : '\n';
            const blocks = noteEditor.tryParseMarkdownToBlocks(sourceMarkdown);
            if (!Array.isArray(blocks) || blocks.length === 0) return;
            noteEditor.replaceBlocks(noteEditor.document, blocks);
        } catch {
            // Keep editor usable even if markdown parsing fails.
        }
    }, [noteDraft, noteEditor]);

    useEffect(() => {
        if (!documentId) {
            setPenStrokes([]);
            return;
        }

        const raw = localStorage.getItem(`pdf_pen_strokes_${documentId}`);
        if (!raw) {
            setPenStrokes([]);
            return;
        }

        try {
            const parsed = JSON.parse(raw);
            setPenStrokes(Array.isArray(parsed) ? parsed : []);
        } catch {
            setPenStrokes([]);
        }
    }, [documentId]);

    useEffect(() => {
        if (!documentId) return;
        localStorage.setItem(`pdf_pen_strokes_${documentId}`, JSON.stringify(penStrokes));
    }, [documentId, penStrokes]);

    const toggleBookmark = async () => {
        if (!documentId) return;

        const existingManual = bookmarks.find((b) => b.page === pageNumber && !b.linkedHighlightId);

        if (existingManual) {
            const nextBookmarks = bookmarks.filter((b) => b.id !== existingManual.id);
            setBookmarks(nextBookmarks);
            await saveReaderState(nextBookmarks, highlights);
        } else {
            const newBookmark: BookmarkType = {
                id: Date.now().toString(),
                page: pageNumber,
                createdAt: new Date().toISOString()
            };
            const nextBookmarks = [...bookmarks, newBookmark].sort((a, b) => a.page - b.page);
            setBookmarks(nextBookmarks);
            await saveReaderState(nextBookmarks, highlights);
        }
    };

    const deleteHighlightById = async (highlightId: string) => {
        const target = highlights.find((h) => h.id === highlightId);
        if (!target) return;

        const nextHighlights = highlights.filter((h) => h.id !== highlightId);
        let nextBookmarks = bookmarks;

        if (target.linkedBookmarkId) {
            nextBookmarks = bookmarks.filter((b) => b.id !== target.linkedBookmarkId);
            if (editingBookmarkId === target.linkedBookmarkId) {
                setEditingBookmarkId(null);
                setEditNote('');
            }
        }

        setHighlights(nextHighlights);
        setBookmarks(nextBookmarks);
        await saveReaderState(nextBookmarks, nextHighlights);
    };

    const deleteBookmark = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!documentId) return;

        const target = bookmarks.find((b) => b.id === id);
        const nextBookmarks = bookmarks.filter((b) => b.id !== id);
        let nextHighlights = highlights;

        if (target?.linkedHighlightId) {
            nextHighlights = highlights.filter((h) => h.id !== target.linkedHighlightId);
        }

        if (editingBookmarkId === id) {
            setEditingBookmarkId(null);
            setEditNote('');
        }

        setBookmarks(nextBookmarks);
        setHighlights(nextHighlights);
        await saveReaderState(nextBookmarks, nextHighlights);
    };

    const startEditing = (bookmark: BookmarkType, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingBookmarkId(bookmark.id);
        setEditNote(bookmark.note || '');
    };

    const cancelEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingBookmarkId(null);
        setEditNote('');
    };

    const saveNote = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!documentId) return;
        
        const newBookmarks = bookmarks.map(b => 
            b.id === id ? { ...b, note: editNote } : b
        );

        setBookmarks(newBookmarks);
        setEditingBookmarkId(null);
        setEditNote('');
        await saveReaderState(newBookmarks, highlights);
    };

    const highlightsByPage = React.useMemo(() => {
        const grouped = new Map<number, HighlightItem[]>();
        for (const item of highlights) {
            const list = grouped.get(item.page) ?? [];
            list.push(item);
            grouped.set(item.page, list);
        }
        return grouped;
    }, [highlights]);

    const mergedHighlightRectsByPage = React.useMemo(() => {
        // 按颜色分组合并，避免跨颜色合并丢失视觉区分
        const result = new Map<number, ColoredHighlightRect[]>();
        for (const [page, items] of highlightsByPage.entries()) {
            const byColor = new Map<HighlightColor, HighlightRect[]>();
            for (const item of items) {
                const color = (item.color ?? 'yellow') as HighlightColor;
                if (!byColor.has(color)) byColor.set(color, []);
                byColor.get(color)!.push(...item.rects);
            }
            const allMerged: ColoredHighlightRect[] = [];
            for (const [color, rawRects] of byColor.entries()) {
                const sorted = rawRects
                    .filter((r) => r.width > 0.2 && r.height > 0.2)
                    .sort((a, b) => (Math.abs(a.top - b.top) < 0.1 ? a.left - b.left : a.top - b.top));
                const merged: HighlightRect[] = [];
                const lineTolerance = 0.6;
                const gapTolerance = 0.8;
                for (const current of sorted) {
                    const prev = merged[merged.length - 1];
                    if (!prev) {
                        merged.push({ ...current });
                        continue;
                    }
                    const sameLine = Math.abs(prev.top - current.top) <= lineTolerance;
                    const closeEnough = current.left <= prev.left + prev.width + gapTolerance;
                    if (sameLine && closeEnough) {
                        const right = Math.max(prev.left + prev.width, current.left + current.width);
                        prev.left = Math.min(prev.left, current.left);
                        prev.top = Math.min(prev.top, current.top);
                        prev.height = Math.max(prev.height, current.height);
                        prev.width = right - prev.left;
                    } else {
                        merged.push({ ...current });
                    }
                }
                for (const rect of merged) allMerged.push({ ...rect, color });
            }
            result.set(page, allMerged);
        }
        return result;
    }, [highlightsByPage]);

    const highlightActionAreasByPage = React.useMemo(() => {
        const result = new Map<number, HighlightActionArea[]>();
        for (const [page, items] of highlightsByPage.entries()) {
            const areas = items
                .filter((item) => item.rects.length > 0)
                .map((item) => {
                    const left = Math.min(...item.rects.map((r) => r.left));
                    const top = Math.min(...item.rects.map((r) => r.top));
                    const right = Math.max(...item.rects.map((r) => r.left + r.width));
                    const bottom = Math.max(...item.rects.map((r) => r.top + r.height));
                    return {
                        id: item.id,
                        left,
                        top,
                        width: Math.max(1, right - left),
                        height: Math.max(1, bottom - top),
                    };
                });
            result.set(page, areas);
        }
        return result;
    }, [highlightsByPage]);

    const getPageHighlights = React.useCallback((page: number): ColoredHighlightRect[] => {
        return mergedHighlightRectsByPage.get(page) ?? [];
    }, [mergedHighlightRectsByPage]);

    const getPageHighlightActionAreas = React.useCallback((page: number): HighlightActionArea[] => {
        return highlightActionAreasByPage.get(page) ?? [];
    }, [highlightActionAreasByPage]);

    const getPagePenStrokes = React.useCallback((page: number): PenStroke[] => {
        return penStrokes.filter((item) => item.page === page);
    }, [penStrokes]);

    const getPageDraftPenPath = React.useCallback((page: number): string | undefined => {
        if (!penDraftView || penDraftView.page !== page) return undefined;
        return penDraftView.path;
    }, [penDraftView]);

    const closeHighlightMenu = () => {
        setHighlightMenu(EMPTY_HIGHLIGHT_MENU);
    };

    const clearPenDraft = () => {
        penDraftRef.current = null;
        setPenDraftView(null);
        if (penDraftRafRef.current !== null) {
            window.cancelAnimationFrame(penDraftRafRef.current);
            penDraftRafRef.current = null;
        }
    };

    const stopPenMode = () => {
        setIsPenMode(false);
        setPenTool('draw');
        clearPenDraft();
        setPenErase(null);
        setCursorModeIfNeeded('auto');
    };

    const openHighlightMenu = (event: React.MouseEvent<HTMLButtonElement>, highlightId: string) => {
        if (highlightMenuHideTimerRef.current !== null) {
            window.clearTimeout(highlightMenuHideTimerRef.current);
            highlightMenuHideTimerRef.current = null;
        }
        if (areaDrag) return;
        setSelectionMenu((prev) => ({ ...prev, visible: false, page: null }));
        setAreaSelection(null);
        setHighlightMenu({
            visible: true,
            x: event.clientX,
            y: event.clientY - 10,
            highlightId,
        });
    };

    const scheduleHideHighlightMenu = () => {
        if (highlightMenuHideTimerRef.current !== null) {
            window.clearTimeout(highlightMenuHideTimerRef.current);
        }
        highlightMenuHideTimerRef.current = window.setTimeout(() => {
            closeHighlightMenu();
            highlightMenuHideTimerRef.current = null;
        }, 160);
    };

    const cancelHideHighlightMenu = () => {
        if (highlightMenuHideTimerRef.current !== null) {
            window.clearTimeout(highlightMenuHideTimerRef.current);
            highlightMenuHideTimerRef.current = null;
        }
    };

    const copyHighlightTextToClipboard = async () => {
        if (!highlightMenu.highlightId) return;

        const highlight = highlights.find((item) => item.id === highlightMenu.highlightId);
        if (!highlight) return;

        const linkedBookmark = highlight.linkedBookmarkId
            ? bookmarks.find((item) => item.id === highlight.linkedBookmarkId)
            : undefined;
        const text = (highlight.text || linkedBookmark?.fullText || linkedBookmark?.note || '').trim();

        if (!text) {
            showNotice(t('reader.noHighlightText', '该高亮暂无可复制文本'), 'error');
            return;
        }

        if (!navigator.clipboard) {
            showNotice(t('reader.clipboardNotSupported', '当前浏览器不支持图片剪贴板'), 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            showNotice(t('reader.copyTextSuccess', '已复制高亮文本'), 'success');
        } catch {
            showNotice(t('reader.copyTextFailed', '复制失败，请重试'), 'error');
        }
    };

    const getHighlightImageBlob = async (highlightId: string): Promise<Blob | null> => {
        const highlight = highlights.find((item) => item.id === highlightId);
        if (!highlight || !mainContainerRef.current || highlight.rects.length === 0) {
            return null;
        }

        const pageElement = mainContainerRef.current.querySelector(`[data-page-number="${highlight.page}"]`) as HTMLElement | null;
        const pageCanvas = pageElement?.querySelector('canvas') as HTMLCanvasElement | null;
        if (!pageCanvas) {
            showNotice(t('reader.copyImageFailed', '复制失败，请重试'), 'error');
            return null;
        }

        const left = Math.min(...highlight.rects.map((r) => r.left));
        const top = Math.min(...highlight.rects.map((r) => r.top));
        const right = Math.max(...highlight.rects.map((r) => r.left + r.width));
        const bottom = Math.max(...highlight.rects.map((r) => r.top + r.height));

        const sx = Math.max(0, Math.round((left / 100) * pageCanvas.width));
        const sy = Math.max(0, Math.round((top / 100) * pageCanvas.height));
        const sw = Math.max(1, Math.round(((right - left) / 100) * pageCanvas.width));
        const sh = Math.max(1, Math.round(((bottom - top) / 100) * pageCanvas.height));

        const clippedWidth = Math.min(sw, pageCanvas.width - sx);
        const clippedHeight = Math.min(sh, pageCanvas.height - sy);
        if (clippedWidth <= 0 || clippedHeight <= 0) {
            showNotice(t('reader.copyImageFailed', '复制失败，请重试'), 'error');
            return null;
        }

        const outCanvas = document.createElement('canvas');
        outCanvas.width = clippedWidth;
        outCanvas.height = clippedHeight;

        const ctx = outCanvas.getContext('2d');
        if (!ctx) {
            showNotice(t('reader.copyImageFailed', '复制失败，请重试'), 'error');
            return null;
        }

        ctx.drawImage(pageCanvas, sx, sy, clippedWidth, clippedHeight, 0, 0, clippedWidth, clippedHeight);

        const blob = await new Promise<Blob | null>((resolve) => {
            outCanvas.toBlob((value) => resolve(value), 'image/png');
        });

        if (!blob) {
            showNotice(t('reader.copyImageFailed', '复制失败，请重试'), 'error');
            return null;
        }

        return blob;
    };

    const copyHighlightImageToClipboard = async () => {
        if (!highlightMenu.highlightId) return;

        if (!navigator.clipboard || typeof window.ClipboardItem === 'undefined') {
            showNotice(t('reader.clipboardNotSupported', '当前浏览器不支持图片剪贴板'), 'error');
            return;
        }

        const blob = await getHighlightImageBlob(highlightMenu.highlightId);
        if (!blob) return;

        try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            showNotice(t('reader.copyImageSuccess', '已复制图片到剪贴板'), 'success');
        } catch {
            showNotice(t('reader.copyImageFailed', '复制失败，请重试'), 'error');
        }
    };

    const deleteHighlightFromMenu = async () => {
        if (!highlightMenu.highlightId) return;
        const targetId = highlightMenu.highlightId;
        closeHighlightMenu();
        await deleteHighlightById(targetId);
    };

    const mergeSelectionRects = (rangeRects: DOMRect[], pageRect: DOMRect): HighlightRect[] => {
        const localRects: PxRect[] = rangeRects
            .map((r) => ({
                left: Math.max(r.left, pageRect.left) - pageRect.left,
                top: Math.max(r.top, pageRect.top) - pageRect.top,
                width: Math.min(r.right, pageRect.right) - Math.max(r.left, pageRect.left),
                height: Math.min(r.bottom, pageRect.bottom) - Math.max(r.top, pageRect.top),
            }))
            .filter((r) => r.width > 1 && r.height > 1)
            .sort((a, b) => (Math.abs(a.top - b.top) < 1 ? a.left - b.left : a.top - b.top));

        if (localRects.length === 0) {
            return [];
        }

        const merged: PxRect[] = [];
        const lineTolerance = 4;
        const gapTolerance = 8;

        for (const current of localRects) {
            const prev = merged[merged.length - 1];
            if (!prev) {
                merged.push({ ...current });
                continue;
            }

            const sameLine = Math.abs(prev.top - current.top) <= lineTolerance;
            const closeEnough = current.left <= prev.left + prev.width + gapTolerance;

            if (sameLine && closeEnough) {
                const right = Math.max(prev.left + prev.width, current.left + current.width);
                prev.left = Math.min(prev.left, current.left);
                prev.top = Math.min(prev.top, current.top);
                prev.height = Math.max(prev.height, current.height);
                prev.width = right - prev.left;
            } else {
                merged.push({ ...current });
            }
        }

        return merged
            .map((r) => ({
                left: (r.left / pageRect.width) * 100,
                top: (r.top / pageRect.height) * 100,
                width: (r.width / pageRect.width) * 100,
                height: (r.height / pageRect.height) * 100,
            }))
            .filter((r) => r.width > 0.2 && r.height > 0.2);
    };

    const getAreaRectFromPoints = (pageRect: DOMRect, startX: number, startY: number, endX: number, endY: number): HighlightRect => {
        const minX = Math.max(pageRect.left, Math.min(startX, endX));
        const maxX = Math.min(pageRect.right, Math.max(startX, endX));
        const minY = Math.max(pageRect.top, Math.min(startY, endY));
        const maxY = Math.min(pageRect.bottom, Math.max(startY, endY));

        const width = Math.max(0, maxX - minX);
        const height = Math.max(0, maxY - minY);

        return {
            left: ((minX - pageRect.left) / pageRect.width) * 100,
            top: ((minY - pageRect.top) / pageRect.height) * 100,
            width: (width / pageRect.width) * 100,
            height: (height / pageRect.height) * 100,
        };
    };

    const hideAreaSelection = () => {
        setAreaDrag(null);
        setAreaDraft(null);
        setAreaSelection(null);
    };

    const showNotice = (text: string, tone: 'success' | 'error' = 'success') => {
        setNotice({ text, tone });
    };

    const setCursorModeIfNeeded = (next: CursorMode) => {
        setCursorMode((prev) => (prev === next ? prev : next));
    };

    const clampNotePanelWidth = (width: number) => {
        return Math.max(420, Math.min(760, width));
    };

    const handleNoteResizeMouseDown: React.MouseEventHandler<HTMLDivElement> = (event) => {
        if (!isNotebookOpen) return;
        event.preventDefault();
        resizeStartRef.current = {
            startX: event.clientX,
            startWidth: notePanelWidth,
        };
    };

    const getPenPointFromClient = (pageElement: HTMLElement, clientX: number, clientY: number): PenPoint => {
        const rect = pageElement.getBoundingClientRect();
        const x = ((Math.min(Math.max(clientX, rect.left), rect.right) - rect.left) / rect.width) * 100;
        const y = ((Math.min(Math.max(clientY, rect.top), rect.bottom) - rect.top) / rect.height) * 100;
        return { x, y };
    };

    const beautifyPenPoints = (points: PenPoint[]): PenPoint[] => {
        if (points.length < 3) return points;

        let smoothed = points;
        for (let step = 0; step < 2; step += 1) {
            const next: PenPoint[] = [smoothed[0]];
            for (let i = 0; i < smoothed.length - 1; i += 1) {
                const p0 = smoothed[i];
                const p1 = smoothed[i + 1];
                next.push({ x: p0.x * 0.75 + p1.x * 0.25, y: p0.y * 0.75 + p1.y * 0.25 });
                next.push({ x: p0.x * 0.25 + p1.x * 0.75, y: p0.y * 0.25 + p1.y * 0.75 });
            }
            next.push(smoothed[smoothed.length - 1]);
            smoothed = next;
        }

        const deduped: PenPoint[] = [];
        for (const point of smoothed) {
            const prev = deduped[deduped.length - 1];
            if (!prev) {
                deduped.push(point);
                continue;
            }
            const distance = Math.hypot(point.x - prev.x, point.y - prev.y);
            if (distance >= 0.14) {
                deduped.push(point);
            }
        }
        return deduped;
    };

    const buildPenPath = (points: PenPoint[]): string => {
        if (points.length === 0) return '';
        if (points.length === 1) {
            const p = points[0];
            return `M ${p.x.toFixed(3)} ${p.y.toFixed(3)} L ${(p.x + 0.01).toFixed(3)} ${(p.y + 0.01).toFixed(3)}`;
        }

        const path: string[] = [`M ${points[0].x.toFixed(3)} ${points[0].y.toFixed(3)}`];
        for (let i = 1; i < points.length - 1; i += 1) {
            const current = points[i];
            const next = points[i + 1];
            const midX = (current.x + next.x) / 2;
            const midY = (current.y + next.y) / 2;
            path.push(`Q ${current.x.toFixed(3)} ${current.y.toFixed(3)} ${midX.toFixed(3)} ${midY.toFixed(3)}`);
        }
        const last = points[points.length - 1];
        path.push(`T ${last.x.toFixed(3)} ${last.y.toFixed(3)}`);
        return path.join(' ');
    };

    const getStrokeBounds = (stroke: PenStroke): { left: number; top: number; right: number; bottom: number } | null => {
        if (stroke.bounds) return stroke.bounds;

        const values = stroke.path.match(/-?\d+(?:\.\d+)?/g);
        if (!values || values.length < 2) return null;

        const points: PenPoint[] = [];
        for (let i = 0; i < values.length - 1; i += 2) {
            points.push({ x: Number(values[i]), y: Number(values[i + 1]) });
        }
        if (points.length === 0) return null;

        return {
            left: Math.min(...points.map((p) => p.x)),
            top: Math.min(...points.map((p) => p.y)),
            right: Math.max(...points.map((p) => p.x)),
            bottom: Math.max(...points.map((p) => p.y)),
        };
    };

    const erasePenStrokeAtPoint = (page: number, pageElement: HTMLElement, clientX: number, clientY: number) => {
        const point = getPenPointFromClient(pageElement, clientX, clientY);
        const tolerance = 1.4;

        let targetId: string | null = null;
        let bestScore = Number.POSITIVE_INFINITY;

        for (let i = penStrokesRef.current.length - 1; i >= 0; i -= 1) {
            const stroke = penStrokesRef.current[i];
            if (stroke.page !== page) continue;

            const bounds = getStrokeBounds(stroke);
            if (!bounds) continue;

            const inside = point.x >= bounds.left - tolerance
                && point.x <= bounds.right + tolerance
                && point.y >= bounds.top - tolerance
                && point.y <= bounds.bottom + tolerance;
            if (!inside) continue;

            const cx = (bounds.left + bounds.right) / 2;
            const cy = (bounds.top + bounds.bottom) / 2;
            const distance = Math.hypot(point.x - cx, point.y - cy);
            if (distance < bestScore) {
                bestScore = distance;
                targetId = stroke.id;
            }
        }

        if (!targetId) return;
        setPenStrokes((prev) => prev.filter((stroke) => stroke.id !== targetId));
    };

    const commitPenDraft = (draft: PenDraftState | null) => {
        if (!draft) return;
        const beautified = beautifyPenPoints(draft.points);
        const path = buildPenPath(beautified);
        if (!path) return;

        const bounds = {
            left: Math.min(...beautified.map((p) => p.x)),
            top: Math.min(...beautified.map((p) => p.y)),
            right: Math.max(...beautified.map((p) => p.x)),
            bottom: Math.max(...beautified.map((p) => p.y)),
        };

        const stroke: PenStroke = {
            id: `pen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            page: draft.page,
            path,
            width: penWidth,
            color: penColor,
            createdAt: new Date().toISOString(),
            bounds,
        };
        setPenStrokes((prev) => [...prev, stroke]);
    };

    const hasSelectableTextAtPoint = (pageElement: HTMLElement, pointX: number, pointY: number): boolean => {
        const textLayer = pageElement.querySelector('.react-pdf__Page__textContent') as HTMLElement | null;
        if (!textLayer) return false;

        const elements = document.elementsFromPoint(pointX, pointY);
        return elements.some((el) => {
            if (!(el instanceof HTMLElement)) return false;
            if (!textLayer.contains(el)) return false;

            const textSpan = el.closest('span');
            if (!(textSpan instanceof HTMLElement) || !textLayer.contains(textSpan)) return false;

            const rect = textSpan.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return false;
            const isInsideRect = pointX >= rect.left && pointX <= rect.right && pointY >= rect.top && pointY <= rect.bottom;
            if (!isInsideRect) return false;

            return (textSpan.textContent || '').trim().length > 0;
        });
    };

    const updateCursorByPoint = (pointX: number, pointY: number, altKey: boolean) => {
        if (isPenMode) {
            setCursorModeIfNeeded('crosshair');
            return;
        }
        if (altKey) {
            setCursorModeIfNeeded('crosshair');
            return;
        }

        const hoveredElement = document.elementFromPoint(pointX, pointY) as HTMLElement | null;
        const pageElement = hoveredElement?.closest('[data-page-number]') as HTMLElement | null;
        if (!pageElement || !mainContainerRef.current?.contains(pageElement)) {
            setCursorModeIfNeeded('auto');
            return;
        }

        setCursorModeIfNeeded(hasSelectableTextAtPoint(pageElement, pointX, pointY) ? 'text' : 'crosshair');
    };

    const handleAreaMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;

        const target = e.target as HTMLElement;
        const pageElement = target.closest('[data-page-number]') as HTMLElement | null;
        if (!pageElement || !mainContainerRef.current?.contains(pageElement)) return;

        if (isPenMode) {
            const page = Number(pageElement.getAttribute('data-page-number'));
            if (Number.isNaN(page)) return;

            e.preventDefault();
            e.stopPropagation();
            setSelectionMenu({ visible: false, x: 0, y: 0, page: null });
            hideAreaSelection();
            closeHighlightMenu();

            if (penTool === 'erase') {
                clearPenDraft();
                setPenErase({ page, pageElement });
                erasePenStrokeAtPoint(page, pageElement, e.clientX, e.clientY);
                return;
            }

            const draft: PenDraftState = {
                page,
                pageElement,
                points: [getPenPointFromClient(pageElement, e.clientX, e.clientY)],
            };
            penDraftRef.current = draft;
            setPenDraftView({ page, path: buildPenPath(draft.points) });
            setCursorModeIfNeeded('crosshair');
            return;
        }

        const pointX = e.clientX;
        const pointY = e.clientY;
        const hasTextUnderPointer = hasSelectableTextAtPoint(pageElement, pointX, pointY);

        if (hasTextUnderPointer && !e.altKey) {
            return;
        }

        const page = Number(pageElement.getAttribute('data-page-number'));
        if (Number.isNaN(page)) return;

        e.preventDefault();
        e.stopPropagation();

        window.getSelection()?.removeAllRanges();
        setSelectionMenu({ visible: false, x: 0, y: 0, page: null });
        setAreaSelection(null);
        closeHighlightMenu();

        setAreaDrag({
            page,
            pageElement,
            startX: e.clientX,
            startY: e.clientY,
        });
    };

    const handleAreaMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (penErase) {
            const now = performance.now();
            if (now - lastPenMoveRef.current < 12) return;
            lastPenMoveRef.current = now;
            e.preventDefault();
            erasePenStrokeAtPoint(penErase.page, penErase.pageElement, e.clientX, e.clientY);
            setCursorModeIfNeeded('crosshair');
            return;
        }

        if (penDraftRef.current) {
            const now = performance.now();
            if (now - lastPenMoveRef.current < 8) return;
            lastPenMoveRef.current = now;
            e.preventDefault();
            const draft = penDraftRef.current;
            const nextPoint = getPenPointFromClient(draft.pageElement, e.clientX, e.clientY);
            const lastPoint = draft.points[draft.points.length - 1];
            const distance = Math.hypot(nextPoint.x - lastPoint.x, nextPoint.y - lastPoint.y);
            if (distance < 0.07) {
                return;
            }

            draft.points.push(nextPoint);
            if (penDraftRafRef.current === null) {
                penDraftRafRef.current = window.requestAnimationFrame(() => {
                    penDraftRafRef.current = null;
                    const current = penDraftRef.current;
                    if (!current) return;
                    setPenDraftView({ page: current.page, path: buildPenPath(current.points) });
                });
            }
            setCursorModeIfNeeded('crosshair');
            return;
        }

        if (isPenMode) {
            setCursorModeIfNeeded('crosshair');
            return;
        }

        if (!areaDrag) {
            const now = performance.now();
            if (now - lastCursorMoveRef.current < 20) return;
            lastCursorMoveRef.current = now;
            updateCursorByPoint(e.clientX, e.clientY, e.altKey);
            return;
        }

        const now = performance.now();
        if (now - lastAreaMoveRef.current < 16) return;
        lastAreaMoveRef.current = now;
        e.preventDefault();
        const pageRect = areaDrag.pageElement.getBoundingClientRect();
        const rect = getAreaRectFromPoints(pageRect, areaDrag.startX, areaDrag.startY, e.clientX, e.clientY);

        setAreaDraft({
            page: areaDrag.page,
            rect,
            anchorX: e.clientX,
            anchorY: e.clientY,
        });
        setCursorModeIfNeeded('crosshair');
    };

    const handleAreaMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        if (penErase) {
            setPenErase(null);
            setCursorModeIfNeeded('crosshair');
            return;
        }

        if (penDraftRef.current) {
            e.preventDefault();
            commitPenDraft(penDraftRef.current);
            clearPenDraft();
            setCursorModeIfNeeded('crosshair');
            return;
        }

        if (isPenMode) {
            return;
        }

        if (!areaDrag) {
            handleTextSelection();
            return;
        }

        e.preventDefault();
        const pageRect = areaDrag.pageElement.getBoundingClientRect();
        const rect = getAreaRectFromPoints(pageRect, areaDrag.startX, areaDrag.startY, e.clientX, e.clientY);

        const movedPx = Math.hypot(e.clientX - areaDrag.startX, e.clientY - areaDrag.startY);
        const minDragPx = 8;
        const minRectPercent = 0.4;
        if (movedPx < minDragPx || rect.width < minRectPercent || rect.height < minRectPercent) {
            setAreaDrag(null);
            setAreaDraft(null);
            return;
        }

        setAreaSelection({
            page: areaDrag.page,
            rect,
            anchorX: e.clientX,
            anchorY: e.clientY,
        });
        setAreaDraft(null);
        setAreaDrag(null);
        updateCursorByPoint(e.clientX, e.clientY, e.altKey);
    };

    const handleTextSelection = () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
            setSelectionMenu((prev) => ({ ...prev, visible: false, page: null }));
            selectedRangeRef.current = null;
            return;
        }

        const range = selection.getRangeAt(0);
        const commonParent = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
            ? range.commonAncestorContainer.parentElement
            : (range.commonAncestorContainer as Element);

        const pageWrapper = commonParent?.closest('[data-page-number]') as HTMLElement | null;
        if (!pageWrapper || !mainContainerRef.current?.contains(pageWrapper)) {
            setSelectionMenu((prev) => ({ ...prev, visible: false, page: null }));
            selectedRangeRef.current = null;
            return;
        }

        const page = Number(pageWrapper.getAttribute('data-page-number'));
        if (Number.isNaN(page)) {
            setSelectionMenu((prev) => ({ ...prev, visible: false, page: null }));
            selectedRangeRef.current = null;
            return;
        }

        const rect = range.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            setSelectionMenu((prev) => ({ ...prev, visible: false, page: null }));
            selectedRangeRef.current = null;
            return;
        }

        selectedRangeRef.current = range.cloneRange();
        hideAreaSelection();
        setSelectionMenu({
            visible: true,
            x: rect.left + rect.width / 2,
            y: rect.top - 12,
            page,
        });
    };

    const addHighlightFromSelection = async () => {
        if (!documentId || !selectedRangeRef.current || !selectionMenu.page) return;

        const range = selectedRangeRef.current;
        const selectedText = range.toString().replace(/\s+/g, ' ').trim();
        const commonParent = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
            ? range.commonAncestorContainer.parentElement
            : (range.commonAncestorContainer as Element);
        const pageWrapper = commonParent?.closest('[data-page-number]') as HTMLElement | null;
        if (!pageWrapper) return;

        const pageRect = pageWrapper.getBoundingClientRect();
        const rangeRects = Array.from(range.getClientRects());
        const rects = mergeSelectionRects(rangeRects, pageRect);

        if (rects.length === 0) return;

        const highlightId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const bookmarkId = `bm-${highlightId}`;

        const newBookmark: BookmarkType = {
            id: bookmarkId,
            page: selectionMenu.page,
            createdAt: new Date().toISOString(),
            note: selectedText || undefined,
            linkedHighlightId: highlightId,
        };

        const newHighlight: HighlightItem = {
            id: highlightId,
            page: selectionMenu.page,
            rects,
            createdAt: new Date().toISOString(),
            text: selectedText || undefined,
            linkedBookmarkId: bookmarkId,
            color: currentHighlightColor,
        };

        const nextHighlights = [...highlights, newHighlight];
        const nextBookmarks = [...bookmarks, newBookmark].sort((a, b) => a.page - b.page);

        setHighlights(nextHighlights);
        setBookmarks(nextBookmarks);
        await saveReaderState(nextBookmarks, nextHighlights);

        window.getSelection()?.removeAllRanges();
        selectedRangeRef.current = null;
        setSelectionMenu({ visible: false, x: 0, y: 0, page: null });
    };

    const insertSelectionToNotebook = () => {
        if (!selectedRangeRef.current || !selectionMenu.page) return;

        const range = selectedRangeRef.current;
        const text = range.toString().replace(/\s+/g, ' ').trim();
        if (!text) return;

        const pageElement = mainContainerRef.current?.querySelector(`[data-page-number="${selectionMenu.page}"]`) as HTMLElement | null;
        const pageRect = pageElement?.getBoundingClientRect();
        if (!pageRect) return;

        const rangeRects = Array.from(range.getClientRects());
        const rects = mergeSelectionRects(rangeRects, pageRect);
        if (rects.length === 0) return;

        const firstRectTop = rects.reduce((min, item) => Math.min(min, item.top), rects[0].top);
        const top = Number(firstRectTop.toFixed(2));
        const excerpt = text.length > 160 ? `${text.slice(0, 160)}...` : text;
        const refUrl = `https://pdf.local/ref?page=${selectionMenu.page}&top=${top}`;
        const markdownSnippet = `「${excerpt}」\n\n[跳转到PDF原文（第${selectionMenu.page}页）](${refUrl})`;
        const blocksToInsert = noteEditor.tryParseMarkdownToBlocks(markdownSnippet);
        if (!Array.isArray(blocksToInsert) || blocksToInsert.length === 0) return;

        const currentBlocks = noteEditor.document;
        if (currentBlocks.length === 0) {
            noteEditor.replaceBlocks([], blocksToInsert);
        } else {
            noteEditor.insertBlocks(blocksToInsert, currentBlocks[currentBlocks.length - 1].id, 'after');
        }

        const next = noteEditor.blocksToMarkdownLossy(noteEditor.document);
        setNoteDraft(next);
        void saveNotebook(next, { silent: true });

        showNotice(t('reader.noteInserted', '已插入到笔记'), 'success');
        selectedRangeRef.current = null;
        setSelectionMenu({ visible: false, x: 0, y: 0, page: null });
    };

    const scrollPdfToReference = (page: number, topPercent: number) => {
        goToPage(page);

        let attempts = 0;
        const tryScroll = () => {
            attempts += 1;
            const pageElement = mainContainerRef.current?.querySelector(`[data-page-number="${page}"]`) as HTMLElement | null;
            if (!pageElement) {
                if (attempts < 12) {
                    window.setTimeout(tryScroll, 80);
                }
                return;
            }

            const container = pageElement.closest('.overflow-y-auto');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                const elementRect = pageElement.getBoundingClientRect();
                const relativeTop = elementRect.top - containerRect.top;
                const scrollOffset = (Math.max(0, Math.min(100, topPercent)) / 100) * elementRect.height;
                const targetY = container.scrollTop + relativeTop + scrollOffset - 72;
                
                container.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
            } else {
                const rect = pageElement.getBoundingClientRect();
                const y = window.scrollY + rect.top + (Math.max(0, Math.min(100, topPercent)) / 100) * rect.height - 110;
                window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
            }
        };

        window.setTimeout(tryScroll, 120);
    };

    const getPdfRefFromTarget = (target: HTMLElement): string | null => {
        const linkNode = target.closest('a,[data-href]') as HTMLElement | null;
        if (linkNode) {
            const href = linkNode.getAttribute('href') || linkNode.getAttribute('data-href') || '';
            const isLegacyScheme = href.startsWith('pdfref://');
            const isHttpRef = href.startsWith('https://pdf.local/ref');
            if (isLegacyScheme || isHttpRef) {
                return href;
            }
        }

        const imageNode = target.closest('img') as HTMLImageElement | null;
        if (!imageNode) return null;
        const altRef = imageNode.getAttribute('alt') || imageNode.getAttribute('data-ref') || '';
        const isLegacyScheme = altRef.startsWith('pdfref://');
        const isHttpRef = altRef.startsWith('https://pdf.local/ref');
        if (!isLegacyScheme && !isHttpRef) return null;
        return altRef;
    };

    const handleNoteEditorMouseDownCapture: React.MouseEventHandler<HTMLDivElement> = (event) => {
        const href = getPdfRefFromTarget(event.target as HTMLElement);
        if (!href) return;
        event.preventDefault();
        event.stopPropagation();
    };

    const handleNoteEditorClickCapture: React.MouseEventHandler<HTMLDivElement> = (event) => {
        const href = getPdfRefFromTarget(event.target as HTMLElement);
        if (!href) return;

        event.preventDefault();
        event.stopPropagation();

        try {
            const url = new URL(href);
            const page = Number(url.searchParams.get('page') || '0');
            const top = Number(url.searchParams.get('top') || '0');
            if (!Number.isFinite(page) || page <= 0) return;
            scrollPdfToReference(page, Number.isFinite(top) ? top : 0);
        } catch {
            // ignore malformed links
        }
    };

    const getAreaImageBlob = async (selection: AreaSelectionState, silent = false): Promise<Blob | null> => {
        if (!mainContainerRef.current) return null;

        const pageElement = mainContainerRef.current.querySelector(`[data-page-number="${selection.page}"]`) as HTMLElement | null;
        const pageCanvas = pageElement?.querySelector('canvas') as HTMLCanvasElement | null;
        if (!pageCanvas) {
            if (!silent) showNotice(t('reader.copyImageFailed', '复制失败，请重试'), 'error');
            return null;
        }

        const sx = Math.max(0, Math.round((selection.rect.left / 100) * pageCanvas.width));
        const sy = Math.max(0, Math.round((selection.rect.top / 100) * pageCanvas.height));
        const sw = Math.max(1, Math.round((selection.rect.width / 100) * pageCanvas.width));
        const sh = Math.max(1, Math.round((selection.rect.height / 100) * pageCanvas.height));

        const clippedWidth = Math.min(sw, pageCanvas.width - sx);
        const clippedHeight = Math.min(sh, pageCanvas.height - sy);
        if (clippedWidth <= 0 || clippedHeight <= 0) {
            if (!silent) showNotice(t('reader.copyImageFailed', '复制失败，请重试'), 'error');
            return null;
        }

        const outCanvas = document.createElement('canvas');
        outCanvas.width = clippedWidth;
        outCanvas.height = clippedHeight;

        const ctx = outCanvas.getContext('2d');
        if (!ctx) {
            if (!silent) showNotice(t('reader.copyImageFailed', '复制失败，请重试'), 'error');
            return null;
        }

        ctx.drawImage(pageCanvas, sx, sy, clippedWidth, clippedHeight, 0, 0, clippedWidth, clippedHeight);

        const blob = await new Promise<Blob | null>((resolve) => {
            outCanvas.toBlob((value) => resolve(value), 'image/png');
        });
        if (!blob) {
            if (!silent) showNotice(t('reader.copyImageFailed', '复制失败，请重试'), 'error');
            return null;
        }

        return blob;
    };

    const runBackgroundOcrForArea = (selection: AreaSelectionState, bookmarkId: string, highlightId: string) => {
        ocrQueueRef.current = ocrQueueRef.current
            .then(async () => {
                const blob = await getAreaImageBlob(selection, true);
                if (!blob) {
                    return;
                }

                const worker = await getOcrWorker();
                const result = await worker.recognize(blob);
                const normalized = (result.data.text || '').replace(/\s+/g, ' ').trim();
                const preview = normalized.length > 56 ? `${normalized.slice(0, 56)}...` : normalized;

                const existingBookmarks = bookmarksRef.current;
                const existingHighlights = highlightsRef.current;
                const hasTarget = existingBookmarks.some((b) => b.id === bookmarkId) && existingHighlights.some((h) => h.id === highlightId);
                if (!hasTarget) {
                    return;
                }

                const updatedBookmarks = existingBookmarks.map((bookmark) => {
                    if (bookmark.id !== bookmarkId) return bookmark;
                    return {
                        ...bookmark,
                        note: normalized ? preview : t('reader.ocrEmpty', '未识别到文本'),
                        fullText: normalized || undefined,
                    };
                });
                const updatedHighlights = existingHighlights.map((highlight) => {
                    if (highlight.id !== highlightId) return highlight;
                    return {
                        ...highlight,
                        text: normalized || undefined,
                    };
                });

                setBookmarks(updatedBookmarks);
                setHighlights(updatedHighlights);
                await saveReaderState(updatedBookmarks, updatedHighlights);

                if (normalized) {
                    showNotice(t('reader.ocrDone', 'OCR完成，已更新书签'), 'success');
                } else {
                    showNotice(t('reader.ocrEmpty', '未识别到文本'), 'error');
                }
            })
            .catch(() => {
                showNotice(t('reader.ocrFailed', 'OCR识别失败，请重试'), 'error');
            });
    };

    const addAreaHighlight = async () => {
        if (!documentId || !areaSelection) return;

        const selection = areaSelection;
        const highlightId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const bookmarkId = `bm-${highlightId}`;

        const newBookmark: BookmarkType = {
            id: bookmarkId,
            page: selection.page,
            createdAt: new Date().toISOString(),
            note: t('reader.ocrPending', '识别中...'),
            linkedHighlightId: highlightId,
        };

        const newHighlight: HighlightItem = {
            id: highlightId,
            page: selection.page,
            rects: [selection.rect],
            createdAt: new Date().toISOString(),
            linkedBookmarkId: bookmarkId,
            color: currentHighlightColor,
        };

        const nextHighlights = [...highlights, newHighlight];
        const nextBookmarks = [...bookmarks, newBookmark].sort((a, b) => a.page - b.page);

        setHighlights(nextHighlights);
        setBookmarks(nextBookmarks);
        await saveReaderState(nextBookmarks, nextHighlights);
        hideAreaSelection();
        showNotice(t('reader.ocrQueued', '已创建书签，后台识别中'), 'success');

        runBackgroundOcrForArea(selection, bookmarkId, highlightId);
    };

    const copyAreaImageToClipboard = async () => {
        if (!areaSelection) return;
        const blob = await getAreaImageBlob(areaSelection);
        if (!blob) {
            return;
        }

        if (!navigator.clipboard || typeof window.ClipboardItem === 'undefined') {
            showNotice(t('reader.clipboardNotSupported', '当前浏览器不支持图片剪贴板'), 'error');
            return;
        }

        try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            hideAreaSelection();
            showNotice(t('reader.copyImageSuccess', '已复制图片到剪贴板'), 'success');
        } catch {
            showNotice(t('reader.copyImageFailed', '复制失败，请重试'), 'error');
        }
    };

    const blobToDataUrl = async (blob: Blob): Promise<string | null> => {
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = typeof reader.result === 'string' ? reader.result : null;
                resolve(result);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    };

    const insertAreaToNotebook = async () => {
        if (!areaSelection) return;

        const blob = await getAreaImageBlob(areaSelection);
        if (!blob) return;

        const imageDataUrl = await blobToDataUrl(blob);
        if (!imageDataUrl) {
            showNotice(t('reader.copyImageFailed', '复制失败，请重试'), 'error');
            return;
        }

        const page = areaSelection.page;
        const top = Number(areaSelection.rect.top.toFixed(2));
        const refUrl = `https://pdf.local/ref?page=${page}&top=${top}`;
        const markdownSnippet = `![${refUrl}](${imageDataUrl})`;
        const blocksToInsert = noteEditor.tryParseMarkdownToBlocks(markdownSnippet);
        if (!Array.isArray(blocksToInsert) || blocksToInsert.length === 0) {
            showNotice(t('reader.noteInsertFailed', '插入笔记失败，请重试'), 'error');
            return;
        }

        const currentBlocks = noteEditor.document;
        if (currentBlocks.length === 0) {
            noteEditor.replaceBlocks([], blocksToInsert);
        } else {
            noteEditor.insertBlocks(blocksToInsert, currentBlocks[currentBlocks.length - 1].id, 'after');
        }

        const next = noteEditor.blocksToMarkdownLossy(noteEditor.document);
        setNoteDraft(next);
        void saveNotebook(next, { silent: true });

        hideAreaSelection();
        showNotice(t('reader.noteInserted', '已插入到笔记'), 'success');
    };

    useEffect(() => {
        if (documentId && pageNumber > 1) {
            const progressData = {
                page: pageNumber,
                total: numPages,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(`pdf_progress_${documentId}`, JSON.stringify(progressData));
        }
    }, [pageNumber, documentId, numPages]);

    useEffect(() => {
        const container = mainContainerRef.current;
        if (!container) return;

        const update = () => {
            setContainerWidth(container.clientWidth);
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(container);

        return () => {
            observer.disconnect();
        };
    }, [isNotebookOpen, isSidebarOpen]);

    const pageRenderWidth = React.useMemo(() => {
        const fitWidth = Math.max(340, Math.floor(containerWidth - 16));
        const zoom = isManualZoom ? scale : 1;
        // 上限放宽到 2400，确保 200%+ 缩放时仍然有足够 CSS 像素，避免 react-pdf 被截断
        // 真实 canvas 像素 = pageRenderWidth × devicePixelRatio，retina 显示器实际可达 4800px
        return Math.max(320, Math.min(2400, Math.floor(fitWidth * zoom)));
    }, [containerWidth, isManualZoom, scale]);

    useEffect(() => {
        const hideMenu = () => {
            setSelectionMenu((prev) => ({ ...prev, visible: false, page: null }));
            selectedRangeRef.current = null;
        };

        const onScroll = () => {
            if (selectionMenu.visible) {
                hideMenu();
            }
            if (areaSelection || areaDraft) {
                hideAreaSelection();
            }
            if (penDraftRef.current) {
                commitPenDraft(penDraftRef.current);
                clearPenDraft();
            }
            if (highlightMenu.visible) {
                closeHighlightMenu();
            }
        };

        window.addEventListener('scroll', onScroll, true);
        return () => {
            window.removeEventListener('scroll', onScroll, true);
        };
    }, [selectionMenu.visible, areaSelection, areaDraft, highlightMenu.visible, penColor, penWidth]);

    useEffect(() => {
        if (!notice) return;
        const timer = window.setTimeout(() => setNotice(null), 1600);
        return () => window.clearTimeout(timer);
    }, [notice]);

    useEffect(() => {
        const isTypingTarget = (target: EventTarget | null): boolean => {
            if (!(target instanceof HTMLElement)) return false;
            const tag = target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
            if (target.isContentEditable) return true;
            // BlockNote 笔记面板内的可编辑节点
            if (target.closest('[contenteditable="true"]')) return true;
            if (target.closest('.notes-flat-panel')) return true;
            return false;
        };

        const onKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd+F 总是拦截，打开搜索侧栏
            if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
                e.preventDefault();
                setSidebarTab('search');
                setIsSidebarOpen(true);
                setTimeout(() => {
                    const input = document.querySelector<HTMLInputElement>('input[type="text"][placeholder*="搜索"], input[type="text"][placeholder*="Search"]');
                    input?.focus();
                    input?.select();
                }, 100);
                return;
            }

            if (e.key === 'Alt') {
                setIsAltPressed(true);
                return;
            }

            if (e.key === 'Escape') {
                setSelectionMenu({ visible: false, x: 0, y: 0, page: null });
                selectedRangeRef.current = null;
                hideAreaSelection();
                clearPenDraft();
                closeHighlightMenu();
                window.getSelection()?.removeAllRanges();
                setIsEditingPage(false);
                return;
            }

            // 在输入框/笔记面板内不拦截快捷键
            if (isTypingTarget(e.target)) return;
            // 修饰键由浏览器/系统处理
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            switch (e.key) {
                case 'ArrowLeft':
                case 'PageUp':
                    e.preventDefault();
                    if (pageNumber > 1) goToPage(pageNumber - 1);
                    break;
                case 'ArrowRight':
                case 'PageDown':
                case ' ':
                    e.preventDefault();
                    if (pageNumber < numPages) goToPage(pageNumber + 1);
                    break;
                case 'Home':
                    e.preventDefault();
                    if (numPages > 0) goToPage(1);
                    break;
                case 'End':
                    e.preventDefault();
                    if (numPages > 0) goToPage(numPages);
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    setIsManualZoom(true);
                    setScale(s => Math.min(2.0, s + 0.1));
                    break;
                case '-':
                case '_':
                    e.preventDefault();
                    setIsManualZoom(true);
                    setScale(s => Math.max(0.6, s - 0.1));
                    break;
                case '0':
                    e.preventDefault();
                    setIsManualZoom(false);
                    setScale(1);
                    break;
                case 'b':
                case 'B':
                    e.preventDefault();
                    toggleBookmark();
                    break;
                case 'r':
                case 'R':
                    e.preventDefault();
                    setRotation((prev) => ((prev + 90) % 360) as 0 | 90 | 180 | 270);
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    void toggleFullscreen();
                    break;
                case '?':
                case '/':
                    e.preventDefault();
                    setShowShortcuts((prev) => !prev);
                    break;
            }
        };

        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Alt') {
                setIsAltPressed(false);
                setCursorModeIfNeeded('auto');
            }
        };

        const onWindowBlur = () => {
            setIsAltPressed(false);
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('blur', onWindowBlur);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('blur', onWindowBlur);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageNumber, numPages]);

    useEffect(() => {
        return () => {
            if (ocrWorkerRef.current) {
                void ocrWorkerRef.current.terminate();
                ocrWorkerRef.current = null;
            }
            if (highlightMenuHideTimerRef.current !== null) {
                window.clearTimeout(highlightMenuHideTimerRef.current);
                highlightMenuHideTimerRef.current = null;
            }
            if (penDraftRafRef.current !== null) {
                window.cancelAnimationFrame(penDraftRafRef.current);
                penDraftRafRef.current = null;
            }
        };
    }, []);

    const onDocumentLoadSuccess = async (pdfDoc: PDFDocumentProxy) => {
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        const outlineData = await pdfDoc.getOutline();
        onOutlineLoadSuccess(outlineData);
        
        if (pageNumber > 1) {
            setTimeout(() => {
                goToPage(pageNumber);
            }, 500);
        }
    };

    const onOutlineLoadSuccess = async (loadedOutline: any[] | null) => {
        if (loadedOutline && pdf) {
            const resolveItems = async (items: any[]) => {
                for (const item of items) {
                    try {
                        if (item.dest) {
                            let dest = item.dest;
                            if (typeof dest === 'string') {
                                dest = await pdf.getDestination(dest);
                            }
                            if (Array.isArray(dest) && dest.length > 0) {
                                const pageRef = dest[0];
                                if (typeof pageRef === 'object' && pageRef !== null) {
                                    item.pageNumber = (await pdf.getPageIndex(pageRef)) + 1;
                                } else if (typeof pageRef === 'number') {
                                    item.pageNumber = pageRef + 1;
                                }

                                if (dest.length >= 2) {
                                    const typeObj = dest[1];
                                    const type = typeof typeObj === 'object' && typeObj !== null ? typeObj.name : typeObj;
                                    
                                    if (type === 'XYZ' && dest.length >= 4) {
                                        item.pdfY = dest[3];
                                    } else if (type === 'FitH' && dest.length >= 3) {
                                        item.pdfY = dest[2];
                                    } else if (type === 'FitR' && dest.length >= 6) {
                                        item.pdfY = dest[5];
                                    }
                                }
                            }
                        }
                    } catch (e) {
                    }
                    if (item.items && item.items.length > 0) {
                        await resolveItems(item.items);
                    }
                }
            };
            await resolveItems(loadedOutline);
        }
        
        setOutline(loadedOutline ? [...loadedOutline] : null);
        if (loadedOutline && loadedOutline.length > 0) {
            setIsSidebarOpen(true);
            setSidebarTab('outline');
        }
    };

    const exportAnnotations = () => {
        const lines: string[] = [];
        const docTitle = document.title || 'Document';
        lines.push(`# ${docTitle} — 阅读笔记`);
        lines.push('');
        lines.push(`*导出时间：${new Date().toLocaleString()}*`);
        lines.push('');

        if (bookmarks.length > 0) {
            lines.push('## 📑 书签');
            lines.push('');
            const sorted = [...bookmarks].sort((a, b) => a.page - b.page);
            for (const b of sorted) {
                lines.push(`- **第 ${b.page} 页**${b.note ? ` — ${b.note}` : ''}`);
                if (b.fullText && b.fullText.trim()) {
                    lines.push(`  > ${b.fullText.replace(/\n+/g, ' ').slice(0, 200)}${b.fullText.length > 200 ? '…' : ''}`);
                }
            }
            lines.push('');
        }

        if (highlights.length > 0) {
            lines.push('## 🖍 高亮');
            lines.push('');
            const byPage = new Map<number, HighlightItem[]>();
            for (const h of highlights) {
                if (!byPage.has(h.page)) byPage.set(h.page, []);
                byPage.get(h.page)!.push(h);
            }
            const pages = Array.from(byPage.keys()).sort((a, b) => a - b);
            for (const p of pages) {
                lines.push(`### 第 ${p} 页`);
                for (const h of byPage.get(p)!) {
                    if (h.text && h.text.trim()) {
                        lines.push(`- ${h.text.replace(/\n+/g, ' ').trim()}`);
                    }
                }
                lines.push('');
            }
        }

        const noteContent = (noteDraft || noteMarkdown || '').trim();
        if (noteContent) {
            lines.push('## 📝 笔记');
            lines.push('');
            lines.push(noteContent);
            lines.push('');
        }

        if (bookmarks.length === 0 && highlights.length === 0 && !noteContent) {
            lines.push('*暂无书签、高亮或笔记。*');
        }

        const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notes_${documentId || 'document'}.md`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setNotice({ text: '已导出 Markdown', tone: 'success' });
    };

    const performSearch = async (query: string) => {
        const term = query.trim();
        if (!term || !pdf) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        const results: Array<{ page: number; snippet: string; offset: number }> = [];
        const lower = term.toLowerCase();
        try {
            for (let p = 1; p <= numPages; p++) {
                const page = await pdf.getPage(p);
                const content = await page.getTextContent();
                const text = content.items
                    .map((item: { str?: string }) => item.str || '')
                    .join(' ');
                const textLower = text.toLowerCase();
                let idx = 0;
                while ((idx = textLower.indexOf(lower, idx)) !== -1) {
                    const start = Math.max(0, idx - 40);
                    const end = Math.min(text.length, idx + term.length + 40);
                    results.push({
                        page: p,
                        snippet: (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : ''),
                        offset: idx,
                    });
                    idx += term.length;
                    if (results.length >= 200) break;
                }
                if (results.length >= 200) break;
            }
        } catch (err) {
            console.error('Search failed', err);
        } finally {
            setSearchResults(results);
            setSearchCursor(0);
            setIsSearching(false);
        }
    };

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                const el = mainContainerRef.current?.parentElement || document.documentElement;
                await el.requestFullscreen?.();
            } else {
                await document.exitFullscreen?.();
            }
        } catch (err) {
            console.warn('Failed to toggle fullscreen', err);
        }
    };

    useEffect(() => {
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const downloadPdf = async () => {
        if (!documentId) return;
        try {
            const headers = (await import('../api/client')).getAuthHeaders();
            const resp = await fetch(`/api/documents/${documentId}/file`, { headers });
            if (!resp.ok) throw new Error(`status ${resp.status}`);
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `document_${documentId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            console.error('Failed to download PDF', err);
        }
    };

    const submitJumpPage = () => {
        const target = parseInt(pageInputValue, 10);
        setIsEditingPage(false);
        setPageInputValue('');
        if (!isNaN(target) && target >= 1 && target <= numPages) {
            goToPage(target);
        }
    };

    const goToPage = (page: number, pdfY?: number) => {
        const pageElement = mainContainerRef.current?.querySelector(`[data-page-number="${page}"]`);
        
        if (pageElement) {
            if (pdfY !== undefined && pdfY !== null) {
                void scrollToPdfCoordinate(page, pdfY);
            } else {
                pageElement.scrollIntoView({ behavior: 'smooth' });
            }
            setPageNumber(page);
        } else {
            setPageNumber(page);
            let attempts = 0;
            const tryScroll = () => {
                attempts++;
                const el = mainContainerRef.current?.querySelector(`[data-page-number="${page}"]`);
                if (el) {
                    if (pdfY !== undefined && pdfY !== null) {
                        void scrollToPdfCoordinate(page, pdfY);
                    } else {
                        el.scrollIntoView({ behavior: 'smooth' });
                    }
                } else if (attempts < 20) {
                    setTimeout(tryScroll, 100);
                }
            };
            setTimeout(tryScroll, 150);
        }
    };

    const scrollToPdfCoordinate = async (pageNumber: number, pdfY: number) => {
        if (!pdf) return;
        
        try {
            const page = await pdf.getPage(pageNumber);
            const view = page.view; 
            const pageHeightPoints = view[3] - view[1];
            const topPercent = ((view[3] - pdfY) / pageHeightPoints) * 100;
            
            scrollPdfToReference(pageNumber, topPercent);
        } catch (error) {
            console.error('Failed to scroll to PDF coordinate', error);
            const pageElement = mainContainerRef.current?.querySelector(`[data-page-number="${pageNumber}"]`);
            pageElement?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleOutlineItemClick = async (item: any) => {
        if (item.pageNumber) {
            goToPage(item.pageNumber, item.pdfY);
            return;
        }

        if (!item.dest || !pdf) return;

        try {
            let dest = item.dest;
            if (typeof dest === 'string') {
                dest = await pdf.getDestination(dest);
            }

            if (Array.isArray(dest) && dest.length > 0) {
                const pageRef = dest[0];
                let pageIndex = -1;
                let pdfY: number | undefined;

                if (typeof pageRef === 'object' && pageRef !== null) {
                    pageIndex = await pdf.getPageIndex(pageRef);
                } else if (typeof pageRef === 'number') {
                    pageIndex = pageRef;
                }

                if (dest.length >= 2) {
                    const typeObj = dest[1];
                    const type = typeof typeObj === 'object' && typeObj !== null ? typeObj.name : typeObj;
                    if (type === 'XYZ' && dest.length >= 4) pdfY = dest[3];
                    else if (type === 'FitH' && dest.length >= 3) pdfY = dest[2];
                }

                if (pageIndex !== -1) {
                    const targetPage = pageIndex + 1;
                    goToPage(targetPage, pdfY);
                }
            }
        } catch (error) {
            console.error('Failed to resolve outline destination', error);
        }
    };

    // Memoized callback to prevent unnecessary re-renders of LazyPage
    const handlePageVisible = React.useCallback((pg: number) => {
        setPageNumber(pg);
    }, []);

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
            <div className="w-full bg-[#faf9f6]/95 backdrop-blur-md border-b border-[#e9e6da] px-4 md:px-8 py-2 flex items-center sticky top-0 z-50">
                {/* Left space for the back button in ReaderPage */}
                <div className="w-20 md:w-32 shrink-0 flex items-center gap-2">
                    <button
                        onClick={() => {
                            setSidebarTab(prev => prev === 'outline' && isSidebarOpen ? 'bookmarks' : 'outline');
                            setIsSidebarOpen(prev => prev && sidebarTab === 'outline' ? false : true);
                        }}
                        className={`p-2 rounded-lg transition-colors ${isSidebarOpen && sidebarTab === 'outline' ? 'bg-[#f0eee9] text-[#4b483e]' : 'hover:bg-white text-[#6b6654]'}`}
                        title={t('reader.toggleOutline')}
                        disabled={!outline || outline.length === 0}
                    >
                        <ListTree size={18} className={!outline || outline.length === 0 ? 'opacity-30' : ''} />
                    </button>
                    
                    <button
                        onClick={() => {
                            setSidebarTab(prev => prev === 'bookmarks' && isSidebarOpen ? 'outline' : 'bookmarks');
                            setIsSidebarOpen(prev => prev && sidebarTab === 'bookmarks' ? false : true);
                        }}
                        className={`p-2 rounded-lg transition-colors ${isSidebarOpen && sidebarTab === 'bookmarks' ? 'bg-[#f0eee9] text-[#4b483e]' : 'hover:bg-white text-[#6b6654]'}`}
                        title={t('reader.toggleBookmarks')}
                    >
                        <Bookmark size={18} />
                    </button>

                    <button
                        onClick={() => {
                            if (isSidebarOpen && sidebarTab === 'search') {
                                setIsSidebarOpen(false);
                            } else {
                                setSidebarTab('search');
                                setIsSidebarOpen(true);
                            }
                        }}
                        className={`p-2 rounded-lg transition-colors ${isSidebarOpen && sidebarTab === 'search' ? 'bg-[#f0eee9] text-[#4b483e]' : 'hover:bg-white text-[#6b6654]'}`}
                        title={t('reader.searchInPdf', '搜索全文')}
                    >
                        <Search size={18} />
                    </button>

                    <button
                        onClick={() => {
                            if (isSidebarOpen && sidebarTab === 'thumbnails') {
                                setIsSidebarOpen(false);
                            } else {
                                setSidebarTab('thumbnails');
                                setIsSidebarOpen(true);
                            }
                        }}
                        className={`p-2 rounded-lg transition-colors ${isSidebarOpen && sidebarTab === 'thumbnails' ? 'bg-[#f0eee9] text-[#4b483e]' : 'hover:bg-white text-[#6b6654]'}`}
                        title={t('reader.thumbnails', '页面缩略图')}
                    >
                        <LayoutGrid size={18} />
                    </button>

                    <button
                        onClick={() => {
                            setIsNotebookOpen((prev) => !prev);
                        }}
                        className={`p-2 rounded-lg transition-colors ${isNotebookOpen ? 'bg-[#f0eee9] text-[#4b483e]' : 'hover:bg-white text-[#6b6654]'}`}
                        title={t('reader.toggleNotes', '笔记本')}
                    >
                        <NotebookPen size={18} />
                    </button>

                </div>

                {/* Center: Page Indicator + Prev/Next + Jump */}
                <div className="flex-1 flex flex-col justify-center items-center overflow-hidden px-4 gap-1">
                    <div className="flex items-center bg-[#f0eee9]/50 rounded-lg px-2 md:px-3 py-1 border border-[#e9e6da] max-w-full gap-1.5">
                        <button
                            onClick={() => pageNumber > 1 && goToPage(pageNumber - 1)}
                            disabled={pageNumber <= 1}
                            className="p-1 rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-[#6b6654] transition-colors"
                            title={t('reader.prevPage', '上一页 (←)')}
                        >
                            <ChevronLeft size={14} />
                        </button>

                        {isEditingPage ? (
                            <input
                                type="number"
                                autoFocus
                                value={pageInputValue}
                                onChange={(e) => setPageInputValue(e.target.value)}
                                onBlur={submitJumpPage}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') submitJumpPage();
                                    else if (e.key === 'Escape') {
                                        setIsEditingPage(false);
                                        setPageInputValue('');
                                    }
                                }}
                                min={1}
                                max={numPages || 1}
                                className="w-12 text-center text-[11px] font-semibold bg-white border border-indigo-300 rounded px-1 py-0.5 outline-none focus:ring-2 focus:ring-indigo-200 tabular-nums"
                            />
                        ) : (
                            <button
                                onClick={() => {
                                    setPageInputValue(String(pageNumber));
                                    setIsEditingPage(true);
                                }}
                                className="text-[10px] md:text-xs font-semibold text-[#6b6654] hover:text-indigo-600 hover:bg-white px-1.5 py-0.5 rounded transition-colors whitespace-nowrap tabular-nums"
                                title={t('reader.jumpToPage', '点击跳页')}
                            >
                                {pageNumber}
                            </button>
                        )}
                        <span className="opacity-40 text-[10px]">/</span>
                        <span className="text-[10px] md:text-xs font-semibold text-[#6b6654] tabular-nums">
                            {numPages || '-'}
                        </span>

                        <button
                            onClick={() => pageNumber < numPages && goToPage(pageNumber + 1)}
                            disabled={pageNumber >= numPages}
                            className="p-1 rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-[#6b6654] transition-colors"
                            title={t('reader.nextPage', '下一页 (→)')}
                        >
                            <ChevronRight size={14} />
                        </button>

                        <div className="w-px h-3 bg-slate-300 mx-0.5" />

                        <button
                            onClick={toggleBookmark}
                            className={`p-1 rounded hover:bg-white transition-colors ${bookmarks.some(b => b.page === pageNumber) ? 'text-indigo-500' : 'text-[#6b6654] hover:text-indigo-500'}`}
                            title={t('reader.toggleBookmark', '书签 (B)')}
                        >
                            <Bookmark size={12} fill={bookmarks.some(b => b.page === pageNumber) ? "currentColor" : "none"} />
                        </button>
                    </div>
                    <div className="w-full max-w-[200px] h-1 bg-slate-200/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#d97706]/60 transition-all duration-300 ease-out"
                            style={{ width: `${numPages > 0 ? (pageNumber / numPages) * 100 : 0}%` }}
                        />
                    </div>
                </div>

                {/* Right: Pen + Zoom Controls */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-[#f0eee9]/50 rounded-lg p-0.5 border border-[#e9e6da]">
                        <button
                            onClick={() => {
                                if (isPenMode) {
                                    stopPenMode();
                                } else {
                                    setIsPenMode(true);
                                    setAreaDrag(null);
                                    setAreaDraft(null);
                                    setAreaSelection(null);
                                    clearPenDraft();
                                    setPenErase(null);
                                    setSelectionMenu({ visible: false, x: 0, y: 0, page: null });
                                    closeHighlightMenu();
                                    setCursorModeIfNeeded('crosshair');
                                }
                            }}
                            className={`p-1.5 rounded-md transition-all ${isPenMode ? 'bg-blue-100 text-blue-700' : 'hover:bg-white text-[#6b6654]'}`}
                            title={t('reader.penMode', '手写笔')}
                        >
                            <PenLine size={16} className="md:w-[18px] md:h-[18px]" />
                        </button>
                        <button
                            onClick={() => {
                                if (pageNumber <= 0) return;
                                setPenStrokes((prev) => prev.filter((stroke) => stroke.page !== pageNumber));
                            }}
                            className="px-2 h-7 text-[10px] font-semibold rounded-md hover:bg-white text-[#6b6654]"
                            title={t('reader.clearInkPage', '清空本页笔迹')}
                        >
                            {t('reader.clearInk', '清笔迹')}
                        </button>
                    </div>

                    {isPenMode && (
                        <div className="flex items-center gap-1 bg-[#f0eee9]/50 rounded-lg p-0.5 border border-[#e9e6da]">
                            <button
                                onClick={stopPenMode}
                                className="px-2 h-7 text-[10px] font-semibold rounded-md hover:bg-white text-[#6b6654]"
                                title={t('reader.exitPen', '退出手写')}
                            >
                                {t('reader.exitPen', '退出')}
                            </button>
                            <div className="w-px h-5 bg-[#d9d5c8] mx-0.5" />
                            <button
                                onClick={() => setPenTool('draw')}
                                className={`p-1.5 rounded-md transition-all ${penTool === 'draw' ? 'bg-blue-100 text-blue-700' : 'hover:bg-white text-[#6b6654]'}`}
                                title={t('reader.penDraw', '画笔')}
                            >
                                <PenLine size={16} className="md:w-[18px] md:h-[18px]" />
                            </button>
                            <button
                                onClick={() => setPenTool('erase')}
                                className={`p-1.5 rounded-md transition-all ${penTool === 'erase' ? 'bg-red-100 text-red-700' : 'hover:bg-white text-[#6b6654]'}`}
                                title={t('reader.penEraser', '橡皮')}
                            >
                                <Eraser size={16} className="md:w-[18px] md:h-[18px]" />
                            </button>

                            {penTool === 'draw' && (
                                <>
                                    <div className="w-px h-5 bg-[#d9d5c8] mx-0.5" />
                                    <div className="flex items-center gap-1 px-1">
                                        {PEN_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setPenColor(color)}
                                                className={`w-4 h-4 rounded-full border ${penColor === color ? 'ring-2 ring-offset-1 ring-blue-400 border-white' : 'border-white/80'}`}
                                                style={{ backgroundColor: color }}
                                                title={t('reader.penColor', '笔颜色')}
                                            />
                                        ))}
                                    </div>
                                    <div className="w-px h-5 bg-[#d9d5c8] mx-0.5" />
                                    <div className="flex items-center gap-1 px-1">
                                        {PEN_WIDTHS.map((width) => (
                                            <button
                                                key={width}
                                                onClick={() => setPenWidth(width)}
                                                className={`w-6 h-6 rounded-md border flex items-center justify-center ${penWidth === width ? 'bg-blue-50 border-blue-300' : 'bg-white/70 border-[#d9d5c8]'}`}
                                                title={t('reader.penWidth', '笔粗细')}
                                            >
                                                <span
                                                    className="rounded-full bg-slate-700"
                                                    style={{ width: `${Math.max(3, width * 8)}px`, height: `${Math.max(3, width * 8)}px` }}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Highlight color picker */}
                    <div className="flex items-center gap-1 bg-[#f0eee9]/50 rounded-lg p-1 border border-[#e9e6da]" title={t('reader.highlightColor', '高亮颜色')}>
                        {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((c) => (
                            <button
                                key={c}
                                onClick={() => setCurrentHighlightColor(c)}
                                className={`w-5 h-5 rounded-full border-2 transition-all ${currentHighlightColor === c ? 'border-slate-700 ring-2 ring-offset-1 ring-slate-300' : 'border-white/80 hover:scale-110'}`}
                                style={{ backgroundColor: HIGHLIGHT_COLORS[c].swatch }}
                                title={c}
                                aria-label={`highlight-${c}`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-1 bg-[#f0eee9]/50 rounded-lg p-0.5 border border-[#e9e6da]">
                    <button
                        onClick={() => {
                            setIsManualZoom(false);
                            setScale(1);
                        }}
                        className={`px-2 h-7 rounded-md transition-all text-[10px] font-semibold ${!isManualZoom ? 'bg-white text-[#4b483e]' : 'hover:bg-white text-[#6b6654]'}`}
                        title={t('reader.fitWidth', '适应宽度 (0)')}
                    >
                        {t('reader.fit', '适应')}
                    </button>
                    <button
                        onClick={() => {
                            setIsManualZoom(true);
                            setScale(s => Math.max(0.6, s - 0.08));
                        }}
                        className="p-1 md:p-1.5 hover:bg-white rounded-md transition-all text-[#6b6654]"
                        title={t('reader.zoomOut', '缩小 (-)')}
                    >
                        <ZoomOut size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                    <span className="text-[9px] md:text-[10px] font-bold text-[#6b6654] min-w-[35px] md:min-w-[40px] text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={() => {
                            setIsManualZoom(true);
                            setScale(s => Math.min(2.0, s + 0.08));
                        }}
                        className="p-1 md:p-1.5 hover:bg-white rounded-md transition-all text-[#6b6654]"
                        title={t('reader.zoomIn', '放大 (+)')}
                    >
                        <ZoomIn size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                    </div>

                    <div className="flex items-center gap-1 bg-[#f0eee9]/50 rounded-lg p-0.5 border border-[#e9e6da]">
                        <button
                            onClick={() => setReadingMode((prev) => prev === 'day' ? 'sepia' : prev === 'sepia' ? 'night' : 'day')}
                            className="p-1.5 hover:bg-white rounded-md transition-all text-[#6b6654]"
                            title={t('reader.readingMode', '阅读模式：日间/护眼/夜间')}
                        >
                            {readingMode === 'day' ? (
                                <Sun size={16} className="md:w-[18px] md:h-[18px]" />
                            ) : readingMode === 'sepia' ? (
                                <Coffee size={16} className="md:w-[18px] md:h-[18px] text-amber-700" />
                            ) : (
                                <Moon size={16} className="md:w-[18px] md:h-[18px] text-indigo-500" />
                            )}
                        </button>
                        <button
                            onClick={() => setRotation((prev) => ((prev + 90) % 360) as 0 | 90 | 180 | 270)}
                            className="p-1.5 hover:bg-white rounded-md transition-all text-[#6b6654]"
                            title={t('reader.rotate', '旋转 90° (R)')}
                        >
                            <RotateCw size={16} className="md:w-[18px] md:h-[18px]" />
                        </button>
                        <button
                            onClick={downloadPdf}
                            disabled={!documentId}
                            className="p-1.5 hover:bg-white rounded-md transition-all text-[#6b6654] disabled:opacity-30"
                            title={t('reader.download', '下载 PDF')}
                        >
                            <Download size={16} className="md:w-[18px] md:h-[18px]" />
                        </button>
                        <button
                            onClick={exportAnnotations}
                            className="px-2 h-7 text-[10px] font-semibold hover:bg-white rounded-md transition-all text-[#6b6654]"
                            title={t('reader.exportNotes', '导出书签、高亮和笔记到 Markdown')}
                        >
                            .md
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="p-1.5 hover:bg-white rounded-md transition-all text-[#6b6654]"
                            title={t('reader.fullscreen', isFullscreen ? '退出全屏 (F)' : '全屏 (F)')}
                        >
                            {isFullscreen ? (
                                <Minimize2 size={16} className="md:w-[18px] md:h-[18px]" />
                            ) : (
                                <Maximize2 size={16} className="md:w-[18px] md:h-[18px]" />
                            )}
                        </button>
                        <button
                            onClick={() => setShowShortcuts(true)}
                            className="px-2 h-7 text-[10px] font-semibold hover:bg-white rounded-md transition-all text-[#6b6654]"
                            title={t('reader.shortcutsHelp', '快捷键 (?)')}
                        >
                            ?
                        </button>
                    </div>
                </div>
            </div>

            <div
                className={`w-full flex relative items-start gap-0 ${isSidebarOpen ? 'pl-72' : ''}`}
                style={{
                    paddingRight: 'var(--cozypal-offset, 0px)',
                    backgroundColor:
                        readingMode === 'sepia' ? '#f4ecd8'
                            : readingMode === 'night' ? '#0f0e0c'
                                : undefined,
                }}
            >
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ x: '-100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '-100%', opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="w-72 h-[calc(100vh-4rem)] fixed top-16 left-0 z-30 bg-[#faf9f6]/95 backdrop-blur-md border-r border-[#e9e6da] flex flex-col"
                        >
                            <div className="flex items-center gap-1 border-b border-[#e9e6da] p-2 bg-[#f9f8f6]">
                                <button
                                    onClick={() => setSidebarTab('outline')}
                                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${sidebarTab === 'outline' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                >
                                    {t('reader.outline', 'Outline')}
                                </button>
                                <button
                                    onClick={() => setSidebarTab('bookmarks')}
                                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${sidebarTab === 'bookmarks' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                >
                                    {t('reader.bookmarks', 'Bookmarks')} <span className="ml-1 opacity-60">({bookmarks.length})</span>
                                </button>
                                <button
                                    onClick={() => setSidebarTab('search')}
                                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${sidebarTab === 'search' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                >
                                    {t('reader.search', '搜索')}
                                </button>
                                <button
                                    onClick={() => setSidebarTab('thumbnails')}
                                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${sidebarTab === 'thumbnails' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                >
                                    {t('reader.thumbnailsShort', '页面')}
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {sidebarTab === 'outline' ? (
                                    <ul className="space-y-1">
                                        {outline?.map((item, index) => (
                                            <OutlineItem key={index} item={item} onClick={handleOutlineItemClick} level={0} />
                                        ))}
                                    </ul>
                                ) : sidebarTab === 'bookmarks' ? (
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                value={bookmarkQuery}
                                                onChange={(e) => setBookmarkQuery(e.target.value)}
                                                placeholder={t('reader.searchBookmarks', '搜索书签或页码')}
                                                className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-[#e9e6da] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                                            />
                                        </div>

                                        {bookmarks.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                                    <Bookmark size={20} className="text-slate-300" />
                                                </div>
                                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('reader.noBookmarks', 'No bookmarks yet')}</p>
                                            </div>
                                        ) : filteredBookmarks.length === 0 ? (
                                            <div className="text-center py-16">
                                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('reader.noSearchResults', '没有匹配书签')}</p>
                                            </div>
                                        ) : (
                                            filteredBookmarks.map((bookmark) => (
                                                <div 
                                                    key={bookmark.id}
                                                    onClick={() => {
                                                        if (editingBookmarkId !== bookmark.id) {
                                                            goToPage(bookmark.page);
                                                        }
                                                    }}
                                                    className={`group relative p-3 rounded-xl bg-white border transition-all cursor-pointer ${editingBookmarkId === bookmark.id ? 'border-indigo-400 ring-2 ring-indigo-100 shadow-md z-10' : 'border-[#e9e6da] hover:border-indigo-200 hover:shadow-md'}`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0 pr-2">
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] shrink-0" />
                                                                <span className="font-bold text-slate-700 text-sm whitespace-nowrap">
                                                                    {t('reader.page', 'Page')} {bookmark.page}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest pl-2 truncate">
                                                                    {new Date(bookmark.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            
                                                            {editingBookmarkId === bookmark.id ? (
                                                                <div className="mt-2" onClick={e => e.stopPropagation()}>
                                                                    <textarea
                                                                        value={editNote}
                                                                        onChange={(e) => setEditNote(e.target.value)}
                                                                        placeholder={t('reader.addNotePlaceholder', 'Add a note...')}
                                                                        className="w-full text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 resize-none mb-2"
                                                                        rows={3}
                                                                        autoFocus
                                                                    />
                                                                    <div className="flex justify-end gap-2">
                                                                        <button
                                                                            onClick={(e) => cancelEditing(e)}
                                                                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                                                                            title={t('common.cancel', 'Cancel')}
                                                                        >
                                                                            <X size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => saveNote(bookmark.id, e)}
                                                                            className="p-1 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                                                                            title={t('common.save', 'Save')}
                                                                        >
                                                                            <Check size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                getBookmarkPreviewText(bookmark) && (
                                                                    <p className="text-xs text-slate-500 italic mt-1 line-clamp-2 pl-3.5 border-l-2 border-indigo-100">
                                                                        {getBookmarkPreviewText(bookmark)}
                                                                    </p>
                                                                )
                                                            )}
                                                        </div>
                                                        
                                                        {editingBookmarkId !== bookmark.id && (
                                                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {bookmark.linkedHighlightId && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            deleteHighlightById(bookmark.linkedHighlightId as string);
                                                                        }}
                                                                        className="px-2 py-1 text-[10px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors"
                                                                        title={t('reader.deleteHighlight', '删除高亮')}
                                                                    >
                                                                        {t('reader.deleteHighlight', '删高亮')}
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={(e) => startEditing(bookmark, e)}
                                                                    className="p-1.5 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                    title={t('common.edit', 'Edit')}
                                                                >
                                                                    <Pencil size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => deleteBookmark(bookmark.id, e)}
                                                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title={t('common.delete', 'Delete')}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ) : sidebarTab === 'search' ? (
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        if (e.shiftKey && searchResults.length > 0) {
                                                            const prev = (searchCursor - 1 + searchResults.length) % searchResults.length;
                                                            setSearchCursor(prev);
                                                            goToPage(searchResults[prev].page);
                                                        } else if (searchResults.length > 0 && !searchQuery.trim().length) {
                                                            // empty query but have stale results
                                                            performSearch(searchQuery);
                                                        } else if (searchResults.length > 0) {
                                                            // 已有结果 → 跳到下一条
                                                            const next = (searchCursor + 1) % searchResults.length;
                                                            setSearchCursor(next);
                                                            goToPage(searchResults[next].page);
                                                        } else {
                                                            performSearch(searchQuery);
                                                        }
                                                    } else if (e.key === 'Escape') {
                                                        (e.target as HTMLInputElement).blur();
                                                    }
                                                }}
                                                placeholder={t('reader.searchPlaceholder', '搜索 PDF 全文...')}
                                                className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-[#e9e6da] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between gap-2">
                                            <button
                                                onClick={() => performSearch(searchQuery)}
                                                disabled={!searchQuery.trim() || isSearching || !pdf}
                                                className="flex-1 py-2 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-600 transition-colors"
                                            >
                                                {isSearching ? t('reader.searching', '搜索中...') : t('reader.search', '搜索')}
                                            </button>
                                            {searchResults.length > 0 && (
                                                <span className="text-[10px] font-bold text-slate-500 tabular-nums">
                                                    {searchResults.length} {t('reader.matches', '项')}
                                                </span>
                                            )}
                                        </div>

                                        {searchResults.length === 0 && !isSearching && searchQuery.trim() && (
                                            <div className="text-center py-12 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                {t('reader.noMatches', '无匹配结果')}
                                            </div>
                                        )}

                                        <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
                                            {searchResults.map((result, idx) => {
                                                const lower = result.snippet.toLowerCase();
                                                const term = searchQuery.toLowerCase();
                                                const matchIdx = lower.indexOf(term);
                                                const before = matchIdx >= 0 ? result.snippet.slice(0, matchIdx) : result.snippet;
                                                const match = matchIdx >= 0 ? result.snippet.slice(matchIdx, matchIdx + searchQuery.length) : '';
                                                const after = matchIdx >= 0 ? result.snippet.slice(matchIdx + searchQuery.length) : '';
                                                const isActive = idx === searchCursor;
                                                return (
                                                    <button
                                                        key={`${result.page}-${result.offset}-${idx}`}
                                                        onClick={() => {
                                                            setSearchCursor(idx);
                                                            goToPage(result.page);
                                                        }}
                                                        className={`w-full text-left p-3 rounded-lg border transition-all ${isActive ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-[#e9e6da] hover:bg-slate-50 hover:border-slate-200'}`}
                                                    >
                                                        <div className="flex items-baseline justify-between mb-1">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">
                                                                {t('reader.page', '页')} {result.page}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-slate-300 tabular-nums">
                                                                #{idx + 1}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] leading-relaxed text-slate-700 break-words">
                                                            {before}
                                                            <mark className="bg-amber-200 text-slate-900 px-0.5 rounded">{match}</mark>
                                                            {after}
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : sidebarTab === 'thumbnails' ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {numPages > 0 && pdf ? (
                                            Array.from(new Array(numPages), (_, i) => (
                                                <PageThumbnail
                                                    key={`thumb_${i + 1}`}
                                                    pdf={pdf}
                                                    pageNumber={i + 1}
                                                    isActive={pageNumber === i + 1}
                                                    onClick={() => goToPage(i + 1)}
                                                />
                                            ))
                                        ) : (
                                            <div className="col-span-2 text-center py-12 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                {t('reader.loadingThumbnails', '正在加载缩略图...')}
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content Area - Virtualized Scrolling List */}
                <div
                    ref={mainContainerRef}
                    style={{
                        filter:
                            readingMode === 'sepia' ? 'sepia(0.35) saturate(1.05) brightness(0.97)'
                                : readingMode === 'night' ? 'invert(0.92) hue-rotate(180deg) saturate(0.95) brightness(0.92)'
                                    : undefined,
                    }}
                    className={`flex-1 flex flex-col items-center pt-0 pb-4 transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} ${isPenMode || penDraftView || areaDrag || isAltPressed ? 'cursor-crosshair' : cursorMode === 'text' ? 'cursor-text' : cursorMode === 'crosshair' ? 'cursor-crosshair' : 'cursor-auto'}`}
                    onMouseDown={handleAreaMouseDown}
                    onMouseMove={handleAreaMouseMove}
                    onMouseUp={handleAreaMouseUp}
                    onMouseLeave={() => {
                        if (penDraftRef.current) {
                            commitPenDraft(penDraftRef.current);
                            clearPenDraft();
                        }
                        setCursorModeIfNeeded('auto');
                        if (penErase) {
                            setPenErase(null);
                        }
                    }}
                >
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
                            <div className="pdf-page-wrapper relative w-full flex justify-center py-2 mb-2" data-page-number={1}>
                                <Page
                                    pageNumber={1}
                                    width={pageRenderWidth}
                                    rotate={rotation}
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                    devicePixelRatio={Math.max(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)}
                                    className="shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#e9e6da]"
                                    onRenderSuccess={onFirstPageRenderSuccess}
                                    loading={null}
                                />
                                <HighlightInteractiveLayer
                                    pageNumber={1}
                                    highlightRects={getPageHighlights(1)}
                                    highlightActionAreas={getPageHighlightActionAreas(1)}
                                    onHighlightHover={openHighlightMenu}
                                    onHighlightLeave={scheduleHideHighlightMenu}
                                    actionTitle={t('reader.highlightActions', '高亮操作')}
                                    disabled={isPenMode}
                                />
                                <HandwritingLayer strokes={getPagePenStrokes(1)} draftPath={getPageDraftPenPath(1)} />
                                {areaDraft?.page === 1 && (
                                    <div
                                        className="absolute border-2 border-amber-400 bg-amber-200/20 pointer-events-none"
                                        style={{
                                            left: `${areaDraft.rect.left}%`,
                                            top: `${areaDraft.rect.top}%`,
                                            width: `${areaDraft.rect.width}%`,
                                            height: `${areaDraft.rect.height}%`,
                                        }}
                                    />
                                )}
                                {areaSelection?.page === 1 && (
                                    <div
                                        className="absolute border-2 border-amber-500 bg-amber-300/25 pointer-events-none"
                                        style={{
                                            left: `${areaSelection.rect.left}%`,
                                            top: `${areaSelection.rect.top}%`,
                                            width: `${areaSelection.rect.width}%`,
                                            height: `${areaSelection.rect.height}%`,
                                        }}
                                    />
                                )}
                            </div>
                        )}

                        {/* Remaining Pages - Lazy Loaded */}
                        {numPages > 1 && Array.from(new Array(numPages - 1), (_, index) => (
                            <LazyPage
                                key={`page_${index + 2}`}
                                pageNumber={index + 2}
                                pageWidth={pageRenderWidth}
                                rotation={rotation}
                                onVisible={handlePageVisible}
                                highlightRects={getPageHighlights(index + 2)}
                                highlightActionAreas={getPageHighlightActionAreas(index + 2)}
                                onHighlightHover={openHighlightMenu}
                                onHighlightLeave={scheduleHideHighlightMenu}
                                highlightActionsDisabled={isPenMode}
                                penStrokes={getPagePenStrokes(index + 2)}
                                draftPenPath={getPageDraftPenPath(index + 2)}
                                areaDraftRect={areaDraft?.page === index + 2 ? areaDraft.rect : undefined}
                                areaSelectedRect={areaSelection?.page === index + 2 ? areaSelection.rect : undefined}
                            />
                        ))}
                    </Document>
                </div>

                <AnimatePresence>
                    {isNotebookOpen && (
                        <motion.div
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="shrink-0 h-[calc(100vh-4rem)] sticky top-16 self-start flex"
                        >
                            <div
                                onMouseDown={handleNoteResizeMouseDown}
                                className="w-1 cursor-col-resize bg-transparent hover:bg-[#d6d1c4] active:bg-[#c7c1b0]"
                                title={t('reader.resizePanel', '拖动调整宽度')}
                            />
                            <div
                                className="notes-flat-panel h-full bg-[#fcfbf8]/95 border-l border-[#e9e6da] flex flex-col"
                                style={{ width: `${notePanelWidth}px` }}
                            >
                            <div className="px-3 py-2 border-b border-[#e9e6da] bg-[#f9f8f6] flex items-center justify-between gap-2">
                                <div className="inline-flex items-center gap-2 text-[#4b483e]">
                                    <NotebookPen size={16} />
                                    <span className="text-xs font-bold uppercase tracking-widest">{t('reader.notes', 'Notes')}</span>
                                </div>
                                <span className={`text-[11px] font-semibold ${noteDirty ? 'text-amber-700' : 'text-emerald-700'}`}>
                                    {noteDirty ? t('reader.autoSaving', '自动保存中...') : t('reader.autoSaved', '已自动保存')}
                                </span>
                            </div>

                            <div className="flex-1 overflow-auto p-3 space-y-3">
                                <div className="min-h-[70vh] border border-[#ece8db] bg-white/70 p-2">
                                    <div onMouseDownCapture={handleNoteEditorMouseDownCapture} onClickCapture={handleNoteEditorClickCapture}>
                                        <BlockNoteView
                                            editor={noteEditor}
                                            theme="light"
                                            slashMenu
                                            sideMenu
                                            formattingToolbar
                                            linkToolbar
                                            className="notion-like-editor min-h-[70vh] p-3 text-[14px] leading-6 text-[#35322b] [&_.bn-editor]:bg-transparent [&_.bn-container]:bg-transparent [&_.bn-editor]:px-2 [&_.bn-editor]:py-1 [&_.bn-editor]:border-0 [&_.bn-side-menu]:opacity-100 [&_.bn-editor]:text-[14px] [&_.bn-editor]:leading-7 [&_.bn-editor_h1]:text-[1.7rem] [&_.bn-editor_h2]:text-[1.4rem] [&_.bn-editor_h3]:text-[1.2rem]"
                                            onChange={(editor) => {
                                                const next = editor.blocksToMarkdownLossy(editor.document);
                                                setNoteDraft(next);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {selectionMenu.visible && (
                <div
                    className="fixed z-[70] -translate-x-1/2 -translate-y-full bg-slate-900 text-white px-2 py-1.5 rounded-lg shadow-lg flex items-center gap-1"
                    style={{ left: selectionMenu.x, top: selectionMenu.y }}
                >
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={addHighlightFromSelection}
                        className="text-xs font-semibold tracking-wide px-2 py-1 rounded hover:bg-slate-700"
                    >
                        {t('reader.highlight', '高亮')}
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={insertSelectionToNotebook}
                        className="text-xs font-semibold tracking-wide px-2 py-1 rounded hover:bg-slate-700"
                    >
                        {t('reader.insertNote', '插入笔记')}
                    </button>
                </div>
            )}

            {highlightMenu.visible && (
                <div
                    className="fixed z-[72] -translate-x-1/2 -translate-y-full bg-slate-900 text-white px-2 py-1.5 rounded-lg shadow-lg flex items-center gap-1"
                    style={{ left: highlightMenu.x, top: highlightMenu.y }}
                    onMouseEnter={cancelHideHighlightMenu}
                    onMouseLeave={scheduleHideHighlightMenu}
                >
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={copyHighlightTextToClipboard}
                        className="text-xs font-semibold tracking-wide px-2 py-1 rounded hover:bg-slate-700 inline-flex items-center gap-1"
                    >
                        <Copy size={12} />
                        {t('reader.copy', '复制')}
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={copyHighlightImageToClipboard}
                        className="text-xs font-semibold tracking-wide px-2 py-1 rounded hover:bg-slate-700 inline-flex items-center gap-1"
                    >
                        <Copy size={12} />
                        {t('reader.copyAreaImage', '复制图片')}
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={deleteHighlightFromMenu}
                        className="text-xs font-semibold tracking-wide px-2 py-1 rounded hover:bg-slate-700 inline-flex items-center gap-1"
                    >
                        <Trash2 size={12} />
                        {t('reader.deleteHighlight', '删除高亮')}
                    </button>
                </div>
            )}

            {areaSelection && (
                <div
                    className="fixed z-[70] -translate-x-1/2 -translate-y-full bg-slate-900 text-white px-2 py-1.5 rounded-lg shadow-lg flex items-center gap-2"
                    style={{ left: areaSelection.anchorX, top: areaSelection.anchorY - 8 }}
                >
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={addAreaHighlight}
                        className="text-xs font-semibold tracking-wide px-2 py-1 rounded hover:bg-slate-700"
                    >
                        {t('reader.highlightArea', '整体高亮（含OCR）')}
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={copyAreaImageToClipboard}
                        className="text-xs font-semibold tracking-wide px-2 py-1 rounded hover:bg-slate-700"
                    >
                        {t('reader.copyAreaImage', '复制图片')}
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={insertAreaToNotebook}
                        className="text-xs font-semibold tracking-wide px-2 py-1 rounded hover:bg-slate-700"
                    >
                        {t('reader.insertNote', '插入笔记')}
                    </button>
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={hideAreaSelection}
                        className="text-xs font-semibold tracking-wide px-2 py-1 rounded hover:bg-slate-700"
                    >
                        {t('common.cancel', '取消')}
                    </button>
                </div>
            )}

            {notice && (
                <div
                    className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[80] px-3 py-2 rounded-lg text-xs font-semibold shadow-lg ${notice.tone === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
                >
                    {notice.text}
                </div>
            )}

            {!areaSelection && !isPenMode && (
                <div className="fixed bottom-5 right-5 z-[70] px-3 py-2 rounded-lg bg-slate-900/85 text-white text-[11px] font-medium">
                    {t('reader.altAreaHint', '按住 Alt 可强制框选')}
                </div>
            )}

            {isPenMode && (
                <div className="fixed bottom-5 right-5 z-[70] px-3 py-2 rounded-lg bg-blue-900/85 text-white text-[11px] font-medium">
                    {penTool === 'erase'
                        ? t('reader.penModeHintErase', '橡皮已开启，点击/拖动擦除；点“退出”关闭')
                        : t('reader.penModeHint', '手写笔已开启，按住拖动书写；点“退出”关闭')}
                </div>
            )}

            <style>{`
                .pdf-page-wrapper {
                    scroll-margin-top: 72px;
                }

                .notes-flat-panel,
                .notes-flat-panel * {
                    border-radius: 0 !important;
                }

                body.theme-chiikawa .notes-flat-panel button:not([class*="rounded-full"]),
                body.theme-shinchan .notes-flat-panel button:not([class*="rounded-full"]) {
                    border-radius: 0 !important;
                }
            `}</style>

            <AnimatePresence>
                {showShortcuts && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6"
                        onClick={() => setShowShortcuts(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl border border-white w-full max-w-md p-8"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900">{t('reader.shortcutsTitle', '键盘快捷键')}</h3>
                                <button
                                    onClick={() => setShowShortcuts(false)}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                                    aria-label={t('common.close', '关闭')}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <ul className="space-y-2.5 text-sm">
                                {[
                                    { keys: ['←', '→'], desc: t('reader.shortcutPrevNext', '上一页 / 下一页') },
                                    { keys: ['Space'], desc: t('reader.shortcutSpace', '下一页') },
                                    { keys: ['Home', 'End'], desc: t('reader.shortcutHomeEnd', '首页 / 末页') },
                                    { keys: ['+', '-'], desc: t('reader.shortcutZoom', '放大 / 缩小') },
                                    { keys: ['0'], desc: t('reader.shortcutFit', '适应宽度') },
                                    { keys: ['B'], desc: t('reader.shortcutBookmark', '切换书签') },
                                    { keys: ['R'], desc: t('reader.shortcutRotate', '旋转 90°') },
                                    { keys: ['F'], desc: t('reader.shortcutFullscreen', '全屏') },
                                    { keys: ['Ctrl/Cmd', 'F'], desc: t('reader.shortcutFind', '搜索') },
                                    { keys: ['?'], desc: t('reader.shortcutHelp', '本帮助') },
                                    { keys: ['Esc'], desc: t('reader.shortcutEsc', '关闭弹窗 / 清除选区') },
                                ].map((row) => (
                                    <li key={row.desc} className="flex items-center justify-between gap-3 py-1">
                                        <div className="flex items-center gap-1.5">
                                            {row.keys.map((k) => (
                                                <kbd
                                                    key={k}
                                                    className="px-2 py-0.5 text-[11px] font-bold font-mono bg-slate-100 border border-slate-200 rounded text-slate-700 shadow-sm"
                                                >
                                                    {k}
                                                </kbd>
                                            ))}
                                        </div>
                                        <span className="text-slate-600 font-medium text-right">{row.desc}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">
                                {t('reader.shortcutsHint', '按 ? 随时打开本面板')}
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
export default PdfReader;
