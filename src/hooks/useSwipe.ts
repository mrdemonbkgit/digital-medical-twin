import { useRef, useCallback, useState } from 'react';

export interface SwipeConfig {
  /** Minimum distance (in pixels) to trigger a swipe */
  threshold?: number;
  /** Callback when swipe left is detected */
  onSwipeLeft?: () => void;
  /** Callback when swipe right is detected */
  onSwipeRight?: () => void;
  /** Whether swipe is enabled */
  enabled?: boolean;
}

export interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export interface SwipeState {
  /** Current swipe offset in pixels (negative = left, positive = right) */
  offset: number;
  /** Whether a swipe is currently in progress */
  isSwiping: boolean;
}

/**
 * Hook to detect and handle swipe gestures.
 * Returns touch event handlers and current swipe state.
 */
export function useSwipe({
  threshold = 50,
  onSwipeLeft,
  onSwipeRight,
  enabled = true,
}: SwipeConfig = {}): [SwipeHandlers, SwipeState] {
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      isHorizontalSwipe.current = null;
      setIsSwiping(true);
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !isSwiping) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - startX.current;
      const deltaY = currentY - startY.current;

      // Determine if this is a horizontal or vertical swipe on first significant movement
      if (isHorizontalSwipe.current === null) {
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
          isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
        }
      }

      // Only track horizontal swipes
      if (isHorizontalSwipe.current) {
        // Limit offset to max threshold * 2 for visual feedback
        const maxOffset = threshold * 2;
        const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
        setOffset(clampedOffset);
      }
    },
    [enabled, isSwiping, threshold]
  );

  const handleTouchEnd = useCallback(() => {
    if (!enabled) return;

    if (isHorizontalSwipe.current) {
      if (offset < -threshold && onSwipeLeft) {
        onSwipeLeft();
      } else if (offset > threshold && onSwipeRight) {
        onSwipeRight();
      }
    }

    // Reset state with animation
    setOffset(0);
    setIsSwiping(false);
    isHorizontalSwipe.current = null;
  }, [enabled, offset, threshold, onSwipeLeft, onSwipeRight]);

  const handlers: SwipeHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  const state: SwipeState = {
    offset,
    isSwiping,
  };

  return [handlers, state];
}
