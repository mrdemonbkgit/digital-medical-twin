import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityPanel } from './ActivityPanel';
import type { ActivityItem } from '@/types/ai';

// Mock ActivityTimeline
vi.mock('./ActivityTimeline', () => ({
  ActivityTimeline: ({ activities }: any) => (
    <div data-testid="activity-timeline">
      {activities.map((a: ActivityItem, i: number) => (
        <div key={i} data-testid="activity-item">{a.type}</div>
      ))}
    </div>
  ),
}));

// Mock cn utility
vi.mock('@/utils/cn', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('ActivityPanel', () => {
  const mockActivities: ActivityItem[] = [
    { type: 'tool_call', timestamp: '2024-01-01T10:00:00Z', toolCall: { name: 'search', arguments: {} } },
    { type: 'thinking', timestamp: '2024-01-01T10:00:01Z', content: 'Analyzing data...' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('returns null when no activities', () => {
      const { container } = render(<ActivityPanel activities={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders activity toggle button', () => {
      render(<ActivityPanel activities={mockActivities} />);
      expect(screen.getByText('Activity')).toBeInTheDocument();
    });

    it('displays elapsed time when provided', () => {
      render(<ActivityPanel activities={mockActivities} elapsedTime="2.5s" />);
      expect(screen.getByText('· 2.5s')).toBeInTheDocument();
    });

    it('does not display elapsed time when not provided', () => {
      render(<ActivityPanel activities={mockActivities} />);
      expect(screen.queryByText(/·/)).not.toBeInTheDocument();
    });
  });

  describe('expand/collapse', () => {
    it('is collapsed by default', () => {
      render(<ActivityPanel activities={mockActivities} />);
      expect(screen.queryByTestId('activity-timeline')).not.toBeInTheDocument();
    });

    it('expands when defaultExpanded is true', () => {
      render(<ActivityPanel activities={mockActivities} defaultExpanded />);
      expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
    });

    it('expands when clicked', async () => {
      const user = userEvent.setup();
      render(<ActivityPanel activities={mockActivities} />);

      await user.click(screen.getByText('Activity'));
      expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
    });

    it('collapses when clicked again', async () => {
      const user = userEvent.setup();
      render(<ActivityPanel activities={mockActivities} defaultExpanded />);

      await user.click(screen.getByText('Activity'));
      expect(screen.queryByTestId('activity-timeline')).not.toBeInTheDocument();
    });

    it('rotates chevron when expanded', async () => {
      const user = userEvent.setup();
      render(<ActivityPanel activities={mockActivities} />);

      // Click to expand
      await user.click(screen.getByText('Activity'));

      // The chevron svg should have the rotate class applied by cn()
      const chevron = document.querySelector('svg');
      // cn() joins class strings with spaces, so check for the actual output
      expect(chevron?.className.baseVal || chevron?.getAttribute('class')).toContain('rotate-90');
    });
  });

  describe('activity display', () => {
    it('passes activities to ActivityTimeline', async () => {
      const user = userEvent.setup();
      render(<ActivityPanel activities={mockActivities} />);

      await user.click(screen.getByText('Activity'));

      const activityItems = screen.getAllByTestId('activity-item');
      expect(activityItems).toHaveLength(2);
      expect(activityItems[0]).toHaveTextContent('tool_call');
      expect(activityItems[1]).toHaveTextContent('thinking');
    });
  });
});
