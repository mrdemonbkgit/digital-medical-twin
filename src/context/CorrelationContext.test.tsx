import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { CorrelationProvider, useCorrelation } from './CorrelationContext';

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: vi.fn((length: number) => 'x'.repeat(length)),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    setSessionId: vi.fn(),
    setOperationId: vi.fn(),
  },
}));

import { logger } from '@/lib/logger';

describe('CorrelationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CorrelationProvider', () => {
    it('renders children', () => {
      render(
        <CorrelationProvider>
          <div data-testid="child">Child content</div>
        </CorrelationProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('sets session ID on logger when mounted', () => {
      render(
        <CorrelationProvider>
          <div>Test</div>
        </CorrelationProvider>
      );

      expect(logger.setSessionId).toHaveBeenCalledWith('sess-xxxxxxxx');
    });

    it('clears operation ID on logger initially', () => {
      render(
        <CorrelationProvider>
          <div>Test</div>
        </CorrelationProvider>
      );

      expect(logger.setOperationId).toHaveBeenCalledWith(undefined);
    });
  });

  describe('useCorrelation', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useCorrelation());
      }).toThrow('useCorrelation must be used within CorrelationProvider');

      consoleSpy.mockRestore();
    });

    it('returns sessionId', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CorrelationProvider>{children}</CorrelationProvider>
      );

      const { result } = renderHook(() => useCorrelation(), { wrapper });

      expect(result.current.sessionId).toBe('sess-xxxxxxxx');
    });

    it('returns null for currentOperationId initially', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CorrelationProvider>{children}</CorrelationProvider>
      );

      const { result } = renderHook(() => useCorrelation(), { wrapper });

      expect(result.current.currentOperationId).toBeNull();
    });

    it('startOperation sets operation ID and returns it', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CorrelationProvider>{children}</CorrelationProvider>
      );

      const { result } = renderHook(() => useCorrelation(), { wrapper });

      let operationId: string;
      act(() => {
        operationId = result.current.startOperation('test-op');
      });

      expect(operationId!).toBe('test-op-xxxxxx');
      expect(result.current.currentOperationId).toBe('test-op-xxxxxx');
    });

    it('startOperation updates logger with operation ID', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CorrelationProvider>{children}</CorrelationProvider>
      );

      const { result } = renderHook(() => useCorrelation(), { wrapper });

      act(() => {
        result.current.startOperation('fetch');
      });

      expect(logger.setOperationId).toHaveBeenCalledWith('fetch-xxxxxx');
    });

    it('endOperation clears operation ID', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CorrelationProvider>{children}</CorrelationProvider>
      );

      const { result } = renderHook(() => useCorrelation(), { wrapper });

      act(() => {
        result.current.startOperation('test');
      });

      expect(result.current.currentOperationId).toBe('test-xxxxxx');

      act(() => {
        result.current.endOperation();
      });

      expect(result.current.currentOperationId).toBeNull();
    });

    it('endOperation clears logger operation ID', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CorrelationProvider>{children}</CorrelationProvider>
      );

      const { result } = renderHook(() => useCorrelation(), { wrapper });

      act(() => {
        result.current.startOperation('test');
      });

      vi.clearAllMocks();

      act(() => {
        result.current.endOperation();
      });

      expect(logger.setOperationId).toHaveBeenCalledWith(undefined);
    });

    it('can start multiple operations sequentially', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CorrelationProvider>{children}</CorrelationProvider>
      );

      const { result } = renderHook(() => useCorrelation(), { wrapper });

      act(() => {
        result.current.startOperation('op1');
      });
      expect(result.current.currentOperationId).toBe('op1-xxxxxx');

      act(() => {
        result.current.startOperation('op2');
      });
      expect(result.current.currentOperationId).toBe('op2-xxxxxx');
    });

    it('sessionId remains stable across re-renders', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CorrelationProvider>{children}</CorrelationProvider>
      );

      const { result, rerender } = renderHook(() => useCorrelation(), { wrapper });

      const initialSessionId = result.current.sessionId;

      rerender();

      expect(result.current.sessionId).toBe(initialSessionId);
    });
  });
});
