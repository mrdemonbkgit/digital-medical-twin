import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchInput } from './SearchInput';

// Mock cn utility
vi.mock('@/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('SearchInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders input with placeholder', () => {
      render(<SearchInput value="" onChange={mockOnChange} />);
      expect(screen.getByPlaceholderText('Search events...')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(<SearchInput value="" onChange={mockOnChange} placeholder="Find something..." />);
      expect(screen.getByPlaceholderText('Find something...')).toBeInTheDocument();
    });

    it('renders search icon', () => {
      render(<SearchInput value="" onChange={mockOnChange} />);
      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders input with current value', () => {
      render(<SearchInput value="test query" onChange={mockOnChange} />);
      expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
    });

    it('has accessible label', () => {
      render(<SearchInput value="" onChange={mockOnChange} />);
      expect(screen.getByRole('textbox', { name: 'Search events' })).toBeInTheDocument();
    });
  });

  describe('clear button', () => {
    it('does not show clear button when value is empty', () => {
      render(<SearchInput value="" onChange={mockOnChange} />);
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });

    it('shows clear button when value is not empty', () => {
      render(<SearchInput value="test" onChange={mockOnChange} />);
      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('calls onChange with empty string when clear clicked', () => {
      render(<SearchInput value="test" onChange={mockOnChange} />);
      fireEvent.click(screen.getByLabelText('Clear search'));
      expect(mockOnChange).toHaveBeenCalledWith('');
    });
  });

  describe('onChange', () => {
    it('calls onChange when typing', () => {
      render(<SearchInput value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'new search' } });
      expect(mockOnChange).toHaveBeenCalledWith('new search');
    });

    it('calls onChange with updated value', () => {
      render(<SearchInput value="existing" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'existing more' } });
      expect(mockOnChange).toHaveBeenCalledWith('existing more');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <SearchInput value="" onChange={mockOnChange} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
