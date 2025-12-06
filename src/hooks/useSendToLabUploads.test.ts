import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSendToLabUploads } from './useSendToLabUploads';
import type { Document, LabUpload } from '@/types';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        download: vi.fn(),
        upload: vi.fn(),
      })),
    },
  },
}));

// Mock API functions
vi.mock('@/api/labUploads', () => ({
  createLabUpload: vi.fn(),
}));

vi.mock('@/api/documents', () => ({
  updateDocument: vi.fn(),
}));

// Mock correlation context
vi.mock('@/context/CorrelationContext', () => ({
  useCorrelation: () => ({
    sessionId: 'session-123',
    currentOperationId: 'op-123',
    startOperation: vi.fn(),
    endOperation: vi.fn(),
  }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// Mock getCorrelationHeaders
vi.mock('@/lib/api', () => ({
  getCorrelationHeaders: vi.fn(() => ({})),
}));

import { supabase } from '@/lib/supabase';
import { createLabUpload } from '@/api/labUploads';
import { updateDocument } from '@/api/documents';

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

const mockLabUpload: LabUpload = {
  id: 'upload-1',
  userId: 'user-123',
  filename: 'lab-results.pdf',
  storagePath: 'user-123/new-path.pdf',
  fileSize: 1024000,
  status: 'pending',
  processingStage: null,
  skipVerification: false,
  extractedData: null,
  extractionConfidence: null,
  verificationPassed: null,
  corrections: null,
  errorMessage: null,
  createdAt: '2024-01-15T00:00:00Z',
  startedAt: null,
  completedAt: null,
  eventId: null,
};

describe('useSendToLabUploads', () => {
  const mockUser = { id: 'user-123', email: 'test@test.com' };
  const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    global.crypto = { randomUUID: () => 'random-uuid' } as any;

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'token-123' } as any },
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useSendToLabUploads());

    expect(result.current.isSending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('rejects non-labs category documents', async () => {
    const { result } = renderHook(() => useSendToLabUploads());

    const nonLabDoc = { ...mockDocument, category: 'prescriptions' as const };

    await act(async () => {
      try {
        await result.current.sendToLabUploads(nonLabDoc);
      } catch {
        // Expected
      }
    });

    expect(result.current.error).toBe('Only documents in the "Labs" category can be sent for extraction');
  });

  it('rejects non-PDF documents', async () => {
    const { result } = renderHook(() => useSendToLabUploads());

    const imageDoc = { ...mockDocument, mimeType: 'image/jpeg' };

    await act(async () => {
      try {
        await result.current.sendToLabUploads(imageDoc);
      } catch {
        // Expected
      }
    });

    expect(result.current.error).toBe('Only PDF files can be sent for extraction');
  });

  it('rejects already extracted documents', async () => {
    const { result } = renderHook(() => useSendToLabUploads());

    const extractedDoc = { ...mockDocument, labUploadId: 'existing-upload' };

    await act(async () => {
      try {
        await result.current.sendToLabUploads(extractedDoc);
      } catch {
        // Expected
      }
    });

    expect(result.current.error).toBe('This document has already been sent for extraction');
  });

  it('requires authentication', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useSendToLabUploads());

    await act(async () => {
      try {
        await result.current.sendToLabUploads(mockDocument);
      } catch {
        // Expected
      }
    });

    expect(result.current.error).toBe('You must be logged in');
  });

  it('sends document to lab uploads successfully', async () => {
    const mockDownload = vi.fn().mockResolvedValue({ data: mockBlob, error: null });
    const mockUpload = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.storage.from).mockReturnValue({
      download: mockDownload,
      upload: mockUpload,
    } as any);

    vi.mocked(createLabUpload).mockResolvedValue(mockLabUpload);
    vi.mocked(updateDocument).mockResolvedValue({ ...mockDocument, labUploadId: mockLabUpload.id });

    const { result } = renderHook(() => useSendToLabUploads());

    let labUpload: LabUpload | undefined;
    await act(async () => {
      labUpload = await result.current.sendToLabUploads(mockDocument);
    });

    expect(labUpload).toEqual(mockLabUpload);
    expect(supabase.storage.from).toHaveBeenCalledWith('documents');
    expect(supabase.storage.from).toHaveBeenCalledWith('lab-pdfs');
    expect(createLabUpload).toHaveBeenCalled();
    expect(updateDocument).toHaveBeenCalledWith(mockDocument.id, { labUploadId: mockLabUpload.id });
  });

  it('handles download errors', async () => {
    const mockDownload = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'File not found' },
    });
    vi.mocked(supabase.storage.from).mockReturnValue({
      download: mockDownload,
    } as any);

    const { result } = renderHook(() => useSendToLabUploads());

    await act(async () => {
      try {
        await result.current.sendToLabUploads(mockDocument);
      } catch {
        // Expected
      }
    });

    expect(result.current.error).toBe('Failed to download document: File not found');
  });

  it('handles upload errors', async () => {
    const mockDownload = vi.fn().mockResolvedValue({ data: mockBlob, error: null });
    const mockUpload = vi.fn().mockResolvedValue({
      error: { message: 'Upload failed' },
    });
    vi.mocked(supabase.storage.from).mockReturnValue({
      download: mockDownload,
      upload: mockUpload,
    } as any);

    const { result } = renderHook(() => useSendToLabUploads());

    await act(async () => {
      try {
        await result.current.sendToLabUploads(mockDocument);
      } catch {
        // Expected
      }
    });

    expect(result.current.error).toBe('Failed to copy to lab storage: Upload failed');
  });

  it('clears error', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useSendToLabUploads());

    await act(async () => {
      try {
        await result.current.sendToLabUploads(mockDocument);
      } catch {
        // Expected
      }
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('passes skipVerification flag', async () => {
    const mockDownload = vi.fn().mockResolvedValue({ data: mockBlob, error: null });
    const mockUpload = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.storage.from).mockReturnValue({
      download: mockDownload,
      upload: mockUpload,
    } as any);

    vi.mocked(createLabUpload).mockResolvedValue(mockLabUpload);
    vi.mocked(updateDocument).mockResolvedValue({ ...mockDocument, labUploadId: mockLabUpload.id });

    const { result } = renderHook(() => useSendToLabUploads());

    await act(async () => {
      await result.current.sendToLabUploads(mockDocument, true);
    });

    expect(createLabUpload).toHaveBeenCalledWith(
      expect.objectContaining({ skipVerification: true })
    );
  });
});
