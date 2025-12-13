import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextArea } from './TextArea';

// Mock cn utility
vi.mock('@/utils/cn', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('TextArea', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders a textarea element', () => {
      render(<TextArea />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with default rows', () => {
      render(<TextArea />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '3');
    });

    it('renders with custom rows', () => {
      render(<TextArea rows={5} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5');
    });
  });

  describe('label', () => {
    it('renders label when provided', () => {
      render(<TextArea label="Description" />);
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('associates label with textarea via id', () => {
      render(<TextArea label="My TextArea" />);

      const textarea = screen.getByRole('textbox');
      const label = screen.getByText('My TextArea');

      expect(textarea).toHaveAttribute('id', 'my-textarea');
      expect(label).toHaveAttribute('for', 'my-textarea');
    });

    it('uses custom id when provided', () => {
      render(<TextArea label="Label" id="custom-id" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'custom-id');
    });

    it('has proper label styling', () => {
      render(<TextArea label="Label" />);
      const label = screen.getByText('Label');
      expect(label).toHaveClass('text-sm', 'font-medium', 'text-theme-secondary');
    });
  });

  describe('placeholder', () => {
    it('renders placeholder text', () => {
      render(<TextArea placeholder="Enter description..." />);
      expect(screen.getByPlaceholderText('Enter description...')).toBeInTheDocument();
    });
  });

  describe('value handling', () => {
    it('displays value', () => {
      render(<TextArea value="Test content" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('Test content');
    });

    it('calls onChange when typing', () => {
      const mockOnChange = vi.fn();
      render(<TextArea onChange={mockOnChange} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New text' } });

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('updates value on change', () => {
      const { rerender } = render(<TextArea value="" onChange={() => {}} />);

      rerender(<TextArea value="Updated" onChange={() => {}} />);

      expect(screen.getByRole('textbox')).toHaveValue('Updated');
    });
  });

  describe('error state', () => {
    it('shows error message when error prop provided', () => {
      render(<TextArea error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('applies error styling to textarea', () => {
      render(<TextArea error="Error" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.className).toContain('border-danger');
    });

    it('error message has danger text', () => {
      render(<TextArea error="Error message" />);
      const error = screen.getByText('Error message');
      expect(error).toHaveClass('text-danger');
    });

    it('has error focus styles', () => {
      render(<TextArea error="Error" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.className).toContain('focus:border-danger');
      expect(textarea.className).toContain('focus:ring-danger');
    });
  });

  describe('disabled state', () => {
    it('can be disabled', () => {
      render(<TextArea disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('applies disabled styling', () => {
      render(<TextArea disabled />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.className).toContain('disabled:opacity-50');
    });
  });

  describe('styling', () => {
    it('has full width', () => {
      render(<TextArea />);
      expect(screen.getByRole('textbox')).toHaveClass('w-full');
    });

    it('has rounded border', () => {
      render(<TextArea />);
      expect(screen.getByRole('textbox')).toHaveClass('rounded-lg');
    });

    it('has border styling', () => {
      render(<TextArea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('border');
    });

    it('has input-theme class for focus styles', () => {
      render(<TextArea />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.className).toContain('input-theme');
    });

    it('has padding', () => {
      render(<TextArea />);
      expect(screen.getByRole('textbox')).toHaveClass('px-3', 'py-2.5');
    });

    it('is resizable vertically', () => {
      render(<TextArea />);
      expect(screen.getByRole('textbox')).toHaveClass('resize-y');
    });

    it('has placeholder styling', () => {
      render(<TextArea />);
      expect(screen.getByRole('textbox')).toHaveClass('input-theme');
    });

    it('applies custom className', () => {
      render(<TextArea className="custom-class" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-class');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to textarea element', () => {
      const ref = vi.fn();
      render(<TextArea ref={ref} />);
      expect(ref).toHaveBeenCalled();
    });

    it('can access textarea via ref', () => {
      const ref = { current: null as HTMLTextAreaElement | null };
      render(<TextArea ref={(el) => { ref.current = el; }} />);
      expect(ref.current?.tagName).toBe('TEXTAREA');
    });
  });

  describe('additional props', () => {
    it('passes through name prop', () => {
      render(<TextArea name="description" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'description');
    });

    it('passes through required prop', () => {
      render(<TextArea required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('passes through maxLength prop', () => {
      render(<TextArea maxLength={500} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '500');
    });

    it('passes through readOnly prop', () => {
      render(<TextArea readOnly />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });
  });

  describe('accessibility', () => {
    it('has accessible name when label provided', () => {
      render(<TextArea label="Notes" />);
      expect(screen.getByRole('textbox', { name: 'Notes' })).toBeInTheDocument();
    });

    it('can have aria-label', () => {
      render(<TextArea aria-label="Enter notes" />);
      expect(screen.getByRole('textbox', { name: 'Enter notes' })).toBeInTheDocument();
    });

    it('can have aria-describedby for error', () => {
      render(<TextArea aria-describedby="error-id" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'error-id');
    });
  });
});
