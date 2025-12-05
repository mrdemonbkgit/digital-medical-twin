import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEventMutation } from './useEventMutation';
import type { HealthEvent, CreateEventInput, UpdateEventInput } from '@/types';

// Mock the API module
vi.mock('@/api/events', () => ({
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
}));

import { createEvent, updateEvent, deleteEvent } from '@/api/events';

const mockEvent: HealthEvent = {
  id: 'event-1',
  userId: 'user-123',
  type: 'lab_result',
  title: 'Blood Panel',
  date: '2024-01-15',
  biomarkers: [
    { name: 'Glucose', value: 95, unit: 'mg/dL' },
  ],
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

describe('useEventMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('create', () => {
    it('creates event and returns result', async () => {
      vi.mocked(createEvent).mockResolvedValue(mockEvent);

      const { result } = renderHook(() => useEventMutation());

      const input: CreateEventInput = {
        type: 'lab_result',
        title: 'Blood Panel',
        date: '2024-01-15',
        biomarkers: [{ name: 'Glucose', value: 95, unit: 'mg/dL' }],
      };

      let createdEvent: HealthEvent | undefined;
      await act(async () => {
        createdEvent = await result.current.create(input);
      });

      expect(createdEvent).toEqual(mockEvent);
      expect(createEvent).toHaveBeenCalledWith(input);
    });

    it('sets isCreating during create operation', async () => {
      let resolvePromise: (value: HealthEvent) => void;
      vi.mocked(createEvent).mockImplementation(
        () => new Promise((resolve) => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() => useEventMutation());

      expect(result.current.isCreating).toBe(false);

      // Start create operation
      let createPromise: Promise<HealthEvent>;
      act(() => {
        createPromise = result.current.create({
          type: 'lab_result',
          title: 'Test',
          date: '2024-01-15',
          biomarkers: [],
        });
      });

      await waitFor(() => {
        expect(result.current.isCreating).toBe(true);
      });

      // Resolve the promise
      await act(async () => {
        resolvePromise!(mockEvent);
        await createPromise;
      });

      expect(result.current.isCreating).toBe(false);
    });

    it('handles create error with Error instance', async () => {
      vi.mocked(createEvent).mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useEventMutation());

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.create({
            type: 'lab_result',
            title: 'Test',
            date: '2024-01-15',
            biomarkers: [],
          });
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Create failed');
      expect(result.current.error).toBe('Create failed');
      expect(result.current.isCreating).toBe(false);
    });

    it('handles non-Error exception in create', async () => {
      vi.mocked(createEvent).mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useEventMutation());

      await act(async () => {
        try {
          await result.current.create({
            type: 'lab_result',
            title: 'Test',
            date: '2024-01-15',
            biomarkers: [],
          });
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Failed to create event');
    });
  });

  describe('update', () => {
    it('updates event and returns result', async () => {
      const updatedEvent = { ...mockEvent, title: 'Updated Blood Panel' };
      vi.mocked(updateEvent).mockResolvedValue(updatedEvent);

      const { result } = renderHook(() => useEventMutation());

      const input: UpdateEventInput = { title: 'Updated Blood Panel' };

      let updated: HealthEvent | undefined;
      await act(async () => {
        updated = await result.current.update('event-1', input);
      });

      expect(updated).toEqual(updatedEvent);
      expect(updateEvent).toHaveBeenCalledWith('event-1', input);
    });

    it('sets isUpdating during update operation', async () => {
      let resolvePromise: (value: HealthEvent) => void;
      vi.mocked(updateEvent).mockImplementation(
        () => new Promise((resolve) => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() => useEventMutation());

      expect(result.current.isUpdating).toBe(false);

      let updatePromise: Promise<HealthEvent>;
      act(() => {
        updatePromise = result.current.update('event-1', { title: 'Updated' });
      });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(true);
      });

      await act(async () => {
        resolvePromise!(mockEvent);
        await updatePromise;
      });

      expect(result.current.isUpdating).toBe(false);
    });

    it('handles update error with Error instance', async () => {
      vi.mocked(updateEvent).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useEventMutation());

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.update('event-1', { title: 'Updated' });
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Update failed');
      expect(result.current.error).toBe('Update failed');
      expect(result.current.isUpdating).toBe(false);
    });

    it('handles non-Error exception in update', async () => {
      vi.mocked(updateEvent).mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useEventMutation());

      await act(async () => {
        try {
          await result.current.update('event-1', { title: 'Updated' });
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Failed to update event');
    });
  });

  describe('remove', () => {
    it('deletes event successfully', async () => {
      vi.mocked(deleteEvent).mockResolvedValue();

      const { result } = renderHook(() => useEventMutation());

      await act(async () => {
        await result.current.remove('event-1');
      });

      expect(deleteEvent).toHaveBeenCalledWith('event-1');
      expect(result.current.error).toBe(null);
    });

    it('sets isDeleting during delete operation', async () => {
      let resolvePromise: () => void;
      vi.mocked(deleteEvent).mockImplementation(
        () => new Promise((resolve) => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() => useEventMutation());

      expect(result.current.isDeleting).toBe(false);

      let deletePromise: Promise<void>;
      act(() => {
        deletePromise = result.current.remove('event-1');
      });

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(true);
      });

      await act(async () => {
        resolvePromise!();
        await deletePromise;
      });

      expect(result.current.isDeleting).toBe(false);
    });

    it('handles delete error with Error instance', async () => {
      vi.mocked(deleteEvent).mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useEventMutation());

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.remove('event-1');
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Delete failed');
      expect(result.current.error).toBe('Delete failed');
      expect(result.current.isDeleting).toBe(false);
    });

    it('handles non-Error exception in delete', async () => {
      vi.mocked(deleteEvent).mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useEventMutation());

      await act(async () => {
        try {
          await result.current.remove('event-1');
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Failed to delete event');
    });
  });

  describe('clearError', () => {
    it('clears error state', async () => {
      vi.mocked(createEvent).mockRejectedValue(new Error('Some error'));

      const { result } = renderHook(() => useEventMutation());

      // Trigger an error
      await act(async () => {
        try {
          await result.current.create({
            type: 'lab_result',
            title: 'Test',
            date: '2024-01-15',
            biomarkers: [],
          });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Some error');

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('error clearing on new operation', () => {
    it('clears error when starting new create operation', async () => {
      // First operation fails
      vi.mocked(createEvent).mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useEventMutation());

      await act(async () => {
        try {
          await result.current.create({
            type: 'lab_result',
            title: 'Test',
            date: '2024-01-15',
            biomarkers: [],
          });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('First error');

      // Second operation succeeds
      vi.mocked(createEvent).mockResolvedValue(mockEvent);

      await act(async () => {
        await result.current.create({
          type: 'lab_result',
          title: 'Test',
          date: '2024-01-15',
          biomarkers: [],
        });
      });

      expect(result.current.error).toBe(null);
    });

    it('clears error when starting new update operation', async () => {
      // First operation fails
      vi.mocked(updateEvent).mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useEventMutation());

      await act(async () => {
        try {
          await result.current.update('event-1', { title: 'Updated' });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('First error');

      // Second operation succeeds
      vi.mocked(updateEvent).mockResolvedValue(mockEvent);

      await act(async () => {
        await result.current.update('event-1', { title: 'Updated' });
      });

      expect(result.current.error).toBe(null);
    });

    it('clears error when starting new delete operation', async () => {
      // First operation fails
      vi.mocked(deleteEvent).mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useEventMutation());

      await act(async () => {
        try {
          await result.current.remove('event-1');
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('First error');

      // Second operation succeeds
      vi.mocked(deleteEvent).mockResolvedValue();

      await act(async () => {
        await result.current.remove('event-1');
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('initial state', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useEventMutation());

      expect(result.current.isCreating).toBe(false);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isDeleting).toBe(false);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.create).toBe('function');
      expect(typeof result.current.update).toBe('function');
      expect(typeof result.current.remove).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });
});
