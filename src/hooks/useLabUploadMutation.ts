import { useState, useCallback } from 'react';
import {
  createLabUpload,
  updateLabUpload,
  deleteLabUpload,
} from '@/api/labUploads';
import type { LabUpload, CreateLabUploadInput, UpdateLabUploadInput } from '@/types';

interface UseLabUploadMutationReturn {
  create: (input: CreateLabUploadInput) => Promise<LabUpload>;
  update: (id: string, input: UpdateLabUploadInput) => Promise<LabUpload>;
  remove: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  clearError: () => void;
}

export function useLabUploadMutation(): UseLabUploadMutationReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const create = useCallback(async (input: CreateLabUploadInput): Promise<LabUpload> => {
    setIsCreating(true);
    setError(null);

    try {
      const upload = await createLabUpload(input);
      return upload;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create upload';
      setError(message);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const update = useCallback(async (id: string, input: UpdateLabUploadInput): Promise<LabUpload> => {
    setIsUpdating(true);
    setError(null);

    try {
      const upload = await updateLabUpload(id, input);
      return upload;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update upload';
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
      await deleteLabUpload(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete upload';
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
