import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventTypeFilterChips } from './EventTypeFilterChips';
import type { EventType } from '@/types';

// Mock cn utility
vi.mock('@/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('EventTypeFilterChips', () => {
  const mockOnToggle = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders all 5 event type chips', () => {
      render(
        <EventTypeFilterChips
          selectedTypes={[]}
          onToggle={mockOnToggle}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('Labs')).toBeInTheDocument();
      expect(screen.getByText('Visits')).toBeInTheDocument();
      expect(screen.getByText('Meds')).toBeInTheDocument();
      expect(screen.getByText('Interventions')).toBeInTheDocument();
      expect(screen.getByText('Metrics')).toBeInTheDocument();
    });

    it('renders icons for each chip', () => {
      render(
        <EventTypeFilterChips
          selectedTypes={[]}
          onToggle={mockOnToggle}
          onClear={mockOnClear}
        />
      );

      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBe(5); // 5 event type icons
    });

    it('applies aria-pressed for accessibility', () => {
      render(
        <EventTypeFilterChips
          selectedTypes={['lab_result']}
          onToggle={mockOnToggle}
          onClear={mockOnClear}
        />
      );

      const labButton = screen.getByText('Labs').closest('button');
      const visitsButton = screen.getByText('Visits').closest('button');

      expect(labButton).toHaveAttribute('aria-pressed', 'true');
      expect(visitsButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('selection', () => {
    it('applies active classes to selected types', () => {
      render(
        <EventTypeFilterChips
          selectedTypes={['lab_result']}
          onToggle={mockOnToggle}
          onClear={mockOnClear}
        />
      );

      const labButton = screen.getByText('Labs').closest('button');
      expect(labButton?.className).toContain('bg-event-lab');
      expect(labButton?.className).toContain('text-event-lab');
    });

    it('applies inactive classes to unselected types', () => {
      render(
        <EventTypeFilterChips
          selectedTypes={[]}
          onToggle={mockOnToggle}
          onClear={mockOnClear}
        />
      );

      const labButton = screen.getByText('Labs').closest('button');
      expect(labButton?.className).toContain('bg-theme-secondary');
      expect(labButton?.className).toContain('text-theme-secondary');
    });

    it('supports multiple selections', () => {
      render(
        <EventTypeFilterChips
          selectedTypes={['lab_result', 'medication', 'metric']}
          onToggle={mockOnToggle}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('Labs').closest('button')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('Meds').closest('button')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('Metrics').closest('button')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('Visits').closest('button')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('onToggle', () => {
    it('calls onToggle with lab_result when Labs clicked', () => {
      render(
        <EventTypeFilterChips
          selectedTypes={[]}
          onToggle={mockOnToggle}
          onClear={mockOnClear}
        />
      );

      fireEvent.click(screen.getByText('Labs'));
      expect(mockOnToggle).toHaveBeenCalledWith('lab_result');
    });

    it('calls onToggle with doctor_visit when Visits clicked', () => {
      render(
        <EventTypeFilterChips
          selectedTypes={[]}
          onToggle={mockOnToggle}
          onClear={mockOnClear}
        />
      );

      fireEvent.click(screen.getByText('Visits'));
      expect(mockOnToggle).toHaveBeenCalledWith('doctor_visit');
    });

    it('calls onToggle with medication when Meds clicked', () => {
      render(
        <EventTypeFilterChips
          selectedTypes={[]}
          onToggle={mockOnToggle}
          onClear={mockOnClear}
        />
      );

      fireEvent.click(screen.getByText('Meds'));
      expect(mockOnToggle).toHaveBeenCalledWith('medication');
    });

    it('calls onToggle with intervention when Interventions clicked', () => {
      render(
        <EventTypeFilterChips
          selectedTypes={[]}
          onToggle={mockOnToggle}
          onClear={mockOnClear}
        />
      );

      fireEvent.click(screen.getByText('Interventions'));
      expect(mockOnToggle).toHaveBeenCalledWith('intervention');
    });

    it('calls onToggle with metric when Metrics clicked', () => {
      render(
        <EventTypeFilterChips
          selectedTypes={[]}
          onToggle={mockOnToggle}
          onClear={mockOnClear}
        />
      );

      fireEvent.click(screen.getByText('Metrics'));
      expect(mockOnToggle).toHaveBeenCalledWith('metric');
    });
  });

  describe('clear button', () => {
    it('does not show clear button when no selection', () => {
      render(
        <EventTypeFilterChips
          selectedTypes={[]}
          onToggle={mockOnToggle}
          onClear={mockOnClear}
        />
      );

      expect(screen.queryByText('Clear')).not.toBeInTheDocument();
    });

    it('shows clear button when types selected', () => {
      render(
        <EventTypeFilterChips
          selectedTypes={['lab_result']}
          onToggle={mockOnToggle}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('calls onClear when clear button clicked', () => {
      render(
        <EventTypeFilterChips
          selectedTypes={['lab_result', 'medication']}
          onToggle={mockOnToggle}
          onClear={mockOnClear}
        />
      );

      fireEvent.click(screen.getByText('Clear'));
      expect(mockOnClear).toHaveBeenCalled();
    });

    it('has accessible label on clear button', () => {
      render(
        <EventTypeFilterChips
          selectedTypes={['lab_result']}
          onToggle={mockOnToggle}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByLabelText('Clear type filters')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <EventTypeFilterChips
          selectedTypes={[]}
          onToggle={mockOnToggle}
          onClear={mockOnClear}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies correct colors for each event type', () => {
      render(
        <EventTypeFilterChips
          selectedTypes={['lab_result', 'doctor_visit', 'medication', 'intervention', 'metric']}
          onToggle={mockOnToggle}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('Labs').closest('button')?.className).toContain('bg-event-lab');
      expect(screen.getByText('Visits').closest('button')?.className).toContain('bg-info-muted');
      expect(screen.getByText('Meds').closest('button')?.className).toContain('bg-success-muted');
      expect(screen.getByText('Interventions').closest('button')?.className).toContain('bg-warning-muted');
      expect(screen.getByText('Metrics').closest('button')?.className).toContain('bg-event-metric');
    });
  });
});
