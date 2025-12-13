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

  describe('regenerate functionality', () => {
    const mockOnRegenerate = vi.fn();

    beforeEach(() => {
      mockOnRegenerate.mockClear();
    });

    it('shows regenerate button for assistant messages', () => {
      render(
        <MessageActionsMenu
          message={mockMessage}
          onShowDetails={mockOnShowDetails}
          onRegenerate={mockOnRegenerate}
        />
      );

      fireEvent.click(screen.getByLabelText('Message actions'));
      expect(screen.getByText('Regenerate')).toBeInTheDocument();
    });

    it('does not show regenerate button for user messages', () => {
      const userMessage: ChatMessage = {
        id: 'msg-2',
        role: 'user',
        content: 'User question',
        timestamp: '2024-01-01T10:00:00Z',
      };

      render(
        <MessageActionsMenu
          message={userMessage}
          onShowDetails={mockOnShowDetails}
          onRegenerate={mockOnRegenerate}
        />
      );

      fireEvent.click(screen.getByLabelText('Message actions'));
      expect(screen.queryByText('Regenerate')).not.toBeInTheDocument();
    });

    it('does not show regenerate button when onRegenerate not provided', () => {
      render(
        <MessageActionsMenu
          message={mockMessage}
          onShowDetails={mockOnShowDetails}
        />
      );

      fireEvent.click(screen.getByLabelText('Message actions'));
      expect(screen.queryByText('Regenerate')).not.toBeInTheDocument();
    });

    it('calls onRegenerate when clicked', () => {
      render(
        <MessageActionsMenu
          message={mockMessage}
          onShowDetails={mockOnShowDetails}
          onRegenerate={mockOnRegenerate}
        />
      );

      fireEvent.click(screen.getByLabelText('Message actions'));
      fireEvent.click(screen.getByText('Regenerate'));

      expect(mockOnRegenerate).toHaveBeenCalledTimes(1);
    });

    it('closes menu when regenerate clicked', () => {
      render(
        <MessageActionsMenu
          message={mockMessage}
          onShowDetails={mockOnShowDetails}
          onRegenerate={mockOnRegenerate}
        />
      );

      fireEvent.click(screen.getByLabelText('Message actions'));
      fireEvent.click(screen.getByText('Regenerate'));

      expect(screen.queryByText('Regenerate')).not.toBeInTheDocument();
    });

    it('disables regenerate button when isLoading', () => {
      render(
        <MessageActionsMenu
          message={mockMessage}
          onShowDetails={mockOnShowDetails}
          onRegenerate={mockOnRegenerate}
          isLoading={true}
        />
      );

      fireEvent.click(screen.getByLabelText('Message actions'));
      expect(screen.getByText('Regenerating...')).toBeInTheDocument();
      expect(screen.getByText('Regenerating...').closest('button')).toBeDisabled();
    });

    it('does not call onRegenerate when disabled', () => {
      render(
        <MessageActionsMenu
          message={mockMessage}
          onShowDetails={mockOnShowDetails}
          onRegenerate={mockOnRegenerate}
          isLoading={true}
        />
      );

      fireEvent.click(screen.getByLabelText('Message actions'));
      fireEvent.click(screen.getByText('Regenerating...'));

      expect(mockOnRegenerate).not.toHaveBeenCalled();
    });
  });

  describe('edit functionality', () => {
    const mockOnEdit = vi.fn();
    const userMessage: ChatMessage = {
      id: 'msg-user',
      role: 'user',
      content: 'User question',
      timestamp: '2024-01-01T10:00:00Z',
    };

    beforeEach(() => {
      mockOnEdit.mockClear();
    });

    it('shows edit button for user messages', () => {
      render(
        <MessageActionsMenu
          message={userMessage}
          onShowDetails={mockOnShowDetails}
          onEdit={mockOnEdit}
        />
      );

      fireEvent.click(screen.getByLabelText('Message actions'));
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('does not show edit button for assistant messages', () => {
      render(
        <MessageActionsMenu
          message={mockMessage}
          onShowDetails={mockOnShowDetails}
          onEdit={mockOnEdit}
        />
      );

      fireEvent.click(screen.getByLabelText('Message actions'));
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('does not show edit button when onEdit not provided', () => {
      render(
        <MessageActionsMenu
          message={userMessage}
          onShowDetails={mockOnShowDetails}
        />
      );

      fireEvent.click(screen.getByLabelText('Message actions'));
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('calls onEdit when clicked', () => {
      render(
        <MessageActionsMenu
          message={userMessage}
          onShowDetails={mockOnShowDetails}
          onEdit={mockOnEdit}
        />
      );

      fireEvent.click(screen.getByLabelText('Message actions'));
      fireEvent.click(screen.getByText('Edit'));

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('closes menu when edit clicked', () => {
      render(
        <MessageActionsMenu
          message={userMessage}
          onShowDetails={mockOnShowDetails}
          onEdit={mockOnEdit}
        />
      );

      fireEvent.click(screen.getByLabelText('Message actions'));
      fireEvent.click(screen.getByText('Edit'));

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('disables edit button when isLoading', () => {
      render(
        <MessageActionsMenu
          message={userMessage}
          onShowDetails={mockOnShowDetails}
          onEdit={mockOnEdit}
          isLoading={true}
        />
      );

      fireEvent.click(screen.getByLabelText('Message actions'));
      expect(screen.getByText('Edit').closest('button')).toBeDisabled();
    });
  });

  describe('delete functionality', () => {
    const mockOnDelete = vi.fn();
    const userMessage: ChatMessage = {
      id: 'msg-user',
      role: 'user',
      content: 'User question',
      timestamp: '2024-01-01T10:00:00Z',
    };

    beforeEach(() => {
      mockOnDelete.mockClear();
    });

    it('shows delete button for user messages', () => {
      render(
        <MessageActionsMenu
          message={userMessage}
          onShowDetails={mockOnShowDetails}
          onDelete={mockOnDelete}
        />
      );

      fireEvent.click(screen.getByLabelText('Message actions'));
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('does not show delete button for assistant messages', () => {
      render(
        <MessageActionsMenu
          message={mockMessage}
          onShowDetails={mockOnShowDetails}
          onDelete={mockOnDelete}
        />
      );

      fireEvent.click(screen.getByLabelText('Message actions'));
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('does not show delete button when onDelete not provided', () => {
      render(
        <MessageActionsMenu
          message={userMessage}
          onShowDetails={mockOnShowDetails}
        />
      );

      fireEvent.click(screen.getByLabelText('Message actions'));
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('calls onDelete when clicked', () => {
      render(
        <MessageActionsMenu
          message={userMessage}
          onShowDetails={mockOnShowDetails}
          onDelete={mockOnDelete}
        />
      );

      fireEvent.click(screen.getByLabelText('Message actions'));
      fireEvent.click(screen.getByText('Delete'));

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('closes menu when delete clicked', () => {
      render(
        <MessageActionsMenu
          message={userMessage}
          onShowDetails={mockOnShowDetails}
          onDelete={mockOnDelete}
        />
      );

      fireEvent.click(screen.getByLabelText('Message actions'));
      fireEvent.click(screen.getByText('Delete'));

      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('disables delete button when isLoading', () => {
      render(
        <MessageActionsMenu
          message={userMessage}
          onShowDetails={mockOnShowDetails}
          onDelete={mockOnDelete}
          isLoading={true}
        />
      );

      fireEvent.click(screen.getByLabelText('Message actions'));
      expect(screen.getByText('Delete').closest('button')).toBeDisabled();
    });
  });
});
