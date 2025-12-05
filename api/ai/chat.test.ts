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

vi.mock('../lib/supabase.js', () => ({
  createSupabaseClient: (authHeader: string) => mockCreateSupabaseClient(authHeader),
  getUserId: (supabase: unknown, authHeader: string) => mockGetUserId(supabase, authHeader),
}));

vi.mock('../lib/logger/withLogger.js', () => ({
  withLogger: (handler: Function) => handler,
}));

vi.mock('../lib/logger/index.js', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// Mock tool executor
vi.mock('./tools/executor.js', () => ({
  executeToolCall: vi.fn().mockResolvedValue({ result: 'test result' }),
}));

// Mock tool definitions
vi.mock('./tools/definitions.js', () => ({
  toOpenAITools: vi.fn().mockReturnValue([]),
  toGeminiTools: vi.fn().mockReturnValue([]),
}));

// Mock fetch for AI API calls
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import after mocks are set up
import chatModule from './chat.js';

// Type the handler correctly
const handler = chatModule as (req: VercelRequest, res: VercelResponse) => Promise<VercelResponse | void>;

// Create mock logger
const mockLogger = {
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: () => mockLogger,
};

// Mock user settings
const mockUserSettings = {
  ai_provider: 'openai',
  ai_model: 'gpt-4o',
  openai_reasoning_effort: 'medium',
  gemini_thinking_level: 'high',
  agentic_mode: true,
};

// Mock user profile
const mockUserProfile = {
  display_name: 'John Doe',
  gender: 'male',
  date_of_birth: '1990-01-15',
};

function createMockRequest(overrides: Partial<VercelRequest & { log: typeof mockLogger }> = {}): VercelRequest {
  return {
    method: 'POST',
    headers: {
      authorization: 'Bearer test-token',
      origin: 'http://localhost:5173',
    },
    body: {
      message: 'What are my recent lab results?',
      history: [],
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

// Mock OpenAI response
const mockOpenAIResponse = {
  choices: [{
    message: {
      content: 'Here are your recent lab results summary.',
      role: 'assistant',
    },
  }],
  usage: {
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150,
  },
};

describe('chat API', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockGetUserId.mockResolvedValue('user-123');
    mockCreateSupabaseClient.mockReturnValue({
      from: mockSupabaseFrom,
    });

    // Default: settings exist
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'user_settings') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockUserSettings, error: null }),
            }),
          }),
        };
      }
      if (table === 'user_profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockUserProfile, error: null }),
            }),
          }),
        };
      }
      if (table === 'ai_conversations') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      };
    });

    // Default: OpenAI API succeeds
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOpenAIResponse),
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
    it('returns 400 when message is missing', async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(400);
      expect(res._data).toEqual({ error: 'Message is required' });
    });

    it('returns 400 when message is empty string', async () => {
      const req = createMockRequest({ body: { message: '' } });
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(400);
    });

    it('returns 400 when message is not a string', async () => {
      const req = createMockRequest({ body: { message: 123 } });
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(400);
      expect(res._data).toEqual({ error: 'Message is required' });
    });
  });

  describe('settings handling', () => {
    it('returns 400 when AI provider not configured', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'user_settings') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { ...mockUserSettings, ai_provider: null },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'ai_conversations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: null, error: null }),
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        };
      });

      const req = createMockRequest();
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(400);
      expect((res._data as { error?: string }).error).toContain('AI not configured');
    });

    it('returns 500 when server API key not configured', async () => {
      // Temporarily remove the API key
      const originalKey = process.env.OPENAI_API_KEY;
      process.env.OPENAI_API_KEY = '';

      const req = createMockRequest();
      const res = createMockResponse();

      await handler(req, res);

      expect(res._status).toBe(500);
      expect((res._data as { error?: string }).error).toContain('Server API key not configured');

      // Restore
      process.env.OPENAI_API_KEY = originalKey;
    });
  });

  describe('SSE streaming mode', () => {
    it('sets SSE headers when Accept includes text/event-stream', async () => {
      // Make the request fail early so we can check headers
      mockGetUserId.mockRejectedValue(new Error('Auth error'));

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
      mockGetUserId.mockRejectedValue(new Error('Auth failed'));

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
  });

  describe('provider-specific behavior', () => {
    it('validates OpenAI provider is accepted', async () => {
      // Default mock has openai provider configured
      const req = createMockRequest();
      const res = createMockResponse();

      await handler(req, res);

      // Should not return 400 "AI not configured" error - provider is valid
      expect(res._status).not.toBe(400);
    });
  });

  describe('conversation settings', () => {
    it('fetches conversation settings when conversationId provided', async () => {
      const conversationSelectSpy = vi.fn().mockReturnValue({
        eq: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                provider: 'openai',
                model: 'gpt-4o-mini',
                reasoning_effort: 'low',
                thinking_level: null,
                agentic_mode: false,
              },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'user_settings') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: mockUserSettings,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'user_profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUserProfile, error: null }),
              }),
            }),
          };
        }
        if (table === 'ai_conversations') {
          return {
            select: conversationSelectSpy,
          };
        }
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        };
      });

      const req = createMockRequest({
        body: {
          message: 'Test message',
          history: [],
          conversationId: 'conv-123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      // Should have queried ai_conversations table
      expect(conversationSelectSpy).toHaveBeenCalled();
    });
  });
});
