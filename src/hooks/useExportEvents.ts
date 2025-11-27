import { useState, useCallback } from 'react';
import { getAllEvents } from '@/api/events';
import { exportEvents, type ExportOptions } from '@/lib/exportData';
import type { EventFilters } from '@/types';

interface UseExportEventsReturn {
  exportAll: (options?: ExportOptions) => Promise<void>;
  exportFiltered: (filters: EventFilters, options?: ExportOptions) => Promise<void>;
  isExporting: boolean;
  error: string | null;
}

export function useExportEvents(): UseExportEventsReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportAll = useCallback(async (options: ExportOptions = { format: 'json' }) => {
    setIsExporting(true);
    setError(null);

    try {
      const events = await getAllEvents();
      if (events.length === 0) {
        setError('No events to export');
        return;
      }
      exportEvents(events, options);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, []);

  const exportFiltered = useCallback(
    async (filters: EventFilters, options: ExportOptions = { format: 'json' }) => {
      setIsExporting(true);
      setError(null);

      try {
        const events = await getAllEvents(filters);
        if (events.length === 0) {
          setError('No events match the current filters');
          return;
        }
        exportEvents(events, options);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed');
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  return { exportAll, exportFiltered, isExporting, error };
}
