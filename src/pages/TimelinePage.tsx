import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Search, Database, Trash2 } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Button, Input, LoadingSpinner } from '@/components/common';
import { EventCard } from '@/components/event';
import { useEvents, useEventMutation } from '@/hooks';
import { seedMockEvents, clearAllEvents } from '@/utils/seedEvents';

const isDev = import.meta.env.DEV;

export function TimelinePage() {
  const { events, isLoading, error, hasMore, loadMore, refetch } = useEvents();
  const { remove, isDeleting } = useEventMutation();
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
  const groupedEvents = events.reduce(
    (groups, event) => {
      const date = event.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
      return groups;
    },
    {} as Record<string, typeof events>
  );

  const sortedDates = Object.keys(groupedEvents).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

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

  return (
    <PageWrapper
      title="Timeline"
      action={
        <Link to="/event/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </Link>
      }
    >
      {/* Search placeholder - for Phase 3 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search events... (coming soon)"
            className="pl-10"
            disabled
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && events.length === 0 && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button variant="secondary" onClick={refetch}>
            Try Again
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && events.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No events yet
          </h3>
          <p className="text-gray-500 mb-6">
            Start tracking your health journey by adding your first event.
          </p>
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
        </div>
      )}

      {/* Dev tools */}
      {isDev && !isLoading && events.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-800 font-medium">Dev Tools</span>
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
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                {isClearing ? 'Clearing...' : 'Clear All'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {!isLoading && events.length > 0 && (
        <div className="space-y-8">
          {sortedDates.map((date) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                {formatDateHeader(date)}
              </h2>
              <div className="space-y-4">
                {groupedEvents[date].map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onDelete={handleDelete}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="secondary"
                onClick={loadMore}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
}
