import { useState, useEffect, useCallback } from 'react';
import {
  getUserProfile,
  upsertUserProfile,
  updateUserProfile,
  markProfileComplete,
} from '@/api/userProfile';
import type {
  UserProfile,
  CreateUserProfileInput,
  UpdateUserProfileInput,
} from '@/types';

interface UseUserProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (input: CreateUserProfileInput) => Promise<UserProfile>;
  update: (input: UpdateUserProfileInput) => Promise<UserProfile>;
  complete: () => Promise<UserProfile>;
  isCreating: boolean;
  isUpdating: boolean;
}

export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getUserProfile();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const create = useCallback(async (input: CreateUserProfileInput): Promise<UserProfile> => {
    setIsCreating(true);
    setError(null);

    try {
      // Use upsert to handle case where profile already exists
      const newProfile = await upsertUserProfile(input);
      setProfile(newProfile);
      return newProfile;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create profile';
      setError(message);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const update = useCallback(async (input: UpdateUserProfileInput): Promise<UserProfile> => {
    setIsUpdating(true);
    setError(null);

    try {
      const updatedProfile = await updateUserProfile(input);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const complete = useCallback(async (): Promise<UserProfile> => {
    setIsUpdating(true);
    setError(null);

    try {
      const updatedProfile = await markProfileComplete();
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete profile';
      setError(message);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refetch,
    create,
    update,
    complete,
    isCreating,
    isUpdating,
  };
}
