import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Search, Database, Trash2, Download, EyeOff } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/common';
import { EventCard, EventCardSkeletonList } from '@/components/event';
import {
  FilterBar,
  AddEventFAB,
  TimelineGroup,
  TimelineEvent,
  TimelineDateHeader,
} from '@/components/timeline';
import {
  useEvents,
  useEventMutation,
  useDebouncedValue,
  useInfiniteScroll,
  useTimelineFilters,
  useUserTags,
  useExportEvents,
} from '@/hooks';
import { seedMockEvents, clearAllEvents } from '@/utils/seedEvents';
import type { HealthEvent } from '@/types';

const isDev = import.meta.env.DEV;

export function TimelinePage() {
  // Filter state synced to URL params
  const {
    filters,
    hasActiveFilters,
    activeFilterCount,
    setSearch,
    toggleEventType,
    setDateRange,
    clearFilters,
    clearEventTypes,
    toggleTag,
    clearTags,
    togglePrivate,
  } = useTimelineFilters();

  // Fetch available tags for filtering
  const { tags: availableTags, isLoading: isLoadingTags } = useUserTags();

  // Local search input state (for instant UI feedback)
  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  // Sync debounced search to URL params
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
    },
    []
  );

  // Update URL when debounced value changes
  useEffect(() => {
    if (debouncedSearch !== (filters.search || '')) {
      setSearch(debouncedSearch);
    }
  }, [debouncedSearch, filters.search, setSearch]);

  // Fetch events with filters
  const {
    events,
    isLoading,
    error,
    hasMore,
    loadMore,
    refetch,
    total,
  } = useEvents({
    filters: {
      ...filters,
      search: debouncedSearch || undefined,
    },
  });

  const { remove, isDeleting } = useEventMutation();

  // Export functionality
  const { exportFiltered, isExporting, error: exportError } = useExportEvents();

  const handleExport = async (format: 'json' | 'csv') => {
    await exportFiltered(
      { ...filters, search: debouncedSearch || undefined },
      { format }
    );
  };

  // Infinite scroll
  const sentinelRef = useInfiniteScroll(loadMore, {
    enabled: hasMore && !isLoading,
    rootMargin: '200px',
  });

  // Dev tools state
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleSeedEvents = async () => {
    setIsSeeding(true);
    const result = await seedMockEvents();
    setIsSeeding(false);
    if (result.success) {
      await refetch();
    } else {
      alert(result.message);
    }
  };

  const handleClearEvents = async () => {
    if (!window.confirm('Are you sure you want to delete ALL events?')) return;
    setIsClearing(true);
    const result = await clearAllEvents();
    setIsClearing(false);
    if (result.success) {
      await refetch();
    } else {
      alert(result.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      await refetch();
    } catch {
      // Error is handled by the hook
    }
  };

  // Group events by date
  const groupedEvents = useMemo(() => {
    return events.reduce(
      (groups, event) => {
        const date = event.date;
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(event);
        return groups;
      },
      {} as Record<string, HealthEvent[]>
    );
  }, [events]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedEvents).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
  }, [groupedEvents]);

  function formatDateHeader(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    }
    if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Determine empty state type
  const getEmptyState = () => {
    if (isLoading) return null;
    if (error) return null;
    if (events.length > 0) return null;

    if (searchInput) {
      return {
        icon: Search,
        title: 'No results found',
        message: `No events match "${searchInput}"`,
        action: (
          <Button variant="secondary" onClick={() => handleSearchChange('')}>
            Clear search
          </Button>
        ),
      };
    }

    if (hasActiveFilters) {
      return {
        icon: Calendar,
        title: 'No matching events',
        message: 'Try adjusting your filters to see more results.',
        action: (
          <Button variant="secondary" onClick={clearFilters}>
            Clear all filters
          </Button>
        ),
      };
    }

    return {
      icon: Calendar,
      title: 'No events yet',
      message: 'Start tracking your health journey by adding your first event.',
      action: (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/event/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Event
            </Button>
          </Link>
          {isDev && (
            <Button
              variant="secondary"
              onClick={handleSeedEvents}
              disabled={isSeeding}
            >
              <Database className="w-4 h-4 mr-2" />
              {isSeeding ? 'Seeding...' : 'Add Mock Data'}
            </Button>
          )}
        </div>
      ),
    };
  };

  const emptyState = getEmptyState();

  return (
    <PageWrapper
      title="Timeline"
      action={
        <Link to="/event/new" className="hidden sm:block">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </Link>
      }
    >
      {/* Filter Bar */}
      <div className="mb-6">
        <FilterBar
          search={searchInput}
          onSearchChange={handleSearchChange}
          selectedTypes={filters.eventTypes || []}
          onToggleType={toggleEventType}
          onClearTypes={clearEventTypes}
          startDate={filters.startDate}
          endDate={filters.endDate}
          onDateChange={setDateRange}
          availableTags={availableTags}
          selectedTags={filters.tags || []}
          onToggleTag={toggleTag}
          onClearTags={clearTags}
          isLoadingTags={isLoadingTags}
          activeFilterCount={activeFilterCount}
        />
      </div>

      {/* Results count and export */}
      {!isLoading && events.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-theme-tertiary">
                Showing {events.length} of {total} events
              </span>
              <button
                onClick={togglePrivate}
                className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-colors ${
                  filters.includePrivate
                    ? 'bg-theme-tertiary text-theme-secondary border border-theme-secondary'
                    : 'text-theme-muted hover:text-theme-secondary hover:bg-theme-secondary'
                }`}
                title={filters.includePrivate ? 'Hide private events' : 'Show private events'}
              >
                <EyeOff className="w-3 h-3" />
                {filters.includePrivate ? 'Private visible' : 'Show private'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-theme-muted">Export:</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleExport('json')}
                disabled={isExporting}
                className="text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                JSON
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                CSV
              </Button>
            </div>
          </div>
          {exportError && (
            <p className="mt-2 text-sm text-danger text-right">{exportError}</p>
          )}
        </div>
      )}

      {/* Dev tools */}
      {isDev && !isLoading && events.length > 0 && (
        <div className="mb-6 p-4 bg-warning-muted border border-warning rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-warning font-medium">Dev Tools</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSeedEvents}
                disabled={isSeeding}
              >
                <Database className="w-3 h-3 mr-1" />
                {isSeeding ? 'Seeding...' : 'Add More'}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleClearEvents}
                disabled={isClearing}
                className="text-danger hover:opacity-80"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                {isClearing ? 'Clearing...' : 'Clear All'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state - initial */}
      {isLoading && events.length === 0 && (
        <EventCardSkeletonList count={5} />
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-12">
          <p className="text-danger mb-4">{error}</p>
          <Button variant="secondary" onClick={refetch}>
            Try Again
          </Button>
        </div>
      )}

      {/* Empty state */}
      {emptyState && (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center mb-4">
            <emptyState.icon className="w-8 h-8 text-theme-muted" />
          </div>
          <h3 className="text-lg font-medium text-theme-primary mb-2">
            {emptyState.title}
          </h3>
          <p className="text-theme-tertiary mb-6">{emptyState.message}</p>
          {emptyState.action}
        </div>
      )}

      {/* Timeline with connector */}
      {!isLoading && events.length > 0 && (
        <div className="space-y-8">
          {sortedDates.map((date, dateIndex) => (
            <TimelineGroup key={date}>
              <TimelineDateHeader>
                {formatDateHeader(date)}
              </TimelineDateHeader>
              <div className="space-y-4">
                {groupedEvents[date].map((event, eventIndex) => {
                  const isLastInGroup = eventIndex === groupedEvents[date].length - 1;
                  const isLastDate = dateIndex === sortedDates.length - 1;
                  const isLastEvent = isLastInGroup && isLastDate && !hasMore;

                  return (
                    <TimelineEvent
                      key={event.id}
                      eventType={event.type}
                      isLast={isLastEvent}
                    >
                      <EventCard
                        event={event}
                        onDelete={handleDelete}
                        isDeleting={isDeleting}
                        searchQuery={debouncedSearch}
                      />
                    </TimelineEvent>
                  );
                })}
              </div>
            </TimelineGroup>
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />

          {/* Loading more indicator */}
          {isLoading && events.length > 0 && (
            <div className="pl-6">
              <EventCardSkeletonList count={2} />
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <AddEventFAB />
    </PageWrapper>
  );
}
