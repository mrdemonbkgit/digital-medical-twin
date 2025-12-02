import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import type { User } from '@/types';

// Mock the auth API module
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockLogout = vi.fn();
const mockGetCurrentUser = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/api/auth', () => ({
  login: (creds: unknown) => mockLogin(creds),
  register: (creds: unknown) => mockRegister(creds),
  logout: () => mockLogout(),
  getCurrentUser: () => mockGetCurrentUser(),
  onAuthStateChange: (cb: unknown) => mockOnAuthStateChange(cb),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  createdAt: '2024-01-01T00:00:00Z',
};

describe('AuthContext', () => {
  let mockUnsubscribe: ReturnType<typeof vi.fn>;
  let authStateCallback: ((user: User | null) => void) | null;

  beforeEach(() => {
    vi.clearAllMocks();
    authStateCallback = null;

    // Default: no existing session
    mockGetCurrentUser.mockResolvedValue(null);

    // Default: capture auth state callback for testing
    mockUnsubscribe = vi.fn();
    mockOnAuthStateChange.mockImplementation((cb: (user: User | null) => void) => {
      authStateCallback = cb;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    // Default: auth operations succeed
    mockLogin.mockResolvedValue(mockUser);
    mockRegister.mockResolvedValue(mockUser);
    mockLogout.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
    authStateCallback = null;
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('useAuth', () => {
    it('throws error when used outside AuthProvider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleError.mockRestore();
    });
  });

  describe('AuthProvider', () => {
    it('starts in loading state', () => {
      mockGetCurrentUser.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('checks for existing session on mount', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('handles no existing session', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('handles session check error gracefully', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Session error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
      // Should not set error state for initial check failure
      expect(result.current.error).toBe(null);
    });

    it('subscribes to auth state changes', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    it('updates user when auth state changes', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBe(null);

      // Simulate auth state change
      act(() => {
        authStateCallback?.(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('unsubscribes on unmount', async () => {
      const { result, unmount } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('logs in user with credentials', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password' });
      });

      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it('sets loading state during login', async () => {
      let resolveLogin: (user: User) => void;
      mockLogin.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveLogin = resolve;
          })
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.login({ email: 'test@example.com', password: 'password' });
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveLogin!(mockUser);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('sets error on login failure', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.login({ email: 'test@example.com', password: 'wrong' });
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Invalid credentials');
      expect(result.current.error).toBe('Invalid credentials');
      expect(result.current.user).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });

    it('handles non-Error objects in catch', async () => {
      mockLogin.mockRejectedValue('string error');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.login({ email: 'test@example.com', password: 'wrong' });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Login failed');
    });

    it('clears previous error on new login attempt', async () => {
      mockLogin.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First login fails
      await act(async () => {
        try {
          await result.current.login({ email: 'test@example.com', password: 'wrong' });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('First error');

      // Second login succeeds
      mockLogin.mockResolvedValueOnce(mockUser);

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'correct' });
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('register', () => {
    it('registers new user with credentials', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.register({
          email: 'new@example.com',
          password: 'password123',
        });
      });

      expect(mockRegister).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
      });
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('sets error on registration failure', async () => {
      mockRegister.mockRejectedValue(new Error('Email already exists'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.register({
            email: 'existing@example.com',
            password: 'password',
          });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Email already exists');
      expect(result.current.user).toBe(null);
    });

    it('handles non-Error objects in catch', async () => {
      mockRegister.mockRejectedValue('string error');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 10000 });

      await act(async () => {
        try {
          await result.current.register({ email: 'test@example.com', password: 'pass' });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Registration failed');
    }, 15000);
  });

  describe('logout', () => {
    it('logs out user', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalled();
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('sets error on logout failure', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockLogout.mockRejectedValue(new Error('Logout failed'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        try {
          await result.current.logout();
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Logout failed');
    });

    it('handles non-Error objects in catch', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockLogout.mockRejectedValue('string error');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        try {
          await result.current.logout();
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Logout failed');
    });
  });
});
