import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AIHistorianPage } from './AIHistorianPage';

// Mock dependencies
const mockSetSearchParams = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams(), mockSetSearchParams],
  };
});

const mockSendMessage = vi.fn();
const mockLoadConversation = vi.fn();
const mockStartNewConversation = vi.fn();
vi.mock('@/hooks', () => ({
  useAIChat: vi.fn(() => ({
    conversationId: null,
    messages: [],
    isLoading: false,
    error: null,
    streamingStatus: null,
    sendMessage: mockSendMessage,
    loadConversation: mockLoadConversation,
    startNewConversation: mockStartNewConversation,
  })),
  useAISettings: vi.fn(() => ({
    settings: null,
    isLoading: false,
    updateSettings: vi.fn(),
  })),
  useConversations: vi.fn(() => ({
    conversations: [],
    isLoading: false,
    remove: vi.fn(),
    rename: vi.fn(),
    refetch: vi.fn(),
  })),
}));

vi.mock('@/components/layout', () => ({
  PageWrapper: ({ children, title, fullWidth }: any) => (
    <div data-testid="page-wrapper" data-title={title} data-full-width={fullWidth}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/common', () => ({
  Button: ({ children, onClick, disabled, variant, size }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ai', () => ({
  ChatMessage: ({ message }: any) => (
    <div data-testid={`chat-message-${message.id}`}>{message.content}</div>
  ),
  ChatInput: ({ onSend, disabled, placeholder }: any) => (
    <div data-testid="chat-input">
      <input
        data-testid="message-input"
        placeholder={placeholder}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSend((e.target as HTMLInputElement).value);
          }
        }}
      />
    </div>
  ),
  SuggestedQuestions: ({ onSelect }: any) => (
    <div data-testid="suggested-questions">
      <button onClick={() => onSelect('What are my latest lab results?')}>
        What are my latest lab results?
      </button>
    </div>
  ),
  ReasoningLevelSelect: ({ provider, disabled }: any) => (
    <div data-testid="reasoning-select" data-provider={provider} data-disabled={disabled}>
      Reasoning Select
    </div>
  ),
  ConversationList: ({
    conversations,
    activeId,
    onSelect,
    onNew,
    onDelete,
    isLoading,
  }: any) => (
    <div data-testid="conversation-list">
      <button data-testid="new-conversation" onClick={onNew}>
        New
      </button>
      {conversations.map((c: any) => (
        <div key={c.id} data-testid={`conversation-${c.id}`}>
          <button onClick={() => onSelect(c.id)}>{c.title}</button>
          <button onClick={() => onDelete(c.id)}>Delete</button>
        </div>
      ))}
    </div>
  ),
  StreamingIndicator: ({ status }: any) => (
    <div data-testid="streaming-indicator">{status}</div>
  ),
}));

