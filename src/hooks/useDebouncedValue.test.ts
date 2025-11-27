import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('initial'));
    expect(result.current).toBe('initial');
  });

  it('debounces value updates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'initial' } }
    );

    // Initial value
    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated' });

    // Should still be initial immediately
    expect(result.current).toBe('initial');

    // Fast-forward past debounce delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Now should be updated
    expect(result.current).toBe('updated');
  });

  it('uses default delay of 300ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    // Should not update at 299ms
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('initial');

    // Should update at 300ms
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('resets timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'a' } }
    );

    // Rapidly update values
    rerender({ value: 'b' });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: 'c' });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: 'd' });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Still should be initial 'a' because timer keeps resetting
    expect(result.current).toBe('a');

    // Wait full delay after last change
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Now should be the last value
    expect(result.current).toBe('d');
  });

  it('works with different types', () => {
    // Number
    const { result: numResult } = renderHook(() => useDebouncedValue(42));
    expect(numResult.current).toBe(42);

    // Object
    const obj = { foo: 'bar' };
    const { result: objResult } = renderHook(() => useDebouncedValue(obj));
    expect(objResult.current).toBe(obj);

    // Null
    const { result: nullResult } = renderHook(() => useDebouncedValue(null));
    expect(nullResult.current).toBe(null);
  });

  it('respects custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    // Should not update at 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('initial');

    // Should update at 500ms
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('updated');
  });

  it('cleans up timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { unmount, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
