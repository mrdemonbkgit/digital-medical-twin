/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Set environment variables BEFORE any module imports
process.env.GOOGLE_API_KEY = 'test-google-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ALLOWED_ORIGIN = 'https://test.example.com';

// Mock modules before importing handler
const mockGetUserId = vi.fn();
const mockCreateSupabaseClient = vi.fn();
const mockSupabaseFrom = vi.fn();
const mockSupabaseStorage = vi.fn();

vi.mock('../lib/supabase.js', () => ({
  createSupabaseClient: () => mockCreateSupabaseClient(),
  getUserId: (supabase: unknown, authHeader: string) => mockGetUserId(supabase, authHeader),
}));

vi.mock('../lib/logger/withLogger.js', () => ({
  withLogger: (handler: Function) => handler,
}));

// Mock pdfSplitter
vi.mock('../lib/pdfSplitter.js', () => ({
  getPageCount: vi.fn().mockResolvedValue(2),
  splitPdfIntoPages: vi.fn().mockResolvedValue([]),
}));

// Mock biomarkerMerger
vi.mock('../lib/biomarkerMerger.js', () => ({
  mergeBiomarkers: vi.fn().mockReturnValue({ biomarkers: [], duplicatesRemoved: 0 }),
  mergeCorrections: vi.fn().mockReturnValue([]),
  calculateOverallVerificationStatus: vi.fn().mockReturnValue('clean'),
}));

// Mock fetch for AI API calls
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock undici Agent
vi.mock('undici', () => ({
  Agent: vi.fn().mockImplementation(() => ({})),
}));

// Import after mocks are set up
import processLabUploadModule from './process-lab-upload.js';

// Type the handler correctly
const handler = processLabUploadModule as (req: VercelRequest, res: VercelResponse) => Promise<VercelResponse | void>;

// Create mock logger
const mockLogger = {
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: () => mockLogger,
};

// Mock upload record
const mockUpload = {
  id: 'upload-123',
  user_id: 'user-123',
  filename: 'test-lab.pdf',
  storage_path: 'user-123/test-lab.pdf',
  status: 'pending',
  skip_verification: false,
  file_size: 1024,
};

function createMockRequest(overrides: Partial<VercelRequest & { log: typeof mockLogger }> = {}): VercelRequest {
  return {
    method: 'POST',
    headers: {
      authorization: 'Bearer test-token',
      origin: 'http://localhost:5173',
    },
    body: {
      uploadId: 'upload-123',
    },
    log: mockLogger,
    ...overrides,
  } as unknown as VercelRequest;
}

function createMockResponse(): VercelResponse & { _data: unknown; _status: number; _headers: Record<string, string> } {
  const res = {
    _data: null as unknown,
    _status: 200,
    _headers: {} as Record<string, string>,
    status(code: number) {
      this._status = code;
      return this;
    },
    json(data: unknown) {
      this._data = data;
      return this;
    },
    setHeader(key: string, value: string) {
      this._headers[key] = value;
      return this;
    },
    end: vi.fn(),
  };
  return res as unknown as VercelResponse & { _data: unknown; _status: number; _headers: Record<string, string> };
}

