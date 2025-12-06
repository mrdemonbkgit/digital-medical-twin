import { useState, useCallback } from 'react';
import { createEvent, updateEvent, deleteEvent } from '@/api/events';
import type { HealthEvent, CreateEventInput, UpdateEventInput } from '@/types';
import { logger } from '@/lib/logger';

interface UseEventMutationReturn {
  create: (input: CreateEventInput) => Promise<HealthEvent>;
  update: (id: string, input: UpdateEventInput) => Promise<HealthEvent>;
  remove: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  clearError: () => void;
}

export function useEventMutation(): UseEventMutationReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const create = useCallback(async (input: CreateEventInput): Promise<HealthEvent> => {
    setIsCreating(true);
    setError(null);

    try {
      const event = await createEvent(input);
      return event;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create event';
      logger.error('Failed to create event', { error: err, input: { type: input.type, date: input.date } });
      setError(message);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const update = useCallback(async (id: string, input: UpdateEventInput): Promise<HealthEvent> => {
    setIsUpdating(true);
    setError(null);

    try {
      const event = await updateEvent(id, input);
      return event;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update event';
      logger.error('Failed to update event', { error: err, eventId: id, input: { type: input.type } });
      setError(message);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteEvent(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete event';
      logger.error('Failed to delete event', { error: err, eventId: id });
      setError(message);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return {
    create,
    update,
    remove,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    clearError,
  };
}
