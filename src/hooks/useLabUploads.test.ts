import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLabUploads } from './useLabUploads';
import type { LabUpload } from '@/types';

// Mock the API module
vi.mock('@/api/labUploads', () => ({
  getLabUploads: vi.fn(),
}));

import { getLabUploads } from '@/api/labUploads';

const mockUploads: LabUpload[] = [
  {
    id: 'upload-1',
    userId: 'user-123',
    filename: 'lab-results-1.pdf',
    storagePath: 'user-123/upload-1.pdf',
    fileSize: 1024000,
    status: 'complete',
    processingStage: null,
    skipVerification: false,
    extractedData: {
      biomarkers: [{ name: 'LDL', value: 100, unit: 'mg/dL' }],
    },
    extractionConfidence: 0.95,
    verificationPassed: true,
    corrections: null,
    errorMessage: null,
    createdAt: '2024-01-01T00:00:00Z',
    startedAt: '2024-01-01T00:00:01Z',
    completedAt: '2024-01-01T00:00:10Z',
    eventId: null,
  },
  {
    id: 'upload-2',
    userId: 'user-123',
    filename: 'lab-results-2.pdf',
    storagePath: 'user-123/upload-2.pdf',
    fileSize: 2048000,
    status: 'processing',
    processingStage: 'extracting_gemini',
    skipVerification: false,
    extractedData: null,
    extractionConfidence: null,
    verificationPassed: null,
    corrections: null,
    errorMessage: null,
    createdAt: '2024-01-02T00:00:00Z',
    startedAt: '2024-01-02T00:00:01Z',
    completedAt: null,
    eventId: null,
  },
];

describe('useLabUploads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns loading state initially', () => {
    vi.mocked(getLabUploads).mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useLabUploads());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.uploads).toEqual([]);
  });

  it('fetches uploads on mount when autoFetch is true (default)', async () => {
    vi.mocked(getLabUploads).mockResolvedValue(mockUploads);

    const { result } = renderHook(() => useLabUploads());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.uploads).toEqual(mockUploads);
    expect(getLabUploads).toHaveBeenCalledTimes(1);
  });

  it('does not fetch on mount when autoFetch is false', async () => {
    const { result } = renderHook(() => useLabUploads({ autoFetch: false }));

    // Wait a tick
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.uploads).toEqual([]);
    expect(getLabUploads).not.toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(getLabUploads).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useLabUploads());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.uploads).toEqual([]);
  });

  it('handles non-Error exceptions', async () => {
    vi.mocked(getLabUploads).mockRejectedValue('Unknown error');

    const { result } = renderHook(() => useLabUploads());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch uploads');
  });

  it('refetch reloads uploads', async () => {
    vi.mocked(getLabUploads).mockResolvedValue([mockUploads[0]]);

    const { result } = renderHook(() => useLabUploads());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.uploads).toHaveLength(1);

    // Update mock for refetch
    vi.mocked(getLabUploads).mockResolvedValue(mockUploads);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.uploads).toHaveLength(2);
    expect(getLabUploads).toHaveBeenCalledTimes(2);
  });

  it('calculates hasProcessing correctly', async () => {
    // With processing upload
    vi.mocked(getLabUploads).mockResolvedValue(mockUploads);

    const { result } = renderHook(() => useLabUploads());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasProcessing).toBe(true);

    // Without processing uploads
    vi.mocked(getLabUploads).mockResolvedValue([mockUploads[0]]); // Only complete upload

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.hasProcessing).toBe(false);
  });

  // Note: Polling tests are skipped due to complexity with fake timers and async operations
  // The polling functionality is tested via integration tests
});