vi.mock('@/utils/cn', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

import { useAIChat, useAISettings, useConversations } from '@/hooks';

describe('AIHistorianPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  function renderWithRouter() {
    return render(
      <MemoryRouter>
        <AIHistorianPage />
      </MemoryRouter>
    );
  }

  describe('loading state', () => {
    it('shows loading spinner while settings are loading', () => {
      vi.mocked(useAISettings).mockReturnValue({
        settings: null,
        isLoading: true,
        updateSettings: vi.fn(),
        error: null,
      });

      renderWithRouter();

      // Should show loading state (Loader2 icon with animate-spin)
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('not configured state', () => {
    it('shows setup prompt when AI is not configured', () => {
      vi.mocked(useAISettings).mockReturnValue({
        settings: null,
        isLoading: false,
        updateSettings: vi.fn(),
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText('Set Up AI Historian')).toBeInTheDocument();
      expect(screen.getByText('Configure AI Settings')).toBeInTheDocument();
    });

    it('shows description about AI configuration', () => {
      vi.mocked(useAISettings).mockReturnValue({
        settings: null,
        isLoading: false,
        updateSettings: vi.fn(),
        error: null,
      });

      renderWithRouter();

      expect(
        screen.getByText(/Configure your AI provider to start asking questions/)
      ).toBeInTheDocument();
    });
  });

  describe('configured state', () => {
    beforeEach(() => {
      vi.mocked(useAISettings).mockReturnValue({
        settings: {
          provider: 'openai',
          model: 'gpt-4o',
          openaiReasoningEffort: 'medium',
          agenticMode: true,
        },
        isLoading: false,
        updateSettings: vi.fn(),
        error: null,
      });

      vi.mocked(useAIChat).mockReturnValue({
        conversationId: null,
        messages: [],
        isLoading: false,
        error: null,
        streamingStatus: null,
        sendMessage: mockSendMessage,
        loadConversation: mockLoadConversation,
        startNewConversation: mockStartNewConversation,
      });

      vi.mocked(useConversations).mockReturnValue({
        conversations: [],
        isLoading: false,
        remove: vi.fn(),
        rename: vi.fn(),
        refetch: vi.fn(),
      });
    });

    it('renders chat interface', () => {
      renderWithRouter();

      expect(screen.getByText('AI Historian')).toBeInTheDocument();
      expect(screen.getByTestId('chat-input')).toBeInTheDocument();
    });

    it('shows suggested questions when no messages', () => {
      renderWithRouter();

      expect(screen.getByTestId('suggested-questions')).toBeInTheDocument();
      expect(screen.getByText('Ask about your health history')).toBeInTheDocument();
    });

    it('shows conversation list sidebar', () => {
      renderWithRouter();

      expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
      expect(screen.getByTestId('new-conversation')).toBeInTheDocument();
    });

    it('sends message when suggested question clicked', () => {
      renderWithRouter();

      fireEvent.click(screen.getByText('What are my latest lab results?'));

      expect(mockSendMessage).toHaveBeenCalledWith('What are my latest lab results?');
    });

    it('shows model info in header', () => {
      renderWithRouter();

      expect(screen.getByText(/GPT · gpt-4o/)).toBeInTheDocument();
    });

    it('shows agentic mode toggle', () => {
      renderWithRouter();

      expect(screen.getByText('Agentic')).toBeInTheDocument();
    });
  });

  describe('with messages', () => {
    beforeEach(() => {
      vi.mocked(useAISettings).mockReturnValue({
        settings: {
          provider: 'openai',
          model: 'gpt-4o',
          openaiReasoningEffort: 'medium',
          agenticMode: true,
        },
        isLoading: false,
        updateSettings: vi.fn(),
        error: null,
      });

      vi.mocked(useAIChat).mockReturnValue({
        conversationId: 'conv-1',
        messages: [
          { id: 'msg-1', role: 'user', content: 'Hello', timestamp: '2024-06-15T10:00:00Z' },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'How can I help?',
            timestamp: '2024-06-15T10:00:01Z',
          },
        ],
        isLoading: false,
        error: null,
        streamingStatus: null,
        sendMessage: mockSendMessage,
        loadConversation: mockLoadConversation,
        startNewConversation: mockStartNewConversation,
      });
    });

    it('renders chat messages', () => {
      renderWithRouter();

      expect(screen.getByTestId('chat-message-msg-1')).toBeInTheDocument();
      expect(screen.getByTestId('chat-message-msg-2')).toBeInTheDocument();
    });

    it('does not show suggested questions when messages exist', () => {
      renderWithRouter();

      expect(screen.queryByTestId('suggested-questions')).not.toBeInTheDocument();
    });

    it('shows clear button when messages exist', () => {
      renderWithRouter();

      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('starts new conversation when clear clicked', () => {
      renderWithRouter();

      fireEvent.click(screen.getByText('Clear'));

      expect(mockStartNewConversation).toHaveBeenCalled();
    });
  });

  describe('error state', () => {
    it('shows error message when chat error occurs', () => {
      vi.mocked(useAISettings).mockReturnValue({
        settings: {
          provider: 'openai',
          model: 'gpt-4o',
        },
        isLoading: false,
        updateSettings: vi.fn(),
        error: null,
      });

      vi.mocked(useAIChat).mockReturnValue({
        conversationId: null,
        messages: [],
        isLoading: false,
        error: 'Failed to send message',
        streamingStatus: null,
        sendMessage: mockSendMessage,
        loadConversation: mockLoadConversation,
        startNewConversation: mockStartNewConversation,
      });

      renderWithRouter();

      expect(screen.getByText('Failed to send message')).toBeInTheDocument();
    });
  });

  describe('loading messages', () => {
    it('shows streaming indicator when loading', () => {
      vi.mocked(useAISettings).mockReturnValue({
        settings: {
          provider: 'openai',
          model: 'gpt-4o',
        },
        isLoading: false,
        updateSettings: vi.fn(),
        error: null,
      });

      vi.mocked(useAIChat).mockReturnValue({
        conversationId: 'conv-1',
        messages: [{ id: 'msg-1', role: 'user', content: 'Hello', timestamp: '2024-06-15T10:00:00Z' }],
        isLoading: true,
        error: null,
        streamingStatus: 'Thinking...',
        sendMessage: mockSendMessage,
        loadConversation: mockLoadConversation,
        startNewConversation: mockStartNewConversation,
      });

      renderWithRouter();

      expect(screen.getByTestId('streaming-indicator')).toBeInTheDocument();
    });

    it('disables input while loading', () => {
      vi.mocked(useAISettings).mockReturnValue({
        settings: {
          provider: 'openai',
          model: 'gpt-4o',
        },
        isLoading: false,
        updateSettings: vi.fn(),
        error: null,
      });

      vi.mocked(useAIChat).mockReturnValue({
        conversationId: null,
        messages: [],
        isLoading: true,
        error: null,
        streamingStatus: null,
        sendMessage: mockSendMessage,
        loadConversation: mockLoadConversation,
        startNewConversation: mockStartNewConversation,
      });

      renderWithRouter();

      expect(screen.getByTestId('message-input')).toBeDisabled();
    });
  });

  describe('conversation selection', () => {
    beforeEach(() => {
      vi.mocked(useAISettings).mockReturnValue({
        settings: {
          provider: 'openai',
          model: 'gpt-4o',
        },
        isLoading: false,
        updateSettings: vi.fn(),
        error: null,
      });

      vi.mocked(useAIChat).mockReturnValue({
        conversationId: null,
        messages: [],
        isLoading: false,
        error: null,
        streamingStatus: null,
        sendMessage: mockSendMessage,
        loadConversation: mockLoadConversation,
        startNewConversation: mockStartNewConversation,
      });

      vi.mocked(useConversations).mockReturnValue({
        conversations: [
          { id: 'conv-1', title: 'Lab Results Chat', updatedAt: '2024-06-15T10:00:00Z' },
          { id: 'conv-2', title: 'Medication Question', updatedAt: '2024-06-14T10:00:00Z' },
        ],
        isLoading: false,
        remove: vi.fn(),
        rename: vi.fn(),
        refetch: vi.fn(),
      });
    });

    it('displays conversation list', () => {
      renderWithRouter();

      expect(screen.getByText('Lab Results Chat')).toBeInTheDocument();
      expect(screen.getByText('Medication Question')).toBeInTheDocument();
    });

    it('loads conversation when selected', () => {
      renderWithRouter();

      fireEvent.click(screen.getByText('Lab Results Chat'));

      expect(mockLoadConversation).toHaveBeenCalledWith('conv-1');
    });
  });

  describe('Gemini provider', () => {
    it('shows One-Shot mode for Gemini', () => {
      vi.mocked(useAISettings).mockReturnValue({
        settings: {
          provider: 'google',
          model: 'gemini-1.5-flash',
          geminiThinkingLevel: 'high',
        },
        isLoading: false,
        updateSettings: vi.fn(),
        error: null,
      });

      vi.mocked(useAIChat).mockReturnValue({
        conversationId: null,
        messages: [],
        isLoading: false,
        error: null,
        streamingStatus: null,
        sendMessage: mockSendMessage,
        loadConversation: mockLoadConversation,
        startNewConversation: mockStartNewConversation,
      });

      renderWithRouter();

      // Gemini always shows One-Shot mode
      expect(screen.getByText('One-Shot')).toBeInTheDocument();
      expect(screen.getByText(/Gemini/)).toBeInTheDocument();
    });
  });
});
