import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, register, logout, getCurrentUser, onAuthStateChange } from './auth';
import type { User } from '@/types';

// Mock supabase
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (params: unknown) => mockSignInWithPassword(params),
      signUp: (params: unknown) => mockSignUp(params),
      signOut: () => mockSignOut(),
      getSession: () => mockGetSession(),
      onAuthStateChange: (callback: unknown) => mockOnAuthStateChange(callback),
    },
  },
}));

const mockSupabaseUser = {
  id: 'user-123',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
};

const expectedUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  createdAt: '2024-01-01T00:00:00Z',
};

describe('auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('calls signInWithPassword with credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      });

      await login({ email: 'test@example.com', password: 'password123' });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('returns mapped user on success', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      });

      const result = await login({ email: 'test@example.com', password: 'password123' });

      expect(result).toEqual(expectedUser);
    });

    it('throws error on authentication failure', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      });

      await expect(login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('throws error when no user returned', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(login({ email: 'test@example.com', password: 'password' })).rejects.toThrow(
        'Login failed'
      );
    });

    it('handles user with missing email', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-456',
            created_at: '2024-01-01T00:00:00Z',
            // email is undefined
          },
        },
        error: null,
      });

      const result = await login({ email: 'test@example.com', password: 'password' });

      expect(result.email).toBe('');
    });
  });

  describe('register', () => {
    it('calls signUp with credentials', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      });

      await register({ email: 'new@example.com', password: 'newpassword123' });

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'newpassword123',
      });
    });

    it('returns mapped user on success', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      });

      const result = await register({ email: 'new@example.com', password: 'newpassword123' });

      expect(result).toEqual(expectedUser);
    });

    it('throws error on registration failure', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already registered' },
      });

      await expect(
        register({ email: 'existing@example.com', password: 'password' })
      ).rejects.toThrow('Email already registered');
    });

    it('throws error when no user returned', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(register({ email: 'test@example.com', password: 'password' })).rejects.toThrow(
        'Registration failed'
      );
    });

    it('handles password too weak error', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Password should be at least 6 characters' },
      });

      await expect(register({ email: 'test@example.com', password: '123' })).rejects.toThrow(
        'Password should be at least 6 characters'
      );
    });
  });

  describe('logout', () => {
    it('calls signOut', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      await logout();

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('resolves successfully on success', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      await expect(logout()).resolves.toBeUndefined();
    });

    it('throws error on sign out failure', async () => {
      mockSignOut.mockResolvedValue({
        error: { message: 'Sign out failed' },
      });

      await expect(logout()).rejects.toThrow('Sign out failed');
    });
  });

  describe('getCurrentUser', () => {
    it('returns mapped user when session exists', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { user: mockSupabaseUser } },
      });

      const result = await getCurrentUser();

      expect(result).toEqual(expectedUser);
    });

    it('returns null when no session', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
      });

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });

    it('returns null when session has no user', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { user: null } },
      });

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });

    it('handles user with missing email', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-789',
              created_at: '2024-06-01T00:00:00Z',
            },
          },
        },
      });

      const result = await getCurrentUser();

      expect(result?.email).toBe('');
      expect(result?.id).toBe('user-789');
    });
  });

  describe('onAuthStateChange', () => {
    it('calls supabase onAuthStateChange', () => {
      mockOnAuthStateChange.mockReturnValue({ data: { subscription: {} } });

      const callback = vi.fn();
      onAuthStateChange(callback);

      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    it('passes callback that maps user on session', () => {
      let capturedCallback: (event: string, session: unknown) => void;
      mockOnAuthStateChange.mockImplementation((cb) => {
        capturedCallback = cb;
        return { data: { subscription: {} } };
      });

      const userCallback = vi.fn();
      onAuthStateChange(userCallback);

      // Simulate auth state change with session
      capturedCallback!('SIGNED_IN', { user: mockSupabaseUser });

      expect(userCallback).toHaveBeenCalledWith(expectedUser);
    });

    it('passes null to callback when no session', () => {
      let capturedCallback: (event: string, session: unknown) => void;
      mockOnAuthStateChange.mockImplementation((cb) => {
        capturedCallback = cb;
        return { data: { subscription: {} } };
      });

      const userCallback = vi.fn();
      onAuthStateChange(userCallback);

      // Simulate auth state change without session
      capturedCallback!('SIGNED_OUT', null);

      expect(userCallback).toHaveBeenCalledWith(null);
    });

    it('passes null to callback when session has no user', () => {
      let capturedCallback: (event: string, session: unknown) => void;
      mockOnAuthStateChange.mockImplementation((cb) => {
        capturedCallback = cb;
        return { data: { subscription: {} } };
      });

      const userCallback = vi.fn();
      onAuthStateChange(userCallback);

      // Simulate auth state change with session but no user
      capturedCallback!('TOKEN_REFRESHED', { user: null });

      expect(userCallback).toHaveBeenCalledWith(null);
    });

    it('returns subscription from supabase', () => {
      const mockSubscription = { unsubscribe: vi.fn() };
      mockOnAuthStateChange.mockReturnValue({ data: { subscription: mockSubscription } });

      const result = onAuthStateChange(vi.fn());

      expect(result).toEqual({ data: { subscription: mockSubscription } });
    });
  });

  describe('user mapping', () => {
    it('correctly maps all user fields', async () => {
      const fullUser = {
        id: 'full-user-id',
        email: 'full@example.com',
        created_at: '2024-12-01T12:00:00Z',
      };

      mockSignInWithPassword.mockResolvedValue({
        data: { user: fullUser },
        error: null,
      });

      const result = await login({ email: 'full@example.com', password: 'pass' });

      expect(result).toEqual({
        id: 'full-user-id',
        email: 'full@example.com',
        createdAt: '2024-12-01T12:00:00Z',
      });
    });

    it('handles empty email gracefully', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-no-email',
            email: undefined,
            created_at: '2024-01-01T00:00:00Z',
          },
        },
        error: null,
      });

      const result = await login({ email: '', password: 'pass' });

      expect(result.email).toBe('');
    });
  });
});
