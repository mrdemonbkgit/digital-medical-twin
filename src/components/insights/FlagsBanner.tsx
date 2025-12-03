import { AlertTriangle } from 'lucide-react';
import type { FlagCounts } from '@/lib/insights/dataProcessing';

interface FlagsBannerProps {
  flagCounts: FlagCounts;
}

export function FlagsBanner({ flagCounts }: FlagsBannerProps) {
  const { high, low } = flagCounts;
  const total = high + low;

  if (total === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-green-700">
        <span className="text-sm font-medium">All biomarkers within normal range</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {high > 0 && (
        <div className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-red-700">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            {high} High
          </span>
        </div>
      )}
      {low > 0 && (
        <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            {low} Low
          </span>
        </div>
      )}
    </div>
  );
}
