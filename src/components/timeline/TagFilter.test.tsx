import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagFilter } from './TagFilter';

// Mock cn utility
vi.mock('@/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('TagFilter', () => {
  const mockOnToggleTag = vi.fn();
  const mockOnClearTags = vi.fn();

  const defaultProps = {
    availableTags: ['diet', 'exercise', 'medication', 'sleep'],
    selectedTags: [],
    onToggleTag: mockOnToggleTag,
    onClearTags: mockOnClearTags,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders all available tags', () => {
      render(<TagFilter {...defaultProps} />);

      expect(screen.getByText('diet')).toBeInTheDocument();
      expect(screen.getByText('exercise')).toBeInTheDocument();
      expect(screen.getByText('medication')).toBeInTheDocument();
      expect(screen.getByText('sleep')).toBeInTheDocument();
    });

    it('renders tag icons', () => {
      render(<TagFilter {...defaultProps} />);
      // Each tag has a Tag icon
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBe(4);
    });

    it('renders as buttons', () => {
      render(<TagFilter {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(4);
    });
  });

  describe('loading state', () => {
    it('shows skeleton loaders when loading', () => {
      render(<TagFilter {...defaultProps} isLoading />);

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(3);
    });

    it('does not show tags when loading', () => {
      render(<TagFilter {...defaultProps} isLoading />);

      expect(screen.queryByText('diet')).not.toBeInTheDocument();
      expect(screen.queryByText('exercise')).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty message when no tags available', () => {
      render(
        <TagFilter
          {...defaultProps}
          availableTags={[]}
        />
      );

      expect(screen.getByText(/No tags yet/)).toBeInTheDocument();
    });

    it('provides guidance for adding tags', () => {
      render(
        <TagFilter
          {...defaultProps}
          availableTags={[]}
        />
      );

      expect(screen.getByText(/Add tags to events/)).toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('applies selected styles to selected tags', () => {
      render(
        <TagFilter
          {...defaultProps}
          selectedTags={['diet']}
        />
      );

      const dietButton = screen.getByText('diet').closest('button');
      expect(dietButton?.className).toContain('bg-blue-100');
      expect(dietButton?.className).toContain('text-blue-800');
    });

    it('applies unselected styles to unselected tags', () => {
      render(
        <TagFilter
          {...defaultProps}
          selectedTags={['diet']}
        />
      );

      const exerciseButton = screen.getByText('exercise').closest('button');
      expect(exerciseButton?.className).toContain('bg-gray-100');
      expect(exerciseButton?.className).toContain('text-gray-700');
    });

    it('shows X icon on selected tags', () => {
      render(
        <TagFilter
          {...defaultProps}
          selectedTags={['diet', 'exercise']}
        />
      );

      // Selected tags have additional X icon (Tag icon + X icon)
      const icons = document.querySelectorAll('svg');
      // 4 tags * 1 tag icon = 4, plus 2 selected * 1 X icon = 2, total = 6
      expect(icons.length).toBe(6);
    });

    it('supports multiple selected tags', () => {
      render(
        <TagFilter
          {...defaultProps}
          selectedTags={['diet', 'sleep']}
        />
      );

      const dietButton = screen.getByText('diet').closest('button');
      const sleepButton = screen.getByText('sleep').closest('button');

      expect(dietButton?.className).toContain('bg-blue-100');
      expect(sleepButton?.className).toContain('bg-blue-100');
    });
  });

  describe('onToggleTag', () => {
    it('calls onToggleTag when tag clicked', () => {
      render(<TagFilter {...defaultProps} />);

      fireEvent.click(screen.getByText('diet'));

      expect(mockOnToggleTag).toHaveBeenCalledWith('diet');
    });

    it('calls onToggleTag with correct tag for each click', () => {
      render(<TagFilter {...defaultProps} />);

      fireEvent.click(screen.getByText('exercise'));
      expect(mockOnToggleTag).toHaveBeenCalledWith('exercise');

      fireEvent.click(screen.getByText('sleep'));
      expect(mockOnToggleTag).toHaveBeenCalledWith('sleep');
    });

    it('allows toggling off a selected tag', () => {
      render(
        <TagFilter
          {...defaultProps}
          selectedTags={['diet']}
        />
      );

      fireEvent.click(screen.getByText('diet'));

      expect(mockOnToggleTag).toHaveBeenCalledWith('diet');
    });
  });

  describe('clear button', () => {
    it('does not show clear button when no tags selected', () => {
      render(<TagFilter {...defaultProps} />);

      expect(screen.queryByText('Clear tag filters')).not.toBeInTheDocument();
    });

    it('shows clear button when tags are selected', () => {
      render(
        <TagFilter
          {...defaultProps}
          selectedTags={['diet']}
        />
      );

      expect(screen.getByText('Clear tag filters')).toBeInTheDocument();
    });

    it('calls onClearTags when clear button clicked', () => {
      render(
        <TagFilter
          {...defaultProps}
          selectedTags={['diet', 'exercise']}
        />
      );

      fireEvent.click(screen.getByText('Clear tag filters'));

      expect(mockOnClearTags).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('all tags are focusable buttons', () => {
      render(<TagFilter {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });
});
