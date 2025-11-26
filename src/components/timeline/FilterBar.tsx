import { useState } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { SearchInput } from './SearchInput';
import { EventTypeFilterChips } from './EventTypeFilterChips';
import { DateRangeFilter } from './DateRangeFilter';
import type { EventType } from '@/types';
import { cn } from '@/utils';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedTypes: EventType[];
  onToggleType: (type: EventType) => void;
  onClearTypes: () => void;
  startDate?: string;
  endDate?: string;
  onDateChange: (startDate?: string, endDate?: string) => void;
  activeFilterCount: number;
  className?: string;
}

/**
 * Combined filter bar with search, type filters, and date range.
 * Collapsible on mobile for better UX.
 */
export function FilterBar({
  search,
  onSearchChange,
  selectedTypes,
  onToggleType,
  onClearTypes,
  startDate,
  endDate,
  onDateChange,
  activeFilterCount,
  className,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn('space-y-4 rounded-lg border border-gray-200 bg-white p-4', className)}>
      {/* Search - always visible */}
      <SearchInput value={search} onChange={onSearchChange} />

      {/* Toggle button for filters on mobile */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700"
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {activeFilterCount}
              </span>
            )}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Filter content - collapsible on mobile, always visible on desktop */}
      <div className={cn('space-y-4', !isExpanded && 'hidden sm:block')}>
        {/* Event type filters */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Event Types
          </h3>
          <EventTypeFilterChips
            selectedTypes={selectedTypes}
            onToggle={onToggleType}
            onClear={onClearTypes}
          />
        </div>

        {/* Date range filter */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Date Range
          </h3>
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onChange={onDateChange}
          />
        </div>
      </div>
    </div>
  );
}
