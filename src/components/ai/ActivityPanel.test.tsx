import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityPanel } from './ActivityPanel';
import type { ActivityItem, ToolCall } from '@/types/ai';

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
  const mockToolCall: ToolCall = {
    id: 'tool-1',
    type: 'function',
    name: 'search',
    arguments: {},
    status: 'completed',
  };

  const mockActivities: ActivityItem[] = [
    { id: 'act-1', type: 'tool_call', title: 'Searching', toolCall: mockToolCall },
    { id: 'act-2', type: 'thinking', title: 'Analyzing', content: 'Analyzing data...' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('returns null when no activities', () => {
      const { container } = render(<ActivityPanel activities={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders activity toggle button with tool count', () => {
      render(<ActivityPanel activities={mockActivities} />);
      expect(screen.getByText('1 tool used')).toBeInTheDocument();
    });

    it('renders plural tools used for multiple tool calls', () => {
      const multiToolActivities: ActivityItem[] = [
        { id: 'act-1', type: 'tool_call', title: 'Search', toolCall: mockToolCall },
        { id: 'act-2', type: 'tool_call', title: 'Fetch', toolCall: { ...mockToolCall, id: 'tool-2' } },
      ];
      render(<ActivityPanel activities={multiToolActivities} />);
      expect(screen.getByText('2 tools used')).toBeInTheDocument();
    });

    it('displays elapsed time when provided', () => {
      render(<ActivityPanel activities={mockActivities} elapsedTime="2.5s" />);
      expect(screen.getByText('2.5s')).toBeInTheDocument();
    });

    it('does not display elapsed time when not provided', () => {
      render(<ActivityPanel activities={mockActivities} />);
      expect(screen.queryByText('2.5s')).not.toBeInTheDocument();
    });
  });

  describe('summary generation', () => {
    it('shows result summary when tool has matching result', () => {
      const activitiesWithResult: ActivityItem[] = [
        {
          id: 'act-1',
          type: 'tool_call',
          title: 'Search',
          toolCall: { ...mockToolCall, result: 'Found 12 events matching the query' },
        },
      ];
      render(<ActivityPanel activities={activitiesWithResult} />);
      expect(screen.getByText('found 12 events')).toBeInTheDocument();
    });

    it('shows "no results" message when applicable', () => {
      const activitiesNoResults: ActivityItem[] = [
        {
          id: 'act-1',
          type: 'tool_call',
          title: 'Search',
          toolCall: { ...mockToolCall, result: 'No results found for the query' },
        },
      ];
      render(<ActivityPanel activities={activitiesNoResults} />);
      expect(screen.getByText('no results')).toBeInTheDocument();
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

      await user.click(screen.getByText('1 tool used'));
      expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
    });

    it('collapses when clicked again', async () => {
      const user = userEvent.setup();
      render(<ActivityPanel activities={mockActivities} defaultExpanded />);

      await user.click(screen.getByText('1 tool used'));
      expect(screen.queryByTestId('activity-timeline')).not.toBeInTheDocument();
    });

    it('rotates chevron when expanded', async () => {
      const user = userEvent.setup();
      render(<ActivityPanel activities={mockActivities} />);

      // Click to expand
      await user.click(screen.getByText('1 tool used'));

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

      await user.click(screen.getByText('1 tool used'));

      const activityItems = screen.getAllByTestId('activity-item');
      expect(activityItems).toHaveLength(2);
      expect(activityItems[0]).toHaveTextContent('tool_call');
      expect(activityItems[1]).toHaveTextContent('thinking');
    });
  });
});
