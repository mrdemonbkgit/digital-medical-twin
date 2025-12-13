import { X, Tag } from 'lucide-react';
import { cn } from '@/utils';

interface TagFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  isLoading?: boolean;
}

export function TagFilter({
  availableTags,
  selectedTags,
  onToggleTag,
  onClearTags,
  isLoading,
}: TagFilterProps) {
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-7 w-16 animate-pulse rounded-full bg-theme-tertiary"
          />
        ))}
      </div>
    );
  }

  if (availableTags.length === 0) {
    return (
      <p className="text-sm text-theme-tertiary italic">
        No tags yet. Add tags to events to filter by them.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onToggleTag(tag)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition-colors',
                isSelected
                  ? 'bg-info-muted text-accent hover:bg-theme-tertiary'
                  : 'bg-theme-tertiary text-theme-secondary hover:bg-theme-secondary'
              )}
            >
              <Tag className="h-3 w-3" />
              {tag}
              {isSelected && <X className="h-3 w-3 ml-1" />}
            </button>
          );
        })}
      </div>

      {selectedTags.length > 0 && (
        <button
          type="button"
          onClick={onClearTags}
          className="text-xs text-theme-tertiary hover:text-theme-secondary"
        >
          Clear tag filters
        </button>
      )}
    </div>
  );
}
