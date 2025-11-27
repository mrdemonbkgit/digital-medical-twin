import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAISettings } from './useAISettings';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import the mocked supabase
import { supabase } from '@/lib/supabase';

describe('useAISettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated user
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
      error: null,
    } as ReturnType<typeof supabase.auth.getSession> extends Promise<infer T> ? T : never);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    const { result } = renderHook(() => useAISettings());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.settings).toBe(null);
  });

  it('fetches settings on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () =>
        Promise.resolve({
          provider: 'openai',
          model: 'gpt-5.1',
          openaiReasoningEffort: 'high',
          geminiThinkingLevel: 'high',
        }),
    });

    const { result } = renderHook(() => useAISettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings).toEqual({
      provider: 'openai',
      model: 'gpt-5.1',
      openaiReasoningEffort: 'high',
      geminiThinkingLevel: 'high',
    });
    expect(mockFetch).toHaveBeenCalledWith('/api/settings/ai', {
      headers: { Authorization: 'Bearer test-token' },
    });
  });

  it('returns default values when API unavailable', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'text/html' }, // Not JSON - API unavailable
    });

    const { result } = renderHook(() => useAISettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings).toEqual({
      provider: null,
      model: null,
      openaiReasoningEffort: 'medium',
      geminiThinkingLevel: 'high',
    });
    expect(result.current.error).toContain('API not available');
  });

  it('returns default values with provider-specific reasoning params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () =>
        Promise.resolve({
          provider: 'google',
          model: 'gemini-3-pro-preview',
          // No reasoning params in response - should use defaults
        }),
    });

    const { result } = renderHook(() => useAISettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings?.openaiReasoningEffort).toBe('medium');
    expect(result.current.settings?.geminiThinkingLevel).toBe('high');
  });

  it('handles authentication errors', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as ReturnType<typeof supabase.auth.getSession> extends Promise<infer T> ? T : never);

    const { result } = renderHook(() => useAISettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Not authenticated');
    // Should still have default settings so form renders
    expect(result.current.settings).toEqual({
      provider: null,
      model: null,
      openaiReasoningEffort: 'medium',
      geminiThinkingLevel: 'high',
    });
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ error: 'Internal server error' }),
    });

    const { result } = renderHook(() => useAISettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Internal server error');
  });

  it('updateSettings sends correct payload', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () =>
        Promise.resolve({
          provider: null,
          model: null,
          openaiReasoningEffort: 'medium',
          geminiThinkingLevel: 'high',
        }),
    });

    const { result } = renderHook(() => useAISettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Setup update response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () =>
        Promise.resolve({
          provider: 'openai',
          model: 'gpt-5.1',
          openaiReasoningEffort: 'high',
          geminiThinkingLevel: 'high',
        }),
    });

    // Update settings
    await act(async () => {
      await result.current.updateSettings({
        provider: 'openai',
        model: 'gpt-5.1',
        openaiReasoningEffort: 'high',
      });
    });

    // Check that fetch was called with correct payload
    expect(mockFetch).toHaveBeenLastCalledWith('/api/settings/ai', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'openai',
        model: 'gpt-5.1',
        openaiReasoningEffort: 'high',
      }),
    });

    // Check that state was updated
    expect(result.current.settings?.provider).toBe('openai');
    expect(result.current.settings?.openaiReasoningEffort).toBe('high');
  });

  it('updateSettings throws on API error', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ provider: null, model: null }),
    });

    const { result } = renderHook(() => useAISettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Setup error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ error: 'Invalid provider' }),
    });

    // Update should throw
    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await result.current.updateSettings({ provider: 'invalid' as 'openai' });
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError?.message).toBe('Invalid provider');
  });

  it('refetch reloads settings', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () =>
        Promise.resolve({
          provider: 'openai',
          model: 'gpt-5.1',
        }),
    });

    const { result } = renderHook(() => useAISettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Setup refetch response with different data
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () =>
        Promise.resolve({
          provider: 'google',
          model: 'gemini-3-pro-preview',
        }),
    });

    // Refetch
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.settings?.provider).toBe('google');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
