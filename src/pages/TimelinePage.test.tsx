import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TimelinePage } from './TimelinePage';

// Mock dependencies
vi.mock('@/components/layout', () => ({
  PageWrapper: ({ children, title, action }: any) => (
    <div data-testid="page-wrapper" data-title={title}>
      {action}
      {children}
    </div>
  ),
}));

vi.mock('@/components/common', () => ({
  Button: ({ children, onClick, disabled, variant, size }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/event', () => ({
  EventCard: ({ event, onDelete, searchQuery }: any) => (
    <div data-testid={`event-card-${event.id}`}>
      <span>{event.title}</span>
      <button onClick={() => onDelete(event.id)}>Delete</button>
    </div>
  ),
  EventCardSkeletonList: ({ count }: { count: number }) => (
    <div data-testid="skeleton-list" data-count={count}>
      Loading skeletons...
    </div>
  ),
}));

vi.mock('@/components/timeline', () => ({
  FilterBar: ({ search, onSearchChange, selectedTypes, onToggleType }: any) => (
    <div data-testid="filter-bar">
      <input
        data-testid="search-input"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search..."
      />
    </div>
  ),
  AddEventFAB: () => <div data-testid="add-event-fab">FAB</div>,
  TimelineGroup: ({ children }: any) => <div data-testid="timeline-group">{children}</div>,
  TimelineEvent: ({ children }: any) => <div data-testid="timeline-event">{children}</div>,
  TimelineDateHeader: ({ children }: any) => <div data-testid="timeline-date-header">{children}</div>,
}));

const mockRefetch = vi.fn();
const mockLoadMore = vi.fn();
const mockRemove = vi.fn();
const mockExportFiltered = vi.fn();
const mockTogglePrivate = vi.fn();
const mockSetSearch = vi.fn();
const mockToggleEventType = vi.fn();
const mockSetDateRange = vi.fn();
const mockClearFilters = vi.fn();
const mockClearEventTypes = vi.fn();
const mockToggleTag = vi.fn();
const mockClearTags = vi.fn();

vi.mock('@/hooks', () => ({
  useEvents: vi.fn(() => ({
    events: [],
    isLoading: false,
    error: null,
    hasMore: false,
    loadMore: mockLoadMore,
    refetch: mockRefetch,
    total: 0,
  })),
  useEventMutation: vi.fn(() => ({
    remove: mockRemove,
    isDeleting: false,
  })),
  useDebouncedValue: vi.fn((value) => value),
  useInfiniteScroll: vi.fn(() => ({ current: null })),
  useTimelineFilters: vi.fn(() => ({
    filters: {},
    hasActiveFilters: false,
    activeFilterCount: 0,
    setSearch: mockSetSearch,
    toggleEventType: mockToggleEventType,
    setDateRange: mockSetDateRange,
    clearFilters: mockClearFilters,
    clearEventTypes: mockClearEventTypes,
    toggleTag: mockToggleTag,
    clearTags: mockClearTags,
    togglePrivate: mockTogglePrivate,
  })),
  useUserTags: vi.fn(() => ({
    tags: [],
    isLoading: false,
  })),
  useExportEvents: vi.fn(() => ({
    exportFiltered: mockExportFiltered,
    isExporting: false,
    error: null,
  })),
}));

vi.mock('@/utils/seedEvents', () => ({
  seedMockEvents: vi.fn(),
  clearAllEvents: vi.fn(),
}));

import { useEvents, useTimelineFilters, useExportEvents } from '@/hooks';

describe('TimelinePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderWithRouter() {
    return render(
      <BrowserRouter>
        <TimelinePage />
      </BrowserRouter>
    );
  }

  describe('loading state', () => {
    it('shows skeleton list when loading with no events', () => {
      vi.mocked(useEvents).mockReturnValue({
        events: [],
        isLoading: true,
        error: null,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
        total: 0,
      });

      renderWithRouter();

      expect(screen.getByTestId('skeleton-list')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when error occurs', () => {
      vi.mocked(useEvents).mockReturnValue({
        events: [],
        isLoading: false,
        error: 'Failed to load events',
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
        total: 0,
      });

      renderWithRouter();

      expect(screen.getByText('Failed to load events')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('calls refetch when clicking Try Again', () => {
      vi.mocked(useEvents).mockReturnValue({
        events: [],
        isLoading: false,
        error: 'Failed to load events',
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
        total: 0,
      });

      renderWithRouter();

      fireEvent.click(screen.getByText('Try Again'));
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('empty states', () => {
    it('shows empty state when no events', () => {
      vi.mocked(useEvents).mockReturnValue({
        events: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
        total: 0,
      });

      renderWithRouter();

      expect(screen.getByText('No events yet')).toBeInTheDocument();
      expect(screen.getByText('Add Your First Event')).toBeInTheDocument();
    });

    it('shows no results state when search has no matches', () => {
      vi.mocked(useEvents).mockReturnValue({
        events: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
        total: 0,
      });

      renderWithRouter();

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText('Clear search')).toBeInTheDocument();
    });

    it('shows filter empty state when filters are active', () => {
      vi.mocked(useEvents).mockReturnValue({
        events: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
        total: 0,
      });

      vi.mocked(useTimelineFilters).mockReturnValue({
        filters: { eventTypes: ['lab_result'] },
        hasActiveFilters: true,
        activeFilterCount: 1,
        setSearch: mockSetSearch,
        toggleEventType: mockToggleEventType,
        setDateRange: mockSetDateRange,
        clearFilters: mockClearFilters,
        clearEventTypes: mockClearEventTypes,
        toggleTag: mockToggleTag,
        clearTags: mockClearTags,
        togglePrivate: mockTogglePrivate,
      });

      renderWithRouter();

      expect(screen.getByText('No matching events')).toBeInTheDocument();
      expect(screen.getByText('Clear all filters')).toBeInTheDocument();
    });
  });

  describe('event display', () => {
    const mockEvents = [
      {
        id: 'event-1',
        type: 'lab_result',
        title: 'Blood Test',
        date: '2024-06-15',
        createdAt: '2024-06-15',
        updatedAt: '2024-06-15',
      },
      {
        id: 'event-2',
        type: 'doctor_visit',
        title: 'Annual Checkup',
        date: '2024-06-15',
        createdAt: '2024-06-15',
        updatedAt: '2024-06-15',
      },
      {
        id: 'event-3',
        type: 'medication',
        title: 'Started Vitamin D',
        date: '2024-06-14',
        createdAt: '2024-06-14',
        updatedAt: '2024-06-14',
      },
    ];

    beforeEach(() => {
      vi.mocked(useEvents).mockReturnValue({
        events: mockEvents as any,
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
        total: 3,
      });

      vi.mocked(useTimelineFilters).mockReturnValue({
        filters: {},
        hasActiveFilters: false,
        activeFilterCount: 0,
        setSearch: mockSetSearch,
        toggleEventType: mockToggleEventType,
        setDateRange: mockSetDateRange,
        clearFilters: mockClearFilters,
        clearEventTypes: mockClearEventTypes,
        toggleTag: mockToggleTag,
        clearTags: mockClearTags,
        togglePrivate: mockTogglePrivate,
      });
    });

    it('displays events grouped by date', () => {
      renderWithRouter();

      expect(screen.getByTestId('event-card-event-1')).toBeInTheDocument();
      expect(screen.getByTestId('event-card-event-2')).toBeInTheDocument();
      expect(screen.getByTestId('event-card-event-3')).toBeInTheDocument();
    });

    it('shows event count', () => {
      renderWithRouter();

      expect(screen.getByText(/Showing 3 of 3 events/)).toBeInTheDocument();
    });

    it('renders filter bar', () => {
      renderWithRouter();

      expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
    });

    it('renders add event FAB', () => {
      renderWithRouter();

      expect(screen.getByTestId('add-event-fab')).toBeInTheDocument();
    });
  });

  describe('event deletion', () => {
    it('calls remove when deleting event', async () => {
      mockRemove.mockResolvedValueOnce({});

      vi.mocked(useEvents).mockReturnValue({
        events: [
          {
            id: 'event-1',
            type: 'lab_result',
            title: 'Blood Test',
            date: '2024-06-15',
            createdAt: '2024-06-15',
            updatedAt: '2024-06-15',
          },
        ] as any,
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
        total: 1,
      });

      renderWithRouter();

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalledWith('event-1');
      });
    });
  });

  describe('export functionality', () => {
    beforeEach(() => {
      vi.mocked(useEvents).mockReturnValue({
        events: [
          {
            id: 'event-1',
            type: 'lab_result',
            title: 'Blood Test',
            date: '2024-06-15',
            createdAt: '2024-06-15',
            updatedAt: '2024-06-15',
          },
        ] as any,
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
        total: 1,
      });
    });

    it('shows export buttons when events exist', () => {
      renderWithRouter();

      expect(screen.getByText('JSON')).toBeInTheDocument();
      expect(screen.getByText('CSV')).toBeInTheDocument();
    });

    it('calls export with json format', () => {
      renderWithRouter();

      fireEvent.click(screen.getByText('JSON'));
      expect(mockExportFiltered).toHaveBeenCalledWith(
        expect.any(Object),
        { format: 'json' }
      );
    });

    it('calls export with csv format', () => {
      renderWithRouter();

      fireEvent.click(screen.getByText('CSV'));
      expect(mockExportFiltered).toHaveBeenCalledWith(
        expect.any(Object),
        { format: 'csv' }
      );
    });

    it('shows export error when present', () => {
      vi.mocked(useExportEvents).mockReturnValue({
        exportFiltered: mockExportFiltered,
        isExporting: false,
        error: 'Export failed',
      });

      renderWithRouter();

      expect(screen.getByText('Export failed')).toBeInTheDocument();
    });
  });

  describe('private events toggle', () => {
    beforeEach(() => {
      vi.mocked(useEvents).mockReturnValue({
        events: [
          {
            id: 'event-1',
            type: 'lab_result',
            title: 'Blood Test',
            date: '2024-06-15',
            createdAt: '2024-06-15',
            updatedAt: '2024-06-15',
          },
        ] as any,
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
        total: 1,
      });
    });

    it('shows private toggle button', () => {
      renderWithRouter();

      expect(screen.getByText('Show private')).toBeInTheDocument();
    });

    it('calls togglePrivate when clicked', () => {
      renderWithRouter();

      fireEvent.click(screen.getByText('Show private'));
      expect(mockTogglePrivate).toHaveBeenCalled();
    });
  });

  describe('search functionality', () => {
    beforeEach(() => {
      vi.mocked(useEvents).mockReturnValue({
        events: [],
        isLoading: false,
        error: null,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
        total: 0,
      });
    });

    it('updates search input when typing', () => {
      renderWithRouter();

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test query' } });

      expect(searchInput).toHaveValue('test query');
    });
  });
});
