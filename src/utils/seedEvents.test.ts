import { describe, it, expect, vi, beforeEach } from 'vitest';
import { seedMockEvents, clearAllEvents } from './seedEvents';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase';

const mockSupabase = vi.mocked(supabase);

describe('seedEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('seedMockEvents', () => {
    it('returns error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await seedMockEvents();

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not authenticated');
    });

    it('inserts mock events for authenticated user', async () => {
      const mockUser = { id: 'user-123' };
      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabase.from.mockReturnValue({ insert: mockInsert } as any);

      const result = await seedMockEvents();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully added');
      expect(result.message).toContain('mock events');
      expect(mockSupabase.from).toHaveBeenCalledWith('events');
      expect(mockInsert).toHaveBeenCalled();
    });

    it('returns error when insert fails', async () => {
      const mockUser = { id: 'user-123' };
      const mockInsert = vi.fn().mockResolvedValue({
        error: { message: 'Insert failed' },
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabase.from.mockReturnValue({ insert: mockInsert } as any);

      const result = await seedMockEvents();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to seed events');
      expect(result.message).toContain('Insert failed');
    });

    it('includes various event types in mock data', async () => {
      const mockUser = { id: 'user-123' };
      let insertedData: any[] = [];
      const mockInsert = vi.fn().mockImplementation((data) => {
        insertedData = data;
        return Promise.resolve({ error: null });
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabase.from.mockReturnValue({ insert: mockInsert } as any);

      await seedMockEvents();

      const types = insertedData.map((e) => e.type);
      expect(types).toContain('lab_result');
      expect(types).toContain('doctor_visit');
      expect(types).toContain('medication');
      expect(types).toContain('metric');
      expect(types).toContain('intervention');
    });

    it('sets user_id on all events', async () => {
      const mockUser = { id: 'user-123' };
      let insertedData: any[] = [];
      const mockInsert = vi.fn().mockImplementation((data) => {
        insertedData = data;
        return Promise.resolve({ error: null });
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabase.from.mockReturnValue({ insert: mockInsert } as any);

      await seedMockEvents();

      insertedData.forEach((event) => {
        expect(event.user_id).toBe('user-123');
      });
    });
  });

  describe('clearAllEvents', () => {
    it('returns error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await clearAllEvents();

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not authenticated');
    });

    it('deletes events for authenticated user', async () => {
      const mockUser = { id: 'user-123' };
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabase.from.mockReturnValue({ delete: mockDelete } as any);

      const result = await clearAllEvents();

      expect(result.success).toBe(true);
      expect(result.message).toBe('All events cleared');
      expect(mockSupabase.from).toHaveBeenCalledWith('events');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('returns error when delete fails', async () => {
      const mockUser = { id: 'user-123' };
      const mockEq = vi.fn().mockResolvedValue({
        error: { message: 'Delete failed' },
      });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabase.from.mockReturnValue({ delete: mockDelete } as any);

      const result = await clearAllEvents();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to clear events');
      expect(result.message).toContain('Delete failed');
    });
  });
});
