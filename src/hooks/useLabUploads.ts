import { useState, useEffect, useCallback } from 'react';
import { getLabUploads } from '@/api/labUploads';
import type { LabUpload } from '@/types';

interface UseLabUploadsOptions {
  autoFetch?: boolean;
  pollInterval?: number; // Poll for updates (useful when processing)
}

interface UseLabUploadsReturn {
  uploads: LabUpload[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasProcessing: boolean;
}

export function useLabUploads(options: UseLabUploadsOptions = {}): UseLabUploadsReturn {
  const { autoFetch = true, pollInterval } = options;
  const [uploads, setUploads] = useState<LabUpload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUploads = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getLabUploads();
      setUploads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch uploads');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchUploads();
  }, [fetchUploads]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchUploads();
    }
  }, [autoFetch, fetchUploads]);

  // Polling for updates (when any upload is pending or processing)
  useEffect(() => {
    if (!pollInterval) return;

    const hasActiveUploads = uploads.some(
      (u) => u.status === 'processing' || u.status === 'pending'
    );
    if (!hasActiveUploads) return;

    const intervalId = setInterval(() => {
      fetchUploads();
    }, pollInterval);

    return () => clearInterval(intervalId);
  }, [pollInterval, uploads, fetchUploads]);

  return {
    uploads,
    isLoading,
    error,
    refetch,
    hasProcessing: uploads.some((u) => u.status === 'processing' || u.status === 'pending'),
  };
}
