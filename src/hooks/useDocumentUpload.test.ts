import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDocumentUpload } from './useDocumentUpload';
import type { Document } from '@/types';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
      })),
    },
  },
}));

// Mock createDocument API
vi.mock('@/api/documents', () => ({
  createDocument: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

import { supabase } from '@/lib/supabase';
import { createDocument } from '@/api/documents';

const mockDocument: Document = {
  id: 'doc-1',
  userId: 'user-123',
  filename: 'test.pdf',
  storagePath: 'user-123/abc.pdf',
  fileSize: 1024,
  mimeType: 'application/pdf',
  category: 'labs',
  title: null,
  description: null,
  documentDate: null,
  labUploadId: null,
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

describe('useDocumentUpload', () => {
  const mockUser = { id: 'user-123', email: 'test@test.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mocks
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useDocumentUpload());

    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadProgress).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('rejects invalid file types', async () => {
    const { result } = renderHook(() => useDocumentUpload());

    const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });

    await act(async () => {
      try {
        await result.current.upload(invalidFile, 'other');
      } catch {
        // Expected
      }
    });

    expect(result.current.error).toBe('Only PDF and image files (JPG, PNG, HEIC) are allowed');
  });

  it('rejects files over 10MB', async () => {
    const { result } = renderHook(() => useDocumentUpload());

    // Create a mock file larger than 10MB
    const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
    const largeFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' });

    await act(async () => {
      try {
        await result.current.upload(largeFile, 'other');
      } catch {
        // Expected
      }
    });

    expect(result.current.error).toBe('File size must be less than 10MB');
  });

  it('requires authentication', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useDocumentUpload());

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      try {
        await result.current.upload(file, 'labs');
      } catch {
        // Expected
      }
    });

    expect(result.current.error).toBe('You must be logged in to upload files');
  });

  it('uploads file successfully', async () => {
    const mockUpload = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.storage.from).mockReturnValue({ upload: mockUpload } as any);
    vi.mocked(createDocument).mockResolvedValue(mockDocument);

    const { result } = renderHook(() => useDocumentUpload());

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    let uploadedDoc: Document | undefined;
    await act(async () => {
      uploadedDoc = await result.current.upload(file, 'labs', { title: 'Test Doc' });
    });

    expect(uploadedDoc).toEqual(mockDocument);
    expect(supabase.storage.from).toHaveBeenCalledWith('documents');
    expect(mockUpload).toHaveBeenCalled();
    expect(createDocument).toHaveBeenCalled();
    expect(result.current.uploadProgress).toBe(100);
  });

  it('handles storage upload errors', async () => {
    const mockUpload = vi.fn().mockResolvedValue({ error: { message: 'Storage error' } });
    vi.mocked(supabase.storage.from).mockReturnValue({ upload: mockUpload } as any);

    const { result } = renderHook(() => useDocumentUpload());

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      try {
        await result.current.upload(file, 'labs');
      } catch {
        // Expected
      }
    });

    expect(result.current.error).toBe('Storage error');
    expect(result.current.isUploading).toBe(false);
  });

  it('clears error', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useDocumentUpload());

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      try {
        await result.current.upload(file, 'labs');
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

  it('accepts valid MIME types', async () => {
    const mockUpload = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.storage.from).mockReturnValue({ upload: mockUpload } as any);
    vi.mocked(createDocument).mockResolvedValue(mockDocument);

    const { result } = renderHook(() => useDocumentUpload());

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic'];

    for (const mimeType of validTypes) {
      const file = new File(['content'], `test.${mimeType.split('/')[1]}`, { type: mimeType });

      await act(async () => {
        await result.current.upload(file, 'other');
      });

      expect(result.current.error).toBeNull();
    }
  });
});
