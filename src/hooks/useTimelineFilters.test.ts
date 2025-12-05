import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { useTimelineFilters } from './useTimelineFilters';

// Create a wrapper with MemoryRouter
function createWrapper(initialEntries: string[] = ['/']) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      MemoryRouter,
      { initialEntries },
      children
    );
  };
}

describe('useTimelineFilters', () => {
  describe('filters parsing', () => {
    it('parses event types from URL', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?type=lab_result&type=medication']),
      });

      expect(result.current.filters.eventTypes).toEqual(['lab_result', 'medication']);
    });

    it('filters invalid event types', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?type=lab_result&type=invalid_type']),
      });

      expect(result.current.filters.eventTypes).toEqual(['lab_result']);
    });

    it('returns undefined eventTypes when none provided', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/']),
      });

      expect(result.current.filters.eventTypes).toBeUndefined();
    });

    it('parses date range (from, to)', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?from=2024-01-01&to=2024-12-31']),
      });

      expect(result.current.filters.startDate).toBe('2024-01-01');
      expect(result.current.filters.endDate).toBe('2024-12-31');
    });

    it('parses search query (q)', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?q=aspirin']),
      });

      expect(result.current.filters.search).toBe('aspirin');
    });

    it('parses tags', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?tag=urgent&tag=followup']),
      });

      expect(result.current.filters.tags).toEqual(['urgent', 'followup']);
    });

    it('parses includePrivate flag', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?private=true']),
      });

      expect(result.current.filters.includePrivate).toBe(true);
    });

    it('defaults includePrivate to false', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/']),
      });

      expect(result.current.filters.includePrivate).toBe(false);
    });
  });

  describe('hasActiveFilters', () => {
    it('returns true when event types are active', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?type=lab_result']),
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('returns true when date range is set', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?from=2024-01-01']),
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('returns true when search is set', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?q=test']),
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('returns true when tags are set', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?tag=urgent']),
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('returns false when no filters', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/']),
      });

      expect(result.current.hasActiveFilters).toBe(false);
    });

    it('returns false when only private filter is set', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?private=true']),
      });

      // hasActiveFilters doesn't count includePrivate
      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  describe('activeFilterCount', () => {
    it('counts event types', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?type=lab_result&type=medication&type=doctor_visit']),
      });

      expect(result.current.activeFilterCount).toBe(3);
    });

    it('counts date range as 1', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?from=2024-01-01&to=2024-12-31']),
      });

      expect(result.current.activeFilterCount).toBe(1);
    });

    it('counts search as 1', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?q=test']),
      });

      expect(result.current.activeFilterCount).toBe(1);
    });

    it('counts each tag', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?tag=urgent&tag=followup&tag=review']),
      });

      expect(result.current.activeFilterCount).toBe(3);
    });

    it('returns 0 when no filters', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/']),
      });

      expect(result.current.activeFilterCount).toBe(0);
    });

    it('counts combined filters correctly', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?type=lab_result&type=medication&q=test&from=2024-01-01&tag=urgent']),
      });

      // 2 event types + 1 search + 1 date range + 1 tag = 5
      expect(result.current.activeFilterCount).toBe(5);
    });
  });

  describe('setSearch', () => {
    it('sets q param', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/']),
      });

      act(() => {
        result.current.setSearch('aspirin');
      });

      expect(result.current.filters.search).toBe('aspirin');
    });

    it('removes q param when empty', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?q=existing']),
      });

      act(() => {
        result.current.setSearch('');
      });

      expect(result.current.filters.search).toBeUndefined();
    });

    it('preserves other params when setting search', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?type=lab_result']),
      });

      act(() => {
        result.current.setSearch('test');
      });

      expect(result.current.filters.search).toBe('test');
      expect(result.current.filters.eventTypes).toEqual(['lab_result']);
    });
  });

  describe('toggleEventType', () => {
    it('adds type when not present', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/']),
      });

      act(() => {
        result.current.toggleEventType('lab_result');
      });

      expect(result.current.filters.eventTypes).toEqual(['lab_result']);
    });

    it('removes type when present', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?type=lab_result&type=medication']),
      });

      act(() => {
        result.current.toggleEventType('lab_result');
      });

      expect(result.current.filters.eventTypes).toEqual(['medication']);
    });

    it('can add multiple types', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/']),
      });

      act(() => {
        result.current.toggleEventType('lab_result');
      });
      act(() => {
        result.current.toggleEventType('medication');
      });

      expect(result.current.filters.eventTypes).toContain('lab_result');
      expect(result.current.filters.eventTypes).toContain('medication');
    });
  });

  describe('setDateRange', () => {
    it('sets from/to params', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/']),
      });

      act(() => {
        result.current.setDateRange('2024-01-01', '2024-12-31');
      });

      expect(result.current.filters.startDate).toBe('2024-01-01');
      expect(result.current.filters.endDate).toBe('2024-12-31');
    });

    it('removes params when undefined', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?from=2024-01-01&to=2024-12-31']),
      });

      act(() => {
        result.current.setDateRange(undefined, undefined);
      });

      expect(result.current.filters.startDate).toBeUndefined();
      expect(result.current.filters.endDate).toBeUndefined();
    });

    it('can set only start date', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/']),
      });

      act(() => {
        result.current.setDateRange('2024-01-01', undefined);
      });

      expect(result.current.filters.startDate).toBe('2024-01-01');
      expect(result.current.filters.endDate).toBeUndefined();
    });

    it('can set only end date', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/']),
      });

      act(() => {
        result.current.setDateRange(undefined, '2024-12-31');
      });

      expect(result.current.filters.startDate).toBeUndefined();
      expect(result.current.filters.endDate).toBe('2024-12-31');
    });
  });

  describe('clearFilters', () => {
    it('clears all params', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?type=lab_result&q=test&from=2024-01-01&tag=urgent&private=true']),
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters.eventTypes).toBeUndefined();
      expect(result.current.filters.search).toBeUndefined();
      expect(result.current.filters.startDate).toBeUndefined();
      expect(result.current.filters.tags).toBeUndefined();
      expect(result.current.filters.includePrivate).toBe(false);
      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  describe('clearEventTypes', () => {
    it('clears only event type params', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?type=lab_result&type=medication&q=test']),
      });

      act(() => {
        result.current.clearEventTypes();
      });

      expect(result.current.filters.eventTypes).toBeUndefined();
      expect(result.current.filters.search).toBe('test');
    });
  });

  describe('toggleTag', () => {
    it('adds tag when not present', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/']),
      });

      act(() => {
        result.current.toggleTag('urgent');
      });

      expect(result.current.filters.tags).toEqual(['urgent']);
    });

    it('removes tag when present', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?tag=urgent&tag=followup']),
      });

      act(() => {
        result.current.toggleTag('urgent');
      });

      expect(result.current.filters.tags).toEqual(['followup']);
    });
  });

  describe('clearTags', () => {
    it('clears only tag params', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?tag=urgent&tag=followup&q=test']),
      });

      act(() => {
        result.current.clearTags();
      });

      expect(result.current.filters.tags).toBeUndefined();
      expect(result.current.filters.search).toBe('test');
    });
  });

  describe('togglePrivate', () => {
    it('sets private to true when false', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/']),
      });

      act(() => {
        result.current.togglePrivate();
      });

      expect(result.current.filters.includePrivate).toBe(true);
    });

    it('sets private to false when true', () => {
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper(['/?private=true']),
      });

      act(() => {
        result.current.togglePrivate();
      });

      expect(result.current.filters.includePrivate).toBe(false);
    });
  });

  describe('all event types', () => {
    it('handles all valid event types', () => {
      const allTypes = 'type=lab_result&type=doctor_visit&type=medication&type=intervention&type=metric&type=vice';
      const { result } = renderHook(() => useTimelineFilters(), {
        wrapper: createWrapper([`/?${allTypes}`]),
      });

      expect(result.current.filters.eventTypes).toEqual([
        'lab_result',
        'doctor_visit',
        'medication',
        'intervention',
        'metric',
        'vice',
      ]);
    });
  });
});
