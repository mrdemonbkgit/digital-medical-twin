import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIProvider } from './openai';
import { AIProviderError } from './types';
import type { ProviderMessage, CompletionOptions } from './types';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  const testApiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new OpenAIProvider(testApiKey);
  });

  describe('constructor', () => {
    it('creates provider with api key', () => {
      expect(provider.name).toBe('openai');
    });
  });

  describe('complete', () => {
    const messages: ProviderMessage[] = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello!' },
    ];

    const options: CompletionOptions = {
      model: 'gpt-4o-mini',
      temperature: 0.5,
      maxTokens: 1000,
    };

    it('sends request with correct format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'chatcmpl-123',
            object: 'chat.completion',
            created: 1677652288,
            model: 'gpt-4o-mini',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: 'Hello! How can I help you?',
                },
                finish_reason: 'stop',
              },
            ],
            usage: {
              prompt_tokens: 10,
              completion_tokens: 8,
              total_tokens: 18,
            },
          }),
      });

      await provider.complete(messages, options);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer test-api-key',
            'Content-Type': 'application/json',
          },
        })
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.model).toBe('gpt-4o-mini');
      expect(callBody.messages).toEqual([
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello!' },
      ]);
      expect(callBody.temperature).toBe(0.5);
      expect(callBody.max_tokens).toBe(1000);
    });

    it('returns completion response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'chatcmpl-123',
            model: 'gpt-4o-mini',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: 'Hello! How can I help you?',
                },
                finish_reason: 'stop',
              },
            ],
            usage: {
              prompt_tokens: 10,
              completion_tokens: 8,
              total_tokens: 18,
            },
          }),
      });

      const response = await provider.complete(messages, options);

      expect(response.content).toBe('Hello! How can I help you?');
      expect(response.tokensUsed).toEqual({
        prompt: 10,
        completion: 8,
        total: 18,
      });
      expect(response.model).toBe('gpt-4o-mini');
      expect(response.finishReason).toBe('stop');
    });

    it('uses default temperature and maxTokens', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'chatcmpl-123',
            model: 'gpt-4o-mini',
            choices: [
              {
                index: 0,
                message: { role: 'assistant', content: 'Response' },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
          }),
      });

      await provider.complete(messages, { model: 'gpt-4o-mini' });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.temperature).toBe(0.7);
      expect(callBody.max_tokens).toBe(2000);
    });

    it('throws AIProviderError on HTTP error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: {
              message: 'Invalid request',
              type: 'invalid_request_error',
              code: 'invalid_api_key',
            },
          }),
      });

      await expect(provider.complete(messages, options)).rejects.toThrow(AIProviderError);
      await expect(provider.complete(messages, options)).rejects.toMatchObject({
        provider: 'openai',
        message: 'Invalid request',
        statusCode: 400,
        retryable: false,
      });
    });

    it('sets retryable true for rate limit errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () =>
          Promise.resolve({
            error: { message: 'Rate limit exceeded' },
          }),
      });

      await expect(provider.complete(messages, options)).rejects.toMatchObject({
        retryable: true,
      });
    });

    it('sets retryable true for server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            error: { message: 'Internal server error' },
          }),
      });

      await expect(provider.complete(messages, options)).rejects.toMatchObject({
        retryable: true,
      });
    });

    it('throws error when no choices returned', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'chatcmpl-123',
            model: 'gpt-4o-mini',
            choices: [],
            usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 },
          }),
      });

      await expect(provider.complete(messages, options)).rejects.toThrow('No response generated');
    });

    it('maps length finish reason correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'chatcmpl-123',
            model: 'gpt-4o-mini',
            choices: [
              {
                index: 0,
                message: { role: 'assistant', content: 'Truncated response...' },
                finish_reason: 'length',
              },
            ],
            usage: { prompt_tokens: 10, completion_tokens: 100, total_tokens: 110 },
          }),
      });

      const response = await provider.complete(messages, options);
      expect(response.finishReason).toBe('length');
    });

    it('maps unknown finish reason to error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'chatcmpl-123',
            model: 'gpt-4o-mini',
            choices: [
              {
                index: 0,
                message: { role: 'assistant', content: 'Response' },
                finish_reason: 'content_filter',
              },
            ],
            usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
          }),
      });

      const response = await provider.complete(messages, options);
      expect(response.finishReason).toBe('error');
    });

    it('handles error without message field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: {} }),
      });

      await expect(provider.complete(messages, options)).rejects.toMatchObject({
        message: 'Request failed with status 401',
      });
    });
  });

  describe('validateApiKey', () => {
    it('returns true for valid API key', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const result = await provider.validateApiKey('valid-key');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer valid-key' },
        })
      );
    });

    it('returns false for invalid API key', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });

      const result = await provider.validateApiKey('invalid-key');

      expect(result).toBe(false);
    });

    it('returns false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await provider.validateApiKey('any-key');

      expect(result).toBe(false);
    });
  });

  describe('message handling', () => {
    it('preserves all message roles', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'chatcmpl-123',
            model: 'gpt-4o-mini',
            choices: [
              {
                index: 0,
                message: { role: 'assistant', content: 'Response' },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 20, completion_tokens: 5, total_tokens: 25 },
          }),
      });

      const messages: ProviderMessage[] = [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'User message 1' },
        { role: 'assistant', content: 'Assistant response' },
        { role: 'user', content: 'User message 2' },
      ];

      await provider.complete(messages, { model: 'gpt-4o-mini' });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.messages).toHaveLength(4);
      expect(callBody.messages[0].role).toBe('system');
      expect(callBody.messages[1].role).toBe('user');
      expect(callBody.messages[2].role).toBe('assistant');
      expect(callBody.messages[3].role).toBe('user');
    });
  });
});
