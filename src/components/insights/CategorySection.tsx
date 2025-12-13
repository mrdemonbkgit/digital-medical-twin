import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { BIOMARKER_CATEGORIES, type BiomarkerCategory } from '@/types/biomarker';
import type { BiomarkerSummary } from '@/lib/insights/dataProcessing';
import { SparklineCard } from './SparklineCard';

interface CategorySectionProps {
  category: BiomarkerCategory;
  biomarkers: BiomarkerSummary[];
}

export function CategorySection({ category, biomarkers }: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const categoryInfo = BIOMARKER_CATEGORIES[category];

  return (
    <div className="rounded-lg border border-theme-primary bg-theme-primary">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-theme-secondary"
      >
        <div>
          <h3 className="font-medium text-theme-primary">
            {categoryInfo?.label || category}
          </h3>
          <p className="text-sm text-theme-tertiary">
            {biomarkers.length} biomarker{biomarkers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-theme-muted transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-theme-primary p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {biomarkers.map((biomarker) => (
              <SparklineCard key={biomarker.code} biomarker={biomarker} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
