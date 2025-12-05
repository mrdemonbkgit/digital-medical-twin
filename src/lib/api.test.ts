import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useApiClient, getCorrelationHeaders } from './api';

// Mock the context
vi.mock('@/context/CorrelationContext', () => ({
  useCorrelation: vi.fn(),
}));

import { useCorrelation } from '@/context/CorrelationContext';

const mockUseCorrelation = vi.mocked(useCorrelation);

describe('api', () => {
  describe('useApiClient', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      global.fetch = vi.fn().mockResolvedValue({ ok: true });
    });

    it('returns object with fetch function', () => {
      mockUseCorrelation.mockReturnValue({
        sessionId: 'session-123',
        currentOperationId: null,
        startOperation: vi.fn(),
        endOperation: vi.fn(),
      });

      const { result } = renderHook(() => useApiClient());

      expect(result.current.fetch).toBeDefined();
      expect(typeof result.current.fetch).toBe('function');
    });

    it('adds session ID header to requests', async () => {
      mockUseCorrelation.mockReturnValue({
        sessionId: 'session-123',
        currentOperationId: null,
        startOperation: vi.fn(),
        endOperation: vi.fn(),
      });

      const { result } = renderHook(() => useApiClient());
      await result.current.fetch('/api/test');

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'X-Session-ID': 'session-123',
        },
      });
    });

    it('adds operation ID header when present', async () => {
      mockUseCorrelation.mockReturnValue({
        sessionId: 'session-123',
        currentOperationId: 'op-456',
        startOperation: vi.fn(),
        endOperation: vi.fn(),
      });

      const { result } = renderHook(() => useApiClient());
      await result.current.fetch('/api/test');

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'X-Session-ID': 'session-123',
          'X-Operation-ID': 'op-456',
        },
      });
    });

    it('preserves existing headers', async () => {
      mockUseCorrelation.mockReturnValue({
        sessionId: 'session-123',
        currentOperationId: null,
        startOperation: vi.fn(),
        endOperation: vi.fn(),
      });

      const { result } = renderHook(() => useApiClient());
      await result.current.fetch('/api/test', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': 'session-123',
        },
      });
    });

    it('preserves other options', async () => {
      mockUseCorrelation.mockReturnValue({
        sessionId: 'session-123',
        currentOperationId: null,
        startOperation: vi.fn(),
        endOperation: vi.fn(),
      });

      const { result } = renderHook(() => useApiClient());
      await result.current.fetch('/api/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
        headers: {
          'X-Session-ID': 'session-123',
        },
      });
    });

    it('memoizes the client', () => {
      mockUseCorrelation.mockReturnValue({
        sessionId: 'session-123',
        currentOperationId: null,
        startOperation: vi.fn(),
        endOperation: vi.fn(),
      });

      const { result, rerender } = renderHook(() => useApiClient());
      const firstClient = result.current;

      rerender();
      const secondClient = result.current;

      expect(firstClient).toBe(secondClient);
    });

    it('updates client when sessionId changes', () => {
      mockUseCorrelation.mockReturnValue({
        sessionId: 'session-123',
        currentOperationId: null,
        startOperation: vi.fn(),
        endOperation: vi.fn(),
      });

      const { result, rerender } = renderHook(() => useApiClient());
      const firstClient = result.current;

      mockUseCorrelation.mockReturnValue({
        sessionId: 'session-456',
        currentOperationId: null,
        startOperation: vi.fn(),
        endOperation: vi.fn(),
      });

      rerender();
      const secondClient = result.current;

      expect(firstClient).not.toBe(secondClient);
    });
  });

  describe('getCorrelationHeaders', () => {
    it('returns session ID header', () => {
      const headers = getCorrelationHeaders('session-123');

      expect(headers).toEqual({
        'X-Session-ID': 'session-123',
      });
    });

    it('includes operation ID when provided', () => {
      const headers = getCorrelationHeaders('session-123', 'op-456');

      expect(headers).toEqual({
        'X-Session-ID': 'session-123',
        'X-Operation-ID': 'op-456',
      });
    });

    it('excludes operation ID when null', () => {
      const headers = getCorrelationHeaders('session-123', null);

      expect(headers).toEqual({
        'X-Session-ID': 'session-123',
      });
    });

    it('excludes operation ID when undefined', () => {
      const headers = getCorrelationHeaders('session-123', undefined);

      expect(headers).toEqual({
        'X-Session-ID': 'session-123',
      });
    });
  });
});
