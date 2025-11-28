import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLabUploadProcessor } from './useLabUploadProcessor';
import type { LabUpload } from '@/types';
import React from 'react';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
      })),
    },
  },
}));

vi.mock('@/api/labUploads', () => ({
  createLabUpload: vi.fn(),
  getLabUpload: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  getCorrelationHeaders: vi.fn(() => ({ 'x-correlation-id': 'test-correlation' })),
}));

vi.mock('@/context/CorrelationContext', () => ({
  useCorrelation: vi.fn(() => ({
    sessionId: 'test-session',
    currentOperationId: 'test-op',
    startOperation: vi.fn(),
    endOperation: vi.fn(),
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
    })),
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { supabase } from '@/lib/supabase';
import { createLabUpload, getLabUpload } from '@/api/labUploads';
import { useCorrelation } from '@/context/CorrelationContext';

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

describe('useLabUploadProcessor', () => {
  const mockStartOperation = vi.fn();
  const mockEndOperation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Setup correlation context mock
    vi.mocked(useCorrelation).mockReturnValue({
      sessionId: 'test-session',
      currentOperationId: 'test-op',
      startOperation: mockStartOperation,
      endOperation: mockEndOperation,
    });

    // Default auth mock
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as ReturnType<typeof supabase.auth.getUser> extends Promise<infer T> ? T : never);

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
      error: null,
    } as ReturnType<typeof supabase.auth.getSession> extends Promise<infer T> ? T : never);

    // Default storage mock
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
    } as unknown as ReturnType<typeof supabase.storage.from>);

    // Default API mocks
    vi.mocked(createLabUpload).mockResolvedValue(mockUpload);
    vi.mocked(getLabUpload).mockResolvedValue(mockUpload);

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('returns initial state correctly', () => {
    const { result } = renderHook(() => useLabUploadProcessor());

    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadProgress).toBe(0);
    expect(result.current.processingUploadId).toBe(null);
    expect(result.current.processingStage).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('rejects non-PDF files', async () => {
    const { result } = renderHook(() => useLabUploadProcessor());

    const invalidFile = new File(['content'], 'document.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await result.current.uploadAndProcess(invalidFile);
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError?.message).toBe('Only PDF files are allowed');
    expect(result.current.error).toBe('Only PDF files are allowed');
    expect(mockEndOperation).toHaveBeenCalled();
  });

  it('rejects files larger than 10MB', async () => {
    const { result } = renderHook(() => useLabUploadProcessor());

    // Create a mock file larger than 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    });
    Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });

    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await result.current.uploadAndProcess(largeFile);
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError?.message).toBe('File size must be less than 10MB');
    expect(result.current.error).toBe('File size must be less than 10MB');
  });

  it('requires authentication', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as ReturnType<typeof supabase.auth.getUser> extends Promise<infer T> ? T : never);

    const { result } = renderHook(() => useLabUploadProcessor());

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await result.current.uploadAndProcess(file);
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError?.message).toBe('You must be logged in to upload files');
    expect(result.current.error).toBe('You must be logged in to upload files');
  });

  it('uploads file to storage successfully', async () => {
    const mockStorageUpload = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: mockStorageUpload,
    } as unknown as ReturnType<typeof supabase.storage.from>);

    const { result } = renderHook(() => useLabUploadProcessor());

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.uploadAndProcess(file);
    });

    expect(supabase.storage.from).toHaveBeenCalledWith('lab-pdfs');
    expect(mockStorageUpload).toHaveBeenCalled();
    expect(createLabUpload).toHaveBeenCalled();
  });

  it('handles storage upload error', async () => {
    const mockStorageUpload = vi.fn().mockResolvedValue({
      error: { message: 'Storage error' },
    });
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: mockStorageUpload,
    } as unknown as ReturnType<typeof supabase.storage.from>);

    const { result } = renderHook(() => useLabUploadProcessor());

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await result.current.uploadAndProcess(file);
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError?.message).toBe('Storage error');
    expect(result.current.error).toBe('Storage error');
  });

  it('creates lab upload record after storage upload', async () => {
    const { result } = renderHook(() => useLabUploadProcessor());

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.uploadAndProcess(file, true);
    });

    expect(createLabUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'test.pdf',
        fileSize: file.size,
        skipVerification: true,
      })
    );
  });

  it('triggers processing API after upload', async () => {
    const { result } = renderHook(() => useLabUploadProcessor());

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.uploadAndProcess(file);
    });

    // Need to advance timers to allow trigger to complete
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/ai/process-lab-upload',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ uploadId: 'upload-1' }),
      })
    );
  });

  it('clears error with clearError', async () => {
    const { result } = renderHook(() => useLabUploadProcessor());

    // Trigger an error
    const invalidFile = new File(['content'], 'test.docx', { type: 'application/msword' });

    await act(async () => {
      try {
        await result.current.uploadAndProcess(invalidFile);
      } catch {
        // Expected
      }
    });

    expect(result.current.error).toBeTruthy();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('returns upload object on success', async () => {
    const { result } = renderHook(() => useLabUploadProcessor());

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    let returnedUpload: LabUpload | undefined;
    await act(async () => {
      returnedUpload = await result.current.uploadAndProcess(file);
    });

    expect(returnedUpload).toEqual(mockUpload);
  });

  it('starts operation with correlation tracking', async () => {
    const { result } = renderHook(() => useLabUploadProcessor());

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.uploadAndProcess(file);
    });

    expect(mockStartOperation).toHaveBeenCalledWith('lab-upload-process');
  });

  it('polls for status updates after upload', async () => {
    const processingUpload = { ...mockUpload, status: 'processing' as const, processingStage: 'extracting_gemini' as const };
    vi.mocked(getLabUpload).mockResolvedValue(processingUpload);

    const { result } = renderHook(() => useLabUploadProcessor());

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.uploadAndProcess(file);
    });

    // Initial poll
    expect(getLabUpload).toHaveBeenCalledWith('upload-1');

    // Advance to trigger next poll
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(getLabUpload).toHaveBeenCalledTimes(2);
  });

  it('stops polling when processing completes', async () => {
    const completeUpload = { ...mockUpload, status: 'complete' as const };
    vi.mocked(getLabUpload).mockResolvedValue(completeUpload);

    const { result } = renderHook(() => useLabUploadProcessor());

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.uploadAndProcess(file);
    });

    // Initial poll shows complete
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    const callCount = vi.mocked(getLabUpload).mock.calls.length;

    // Advance more time - should not poll again
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(getLabUpload).toHaveBeenCalledTimes(callCount);
    expect(result.current.processingUploadId).toBe(null);
    expect(mockEndOperation).toHaveBeenCalled();
  });

  it('sets error when processing fails', async () => {
    const failedUpload = {
      ...mockUpload,
      status: 'failed' as const,
      errorMessage: 'Extraction failed',
    };
    vi.mocked(getLabUpload).mockResolvedValue(failedUpload);

    const { result } = renderHook(() => useLabUploadProcessor());

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.uploadAndProcess(file);
    });

    // Poll should pick up failure
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current.error).toBe('Extraction failed');
    expect(result.current.processingUploadId).toBe(null);
  });
});
