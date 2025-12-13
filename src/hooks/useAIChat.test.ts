import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAIChat } from './useAIChat';
import type { Conversation } from '@/types/conversations';
import type { ChatMessage } from '@/types/ai';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock API functions
const mockGetConversation = vi.fn();
const mockCreateConversation = vi.fn();
const mockAddMessage = vi.fn();
const mockDeleteMessage = vi.fn();
const mockDeleteMessagesAfter = vi.fn();
const mockUpdateMessage = vi.fn();
const mockGenerateConversationTitle = vi.fn();

vi.mock('@/api/conversations', () => ({
  getConversation: (id: string) => mockGetConversation(id),
  createConversation: (input: unknown) => mockCreateConversation(input),
  addMessage: (convId: string, message: unknown) => mockAddMessage(convId, message),
  deleteMessage: (convId: string, msgId: string) => mockDeleteMessage(convId, msgId),
  deleteMessagesAfter: (convId: string, timestamp: string) => mockDeleteMessagesAfter(convId, timestamp),
  updateMessage: (convId: string, msgId: string, content: string) => mockUpdateMessage(convId, msgId, content),
  generateConversationTitle: (convId: string, message: string) => mockGenerateConversationTitle(convId, message),
}));

// Mock Supabase auth
const mockGetSession = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

const mockConversation: Conversation = {
  id: 'conv-1',
  userId: 'user-123',
  title: 'Test Chat',
  provider: 'openai',
  model: 'gpt-4o',
  reasoningEffort: 'medium',
  thinkingLevel: null,
  agenticMode: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T01:00:00Z',
};

const mockMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Hello',
    timestamp: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: 'Hi there!',
    timestamp: new Date('2024-01-01T00:00:01Z'),
  },
];

