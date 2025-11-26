import { useState, useEffect, useCallback } from 'react';
import { getEvents } from '@/api/events';
import type { HealthEvent, EventFilters, PaginationParams, PaginatedResponse } from '@/types';

interface UseEventsOptions {
  filters?: EventFilters;
  pagination?: PaginationParams;
  autoFetch?: boolean;
}

interface UseEventsReturn {
  events: HealthEvent[];
  total: number;
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useEvents(options: UseEventsOptions = {}): UseEventsReturn {
  const { filters, pagination, autoFetch = true } = options;
  const [data, setData] = useState<PaginatedResponse<HealthEvent> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (append = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const currentPage = append && data ? data.page + 1 : pagination?.page || 1;
      const response = await getEvents(filters, {
        ...pagination,
        page: currentPage,
      });

      if (append && data) {
        setData({
          ...response,
          data: [...data.data, ...response.data],
        });
      } else {
        setData(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination, data]);

  const refetch = useCallback(async () => {
    await fetchEvents(false);
  }, [fetchEvents]);

  const loadMore = useCallback(async () => {
    if (data?.hasMore && !isLoading) {
      await fetchEvents(true);
    }
  }, [data?.hasMore, isLoading, fetchEvents]);

  useEffect(() => {
    if (autoFetch) {
      fetchEvents(false);
    }
  }, [autoFetch]); // Only run on mount and when autoFetch changes

  // Refetch when filters change
  useEffect(() => {
    if (autoFetch && filters) {
      fetchEvents(false);
    }
  }, [JSON.stringify(filters)]);

  return {
    events: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    hasMore: data?.hasMore || false,
    isLoading,
    error,
    refetch,
    loadMore,
  };
}
