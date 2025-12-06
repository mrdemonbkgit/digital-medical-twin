import { useState, useEffect, useCallback } from 'react';
import { getDocuments } from '@/api/documents';
import type { Document, DocumentCategory } from '@/types';

interface UseDocumentsOptions {
  category?: DocumentCategory;
  autoFetch?: boolean;
}

interface UseDocumentsReturn {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDocuments(options: UseDocumentsOptions = {}): UseDocumentsReturn {
  const { category, autoFetch = true } = options;
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getDocuments(category);
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  const refetch = useCallback(async () => {
    await fetchDocuments();
  }, [fetchDocuments]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchDocuments();
    }
  }, [autoFetch, fetchDocuments]);

  return {
    documents,
    isLoading,
    error,
    refetch,
  };
}
