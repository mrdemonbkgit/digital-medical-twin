import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReactNode } from 'react';
import { useRequireProfile, useProfileStatus } from './useRequireProfile';
import type { UserProfile } from '@/types';

// Mock useUserProfile
const mockUseUserProfile = vi.fn();

vi.mock('./useUserProfile', () => ({
  useUserProfile: () => mockUseUserProfile(),
}));

// Mock react-router-dom navigation
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockProfile: UserProfile = {
  id: 'profile-123',
  user_id: 'user-123',
  display_name: 'John Doe',
  date_of_birth: '1990-01-01',
  biological_sex: 'male',
  profileComplete: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const incompleteProfile: UserProfile = {
  ...mockProfile,
  profileComplete: false,
};

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={['/dashboard']}>{children}</MemoryRouter>;
}

function profilePageWrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={['/profile/setup']}>{children}</MemoryRouter>;
}

describe('useRequireProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserProfile.mockReturnValue({
      profile: null,
      isLoading: false,
      error: null,
    });
  });

  describe('initial state', () => {
    it('returns loading state from useUserProfile', () => {
      mockUseUserProfile.mockReturnValue({
        profile: null,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useRequireProfile(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });

    it('returns profile when available', async () => {
      mockUseUserProfile.mockReturnValue({
        profile: mockProfile,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useRequireProfile(), { wrapper });

      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.isComplete).toBe(true);
    });

    it('returns null profile when not available', () => {
      mockUseUserProfile.mockReturnValue({
        profile: null,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useRequireProfile(), { wrapper });

      expect(result.current.profile).toBeNull();
      expect(result.current.isComplete).toBe(false);
    });
  });

  describe('redirect behavior', () => {
    it('redirects to profile setup when profile is incomplete', async () => {
      mockUseUserProfile.mockReturnValue({
        profile: incompleteProfile,
        isLoading: false,
        error: null,
      });

      renderHook(() => useRequireProfile(), { wrapper });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/profile/setup?returnTo=%2Fdashboard',
          { replace: true }
        );
      });
    });

    it('redirects to profile setup when profile is null', async () => {
      mockUseUserProfile.mockReturnValue({
        profile: null,
        isLoading: false,
        error: null,
      });

      renderHook(() => useRequireProfile(), { wrapper });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/profile/setup?returnTo=%2Fdashboard',
          { replace: true }
        );
      });
    });

    it('does not redirect when profile is complete', async () => {
      mockUseUserProfile.mockReturnValue({
        profile: mockProfile,
        isLoading: false,
        error: null,
      });

      renderHook(() => useRequireProfile(), { wrapper });

      // Wait a bit to ensure no redirect happens
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not redirect while loading', async () => {
      mockUseUserProfile.mockReturnValue({
        profile: null,
        isLoading: true,
        error: null,
      });

      renderHook(() => useRequireProfile(), { wrapper });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not redirect when already on profile page', async () => {
      mockUseUserProfile.mockReturnValue({
        profile: null,
        isLoading: false,
        error: null,
      });

      renderHook(() => useRequireProfile(), { wrapper: profilePageWrapper });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('options', () => {
    it('respects redirectOnIncomplete: false', async () => {
      mockUseUserProfile.mockReturnValue({
        profile: null,
        isLoading: false,
        error: null,
      });

      renderHook(() => useRequireProfile({ redirectOnIncomplete: false }), {
        wrapper,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('uses custom redirect path', async () => {
      mockUseUserProfile.mockReturnValue({
        profile: null,
        isLoading: false,
        error: null,
      });

      renderHook(() => useRequireProfile({ redirectPath: '/onboarding' }), {
        wrapper,
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/onboarding?returnTo=%2Fdashboard',
          { replace: true }
        );
      });
    });
  });

  describe('error handling', () => {
    it('returns error from useUserProfile', () => {
      mockUseUserProfile.mockReturnValue({
        profile: null,
        isLoading: false,
        error: 'Failed to load profile',
      });

      const { result } = renderHook(() => useRequireProfile(), { wrapper });

      expect(result.current.error).toBe('Failed to load profile');
    });
  });
});

describe('useProfileStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns hasProfile true when profile exists', () => {
    mockUseUserProfile.mockReturnValue({
      profile: mockProfile,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useProfileStatus(), { wrapper });

    expect(result.current.hasProfile).toBe(true);
  });

  it('returns hasProfile false when no profile', () => {
    mockUseUserProfile.mockReturnValue({
      profile: null,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useProfileStatus(), { wrapper });

    expect(result.current.hasProfile).toBe(false);
  });

  it('returns isComplete based on profileComplete', () => {
    mockUseUserProfile.mockReturnValue({
      profile: incompleteProfile,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useProfileStatus(), { wrapper });

    expect(result.current.hasProfile).toBe(true);
    expect(result.current.isComplete).toBe(false);
  });

  it('does not redirect', async () => {
    mockUseUserProfile.mockReturnValue({
      profile: null,
      isLoading: false,
      error: null,
    });

    renderHook(() => useProfileStatus(), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
