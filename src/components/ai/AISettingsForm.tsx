import { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { useAISettings } from '@/hooks';
import type { AIProvider, AIModel, OpenAIReasoningEffort, GeminiThinkingLevel } from '@/types/ai';
import {
  OPENAI_REASONING_EFFORT_OPTIONS,
  GEMINI_THINKING_LEVEL_OPTIONS,
} from '@/types/ai';

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI (GPT-5.2)' },
  { value: 'google', label: 'Google (Gemini 3 Pro)' },
];

const MODEL_OPTIONS: Record<AIProvider, Array<{ value: string; label: string }>> = {
  openai: [{ value: 'gpt-5.2', label: 'GPT-5.2' }],
  google: [{ value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro' }],
};

export function AISettingsForm() {
  const { settings, isLoading, error, updateSettings } = useAISettings();

  const [provider, setProvider] = useState<AIProvider | ''>('');
  const [model, setModel] = useState<AIModel | ''>('');
  const [openaiReasoningEffort, setOpenaiReasoningEffort] = useState<OpenAIReasoningEffort>('medium');
  const [geminiThinkingLevel, setGeminiThinkingLevel] = useState<GeminiThinkingLevel>('high');
  const [agenticMode, setAgenticMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state with loaded settings
  useEffect(() => {
    if (settings) {
      setProvider(settings.provider || '');
      setModel(settings.model || '');
      setOpenaiReasoningEffort(settings.openaiReasoningEffort || 'medium');
      setGeminiThinkingLevel(settings.geminiThinkingLevel || 'high');
      setAgenticMode(settings.agenticMode ?? true);
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
        provider: (provider as AIProvider) || null,
        model: (model as AIModel) || null,
        openaiReasoningEffort,
        geminiThinkingLevel,
        agenticMode,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

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
          Select your preferred AI provider and configure reasoning depth for the AI Historian
          feature.
        </p>
      </div>

      {(error || saveError) && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error || saveError}</div>
      )}

      {saveSuccess && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
          Settings saved successfully!
        </div>
      )}

      <Select
        label="AI Provider"
        value={provider}
        onChange={(e) => setProvider(e.target.value as AIProvider)}
        options={PROVIDER_OPTIONS}
        placeholder="Select a provider"
      />

      {provider && (
        <Select
          label="Model"
          value={model}
          onChange={(e) => setModel(e.target.value as AIModel)}
          options={MODEL_OPTIONS[provider] || []}
        />
      )}

      {provider === 'openai' && (
        <div>
          <Select
            label="Reasoning Effort"
            value={openaiReasoningEffort}
            onChange={(e) => setOpenaiReasoningEffort(e.target.value as OpenAIReasoningEffort)}
            options={OPENAI_REASONING_EFFORT_OPTIONS.map((opt) => ({
              value: opt.value,
              label: `${opt.label} - ${opt.description}`,
            }))}
          />
          <p className="text-xs text-gray-500 mt-1">
            Controls how much time GPT-5.2 spends thinking before responding. Higher values produce
            more thorough answers but take longer.
          </p>
        </div>
      )}

      {provider === 'google' && (
        <div>
          <Select
            label="Thinking Level"
            value={geminiThinkingLevel}
            onChange={(e) => setGeminiThinkingLevel(e.target.value as GeminiThinkingLevel)}
            options={GEMINI_THINKING_LEVEL_OPTIONS.map((opt) => ({
              value: opt.value,
              label: `${opt.label} - ${opt.description}`,
            }))}
          />
          <p className="text-xs text-gray-500 mt-1">
            Controls the depth of Gemini 3 Pro's thinking process. Higher values enable deeper
            analysis.
          </p>
        </div>
      )}

      {/* Agentic Mode Toggle */}
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700">Agentic Mode</label>
            <p className="text-xs text-gray-500 mt-1">
              {provider === 'google' ? (
                <span className="text-amber-600">
                  Not available for Gemini (API limitation)
                </span>
              ) : (
                'When enabled, AI uses tools to search your health data on-demand. When disabled, all data is provided upfront.'
              )}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={provider === 'google' ? false : agenticMode}
            disabled={provider === 'google'}
            onClick={() => setAgenticMode(!agenticMode)}
            className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              provider === 'google'
                ? 'bg-gray-200 cursor-not-allowed'
                : agenticMode
                  ? 'bg-blue-600'
                  : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                provider === 'google' ? 'translate-x-0' : agenticMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button onClick={handleSave} isLoading={isSaving} disabled={!provider}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
