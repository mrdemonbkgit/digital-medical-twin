import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useExportEvents } from './useExportEvents';
import type { HealthEvent } from '@/types';

// Mock events API
const mockGetAllEvents = vi.fn();

vi.mock('@/api/events', () => ({
  getAllEvents: (filters?: unknown) => mockGetAllEvents(filters),
}));

// Mock export utility
const mockExportEvents = vi.fn();

vi.mock('@/lib/exportData', () => ({
  exportEvents: (events: unknown, options: unknown) => mockExportEvents(events, options),
}));

const mockEvents: HealthEvent[] = [
  {
    id: 'event-1',
    user_id: 'user-123',
    type: 'lab_result',
    date: '2024-01-15',
    title: 'Blood Test',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'event-2',
    user_id: 'user-123',
    type: 'medication',
    date: '2024-01-20',
    title: 'Started Medication',
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
  },
];

describe('useExportEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('returns correct initial state', () => {
      const { result } = renderHook(() => useExportEvents());

      expect(result.current.isExporting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.exportAll).toBe('function');
      expect(typeof result.current.exportFiltered).toBe('function');
    });
  });

  describe('exportAll', () => {
    it('fetches all events and exports', async () => {
      mockGetAllEvents.mockResolvedValue(mockEvents);

      const { result } = renderHook(() => useExportEvents());

      await act(async () => {
        await result.current.exportAll();
      });

      expect(mockGetAllEvents).toHaveBeenCalled();
      expect(mockExportEvents).toHaveBeenCalledWith(mockEvents, { format: 'json' });
    });

    it('uses default JSON format', async () => {
      mockGetAllEvents.mockResolvedValue(mockEvents);

      const { result } = renderHook(() => useExportEvents());

      await act(async () => {
        await result.current.exportAll();
      });

      expect(mockExportEvents).toHaveBeenCalledWith(mockEvents, { format: 'json' });
    });

    it('respects custom export options', async () => {
      mockGetAllEvents.mockResolvedValue(mockEvents);

      const { result } = renderHook(() => useExportEvents());

      await act(async () => {
        await result.current.exportAll({ format: 'csv' });
      });

      expect(mockExportEvents).toHaveBeenCalledWith(mockEvents, { format: 'csv' });
    });

    it('sets isExporting during export', async () => {
      let resolveExport: () => void;
      mockGetAllEvents.mockReturnValue(
        new Promise((resolve) => {
          resolveExport = () => resolve(mockEvents);
        })
      );

      const { result } = renderHook(() => useExportEvents());

      let exportPromise: Promise<void>;
      act(() => {
        exportPromise = result.current.exportAll();
      });

      expect(result.current.isExporting).toBe(true);

      await act(async () => {
        resolveExport!();
        await exportPromise;
      });

      expect(result.current.isExporting).toBe(false);
    });

    it('sets error when no events to export', async () => {
      mockGetAllEvents.mockResolvedValue([]);

      const { result } = renderHook(() => useExportEvents());

      await act(async () => {
        await result.current.exportAll();
      });

      expect(result.current.error).toBe('No events to export');
      expect(mockExportEvents).not.toHaveBeenCalled();
    });

    it('sets error on fetch failure', async () => {
      mockGetAllEvents.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useExportEvents());

      await act(async () => {
        await result.current.exportAll();
      });

      expect(result.current.error).toBe('Network error');
    });

    it('clears error before new export', async () => {
      mockGetAllEvents.mockRejectedValueOnce(new Error('First error'));
      mockGetAllEvents.mockResolvedValueOnce(mockEvents);

      const { result } = renderHook(() => useExportEvents());

      await act(async () => {
        await result.current.exportAll();
      });

      expect(result.current.error).toBe('First error');

      await act(async () => {
        await result.current.exportAll();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('exportFiltered', () => {
    it('fetches filtered events and exports', async () => {
      mockGetAllEvents.mockResolvedValue([mockEvents[0]]);
      const filters = { types: ['lab_result'] };

      const { result } = renderHook(() => useExportEvents());

      await act(async () => {
        await result.current.exportFiltered(filters);
      });

      expect(mockGetAllEvents).toHaveBeenCalledWith(filters);
      expect(mockExportEvents).toHaveBeenCalledWith([mockEvents[0]], { format: 'json' });
    });

    it('applies date range filters', async () => {
      mockGetAllEvents.mockResolvedValue(mockEvents);
      const filters = { startDate: '2024-01-01', endDate: '2024-01-31' };

      const { result } = renderHook(() => useExportEvents());

      await act(async () => {
        await result.current.exportFiltered(filters);
      });

      expect(mockGetAllEvents).toHaveBeenCalledWith(filters);
    });

    it('respects custom export options', async () => {
      mockGetAllEvents.mockResolvedValue(mockEvents);

      const { result } = renderHook(() => useExportEvents());

      await act(async () => {
        await result.current.exportFiltered({}, { format: 'csv' });
      });

      expect(mockExportEvents).toHaveBeenCalledWith(mockEvents, { format: 'csv' });
    });

    it('sets error when no events match filters', async () => {
      mockGetAllEvents.mockResolvedValue([]);

      const { result } = renderHook(() => useExportEvents());

      await act(async () => {
        await result.current.exportFiltered({ types: ['nonexistent'] });
      });

      expect(result.current.error).toBe('No events match the current filters');
      expect(mockExportEvents).not.toHaveBeenCalled();
    });

    it('sets isExporting during filtered export', async () => {
      mockGetAllEvents.mockResolvedValue(mockEvents);

      const { result } = renderHook(() => useExportEvents());

      let exportPromise: Promise<void>;
      act(() => {
        exportPromise = result.current.exportFiltered({});
      });

      expect(result.current.isExporting).toBe(true);

      await act(async () => {
        await exportPromise;
      });

      expect(result.current.isExporting).toBe(false);
    });
  });
});
