import { useState, useEffect, useCallback } from 'react';
import { getAISettings, updateAISettings as updateSettingsApi } from '@/api/settings';
import type {
  AISettings,
  AIProvider,
  AIModel,
  OpenAIReasoningEffort,
  GeminiThinkingLevel,
} from '@/types/ai';

interface UseAISettingsReturn {
  settings: AISettings | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (updates: {
    provider?: AIProvider | null;
    model?: AIModel | null;
    openaiReasoningEffort?: OpenAIReasoningEffort;
    geminiThinkingLevel?: GeminiThinkingLevel;
    agenticMode?: boolean;
    viceTrackingEnabled?: boolean;
    includeViceInAI?: boolean;
  }) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAISettings(): UseAISettingsReturn {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAISettings();
      setSettings(data);
    } catch (err) {
      // Default settings on error so the form still renders
      setSettings({
        provider: null,
        model: null,
        openaiReasoningEffort: 'medium',
        geminiThinkingLevel: 'high',
        agenticMode: true,
        viceTrackingEnabled: false,
        includeViceInAI: true,
      });
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSettings = useCallback(
    async (updates: {
      provider?: AIProvider | null;
      model?: AIModel | null;
      openaiReasoningEffort?: OpenAIReasoningEffort;
      geminiThinkingLevel?: GeminiThinkingLevel;
      agenticMode?: boolean;
      viceTrackingEnabled?: boolean;
      includeViceInAI?: boolean;
    }) => {
      setError(null);

      try {
        const updated = await updateSettingsApi(updates);
        setSettings((prev) => ({
          provider: updated.provider ?? prev?.provider ?? null,
          model: updated.model ?? prev?.model ?? null,
          openaiReasoningEffort: updated.openaiReasoningEffort ?? prev?.openaiReasoningEffort ?? 'medium',
          geminiThinkingLevel: updated.geminiThinkingLevel ?? prev?.geminiThinkingLevel ?? 'high',
          agenticMode: updated.agenticMode ?? prev?.agenticMode ?? true,
          viceTrackingEnabled: updated.viceTrackingEnabled ?? prev?.viceTrackingEnabled ?? false,
          includeViceInAI: updated.includeViceInAI ?? prev?.includeViceInAI ?? true,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update settings';
        setError(message);
        throw err;
      }
    },
    []
  );

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    refetch: fetchSettings,
  };
}
