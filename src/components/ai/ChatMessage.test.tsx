import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatMessage } from './ChatMessage';
import type { ChatMessage as ChatMessageType } from '@/types/ai';

// Mock child components
vi.mock('./ActivityPanel', () => ({
  ActivityPanel: ({ activities }: { activities: unknown[] }) => (
    <div data-testid="activity-panel">Activities: {activities.length}</div>
  ),
}));

vi.mock('./MessageActionsMenu', () => ({
  MessageActionsMenu: ({ onShowDetails }: { onShowDetails: () => void }) => (
    <button data-testid="actions-menu" onClick={onShowDetails}>
      Actions
    </button>
  ),
}));

vi.mock('./MessageDetailsModal', () => ({
  MessageDetailsModal: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="details-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

// Mock ReactMarkdown to simplify testing
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));

vi.mock('remark-gfm', () => ({
  default: {},
}));

const baseTimestamp = new Date('2024-01-15T10:30:00Z');

const userMessage: ChatMessageType = {
  id: 'msg-1',
  role: 'user',
  content: 'What are my latest lab results?',
  timestamp: baseTimestamp,
};

const assistantMessage: ChatMessageType = {
  id: 'msg-2',
  role: 'assistant',
  content: 'Here are your latest lab results from January 2024.',
  timestamp: baseTimestamp,
};

const assistantMessageWithSources: ChatMessageType = {
  ...assistantMessage,
  id: 'msg-3',
  sources: [
    { id: 'event-1', type: 'lab_result', title: 'Blood Test', date: '2024-01-10' },
    { id: 'event-2', type: 'lab_result', title: 'Lipid Panel', date: '2024-01-12' },
  ],
};

const assistantMessageWithToolCalls: ChatMessageType = {
  ...assistantMessage,
  id: 'msg-4',
  toolCalls: [
    {
      id: 'tool-1',
      name: 'search_events',
      arguments: { query: 'lab results' },
      result: { events: [] },
      status: 'success',
    },
  ],
};

const assistantMessageWithReasoning: ChatMessageType = {
  ...assistantMessage,
  id: 'msg-5',
  reasoning: {
    steps: [
      { title: 'Analyzing request', content: 'User wants lab results' },
      { title: 'Searching data', content: 'Looking for recent labs' },
    ],
  },
};

const assistantMessageWithWebSearch: ChatMessageType = {
  ...assistantMessage,
  id: 'msg-6',
  webSearchResults: [
    { url: 'https://example.com/1', title: 'Health Article 1', snippet: 'Info about health' },
    { url: 'https://example.com/2', title: 'Health Article 2', snippet: 'More info' },
  ],
};

const assistantMessageWithCitations: ChatMessageType = {
  ...assistantMessage,
  id: 'msg-7',
  content: 'Cholesterol levels are important.',
  citations: [{ startIndex: 0, endIndex: 30, sourceIndices: [0] }],
  webSearchResults: [
    { url: 'https://example.com/health', title: 'Health Guide', snippet: 'About cholesterol' },
  ],
};

const assistantMessageWithElapsedTime: ChatMessageType = {
  ...assistantMessage,
  id: 'msg-8',
  elapsedTime: 2500,
  toolCalls: [
    {
      id: 'tool-1',
      name: 'search_events',
      arguments: {},
      result: {},
      status: 'success',
    },
  ],
};

describe('ChatMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('user messages', () => {
    it('renders user message content', () => {
      render(<ChatMessage message={userMessage} />);
      expect(screen.getByText('What are my latest lab results?')).toBeInTheDocument();
    });

    it('shows "You" as the sender', () => {
      render(<ChatMessage message={userMessage} />);
      expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('renders user icon', () => {
      const { container } = render(<ChatMessage message={userMessage} />);
      // User messages have gray background for icon
      const iconContainer = container.querySelector('.bg-gray-100');
      expect(iconContainer).toBeInTheDocument();
    });

    it('renders timestamp', () => {
      render(<ChatMessage message={userMessage} />);
      // The time is formatted using Intl.DateTimeFormat
      expect(screen.getByText(/AM|PM/i)).toBeInTheDocument();
    });

    it('does not render activity panel for user messages', () => {
      render(<ChatMessage message={userMessage} />);
      expect(screen.queryByTestId('activity-panel')).not.toBeInTheDocument();
    });

    it('applies white background for user messages', () => {
      const { container } = render(<ChatMessage message={userMessage} />);
      const messageDiv = container.querySelector('.bg-white');
      expect(messageDiv).toBeInTheDocument();
    });
  });

  describe('assistant messages', () => {
    it('renders assistant message content', () => {
      render(<ChatMessage message={assistantMessage} />);
      expect(screen.getByTestId('markdown')).toHaveTextContent(
        'Here are your latest lab results from January 2024.'
      );
    });

    it('shows "AI Historian" as the sender', () => {
      render(<ChatMessage message={assistantMessage} />);
      expect(screen.getByText('AI Historian')).toBeInTheDocument();
    });

    it('renders bot icon', () => {
      const { container } = render(<ChatMessage message={assistantMessage} />);
      // Assistant messages have blue background for icon
      const iconContainer = container.querySelector('.bg-blue-100');
      expect(iconContainer).toBeInTheDocument();
    });

    it('applies gray background for assistant messages', () => {
      const { container } = render(<ChatMessage message={assistantMessage} />);
      const messageDiv = container.querySelector('.bg-gray-50');
      expect(messageDiv).toBeInTheDocument();
    });

    it('renders markdown content', () => {
      render(<ChatMessage message={assistantMessage} />);
      expect(screen.getByTestId('markdown')).toBeInTheDocument();
    });
  });

  describe('sources display', () => {
    it('shows sources count when message has sources', () => {
      render(<ChatMessage message={assistantMessageWithSources} />);
      expect(screen.getByText(/Based on 2 health events/)).toBeInTheDocument();
    });

    it('uses singular form for single source', () => {
      const singleSourceMessage = {
        ...assistantMessage,
        sources: [{ id: 'event-1', type: 'lab_result', title: 'Blood Test', date: '2024-01-10' }],
      };
      render(<ChatMessage message={singleSourceMessage} />);
      expect(screen.getByText(/Based on 1 health event$/)).toBeInTheDocument();
    });

    it('does not show sources section when no sources', () => {
      render(<ChatMessage message={assistantMessage} />);
      expect(screen.queryByText(/Based on/)).not.toBeInTheDocument();
    });
  });

  describe('activity panel', () => {
    it('shows activity panel when message has tool calls', () => {
      render(<ChatMessage message={assistantMessageWithToolCalls} />);
      expect(screen.getByTestId('activity-panel')).toBeInTheDocument();
    });

    it('shows activity panel when message has reasoning', () => {
      render(<ChatMessage message={assistantMessageWithReasoning} />);
      expect(screen.getByTestId('activity-panel')).toBeInTheDocument();
    });

    it('shows activity panel when message has web search results', () => {
      render(<ChatMessage message={assistantMessageWithWebSearch} />);
      expect(screen.getByTestId('activity-panel')).toBeInTheDocument();
    });

    it('passes correct activity count for tool calls', () => {
      render(<ChatMessage message={assistantMessageWithToolCalls} />);
      expect(screen.getByTestId('activity-panel')).toHaveTextContent('Activities: 1');
    });

    it('passes correct activity count for reasoning steps', () => {
      render(<ChatMessage message={assistantMessageWithReasoning} />);
      expect(screen.getByTestId('activity-panel')).toHaveTextContent('Activities: 2');
    });

    it('does not show activity panel for user messages', () => {
      render(<ChatMessage message={userMessage} />);
      expect(screen.queryByTestId('activity-panel')).not.toBeInTheDocument();
    });

    it('does not show activity panel when no activities', () => {
      render(<ChatMessage message={assistantMessage} />);
      expect(screen.queryByTestId('activity-panel')).not.toBeInTheDocument();
    });
  });

  describe('actions menu', () => {
    it('renders actions menu', () => {
      render(<ChatMessage message={assistantMessage} />);
      expect(screen.getByTestId('actions-menu')).toBeInTheDocument();
    });

    it('opens details modal when show details is triggered', () => {
      render(<ChatMessage message={assistantMessage} />);

      expect(screen.queryByTestId('details-modal')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('actions-menu'));

      expect(screen.getByTestId('details-modal')).toBeInTheDocument();
    });

    it('closes details modal when close is triggered', () => {
      render(<ChatMessage message={assistantMessage} />);

      fireEvent.click(screen.getByTestId('actions-menu'));
      expect(screen.getByTestId('details-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Close'));
      expect(screen.queryByTestId('details-modal')).not.toBeInTheDocument();
    });
  });

  describe('citations', () => {
    it('renders content with citations when present', () => {
      render(<ChatMessage message={assistantMessageWithCitations} />);
      // Content should still be rendered
      expect(screen.getByText(/Cholesterol levels/)).toBeInTheDocument();
    });

    it('renders without citations when not present', () => {
      render(<ChatMessage message={assistantMessage} />);
      expect(screen.getByTestId('markdown')).toBeInTheDocument();
    });
  });

  describe('elapsed time', () => {
    it('passes elapsed time to activity panel', () => {
      render(<ChatMessage message={assistantMessageWithElapsedTime} />);
      expect(screen.getByTestId('activity-panel')).toBeInTheDocument();
    });
  });

  describe('combined activities', () => {
    it('combines multiple activity types', () => {
      const combinedMessage: ChatMessageType = {
        ...assistantMessage,
        id: 'msg-combined',
        reasoning: {
          steps: [{ title: 'Step 1', content: 'Content' }],
        },
        toolCalls: [
          {
            id: 'tool-1',
            name: 'search',
            arguments: {},
            result: {},
            status: 'success',
          },
        ],
        webSearchResults: [
          { url: 'https://example.com', title: 'Article', snippet: 'Text' },
        ],
      };

      render(<ChatMessage message={combinedMessage} />);
      // 1 reasoning + 1 tool call + 1 web search = 3 activities
      expect(screen.getByTestId('activity-panel')).toHaveTextContent('Activities: 3');
    });
  });
});
