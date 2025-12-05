import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withLogger, LoggedRequest } from './withLogger';

// Mock the logger module
vi.mock('./index.js', () => {
  const mockChildLogger = {
    setSessionId: vi.fn(),
    setOperationId: vi.fn(),
    info: vi.fn(),
  };

  return {
    logger: {
      child: vi.fn(() => mockChildLogger),
    },
    Logger: vi.fn(),
    mockChildLogger, // Export for test access
  };
});

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'mock123'),
}));

import { logger } from './index.js';

describe('withLogger', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      headers: {},
    };

    mockRes = {
      setHeader: vi.fn(),
    };

    mockHandler = vi.fn().mockResolvedValue({ success: true });
  });

  describe('session ID handling', () => {
    it('uses session ID from header when provided', async () => {
      mockReq.headers = { 'x-session-id': 'existing-session' };

      const wrapped = withLogger(mockHandler);
      await wrapped(mockReq as VercelRequest, mockRes as VercelResponse);

      const childLogger = (logger.child as ReturnType<typeof vi.fn>).mock.results[0].value;
      expect(childLogger.setSessionId).toHaveBeenCalledWith('existing-session');
    });

    it('generates session ID when not provided', async () => {
      mockReq.headers = {};

      const wrapped = withLogger(mockHandler);
      await wrapped(mockReq as VercelRequest, mockRes as VercelResponse);

      const childLogger = (logger.child as ReturnType<typeof vi.fn>).mock.results[0].value;
      expect(childLogger.setSessionId).toHaveBeenCalledWith('sess-mock123');
    });
  });

  describe('operation ID handling', () => {
    it('sets operation ID when provided', async () => {
      mockReq.headers = {
        'x-session-id': 'session',
        'x-operation-id': 'op-123',
      };

      const wrapped = withLogger(mockHandler);
      await wrapped(mockReq as VercelRequest, mockRes as VercelResponse);

      const childLogger = (logger.child as ReturnType<typeof vi.fn>).mock.results[0].value;
      expect(childLogger.setOperationId).toHaveBeenCalledWith('op-123');
    });

    it('does not set operation ID when not provided', async () => {
      mockReq.headers = { 'x-session-id': 'session' };

      const wrapped = withLogger(mockHandler);
      await wrapped(mockReq as VercelRequest, mockRes as VercelResponse);

      const childLogger = (logger.child as ReturnType<typeof vi.fn>).mock.results[0].value;
      expect(childLogger.setOperationId).not.toHaveBeenCalled();
    });
  });

  describe('request augmentation', () => {
    it('attaches logger to request', async () => {
      const wrapped = withLogger(mockHandler);
      await wrapped(mockReq as VercelRequest, mockRes as VercelResponse);

      const handlerCall = mockHandler.mock.calls[0][0] as LoggedRequest;
      expect(handlerCall.log).toBeDefined();
    });

    it('attaches session ID to request', async () => {
      mockReq.headers = { 'x-session-id': 'test-session' };

      const wrapped = withLogger(mockHandler);
      await wrapped(mockReq as VercelRequest, mockRes as VercelResponse);

      const handlerCall = mockHandler.mock.calls[0][0] as LoggedRequest;
      expect(handlerCall.sessionId).toBe('test-session');
    });

    it('attaches operation ID to request when provided', async () => {
      mockReq.headers = {
        'x-session-id': 'session',
        'x-operation-id': 'op-456',
      };

      const wrapped = withLogger(mockHandler);
      await wrapped(mockReq as VercelRequest, mockRes as VercelResponse);

      const handlerCall = mockHandler.mock.calls[0][0] as LoggedRequest;
      expect(handlerCall.operationId).toBe('op-456');
    });
  });

  describe('response headers', () => {
    it('sets session ID header in response', async () => {
      mockReq.headers = { 'x-session-id': 'response-session' };

      const wrapped = withLogger(mockHandler);
      await wrapped(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Session-ID', 'response-session');
    });

    it('sets operation ID header when provided', async () => {
      mockReq.headers = {
        'x-session-id': 'session',
        'x-operation-id': 'op-789',
      };

      const wrapped = withLogger(mockHandler);
      await wrapped(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Operation-ID', 'op-789');
    });

    it('does not set operation ID header when not provided', async () => {
      mockReq.headers = { 'x-session-id': 'session' };

      const wrapped = withLogger(mockHandler);
      await wrapped(mockReq as VercelRequest, mockRes as VercelResponse);

      const calls = (mockRes.setHeader as ReturnType<typeof vi.fn>).mock.calls;
      const opIdCalls = calls.filter((c) => c[0] === 'X-Operation-ID');
      expect(opIdCalls.length).toBe(0);
    });
  });

  describe('handler execution', () => {
    it('calls the wrapped handler', async () => {
      const wrapped = withLogger(mockHandler);
      await wrapped(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockHandler).toHaveBeenCalled();
    });

    it('returns handler result', async () => {
      mockHandler.mockResolvedValue({ data: 'test' });

      const wrapped = withLogger(mockHandler);
      const result = await wrapped(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(result).toEqual({ data: 'test' });
    });

    it('creates child logger with API context', async () => {
      const wrapped = withLogger(mockHandler);
      await wrapped(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(logger.child).toHaveBeenCalledWith('API');
    });
  });
});
