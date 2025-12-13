import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatePicker } from './DatePicker';
import { createRef } from 'react';

describe('DatePicker', () => {
  describe('rendering', () => {
    it('renders date input', () => {
      render(<DatePicker data-testid="date-picker" />);

      const input = screen.getByTestId('date-picker');
      expect(input).toHaveAttribute('type', 'date');
    });

    it('renders with label', () => {
      render(<DatePicker label="Start Date" />);

      expect(screen.getByText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    });

    it('generates id from label', () => {
      render(<DatePicker label="Start Date" />);

      const input = screen.getByLabelText('Start Date');
      expect(input).toHaveAttribute('id', 'start-date');
    });

    it('uses custom id when provided', () => {
      render(<DatePicker label="Start Date" id="custom-id" />);

      const input = screen.getByLabelText('Start Date');
      expect(input).toHaveAttribute('id', 'custom-id');
    });

    it('renders without label', () => {
      render(<DatePicker data-testid="date-picker" />);

      expect(screen.queryByRole('label')).not.toBeInTheDocument();
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message', () => {
      render(<DatePicker error="Date is required" />);

      expect(screen.getByText('Date is required')).toBeInTheDocument();
    });

    it('applies error styling', () => {
      render(<DatePicker data-testid="date-picker" error="Invalid date" />);

      const input = screen.getByTestId('date-picker');
      expect(input).toHaveClass('border-danger');
    });

    it('does not show error when not provided', () => {
      render(<DatePicker data-testid="date-picker" />);

      const input = screen.getByTestId('date-picker');
      expect(input).not.toHaveClass('border-danger');
    });
  });

  describe('custom className', () => {
    it('merges custom className', () => {
      render(<DatePicker data-testid="date-picker" className="custom-class" />);

      const input = screen.getByTestId('date-picker');
      expect(input).toHaveClass('custom-class');
    });
  });

  describe('disabled state', () => {
    it('can be disabled', () => {
      render(<DatePicker data-testid="date-picker" disabled />);

      const input = screen.getByTestId('date-picker');
      expect(input).toBeDisabled();
    });
  });

  describe('value handling', () => {
    it('accepts value prop', () => {
      render(<DatePicker data-testid="date-picker" value="2024-06-15" readOnly />);

      const input = screen.getByTestId('date-picker') as HTMLInputElement;
      expect(input.value).toBe('2024-06-15');
    });

    it('calls onChange when value changes', () => {
      const handleChange = vi.fn();
      render(<DatePicker data-testid="date-picker" onChange={handleChange} />);

      const input = screen.getByTestId('date-picker');
      fireEvent.change(input, { target: { value: '2024-06-15' } });

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = createRef<HTMLInputElement>();
      render(<DatePicker ref={ref} data-testid="date-picker" />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.type).toBe('date');
    });
  });

  describe('other input props', () => {
    it('passes through additional props', () => {
      render(
        <DatePicker
          data-testid="date-picker"
          name="eventDate"
          required
          min="2024-01-01"
          max="2024-12-31"
        />
      );

      const input = screen.getByTestId('date-picker');
      expect(input).toHaveAttribute('name', 'eventDate');
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('min', '2024-01-01');
      expect(input).toHaveAttribute('max', '2024-12-31');
    });

    it('supports placeholder', () => {
      render(<DatePicker data-testid="date-picker" placeholder="Select date" />);

      const input = screen.getByTestId('date-picker');
      expect(input).toHaveAttribute('placeholder', 'Select date');
    });
  });

  describe('displayName', () => {
    it('has correct displayName', () => {
      expect(DatePicker.displayName).toBe('DatePicker');
    });
  });

  describe('label id generation', () => {
    it('handles multi-word labels', () => {
      render(<DatePicker label="Event Start Date" />);

      const input = screen.getByLabelText('Event Start Date');
      expect(input).toHaveAttribute('id', 'event-start-date');
    });

    it('handles extra spaces in label for id generation', () => {
      render(<DatePicker label="Start   Date" data-testid="date-picker" />);

      // The label text is rendered as-is, but the id collapses multiple spaces
      const input = screen.getByTestId('date-picker');
      expect(input).toHaveAttribute('id', 'start-date');
    });
  });
});
