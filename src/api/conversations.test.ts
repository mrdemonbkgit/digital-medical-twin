import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  addMessage,
} from './conversations';
import type { ConversationRow, MessageRow } from '@/types/conversations';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock Supabase - build chainable mock
const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: (table: string) => mockFrom(table),
  },
}));

const mockUserId = 'user-123';

const mockConversationRows: ConversationRow[] = [
  {
    id: 'conv-1',
    user_id: mockUserId,
    title: 'First Conversation',
    provider: 'openai',
    model: 'gpt-4o',
    reasoning_effort: 'medium',
    thinking_level: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T01:00:00Z',
  },
  {
    id: 'conv-2',
    user_id: mockUserId,
    title: 'Second Conversation',
    provider: 'google',
    model: 'gemini-2.5-flash',
    reasoning_effort: null,
    thinking_level: 'high',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T01:00:00Z',
  },
];

const mockMessageRows: MessageRow[] = [
  {
    id: 'msg-1',
    conversation_id: 'conv-1',
    role: 'user',
    content: 'Hello',
    metadata: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'msg-2',
    conversation_id: 'conv-1',
    role: 'assistant',
    content: 'Hi there!',
    metadata: {
      sources: [{ id: 'event-1', type: 'lab_result' }],
      elapsedTime: 1500,
    },
    created_at: '2024-01-01T00:00:01Z',
  },
];

