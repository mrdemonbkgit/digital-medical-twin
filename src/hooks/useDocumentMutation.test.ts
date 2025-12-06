import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDocumentMutation } from './useDocumentMutation';
import type { Document, CreateDocumentInput } from '@/types';

// Mock the API module
vi.mock('@/api/documents', () => ({
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

import { createDocument, updateDocument, deleteDocument } from '@/api/documents';

const mockDocument: Document = {
  id: 'doc-1',
  userId: 'user-123',
  filename: 'lab-results.pdf',
  storagePath: 'user-123/doc-1.pdf',
  fileSize: 1024000,
  mimeType: 'application/pdf',
  category: 'labs',
  title: 'Blood Test',
  description: null,
  documentDate: '2024-01-15',
  labUploadId: null,
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

describe('useDocumentMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('create', () => {
    it('creates a document successfully', async () => {
      vi.mocked(createDocument).mockResolvedValue(mockDocument);

      const { result } = renderHook(() => useDocumentMutation());

      const input: CreateDocumentInput = {
        filename: 'lab-results.pdf',
        storagePath: 'user-123/doc-1.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        category: 'labs',
        title: 'Blood Test',
      };

      let createdDoc: Document | undefined;
      await act(async () => {
        createdDoc = await result.current.create(input);
      });

      expect(createdDoc).toEqual(mockDocument);
      expect(createDocument).toHaveBeenCalledWith(input);
    });

    it('throws on create error', async () => {
      vi.mocked(createDocument).mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useDocumentMutation());

      await expect(
        act(async () => {
          await result.current.create({
            filename: 'test.pdf',
            storagePath: 'path',
            fileSize: 100,
            mimeType: 'application/pdf',
            category: 'other',
          });
        })
      ).rejects.toThrow('Create failed');
    });
  });

  describe('update', () => {
    it('updates a document successfully', async () => {
      const updatedDoc = { ...mockDocument, title: 'Updated Title' };
      vi.mocked(updateDocument).mockResolvedValue(updatedDoc);

      const { result } = renderHook(() => useDocumentMutation());

      let updated: Document | undefined;
      await act(async () => {
        updated = await result.current.update('doc-1', { title: 'Updated Title' });
      });

      expect(updated).toEqual(updatedDoc);
      expect(updateDocument).toHaveBeenCalledWith('doc-1', { title: 'Updated Title' });
    });

    it('throws on update error', async () => {
      vi.mocked(updateDocument).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useDocumentMutation());

      await expect(
        act(async () => {
          await result.current.update('doc-1', { title: 'New Title' });
        })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('remove', () => {
    it('deletes a document successfully', async () => {
      vi.mocked(deleteDocument).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDocumentMutation());

      await act(async () => {
        await result.current.remove('doc-1');
      });

      expect(deleteDocument).toHaveBeenCalledWith('doc-1');
    });

    it('throws on delete error', async () => {
      vi.mocked(deleteDocument).mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useDocumentMutation());

      await expect(
        act(async () => {
          await result.current.remove('doc-1');
        })
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('clearError', () => {
    it('clears the error state', () => {
      const { result } = renderHook(() => useDocumentMutation());

      // Initially no error
      expect(result.current.error).toBeNull();

      // clearError should be callable without error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('loading states', () => {
    it('returns correct initial state', () => {
      const { result } = renderHook(() => useDocumentMutation());

      expect(result.current.isCreating).toBe(false);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isDeleting).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
