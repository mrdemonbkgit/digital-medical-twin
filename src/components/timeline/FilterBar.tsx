import { useState } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { SearchInput } from './SearchInput';
import { EventTypeFilterChips } from './EventTypeFilterChips';
import { DateRangeFilter } from './DateRangeFilter';
import { TagFilter } from './TagFilter';
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
  availableTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  isLoadingTags?: boolean;
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
  availableTags,
  selectedTags,
  onToggleTag,
  onClearTags,
  isLoadingTags,
  activeFilterCount,
  className,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn('space-y-4 rounded-lg border border-theme-primary bg-theme-primary p-4', className)}>
      {/* Search - always visible */}
      <SearchInput value={search} onChange={onSearchChange} />

      {/* Toggle button for filters on mobile */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between rounded-lg border border-theme-primary bg-theme-secondary px-4 py-3 text-sm font-medium text-theme-secondary min-h-[44px]"
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-info-muted px-2 py-0.5 text-xs font-semibold text-accent">
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
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-theme-tertiary">
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
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-theme-tertiary">
            Date Range
          </h3>
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onChange={onDateChange}
          />
        </div>

        {/* Tag filter */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-theme-tertiary">
            Tags
          </h3>
          <TagFilter
            availableTags={availableTags}
            selectedTags={selectedTags}
            onToggleTag={onToggleTag}
            onClearTags={onClearTags}
            isLoading={isLoadingTags}
          />
        </div>
      </div>
    </div>
  );
}
