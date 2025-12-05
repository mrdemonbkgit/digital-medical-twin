import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useImportEvents, type ImportProgress } from './useImportEvents';
import type { CreateEventInput } from '@/types';

// Mock events API
const mockCreateEvent = vi.fn();

vi.mock('@/api/events', () => ({
  createEvent: (input: unknown) => mockCreateEvent(input),
}));

// Mock import utilities
const mockReadFileAsText = vi.fn();
const mockParseImportFile = vi.fn();

vi.mock('@/lib/importData', () => ({
  readFileAsText: (file: unknown) => mockReadFileAsText(file),
  parseImportFile: (content: unknown) => mockParseImportFile(content),
}));

const mockEvents: CreateEventInput[] = [
  {
    type: 'lab_result',
    date: '2024-01-15',
    title: 'Blood Test',
  },
  {
    type: 'medication',
    date: '2024-01-20',
    title: 'Started Medication',
  },
];

function createMockFile(name: string, content: string, size?: number): File {
  const file = new File([content], name, { type: 'application/json' });
  if (size !== undefined) {
    Object.defineProperty(file, 'size', { value: size });
  }
  return file;
}

describe('useImportEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('returns correct initial state', () => {
      const { result } = renderHook(() => useImportEvents());

      expect(result.current.isValidating).toBe(false);
      expect(result.current.isImporting).toBe(false);
      expect(result.current.progress).toEqual({
        total: 0,
        completed: 0,
        failed: 0,
        errors: [],
      });
      expect(typeof result.current.validateFile).toBe('function');
      expect(typeof result.current.importEvents).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('validateFile', () => {
    it('rejects non-JSON files', async () => {
      const { result } = renderHook(() => useImportEvents());

      const file = new File(['content'], 'data.txt', { type: 'text/plain' });

      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateFile(file);
      });

      expect(validationResult).toEqual({
        success: false,
        events: [],
        errors: ['Only JSON files are supported'],
        warnings: [],
      });
    });

    it('rejects files over 10MB', async () => {
      const { result } = renderHook(() => useImportEvents());

      const file = createMockFile('large.json', '{}', 11 * 1024 * 1024);

      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateFile(file);
      });

      expect(validationResult).toEqual({
        success: false,
        events: [],
        errors: ['File size exceeds 10MB limit'],
        warnings: [],
      });
    });

    it('parses valid JSON file', async () => {
      mockReadFileAsText.mockResolvedValue('{"events":[]}');
      mockParseImportFile.mockReturnValue({
        success: true,
        events: mockEvents,
        errors: [],
        warnings: [],
      });

      const { result } = renderHook(() => useImportEvents());

      const file = createMockFile('events.json', '{"events":[]}');

      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateFile(file);
      });

      expect(mockReadFileAsText).toHaveBeenCalledWith(file);
      expect(mockParseImportFile).toHaveBeenCalledWith('{"events":[]}');
      expect(validationResult).toEqual({
        success: true,
        events: mockEvents,
        errors: [],
        warnings: [],
      });
    });

    it('sets isValidating during validation', async () => {
      let resolveRead: (value: string) => void;
      mockReadFileAsText.mockReturnValue(
        new Promise((resolve) => {
          resolveRead = resolve;
        })
      );
      mockParseImportFile.mockReturnValue({
        success: true,
        events: [],
        errors: [],
        warnings: [],
      });

      const { result } = renderHook(() => useImportEvents());

      const file = createMockFile('events.json', '{}');

      let validatePromise: Promise<unknown>;
      act(() => {
        validatePromise = result.current.validateFile(file);
      });

      expect(result.current.isValidating).toBe(true);

      await act(async () => {
        resolveRead!('{}');
        await validatePromise;
      });

      expect(result.current.isValidating).toBe(false);
    });
  });

  describe('importEvents', () => {
    it('imports events one by one', async () => {
      mockCreateEvent.mockResolvedValue({ id: 'new-id' });

      const { result } = renderHook(() => useImportEvents());

      await act(async () => {
        await result.current.importEvents(mockEvents);
      });

      expect(mockCreateEvent).toHaveBeenCalledTimes(2);
      expect(mockCreateEvent).toHaveBeenCalledWith(mockEvents[0]);
      expect(mockCreateEvent).toHaveBeenCalledWith(mockEvents[1]);
    });

    it('updates progress during import', async () => {
      mockCreateEvent.mockResolvedValue({ id: 'new-id' });

      const { result } = renderHook(() => useImportEvents());

      await act(async () => {
        await result.current.importEvents(mockEvents);
      });

      expect(result.current.progress).toEqual({
        total: 2,
        completed: 2,
        failed: 0,
        errors: [],
      });
    });

    it('tracks failed imports', async () => {
      mockCreateEvent.mockResolvedValueOnce({ id: 'id-1' });
      mockCreateEvent.mockRejectedValueOnce(new Error('Database error'));

      const { result } = renderHook(() => useImportEvents());

      let importResult: ImportProgress;
      await act(async () => {
        importResult = await result.current.importEvents(mockEvents);
      });

      expect(importResult!.completed).toBe(1);
      expect(importResult!.failed).toBe(1);
      expect(importResult!.errors).toHaveLength(1);
      expect(importResult!.errors[0]).toContain('Started Medication');
      expect(importResult!.errors[0]).toContain('Database error');
    });

    it('handles all events failing', async () => {
      mockCreateEvent.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useImportEvents());

      let importResult: ImportProgress;
      await act(async () => {
        importResult = await result.current.importEvents(mockEvents);
      });

      expect(importResult!.completed).toBe(0);
      expect(importResult!.failed).toBe(2);
      expect(importResult!.errors).toHaveLength(2);
    });

    it('sets isImporting during import', async () => {
      let resolveCreate: () => void;
      mockCreateEvent.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveCreate = () => resolve({ id: 'id' });
        })
      );
      mockCreateEvent.mockResolvedValue({ id: 'id' });

      const { result } = renderHook(() => useImportEvents());

      let importPromise: Promise<unknown>;
      act(() => {
        importPromise = result.current.importEvents(mockEvents);
      });

      expect(result.current.isImporting).toBe(true);

      await act(async () => {
        resolveCreate!();
        await importPromise;
      });

      expect(result.current.isImporting).toBe(false);
    });

    it('returns final progress', async () => {
      mockCreateEvent.mockResolvedValue({ id: 'new-id' });

      const { result } = renderHook(() => useImportEvents());

      let importResult: ImportProgress;
      await act(async () => {
        importResult = await result.current.importEvents(mockEvents);
      });

      expect(importResult!).toEqual({
        total: 2,
        completed: 2,
        failed: 0,
        errors: [],
      });
    });
  });

  describe('reset', () => {
    it('resets progress to initial state', async () => {
      mockCreateEvent.mockResolvedValue({ id: 'new-id' });

      const { result } = renderHook(() => useImportEvents());

      await act(async () => {
        await result.current.importEvents(mockEvents);
      });

      expect(result.current.progress.completed).toBe(2);

      act(() => {
        result.current.reset();
      });

      expect(result.current.progress).toEqual({
        total: 0,
        completed: 0,
        failed: 0,
        errors: [],
      });
    });
  });
});