describe('process-lab-upload API', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockGetUserId.mockResolvedValue('user-123');
    mockCreateSupabaseClient.mockReturnValue({
      from: mockSupabaseFrom,
      storage: {
        from: () => ({
          download: mockSupabaseStorage,
        }),
      },
    });

    // Default: upload exists and is owned by user
    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: mockUpload, error: null }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    });

    // Default: PDF download succeeds
    mockSupabaseStorage.mockResolvedValue({
      data: new Blob(['fake pdf content']),
      error: null,
    });
  });

  describe('HTTP method handling', () => {
    it('returns 200 for OPTIONS preflight', async () => {
      const req = createMockRequest({ method: 'OPTIONS' });
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(200);
      expect(res.end).toHaveBeenCalled();
    });

    it('returns 405 for GET requests', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(405);
      expect(res._data).toEqual({ error: 'Method not allowed' });
    });

    it('returns 405 for PUT requests', async () => {
      const req = createMockRequest({ method: 'PUT' });
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(405);
    });

    it('returns 405 for DELETE requests', async () => {
      const req = createMockRequest({ method: 'DELETE' });
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(405);
    });
  });

  describe('CORS headers', () => {
    it('sets CORS headers from allowed origin', async () => {
      const req = createMockRequest({
        method: 'OPTIONS',
        headers: { origin: 'http://localhost:5173' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res._headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173');
      expect(res._headers['Access-Control-Allow-Credentials']).toBe('true');
      expect(res._headers['Access-Control-Allow-Methods']).toBe('POST,OPTIONS');
    });

    it('falls back to default origin if not in allowed list', async () => {
      const req = createMockRequest({
        method: 'OPTIONS',
        headers: { origin: 'https://evil.com' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res._headers['Access-Control-Allow-Origin']).toBe('https://test.example.com');
    });

    it('accepts localhost:3000 as valid origin', async () => {
      const req = createMockRequest({
        method: 'OPTIONS',
        headers: { origin: 'http://localhost:3000' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res._headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
    });
  });

  describe('authorization', () => {
    it('returns 401 without authorization header', async () => {
      const req = createMockRequest({
        headers: { origin: 'http://localhost:5173' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(401);
      expect(res._data).toEqual({ error: 'Authorization required' });
    });
  });

  describe('request validation', () => {
    it('returns 400 when uploadId is missing', async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(400);
      expect(res._data).toEqual({ error: 'uploadId is required' });
    });

    it('returns 400 when uploadId is empty', async () => {
      const req = createMockRequest({ body: { uploadId: '' } });
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(400);
    });
  });

  describe('upload lookup', () => {
    it('returns 404 when upload not found', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      });

      const req = createMockRequest();
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(404);
      expect(res._data).toEqual({ error: 'Upload not found' });
    });

    it('returns 403 when user does not own the upload', async () => {
      mockGetUserId.mockResolvedValue('different-user');

      const req = createMockRequest();
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(403);
      expect(res._data).toEqual({ error: 'Unauthorized access to upload' });
    });

    it('returns 409 when upload is already processing', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: { ...mockUpload, status: 'processing' },
              error: null,
            }),
          }),
        }),
      });

      const req = createMockRequest();
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(409);
      expect(res._data).toEqual({ error: 'Upload is already being processed' });
    });
  });

  describe('PDF fetching', () => {
    it('handles PDF download failure gracefully', async () => {
      // Set up mocks so we get past auth and ownership checks
      const mockUpdate = vi.fn().mockReturnValue({
        eq: () => Promise.resolve({ error: null }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockUpload, error: null }),
          }),
        }),
        update: mockUpdate,
      });

      // PDF download fails
      mockSupabaseStorage.mockResolvedValue({
        data: null,
        error: { message: 'File not found' },
      });

      const req = createMockRequest();
      const res = createMockResponse();

      await handler(req, res);

      // Should fail with 500 due to PDF download error
      expect(res._status).toBe(500);
      expect((res._data as { error?: string }).error).toContain('Failed to download PDF');
    });
  });

  describe('logging', () => {
    it('logs request method on receipt', async () => {
      const req = createMockRequest({ method: 'OPTIONS' });
      const res = createMockResponse();

      await handler(req, res);

      expect(mockLogger.info).toHaveBeenCalledWith('Request received', { method: 'OPTIONS' });
    });
  });

  describe('status updates', () => {
    it('updates upload status to processing when starting', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: () => Promise.resolve({ error: null }),
      });

      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockUpload, error: null }),
          }),
        }),
        update: mockUpdate,
      });

      // Let PDF download succeed but then fail on something else to verify the update was called
      mockSupabaseStorage.mockResolvedValue({
        data: null,
        error: { message: 'Download error' },
      });

      const req = createMockRequest();
      const res = createMockResponse();

      await handler(req, res);

      // Verify update was called with 'processing' status
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'processing',
          processing_stage: 'fetching_pdf',
        })
      );
    });
  });
});
