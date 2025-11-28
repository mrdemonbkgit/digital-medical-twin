import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CorrelationProvider, useCorrelation } from '../CorrelationContext';

describe('CorrelationProvider', () => {
  it('generates unique session ID on mount', () => {
    const { result } = renderHook(() => useCorrelation(), {
      wrapper: CorrelationProvider,
    });

    expect(result.current.sessionId).toMatch(/^sess-[a-zA-Z0-9_-]{8}$/);
  });

  it('generates different session IDs for different instances', () => {
    const { result: result1 } = renderHook(() => useCorrelation(), {
      wrapper: CorrelationProvider,
    });
    const { result: result2 } = renderHook(() => useCorrelation(), {
      wrapper: CorrelationProvider,
    });

    expect(result1.current.sessionId).not.toBe(result2.current.sessionId);
  });

  it('startOperation creates operation ID', () => {
    const { result } = renderHook(() => useCorrelation(), {
      wrapper: CorrelationProvider,
    });

    expect(result.current.currentOperationId).toBeNull();

    act(() => {
      result.current.startOperation('pdf-extract');
    });

    expect(result.current.currentOperationId).toMatch(/^pdf-extract-[a-zA-Z0-9_-]{6}$/);
  });

  it('endOperation clears operation ID', () => {
    const { result } = renderHook(() => useCorrelation(), {
      wrapper: CorrelationProvider,
    });

    act(() => {
      result.current.startOperation('upload');
    });

    expect(result.current.currentOperationId).not.toBeNull();

    act(() => {
      result.current.endOperation();
    });

    expect(result.current.currentOperationId).toBeNull();
  });

  it('startOperation returns the created operation ID', () => {
    const { result } = renderHook(() => useCorrelation(), {
      wrapper: CorrelationProvider,
    });

    let opId: string = '';
    act(() => {
      opId = result.current.startOperation('test-op');
    });

    expect(opId).toBe(result.current.currentOperationId);
  });

  it('throws when useCorrelation is used outside provider', () => {
    expect(() => {
      renderHook(() => useCorrelation());
    }).toThrow('useCorrelation must be used within CorrelationProvider');
  });
});
