import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimeRangeFilter } from './TimeRangeFilter';
import type { TimeRange } from '@/lib/insights/dataProcessing';

describe('TimeRangeFilter', () => {
  const defaultProps = {
    value: '6m' as TimeRange,
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders all time range options', () => {
      render(<TimeRangeFilter {...defaultProps} />);

      expect(screen.getByText('3M')).toBeInTheDocument();
      expect(screen.getByText('6M')).toBeInTheDocument();
      expect(screen.getByText('1Y')).toBeInTheDocument();
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('renders 4 buttons', () => {
      render(<TimeRangeFilter {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(4);
    });
  });

  describe('selected state', () => {
    it('highlights 3M when selected', () => {
      render(<TimeRangeFilter {...defaultProps} value="3m" />);

      const button = screen.getByText('3M');
      expect(button).toHaveClass('bg-white', 'text-gray-900', 'shadow-sm');
    });

    it('highlights 6M when selected', () => {
      render(<TimeRangeFilter {...defaultProps} value="6m" />);

      const button = screen.getByText('6M');
      expect(button).toHaveClass('bg-white', 'text-gray-900', 'shadow-sm');
    });

    it('highlights 1Y when selected', () => {
      render(<TimeRangeFilter {...defaultProps} value="1y" />);

      const button = screen.getByText('1Y');
      expect(button).toHaveClass('bg-white', 'text-gray-900', 'shadow-sm');
    });

    it('highlights All when selected', () => {
      render(<TimeRangeFilter {...defaultProps} value="all" />);

      const button = screen.getByText('All');
      expect(button).toHaveClass('bg-white', 'text-gray-900', 'shadow-sm');
    });

    it('does not highlight unselected options', () => {
      render(<TimeRangeFilter {...defaultProps} value="3m" />);

      const sixMonth = screen.getByText('6M');
      expect(sixMonth).not.toHaveClass('bg-white');
      expect(sixMonth).toHaveClass('text-gray-600');
    });
  });

  describe('interaction', () => {
    it('calls onChange with 3m when clicking 3M', () => {
      const onChange = vi.fn();
      render(<TimeRangeFilter {...defaultProps} onChange={onChange} />);

      fireEvent.click(screen.getByText('3M'));

      expect(onChange).toHaveBeenCalledWith('3m');
    });

    it('calls onChange with 6m when clicking 6M', () => {
      const onChange = vi.fn();
      render(<TimeRangeFilter {...defaultProps} onChange={onChange} />);

      fireEvent.click(screen.getByText('6M'));

      expect(onChange).toHaveBeenCalledWith('6m');
    });

    it('calls onChange with 1y when clicking 1Y', () => {
      const onChange = vi.fn();
      render(<TimeRangeFilter {...defaultProps} onChange={onChange} />);

      fireEvent.click(screen.getByText('1Y'));

      expect(onChange).toHaveBeenCalledWith('1y');
    });

    it('calls onChange with all when clicking All', () => {
      const onChange = vi.fn();
      render(<TimeRangeFilter {...defaultProps} onChange={onChange} />);

      fireEvent.click(screen.getByText('All'));

      expect(onChange).toHaveBeenCalledWith('all');
    });

    it('allows clicking the currently selected option', () => {
      const onChange = vi.fn();
      render(<TimeRangeFilter {...defaultProps} value="6m" onChange={onChange} />);

      fireEvent.click(screen.getByText('6M'));

      expect(onChange).toHaveBeenCalledWith('6m');
    });
  });

  describe('styling', () => {
    it('renders with container border', () => {
      const { container } = render(<TimeRangeFilter {...defaultProps} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('border', 'border-gray-200');
    });

    it('renders buttons with rounded-md', () => {
      render(<TimeRangeFilter {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('rounded-md');
      });
    });
  });
});
