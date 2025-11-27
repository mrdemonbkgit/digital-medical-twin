import type {
  AIProviderAdapter,
  ProviderMessage,
  CompletionOptions,
  CompletionResponse,
} from './types';
import { AIProviderError } from './types';

/**
 * OpenAI API response types
 */
interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIError {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

/**
 * OpenAI provider adapter
 * Handles communication with OpenAI's API
 */
export class OpenAIProvider implements AIProviderAdapter {
  name = 'openai' as const;
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async complete(
    messages: ProviderMessage[],
    options: CompletionOptions
  ): Promise<CompletionResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
      }),
    });

    if (!response.ok) {
      const error = (await response.json()) as OpenAIError;
      const isRateLimit = response.status === 429;
      const isServerError = response.status >= 500;

      throw new AIProviderError(
        'openai',
        error.error?.message || `Request failed with status ${response.status}`,
        response.status,
        isRateLimit || isServerError
      );
    }

    const data = (await response.json()) as OpenAIResponse;

    if (!data.choices || data.choices.length === 0) {
      throw new AIProviderError('openai', 'No response generated', undefined, false);
    }

    const choice = data.choices[0];

    return {
      content: choice.message.content,
      tokensUsed: {
        prompt: data.usage.prompt_tokens,
        completion: data.usage.completion_tokens,
        total: data.usage.total_tokens,
      },
      model: data.model,
      finishReason: this.mapFinishReason(choice.finish_reason),
    };
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private mapFinishReason(reason: string): 'stop' | 'length' | 'error' {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      default:
        return 'error';
    }
  }
}
