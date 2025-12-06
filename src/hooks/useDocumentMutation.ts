import { useState, useCallback } from 'react';
import {
  createDocument,
  updateDocument,
  deleteDocument,
} from '@/api/documents';
import type { Document, CreateDocumentInput, UpdateDocumentInput } from '@/types';

interface UseDocumentMutationReturn {
  create: (input: CreateDocumentInput) => Promise<Document>;
  update: (id: string, input: UpdateDocumentInput) => Promise<Document>;
  remove: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  clearError: () => void;
}

export function useDocumentMutation(): UseDocumentMutationReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const create = useCallback(async (input: CreateDocumentInput): Promise<Document> => {
    setIsCreating(true);
    setError(null);

    try {
      const document = await createDocument(input);
      return document;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create document';
      setError(message);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const update = useCallback(async (id: string, input: UpdateDocumentInput): Promise<Document> => {
    setIsUpdating(true);
    setError(null);

    try {
      const document = await updateDocument(id, input);
      return document;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update document';
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
      await deleteDocument(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete document';
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
