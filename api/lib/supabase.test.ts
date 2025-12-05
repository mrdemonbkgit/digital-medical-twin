import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSupabaseClient, getUserId } from './supabase';

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
}));

import { createClient } from '@supabase/supabase-js';

describe('supabase', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createSupabaseClient', () => {
    it('creates a client with correct configuration', () => {
      createSupabaseClient();

      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-service-key',
        expect.objectContaining({
          auth: { autoRefreshToken: false, persistSession: false },
          global: { headers: {} },
        })
      );
    });

    it('creates a client with auth header when provided', () => {
      createSupabaseClient('Bearer test-token');

      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-service-key',
        expect.objectContaining({
          global: { headers: { Authorization: 'Bearer test-token' } },
        })
      );
    });

    it('throws error when SUPABASE_URL is missing', () => {
      delete process.env.SUPABASE_URL;
      delete process.env.VITE_SUPABASE_URL;

      expect(() => createSupabaseClient()).toThrow('Missing Supabase configuration');
    });

    it('throws error when SUPABASE_SERVICE_ROLE_KEY is missing', () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(() => createSupabaseClient()).toThrow('Missing Supabase configuration');
    });

    it('uses VITE_SUPABASE_URL as fallback', () => {
      delete process.env.SUPABASE_URL;
      process.env.VITE_SUPABASE_URL = 'https://vite-test.supabase.co';

      createSupabaseClient();

      expect(createClient).toHaveBeenCalledWith(
        'https://vite-test.supabase.co',
        'test-service-key',
        expect.any(Object)
      );
    });
  });

  describe('getUserId', () => {
    it('returns user id when valid token', async () => {
      const mockUser = { id: 'user-123' };
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      const userId = await getUserId(mockSupabase as any, 'Bearer valid-token');

      expect(userId).toBe('user-123');
      expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('valid-token');
    });

    it('strips Bearer prefix from token', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      };

      await getUserId(mockSupabase as any, 'Bearer my-token');

      expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('my-token');
    });

    it('throws Unauthorized when auth error', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Invalid token'),
          }),
        },
      };

      await expect(getUserId(mockSupabase as any, 'Bearer invalid-token')).rejects.toThrow(
        'Unauthorized'
      );
    });

    it('throws Unauthorized when no user returned', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      };

      await expect(getUserId(mockSupabase as any, 'Bearer token')).rejects.toThrow(
        'Unauthorized'
      );
    });
  });
});
