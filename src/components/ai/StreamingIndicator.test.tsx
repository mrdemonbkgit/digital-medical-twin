import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreamingIndicator } from './StreamingIndicator';
import type { StreamingStatus } from '@/hooks/useAIChat';

describe('StreamingIndicator', () => {
  describe('visibility', () => {
    it('returns null when status is not active', () => {
      const status: StreamingStatus = {
        active: false,
        currentTool: null,
        toolCallCount: 0,
      };

      const { container } = render(<StreamingIndicator status={status} />);

      expect(container.firstChild).toBeNull();
    });

    it('renders when status is active', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: null,
        toolCallCount: 0,
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('Analyzing your question...')).toBeInTheDocument();
    });
  });

  describe('default message', () => {
    it('shows default message when no current tool', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: null,
        toolCallCount: 0,
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
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('Loading your profile...')).toBeInTheDocument();
    });

    it('shows medications message for get_medications tool', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: 'get_medications',
        toolCallCount: 1,
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('Checking medications...')).toBeInTheDocument();
    });

    it('shows labs message for get_recent_labs tool', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: 'get_recent_labs',
        toolCallCount: 1,
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('Retrieving lab results...')).toBeInTheDocument();
    });

    it('shows biomarker message for get_biomarker_history tool', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: 'get_biomarker_history',
        toolCallCount: 1,
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('Analyzing biomarker trends...')).toBeInTheDocument();
    });

    it('shows search message for search_events tool', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: 'search_events',
        toolCallCount: 1,
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('Searching health timeline...')).toBeInTheDocument();
    });

    it('shows details message for get_event_details tool', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: 'get_event_details',
        toolCallCount: 1,
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
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('Running custom_tool...')).toBeInTheDocument();
    });
  });

  describe('tool count display', () => {
    it('does not show count when toolCallCount is 1', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: 'get_profile',
        toolCallCount: 1,
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.queryByText(/tools used/)).not.toBeInTheDocument();
    });

    it('shows count when toolCallCount is greater than 1', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: 'get_medications',
        toolCallCount: 3,
      };

      render(<StreamingIndicator status={status} />);

      expect(screen.getByText('(3 tools used)')).toBeInTheDocument();
    });
  });

  describe('loading indicator', () => {
    it('renders spinning loader icon', () => {
      const status: StreamingStatus = {
        active: true,
        currentTool: null,
        toolCallCount: 0,
      };

      const { container } = render(<StreamingIndicator status={status} />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });
});
