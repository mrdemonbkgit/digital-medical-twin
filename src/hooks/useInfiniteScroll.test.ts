import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInfiniteScroll } from './useInfiniteScroll';

// The IntersectionObserver is mocked in setup.ts
// We just need to test the hook behavior

describe('useInfiniteScroll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('returns a ref object', () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useInfiniteScroll(callback, { enabled: true })
      );

      expect(result.current).toBeDefined();
      expect(result.current).toHaveProperty('current');
    });

    it('returns ref with null initial value', () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useInfiniteScroll(callback, { enabled: true })
      );

      expect(result.current.current).toBeNull();
    });
  });

  describe('enabled option', () => {
    it('does not error when disabled', () => {
      const callback = vi.fn();

      expect(() => {
        renderHook(() => useInfiniteScroll(callback, { enabled: false }));
      }).not.toThrow();
    });

    it('does not error when enabled', () => {
      const callback = vi.fn();

      expect(() => {
        renderHook(() => useInfiniteScroll(callback, { enabled: true }));
      }).not.toThrow();
    });
  });

  describe('callback updates', () => {
    it('accepts new callbacks without error', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { rerender } = renderHook(
        ({ callback }) => useInfiniteScroll(callback, { enabled: true }),
        { initialProps: { callback: callback1 } }
      );

      expect(() => {
        rerender({ callback: callback2 });
      }).not.toThrow();
    });
  });

  describe('options changes', () => {
    it('handles rootMargin changes', () => {
      const callback = vi.fn();

      const { rerender } = renderHook(
        ({ rootMargin }) => useInfiniteScroll(callback, { enabled: true, rootMargin }),
        { initialProps: { rootMargin: '200px' } }
      );

      expect(() => {
        rerender({ rootMargin: '500px' });
      }).not.toThrow();
    });

    it('handles threshold changes', () => {
      const callback = vi.fn();

      const { rerender } = renderHook(
        ({ threshold }) => useInfiniteScroll(callback, { enabled: true, threshold }),
        { initialProps: { threshold: 0 } }
      );

      expect(() => {
        rerender({ threshold: 0.5 });
      }).not.toThrow();
    });

    it('handles enabled toggle', () => {
      const callback = vi.fn();

      const { rerender } = renderHook(
        ({ enabled }) => useInfiniteScroll(callback, { enabled }),
        { initialProps: { enabled: true } }
      );

      expect(() => {
        rerender({ enabled: false });
        rerender({ enabled: true });
      }).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('cleans up on unmount without error', () => {
      const callback = vi.fn();

      const { unmount } = renderHook(() =>
        useInfiniteScroll(callback, { enabled: true })
      );

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('default options', () => {
    it('uses default options when not provided', () => {
      const callback = vi.fn();

      expect(() => {
        renderHook(() => useInfiniteScroll(callback, { enabled: true }));
      }).not.toThrow();
    });

    it('allows all options to be customized', () => {
      const callback = vi.fn();

      expect(() => {
        renderHook(() =>
          useInfiniteScroll(callback, {
            enabled: true,
            rootMargin: '100px',
            threshold: 0.25,
          })
        );
      }).not.toThrow();
    });
  });
});
