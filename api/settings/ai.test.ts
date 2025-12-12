import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock dependencies
vi.mock('../lib/supabase.js', () => ({
  createSupabaseClient: vi.fn(),
  getUserId: vi.fn(),
}));

vi.mock('../lib/logger/withLogger.js', () => ({
  withLogger: (handler: any) => handler,
}));

import { createSupabaseClient, getUserId } from '../lib/supabase.js';
import handler from './ai';

describe('AI Settings API', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      upsert: vi.fn(),
    };

    vi.mocked(createSupabaseClient).mockReturnValue(mockSupabase);
    vi.mocked(getUserId).mockResolvedValue('user-123');

    mockReq = {
      method: 'GET',
      headers: {
        authorization: 'Bearer test-token',
        origin: 'http://localhost:5173',
      },
      body: {},
      log: {
        child: vi.fn().mockReturnValue({
          info: vi.fn(),
          error: vi.fn(),
        }),
      },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };
  });

  describe('CORS handling', () => {
    it('sets CORS headers', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      await handler(mockReq as any, mockRes as any);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'http://localhost:5173'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        'GET,PUT,OPTIONS'
      );
    });

    it('handles OPTIONS preflight request', async () => {
      mockReq.method = 'OPTIONS';

      await handler(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.end).toHaveBeenCalled();
    });
  });

  describe('authorization', () => {
    it('returns 401 when no authorization header', async () => {
      mockReq.headers = { origin: 'http://localhost:5173' };

      await handler(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authorization required' });
    });

    it('returns 401 when getUserId throws Unauthorized', async () => {
      vi.mocked(getUserId).mockRejectedValue(new Error('Unauthorized'));

      await handler(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });

  describe('GET /settings/ai', () => {
    it('returns existing settings', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          ai_provider: 'openai',
          ai_model: 'gpt-4o',
          openai_reasoning_effort: 'high',
          gemini_thinking_level: 'low',
        },
        error: null,
      });

      await handler(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        provider: 'openai',
        model: 'gpt-4o',
        openaiReasoningEffort: 'high',
        geminiThinkingLevel: 'low',
      });
    });

    it('returns defaults when no settings exist', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // Row not found
      });

      await handler(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        provider: null,
        model: null,
        openaiReasoningEffort: 'medium',
        geminiThinkingLevel: 'high',
      });
    });

    it('returns 500 on database error', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'DB error' },
      });

      await handler(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('PUT /settings/ai', () => {
    beforeEach(() => {
      mockReq.method = 'PUT';
      mockSupabase.upsert.mockResolvedValue({ error: null });
    });

    it('updates provider and model', async () => {
      mockReq.body = {
        provider: 'google',
        model: 'gemini-3-pro-preview',
      };

      await handler(mockReq as any, mockRes as any);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_settings');
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          ai_provider: 'google',
          ai_model: 'gemini-3-pro-preview',
        }),
        { onConflict: 'user_id' }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('returns 400 for invalid model', async () => {
      mockReq.body = {
        provider: 'google',
        model: 'invalid-model',
      };

      await handler(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid model for provider' });
    });

    it('updates reasoning effort', async () => {
      mockReq.body = {
        openaiReasoningEffort: 'high',
      };

      await handler(mockReq as any, mockRes as any);

      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          openai_reasoning_effort: 'high',
        }),
        expect.any(Object)
      );
    });

    it('updates thinking level', async () => {
      mockReq.body = {
        geminiThinkingLevel: 'low',
      };

      await handler(mockReq as any, mockRes as any);

      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          gemini_thinking_level: 'low',
        }),
        expect.any(Object)
      );
    });

    it('returns 400 for invalid provider', async () => {
      mockReq.body = {
        provider: 'invalid-provider',
      };

      await handler(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid provider' });
    });

    it('returns 400 for invalid reasoning effort', async () => {
      mockReq.body = {
        openaiReasoningEffort: 'invalid',
      };

      await handler(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid OpenAI reasoning effort' });
    });

    it('returns 400 for invalid thinking level', async () => {
      mockReq.body = {
        geminiThinkingLevel: 'invalid',
      };

      await handler(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid Gemini thinking level' });
    });

    it('accepts valid reasoning effort values', async () => {
      const validEfforts = ['none', 'low', 'medium', 'high'];

      for (const effort of validEfforts) {
        vi.clearAllMocks();
        mockSupabase.upsert.mockResolvedValue({ error: null });
        mockReq.body = { openaiReasoningEffort: effort };

        await handler(mockReq as any, mockRes as any);

        expect(mockRes.status).toHaveBeenCalledWith(200);
      }
    });

    it('accepts valid thinking level values', async () => {
      const validLevels = ['low', 'high'];

      for (const level of validLevels) {
        vi.clearAllMocks();
        mockSupabase.upsert.mockResolvedValue({ error: null });
        mockReq.body = { geminiThinkingLevel: level };

        await handler(mockReq as any, mockRes as any);

        expect(mockRes.status).toHaveBeenCalledWith(200);
      }
    });

    it('returns 500 on upsert error', async () => {
      mockReq.body = { provider: 'openai' };
      mockSupabase.upsert.mockResolvedValue({ error: new Error('DB error') });

      await handler(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('unsupported methods', () => {
    it('returns 405 for POST', async () => {
      mockReq.method = 'POST';

      await handler(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('returns 405 for DELETE', async () => {
      mockReq.method = 'DELETE';

      await handler(mockReq as any, mockRes as any);

      expect(mockRes.status).toHaveBeenCalledWith(405);
    });
  });
});
