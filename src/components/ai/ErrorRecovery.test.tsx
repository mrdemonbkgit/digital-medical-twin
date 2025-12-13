import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ErrorRecovery } from './ErrorRecovery';

describe('ErrorRecovery', () => {
  const mockOnRetry = vi.fn();
  const mockOnNewConversation = vi.fn();
  const mockOnDismiss = vi.fn();

  // Mock clipboard
  const mockWriteText = vi.fn().mockResolvedValue(undefined);
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    });
  });

  function renderError(error = 'Something went wrong', isLoading = false) {
    return render(
      <ErrorRecovery
        error={error}
        onRetry={mockOnRetry}
        onNewConversation={mockOnNewConversation}
        onDismiss={mockOnDismiss}
        isLoading={isLoading}
      />
    );
  }

  describe('error type detection', () => {
    it('shows rate limit message for rate limit errors', () => {
      renderError('Rate limit exceeded');
      expect(screen.getByText('Too many requests')).toBeInTheDocument();
    });

    it('shows network message for connection errors', () => {
      renderError('Network connection failed');
      expect(screen.getByText('Connection problem')).toBeInTheDocument();
    });

    it('shows timeout message for timeout errors', () => {
      renderError('Request timed out');
      expect(screen.getByText('Request timed out')).toBeInTheDocument();
    });

    it('shows context message for context length errors', () => {
      renderError('Context too long - max tokens exceeded');
      expect(screen.getByText('Conversation too long')).toBeInTheDocument();
    });

    it('shows generic message for unknown errors', () => {
      renderError('Unknown error occurred');
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('retry functionality', () => {
    it('calls onDismiss and onRetry when retry clicked', () => {
      renderError('Server error');

      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('disables retry button when loading', () => {
      renderError('Server error', true);

      expect(screen.getByRole('button', { name: /retrying/i })).toBeDisabled();
    });

    it('shows countdown for rate limit errors', () => {
      renderError('Rate limit exceeded');

      expect(screen.getByText('Retry in 30s')).toBeInTheDocument();
    });

    it('countdown decreases over time', () => {
      renderError('Rate limit exceeded');

      expect(screen.getByText('Retry in 30s')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByText('Retry in 25s')).toBeInTheDocument();
    });

    it('enables retry after countdown completes', async () => {
      renderError('Rate limit exceeded');

      act(() => {
        vi.advanceTimersByTime(30000);
      });

      expect(screen.getByRole('button', { name: /^retry$/i })).toBeEnabled();
    });
  });

  describe('new conversation button', () => {
    it('shows new conversation button for context errors', () => {
      renderError('Context too long');

      expect(screen.getByRole('button', { name: /new conversation/i })).toBeInTheDocument();
    });

    it('calls onNewConversation when clicked', () => {
      renderError('Context too long');

      fireEvent.click(screen.getByRole('button', { name: /new conversation/i }));

      expect(mockOnNewConversation).toHaveBeenCalledTimes(1);
    });
  });

  describe('copy error functionality', () => {
    it('copies error to clipboard when copy button clicked', async () => {
      // Use real timers for clipboard operations
      vi.useRealTimers();
      renderError('Test error message');

      fireEvent.click(screen.getByRole('button', { name: /copy error/i }));

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('Test error message');
      });
      vi.useFakeTimers();
    });

    it('shows copied feedback', async () => {
      // Use real timers for clipboard operations
      vi.useRealTimers();
      renderError('Test error message');

      fireEvent.click(screen.getByRole('button', { name: /copy error/i }));

      await waitFor(() => {
        expect(screen.getByText('Copied')).toBeInTheDocument();
      });
      vi.useFakeTimers();
    });
  });

  describe('dismiss functionality', () => {
    it('calls onDismiss when dismiss clicked', () => {
      renderError('Error message');

      fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('error display', () => {
    it('shows original error message', () => {
      renderError('Detailed API error: connection refused');

      expect(screen.getByText(/Detailed API error: connection refused/)).toBeInTheDocument();
    });
  });
});
