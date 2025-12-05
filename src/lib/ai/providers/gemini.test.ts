import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiProvider } from './gemini';
import { AIProviderError } from './types';
import type { ProviderMessage, CompletionOptions } from './types';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('GeminiProvider', () => {
  let provider: GeminiProvider;
  const testApiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GeminiProvider(testApiKey);
  });

  describe('constructor', () => {
    it('creates provider with api key', () => {
      expect(provider.name).toBe('google');
    });
  });

  describe('complete', () => {
    const messages: ProviderMessage[] = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello!' },
    ];

    const options: CompletionOptions = {
      model: 'gemini-1.5-flash',
      temperature: 0.5,
      maxTokens: 1000,
    };

    it('sends request with correct format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Hello! How can I help you?' }],
                  role: 'model',
                },
                finishReason: 'STOP',
              },
            ],
            usageMetadata: {
              promptTokenCount: 10,
              candidatesTokenCount: 8,
              totalTokenCount: 18,
            },
          }),
      });

      await provider.complete(messages, options);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('gemini-1.5-flash:generateContent'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.systemInstruction.parts[0].text).toBe('You are a helpful assistant.');
      expect(callBody.contents).toEqual([
        { role: 'user', parts: [{ text: 'Hello!' }] },
      ]);
      expect(callBody.generationConfig.temperature).toBe(0.5);
      expect(callBody.generationConfig.maxOutputTokens).toBe(1000);
    });

    it('returns completion response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Hello! How can I help you?' }],
                  role: 'model',
                },
                finishReason: 'STOP',
              },
            ],
            usageMetadata: {
              promptTokenCount: 10,
              candidatesTokenCount: 8,
              totalTokenCount: 18,
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
      expect(response.model).toBe('gemini-1.5-flash');
      expect(response.finishReason).toBe('stop');
    });

    it('concatenates multiple text parts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Part 1. ' }, { text: 'Part 2.' }],
                  role: 'model',
                },
                finishReason: 'STOP',
              },
            ],
          }),
      });

      const response = await provider.complete(messages, options);

      expect(response.content).toBe('Part 1. Part 2.');
    });

    it('handles missing usage metadata', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Response' }],
                  role: 'model',
                },
                finishReason: 'STOP',
              },
            ],
          }),
      });

      const response = await provider.complete(messages, options);

      expect(response.tokensUsed).toEqual({
        prompt: 0,
        completion: 0,
        total: 0,
      });
    });

    it('uses default temperature and maxTokens', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: { parts: [{ text: 'Response' }], role: 'model' },
                finishReason: 'STOP',
              },
            ],
          }),
      });

      await provider.complete(messages, { model: 'gemini-1.5-flash' });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.generationConfig.temperature).toBe(0.7);
      expect(callBody.generationConfig.maxOutputTokens).toBe(2000);
    });

    it('throws AIProviderError on HTTP error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: {
              code: 400,
              message: 'Invalid request',
              status: 'INVALID_ARGUMENT',
            },
          }),
      });

      await expect(provider.complete(messages, options)).rejects.toThrow(AIProviderError);
      await expect(provider.complete(messages, options)).rejects.toMatchObject({
        provider: 'google',
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
        status: 503,
        json: () =>
          Promise.resolve({
            error: { message: 'Service unavailable' },
          }),
      });

      await expect(provider.complete(messages, options)).rejects.toMatchObject({
        retryable: true,
      });
    });

    it('throws error when no candidates returned', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ candidates: [] }),
      });

      await expect(provider.complete(messages, options)).rejects.toThrow('No response generated');
    });

    it('maps MAX_TOKENS finish reason to length', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: { parts: [{ text: 'Response' }], role: 'model' },
                finishReason: 'MAX_TOKENS',
              },
            ],
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
            candidates: [
              {
                content: { parts: [{ text: 'Response' }], role: 'model' },
                finishReason: 'SAFETY',
              },
            ],
          }),
      });

      const response = await provider.complete(messages, options);
      expect(response.finishReason).toBe('error');
    });
  });

  describe('convertMessages', () => {
    it('extracts system instruction from messages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: { parts: [{ text: 'Response' }], role: 'model' },
                finishReason: 'STOP',
              },
            ],
          }),
      });

      const messages: ProviderMessage[] = [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'User message' },
      ];

      await provider.complete(messages, { model: 'gemini-1.5-flash' });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.systemInstruction.parts[0].text).toBe('System prompt');
      expect(callBody.contents).toHaveLength(1);
      expect(callBody.contents[0].role).toBe('user');
    });

    it('concatenates multiple system messages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: { parts: [{ text: 'Response' }], role: 'model' },
                finishReason: 'STOP',
              },
            ],
          }),
      });

      const messages: ProviderMessage[] = [
        { role: 'system', content: 'First system' },
        { role: 'system', content: 'Second system' },
        { role: 'user', content: 'User message' },
      ];

      await provider.complete(messages, { model: 'gemini-1.5-flash' });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.systemInstruction.parts[0].text).toBe('First system\n\nSecond system');
    });

    it('converts assistant role to model', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: { parts: [{ text: 'Response' }], role: 'model' },
                finishReason: 'STOP',
              },
            ],
          }),
      });

      const messages: ProviderMessage[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ];

      await provider.complete(messages, { model: 'gemini-1.5-flash' });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.contents[0].role).toBe('user');
      expect(callBody.contents[1].role).toBe('model');
      expect(callBody.contents[2].role).toBe('user');
    });

    it('handles messages without system instruction', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: { parts: [{ text: 'Response' }], role: 'model' },
                finishReason: 'STOP',
              },
            ],
          }),
      });

      const messages: ProviderMessage[] = [{ role: 'user', content: 'Hello' }];

      await provider.complete(messages, { model: 'gemini-1.5-flash' });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.systemInstruction).toBeUndefined();
    });
  });

  describe('validateApiKey', () => {
    it('returns true for valid API key', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const result = await provider.validateApiKey('valid-key');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('models?key=valid-key')
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
});
