import { useState, useCallback } from 'react';
import { createEvent } from '@/api/events';
import { parseImportFile, readFileAsText, type ImportResult } from '@/lib/importData';
import type { CreateEventInput } from '@/types';

interface UseImportEventsReturn {
  validateFile: (file: File) => Promise<ImportResult>;
  importEvents: (events: CreateEventInput[]) => Promise<ImportProgress>;
  isValidating: boolean;
  isImporting: boolean;
  progress: ImportProgress;
  reset: () => void;
}

export interface ImportProgress {
  total: number;
  completed: number;
  failed: number;
  errors: string[];
}

const initialProgress: ImportProgress = {
  total: 0,
  completed: 0,
  failed: 0,
  errors: [],
};

export function useImportEvents(): UseImportEventsReturn {
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress>(initialProgress);

  const reset = useCallback(() => {
    setProgress(initialProgress);
  }, []);

  const validateFile = useCallback(async (file: File): Promise<ImportResult> => {
    setIsValidating(true);

    try {
      // Check file type
      if (!file.name.endsWith('.json')) {
        return {
          success: false,
          events: [],
          errors: ['Only JSON files are supported'],
          warnings: [],
        };
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return {
          success: false,
          events: [],
          errors: ['File size exceeds 10MB limit'],
          warnings: [],
        };
      }

      const content = await readFileAsText(file);
      return parseImportFile(content);
    } finally {
      setIsValidating(false);
    }
  }, []);

  const importEvents = useCallback(
    async (events: CreateEventInput[]): Promise<ImportProgress> => {
      setIsImporting(true);
      setProgress({ total: events.length, completed: 0, failed: 0, errors: [] });

      const errors: string[] = [];
      let completed = 0;
      let failed = 0;

      for (const event of events) {
        try {
          await createEvent(event);
          completed++;
        } catch (err) {
          failed++;
          errors.push(
            `Failed to import "${event.title}": ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }

        setProgress({ total: events.length, completed, failed, errors });
      }

      setIsImporting(false);
      return { total: events.length, completed, failed, errors };
    },
    []
  );

  return {
    validateFile,
    importEvents,
    isValidating,
    isImporting,
    progress,
    reset,
  };
}
