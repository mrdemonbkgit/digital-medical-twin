import { Calendar, X } from 'lucide-react';
import { cn } from '@/utils';

interface DateRangeFilterProps {
  startDate?: string;
  endDate?: string;
  onChange: (startDate?: string, endDate?: string) => void;
  className?: string;
}

// Quick date presets
const presets = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '1 year', days: 365 },
];

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Date range filter with quick presets.
 * Uses native date inputs for simplicity.
 */
export function DateRangeFilter({
  startDate,
  endDate,
  onChange,
  className,
}: DateRangeFilterProps) {
  const hasDateFilter = startDate || endDate;

  const handlePresetClick = (days: number) => {
    onChange(getDateDaysAgo(days), getTodayDate());
  };

  const handleClear = () => {
    onChange(undefined, undefined);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Quick presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Quick:</span>
        {presets.map(({ label, days }) => (
          <button
            key={days}
            type="button"
            onClick={() => handlePresetClick(days)}
            className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            {label}
          </button>
        ))}
        {hasDateFilter && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="Clear date filter"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Date inputs */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <label className="text-xs font-medium text-gray-500">From:</label>
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => onChange(e.target.value || undefined, endDate)}
            className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            max={endDate || getTodayDate()}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">To:</label>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => onChange(startDate, e.target.value || undefined)}
            className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            min={startDate}
            max={getTodayDate()}
          />
        </div>
      </div>
    </div>
  );
}
