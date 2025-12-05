import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MessageActionsMenu } from './MessageActionsMenu';
import type { ChatMessage } from '@/types/ai';

describe('MessageActionsMenu', () => {
  const mockOnShowDetails = vi.fn();
  const mockMessage: ChatMessage = {
    id: 'msg-1',
    role: 'assistant',
    content: 'This is a test message',
    timestamp: '2024-01-01T10:00:00Z',
  };

  // Store original clipboard
  const originalClipboard = navigator.clipboard;
  const mockWriteText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText.mockReset();
    mockWriteText.mockResolvedValue(undefined);
    // Mock clipboard for tests that need it
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    });
  });

  describe('rendering', () => {
    it('renders trigger button', () => {
      render(<MessageActionsMenu message={mockMessage} onShowDetails={mockOnShowDetails} />);
      expect(screen.getByLabelText('Message actions')).toBeInTheDocument();
    });

    it('menu is hidden by default', () => {
      render(<MessageActionsMenu message={mockMessage} onShowDetails={mockOnShowDetails} />);
      expect(screen.queryByText('Copy message')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <MessageActionsMenu message={mockMessage} onShowDetails={mockOnShowDetails} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('menu toggle', () => {
    it('opens menu when trigger clicked', async () => {
      render(<MessageActionsMenu message={mockMessage} onShowDetails={mockOnShowDetails} />);

      fireEvent.click(screen.getByLabelText('Message actions'));

      expect(screen.getByText('Copy message')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('closes menu when trigger clicked again', async () => {
      render(<MessageActionsMenu message={mockMessage} onShowDetails={mockOnShowDetails} />);

      fireEvent.click(screen.getByLabelText('Message actions'));
      fireEvent.click(screen.getByLabelText('Message actions'));

      expect(screen.queryByText('Copy message')).not.toBeInTheDocument();
    });

    it('sets aria-expanded correctly', async () => {
      render(<MessageActionsMenu message={mockMessage} onShowDetails={mockOnShowDetails} />);

      const trigger = screen.getByLabelText('Message actions');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes menu when clicking outside', async () => {
      render(
        <div>
          <MessageActionsMenu message={mockMessage} onShowDetails={mockOnShowDetails} />
          <div data-testid="outside">Outside</div>
        </div>
      );

      fireEvent.click(screen.getByLabelText('Message actions'));
      expect(screen.getByText('Copy message')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId('outside'));
      expect(screen.queryByText('Copy message')).not.toBeInTheDocument();
    });
  });

  describe('copy functionality', () => {
    it('copies message content when copy clicked', async () => {
      render(<MessageActionsMenu message={mockMessage} onShowDetails={mockOnShowDetails} />);

      fireEvent.click(screen.getByLabelText('Message actions'));
      fireEvent.click(screen.getByText('Copy message'));

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('This is a test message');
      });
    });

    it('shows "Copied!" feedback', async () => {
      render(<MessageActionsMenu message={mockMessage} onShowDetails={mockOnShowDetails} />);

      fireEvent.click(screen.getByLabelText('Message actions'));
      fireEvent.click(screen.getByText('Copy message'));

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('handles copy error gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockWriteText.mockRejectedValueOnce(new Error('Copy failed'));

      render(<MessageActionsMenu message={mockMessage} onShowDetails={mockOnShowDetails} />);

      fireEvent.click(screen.getByLabelText('Message actions'));
      fireEvent.click(screen.getByText('Copy message'));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('details functionality', () => {
    it('calls onShowDetails when details clicked', async () => {
      render(<MessageActionsMenu message={mockMessage} onShowDetails={mockOnShowDetails} />);

      fireEvent.click(screen.getByLabelText('Message actions'));
      fireEvent.click(screen.getByText('Details'));

      expect(mockOnShowDetails).toHaveBeenCalled();
    });

    it('closes menu when details clicked', async () => {
      render(<MessageActionsMenu message={mockMessage} onShowDetails={mockOnShowDetails} />);

      fireEvent.click(screen.getByLabelText('Message actions'));
      fireEvent.click(screen.getByText('Details'));

      expect(screen.queryByText('Details')).not.toBeInTheDocument();
    });
  });
});
