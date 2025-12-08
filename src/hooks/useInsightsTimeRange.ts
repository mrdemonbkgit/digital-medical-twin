import { useState, useCallback, useEffect } from 'react';
import type { TimeRange } from '@/lib/insights/dataProcessing';

const STORAGE_KEY = 'insights-time-range';
const DEFAULT_TIME_RANGE: TimeRange = 'all';

const VALID_TIME_RANGES: TimeRange[] = ['3m', '6m', '1y', 'all'];

function isValidTimeRange(value: string): value is TimeRange {
  return VALID_TIME_RANGES.includes(value as TimeRange);
}

export function useInsightsTimeRange(): [TimeRange, (range: TimeRange) => void] {
  const [timeRange, setTimeRangeState] = useState<TimeRange>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && isValidTimeRange(saved)) {
        return saved;
      }
    } catch {
      // localStorage not available
    }
    return DEFAULT_TIME_RANGE;
  });

  const setTimeRange = useCallback((range: TimeRange) => {
    setTimeRangeState(range);
    try {
      localStorage.setItem(STORAGE_KEY, range);
    } catch {
      // localStorage not available
    }
  }, []);

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue && isValidTimeRange(e.newValue)) {
        setTimeRangeState(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return [timeRange, setTimeRange];
}
