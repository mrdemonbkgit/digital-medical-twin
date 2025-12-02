import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAISettings } from './useAISettings';

// Mock supabase with full chain support
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockUpsert = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      mockFrom(table);
      return {
        select: (columns: string) => {
          mockSelect(columns);
          return {
            eq: (column: string, value: string) => {
              mockEq(column, value);
              return {
                maybeSingle: () => mockMaybeSingle(),
              };
            },
          };
        },
        upsert: (data: unknown, options: unknown) => {
          mockUpsert(data, options);
          // Return the promise from mockUpsert, not mockUpsert itself
          return mockUpsert();
        },
      };
    },
    auth: {
      getUser: () => mockGetUser(),
    },
  },
}));

describe('useAISettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: return settings from database
    mockMaybeSingle.mockResolvedValue({
      data: {
        ai_provider: 'openai',
        ai_model: 'gpt-5.1',
        openai_reasoning_effort: 'high',
        gemini_thinking_level: 'high',
      },
      error: null,
    });
    // Default: authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    // Default: upsert succeeds
    mockUpsert.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns loading state initially', () => {
    mockMaybeSingle.mockImplementation(() => new Promise(() => {})); // Never resolves
    const { result } = renderHook(() => useAISettings());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.settings).toBe(null);
  });

  it('fetches settings on mount', async () => {
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
    expect(mockFrom).toHaveBeenCalledWith('user_settings');
  });

  it('returns default values when no settings exist', async () => {
    // maybeSingle() returns null data (no error) when no row found
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: null,
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
    expect(result.current.error).toBe(null);
  });

  it('returns default values with provider-specific reasoning params', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        ai_provider: 'google',
        ai_model: 'gemini-3-pro-preview',
        // No reasoning params in DB - should use defaults
        openai_reasoning_effort: null,
        gemini_thinking_level: null,
      },
      error: null,
    });

    const { result } = renderHook(() => useAISettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings?.openaiReasoningEffort).toBe('medium');
    expect(result.current.settings?.geminiThinkingLevel).toBe('high');
  });

  it('handles database errors gracefully', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST500', message: 'Database error' },
    });

    const { result } = renderHook(() => useAISettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Database error');
    // Should still have default settings so form renders
    expect(result.current.settings).toEqual({
      provider: null,
      model: null,
      openaiReasoningEffort: 'medium',
      geminiThinkingLevel: 'high',
    });
  });

  it('updateSettings sends correct payload', async () => {
    // Initial fetch - no settings
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No rows found' },
    });

    const { result } = renderHook(() => useAISettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Update settings
    await act(async () => {
      await result.current.updateSettings({
        provider: 'openai',
        model: 'gpt-5.1',
        openaiReasoningEffort: 'high',
      });
    });

    // Check that upsert was called with correct payload
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        ai_provider: 'openai',
        ai_model: 'gpt-5.1',
        openai_reasoning_effort: 'high',
      }),
      { onConflict: 'user_id' }
    );

    // Check that state was updated
    expect(result.current.settings?.provider).toBe('openai');
    expect(result.current.settings?.openaiReasoningEffort).toBe('high');
  });

  it('updateSettings throws on not authenticated', async () => {
    // Initial fetch succeeds
    mockMaybeSingle.mockResolvedValue({
      data: { ai_provider: null, ai_model: null },
      error: null,
    });

    const { result } = renderHook(() => useAISettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // User not authenticated
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    // Update should throw
    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await result.current.updateSettings({ provider: 'openai' });
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError?.message).toBe('Not authenticated');
  });

  it('updateSettings throws on database error', async () => {
    // Initial fetch succeeds
    mockMaybeSingle.mockResolvedValue({
      data: { ai_provider: null, ai_model: null },
      error: null,
    });

    const { result } = renderHook(() => useAISettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Upsert fails
    mockUpsert.mockResolvedValue({
      error: { message: 'Database write error' },
    });

    // Update should throw
    let thrownError: Error | null = null;
    await act(async () => {
      try {
        await result.current.updateSettings({ provider: 'openai' });
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(thrownError?.message).toBe('Database write error');
  });

  it('refetch reloads settings', async () => {
    // Initial fetch
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        ai_provider: 'openai',
        ai_model: 'gpt-5.1',
      },
      error: null,
    });

    const { result } = renderHook(() => useAISettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings?.provider).toBe('openai');

    // Setup refetch response with different data
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        ai_provider: 'google',
        ai_model: 'gemini-3-pro-preview',
      },
      error: null,
    });

    // Refetch
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.settings?.provider).toBe('google');
    expect(mockMaybeSingle).toHaveBeenCalledTimes(2);
  });
});
