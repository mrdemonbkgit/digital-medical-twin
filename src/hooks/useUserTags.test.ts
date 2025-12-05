import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUserTags } from './useUserTags';

// Mock events API
const mockGetUserTags = vi.fn();

vi.mock('@/api/events', () => ({
  getUserTags: () => mockGetUserTags(),
}));

const mockTags = ['important', 'follow-up', 'urgent', 'routine'];

describe('useUserTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('returns loading true initially', () => {
      mockGetUserTags.mockReturnValue(new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useUserTags());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.tags).toEqual([]);
    });
  });

  describe('successful fetch', () => {
    it('fetches user tags on mount', async () => {
      mockGetUserTags.mockResolvedValue(mockTags);

      const { result } = renderHook(() => useUserTags());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetUserTags).toHaveBeenCalled();
    });

    it('returns tags on success', async () => {
      mockGetUserTags.mockResolvedValue(mockTags);

      const { result } = renderHook(() => useUserTags());

      await waitFor(() => {
        expect(result.current.tags).toEqual(mockTags);
      });

      expect(result.current.error).toBeNull();
    });

    it('sets loading to false after fetch', async () => {
      mockGetUserTags.mockResolvedValue(mockTags);

      const { result } = renderHook(() => useUserTags());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('handles empty tags array', async () => {
      mockGetUserTags.mockResolvedValue([]);

      const { result } = renderHook(() => useUserTags());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tags).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('error handling', () => {
    it('sets error on fetch failure', async () => {
      mockGetUserTags.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useUserTags());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.tags).toEqual([]);
    });

    it('handles non-Error rejections', async () => {
      mockGetUserTags.mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useUserTags());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load tags');
    });

    it('clears error on successful fetch', async () => {
      mockGetUserTags.mockResolvedValue(mockTags);

      const { result } = renderHook(() => useUserTags());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });
  });
});
