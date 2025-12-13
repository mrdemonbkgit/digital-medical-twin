import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAriaAnnounce } from './useAriaAnnounce';

describe('useAriaAnnounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty announcement initially', () => {
    const { result } = renderHook(() => useAriaAnnounce());

    expect(result.current.announcement).toBe('');
  });

  it('sets announcement after calling announce', async () => {
    const { result } = renderHook(() => useAriaAnnounce());

    act(() => {
      result.current.announce('Test message');
    });

    // Advance past the 50ms delay
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(result.current.announcement).toBe('Test message');
  });

  it('clears announcement before setting new one', async () => {
    const { result } = renderHook(() => useAriaAnnounce());

    // Set initial announcement
    act(() => {
      result.current.announce('First message');
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(result.current.announcement).toBe('First message');

    // Set new announcement - should clear first
    act(() => {
      result.current.announce('Second message');
    });

    // Immediately after calling announce, it should be cleared
    expect(result.current.announcement).toBe('');

    // After delay, new message should appear
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(result.current.announcement).toBe('Second message');
  });

  it('announce function is stable across renders', () => {
    const { result, rerender } = renderHook(() => useAriaAnnounce());

    const firstAnnounce = result.current.announce;
    rerender();
    const secondAnnounce = result.current.announce;

    expect(firstAnnounce).toBe(secondAnnounce);
  });

  it('can announce the same message twice', async () => {
    const { result } = renderHook(() => useAriaAnnounce());

    // First announcement
    act(() => {
      result.current.announce('Same message');
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(result.current.announcement).toBe('Same message');

    // Announce same message again - should still work
    act(() => {
      result.current.announce('Same message');
    });

    // Should be cleared first
    expect(result.current.announcement).toBe('');

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(result.current.announcement).toBe('Same message');
  });
});
