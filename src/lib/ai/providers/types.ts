import type { AIProvider, AIModel } from '@/types/ai';

/**
 * Chat message format for AI providers
 */
export interface ProviderMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Options for AI completion requests
 */
export interface CompletionOptions {
  model: AIModel;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Response from AI completion
 */
export interface CompletionResponse {
  content: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  finishReason: 'stop' | 'length' | 'error';
}

/**
 * AI Provider adapter interface
 * Implementations handle the specifics of each provider's API
 */
export interface AIProviderAdapter {
  /**
   * Provider identifier
   */
  name: AIProvider;

  /**
   * Send a completion request to the AI provider
   */
  complete(
    messages: ProviderMessage[],
    options: CompletionOptions
  ): Promise<CompletionResponse>;

  /**
   * Validate an API key with the provider
   * Returns true if the key is valid
   */
  validateApiKey(apiKey: string): Promise<boolean>;
}

/**
 * Error thrown by AI providers
 */
export class AIProviderError extends Error {
  constructor(
    public provider: AIProvider,
    message: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}
