import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { AISettings, AIProvider, AIModel } from '@/types/ai';

interface UseAISettingsReturn {
  settings: AISettings | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (updates: {
    provider?: AIProvider | null;
    model?: AIModel | null;
    temperature?: number;
    apiKey?: string | null;
  }) => Promise<void>;
  clearApiKey: (provider: AIProvider) => Promise<void>;
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
    console.error('No session or access token found. Session:', session ? 'exists but no token' : 'null');
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
          temperature: 0.7,
          hasOpenAIKey: false,
          hasGoogleKey: false,
          hasApiKey: false,
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
        temperature: data.temperature,
        hasOpenAIKey: data.hasOpenAIKey ?? false,
        hasGoogleKey: data.hasGoogleKey ?? false,
        hasApiKey: data.hasApiKey ?? false,
      });
    } catch (err) {
      // Default settings on error so the form still renders
      setSettings({
        provider: null,
        model: null,
        temperature: 0.7,
        hasOpenAIKey: false,
        hasGoogleKey: false,
        hasApiKey: false,
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
      temperature?: number;
      apiKey?: string | null;
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
        setSettings({
          provider: data.provider ?? settings?.provider ?? null,
          model: data.model ?? settings?.model ?? null,
          temperature: data.temperature ?? settings?.temperature ?? 0.7,
          hasOpenAIKey: data.hasOpenAIKey ?? settings?.hasOpenAIKey ?? false,
          hasGoogleKey: data.hasGoogleKey ?? settings?.hasGoogleKey ?? false,
          hasApiKey: data.hasApiKey ?? settings?.hasApiKey ?? false,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update settings';
        setError(message);
        throw err;
      }
    },
    [settings]
  );

  const clearApiKey = useCallback(async (provider: AIProvider) => {
    setError(null);

    try {
      const token = await getAuthToken();

      const response = await fetch(`/api/settings/ai?provider=${provider}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Check if we got HTML instead of JSON (API not available)
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('API not available. Run "vercel dev" for full functionality.');
      }

      if (!response.ok) {
        throw new Error('Failed to clear API key');
      }

      const data = await response.json();
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              hasOpenAIKey: data.hasOpenAIKey ?? false,
              hasGoogleKey: data.hasGoogleKey ?? false,
              hasApiKey: data.hasApiKey ?? false,
            }
          : null
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear API key';
      setError(message);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    clearApiKey,
    refetch: fetchSettings,
  };
}
