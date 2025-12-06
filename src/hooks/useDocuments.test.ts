import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDocuments } from './useDocuments';
import type { Document } from '@/types';

// Mock the API module
vi.mock('@/api/documents', () => ({
  getDocuments: vi.fn(),
}));

import { getDocuments } from '@/api/documents';

const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    userId: 'user-123',
    filename: 'lab-results.pdf',
    storagePath: 'user-123/doc-1.pdf',
    fileSize: 1024000,
    mimeType: 'application/pdf',
    category: 'labs',
    title: 'Blood Test January',
    description: null,
    documentDate: '2024-01-15',
    labUploadId: null,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'doc-2',
    userId: 'user-123',
    filename: 'prescription.pdf',
    storagePath: 'user-123/doc-2.pdf',
    fileSize: 512000,
    mimeType: 'application/pdf',
    category: 'prescriptions',
    title: null,
    description: 'Monthly prescription',
    documentDate: null,
    labUploadId: null,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
];

describe('useDocuments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns loading state initially', () => {
    vi.mocked(getDocuments).mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useDocuments());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.documents).toEqual([]);
  });

  it('fetches documents on mount when autoFetch is true (default)', async () => {
    vi.mocked(getDocuments).mockResolvedValue(mockDocuments);

    const { result } = renderHook(() => useDocuments());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.documents).toEqual(mockDocuments);
    expect(getDocuments).toHaveBeenCalledTimes(1);
    expect(getDocuments).toHaveBeenCalledWith(undefined);
  });

  it('fetches documents with category filter', async () => {
    const labDocs = mockDocuments.filter((d) => d.category === 'labs');
    vi.mocked(getDocuments).mockResolvedValue(labDocs);

    const { result } = renderHook(() => useDocuments({ category: 'labs' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.documents).toEqual(labDocs);
    expect(getDocuments).toHaveBeenCalledWith('labs');
  });

  it('does not fetch on mount when autoFetch is false', async () => {
    const { result } = renderHook(() => useDocuments({ autoFetch: false }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.documents).toEqual([]);
    expect(getDocuments).not.toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(getDocuments).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDocuments());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.documents).toEqual([]);
  });

  it('handles non-Error exceptions', async () => {
    vi.mocked(getDocuments).mockRejectedValue('Unknown error');

    const { result } = renderHook(() => useDocuments());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch documents');
  });

  it('refetch reloads documents', async () => {
    vi.mocked(getDocuments).mockResolvedValue([mockDocuments[0]]);

    const { result } = renderHook(() => useDocuments());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.documents).toHaveLength(1);

    vi.mocked(getDocuments).mockResolvedValue(mockDocuments);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.documents).toHaveLength(2);
    expect(getDocuments).toHaveBeenCalledTimes(2);
  });
});
