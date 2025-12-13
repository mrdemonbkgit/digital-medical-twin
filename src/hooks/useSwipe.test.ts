import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSwipe } from './useSwipe';

describe('useSwipe', () => {
  // Helper to create mock touch events
  const createTouchEvent = (clientX: number, clientY: number = 0) => ({
    touches: [{ clientX, clientY }],
  } as unknown as React.TouchEvent);

  describe('basic swipe detection', () => {
    it('returns initial state', () => {
      const { result } = renderHook(() => useSwipe());
      const [, state] = result.current;

      expect(state.offset).toBe(0);
      expect(state.isSwiping).toBe(false);
    });

    it('tracks horizontal swipe offset', () => {
      const { result } = renderHook(() => useSwipe());

      act(() => {
        result.current[0].onTouchStart(createTouchEvent(100, 50));
      });

      expect(result.current[1].isSwiping).toBe(true);

      act(() => {
        result.current[0].onTouchMove(createTouchEvent(50, 50)); // Move left 50px
      });

      expect(result.current[1].offset).toBe(-50);
    });

    it('resets offset on touch end', () => {
      const { result } = renderHook(() => useSwipe());

      act(() => {
        result.current[0].onTouchStart(createTouchEvent(100));
        result.current[0].onTouchMove(createTouchEvent(50));
        result.current[0].onTouchEnd();
      });

      expect(result.current[1].offset).toBe(0);
      expect(result.current[1].isSwiping).toBe(false);
    });
  });

  describe('swipe callbacks', () => {
    it('calls onSwipeLeft when swiped left past threshold', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useSwipe({ onSwipeLeft, threshold: 50 }));

      act(() => {
        result.current[0].onTouchStart(createTouchEvent(200, 50));
      });

      act(() => {
        result.current[0].onTouchMove(createTouchEvent(100, 50)); // Move left 100px (past threshold)
      });

      act(() => {
        result.current[0].onTouchEnd();
      });

      expect(onSwipeLeft).toHaveBeenCalled();
    });

    it('calls onSwipeRight when swiped right past threshold', () => {
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() => useSwipe({ onSwipeRight, threshold: 50 }));

      act(() => {
        result.current[0].onTouchStart(createTouchEvent(100, 50));
      });

      act(() => {
        result.current[0].onTouchMove(createTouchEvent(200, 50)); // Move right 100px (past threshold)
      });

      act(() => {
        result.current[0].onTouchEnd();
      });

      expect(onSwipeRight).toHaveBeenCalled();
    });

    it('does not call callback when swipe below threshold', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useSwipe({ onSwipeLeft, threshold: 50 }));

      act(() => {
        result.current[0].onTouchStart(createTouchEvent(100, 50));
      });

      act(() => {
        result.current[0].onTouchMove(createTouchEvent(70, 50)); // Move left 30px (below threshold)
      });

      act(() => {
        result.current[0].onTouchEnd();
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('vertical scroll handling', () => {
    it('does not track vertical swipes', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useSwipe({ onSwipeLeft }));

      act(() => {
        result.current[0].onTouchStart(createTouchEvent(100, 100));
      });

      act(() => {
        // Move mostly vertically (20px horizontal, 100px vertical)
        result.current[0].onTouchMove(createTouchEvent(80, 200));
      });

      act(() => {
        result.current[0].onTouchEnd();
      });

      // Should not trigger swipe since it's mostly vertical
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('enabled state', () => {
    it('does nothing when disabled', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useSwipe({ onSwipeLeft, enabled: false }));

      act(() => {
        result.current[0].onTouchStart(createTouchEvent(200, 50));
      });

      act(() => {
        result.current[0].onTouchMove(createTouchEvent(100, 50));
      });

      act(() => {
        result.current[0].onTouchEnd();
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(result.current[1].offset).toBe(0);
      expect(result.current[1].isSwiping).toBe(false);
    });
  });

  describe('offset clamping', () => {
    it('clamps offset to max threshold * 2', () => {
      const { result } = renderHook(() => useSwipe({ threshold: 50 }));

      act(() => {
        result.current[0].onTouchStart(createTouchEvent(500, 50));
      });

      act(() => {
        result.current[0].onTouchMove(createTouchEvent(100, 50)); // Move left 400px
      });

      // Should be clamped to -100 (threshold * 2)
      expect(result.current[1].offset).toBe(-100);
    });
  });
});
