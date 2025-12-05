import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageDetailsModal } from './MessageDetailsModal';
import type { ChatMessage } from '@/types/ai';

// Mock Modal component
vi.mock('@/components/common/Modal', () => ({
  Modal: ({ isOpen, onClose, title, children }: any) =>
    isOpen ? (
      <div data-testid="modal" role="dialog">
        <h2>{title}</h2>
        <button onClick={onClose}>Close</button>
        {children}
      </div>
    ) : null,
}));

// Mock MODEL_DISPLAY_NAMES
vi.mock('@/types/ai', async () => {
  const actual = await vi.importActual('@/types/ai');
  return {
    ...actual,
    MODEL_DISPLAY_NAMES: {
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'gemini-1.5-flash': 'Gemini 1.5 Flash',
      'gemini-2.0-flash': 'Gemini 2.0 Flash',
    },
  };
});

describe('MessageDetailsModal', () => {
  const mockOnClose = vi.fn();

  const baseMessage: ChatMessage = {
    id: 'msg-1',
    role: 'assistant',
    content: 'Hello!',
    timestamp: new Date('2024-06-15T10:30:00Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders when isOpen is true', () => {
      render(
        <MessageDetailsModal isOpen={true} onClose={mockOnClose} message={baseMessage} />
      );

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Message Details')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(
        <MessageDetailsModal isOpen={false} onClose={mockOnClose} message={baseMessage} />
      );

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  describe('no metadata', () => {
    it('shows no metadata message when message has no metadata', () => {
      render(
        <MessageDetailsModal isOpen={true} onClose={mockOnClose} message={baseMessage} />
      );

      expect(
        screen.getByText('No detailed metadata available for this message.')
      ).toBeInTheDocument();
    });
  });

  describe('model info', () => {
    it('displays model name', () => {
      const messageWithModel: ChatMessage = {
        ...baseMessage,
        metadata: {
          model: 'gpt-4o',
        },
      };

      render(
        <MessageDetailsModal isOpen={true} onClose={mockOnClose} message={messageWithModel} />
      );

      expect(screen.getByText('Model')).toBeInTheDocument();
      expect(screen.getByText('GPT-4o')).toBeInTheDocument();
    });

    it('displays unknown model as-is', () => {
      const messageWithModel: ChatMessage = {
        ...baseMessage,
        metadata: {
          model: 'unknown-model',
        },
      };

      render(
        <MessageDetailsModal isOpen={true} onClose={mockOnClose} message={messageWithModel} />
      );

      expect(screen.getByText('unknown-model')).toBeInTheDocument();
    });
  });

  describe('token usage', () => {
    it('displays token usage table', () => {
      const messageWithTokens: ChatMessage = {
        ...baseMessage,
        metadata: {
          model: 'gpt-4o',
          tokensUsed: {
            prompt: 150,
            completion: 250,
            total: 400,
          },
        },
      };

      render(
        <MessageDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          message={messageWithTokens}
        />
      );

      expect(screen.getByText('Token Usage')).toBeInTheDocument();
      expect(screen.getByText('Input')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('Output')).toBeInTheDocument();
      expect(screen.getByText('250')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('400')).toBeInTheDocument();
    });

    it('formats large numbers with locale', () => {
      const messageWithLargeTokens: ChatMessage = {
        ...baseMessage,
        metadata: {
          model: 'gpt-4o',
          tokensUsed: {
            prompt: 10000,
            completion: 5000,
            total: 15000,
          },
        },
      };

      render(
        <MessageDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          message={messageWithLargeTokens}
        />
      );

      // Depending on locale, could be 10,000 or 10.000
      expect(screen.getByText(/10.?000/)).toBeInTheDocument();
      expect(screen.getByText(/15.?000/)).toBeInTheDocument();
    });
  });

  describe('parameters', () => {
    it('displays reasoning effort', () => {
      const messageWithParams: ChatMessage = {
        ...baseMessage,
        metadata: {
          model: 'gpt-4o',
          reasoningEffort: 'high',
        },
      };

      render(
        <MessageDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          message={messageWithParams}
        />
      );

      expect(screen.getByText('Parameters')).toBeInTheDocument();
      expect(screen.getByText('reasoning_effort')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('displays thinking level', () => {
      const messageWithParams: ChatMessage = {
        ...baseMessage,
        metadata: {
          model: 'gemini-1.5-flash',
          thinkingLevel: 'low',
        },
      };

      render(
        <MessageDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          message={messageWithParams}
        />
      );

      expect(screen.getByText('thinking_level')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    it('displays elapsed time in milliseconds', () => {
      const messageWithParams: ChatMessage = {
        ...baseMessage,
        metadata: {
          model: 'gpt-4o',
          elapsedMs: 500,
        },
      };

      render(
        <MessageDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          message={messageWithParams}
        />
      );

      expect(screen.getByText('elapsed_time')).toBeInTheDocument();
      expect(screen.getByText('500ms')).toBeInTheDocument();
    });

    it('displays elapsed time in seconds', () => {
      const messageWithParams: ChatMessage = {
        ...baseMessage,
        metadata: {
          model: 'gpt-4o',
          elapsedMs: 5000,
        },
      };

      render(
        <MessageDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          message={messageWithParams}
        />
      );

      expect(screen.getByText('5s')).toBeInTheDocument();
    });

    it('displays elapsed time in minutes and seconds', () => {
      const messageWithParams: ChatMessage = {
        ...baseMessage,
        metadata: {
          model: 'gpt-4o',
          elapsedMs: 90000, // 1 minute 30 seconds
        },
      };

      render(
        <MessageDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          message={messageWithParams}
        />
      );

      expect(screen.getByText('1m 30s')).toBeInTheDocument();
    });
  });

  describe('timestamp', () => {
    it('displays message timestamp', () => {
      render(
        <MessageDetailsModal isOpen={true} onClose={mockOnClose} message={baseMessage} />
      );

      // The timestamp is formatted using toLocaleString
      expect(screen.getByText(/Sent at/)).toBeInTheDocument();
    });
  });

  describe('full metadata', () => {
    it('displays all metadata sections', () => {
      const fullMessage: ChatMessage = {
        ...baseMessage,
        metadata: {
          model: 'gpt-4o',
          tokensUsed: {
            prompt: 100,
            completion: 200,
            total: 300,
          },
          reasoningEffort: 'medium',
          elapsedMs: 2500,
        },
      };

      render(
        <MessageDetailsModal isOpen={true} onClose={mockOnClose} message={fullMessage} />
      );

      // Model section
      expect(screen.getByText('Model')).toBeInTheDocument();
      expect(screen.getByText('GPT-4o')).toBeInTheDocument();

      // Token usage section
      expect(screen.getByText('Token Usage')).toBeInTheDocument();

      // Parameters section
      expect(screen.getByText('Parameters')).toBeInTheDocument();
      expect(screen.getByText('reasoning_effort')).toBeInTheDocument();
      expect(screen.getByText('2s')).toBeInTheDocument();
    });
  });
});
