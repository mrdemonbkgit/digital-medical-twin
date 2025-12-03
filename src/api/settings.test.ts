import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAISettings, updateAISettings } from './settings';

// Mock Supabase
const mockMaybeSingle = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockUpsert = vi.fn();
const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: (table: string) => mockFrom(table),
  },
}));

const mockUserId = 'user-123';

const mockSettingsRow = {
  ai_provider: 'openai',
  ai_model: 'gpt-4o',
  openai_reasoning_effort: 'high',
  gemini_thinking_level: null,
  agentic_mode: true,
};

describe('settings API', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default auth setup
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    // Setup chainable mocks
    mockFrom.mockReturnValue({
      select: mockSelect,
      upsert: mockUpsert,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      maybeSingle: mockMaybeSingle,
    });

    mockMaybeSingle.mockReturnValue({
      data: mockSettingsRow,
      error: null,
    });

    mockUpsert.mockReturnValue({
      error: null,
    });
  });

  describe('getAISettings', () => {
    it('fetches AI settings for authenticated user', async () => {
      const result = await getAISettings();

      expect(mockFrom).toHaveBeenCalledWith('user_settings');
      expect(mockSelect).toHaveBeenCalledWith(
        'ai_provider, ai_model, openai_reasoning_effort, gemini_thinking_level, agentic_mode, vice_tracking_enabled, include_vice_in_ai'
      );
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(result.provider).toBe('openai');
      expect(result.model).toBe('gpt-4o');
    });

    it('transforms snake_case to camelCase', async () => {
      const result = await getAISettings();

      expect(result).toEqual({
        provider: 'openai',
        model: 'gpt-4o',
        openaiReasoningEffort: 'high',
        geminiThinkingLevel: 'high', // Default when null
        agenticMode: true,
        viceTrackingEnabled: false, // Default when not in mock data
        includeViceInAI: true, // Default when not in mock data
      });
    });

    it('returns default values when user has no settings', async () => {
      mockMaybeSingle.mockReturnValue({ data: null, error: null });

      const result = await getAISettings();

      expect(result).toEqual({
        provider: null,
        model: null,
        openaiReasoningEffort: 'medium',
        geminiThinkingLevel: 'high',
        agenticMode: true,
        viceTrackingEnabled: false,
        includeViceInAI: true,
      });
    });

    it('throws error when user not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(getAISettings()).rejects.toThrow('Not authenticated');
    });

    it('throws error when query fails', async () => {
      mockMaybeSingle.mockReturnValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(getAISettings()).rejects.toThrow('Database error');
    });
  });

  describe('updateAISettings', () => {
    it('updates provider setting', async () => {
      const result = await updateAISettings({ provider: 'google' });

      expect(mockFrom).toHaveBeenCalledWith('user_settings');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          ai_provider: 'google',
        }),
        { onConflict: 'user_id' }
      );
      expect(result.provider).toBe('google');
    });

    it('updates model setting', async () => {
      const result = await updateAISettings({ model: 'gemini-2.5-flash' });

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          ai_model: 'gemini-2.5-flash',
        }),
        expect.any(Object)
      );
      expect(result.model).toBe('gemini-2.5-flash');
    });

    it('updates reasoning effort setting', async () => {
      const result = await updateAISettings({ openaiReasoningEffort: 'low' });

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          openai_reasoning_effort: 'low',
        }),
        expect.any(Object)
      );
      expect(result.openaiReasoningEffort).toBe('low');
    });

    it('updates thinking level setting', async () => {
      const result = await updateAISettings({ geminiThinkingLevel: 'low' });

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          gemini_thinking_level: 'low',
        }),
        expect.any(Object)
      );
      expect(result.geminiThinkingLevel).toBe('low');
    });

    it('updates agentic mode setting', async () => {
      const result = await updateAISettings({ agenticMode: false });

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          agentic_mode: false,
        }),
        expect.any(Object)
      );
      expect(result.agenticMode).toBe(false);
    });

    it('updates multiple settings at once', async () => {
      const result = await updateAISettings({
        provider: 'openai',
        model: 'o3-mini',
        openaiReasoningEffort: 'high',
      });

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          ai_provider: 'openai',
          ai_model: 'o3-mini',
          openai_reasoning_effort: 'high',
        }),
        expect.any(Object)
      );
      expect(result.provider).toBe('openai');
      expect(result.model).toBe('o3-mini');
      expect(result.openaiReasoningEffort).toBe('high');
    });

    it('can set provider to null', async () => {
      const result = await updateAISettings({ provider: null });

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          ai_provider: null,
        }),
        expect.any(Object)
      );
      expect(result.provider).toBeNull();
    });

    it('includes updated_at timestamp', async () => {
      await updateAISettings({ provider: 'google' });

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          updated_at: expect.any(String),
        }),
        expect.any(Object)
      );
    });

    it('uses upsert with onConflict user_id', async () => {
      await updateAISettings({ provider: 'google' });

      expect(mockUpsert).toHaveBeenCalledWith(expect.any(Object), {
        onConflict: 'user_id',
      });
    });

    it('throws error when user not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(updateAISettings({ provider: 'google' })).rejects.toThrow('Not authenticated');
    });

    it('throws error when upsert fails', async () => {
      mockUpsert.mockReturnValue({ error: { message: 'Upsert failed' } });

      await expect(updateAISettings({ provider: 'google' })).rejects.toThrow('Upsert failed');
    });

    it('returns only updated fields', async () => {
      const result = await updateAISettings({ provider: 'google' });

      // Only provider should be defined, others should be undefined
      expect(result.provider).toBe('google');
      expect(result.model).toBeUndefined();
      // These are always included when provided
    });
  });
});
