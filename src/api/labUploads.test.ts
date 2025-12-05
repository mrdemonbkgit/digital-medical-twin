import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getLabUploads,
  getLabUpload,
  createLabUpload,
  updateLabUpload,
  deleteLabUpload,
  getLabUploadPdfUrl,
} from './labUploads';
import type { LabUploadRow, CreateLabUploadInput, UpdateLabUploadInput } from '@/types';

// Mock supabase
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();
const mockGetUser = vi.fn();
const mockStorageRemove = vi.fn();
const mockCreateSignedUrl = vi.fn();
const mockStorageFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: (table: string) => mockFrom(table),
    storage: {
      from: (bucket: string) => mockStorageFrom(bucket),
    },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

const mockUserId = 'user-123';

// Sample lab upload row (database format - snake_case)
const mockLabUploadRow: LabUploadRow = {
  id: 'upload-1',
  user_id: mockUserId,
  filename: 'lab-results.pdf',
  storage_path: 'user-123/upload-1.pdf',
  file_size: 1024000,
  status: 'pending',
  processing_stage: null,
  skip_verification: false,
  extracted_data: null,
  extraction_confidence: null,
  verification_passed: null,
  corrections: null,
  error_message: null,
  created_at: '2024-01-01T00:00:00Z',
  started_at: null,
  completed_at: null,
  event_id: null,
  current_page: null,
  total_pages: null,
};

const mockCompletedUploadRow: LabUploadRow = {
  ...mockLabUploadRow,
  id: 'upload-2',
  status: 'complete',
  processing_stage: 'done',
  started_at: '2024-01-01T00:01:00Z',
  completed_at: '2024-01-01T00:02:00Z',
  extracted_data: { test: 'data' },
  extraction_confidence: 0.95,
  verification_passed: true,
  event_id: 'event-1',
};

