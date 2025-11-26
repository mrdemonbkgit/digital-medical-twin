import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  /** Whether infinite scroll is enabled */
  enabled: boolean;
  /** Root margin for IntersectionObserver (triggers early loading) */
  rootMargin?: string;
  /** Threshold for intersection (0-1) */
  threshold?: number;
}

/**
 * Hook for implementing infinite scroll using IntersectionObserver.
 * Returns a ref to attach to a sentinel element at the bottom of the list.
 *
 * @param callback - Function to call when sentinel becomes visible
 * @param options - Configuration options
 * @returns Ref to attach to sentinel element
 */
export function useInfiniteScroll(
  callback: () => void,
  options: UseInfiniteScrollOptions
) {
  const { enabled, rootMargin = '200px', threshold = 0 } = options;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref updated to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        callbackRef.current();
      }
    },
    []
  );

  useEffect(() => {
    if (!enabled) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin,
      threshold,
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [enabled, rootMargin, threshold, handleIntersect]);

  return sentinelRef;
}
