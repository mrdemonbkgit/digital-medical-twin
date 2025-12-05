import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEvent } from './useEvent';
import type { HealthEvent } from '@/types';

// Mock events API
const mockGetEvent = vi.fn();

vi.mock('@/api/events', () => ({
  getEvent: (id: string) => mockGetEvent(id),
}));

const mockEvent: HealthEvent = {
  id: 'event-123',
  user_id: 'user-456',
  type: 'lab_result',
  date: '2024-01-15',
  title: 'Blood Test Results',
  description: 'Annual blood work',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

describe('useEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('returns null event when no id provided', () => {
      const { result } = renderHook(() => useEvent(undefined));

      expect(result.current.event).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('returns loading true during fetch', async () => {
      mockGetEvent.mockReturnValue(new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useEvent('event-123'));

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('successful fetch', () => {
    it('fetches event by id', async () => {
      mockGetEvent.mockResolvedValue(mockEvent);

      const { result } = renderHook(() => useEvent('event-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetEvent).toHaveBeenCalledWith('event-123');
    });

    it('returns event data on success', async () => {
      mockGetEvent.mockResolvedValue(mockEvent);

      const { result } = renderHook(() => useEvent('event-123'));

      await waitFor(() => {
        expect(result.current.event).toEqual(mockEvent);
      });

      expect(result.current.error).toBeNull();
    });

    it('sets loading to false after fetch', async () => {
      mockGetEvent.mockResolvedValue(mockEvent);

      const { result } = renderHook(() => useEvent('event-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('event not found', () => {
    it('sets error when event not found', async () => {
      mockGetEvent.mockResolvedValue(null);

      const { result } = renderHook(() => useEvent('nonexistent'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.event).toBeNull();
      expect(result.current.error).toBe('Event not found');
    });
  });

  describe('error handling', () => {
    it('sets error on fetch failure', async () => {
      mockGetEvent.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useEvent('event-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.event).toBeNull();
      expect(result.current.error).toBe('Network error');
    });

    it('handles non-Error rejections', async () => {
      mockGetEvent.mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useEvent('event-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch event');
    });

    it('clears error before new fetch', async () => {
      mockGetEvent.mockRejectedValueOnce(new Error('First error'));
      mockGetEvent.mockResolvedValueOnce(mockEvent);

      const { result, rerender } = renderHook(({ id }) => useEvent(id), {
        initialProps: { id: 'event-1' },
      });

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      rerender({ id: 'event-2' });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.event).toEqual(mockEvent);
      });
    });
  });

  describe('id changes', () => {
    it('fetches new event when id changes', async () => {
      const event1 = { ...mockEvent, id: 'event-1', title: 'Event 1' };
      const event2 = { ...mockEvent, id: 'event-2', title: 'Event 2' };

      mockGetEvent.mockResolvedValueOnce(event1);
      mockGetEvent.mockResolvedValueOnce(event2);

      const { result, rerender } = renderHook(({ id }) => useEvent(id), {
        initialProps: { id: 'event-1' },
      });

      await waitFor(() => {
        expect(result.current.event?.id).toBe('event-1');
      });

      rerender({ id: 'event-2' });

      await waitFor(() => {
        expect(result.current.event?.id).toBe('event-2');
      });

      expect(mockGetEvent).toHaveBeenCalledTimes(2);
    });

    it('clears event when id becomes undefined', async () => {
      mockGetEvent.mockResolvedValue(mockEvent);

      const { result, rerender } = renderHook(({ id }) => useEvent(id), {
        initialProps: { id: 'event-123' as string | undefined },
      });

      await waitFor(() => {
        expect(result.current.event).toEqual(mockEvent);
      });

      rerender({ id: undefined });

      expect(result.current.event).toBeNull();
    });
  });

  describe('refetch', () => {
    it('provides refetch function', async () => {
      mockGetEvent.mockResolvedValue(mockEvent);

      const { result } = renderHook(() => useEvent('event-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
    });

    it('refetches event when refetch called', async () => {
      mockGetEvent.mockResolvedValue(mockEvent);

      const { result } = renderHook(() => useEvent('event-123'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetEvent).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockGetEvent).toHaveBeenCalledTimes(2);
    });

    it('updates event data on refetch', async () => {
      const updatedEvent = { ...mockEvent, title: 'Updated Title' };
      mockGetEvent.mockResolvedValueOnce(mockEvent);
      mockGetEvent.mockResolvedValueOnce(updatedEvent);

      const { result } = renderHook(() => useEvent('event-123'));

      await waitFor(() => {
        expect(result.current.event?.title).toBe('Blood Test Results');
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.event?.title).toBe('Updated Title');
    });

    it('refetch does nothing when id is undefined', async () => {
      const { result } = renderHook(() => useEvent(undefined));

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockGetEvent).not.toHaveBeenCalled();
    });
  });
});
