import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRequireProfile, useProfileStatus } from './useRequireProfile';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard', search: '' }),
}));

// Mock useUserProfile
const mockUseUserProfile = vi.fn();
vi.mock('./useUserProfile', () => ({
  useUserProfile: () => mockUseUserProfile(),
}));

describe('useRequireProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when loading', () => {
    it('returns isLoading true', () => {
      mockUseUserProfile.mockReturnValue({
        profile: null,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useRequireProfile());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.profile).toBeNull();
      expect(result.current.isComplete).toBe(false);
    });

    it('does not redirect while loading', () => {
      mockUseUserProfile.mockReturnValue({
        profile: null,
        isLoading: true,
        error: null,
      });

      renderHook(() => useRequireProfile());

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('when profile is complete', () => {
    it('returns profile and isComplete true', () => {
      const mockProfile = {
        id: '1',
        displayName: 'Test User',
        profileComplete: true,
      };
      mockUseUserProfile.mockReturnValue({
        profile: mockProfile,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useRequireProfile());

      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.isComplete).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('does not redirect when profile is complete', () => {
      mockUseUserProfile.mockReturnValue({
        profile: { id: '1', profileComplete: true },
        isLoading: false,
        error: null,
      });

      renderHook(() => useRequireProfile());

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('when profile is incomplete', () => {
    it('redirects to profile setup by default', async () => {
      mockUseUserProfile.mockReturnValue({
        profile: { id: '1', profileComplete: false },
        isLoading: false,
        error: null,
      });

      renderHook(() => useRequireProfile());

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/profile/setup?returnTo=%2Fdashboard',
          { replace: true }
        );
      });
    });

    it('uses custom redirect path when provided', async () => {
      mockUseUserProfile.mockReturnValue({
        profile: { id: '1', profileComplete: false },
        isLoading: false,
        error: null,
      });

      renderHook(() => useRequireProfile({ redirectPath: '/custom/setup' }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/custom/setup?returnTo=%2Fdashboard',
          { replace: true }
        );
      });
    });

    it('does not redirect when redirectOnIncomplete is false', () => {
      mockUseUserProfile.mockReturnValue({
        profile: { id: '1', profileComplete: false },
        isLoading: false,
        error: null,
      });

      renderHook(() => useRequireProfile({ redirectOnIncomplete: false }));

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('when profile is null', () => {
    it('redirects to profile setup', async () => {
      mockUseUserProfile.mockReturnValue({
        profile: null,
        isLoading: false,
        error: null,
      });

      renderHook(() => useRequireProfile());

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/profile/setup?returnTo=%2Fdashboard',
          { replace: true }
        );
      });
    });

    it('returns isComplete false', () => {
      mockUseUserProfile.mockReturnValue({
        profile: null,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useRequireProfile());

      expect(result.current.isComplete).toBe(false);
    });
  });

  describe('error handling', () => {
    it('returns error from useUserProfile', () => {
      mockUseUserProfile.mockReturnValue({
        profile: null,
        isLoading: false,
        error: 'Failed to fetch profile',
      });

      const { result } = renderHook(() => useRequireProfile());

      expect(result.current.error).toBe('Failed to fetch profile');
    });
  });
});

describe('useProfileStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns hasProfile true when profile exists', () => {
    mockUseUserProfile.mockReturnValue({
      profile: { id: '1', profileComplete: false },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useProfileStatus());

    expect(result.current.hasProfile).toBe(true);
  });

  it('returns hasProfile false when profile is null', () => {
    mockUseUserProfile.mockReturnValue({
      profile: null,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useProfileStatus());

    expect(result.current.hasProfile).toBe(false);
  });

  it('returns isComplete based on profileComplete flag', () => {
    mockUseUserProfile.mockReturnValue({
      profile: { id: '1', profileComplete: true },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useProfileStatus());

    expect(result.current.isComplete).toBe(true);
  });

  it('returns isComplete false when profile is null', () => {
    mockUseUserProfile.mockReturnValue({
      profile: null,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useProfileStatus());

    expect(result.current.isComplete).toBe(false);
  });

  it('returns profile, isLoading, and error', () => {
    const mockProfile = { id: '1', displayName: 'Test', profileComplete: true };
    mockUseUserProfile.mockReturnValue({
      profile: mockProfile,
      isLoading: false,
      error: 'Some error',
    });

    const { result } = renderHook(() => useProfileStatus());

    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Some error');
  });

  it('does not trigger any redirects', () => {
    mockUseUserProfile.mockReturnValue({
      profile: null,
      isLoading: false,
      error: null,
    });

    renderHook(() => useProfileStatus());

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