describe('useAIChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default auth
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
      error: null,
    });

    // Default API responses
    mockGetConversation.mockResolvedValue({
      conversation: mockConversation,
      messages: mockMessages,
    });

    mockCreateConversation.mockResolvedValue(mockConversation);

    mockAddMessage.mockImplementation((_, message) => ({
      id: `msg-${Date.now()}`,
      ...message,
      timestamp: new Date(),
    }));

    // Default mocks for other functions
    mockDeleteMessage.mockResolvedValue(undefined);
    mockDeleteMessagesAfter.mockResolvedValue(undefined);
    mockUpdateMessage.mockImplementation((_, msgId, content) => ({
      id: msgId,
      role: 'user',
      content,
      timestamp: new Date(),
    }));
    mockGenerateConversationTitle.mockResolvedValue('Generated Title');

    // Default fetch response for AI chat (SSE format)
    const mockSSEResponse = {
      ok: true,
      body: {
        getReader: () => {
          let done = false;
          return {
            read: () => {
              if (done) return Promise.resolve({ done: true, value: undefined });
              done = true;
              const encoder = new TextEncoder();
              const sseData = 'data: {"type":"complete","data":{"content":"AI response","sources":[]}}\n\n';
              return Promise.resolve({ done: false, value: encoder.encode(sseData) });
            },
            releaseLock: () => {},
          };
        },
      },
    };
    mockFetch.mockResolvedValue(mockSSEResponse);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns initial empty state', () => {
    const { result } = renderHook(() => useAIChat());

    expect(result.current.conversationId).toBe(null);
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  describe('loadConversation', () => {
    it('loads conversation from API', async () => {
      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.loadConversation('conv-1');
      });

      expect(mockGetConversation).toHaveBeenCalledWith('conv-1');
      expect(result.current.conversationId).toBe('conv-1');
      expect(result.current.messages).toHaveLength(2);
    });

    it('calls onSettingsLoaded with conversation settings', async () => {
      const onSettingsLoaded = vi.fn();
      const { result } = renderHook(() =>
        useAIChat({ onSettingsLoaded })
      );

      await act(async () => {
        await result.current.loadConversation('conv-1');
      });

      expect(onSettingsLoaded).toHaveBeenCalledWith({
        provider: 'openai',
        model: 'gpt-4o',
        reasoningEffort: 'medium',
        thinkingLevel: null,
        agenticMode: true,
      });
    });

    it('sets error when conversation not found', async () => {
      mockGetConversation.mockResolvedValue(null);

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.loadConversation('nonexistent');
      });

      expect(result.current.error).toBe('Conversation not found');
      expect(result.current.conversationId).toBe(null);
    });

    it('handles API error', async () => {
      mockGetConversation.mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.loadConversation('conv-1');
      });

      expect(result.current.error).toBe('API error');
    });

    it('initializes conversationId from options', () => {
      const { result } = renderHook(() =>
        useAIChat({ conversationId: 'conv-1' })
      );

      // Hook initializes with the provided conversationId
      expect(result.current.conversationId).toBe('conv-1');
    });
  });

  describe('sendMessage', () => {
    it('creates conversation when none exists', async () => {
      const onConversationCreated = vi.fn();
      const { result } = renderHook(() =>
        useAIChat({
          currentSettings: {
            provider: 'openai',
            model: 'gpt-4o',
            reasoningEffort: 'medium',
            thinkingLevel: null,
          },
          onConversationCreated,
        })
      );

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(mockCreateConversation).toHaveBeenCalledWith({
        title: 'Hello',
        provider: 'openai',
        model: 'gpt-4o',
        reasoningEffort: 'medium',
        thinkingLevel: null,
      });
      expect(onConversationCreated).toHaveBeenCalledWith('conv-1');
    });

    it('truncates long messages for title', async () => {
      const longMessage = 'a'.repeat(100);
      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage(longMessage);
      });

      expect(mockCreateConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'a'.repeat(50) + '...',
        })
      );
    });

    it('adds user message to messages', async () => {
      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      // After send completes, should have user message
      const userMessages = result.current.messages.filter((m) => m.role === 'user');
      expect(userMessages.length).toBeGreaterThan(0);
      expect(userMessages[0].content).toBe('Hello');
    });

    it('saves user message to database', async () => {
      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(mockAddMessage).toHaveBeenCalledWith(
        'conv-1',
        expect.objectContaining({
          role: 'user',
          content: 'Hello',
        })
      );
    });

    it('calls onMessageSent after user message saved', async () => {
      const onMessageSent = vi.fn();
      const { result } = renderHook(() =>
        useAIChat({ onMessageSent })
      );

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(onMessageSent).toHaveBeenCalled();
    });

    it('sends request to AI endpoint', async () => {
      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/ai/chat',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('includes conversation history in request', async () => {
      // Load a conversation first
      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.loadConversation('conv-1');
      });

      // Verify messages are loaded
      expect(result.current.messages).toHaveLength(2);

      await act(async () => {
        await result.current.sendMessage('Follow up');
      });

      // Find the fetch call with the message
      const fetchCall = mockFetch.mock.calls.find((call) =>
        call[0] === '/api/ai/chat'
      );
      expect(fetchCall).toBeDefined();

      const body = JSON.parse(fetchCall[1].body);

      expect(body.history).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ]);
    });

    it('saves assistant response to database', async () => {
      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      // Should have saved assistant message
      expect(mockAddMessage).toHaveBeenCalledWith(
        'conv-1',
        expect.objectContaining({
          role: 'assistant',
          content: 'AI response',
        })
      );
    });

    it('handles AI API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'AI service unavailable' }),
      });

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.error).toBe('AI service unavailable');
    });

    it('sets error on fetch failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      // Should set error message
      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
    });

    it('does nothing for empty messages', async () => {
      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage('   ');
      });

      expect(mockCreateConversation).not.toHaveBeenCalled();
    });

    it('handles conversation creation failure', async () => {
      mockCreateConversation.mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.error).toBe('Failed to start conversation');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('clearChat', () => {
    it('resets all state', async () => {
      const { result } = renderHook(() =>
        useAIChat({ conversationId: 'conv-1' })
      );

      await waitFor(() => {
        expect(result.current.conversationId).toBe('conv-1');
      });

      act(() => {
        result.current.clearChat();
      });

      expect(result.current.conversationId).toBe(null);
      expect(result.current.messages).toEqual([]);
      expect(result.current.error).toBe(null);
    });
  });

  describe('startNewConversation', () => {
    it('resets state for new conversation', async () => {
      const { result } = renderHook(() =>
        useAIChat({ conversationId: 'conv-1' })
      );

      await waitFor(() => {
        expect(result.current.conversationId).toBe('conv-1');
      });

      act(() => {
        result.current.startNewConversation();
      });

      expect(result.current.conversationId).toBe(null);
      expect(result.current.messages).toEqual([]);
    });
  });

  describe('loading states', () => {
    it('sets isLoading during sendMessage', async () => {
      const { result } = renderHook(() => useAIChat());

      // Start sending but don't wait
      let sendPromise: Promise<void>;
      act(() => {
        sendPromise = result.current.sendMessage('Hello');
      });

      // Should be loading immediately after starting
      expect(result.current.isLoading).toBe(true);

      // Wait for it to complete
      await act(async () => {
        await sendPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('sets isLoading during loadConversation', async () => {
      let resolveLoad: (value: unknown) => void;
      mockGetConversation.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveLoad = resolve;
          })
      );

      const { result } = renderHook(() => useAIChat());

      act(() => {
        result.current.loadConversation('conv-1');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveLoad!({ conversation: mockConversation, messages: mockMessages });
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('conversationSettings', () => {
    it('returns conversation settings after load', async () => {
      const { result } = renderHook(() => useAIChat());

      await act(async () => {
        await result.current.loadConversation('conv-1');
      });

      expect(result.current.conversationSettings).toEqual({
        provider: 'openai',
        model: 'gpt-4o',
        reasoningEffort: 'medium',
        thinkingLevel: null,
        agenticMode: true,
      });
    });

    it('sets conversation settings on create', async () => {
      const { result } = renderHook(() =>
        useAIChat({
          currentSettings: {
            provider: 'google',
            model: 'gemini-2.5-flash',
            reasoningEffort: null,
            thinkingLevel: 'high',
          },
        })
      );

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.conversationSettings).toEqual({
        provider: 'google',
        model: 'gemini-2.5-flash',
        reasoningEffort: null,
        thinkingLevel: 'high',
      });
    });
  });
});
