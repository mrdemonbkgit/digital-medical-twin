import { useState, useEffect } from 'react';
import { Eye, EyeOff, Key, Trash2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Input } from '@/components/common/Input';
import { useAISettings } from '@/hooks';
import type { AIProvider, AIModel } from '@/types/ai';

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI (GPT-5.1)' },
  { value: 'google', label: 'Google (Gemini)' },
];

const MODEL_OPTIONS: Record<AIProvider, Array<{ value: string; label: string }>> = {
  openai: [
    { value: 'gpt-5.1', label: 'GPT-5.1 (Recommended)' },
  ],
  google: [
    { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro (Preview)' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  ],
};

const TEMPERATURE_PRESETS = [
  { value: '0.3', label: 'Focused (0.3)' },
  { value: '0.5', label: 'Balanced (0.5)' },
  { value: '0.7', label: 'Creative (0.7)' },
  { value: '0.9', label: 'Exploratory (0.9)' },
];

export function AISettingsForm() {
  const { settings, isLoading, error, updateSettings, clearApiKey } = useAISettings();

  const [provider, setProvider] = useState<AIProvider | ''>('');
  const [model, setModel] = useState<AIModel | ''>('');
  const [temperature, setTemperature] = useState('0.7');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state with loaded settings
  useEffect(() => {
    if (settings) {
      setProvider(settings.provider || '');
      setModel(settings.model || '');
      setTemperature(String(settings.temperature || 0.7));
    }
  }, [settings]);

  // Reset model when provider changes
  useEffect(() => {
    if (provider && MODEL_OPTIONS[provider]) {
      const currentModelValid = MODEL_OPTIONS[provider].some((m) => m.value === model);
      if (!currentModelValid) {
        setModel(MODEL_OPTIONS[provider][0].value as AIModel);
      }
    }
  }, [provider, model]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateSettings({
        provider: provider as AIProvider || null,
        model: model as AIModel || null,
        temperature: parseFloat(temperature),
        apiKey: apiKey || undefined,
      });
      setApiKey(''); // Clear the input after successful save
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearApiKey = async (providerToClear: AIProvider) => {
    const providerName = providerToClear === 'openai' ? 'OpenAI' : 'Google';
    if (!window.confirm(`Are you sure you want to remove your ${providerName} API key?`)) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await clearApiKey(providerToClear);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to clear API key');
    } finally {
      setIsSaving(false);
    }
  };

  // Determine if current provider has a key configured
  const currentProviderHasKey =
    provider === 'openai' ? settings?.hasOpenAIKey : provider === 'google' ? settings?.hasGoogleKey : false;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Configuration</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure your AI provider to enable the AI Historian feature. Your API key is encrypted
          and stored securely.
        </p>
      </div>

      {(error || saveError) && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error || saveError}
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
          Settings saved successfully!
        </div>
      )}

      <div>
        <Select
          label="AI Provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value as AIProvider)}
          options={PROVIDER_OPTIONS}
          placeholder="Select a provider"
        />
        {/* Provider status badges */}
        <div className="flex gap-2 mt-2">
          {settings?.hasOpenAIKey && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              OpenAI key saved
            </span>
          )}
          {settings?.hasGoogleKey && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Google key saved
            </span>
          )}
        </div>
      </div>

      {provider && (
        <Select
          label="Model"
          value={model}
          onChange={(e) => setModel(e.target.value as AIModel)}
          options={MODEL_OPTIONS[provider] || []}
        />
      )}

      <div>
        <Select
          label="Temperature"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          options={TEMPERATURE_PRESETS}
          disabled={provider === 'openai'}
        />
        {provider === 'openai' && (
          <p className="text-xs text-gray-500 mt-1">
            Temperature is not supported with OpenAI Responses API
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">API Key</label>
        {currentProviderHasKey ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-300">
              <Key className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {provider === 'openai' ? 'OpenAI' : 'Google'} API key configured
              </span>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => provider && handleClearApiKey(provider as AIProvider)}
              disabled={isSaving || !provider}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="relative">
            <Input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter your ${provider === 'google' ? 'Google AI' : 'OpenAI'} API key`}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {provider === 'google'
            ? 'Get your API key from Google AI Studio'
            : 'Get your API key from OpenAI Platform'}
        </p>
      </div>

      <div className="pt-4 border-t">
        <Button
          onClick={handleSave}
          isLoading={isSaving}
          disabled={!provider || (!apiKey && !currentProviderHasKey)}
        >
          Save Settings
        </Button>
      </div>
    </div>
  );
}
