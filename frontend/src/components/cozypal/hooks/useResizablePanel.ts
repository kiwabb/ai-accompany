import { useCallback, useEffect, useState } from 'react';

interface UseResizablePanelOptions {
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

const DEFAULT_WIDTH = 450;
const MIN_WIDTH = 300;
const MAX_WIDTH = 800;

const useResizablePanel = ({
  initialWidth = DEFAULT_WIDTH,
  minWidth = MIN_WIDTH,
  maxWidth = MAX_WIDTH,
}: UseResizablePanelOptions = {}) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return undefined;

    const handleMouseMove = (event: MouseEvent) => {
      const newWidth = window.innerWidth - event.clientX;
      if (newWidth > minWidth && newWidth < maxWidth) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth]);

  return { width, isResizing, startResizing, setWidth };
};

export default useResizablePanel;
