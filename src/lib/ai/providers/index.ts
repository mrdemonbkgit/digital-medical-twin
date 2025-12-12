import type { AIProvider } from '@/types/ai';
import type { AIProviderAdapter } from './types';
import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';

export * from './types';
export { OpenAIProvider } from './openai';
export { GeminiProvider } from './gemini';

/**
 * Create a provider adapter instance for the given provider
 */
export function createProvider(provider: AIProvider, apiKey: string): AIProviderAdapter {
  switch (provider) {
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'google':
      return new GeminiProvider(apiKey);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Get the default model for a provider
 */
export function getDefaultModel(provider: AIProvider): string {
  switch (provider) {
    case 'openai':
      return 'gpt-5.2';
    case 'google':
      return 'gemini-3-pro-preview';
    default:
      return 'gpt-5.2';
  }
}

/**
 * Validate that a model is compatible with a provider
 */
export function isValidModelForProvider(model: string, provider: AIProvider): boolean {
  const providerModels: Record<AIProvider, string[]> = {
    openai: ['gpt-5.2'],
    google: ['gemini-3-pro-preview'],
  };

  return providerModels[provider]?.includes(model) ?? false;
}
