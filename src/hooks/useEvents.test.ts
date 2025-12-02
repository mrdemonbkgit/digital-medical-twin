import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEvents } from './useEvents';
import type { HealthEvent, PaginatedResponse } from '@/types';

// Mock the API module
const mockGetEvents = vi.fn();

vi.mock('@/api/events', () => ({
  getEvents: (filters: unknown, pagination: unknown) => mockGetEvents(filters, pagination),
}));

const mockEvents: HealthEvent[] = [
  {
    id: 'event-1',
    userId: 'user-123',
    type: 'lab_result',
    date: '2024-01-01',
    title: 'Blood Work',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    biomarkers: [{ name: 'LDL', value: 100, unit: 'mg/dL' }],
  } as HealthEvent,
  {
    id: 'event-2',
    userId: 'user-123',
    type: 'doctor_visit',
    date: '2024-01-15',
    title: 'Annual Checkup',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    doctorName: 'Dr. Smith',
  } as HealthEvent,
];

const mockPaginatedResponse: PaginatedResponse<HealthEvent> = {
  data: mockEvents,
  total: 2,
  page: 1,
  limit: 20,
  hasMore: false,
};

describe('useEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEvents.mockResolvedValue(mockPaginatedResponse);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns initial state before fetch', () => {
    mockGetEvents.mockImplementation(() => new Promise(() => {})); // Never resolves
    const { result } = renderHook(() => useEvents());

    expect(result.current.events).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.page).toBe(1);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('fetches events on mount by default', async () => {
    const { result } = renderHook(() => useEvents());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetEvents).toHaveBeenCalled();
    expect(result.current.events).toHaveLength(2);
    expect(result.current.total).toBe(2);
  });

  it('does not fetch on mount when autoFetch is false', async () => {
    const { result } = renderHook(() => useEvents({ autoFetch: false }));

    // Give time for any fetch to occur
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockGetEvents).not.toHaveBeenCalled();
    expect(result.current.events).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('passes filters to API', async () => {
    const filters = {
      eventTypes: ['lab_result' as const],
      startDate: '2024-01-01',
    };

    renderHook(() => useEvents({ filters }));

    await waitFor(() => {
      expect(mockGetEvents).toHaveBeenCalled();
    });

    expect(mockGetEvents).toHaveBeenCalledWith(filters, expect.any(Object));
  });

  it('passes pagination to API', async () => {
    const pagination = { page: 2, limit: 10 };

    renderHook(() => useEvents({ pagination }));

    await waitFor(() => {
      expect(mockGetEvents).toHaveBeenCalled();
    });

    expect(mockGetEvents).toHaveBeenCalledWith(undefined, { page: 2, limit: 10 });
  });

  it('handles fetch error gracefully', async () => {
    mockGetEvents.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useEvents());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.events).toEqual([]);
  });

  it('handles non-Error objects in catch', async () => {
    mockGetEvents.mockRejectedValue('string error');

    const { result } = renderHook(() => useEvents());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch events');
  });

  describe('refetch', () => {
    it('reloads events from API', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetEvents).toHaveBeenCalledTimes(1);

      // Update mock response
      mockGetEvents.mockResolvedValueOnce({
        data: [mockEvents[0]],
        total: 1,
        page: 1,
        limit: 20,
        hasMore: false,
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockGetEvents).toHaveBeenCalledTimes(2);
      expect(result.current.events).toHaveLength(1);
    });

    it('clears error on successful refetch', async () => {
      mockGetEvents.mockRejectedValueOnce(new Error('Initial error'));

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.error).toBe('Initial error');
      });

      mockGetEvents.mockResolvedValueOnce(mockPaginatedResponse);

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.events).toHaveLength(2);
    });
  });

  describe('loadMore', () => {
    it('appends events from next page', async () => {
      const firstPage: PaginatedResponse<HealthEvent> = {
        data: [mockEvents[0]],
        total: 2,
        page: 1,
        limit: 1,
        hasMore: true,
      };

      const secondPage: PaginatedResponse<HealthEvent> = {
        data: [mockEvents[1]],
        total: 2,
        page: 2,
        limit: 1,
        hasMore: false,
      };

      mockGetEvents.mockResolvedValueOnce(firstPage);

      const { result } = renderHook(() => useEvents({ pagination: { limit: 1 } }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.hasMore).toBe(true);

      mockGetEvents.mockResolvedValueOnce(secondPage);

      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.events).toHaveLength(2);
      expect(result.current.events[0].id).toBe('event-1');
      expect(result.current.events[1].id).toBe('event-2');
      expect(result.current.hasMore).toBe(false);
    });

    it('does not load more when hasMore is false', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMore).toBe(false);
      mockGetEvents.mockClear();

      await act(async () => {
        await result.current.loadMore();
      });

      expect(mockGetEvents).not.toHaveBeenCalled();
    });

    it('does not load more while loading', async () => {
      const firstPage: PaginatedResponse<HealthEvent> = {
        data: [mockEvents[0]],
        total: 2,
        page: 1,
        limit: 1,
        hasMore: true,
      };

      mockGetEvents.mockResolvedValueOnce(firstPage);

      const { result } = renderHook(() => useEvents({ pagination: { limit: 1 } }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start a slow loadMore
      let resolveLoadMore: (value: PaginatedResponse<HealthEvent>) => void;
      mockGetEvents.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveLoadMore = resolve;
          })
      );

      act(() => {
        result.current.loadMore();
      });

      expect(result.current.isLoading).toBe(true);
      mockGetEvents.mockClear();

      // Try to load more while loading
      await act(async () => {
        await result.current.loadMore();
      });

      // Should not have called getEvents again
      expect(mockGetEvents).not.toHaveBeenCalled();

      // Resolve first loadMore
      await act(async () => {
        resolveLoadMore!({
          data: [mockEvents[1]],
          total: 2,
          page: 2,
          limit: 1,
          hasMore: false,
        });
      });
    });

    it('increments page number for loadMore', async () => {
      const firstPage: PaginatedResponse<HealthEvent> = {
        data: [mockEvents[0]],
        total: 2,
        page: 1,
        limit: 1,
        hasMore: true,
      };

      mockGetEvents.mockResolvedValueOnce(firstPage);

      const { result } = renderHook(() => useEvents({ pagination: { limit: 1 } }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockGetEvents.mockResolvedValueOnce({
        data: [mockEvents[1]],
        total: 2,
        page: 2,
        limit: 1,
        hasMore: false,
      });

      await act(async () => {
        await result.current.loadMore();
      });

      // Should have called with page: 2
      expect(mockGetEvents).toHaveBeenLastCalledWith(undefined, expect.objectContaining({ page: 2 }));
    });
  });

  describe('filter changes', () => {
    it('refetches when filters change', async () => {
      const { result, rerender } = renderHook(
        ({ filters }) => useEvents({ filters }),
        { initialProps: { filters: { eventTypes: ['lab_result' as const] } } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initial fetch may be called multiple times due to two useEffects
      // (one for autoFetch, one for filters) - that's expected behavior
      const initialCallCount = mockGetEvents.mock.calls.length;

      // Change filters
      rerender({ filters: { eventTypes: ['doctor_visit' as const] } });

      await waitFor(() => {
        expect(mockGetEvents.mock.calls.length).toBeGreaterThan(initialCallCount);
      });

      expect(mockGetEvents).toHaveBeenLastCalledWith(
        { eventTypes: ['doctor_visit'] },
        expect.any(Object)
      );
    });
  });
});
