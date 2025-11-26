import { useState, useEffect, useCallback } from 'react';
import { getEvent } from '@/api/events';
import type { HealthEvent } from '@/types';

interface UseEventReturn {
  event: HealthEvent | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEvent(id: string | undefined): UseEventReturn {
  const [event, setEvent] = useState<HealthEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!id) {
      setEvent(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getEvent(id);
      setEvent(data);
      if (!data) {
        setError('Event not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch event');
      setEvent(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return {
    event,
    isLoading,
    error,
    refetch: fetchEvent,
  };
}
