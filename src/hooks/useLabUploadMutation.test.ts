import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLabUploadMutation } from './useLabUploadMutation';
import type { LabUpload, CreateLabUploadInput } from '@/types';

// Mock the API module
vi.mock('@/api/labUploads', () => ({
  createLabUpload: vi.fn(),
  updateLabUpload: vi.fn(),
  deleteLabUpload: vi.fn(),
}));

import { createLabUpload, updateLabUpload, deleteLabUpload } from '@/api/labUploads';

const mockUpload: LabUpload = {
  id: 'upload-1',
  userId: 'user-123',
  filename: 'lab-results.pdf',
  storagePath: 'user-123/upload-1.pdf',
  fileSize: 1024000,
  status: 'pending',
  processingStage: null,
  skipVerification: false,
  extractedData: null,
  extractionConfidence: null,
  verificationPassed: null,
  corrections: null,
  errorMessage: null,
  createdAt: '2024-01-01T00:00:00Z',
  startedAt: null,
  completedAt: null,
  eventId: null,
};

describe('useLabUploadMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('create', () => {
    it('creates upload and returns result', async () => {
      vi.mocked(createLabUpload).mockResolvedValue(mockUpload);

      const { result } = renderHook(() => useLabUploadMutation());

      const input: CreateLabUploadInput = {
        filename: 'lab-results.pdf',
        storagePath: 'user-123/upload-1.pdf',
        fileSize: 1024000,
        skipVerification: false,
      };

      let createdUpload: LabUpload | undefined;
      await act(async () => {
        createdUpload = await result.current.create(input);
      });

      expect(createdUpload).toEqual(mockUpload);
      expect(createLabUpload).toHaveBeenCalledWith(input);
    });

    it('sets isCreating during create operation', async () => {
      let resolvePromise: (value: LabUpload) => void;
      vi.mocked(createLabUpload).mockImplementation(
        () => new Promise((resolve) => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() => useLabUploadMutation());

      expect(result.current.isCreating).toBe(false);

      // Start create operation
      let createPromise: Promise<LabUpload>;
      act(() => {
        createPromise = result.current.create({
          filename: 'test.pdf',
          storagePath: 'path/test.pdf',
          fileSize: 1000,
          skipVerification: false,
        });
      });

      await waitFor(() => {
        expect(result.current.isCreating).toBe(true);
      });

      // Resolve the promise
      await act(async () => {
        resolvePromise!(mockUpload);
        await createPromise;
      });

      expect(result.current.isCreating).toBe(false);
    });

    it('handles create error', async () => {
      vi.mocked(createLabUpload).mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useLabUploadMutation());

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.create({
            filename: 'test.pdf',
            storagePath: 'path/test.pdf',
            fileSize: 1000,
            skipVerification: false,
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
      vi.mocked(createLabUpload).mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useLabUploadMutation());

      await act(async () => {
        try {
          await result.current.create({
            filename: 'test.pdf',
            storagePath: 'path/test.pdf',
            fileSize: 1000,
            skipVerification: false,
          });
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Failed to create upload');
    });
  });

  describe('update', () => {
    it('updates upload and returns result', async () => {
      const updatedUpload = { ...mockUpload, status: 'complete' as const };
      vi.mocked(updateLabUpload).mockResolvedValue(updatedUpload);

      const { result } = renderHook(() => useLabUploadMutation());

      let updated: LabUpload | undefined;
      await act(async () => {
        updated = await result.current.update('upload-1', { status: 'complete' });
      });

      expect(updated).toEqual(updatedUpload);
      expect(updateLabUpload).toHaveBeenCalledWith('upload-1', { status: 'complete' });
    });

    it('sets isUpdating during update operation', async () => {
      let resolvePromise: (value: LabUpload) => void;
      vi.mocked(updateLabUpload).mockImplementation(
        () => new Promise((resolve) => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() => useLabUploadMutation());

      expect(result.current.isUpdating).toBe(false);

      let updatePromise: Promise<LabUpload>;
      act(() => {
        updatePromise = result.current.update('upload-1', { status: 'complete' });
      });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(true);
      });

      await act(async () => {
        resolvePromise!(mockUpload);
        await updatePromise;
      });

      expect(result.current.isUpdating).toBe(false);
    });

    it('handles update error', async () => {
      vi.mocked(updateLabUpload).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useLabUploadMutation());

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.update('upload-1', { status: 'complete' });
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Update failed');
      expect(result.current.error).toBe('Update failed');
      expect(result.current.isUpdating).toBe(false);
    });
  });

  describe('remove', () => {
    it('deletes upload successfully', async () => {
      vi.mocked(deleteLabUpload).mockResolvedValue();

      const { result } = renderHook(() => useLabUploadMutation());

      await act(async () => {
        await result.current.remove('upload-1');
      });

      expect(deleteLabUpload).toHaveBeenCalledWith('upload-1');
      expect(result.current.error).toBe(null);
    });

    it('sets isDeleting during delete operation', async () => {
      let resolvePromise: () => void;
      vi.mocked(deleteLabUpload).mockImplementation(
        () => new Promise((resolve) => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() => useLabUploadMutation());

      expect(result.current.isDeleting).toBe(false);

      let deletePromise: Promise<void>;
      act(() => {
        deletePromise = result.current.remove('upload-1');
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

    it('handles delete error', async () => {
      vi.mocked(deleteLabUpload).mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useLabUploadMutation());

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.remove('upload-1');
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Delete failed');
      expect(result.current.error).toBe('Delete failed');
      expect(result.current.isDeleting).toBe(false);
    });
  });

  describe('clearError', () => {
    it('clears error state', async () => {
      vi.mocked(createLabUpload).mockRejectedValue(new Error('Some error'));

      const { result } = renderHook(() => useLabUploadMutation());

      // Trigger an error
      await act(async () => {
        try {
          await result.current.create({
            filename: 'test.pdf',
            storagePath: 'path/test.pdf',
            fileSize: 1000,
            skipVerification: false,
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
      vi.mocked(createLabUpload).mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useLabUploadMutation());

      await act(async () => {
        try {
          await result.current.create({
            filename: 'test.pdf',
            storagePath: 'path/test.pdf',
            fileSize: 1000,
            skipVerification: false,
          });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('First error');

      // Second operation succeeds
      vi.mocked(createLabUpload).mockResolvedValue(mockUpload);

      await act(async () => {
        await result.current.create({
          filename: 'test.pdf',
          storagePath: 'path/test.pdf',
          fileSize: 1000,
          skipVerification: false,
        });
      });

      expect(result.current.error).toBe(null);
    });
  });
});
