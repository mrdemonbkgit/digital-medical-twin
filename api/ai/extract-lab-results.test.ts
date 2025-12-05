/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Set environment variables BEFORE any module imports
process.env.GOOGLE_API_KEY = 'test-google-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ALLOWED_ORIGIN = 'https://test.example.com';

// Mock modules before importing handler
const mockSupabaseDownload = vi.fn();
const mockGetUserId = vi.fn();
const mockCreateSupabaseClient = vi.fn();

vi.mock('../lib/supabase.js', () => ({
  createSupabaseClient: (authHeader: string) => mockCreateSupabaseClient(authHeader),
  getUserId: (supabase: unknown, authHeader: string) => mockGetUserId(supabase, authHeader),
}));

vi.mock('../lib/logger/withLogger.js', () => ({
  withLogger: (handler: Function) => handler,
}));

// Mock fetch for AI API calls
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock undici Agent
vi.mock('undici', () => ({
  Agent: vi.fn().mockImplementation(() => ({})),
}));

// Import after mocks are set up
import extractLabResultsModule from './extract-lab-results.js';

// Type the handler correctly
const handler = extractLabResultsModule as (req: VercelRequest, res: VercelResponse) => Promise<VercelResponse | void>;

// Create mock logger
const mockLogger = {
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: () => mockLogger,
};