describe('labUploads API', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock setup - user is authenticated
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    // Setup Supabase query chain mocks
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
    });

    mockInsert.mockReturnValue({
      select: mockSelect,
    });

    mockUpdate.mockReturnValue({
      eq: mockEq,
    });

    mockDelete.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      select: mockSelect,
    });

    mockOrder.mockReturnValue({
      data: [mockLabUploadRow],
      error: null,
    });

    // Storage mocks
    mockStorageFrom.mockReturnValue({
      remove: mockStorageRemove,
      createSignedUrl: mockCreateSignedUrl,
    });
  });

  describe('getLabUploads', () => {
    it('fetches all lab uploads for authenticated user', async () => {
      mockOrder.mockReturnValue({
        data: [mockLabUploadRow, mockCompletedUploadRow],
        error: null,
      });

      const result = await getLabUploads();

      expect(mockFrom).toHaveBeenCalledWith('lab_uploads');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('upload-1');
      expect(result[1].id).toBe('upload-2');
    });

    it('transforms snake_case to camelCase', async () => {
      mockOrder.mockReturnValue({
        data: [mockCompletedUploadRow],
        error: null,
      });

      const result = await getLabUploads();

      expect(result[0].userId).toBe(mockUserId);
      expect(result[0].storagePath).toBe('user-123/upload-1.pdf');
      expect(result[0].fileSize).toBe(1024000);
      expect(result[0].skipVerification).toBe(false);
      expect(result[0].processingStage).toBe('done');
      expect(result[0].extractedData).toEqual({ test: 'data' });
      expect(result[0].extractionConfidence).toBe(0.95);
      expect(result[0].verificationPassed).toBe(true);
      expect(result[0].createdAt).toBe('2024-01-01T00:00:00Z');
      expect(result[0].startedAt).toBe('2024-01-01T00:01:00Z');
      expect(result[0].completedAt).toBe('2024-01-01T00:02:00Z');
      expect(result[0].eventId).toBe('event-1');
    });

    it('throws error when user not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getLabUploads()).rejects.toThrow('User not authenticated');
    });

    it('throws error on database error', async () => {
      mockOrder.mockReturnValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(getLabUploads()).rejects.toThrow('Failed to fetch lab uploads: Database error');
    });
  });

  describe('getLabUpload', () => {
    it('fetches single lab upload by id', async () => {
      mockSingle.mockReturnValue({
        data: mockLabUploadRow,
        error: null,
      });

      const result = await getLabUpload('upload-1');

      expect(mockFrom).toHaveBeenCalledWith('lab_uploads');
      expect(mockEq).toHaveBeenCalledWith('id', 'upload-1');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('upload-1');
    });

    it('returns null when upload not found', async () => {
      mockSingle.mockReturnValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await getLabUpload('nonexistent');

      expect(result).toBeNull();
    });

    it('throws error when user not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getLabUpload('upload-1')).rejects.toThrow('User not authenticated');
    });

    it('throws error on database error (non-404)', async () => {
      mockSingle.mockReturnValue({
        data: null,
        error: { code: 'OTHER', message: 'Database error' },
      });

      await expect(getLabUpload('upload-1')).rejects.toThrow('Failed to fetch lab upload: Database error');
    });
  });

  describe('createLabUpload', () => {
    it('creates new lab upload record', async () => {
      mockSingle.mockReturnValue({
        data: mockLabUploadRow,
        error: null,
      });

      const input: CreateLabUploadInput = {
        filename: 'lab-results.pdf',
        storagePath: 'user-123/upload-1.pdf',
        fileSize: 1024000,
        skipVerification: false,
      };

      const result = await createLabUpload(input);

      expect(mockFrom).toHaveBeenCalledWith('lab_uploads');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        filename: 'lab-results.pdf',
        storage_path: 'user-123/upload-1.pdf',
        file_size: 1024000,
        status: 'pending',
        skip_verification: false,
      });
      expect(result.id).toBe('upload-1');
      expect(result.status).toBe('pending');
    });

    it('creates upload with skipVerification true', async () => {
      mockSingle.mockReturnValue({
        data: { ...mockLabUploadRow, skip_verification: true },
        error: null,
      });

      const input: CreateLabUploadInput = {
        filename: 'lab-results.pdf',
        storagePath: 'user-123/upload-1.pdf',
        fileSize: 1024000,
        skipVerification: true,
      };

      const result = await createLabUpload(input);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ skip_verification: true })
      );
      expect(result.skipVerification).toBe(true);
    });

    it('throws error when user not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(createLabUpload({
        filename: 'test.pdf',
        storagePath: 'path/test.pdf',
        fileSize: 1000,
      })).rejects.toThrow('User not authenticated');
    });

    it('throws error on database error', async () => {
      mockSingle.mockReturnValue({
        data: null,
        error: { message: 'Insert failed' },
      });

      await expect(createLabUpload({
        filename: 'test.pdf',
        storagePath: 'path/test.pdf',
        fileSize: 1000,
      })).rejects.toThrow('Failed to create lab upload: Insert failed');
    });
  });

  describe('updateLabUpload', () => {
    it('updates lab upload status', async () => {
      mockSingle.mockReturnValue({
        data: { ...mockLabUploadRow, status: 'processing' },
        error: null,
      });

      const input: UpdateLabUploadInput = {
        status: 'processing',
      };

      const result = await updateLabUpload('upload-1', input);

      expect(mockFrom).toHaveBeenCalledWith('lab_uploads');
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'processing' });
      expect(mockEq).toHaveBeenCalledWith('id', 'upload-1');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(result.status).toBe('processing');
    });

    it('updates multiple fields', async () => {
      mockSingle.mockReturnValue({
        data: {
          ...mockLabUploadRow,
          status: 'complete',
          processing_stage: 'done',
          extracted_data: { biomarkers: [] },
          extraction_confidence: 0.9,
        },
        error: null,
      });

      const input: UpdateLabUploadInput = {
        status: 'complete',
        processingStage: 'done',
        extractedData: { biomarkers: [] },
        extractionConfidence: 0.9,
      };

      const result = await updateLabUpload('upload-1', input);

      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'complete',
        processing_stage: 'done',
        extracted_data: { biomarkers: [] },
        extraction_confidence: 0.9,
      });
      expect(result.status).toBe('complete');
      expect(result.processingStage).toBe('done');
    });

    it('throws error when user not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(updateLabUpload('upload-1', { status: 'processing' }))
        .rejects.toThrow('User not authenticated');
    });

    it('throws error on database error', async () => {
      mockSingle.mockReturnValue({
        data: null,
        error: { message: 'Update failed' },
      });

      await expect(updateLabUpload('upload-1', { status: 'processing' }))
        .rejects.toThrow('Failed to update lab upload: Update failed');
    });
  });

  describe('deleteLabUpload', () => {
    it('deletes lab upload and storage file', async () => {
      // Setup the mock chain for getLabUpload (called internally by deleteLabUpload)
      const mockDeleteEq = vi.fn().mockReturnValue({ error: null });

      mockEq.mockImplementation(() => ({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue({
            data: mockLabUploadRow,
            error: null,
          }),
        }),
        order: mockOrder,
        single: mockSingle,
        maybeSingle: mockMaybeSingle,
        select: mockSelect,
      }));

      // Mock the delete chain
      mockDelete.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: mockDeleteEq,
        }),
      });

      mockStorageRemove.mockResolvedValue({ error: null });

      await deleteLabUpload('upload-1');

      expect(mockStorageFrom).toHaveBeenCalledWith('lab-pdfs');
      expect(mockStorageRemove).toHaveBeenCalledWith(['user-123/upload-1.pdf']);
      expect(mockFrom).toHaveBeenCalledWith('lab_uploads');
    });

    it('throws error when upload not found', async () => {
      // Mock getLabUpload to return null (not found)
      mockEq.mockImplementation(() => ({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue({
            data: null,
            error: { code: 'PGRST116', message: 'Not found' },
          }),
        }),
        order: mockOrder,
        single: mockSingle,
        maybeSingle: mockMaybeSingle,
        select: mockSelect,
      }));

      await expect(deleteLabUpload('nonexistent')).rejects.toThrow('Lab upload not found');
    });

    it('continues with database delete even if storage delete fails', async () => {
      const mockDeleteEq = vi.fn().mockReturnValue({ error: null });

      mockEq.mockImplementation(() => ({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue({
            data: mockLabUploadRow,
            error: null,
          }),
        }),
        order: mockOrder,
        single: mockSingle,
        maybeSingle: mockMaybeSingle,
        select: mockSelect,
      }));

      mockDelete.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: mockDeleteEq,
        }),
      });

      mockStorageRemove.mockResolvedValue({
        error: { message: 'Storage error' },
      });

      // Should not throw despite storage error
      await deleteLabUpload('upload-1');

      expect(mockStorageRemove).toHaveBeenCalled();
    });

    it('throws error when user not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(deleteLabUpload('upload-1')).rejects.toThrow('User not authenticated');
    });

    it('throws error on database delete error', async () => {
      mockEq.mockImplementation(() => ({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue({
            data: mockLabUploadRow,
            error: null,
          }),
        }),
        order: mockOrder,
        single: mockSingle,
        maybeSingle: mockMaybeSingle,
        select: mockSelect,
      }));

      mockDelete.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ error: { message: 'Delete failed' } }),
        }),
      });

      mockStorageRemove.mockResolvedValue({ error: null });

      await expect(deleteLabUpload('upload-1')).rejects.toThrow('Failed to delete lab upload: Delete failed');
    });
  });

  describe('getLabUploadPdfUrl', () => {
    it('generates signed URL for PDF', async () => {
      mockMaybeSingle.mockReturnValue({
        data: { id: 'upload-1' },
        error: null,
      });

      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://storage.example.com/signed-url' },
        error: null,
      });

      const result = await getLabUploadPdfUrl('user-123/upload-1.pdf');

      expect(mockFrom).toHaveBeenCalledWith('lab_uploads');
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockEq).toHaveBeenCalledWith('storage_path', 'user-123/upload-1.pdf');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockStorageFrom).toHaveBeenCalledWith('lab-pdfs');
      expect(mockCreateSignedUrl).toHaveBeenCalledWith('user-123/upload-1.pdf', 3600);
      expect(result).toBe('https://storage.example.com/signed-url');
    });

    it('throws error when upload not found', async () => {
      mockMaybeSingle.mockReturnValue({
        data: null,
        error: null,
      });

      await expect(getLabUploadPdfUrl('nonexistent/path.pdf'))
        .rejects.toThrow('Upload not found or access denied');
    });

    it('throws error when user not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getLabUploadPdfUrl('path.pdf')).rejects.toThrow('User not authenticated');
    });

    it('throws error on verification database error', async () => {
      mockMaybeSingle.mockReturnValue({
        data: null,
        error: { message: 'Verify error' },
      });

      await expect(getLabUploadPdfUrl('path.pdf'))
        .rejects.toThrow('Failed to verify upload ownership: Verify error');
    });

    it('throws error on signed URL generation error', async () => {
      mockMaybeSingle.mockReturnValue({
        data: { id: 'upload-1' },
        error: null,
      });

      mockCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'URL generation failed' },
      });

      await expect(getLabUploadPdfUrl('path.pdf'))
        .rejects.toThrow('Failed to generate PDF URL: URL generation failed');
    });
  });

  describe('row transformation', () => {
    it('handles null optional fields', async () => {
      mockOrder.mockReturnValue({
        data: [mockLabUploadRow],
        error: null,
      });

      const result = await getLabUploads();

      expect(result[0].processingStage).toBeUndefined();
      expect(result[0].extractedData).toBeUndefined();
      expect(result[0].extractionConfidence).toBeUndefined();
      expect(result[0].verificationPassed).toBeUndefined();
      expect(result[0].corrections).toBeUndefined();
      expect(result[0].errorMessage).toBeUndefined();
      expect(result[0].startedAt).toBeUndefined();
      expect(result[0].completedAt).toBeUndefined();
      expect(result[0].eventId).toBeUndefined();
      expect(result[0].currentPage).toBeUndefined();
      expect(result[0].totalPages).toBeUndefined();
    });

    it('preserves all fields when present', async () => {
      const fullRow: LabUploadRow = {
        ...mockLabUploadRow,
        processing_stage: 'extracting',
        extracted_data: { test: 'data' },
        extraction_confidence: 0.85,
        verification_passed: false,
        corrections: { field: 'value' },
        error_message: 'Some warning',
        started_at: '2024-01-01T00:01:00Z',
        completed_at: '2024-01-01T00:02:00Z',
        event_id: 'event-1',
        current_page: 2,
        total_pages: 5,
      };

      mockOrder.mockReturnValue({
        data: [fullRow],
        error: null,
      });

      const result = await getLabUploads();

      expect(result[0].processingStage).toBe('extracting');
      expect(result[0].extractedData).toEqual({ test: 'data' });
      expect(result[0].extractionConfidence).toBe(0.85);
      expect(result[0].verificationPassed).toBe(false);
      expect(result[0].corrections).toEqual({ field: 'value' });
      expect(result[0].errorMessage).toBe('Some warning');
      expect(result[0].startedAt).toBe('2024-01-01T00:01:00Z');
      expect(result[0].completedAt).toBe('2024-01-01T00:02:00Z');
      expect(result[0].eventId).toBe('event-1');
      expect(result[0].currentPage).toBe(2);
      expect(result[0].totalPages).toBe(5);
    });
  });
});
