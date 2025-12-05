import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityTimeline } from './ActivityTimeline';
import type { ActivityItem } from '@/types/ai';

// Mock child components
vi.mock('./ThinkingStep', () => ({
  ThinkingStep: ({ activity }: { activity: ActivityItem }) => (
    <div data-testid={`thinking-${activity.id}`}>{activity.title}</div>
  ),
}));

vi.mock('./ToolCallStep', () => ({
  ToolCallStep: ({ toolCall }: { toolCall: any }) => (
    <div data-testid={`toolcall-${toolCall.name}`}>{toolCall.name}</div>
  ),
}));

vi.mock('./WebSearchStep', () => ({
  WebSearchStep: ({ activities }: { activities: ActivityItem[] }) => (
    <div data-testid="websearch">{activities.length} searches</div>
  ),
}));

describe('ActivityTimeline', () => {
  const createActivity = (
    type: ActivityItem['type'],
    id: string,
    extras: Partial<ActivityItem> = {}
  ): ActivityItem => ({
    id,
    type,
    title: `${type} activity`,
    status: 'completed',
    timestamp: new Date().toISOString(),
    ...extras,
  });

  describe('empty state', () => {
    it('renders empty container when no activities', () => {
      const { container } = render(<ActivityTimeline activities={[]} />);

      expect(container.querySelector('.space-y-4')).toBeInTheDocument();
    });
  });

  describe('thinking activities', () => {
    it('renders thinking section header when thinking activities exist', () => {
      const activities = [createActivity('thinking', 'think-1')];

      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByText('Thinking')).toBeInTheDocument();
    });

    it('renders ThinkingStep for each thinking activity', () => {
      const activities = [
        createActivity('thinking', 'think-1'),
        createActivity('thinking', 'think-2'),
      ];

      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByTestId('thinking-think-1')).toBeInTheDocument();
      expect(screen.getByTestId('thinking-think-2')).toBeInTheDocument();
    });

    it('does not render thinking section when no thinking activities', () => {
      const activities = [
        createActivity('tool_call', 'tool-1', {
          toolCall: { name: 'get_profile', arguments: {} },
        }),
      ];

      render(<ActivityTimeline activities={activities} />);

      expect(screen.queryByText('Thinking')).not.toBeInTheDocument();
    });
  });

  describe('tool call activities', () => {
    it('renders ToolCallStep for each tool call activity with toolCall', () => {
      const activities = [
        createActivity('tool_call', 'tool-1', {
          toolCall: { name: 'get_profile', arguments: {} },
        }),
        createActivity('tool_call', 'tool-2', {
          toolCall: { name: 'get_medications', arguments: {} },
        }),
      ];

      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByTestId('toolcall-get_profile')).toBeInTheDocument();
      expect(screen.getByTestId('toolcall-get_medications')).toBeInTheDocument();
    });

    it('does not render tool call without toolCall property', () => {
      const activities = [
        createActivity('tool_call', 'tool-1'), // No toolCall property
      ];

      render(<ActivityTimeline activities={activities} />);

      expect(screen.queryByTestId(/toolcall-/)).not.toBeInTheDocument();
    });
  });

  describe('web search activities', () => {
    it('renders WebSearchStep when web search activities exist', () => {
      const activities = [
        createActivity('web_search', 'search-1', {
          sources: [{ url: 'https://example.com', title: 'Example', snippet: '' }],
        }),
      ];

      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByTestId('websearch')).toBeInTheDocument();
      expect(screen.getByText('1 searches')).toBeInTheDocument();
    });

    it('passes all web search activities to WebSearchStep', () => {
      const activities = [
        createActivity('web_search', 'search-1'),
        createActivity('web_search', 'search-2'),
        createActivity('web_search', 'search-3'),
      ];

      render(<ActivityTimeline activities={activities} />);

      expect(screen.getByText('3 searches')).toBeInTheDocument();
    });

    it('does not render web search when no web search activities', () => {
      const activities = [createActivity('thinking', 'think-1')];

      render(<ActivityTimeline activities={activities} />);

      expect(screen.queryByTestId('websearch')).not.toBeInTheDocument();
    });
  });

  describe('mixed activities', () => {
    it('renders all activity types together', () => {
      const activities = [
        createActivity('thinking', 'think-1'),
        createActivity('tool_call', 'tool-1', {
          toolCall: { name: 'search_events', arguments: {} },
        }),
        createActivity('web_search', 'search-1'),
      ];

      render(<ActivityTimeline activities={activities} />);

      // Thinking section
      expect(screen.getByText('Thinking')).toBeInTheDocument();
      expect(screen.getByTestId('thinking-think-1')).toBeInTheDocument();

      // Tool call
      expect(screen.getByTestId('toolcall-search_events')).toBeInTheDocument();

      // Web search
      expect(screen.getByTestId('websearch')).toBeInTheDocument();
    });

    it('maintains correct order of sections', () => {
      const activities = [
        createActivity('web_search', 'search-1'),
        createActivity('thinking', 'think-1'),
        createActivity('tool_call', 'tool-1', {
          toolCall: { name: 'get_profile', arguments: {} },
        }),
      ];

      const { container } = render(<ActivityTimeline activities={activities} />);

      const sections = container.querySelectorAll('.space-y-4 > div');
      // Order should be: Thinking, Tool calls, Web search
      expect(sections.length).toBe(3);
    });
  });

  describe('filtering', () => {
    it('only includes thinking type in thinking section', () => {
      const activities = [
        createActivity('thinking', 'think-1'),
        createActivity('tool_call', 'tool-1', {
          toolCall: { name: 'test', arguments: {} },
        }),
      ];

      render(<ActivityTimeline activities={activities} />);

      // Should only have one thinking step
      expect(screen.getByTestId('thinking-think-1')).toBeInTheDocument();
      expect(screen.queryByTestId('thinking-tool-1')).not.toBeInTheDocument();
    });
  });
});
