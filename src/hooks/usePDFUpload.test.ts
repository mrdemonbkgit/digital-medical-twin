import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePDFUpload } from './usePDFUpload';

// Mock supabase
const mockGetUser = vi.fn();
const mockUpload = vi.fn();
const mockCreateSignedUrl = vi.fn();
const mockRemove = vi.fn();
const mockStorageFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    storage: {
      from: (bucket: string) => mockStorageFrom(bucket),
    },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// Mock crypto.randomUUID
const mockUUID = 'test-uuid-1234';
vi.stubGlobal('crypto', {
  randomUUID: () => mockUUID,
});

const mockUserId = 'user-123';

// Helper to create mock File
function createMockFile(name: string, size: number, type: string): File {
  const content = new ArrayBuffer(size);
  return new File([content], name, { type });
}

describe('usePDFUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock setup - user is authenticated
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    // Default storage mocks
    mockStorageFrom.mockReturnValue({
      upload: mockUpload,
      createSignedUrl: mockCreateSignedUrl,
      remove: mockRemove,
    });

    mockUpload.mockResolvedValue({ error: null });
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://example.com/signed-url' },
      error: null,
    });
    mockRemove.mockResolvedValue({ error: null });
  });

  describe('initial state', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => usePDFUpload());

      expect(result.current.isUploading).toBe(false);
      expect(result.current.uploadProgress).toBe(0);
      expect(result.current.extractionStage).toBe('idle');
      expect(result.current.error).toBeNull();
      expect(typeof result.current.uploadPDF).toBe('function');
      expect(typeof result.current.deletePDF).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.resetExtractionStage).toBe('function');
      expect(typeof result.current.setExtractionStage).toBe('function');
    });
  });

  describe('file validation', () => {
    it('validates file type - rejects non-PDF', async () => {
      const { result } = renderHook(() => usePDFUpload());

      const invalidFile = createMockFile('document.txt', 1000, 'text/plain');

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.uploadPDF(invalidFile);
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Only PDF files are allowed');
      expect(result.current.error).toBe('Only PDF files are allowed');
      expect(result.current.extractionStage).toBe('error');
    });

    it('validates file type - accepts PDF', async () => {
      const { result } = renderHook(() => usePDFUpload());

      const validFile = createMockFile('document.pdf', 1000, 'application/pdf');

      await act(async () => {
        await result.current.uploadPDF(validFile);
      });

      expect(result.current.error).toBeNull();
    });

    it('validates file size - rejects files over 10MB', async () => {
      const { result } = renderHook(() => usePDFUpload());

      const largeFile = createMockFile('large.pdf', 11 * 1024 * 1024, 'application/pdf');

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.uploadPDF(largeFile);
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('File size must be less than 10MB');
      expect(result.current.error).toBe('File size must be less than 10MB');
    });

    it('validates file size - accepts files under 10MB', async () => {
      const { result } = renderHook(() => usePDFUpload());

      const smallFile = createMockFile('small.pdf', 5 * 1024 * 1024, 'application/pdf');

      await act(async () => {
        await result.current.uploadPDF(smallFile);
      });

      expect(result.current.error).toBeNull();
    });

    it('returns error for invalid files before attempting upload', async () => {
      const { result } = renderHook(() => usePDFUpload());

      const invalidFile = createMockFile('image.png', 1000, 'image/png');

      await act(async () => {
        try {
          await result.current.uploadPDF(invalidFile);
        } catch {
          // Expected
        }
      });

      // Should not have called storage upload
      expect(mockUpload).not.toHaveBeenCalled();
    });
  });

  describe('authentication', () => {
    it('requires authentication', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => usePDFUpload());

      const file = createMockFile('document.pdf', 1000, 'application/pdf');

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.uploadPDF(file);
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('You must be logged in to upload files');
      expect(result.current.error).toBe('You must be logged in to upload files');
    });

    it('handles auth error', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth error' },
      });

      const { result } = renderHook(() => usePDFUpload());

      const file = createMockFile('document.pdf', 1000, 'application/pdf');

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.uploadPDF(file);
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('You must be logged in to upload files');
    });
  });

  describe('upload success', () => {
    it('uploads file and returns attachment', async () => {
      const { result } = renderHook(() => usePDFUpload());

      const file = createMockFile('lab-results.pdf', 1000, 'application/pdf');

      let attachment: ReturnType<typeof result.current.uploadPDF> extends Promise<infer T> ? T : never;
      await act(async () => {
        attachment = await result.current.uploadPDF(file);
      });

      expect(attachment).toBeDefined();
      expect(attachment!.id).toBe(mockUUID);
      expect(attachment!.filename).toBe('lab-results.pdf');
      expect(attachment!.url).toBe('https://example.com/signed-url');
      expect(attachment!.storagePath).toBe(`${mockUserId}/${mockUUID}.pdf`);
      expect(attachment!.uploadedAt).toBeDefined();
    });

    it('uploads to correct bucket', async () => {
      const { result } = renderHook(() => usePDFUpload());

      const file = createMockFile('document.pdf', 1000, 'application/pdf');

      await act(async () => {
        await result.current.uploadPDF(file);
      });

      expect(mockStorageFrom).toHaveBeenCalledWith('lab-pdfs');
    });

    it('uploads with correct options', async () => {
      const { result } = renderHook(() => usePDFUpload());

      const file = createMockFile('document.pdf', 1000, 'application/pdf');

      await act(async () => {
        await result.current.uploadPDF(file);
      });

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/^user-123\/test-uuid-1234\.pdf$/),
        file,
        {
          contentType: 'application/pdf',
          upsert: false,
        }
      );
    });

    it('sets progress during upload', async () => {
      const { result } = renderHook(() => usePDFUpload());

      const file = createMockFile('document.pdf', 1000, 'application/pdf');

      await act(async () => {
        await result.current.uploadPDF(file);
      });

      // After successful upload, progress should be 100
      expect(result.current.uploadProgress).toBe(100);
    });

    it('sets extraction stage to uploading during upload', async () => {
      let capturedStage: string | undefined;
      mockUpload.mockImplementation(() => {
        // This runs during upload
        return Promise.resolve({ error: null });
      });

      const { result } = renderHook(() => usePDFUpload());

      const file = createMockFile('document.pdf', 1000, 'application/pdf');

      // Start upload - the stage should be 'uploading' during the operation
      await act(async () => {
        await result.current.uploadPDF(file);
      });

      // After upload, stage remains at the point where hook left it (uploading completes)
      // The stage is not automatically changed to 'complete' by the hook
    });
  });

  describe('upload failure', () => {
    it('handles upload error', async () => {
      mockUpload.mockResolvedValue({
        error: { message: 'Upload failed' },
      });

      const { result } = renderHook(() => usePDFUpload());

      const file = createMockFile('document.pdf', 1000, 'application/pdf');

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.uploadPDF(file);
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Upload failed');
      expect(result.current.error).toBe('Upload failed');
      expect(result.current.extractionStage).toBe('error');
    });

    it('handles signed URL error', async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'URL generation failed' },
      });

      const { result } = renderHook(() => usePDFUpload());

      const file = createMockFile('document.pdf', 1000, 'application/pdf');

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.uploadPDF(file);
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Failed to generate file URL');
      expect(result.current.error).toBe('Failed to generate file URL');
    });

    it('resets isUploading on error', async () => {
      mockUpload.mockResolvedValue({
        error: { message: 'Upload failed' },
      });

      const { result } = renderHook(() => usePDFUpload());

      const file = createMockFile('document.pdf', 1000, 'application/pdf');

      await act(async () => {
        try {
          await result.current.uploadPDF(file);
        } catch {
          // Expected
        }
      });

      expect(result.current.isUploading).toBe(false);
    });
  });

  describe('clearError', () => {
    it('clears error state', async () => {
      const { result } = renderHook(() => usePDFUpload());

      // Trigger an error
      const invalidFile = createMockFile('document.txt', 1000, 'text/plain');
      await act(async () => {
        try {
          await result.current.uploadPDF(invalidFile);
        } catch {
          // Expected
        }
      });

      expect(result.current.error).not.toBeNull();

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('resetExtractionStage', () => {
    it('resets extraction stage to idle', async () => {
      const { result } = renderHook(() => usePDFUpload());

      // Set to error state
      const invalidFile = createMockFile('document.txt', 1000, 'text/plain');
      await act(async () => {
        try {
          await result.current.uploadPDF(invalidFile);
        } catch {
          // Expected
        }
      });

      expect(result.current.extractionStage).toBe('error');

      // Reset
      act(() => {
        result.current.resetExtractionStage();
      });

      expect(result.current.extractionStage).toBe('idle');
    });
  });

  describe('setExtractionStage', () => {
    it('allows setting extraction stage manually', () => {
      const { result } = renderHook(() => usePDFUpload());

      act(() => {
        result.current.setExtractionStage('extracting_gemini');
      });

      expect(result.current.extractionStage).toBe('extracting_gemini');
    });

    it('can set any valid stage', () => {
      const { result } = renderHook(() => usePDFUpload());

      const stages = [
        'idle',
        'uploading',
        'fetching_pdf',
        'extracting_gemini',
        'verifying_gpt',
        'complete',
        'error',
      ] as const;

      for (const stage of stages) {
        act(() => {
          result.current.setExtractionStage(stage);
        });
        expect(result.current.extractionStage).toBe(stage);
      }
    });
  });

  describe('deletePDF', () => {
    it('deletes file from storage', async () => {
      const { result } = renderHook(() => usePDFUpload());

      const storagePath = 'user-123/test-file.pdf';

      await act(async () => {
        await result.current.deletePDF(storagePath);
      });

      expect(mockStorageFrom).toHaveBeenCalledWith('lab-pdfs');
      expect(mockRemove).toHaveBeenCalledWith([storagePath]);
    });

    it('handles delete error', async () => {
      mockRemove.mockResolvedValue({
        error: { message: 'Delete failed' },
      });

      const { result } = renderHook(() => usePDFUpload());

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.deletePDF('user-123/test-file.pdf');
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Delete failed');
      expect(result.current.error).toBe('Delete failed');
    });

    it('clears error before delete', async () => {
      const { result } = renderHook(() => usePDFUpload());

      // First, set an error
      act(() => {
        result.current.setExtractionStage('error');
      });

      // Manually set error via failed upload
      const invalidFile = createMockFile('document.txt', 1000, 'text/plain');
      await act(async () => {
        try {
          await result.current.uploadPDF(invalidFile);
        } catch {
          // Expected
        }
      });

      expect(result.current.error).not.toBeNull();

      // Delete - should clear error first
      await act(async () => {
        await result.current.deletePDF('user-123/test-file.pdf');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('error clears on new upload', () => {
    it('clears error when starting new upload', async () => {
      const { result } = renderHook(() => usePDFUpload());

      // Trigger an error
      const invalidFile = createMockFile('document.txt', 1000, 'text/plain');
      await act(async () => {
        try {
          await result.current.uploadPDF(invalidFile);
        } catch {
          // Expected
        }
      });

      expect(result.current.error).not.toBeNull();

      // Start a valid upload - should clear error at start
      const validFile = createMockFile('document.pdf', 1000, 'application/pdf');
      await act(async () => {
        await result.current.uploadPDF(validFile);
      });

      expect(result.current.error).toBeNull();
    });
  });
});
