import { cn } from '@/utils/cn';
import type { TimeRange } from '@/lib/insights/dataProcessing';

interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'All' },
];

export function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
  return (
    <div className="inline-flex rounded-lg border border-theme-primary bg-theme-secondary p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            value === option.value
              ? 'bg-theme-primary text-theme-primary shadow-sm'
              : 'text-theme-secondary hover:text-theme-primary'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
