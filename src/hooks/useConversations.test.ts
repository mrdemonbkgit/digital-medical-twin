import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useConversations } from './useConversations';
import type { Conversation } from '@/types/conversations';

// Mock the API module
const mockGetConversations = vi.fn();
const mockCreateConversation = vi.fn();
const mockDeleteConversation = vi.fn();
const mockUpdateConversation = vi.fn();

vi.mock('@/api/conversations', () => ({
  getConversations: () => mockGetConversations(),
  createConversation: (input: { title?: string }) => mockCreateConversation(input),
  deleteConversation: (id: string) => mockDeleteConversation(id),
  updateConversation: (id: string, input: { title: string }) => mockUpdateConversation(id, input),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    userId: 'user-123',
    title: 'First Chat',
    provider: 'openai',
    model: 'gpt-4o',
    reasoningEffort: 'medium',
    thinkingLevel: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T01:00:00Z',
  },
  {
    id: 'conv-2',
    userId: 'user-123',
    title: 'Second Chat',
    provider: 'google',
    model: 'gemini-2.5-flash',
    reasoningEffort: null,
    thinkingLevel: 'high',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T01:00:00Z',
  },
];

describe('useConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: return conversations
    mockGetConversations.mockResolvedValue(mockConversations);
    // Default: create succeeds
    mockCreateConversation.mockResolvedValue({
      id: 'conv-new',
      userId: 'user-123',
      title: 'New Conversation',
      provider: null,
      model: null,
      reasoningEffort: null,
      thinkingLevel: null,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    });
    // Default: delete succeeds
    mockDeleteConversation.mockResolvedValue(undefined);
    // Default: update succeeds
    mockUpdateConversation.mockResolvedValue({
      ...mockConversations[0],
      title: 'Renamed Chat',
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns loading state initially', () => {
    mockGetConversations.mockImplementation(() => new Promise(() => {})); // Never resolves
    const { result } = renderHook(() => useConversations());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.conversations).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('fetches conversations on mount', async () => {
    const { result } = renderHook(() => useConversations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.conversations).toHaveLength(2);
    expect(result.current.conversations[0].title).toBe('First Chat');
    expect(mockGetConversations).toHaveBeenCalled();
  });

  it('handles fetch error gracefully', async () => {
    mockGetConversations.mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHook(() => useConversations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch');
    expect(result.current.conversations).toEqual([]);
  });

  it('handles non-Error objects in catch', async () => {
    mockGetConversations.mockRejectedValue('string error');

    const { result } = renderHook(() => useConversations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch conversations');
  });

  describe('createNew', () => {
    it('creates conversation and adds to list', async () => {
      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let newConversation: Conversation | undefined;
      await act(async () => {
        newConversation = await result.current.createNew('My New Chat');
      });

      expect(mockCreateConversation).toHaveBeenCalledWith({ title: 'My New Chat' });
      expect(newConversation?.id).toBe('conv-new');
      // New conversation should be at the beginning
      expect(result.current.conversations[0].id).toBe('conv-new');
      expect(result.current.conversations).toHaveLength(3);
    });

    it('creates conversation without title', async () => {
      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createNew();
      });

      expect(mockCreateConversation).toHaveBeenCalledWith({ title: undefined });
    });

    it('throws error when create fails', async () => {
      mockCreateConversation.mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.createNew('Test');
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Create failed');
    });
  });

  describe('remove', () => {
    it('removes conversation from list', async () => {
      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.conversations).toHaveLength(2);

      await act(async () => {
        await result.current.remove('conv-1');
      });

      expect(mockDeleteConversation).toHaveBeenCalledWith('conv-1');
      expect(result.current.conversations).toHaveLength(1);
      expect(result.current.conversations[0].id).toBe('conv-2');
    });

    it('throws error when delete fails', async () => {
      mockDeleteConversation.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.remove('conv-1');
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Delete failed');
      // List should still have both conversations on error
      expect(result.current.conversations).toHaveLength(2);
    });
  });

  describe('rename', () => {
    it('updates conversation title in list', async () => {
      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.rename('conv-1', 'Renamed Chat');
      });

      expect(mockUpdateConversation).toHaveBeenCalledWith('conv-1', { title: 'Renamed Chat' });
      expect(result.current.conversations[0].title).toBe('Renamed Chat');
    });

    it('throws error when rename fails', async () => {
      mockUpdateConversation.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 10000 });

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.rename('conv-1', 'New Name');
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Update failed');
    }, 15000);
  });

  describe('refetch', () => {
    it('reloads conversations from API', async () => {
      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetConversations).toHaveBeenCalledTimes(1);

      // Setup different response for refetch
      mockGetConversations.mockResolvedValueOnce([
        {
          id: 'conv-3',
          userId: 'user-123',
          title: 'Third Chat',
          provider: null,
          model: null,
          reasoningEffort: null,
          thinkingLevel: null,
          createdAt: '2024-01-04T00:00:00Z',
          updatedAt: '2024-01-04T00:00:00Z',
        },
      ]);

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockGetConversations).toHaveBeenCalledTimes(2);
      expect(result.current.conversations).toHaveLength(1);
      expect(result.current.conversations[0].id).toBe('conv-3');
    });

    it('sets loading state during refetch', async () => {
      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Make refetch take time
      let resolveRefetch: (value: Conversation[]) => void;
      mockGetConversations.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRefetch = resolve;
          })
      );

      // Start refetch but don't await
      act(() => {
        result.current.refetch();
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Resolve
      await act(async () => {
        resolveRefetch!(mockConversations);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('clears error before refetch', async () => {
      // First fetch fails
      mockGetConversations.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useConversations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');

      // Refetch succeeds
      mockGetConversations.mockResolvedValueOnce(mockConversations);

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.conversations).toHaveLength(2);
    });
  });
});