describe('conversations API', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default auth setup - authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    // Setup chainable mocks
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
    });

    mockInsert.mockReturnValue({
      select: mockSelect,
    });

    mockUpdate.mockReturnValue({
      eq: mockEq,
    });

    mockDelete.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
      select: mockSelect,
    });

    mockOrder.mockReturnValue({
      data: mockConversationRows,
      error: null,
    });

    mockSingle.mockReturnValue({
      data: mockConversationRows[0],
      error: null,
    });
  });

  describe('getConversations', () => {
    it('fetches all conversations for current user', async () => {
      const result = await getConversations();

      expect(mockFrom).toHaveBeenCalledWith('ai_conversations');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockOrder).toHaveBeenCalledWith('updated_at', { ascending: false });
      expect(result).toHaveLength(2);
    });

    it('transforms rows to Conversation objects', async () => {
      const result = await getConversations();

      expect(result[0]).toEqual({
        id: 'conv-1',
        userId: mockUserId,
        title: 'First Conversation',
        provider: 'openai',
        model: 'gpt-4o',
        reasoningEffort: 'medium',
        thinkingLevel: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T01:00:00Z',
      });
    });

    it('throws error when user not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(getConversations()).rejects.toThrow('User not authenticated');
    });

    it('throws error when query fails', async () => {
      mockOrder.mockReturnValue({ data: null, error: { message: 'Database error' } });

      await expect(getConversations()).rejects.toThrow('Failed to fetch conversations');
    });
  });

  describe('getConversation', () => {
    beforeEach(() => {
      // Setup for fetching single conversation with messages
      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'ai_conversations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => ({ data: mockConversationRows[0], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'ai_messages') {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({ data: mockMessageRows, error: null }),
              }),
            }),
          };
        }
        return { select: mockSelect };
      });
    });

    it('fetches conversation with all its messages', async () => {
      const result = await getConversation('conv-1');

      expect(result).not.toBeNull();
      expect(result?.conversation.id).toBe('conv-1');
      expect(result?.messages).toHaveLength(2);
    });

    it('transforms message metadata correctly', async () => {
      const result = await getConversation('conv-1');

      const assistantMsg = result?.messages[1];
      expect(assistantMsg?.sources).toEqual([{ id: 'event-1', type: 'lab_result' }]);
      expect(assistantMsg?.elapsedTime).toBe(1500);
    });

    it('returns null when conversation not found', async () => {
      mockFrom.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => ({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }),
      }));

      const result = await getConversation('nonexistent');

      expect(result).toBeNull();
    });

    it('throws error when user not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(getConversation('conv-1')).rejects.toThrow('User not authenticated');
    });

    it('throws error when conversation query fails', async () => {
      mockFrom.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => ({ data: null, error: { message: 'Database error' } }),
            }),
          }),
        }),
      }));

      await expect(getConversation('conv-1')).rejects.toThrow('Failed to fetch conversation');
    });
  });

  describe('createConversation', () => {
    beforeEach(() => {
      mockFrom.mockReturnValue({
        insert: () => ({
          select: () => ({
            single: () => ({ data: mockConversationRows[0], error: null }),
          }),
        }),
      });
    });

    it('creates conversation with provided settings', async () => {
      const input = {
        title: 'Test Chat',
        provider: 'openai' as const,
        model: 'gpt-4o' as const,
        reasoningEffort: 'high' as const,
      };

      const result = await createConversation(input);

      expect(result.id).toBe('conv-1');
      expect(mockFrom).toHaveBeenCalledWith('ai_conversations');
    });

    it('creates conversation with default title when not provided', async () => {
      const result = await createConversation();

      expect(result).toBeDefined();
    });

    it('throws error when user not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(createConversation()).rejects.toThrow('User not authenticated');
    });

    it('throws error when insert fails', async () => {
      mockFrom.mockReturnValue({
        insert: () => ({
          select: () => ({
            single: () => ({ data: null, error: { message: 'Insert failed' } }),
          }),
        }),
      });

      await expect(createConversation()).rejects.toThrow('Failed to create conversation');
    });
  });

  describe('updateConversation', () => {
    beforeEach(() => {
      mockFrom.mockReturnValue({
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => ({
                single: () => ({
                  data: { ...mockConversationRows[0], title: 'Updated Title' },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });
    });

    it('updates conversation title', async () => {
      const result = await updateConversation('conv-1', { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
      expect(mockFrom).toHaveBeenCalledWith('ai_conversations');
    });

    it('throws error when user not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(updateConversation('conv-1', { title: 'New' })).rejects.toThrow(
        'User not authenticated'
      );
    });

    it('throws error when update fails', async () => {
      mockFrom.mockReturnValue({
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => ({
                single: () => ({ data: null, error: { message: 'Update failed' } }),
              }),
            }),
          }),
        }),
      });

      await expect(updateConversation('conv-1', { title: 'New' })).rejects.toThrow(
        'Failed to update conversation'
      );
    });
  });

  describe('deleteConversation', () => {
    beforeEach(() => {
      mockFrom.mockReturnValue({
        delete: () => ({
          eq: () => ({
            eq: () => ({ error: null }),
          }),
        }),
      });
    });

    it('deletes conversation by id', async () => {
      await expect(deleteConversation('conv-1')).resolves.toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith('ai_conversations');
    });

    it('throws error when user not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(deleteConversation('conv-1')).rejects.toThrow('User not authenticated');
    });

    it('throws error when delete fails', async () => {
      mockFrom.mockReturnValue({
        delete: () => ({
          eq: () => ({
            eq: () => ({ error: { message: 'Delete failed' } }),
          }),
        }),
      });

      await expect(deleteConversation('conv-1')).rejects.toThrow('Failed to delete conversation');
    });
  });

  describe('addMessage', () => {
    const newMessage = {
      role: 'user' as const,
      content: 'Test message',
    };

    beforeEach(() => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'ai_messages') {
          return {
            insert: () => ({
              select: () => ({
                single: () => ({
                  data: {
                    id: 'msg-new',
                    conversation_id: 'conv-1',
                    role: 'user',
                    content: 'Test message',
                    metadata: null,
                    created_at: '2024-01-01T00:00:00Z',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'ai_conversations') {
          return {
            update: () => ({
              eq: () => ({ error: null }),
            }),
          };
        }
        return { select: mockSelect };
      });
    });

    it('adds message to conversation', async () => {
      const result = await addMessage('conv-1', newMessage);

      expect(result.id).toBe('msg-new');
      expect(result.role).toBe('user');
      expect(result.content).toBe('Test message');
    });

    it('includes metadata when provided', async () => {
      const messageWithMetadata = {
        role: 'assistant' as const,
        content: 'Response',
        sources: [{ id: 'event-1', type: 'lab_result' as const }],
        elapsedTime: 2000,
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'ai_messages') {
          return {
            insert: () => ({
              select: () => ({
                single: () => ({
                  data: {
                    id: 'msg-new',
                    conversation_id: 'conv-1',
                    role: 'assistant',
                    content: 'Response',
                    metadata: {
                      sources: [{ id: 'event-1', type: 'lab_result' }],
                      elapsedTime: 2000,
                    },
                    created_at: '2024-01-01T00:00:00Z',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'ai_conversations') {
          return {
            update: () => ({
              eq: () => ({ error: null }),
            }),
          };
        }
        return { select: mockSelect };
      });

      const result = await addMessage('conv-1', messageWithMetadata);

      expect(result.sources).toEqual([{ id: 'event-1', type: 'lab_result' }]);
      expect(result.elapsedTime).toBe(2000);
    });

    it('updates conversation timestamp after adding message', async () => {
      await addMessage('conv-1', newMessage);

      // Verify that ai_conversations was also called for update
      expect(mockFrom).toHaveBeenCalledWith('ai_conversations');
    });

    it('throws error when insert fails', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'ai_messages') {
          return {
            insert: () => ({
              select: () => ({
                single: () => ({ data: null, error: { message: 'Insert failed' } }),
              }),
            }),
          };
        }
        return { select: mockSelect };
      });

      await expect(addMessage('conv-1', newMessage)).rejects.toThrow('Failed to add message');
    });
  });
});
