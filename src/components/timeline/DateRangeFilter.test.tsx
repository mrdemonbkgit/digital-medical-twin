import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateRangeFilter } from './DateRangeFilter';

// Mock cn utility
vi.mock('@/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('DateRangeFilter', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date to have consistent tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders quick preset buttons', () => {
      render(<DateRangeFilter onChange={mockOnChange} />);

      expect(screen.getByText('Quick:')).toBeInTheDocument();
      expect(screen.getByText('7 days')).toBeInTheDocument();
      expect(screen.getByText('30 days')).toBeInTheDocument();
      expect(screen.getByText('90 days')).toBeInTheDocument();
      expect(screen.getByText('1 year')).toBeInTheDocument();
    });

    it('renders date inputs', () => {
      render(<DateRangeFilter onChange={mockOnChange} />);

      expect(screen.getByText('From:')).toBeInTheDocument();
      expect(screen.getByText('To:')).toBeInTheDocument();
    });

    it('renders calendar icon', () => {
      render(<DateRangeFilter onChange={mockOnChange} />);
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('shows current date values in inputs', () => {
      render(
        <DateRangeFilter
          startDate="2024-01-01"
          endDate="2024-06-15"
          onChange={mockOnChange}
        />
      );

      const dateInputs = document.querySelectorAll('input[type="date"]') as NodeListOf<HTMLInputElement>;
      expect(dateInputs[0].value).toBe('2024-01-01');
      expect(dateInputs[1].value).toBe('2024-06-15');
    });
  });

  describe('preset buttons', () => {
    it('calls onChange with 7 days ago and today', () => {
      render(<DateRangeFilter onChange={mockOnChange} />);

      fireEvent.click(screen.getByText('7 days'));

      expect(mockOnChange).toHaveBeenCalledWith('2024-06-08', '2024-06-15');
    });

    it('calls onChange with 30 days ago and today', () => {
      render(<DateRangeFilter onChange={mockOnChange} />);

      fireEvent.click(screen.getByText('30 days'));

      expect(mockOnChange).toHaveBeenCalledWith('2024-05-16', '2024-06-15');
    });

    it('calls onChange with 90 days ago and today', () => {
      render(<DateRangeFilter onChange={mockOnChange} />);

      fireEvent.click(screen.getByText('90 days'));

      expect(mockOnChange).toHaveBeenCalledWith('2024-03-17', '2024-06-15');
    });

    it('calls onChange with 1 year ago and today', () => {
      render(<DateRangeFilter onChange={mockOnChange} />);

      fireEvent.click(screen.getByText('1 year'));

      expect(mockOnChange).toHaveBeenCalledWith('2023-06-16', '2024-06-15');
    });
  });

  describe('clear button', () => {
    it('does not show clear button when no dates set', () => {
      render(<DateRangeFilter onChange={mockOnChange} />);

      expect(screen.queryByLabelText('Clear date filter')).not.toBeInTheDocument();
    });

    it('shows clear button when startDate set', () => {
      render(
        <DateRangeFilter startDate="2024-01-01" onChange={mockOnChange} />
      );

      expect(screen.getByLabelText('Clear date filter')).toBeInTheDocument();
    });

    it('shows clear button when endDate set', () => {
      render(
        <DateRangeFilter endDate="2024-06-15" onChange={mockOnChange} />
      );

      expect(screen.getByLabelText('Clear date filter')).toBeInTheDocument();
    });

    it('calls onChange with undefined values when clear clicked', () => {
      render(
        <DateRangeFilter
          startDate="2024-01-01"
          endDate="2024-06-15"
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByLabelText('Clear date filter'));

      expect(mockOnChange).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe('date input changes', () => {
    it('calls onChange when start date changed', () => {
      render(
        <DateRangeFilter
          endDate="2024-06-15"
          onChange={mockOnChange}
        />
      );

      const dateInputs = document.querySelectorAll('input[type="date"]');
      fireEvent.change(dateInputs[0], { target: { value: '2024-03-01' } });

      expect(mockOnChange).toHaveBeenCalledWith('2024-03-01', '2024-06-15');
    });

    it('calls onChange when end date changed', () => {
      render(
        <DateRangeFilter
          startDate="2024-01-01"
          onChange={mockOnChange}
        />
      );

      const dateInputs = document.querySelectorAll('input[type="date"]');
      fireEvent.change(dateInputs[1], { target: { value: '2024-04-30' } });

      expect(mockOnChange).toHaveBeenCalledWith('2024-01-01', '2024-04-30');
    });

    it('clears start date when emptied', () => {
      render(
        <DateRangeFilter
          startDate="2024-01-01"
          endDate="2024-06-15"
          onChange={mockOnChange}
        />
      );

      const dateInputs = document.querySelectorAll('input[type="date"]');
      fireEvent.change(dateInputs[0], { target: { value: '' } });

      expect(mockOnChange).toHaveBeenCalledWith(undefined, '2024-06-15');
    });

    it('clears end date when emptied', () => {
      render(
        <DateRangeFilter
          startDate="2024-01-01"
          endDate="2024-06-15"
          onChange={mockOnChange}
        />
      );

      const dateInputs = document.querySelectorAll('input[type="date"]');
      fireEvent.change(dateInputs[1], { target: { value: '' } });

      expect(mockOnChange).toHaveBeenCalledWith('2024-01-01', undefined);
    });
  });

  describe('date constraints', () => {
    it('sets max on start date input to end date', () => {
      render(
        <DateRangeFilter
          startDate="2024-01-01"
          endDate="2024-03-15"
          onChange={mockOnChange}
        />
      );

      const dateInputs = document.querySelectorAll('input[type="date"]');
      expect(dateInputs[0]).toHaveAttribute('max', '2024-03-15');
    });

    it('sets min on end date input to start date', () => {
      render(
        <DateRangeFilter
          startDate="2024-01-01"
          endDate="2024-03-15"
          onChange={mockOnChange}
        />
      );

      const dateInputs = document.querySelectorAll('input[type="date"]');
      expect(dateInputs[1]).toHaveAttribute('min', '2024-01-01');
    });

    it('sets max on end date to today', () => {
      render(<DateRangeFilter onChange={mockOnChange} />);

      const dateInputs = document.querySelectorAll('input[type="date"]');
      expect(dateInputs[1]).toHaveAttribute('max', '2024-06-15');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <DateRangeFilter onChange={mockOnChange} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
