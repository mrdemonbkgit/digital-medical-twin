import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import type { User } from '@/types';

// Mock auth API
const mockGetCurrentUser = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockLogout = vi.fn();

vi.mock('@/api/auth', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
  onAuthStateChange: (callback: unknown) => mockOnAuthStateChange(callback),
  login: (credentials: unknown) => mockLogin(credentials),
  register: (credentials: unknown) => mockRegister(credentials),
  logout: () => mockLogout(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  createdAt: '2024-01-01T00:00:00Z',
};

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth', () => {
  let mockUnsubscribe: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUnsubscribe = vi.fn();

    // Default mocks
    mockGetCurrentUser.mockResolvedValue(null);
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  describe('initial state', () => {
    it('returns loading true initially', async () => {
      // Make getCurrentUser hang to capture loading state
      mockGetCurrentUser.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });

    it('returns user null initially when not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('returns user when session exists', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('sets up auth state change listener', async () => {
      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(mockOnAuthStateChange).toHaveBeenCalled();
      });
    });

    it('cleans up subscription on unmount', async () => {
      const { unmount } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(mockOnAuthStateChange).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('handles getCurrentUser error gracefully', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Session expired'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('login', () => {
    it('calls auth login with credentials', async () => {
      mockLogin.mockResolvedValue(mockUser);

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
    });

    it('sets user after successful login', async () => {
      mockLogin.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password' });
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('sets error on login failure', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));

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

      expect(result.current.error).toBe('Invalid credentials');
      expect(result.current.user).toBeNull();
    });

    it('clears error before login attempt', async () => {
      mockLogin.mockRejectedValueOnce(new Error('First error'));
      mockLogin.mockResolvedValueOnce(mockUser);

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

      // Second login should clear error
      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'right' });
      });

      expect(result.current.error).toBeNull();
    });

    it('sets isLoading during login', async () => {
      let resolveLogin: (user: User) => void;
      mockLogin.mockReturnValue(
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginPromise: Promise<void>;
      act(() => {
        loginPromise = result.current.login({ email: 'test@example.com', password: 'password' });
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveLogin!(mockUser);
        await loginPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('calls auth register with credentials', async () => {
      mockRegister.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.register({ email: 'new@example.com', password: 'newpassword' });
      });

      expect(mockRegister).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'newpassword',
      });
    });

    it('sets user after successful registration', async () => {
      mockRegister.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.register({ email: 'new@example.com', password: 'newpassword' });
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
          await result.current.register({ email: 'existing@example.com', password: 'password' });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Email already exists');
    });
  });

  describe('logout', () => {
    it('calls auth logout', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockLogout.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalled();
    });

    it('clears user after successful logout', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockLogout.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
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
  });

  describe('auth state change listener', () => {
    it('updates user when auth state changes', async () => {
      let authCallback: (user: User | null) => void;
      mockOnAuthStateChange.mockImplementation((cb) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();

      // Simulate auth state change
      act(() => {
        authCallback!(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('clears user when signed out via auth state change', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);

      let authCallback: (user: User | null) => void;
      mockOnAuthStateChange.mockImplementation((cb) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Simulate sign out via auth state change
      act(() => {
        authCallback!(null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('useAuth without provider', () => {
    it('throws error when used outside AuthProvider', () => {
      // Suppress console error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
