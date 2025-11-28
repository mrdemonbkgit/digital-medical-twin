import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserProfile } from './useUserProfile';
import type { UserProfile } from '@/types';

interface UseRequireProfileOptions {
  // If true, redirect to profile setup if profile is incomplete
  redirectOnIncomplete?: boolean;
  // Custom redirect path (defaults to /profile/setup)
  redirectPath?: string;
}

interface UseRequireProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  isComplete: boolean;
  error: string | null;
}

/**
 * Hook that requires a complete user profile before allowing access.
 * Redirects to profile setup page if profile is missing or incomplete.
 *
 * Usage:
 * ```tsx
 * function ProtectedPage() {
 *   const { profile, isLoading, isComplete } = useRequireProfile();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (!isComplete) return null; // Will redirect
 *
 *   return <div>Welcome, {profile.displayName}!</div>;
 * }
 * ```
 */
export function useRequireProfile(
  options: UseRequireProfileOptions = {}
): UseRequireProfileReturn {
  const { redirectOnIncomplete = true, redirectPath = '/profile/setup' } = options;

  const { profile, isLoading, error } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const isComplete = profile?.profileComplete ?? false;

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // Don't redirect if already on setup page
    if (location.pathname.startsWith('/profile')) return;

    // Redirect if profile is missing or incomplete
    if (redirectOnIncomplete && !isComplete) {
      // Store the intended destination to redirect back after profile completion
      const returnTo = location.pathname + location.search;
      navigate(`${redirectPath}?returnTo=${encodeURIComponent(returnTo)}`, {
        replace: true,
      });
    }
  }, [isLoading, isComplete, redirectOnIncomplete, redirectPath, navigate, location]);

  return {
    profile,
    isLoading,
    isComplete,
    error,
  };
}

/**
 * Hook to check profile status without redirecting.
 * Useful for conditional rendering or showing prompts.
 */
export function useProfileStatus() {
  const { profile, isLoading, error } = useUserProfile();

  return {
    hasProfile: profile !== null,
    isComplete: profile?.profileComplete ?? false,
    profile,
    isLoading,
    error,
  };
}
