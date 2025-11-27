import type {
  AIProviderAdapter,
  ProviderMessage,
  CompletionOptions,
  CompletionResponse,
} from './types';
import { AIProviderError } from './types';

/**
 * Gemini API types
 */
interface GeminiContent {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

interface GeminiError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * Google Gemini provider adapter
 * Handles communication with Google's Generative AI API
 */
export class GeminiProvider implements AIProviderAdapter {
  name = 'google' as const;
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async complete(
    messages: ProviderMessage[],
    options: CompletionOptions
  ): Promise<CompletionResponse> {
    // Extract system prompt and convert messages to Gemini format
    const { systemInstruction, contents } = this.convertMessages(messages);

    const response = await fetch(
      `${this.baseUrl}/models/${options.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: systemInstruction
            ? { parts: [{ text: systemInstruction }] }
            : undefined,
          contents,
          generationConfig: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxTokens ?? 2000,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = (await response.json()) as GeminiError;
      const isRateLimit = response.status === 429;
      const isServerError = response.status >= 500;

      throw new AIProviderError(
        'google',
        error.error?.message || `Request failed with status ${response.status}`,
        response.status,
        isRateLimit || isServerError
      );
    }

    const data = (await response.json()) as GeminiResponse;

    if (!data.candidates || data.candidates.length === 0) {
      throw new AIProviderError('google', 'No response generated', undefined, false);
    }

    const candidate = data.candidates[0];
    const content = candidate.content.parts.map((p) => p.text).join('');

    return {
      content,
      tokensUsed: {
        prompt: data.usageMetadata?.promptTokenCount || 0,
        completion: data.usageMetadata?.candidatesTokenCount || 0,
        total: data.usageMetadata?.totalTokenCount || 0,
      },
      model: options.model,
      finishReason: this.mapFinishReason(candidate.finishReason),
    };
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models?key=${apiKey}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Convert OpenAI-style messages to Gemini format
   * Gemini uses a different message structure with systemInstruction separate
   */
  private convertMessages(messages: ProviderMessage[]): {
    systemInstruction: string | null;
    contents: GeminiContent[];
  } {
    let systemInstruction: string | null = null;
    const contents: GeminiContent[] = [];

    for (const message of messages) {
      if (message.role === 'system') {
        // Concatenate system messages
        if (systemInstruction) {
          systemInstruction += '\n\n' + message.content;
        } else {
          systemInstruction = message.content;
        }
      } else {
        contents.push({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }],
        });
      }
    }

    return { systemInstruction, contents };
  }

  private mapFinishReason(reason: string): 'stop' | 'length' | 'error' {
    switch (reason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      default:
        return 'error';
    }
  }
}
