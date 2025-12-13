import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from './Select';
import type { SelectOption } from './Select';

// Mock cn utility
vi.mock('@/utils/cn', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('Select', () => {
  const mockOptions: SelectOption[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders a select element', () => {
      render(<Select options={mockOptions} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders all options', () => {
      render(<Select options={mockOptions} />);

      expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument();
    });

    it('renders options with correct values', () => {
      render(<Select options={mockOptions} />);

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveValue('option1');
      expect(options[1]).toHaveValue('option2');
      expect(options[2]).toHaveValue('option3');
    });
  });

  describe('label', () => {
    it('renders label when provided', () => {
      render(<Select options={mockOptions} label="Choose an option" />);
      expect(screen.getByText('Choose an option')).toBeInTheDocument();
    });

    it('associates label with select via id', () => {
      render(<Select options={mockOptions} label="My Select" />);

      const select = screen.getByRole('combobox');
      const label = screen.getByText('My Select');

      expect(select).toHaveAttribute('id', 'my-select');
      expect(label).toHaveAttribute('for', 'my-select');
    });

    it('uses custom id when provided', () => {
      render(<Select options={mockOptions} label="Label" id="custom-id" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('id', 'custom-id');
    });

    it('has proper label styling', () => {
      render(<Select options={mockOptions} label="Label" />);
      const label = screen.getByText('Label');
      expect(label).toHaveClass('text-sm', 'font-medium', 'text-theme-secondary');
    });
  });

  describe('placeholder', () => {
    it('renders placeholder option when provided', () => {
      render(<Select options={mockOptions} placeholder="Select..." />);
      expect(screen.getByRole('option', { name: 'Select...' })).toBeInTheDocument();
    });

    it('placeholder option is disabled', () => {
      render(<Select options={mockOptions} placeholder="Select..." />);
      const placeholder = screen.getByRole('option', { name: 'Select...' });
      expect(placeholder).toBeDisabled();
    });

    it('placeholder has empty value', () => {
      render(<Select options={mockOptions} placeholder="Select..." />);
      const placeholder = screen.getByRole('option', { name: 'Select...' });
      expect(placeholder).toHaveValue('');
    });
  });

  describe('error state', () => {
    it('shows error message when error prop provided', () => {
      render(<Select options={mockOptions} error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('applies error styling to select', () => {
      render(<Select options={mockOptions} error="Error" />);
      const select = screen.getByRole('combobox');
      expect(select.className).toContain('border-danger');
    });

    it('error message has danger text', () => {
      render(<Select options={mockOptions} error="Error message" />);
      const error = screen.getByText('Error message');
      expect(error).toHaveClass('text-danger');
    });
  });

  describe('onChange', () => {
    it('calls onChange when option selected', () => {
      const mockOnChange = vi.fn();
      render(<Select options={mockOptions} onChange={mockOnChange} />);

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'option2' } });

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('can select different options', () => {
      render(<Select options={mockOptions} />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;

      fireEvent.change(select, { target: { value: 'option3' } });
      expect(select.value).toBe('option3');
    });
  });

  describe('value prop', () => {
    it('sets initial value', () => {
      render(<Select options={mockOptions} value="option2" onChange={() => {}} />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('option2');
    });

    it('updates when value prop changes', () => {
      const { rerender } = render(
        <Select options={mockOptions} value="option1" onChange={() => {}} />
      );

      rerender(<Select options={mockOptions} value="option3" onChange={() => {}} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('option3');
    });
  });

  describe('disabled state', () => {
    it('can be disabled', () => {
      render(<Select options={mockOptions} disabled />);
      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('applies disabled styling', () => {
      render(<Select options={mockOptions} disabled />);
      const select = screen.getByRole('combobox');
      expect(select.className).toContain('disabled:opacity-50');
    });
  });

  describe('styling', () => {
    it('has full width', () => {
      render(<Select options={mockOptions} />);
      expect(screen.getByRole('combobox')).toHaveClass('w-full');
    });

    it('has rounded border', () => {
      render(<Select options={mockOptions} />);
      expect(screen.getByRole('combobox')).toHaveClass('rounded-lg');
    });

    it('has input-theme class for focus styles', () => {
      render(<Select options={mockOptions} />);
      const select = screen.getByRole('combobox');
      expect(select.className).toContain('input-theme');
    });

    it('has minimum height for touch', () => {
      render(<Select options={mockOptions} />);
      expect(screen.getByRole('combobox')).toHaveClass('min-h-[44px]');
    });

    it('applies custom className', () => {
      render(<Select options={mockOptions} className="custom-class" />);
      expect(screen.getByRole('combobox')).toHaveClass('custom-class');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to select element', () => {
      const ref = vi.fn();
      render(<Select options={mockOptions} ref={ref} />);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('additional props', () => {
    it('passes through name prop', () => {
      render(<Select options={mockOptions} name="mySelect" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('name', 'mySelect');
    });

    it('passes through required prop', () => {
      render(<Select options={mockOptions} required />);
      expect(screen.getByRole('combobox')).toBeRequired();
    });
  });
});
