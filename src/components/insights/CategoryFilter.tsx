import { useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { BIOMARKER_CATEGORIES, type BiomarkerCategory } from '@/types/biomarker';

const STORAGE_KEY = 'insights-visible-categories';

interface CategoryFilterProps {
  availableCategories: BiomarkerCategory[];
  visibleCategories: BiomarkerCategory[];
  onChange: (categories: BiomarkerCategory[]) => void;
}

export function CategoryFilter({
  availableCategories,
  visibleCategories,
  onChange,
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleCategory = (category: BiomarkerCategory) => {
    const newVisible = visibleCategories.includes(category)
      ? visibleCategories.filter((c) => c !== category)
      : [...visibleCategories, category];
    onChange(newVisible);
  };

  const selectAll = () => {
    onChange(availableCategories);
  };

  const selectNone = () => {
    onChange([]);
  };

  const visibleCount = visibleCategories.length;
  const totalCount = availableCategories.length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span>
          Categories ({visibleCount}/{totalCount})
        </span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-100 p-2">
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="flex-1 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                >
                  Select All
                </button>
                <button
                  onClick={selectNone}
                  className="flex-1 rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto p-2">
              {availableCategories.map((category) => {
                const isVisible = visibleCategories.includes(category);
                const categoryInfo = BIOMARKER_CATEGORIES[category];

                return (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-left hover:bg-gray-50"
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded border',
                        isVisible
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300'
                      )}
                    >
                      {isVisible && <Check className="h-3 w-3" />}
                    </div>
                    <span className="text-sm text-gray-700">
                      {categoryInfo?.label || category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Hook for persisting category visibility
export function useVisibleCategories(
  availableCategories: BiomarkerCategory[]
): [BiomarkerCategory[], (categories: BiomarkerCategory[]) => void] {
  const [visibleCategories, setVisibleCategories] = useState<BiomarkerCategory[]>(() => {
    // Load from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as BiomarkerCategory[];
        // Filter to only include available categories
        return parsed.filter((c) => availableCategories.includes(c));
      }
    } catch {
      // Ignore errors
    }
    // Default: show all
    return availableCategories;
  });

  // Stable serialized version of availableCategories to avoid infinite loops
  const availableCategoriesKey = availableCategories.slice().sort().join(',');

  // Update when available categories change (e.g., new data loaded)
  useEffect(() => {
    setVisibleCategories((prev) => {
      // If no previous selection, show all available
      if (prev.length === 0) {
        return availableCategories;
      }
      // Keep only categories that are still available
      const filtered = prev.filter((c) => availableCategories.includes(c));
      // If all previous selections are now gone, show all
      return filtered.length > 0 ? filtered : availableCategories;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableCategoriesKey]);

  // Persist to localStorage
  const updateVisibleCategories = (categories: BiomarkerCategory[]) => {
    setVisibleCategories(categories);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    } catch {
      // Ignore errors
    }
  };

  return [visibleCategories, updateVisibleCategories];
}
