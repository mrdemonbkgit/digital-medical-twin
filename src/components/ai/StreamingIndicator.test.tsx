import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StreamingIndicator } from './StreamingIndicator';
import type { StreamingStatus } from '@/hooks/useAIChat';

describe('StreamingIndicator', () => {
  describe('visibility', () => {
    it('returns null when status is not active', () => {
      const status: StreamingStatus = {
        active: false,
        currentTool: null,
        toolCallCount: 0,
        completedTools: [],
      };

      const { container } = render(<StreamingIndicator status={status} />);

      expect(container.firstChild).toBeNull();
    });

    it('renders when status is active', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: null,
        toolCallCount: 0,
        completedTools: [],
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('Analyzing your question...')).toBeInTheDocument();
    });
  });

  describe('default message', () => {
    it('shows default message when no current tool and no completed tools', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: null,
        toolCallCount: 0,
        completedTools: [],
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('Analyzing your question...')).toBeInTheDocument();
    });
  });

  describe('known tool messages', () => {
    it('shows profile message for get_profile tool', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: 'get_profile',
        toolCallCount: 1,
        completedTools: [],
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('Retrieving your profile...')).toBeInTheDocument();
    });

    it('shows medications message for get_medications tool', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: 'get_medications',
        toolCallCount: 1,
        completedTools: [],
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('Checking medications...')).toBeInTheDocument();
    });

    it('shows labs message for get_recent_labs tool', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: 'get_recent_labs',
        toolCallCount: 1,
        completedTools: [],
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('Retrieving lab results...')).toBeInTheDocument();
    });

    it('shows biomarker message for get_biomarker_history tool', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: 'get_biomarker_history',
        toolCallCount: 1,
        completedTools: [],
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('Analyzing biomarker trends...')).toBeInTheDocument();
    });

    it('shows search message for search_events tool', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: 'search_events',
        toolCallCount: 1,
        completedTools: [],
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('Searching health timeline...')).toBeInTheDocument();
    });

    it('shows details message for get_event_details tool', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: 'get_event_details',
        toolCallCount: 1,
        completedTools: [],
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('Getting event details...')).toBeInTheDocument();
    });
  });

  describe('unknown tool fallback', () => {
    it('shows generic message for unknown tool', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: 'custom_tool',
        toolCallCount: 1,
        completedTools: [],
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('Running custom_tool...')).toBeInTheDocument();
    });
  });

  describe('completed tools display', () => {
    it('shows completed tools with checkmarks', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: null,
        toolCallCount: 2,
        completedTools: [
          { id: 'tool-1', name: 'get_profile', status: 'completed' },
          { id: 'tool-2', name: 'get_medications', status: 'completed' },
        ],
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('Retrieving your profile')).toBeInTheDocument();
      expect(screen.getByText('Checking medications')).toBeInTheDocument();
    });

    it('shows failed tools with X icon', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: null,
        toolCallCount: 1,
        completedTools: [
          { id: 'tool-1', name: 'search_events', status: 'failed' },
        ],
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('Searching health timeline')).toBeInTheDocument();
    });

    it('shows result summary when available', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: null,
        toolCallCount: 1,
        completedTools: [
          { id: 'tool-1', name: 'search_events', status: 'completed', resultSummary: 'found 12 events' },
        ],
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('Searching health timeline (found 12 events)')).toBeInTheDocument();
    });
  });

  describe('progress display', () => {
    it('shows progress bar when tools are in progress', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: 'search_events',
        toolCallCount: 3,
        completedTools: [
          { id: 'tool-1', name: 'get_profile', status: 'completed' },
        ],
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('1/3 steps')).toBeInTheDocument();
    });

    it('does not show progress bar when no tools', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: null,
        toolCallCount: 0,
        completedTools: [],
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.queryByText(/steps/)).not.toBeInTheDocument();
    });
  });

  describe('stop button', () => {
    it('shows stop button when onStop provided', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: null,
        toolCallCount: 0,
        completedTools: [],
      };
      const onStop = vi.fn();

      render(<StreamingIndicator status={status} onStop={onStop} />);

      expect(screen.getByText('Stop')).toBeInTheDocument();
    });

    it('calls onStop when stop button clicked', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: null,
        toolCallCount: 0,
        completedTools: [],
      };
      const onStop = vi.fn();

      render(<StreamingIndicator status={status} onStop={onStop} />);

      fireEvent.click(screen.getByText('Stop'));

      expect(onStop).toHaveBeenCalledTimes(1);
    });

    it('does not show stop button when onStop not provided', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: null,
        toolCallCount: 0,
        completedTools: [],
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.queryByText('Stop')).not.toBeInTheDocument();
    });
  });

  describe('loading indicator', () => {
    it('renders spinning loader icon', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: null,
        toolCallCount: 0,
        completedTools: [],
      };

      const { container } = render(<StreamingIndicator status={status} />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });
});
