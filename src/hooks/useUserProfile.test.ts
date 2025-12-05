import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useUserProfile } from './useUserProfile';
import type { UserProfile, CreateUserProfileInput, UpdateUserProfileInput } from '@/types';

// Mock the API module
vi.mock('@/api/userProfile', () => ({
  getUserProfile: vi.fn(),
  upsertUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  markProfileComplete: vi.fn(),
}));

import {
  getUserProfile,
  upsertUserProfile,
  updateUserProfile,
  markProfileComplete,
} from '@/api/userProfile';

const mockProfile: UserProfile = {
  id: 'profile-1',
  userId: 'user-123',
  displayName: 'John Doe',
  gender: 'male',
  dateOfBirth: '1990-01-15',
  heightCm: 180,
  weightKg: 75,
  medicalConditions: ['hypertension'],
  currentMedications: ['lisinopril'],
  allergies: ['penicillin'],
  surgicalHistory: ['appendectomy'],
  familyHistory: { diabetes: true },
  smokingStatus: 'never',
  alcoholFrequency: 'occasional',
  exerciseFrequency: 'regular',
  profileComplete: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

describe('useUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initial state', () => {
    it('starts with loading true', () => {
      vi.mocked(getUserProfile).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useUserProfile());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.profile).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('fetching profile', () => {
    it('fetches profile on mount', async () => {
      vi.mocked(getUserProfile).mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(getUserProfile).toHaveBeenCalled();
      expect(result.current.profile).toEqual(mockProfile);
    });

    it('returns null when no profile exists', async () => {
      vi.mocked(getUserProfile).mockResolvedValue(null);

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('handles fetch error with Error instance', async () => {
      vi.mocked(getUserProfile).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.profile).toBeNull();
    });

    it('handles non-Error fetch exception', async () => {
      vi.mocked(getUserProfile).mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch profile');
    });
  });

  describe('refetch', () => {
    it('refetches profile when called', async () => {
      vi.mocked(getUserProfile).mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(getUserProfile).toHaveBeenCalledTimes(1);

      // Trigger refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(getUserProfile).toHaveBeenCalledTimes(2);
    });

    it('updates profile after refetch', async () => {
      vi.mocked(getUserProfile).mockResolvedValueOnce(mockProfile);

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedProfile = { ...mockProfile, displayName: 'Jane Doe' };
      vi.mocked(getUserProfile).mockResolvedValueOnce(updatedProfile);

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.profile?.displayName).toBe('Jane Doe');
    });
  });

  describe('create', () => {
    it('creates profile and updates state', async () => {
      vi.mocked(getUserProfile).mockResolvedValue(null);
      vi.mocked(upsertUserProfile).mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const input: CreateUserProfileInput = {
        gender: 'male',
        dateOfBirth: '1990-01-15',
      };

      let createdProfile: UserProfile | undefined;
      await act(async () => {
        createdProfile = await result.current.create(input);
      });

      expect(createdProfile).toEqual(mockProfile);
      expect(result.current.profile).toEqual(mockProfile);
      expect(upsertUserProfile).toHaveBeenCalledWith(input);
    });

    it('sets isCreating during create operation', async () => {
      vi.mocked(getUserProfile).mockResolvedValue(null);

      let resolvePromise: (value: UserProfile) => void;
      vi.mocked(upsertUserProfile).mockImplementation(
        () => new Promise((resolve) => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isCreating).toBe(false);

      const input: CreateUserProfileInput = {
        gender: 'male',
        dateOfBirth: '1990-01-15',
      };

      let createPromise: Promise<UserProfile>;
      act(() => {
        createPromise = result.current.create(input);
      });

      await waitFor(() => {
        expect(result.current.isCreating).toBe(true);
      });

      await act(async () => {
        resolvePromise!(mockProfile);
        await createPromise;
      });

      expect(result.current.isCreating).toBe(false);
    });

    it('handles create error', async () => {
      vi.mocked(getUserProfile).mockResolvedValue(null);
      vi.mocked(upsertUserProfile).mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.create({
            gender: 'male',
            dateOfBirth: '1990-01-15',
          });
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Create failed');
      expect(result.current.error).toBe('Create failed');
      expect(result.current.isCreating).toBe(false);
    });
  });

  describe('update', () => {
    it('updates profile and state', async () => {
      vi.mocked(getUserProfile).mockResolvedValue(mockProfile);
      const updatedProfile = { ...mockProfile, displayName: 'Jane Doe' };
      vi.mocked(updateUserProfile).mockResolvedValue(updatedProfile);

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const input: UpdateUserProfileInput = { displayName: 'Jane Doe' };

      let updated: UserProfile | undefined;
      await act(async () => {
        updated = await result.current.update(input);
      });

      expect(updated?.displayName).toBe('Jane Doe');
      expect(result.current.profile?.displayName).toBe('Jane Doe');
      expect(updateUserProfile).toHaveBeenCalledWith(input);
    });

    it('sets isUpdating during update operation', async () => {
      vi.mocked(getUserProfile).mockResolvedValue(mockProfile);

      let resolvePromise: (value: UserProfile) => void;
      vi.mocked(updateUserProfile).mockImplementation(
        () => new Promise((resolve) => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isUpdating).toBe(false);

      let updatePromise: Promise<UserProfile>;
      act(() => {
        updatePromise = result.current.update({ displayName: 'Test' });
      });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(true);
      });

      await act(async () => {
        resolvePromise!(mockProfile);
        await updatePromise;
      });

      expect(result.current.isUpdating).toBe(false);
    });

    it('handles update error', async () => {
      vi.mocked(getUserProfile).mockResolvedValue(mockProfile);
      vi.mocked(updateUserProfile).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.update({ displayName: 'Test' });
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Update failed');
      expect(result.current.error).toBe('Update failed');
      expect(result.current.isUpdating).toBe(false);
    });
  });

  describe('complete', () => {
    it('marks profile as complete', async () => {
      vi.mocked(getUserProfile).mockResolvedValue(mockProfile);
      const completedProfile = { ...mockProfile, profileComplete: true };
      vi.mocked(markProfileComplete).mockResolvedValue(completedProfile);

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let completed: UserProfile | undefined;
      await act(async () => {
        completed = await result.current.complete();
      });

      expect(completed?.profileComplete).toBe(true);
      expect(result.current.profile?.profileComplete).toBe(true);
      expect(markProfileComplete).toHaveBeenCalled();
    });

    it('sets isUpdating during complete operation', async () => {
      vi.mocked(getUserProfile).mockResolvedValue(mockProfile);

      let resolvePromise: (value: UserProfile) => void;
      vi.mocked(markProfileComplete).mockImplementation(
        () => new Promise((resolve) => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isUpdating).toBe(false);

      let completePromise: Promise<UserProfile>;
      act(() => {
        completePromise = result.current.complete();
      });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(true);
      });

      const completedProfile = { ...mockProfile, profileComplete: true };
      await act(async () => {
        resolvePromise!(completedProfile);
        await completePromise;
      });

      expect(result.current.isUpdating).toBe(false);
    });

    it('handles complete error', async () => {
      vi.mocked(getUserProfile).mockResolvedValue(mockProfile);
      vi.mocked(markProfileComplete).mockRejectedValue(new Error('Complete failed'));

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.complete();
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Complete failed');
      expect(result.current.error).toBe('Complete failed');
    });

    it('handles non-Error complete exception', async () => {
      vi.mocked(getUserProfile).mockResolvedValue(mockProfile);
      vi.mocked(markProfileComplete).mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.complete();
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Failed to complete profile');
    });
  });

  describe('error clearing', () => {
    it('clears error on new create operation', async () => {
      vi.mocked(getUserProfile).mockResolvedValue(null);
      vi.mocked(upsertUserProfile).mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.create({ gender: 'male', dateOfBirth: '1990-01-15' });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('First error');

      vi.mocked(upsertUserProfile).mockResolvedValue(mockProfile);

      await act(async () => {
        await result.current.create({ gender: 'male', dateOfBirth: '1990-01-15' });
      });

      expect(result.current.error).toBeNull();
    });

    it('clears error on new update operation', async () => {
      vi.mocked(getUserProfile).mockResolvedValue(mockProfile);
      vi.mocked(updateUserProfile).mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.update({ displayName: 'Test' });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('First error');

      vi.mocked(updateUserProfile).mockResolvedValue(mockProfile);

      await act(async () => {
        await result.current.update({ displayName: 'Test' });
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('return values', () => {
    it('returns all expected properties', async () => {
      vi.mocked(getUserProfile).mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useUserProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('profile');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');
      expect(result.current).toHaveProperty('create');
      expect(result.current).toHaveProperty('update');
      expect(result.current).toHaveProperty('complete');
      expect(result.current).toHaveProperty('isCreating');
      expect(result.current).toHaveProperty('isUpdating');

      expect(typeof result.current.refetch).toBe('function');
      expect(typeof result.current.create).toBe('function');
      expect(typeof result.current.update).toBe('function');
      expect(typeof result.current.complete).toBe('function');
    });
  });
});
