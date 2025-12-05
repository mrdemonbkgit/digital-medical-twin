import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from './ChatInput';

// Mock Button
vi.mock('@/components/common/Button', () => ({
  Button: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

describe('ChatInput', () => {
  const mockOnSend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders textarea', () => {
      render(<ChatInput onSend={mockOnSend} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders send button', () => {
      render(<ChatInput onSend={mockOnSend} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('displays default placeholder', () => {
      render(<ChatInput onSend={mockOnSend} />);
      expect(screen.getByPlaceholderText('Ask about your health history...')).toBeInTheDocument();
    });

    it('displays custom placeholder', () => {
      render(<ChatInput onSend={mockOnSend} placeholder="Custom placeholder" />);
      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });

    it('disables textarea when disabled prop is true', () => {
      render(<ChatInput onSend={mockOnSend} disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('disables send button when disabled prop is true', () => {
      render(<ChatInput onSend={mockOnSend} disabled />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('disables send button when textarea is empty', () => {
      render(<ChatInput onSend={mockOnSend} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('typing', () => {
    it('updates value when typing', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello');

      expect(textarea).toHaveValue('Hello');
    });

    it('enables send button when there is text', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello');

      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('keeps button disabled with only whitespace', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '   ');

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('sending messages', () => {
    it('calls onSend with trimmed message when button clicked', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, '  Hello World  ');
      await user.click(screen.getByRole('button'));

      expect(mockOnSend).toHaveBeenCalledWith('Hello World');
    });

    it('clears input after sending', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello');
      await user.click(screen.getByRole('button'));

      expect(textarea).toHaveValue('');
    });

    it('sends message on Enter key', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello{Enter}');

      expect(mockOnSend).toHaveBeenCalledWith('Hello');
    });

    it('does not send on Shift+Enter', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello{Shift>}{Enter}{/Shift}');

      expect(mockOnSend).not.toHaveBeenCalled();
      // Value should still contain the text (with newline from shift+enter)
      expect(textarea).toHaveValue('Hello\n');
    });

    it('does not send empty message on Enter', async () => {
      render(<ChatInput onSend={mockOnSend} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter' });

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('does not send when disabled', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} disabled />);

      const textarea = screen.getByRole('textbox');
      // Can't type when disabled, but test the logic anyway
      fireEvent.change(textarea, { target: { value: 'Hello' } });
      fireEvent.keyDown(textarea, { key: 'Enter' });

      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  describe('auto-resize', () => {
    it('starts with a single row', () => {
      render(<ChatInput onSend={mockOnSend} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '1');
    });
  });
});
