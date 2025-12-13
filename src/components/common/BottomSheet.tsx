import { useRef, useEffect, useCallback, useState, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Title for the sheet header */
  title?: string;
  /** Snap points as percentages of viewport height (default: [0.5, 0.9]) */
  snapPoints?: number[];
  /** Initial snap point index (default: 0) */
  initialSnap?: number;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.5, 0.9],
  initialSnap = 0,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const currentTranslateY = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [currentSnapIndex, setCurrentSnapIndex] = useState(initialSnap);

  // Calculate sheet height based on snap point
  const getSheetHeight = useCallback(
    (snapIndex: number) => {
      return `${snapPoints[snapIndex] * 100}vh`;
    },
    [snapPoints]
  );

  // Handle touch/mouse start
  const handleDragStart = useCallback((clientY: number) => {
    dragStartY.current = clientY;
    currentTranslateY.current = 0;
    setIsDragging(true);
  }, []);

  // Handle touch/mouse move
  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!isDragging || !sheetRef.current) return;

      const deltaY = clientY - dragStartY.current;
      // Only allow dragging down (positive deltaY)
      const translateY = Math.max(0, deltaY);
      currentTranslateY.current = translateY;
      sheetRef.current.style.transform = `translateY(${translateY}px)`;
    },
    [isDragging]
  );

  // Handle touch/mouse end
  const handleDragEnd = useCallback(() => {
    if (!isDragging || !sheetRef.current) return;

    setIsDragging(false);
    const threshold = 100; // pixels to trigger close or snap change

    if (currentTranslateY.current > threshold) {
      // If dragged down significantly, check if we should close or snap to lower point
      if (currentSnapIndex === 0) {
        // Already at lowest snap, close the sheet
        onClose();
      } else {
        // Snap to lower point
        setCurrentSnapIndex(currentSnapIndex - 1);
      }
    }

    // Reset transform (animation will handle the snap)
    sheetRef.current.style.transform = '';
    currentTranslateY.current = 0;
  }, [isDragging, currentSnapIndex, onClose]);

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handleDragStart(e.touches[0].clientY);
    },
    [handleDragStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      handleDragMove(e.touches[0].clientY);
    },
    [handleDragMove]
  );

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse event handlers for desktop testing
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleDragStart(e.clientY);
    },
    [handleDragStart]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Reset snap index when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentSnapIndex(initialSnap);
    }
  }, [isOpen, initialSnap]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 lg:hidden',
          'bg-theme-secondary rounded-t-2xl shadow-xl',
          'flex flex-col',
          isDragging ? '' : 'transition-transform duration-300 ease-out'
        )}
        style={{ height: getSheetHeight(currentSnapIndex) }}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Bottom sheet'}
      >
        {/* Drag handle */}
        <div
          className="flex items-center justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="w-12 h-1.5 bg-theme-muted rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-4 pb-2 border-b border-theme-primary">
            <h2 className="text-lg font-semibold text-theme-primary">{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </>
  );
}
