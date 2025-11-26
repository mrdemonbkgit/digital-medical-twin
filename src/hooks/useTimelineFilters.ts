import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { EventType, EventFilters } from '@/types';

const EVENT_TYPES: EventType[] = [
  'lab_result',
  'doctor_visit',
  'medication',
  'intervention',
  'metric',
];

/**
 * Hook for managing timeline filters synced to URL parameters.
 * Provides shareable/bookmarkable filter URLs.
 *
 * URL format: /timeline?type=medication&type=lab_result&q=aspirin&from=2024-01-01&to=2024-12-31
 */
export function useTimelineFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL params
  const filters = useMemo<EventFilters>(() => {
    const typeParams = searchParams.getAll('type');
    const validTypes = typeParams.filter((t) =>
      EVENT_TYPES.includes(t as EventType)
    ) as EventType[];

    return {
      eventTypes: validTypes.length > 0 ? validTypes : undefined,
      startDate: searchParams.get('from') || undefined,
      endDate: searchParams.get('to') || undefined,
      search: searchParams.get('q') || undefined,
    };
  }, [searchParams]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.eventTypes?.length ||
      filters.startDate ||
      filters.endDate ||
      filters.search
    );
  }, [filters]);

  // Count active filters for badge display
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.eventTypes?.length) count += filters.eventTypes.length;
    if (filters.startDate || filters.endDate) count += 1;
    if (filters.search) count += 1;
    return count;
  }, [filters]);

  // Update search query
  const setSearch = useCallback(
    (search: string) => {
      setSearchParams(
        (prev) => {
          if (search) {
            prev.set('q', search);
          } else {
            prev.delete('q');
          }
          return prev;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Toggle event type filter
  const toggleEventType = useCallback(
    (type: EventType) => {
      setSearchParams(
        (prev) => {
          const types = prev.getAll('type');
          const index = types.indexOf(type);

          // Clear all type params first
          prev.delete('type');

          if (index === -1) {
            // Add the type
            [...types, type].forEach((t) => prev.append('type', t));
          } else {
            // Remove the type
            types.filter((t) => t !== type).forEach((t) => prev.append('type', t));
          }

          return prev;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Set date range
  const setDateRange = useCallback(
    (startDate?: string, endDate?: string) => {
      setSearchParams(
        (prev) => {
          if (startDate) {
            prev.set('from', startDate);
          } else {
            prev.delete('from');
          }
          if (endDate) {
            prev.set('to', endDate);
          } else {
            prev.delete('to');
          }
          return prev;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  // Clear just event type filters
  const clearEventTypes = useCallback(() => {
    setSearchParams(
      (prev) => {
        prev.delete('type');
        return prev;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  return {
    filters,
    hasActiveFilters,
    activeFilterCount,
    setSearch,
    toggleEventType,
    setDateRange,
    clearFilters,
    clearEventTypes,
  };
}