function createMockRequest(overrides: Partial<VercelRequest & { log: typeof mockLogger }> = {}): VercelRequest {
  return {
    method: 'POST',
    headers: {
      authorization: 'Bearer test-token',
      origin: 'http://localhost:5173',
    },
    body: {
      storagePath: 'user-123/test-file.pdf',
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
    write: vi.fn(),
    end: vi.fn(),
  };
  return res as unknown as VercelResponse & { _data: unknown; _status: number; _headers: Record<string, string> };
}

// Mock PDF base64
const mockPdfBase64 = Buffer.from('fake pdf content').toString('base64');

// Mock Gemini extraction response
const mockGeminiResponse = {
  candidates: [{
    content: {
      parts: [{
        text: JSON.stringify({
          clientName: 'John Doe',
          clientGender: 'male',
          clientBirthday: '1990-01-15',
          labName: 'Test Lab',
          testDate: '2024-01-20',
          biomarkers: [
            {
              name: 'Glucose',
              value: 95,
              unit: 'mg/dL',
              referenceMin: 70,
              referenceMax: 100,
              flag: 'normal',
            },
          ],
        }),
      }],
    },
  }],
};

// Mock GPT verification response
const mockGPTResponse = {
  output: [{
    type: 'message',
    content: [{
      type: 'output_text',
      text: JSON.stringify({
        clientName: 'John Doe',
        clientGender: 'male',
        clientBirthday: '1990-01-15',
        labName: 'Test Lab',
        testDate: '2024-01-20',
        biomarkers: [
          {
            name: 'Glucose',
            value: 95,
            unit: 'mg/dL',
            referenceMin: 70,
            referenceMax: 100,
            flag: 'normal',
          },
        ],
        corrections: [],
      }),
    }],
  }],
};

describe('extract-lab-results API', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockGetUserId.mockResolvedValue('user-123');
    mockCreateSupabaseClient.mockReturnValue({
      storage: {
        from: () => ({
          download: mockSupabaseDownload,
        }),
      },
    });
    mockSupabaseDownload.mockResolvedValue({
      data: new Blob([mockPdfBase64]),
      error: null,
    });
  });

  describe('HTTP method handling', () => {
    it('returns 200 for OPTIONS preflight', async () => {
      const req = createMockRequest({ method: 'OPTIONS' });
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(200);
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
    it('returns 400 when storagePath is missing', async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(400);
      expect(res._data).toEqual({ error: 'storagePath is required' });
    });

    it('returns 400 when storagePath is empty', async () => {
      const req = createMockRequest({ body: { storagePath: '' } });
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(400);
    });

    it('returns 403 for unauthorized file access', async () => {
      mockGetUserId.mockResolvedValue('user-456'); // Different user
      const req = createMockRequest({
        body: { storagePath: 'user-123/test-file.pdf' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(403);
      expect(res._data).toEqual({ error: 'Unauthorized access to file' });
    });

    it('validates storagePath matches authenticated user ID', async () => {
      mockGetUserId.mockResolvedValue('user-123');
      const req = createMockRequest({
        body: { storagePath: 'different-user/test-file.pdf' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(403);
    });
  });

  describe('PDF fetching', () => {
    it('returns 500 when PDF download fails', async () => {
      mockSupabaseDownload.mockResolvedValue({
        data: null,
        error: { message: 'File not found' },
      });

      const req = createMockRequest();
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(500);
      expect((res._data as { error?: string }).error).toContain('Failed to download PDF');
    });

    it('handles storage download error', async () => {
      mockSupabaseDownload.mockResolvedValue({
        data: null,
        error: { message: 'Storage bucket not found' },
      });

      const req = createMockRequest();
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(500);
      expect((res._data as { error?: string }).error).toContain('Failed to download PDF');
    });
  });

  describe('SSE mode', () => {
    it('returns SSE headers when Accept includes text/event-stream', async () => {
      mockSupabaseDownload.mockResolvedValue({
        data: null,
        error: { message: 'Test error' },
      });

      const req = createMockRequest({
        headers: {
          authorization: 'Bearer test-token',
          origin: 'http://localhost:5173',
          accept: 'text/event-stream',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res._headers['Content-Type']).toBe('text/event-stream');
      expect(res._headers['Cache-Control']).toBe('no-cache');
      expect(res._headers['Connection']).toBe('keep-alive');
    });

    it('sends error event in SSE mode on failure', async () => {
      mockSupabaseDownload.mockResolvedValue({
        data: null,
        error: { message: 'File not found' },
      });

      const req = createMockRequest({
        headers: {
          authorization: 'Bearer test-token',
          origin: 'http://localhost:5173',
          accept: 'text/event-stream',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      // Check that error event was sent
      const calls = (res.write as ReturnType<typeof vi.fn>).mock.calls;
      const errorCall = calls.find((call) => (call[0] as string).includes('"type":"error"'));
      expect(errorCall).toBeDefined();
      expect(res.end).toHaveBeenCalled();
    });

    it('sends SSE error for missing storagePath in SSE mode', async () => {
      const req = createMockRequest({
        body: {},
        headers: {
          authorization: 'Bearer test-token',
          origin: 'http://localhost:5173',
          accept: 'text/event-stream',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      const calls = (res.write as ReturnType<typeof vi.fn>).mock.calls;
      const errorCall = calls.find((call) => {
        const data = call[0] as string;
        return data.includes('"type":"error"') && data.includes('storagePath is required');
      });
      expect(errorCall).toBeDefined();
    });

    it('sends SSE error for unauthorized access in SSE mode', async () => {
      mockGetUserId.mockResolvedValue('user-456'); // Different user

      const req = createMockRequest({
        body: { storagePath: 'user-123/test-file.pdf' },
        headers: {
          authorization: 'Bearer test-token',
          origin: 'http://localhost:5173',
          accept: 'text/event-stream',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      const calls = (res.write as ReturnType<typeof vi.fn>).mock.calls;
      const errorCall = calls.find((call) => {
        const data = call[0] as string;
        return data.includes('"type":"error"') && data.includes('Unauthorized');
      });
      expect(errorCall).toBeDefined();
    });
  });

  describe('logging', () => {
    it('logs request method and SSE mode', async () => {
      const req = createMockRequest({ method: 'OPTIONS' });
      const res = createMockResponse();

      await handler(req, res);

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('logs security warnings for unauthorized access', async () => {
      mockGetUserId.mockResolvedValue('user-456');
      const req = createMockRequest({
        body: { storagePath: 'user-123/test-file.pdf' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'SECURITY: Unauthorized access attempt',
        undefined,
        expect.objectContaining({
          userId: 'user-456',
          requestedPath: 'user-123/test-file.pdf',
        })
      );
    });
  });
});
