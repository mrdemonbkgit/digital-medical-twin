import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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
  }) => Promise<void>;
  refetch: () => Promise<void>;
}

async function getAuthToken(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting session:', error.message);
    throw new Error('Not authenticated');
  }

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  return session.access_token;
}

export function useAISettings(): UseAISettingsReturn {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();

      const response = await fetch('/api/settings/ai', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Check if we got HTML instead of JSON (happens in dev mode without Vercel)
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        // API not available - return default settings
        setSettings({
          provider: null,
          model: null,
          openaiReasoningEffort: 'medium',
          geminiThinkingLevel: 'high',
        });
        setError('API not available. Run "vercel dev" for full functionality.');
        return;
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to access AI settings');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load AI settings');
      }

      const data = await response.json();
      setSettings({
        provider: data.provider,
        model: data.model,
        openaiReasoningEffort: data.openaiReasoningEffort || 'medium',
        geminiThinkingLevel: data.geminiThinkingLevel || 'high',
      });
    } catch (err) {
      // Default settings on error so the form still renders
      setSettings({
        provider: null,
        model: null,
        openaiReasoningEffort: 'medium',
        geminiThinkingLevel: 'high',
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
    }) => {
      setError(null);

      try {
        const token = await getAuthToken();

        const response = await fetch('/api/settings/ai', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        // Check if we got HTML instead of JSON (API not available)
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          throw new Error('API not available. Run "vercel dev" for full functionality.');
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update settings');
        }

        const data = await response.json();
        setSettings((prev) => ({
          provider: data.provider ?? prev?.provider ?? null,
          model: data.model ?? prev?.model ?? null,
          openaiReasoningEffort: data.openaiReasoningEffort ?? prev?.openaiReasoningEffort ?? 'medium',
          geminiThinkingLevel: data.geminiThinkingLevel ?? prev?.geminiThinkingLevel ?? 'high',
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
