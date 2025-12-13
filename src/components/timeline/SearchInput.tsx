import { Search, X } from 'lucide-react';
import { cn } from '@/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Search input with icon and clear button.
 * Controlled component - parent handles debouncing.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search events...',
  className,
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-theme-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-theme w-full rounded-lg border py-2 pl-10 pr-10 text-sm"
        aria-label="Search events"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-theme-muted hover:bg-theme-tertiary hover:text-theme-secondary"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
