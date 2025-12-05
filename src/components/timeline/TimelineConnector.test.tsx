import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimelineGroup, TimelineEvent, TimelineDateHeader } from './TimelineConnector';

// Mock cn utility
vi.mock('@/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('TimelineGroup', () => {
  describe('rendering', () => {
    it('renders children', () => {
      render(
        <TimelineGroup>
          <div data-testid="child">Child content</div>
        </TimelineGroup>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders vertical connector line', () => {
      const { container } = render(
        <TimelineGroup>
          <div>Content</div>
        </TimelineGroup>
      );

      const line = container.querySelector('[aria-hidden="true"]');
      expect(line).toBeInTheDocument();
      expect(line?.className).toContain('bg-gray-200');
    });

    it('applies left padding for timeline offset', () => {
      const { container } = render(
        <TimelineGroup>
          <div>Content</div>
        </TimelineGroup>
      );

      expect(container.firstChild).toHaveClass('pl-6');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <TimelineGroup className="custom-class">
          <div>Content</div>
        </TimelineGroup>
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('has relative positioning', () => {
      const { container } = render(
        <TimelineGroup>
          <div>Content</div>
        </TimelineGroup>
      );

      expect(container.firstChild).toHaveClass('relative');
    });
  });
});

describe('TimelineEvent', () => {
  describe('rendering', () => {
    it('renders children', () => {
      render(
        <TimelineEvent eventType="lab_result">
          <div data-testid="event-content">Event content</div>
        </TimelineEvent>
      );

      expect(screen.getByTestId('event-content')).toBeInTheDocument();
    });

    it('renders dot connector', () => {
      const { container } = render(
        <TimelineEvent eventType="lab_result">
          <div>Content</div>
        </TimelineEvent>
      );

      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toBeInTheDocument();
      expect(dot?.className).toContain('rounded-full');
    });
  });

  describe('event type colors', () => {
    it('applies red color for lab_result', () => {
      const { container } = render(
        <TimelineEvent eventType="lab_result">
          <div>Content</div>
        </TimelineEvent>
      );

      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot?.className).toContain('bg-red-500');
    });

    it('applies blue color for doctor_visit', () => {
      const { container } = render(
        <TimelineEvent eventType="doctor_visit">
          <div>Content</div>
        </TimelineEvent>
      );

      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot?.className).toContain('bg-blue-500');
    });

    it('applies green color for medication', () => {
      const { container } = render(
        <TimelineEvent eventType="medication">
          <div>Content</div>
        </TimelineEvent>
      );

      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot?.className).toContain('bg-green-500');
    });

    it('applies amber color for intervention', () => {
      const { container } = render(
        <TimelineEvent eventType="intervention">
          <div>Content</div>
        </TimelineEvent>
      );

      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot?.className).toContain('bg-amber-500');
    });

    it('applies purple color for metric', () => {
      const { container } = render(
        <TimelineEvent eventType="metric">
          <div>Content</div>
        </TimelineEvent>
      );

      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot?.className).toContain('bg-purple-500');
    });

    it('applies slate color for vice', () => {
      const { container } = render(
        <TimelineEvent eventType="vice">
          <div>Content</div>
        </TimelineEvent>
      );

      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot?.className).toContain('bg-slate-500');
    });
  });

  describe('isLast prop', () => {
    it('renders line hider when isLast is true', () => {
      const { container } = render(
        <TimelineEvent eventType="lab_result" isLast>
          <div>Content</div>
        </TimelineEvent>
      );

      // Should have 2 aria-hidden elements: dot and line hider
      const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenElements.length).toBe(2);
    });

    it('does not render line hider when isLast is false', () => {
      const { container } = render(
        <TimelineEvent eventType="lab_result" isLast={false}>
          <div>Content</div>
        </TimelineEvent>
      );

      const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenElements.length).toBe(1);
    });

    it('line hider has white background', () => {
      const { container } = render(
        <TimelineEvent eventType="lab_result" isLast>
          <div>Content</div>
        </TimelineEvent>
      );

      const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
      const lineHider = hiddenElements[1];
      expect(lineHider?.className).toContain('bg-white');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <TimelineEvent eventType="lab_result" className="custom-class">
          <div>Content</div>
        </TimelineEvent>
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('has relative positioning', () => {
      const { container } = render(
        <TimelineEvent eventType="lab_result">
          <div>Content</div>
        </TimelineEvent>
      );

      expect(container.firstChild).toHaveClass('relative');
    });

    it('dot has proper styling', () => {
      const { container } = render(
        <TimelineEvent eventType="lab_result">
          <div>Content</div>
        </TimelineEvent>
      );

      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot?.className).toContain('h-3');
      expect(dot?.className).toContain('w-3');
      expect(dot?.className).toContain('border-2');
      expect(dot?.className).toContain('border-white');
    });
  });
});

describe('TimelineDateHeader', () => {
  describe('rendering', () => {
    it('renders children as header text', () => {
      render(<TimelineDateHeader>January 15, 2024</TimelineDateHeader>);

      expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
    });

    it('renders as h2 element', () => {
      render(<TimelineDateHeader>Test Date</TimelineDateHeader>);

      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('renders circle marker', () => {
      const { container } = render(
        <TimelineDateHeader>Date</TimelineDateHeader>
      );

      const circle = container.querySelector('[aria-hidden="true"]');
      expect(circle).toBeInTheDocument();
      expect(circle?.className).toContain('rounded-full');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <TimelineDateHeader className="custom-class">Date</TimelineDateHeader>
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('has relative positioning', () => {
      const { container } = render(
        <TimelineDateHeader>Date</TimelineDateHeader>
      );

      expect(container.firstChild).toHaveClass('relative');
    });

    it('has uppercase text styling', () => {
      render(<TimelineDateHeader>Date</TimelineDateHeader>);

      const heading = screen.getByRole('heading');
      expect(heading.className).toContain('uppercase');
      expect(heading.className).toContain('tracking-wide');
    });

    it('circle has border styling', () => {
      const { container } = render(
        <TimelineDateHeader>Date</TimelineDateHeader>
      );

      const circle = container.querySelector('[aria-hidden="true"]');
      expect(circle?.className).toContain('border-2');
      expect(circle?.className).toContain('border-gray-300');
      expect(circle?.className).toContain('bg-white');
    });
  });
});
