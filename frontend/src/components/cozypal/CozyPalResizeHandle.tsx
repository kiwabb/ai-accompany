import type { MouseEvent } from 'react';

interface CozyPalResizeHandleProps {
  isResizing: boolean;
  onStartResizing: (event: MouseEvent) => void;
}

const CozyPalResizeHandle = ({ isResizing, onStartResizing }: CozyPalResizeHandleProps) => (
  <>
    <div
      className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-indigo-500/30 transition-all z-50 transform -translate-x-1/2 flex items-center justify-center group"
      onMouseDown={onStartResizing}
    >
      <div className="w-0.5 h-12 bg-gray-200 group-hover:bg-indigo-400 rounded-full transition-colors opacity-0 group-hover:opacity-100" />
    </div>
    {isResizing && (
      <div
        className="fixed inset-0 z-[60] cursor-ew-resize bg-transparent"
        style={{ userSelect: 'none' }}
      />
    )}
  </>
);

export default CozyPalResizeHandle;
