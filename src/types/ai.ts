import type { EventType } from './events';

// AI Provider types
export type AIProvider = 'openai' | 'google';
export type AIModel = 'gpt-5.1' | 'gemini-3-pro-preview' | 'gemini-2.5-flash' | 'gemini-2.5-pro';

// Model configurations
export const AI_MODELS: Record<AIProvider, AIModel[]> = {
  openai: ['gpt-5.1'],
  google: ['gemini-3-pro-preview', 'gemini-2.5-flash', 'gemini-2.5-pro'],
};

export const MODEL_DISPLAY_NAMES: Record<AIModel, string> = {
  'gpt-5.1': 'GPT-5.1',
  'gemini-3-pro-preview': 'Gemini 3 Pro (Preview)',
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
};

// AI Settings (stored in user_settings table)
export interface AISettings {
  provider: AIProvider | null;
  model: AIModel | null;
  temperature: number;
  hasOpenAIKey: boolean;
  hasGoogleKey: boolean;
  hasApiKey: boolean; // Deprecated, kept for backward compatibility
}

// Reasoning trace types (ChatGPT-style activity timeline)
export interface ReasoningStep {
  title: string;
  content?: string;
}

export interface ReasoningTrace {
  id: string;
  steps: ReasoningStep[];
  summary?: string;
}

// Tool call types
export interface ToolCall {
  id: string;
  type: string;
  name: string;
  arguments?: Record<string, unknown>;
  result?: string;
  status: 'pending' | 'completed' | 'failed';
}

// Web search result types
export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  displayUrl?: string;
}

// Inline citation for grounded responses (maps text segments to sources)
export interface InlineCitation {
  startIndex: number;
  endIndex: number;
  text: string;
  sourceIndices: number[];  // References to webSearchResults array
  confidence: number;
}

// Activity item for timeline display
export interface ActivityItem {
  id: string;
  type: 'thinking' | 'web_search' | 'tool_call';
  title: string;
  content?: string;
  sources?: WebSearchResult[];
  toolCall?: ToolCall;
  status?: 'pending' | 'completed' | 'failed';
}

// Chat message types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: EventSource[];
  // Extended metadata for activity timeline
  reasoning?: ReasoningTrace;
  toolCalls?: ToolCall[];
  webSearchResults?: WebSearchResult[];
  citations?: InlineCitation[];  // Inline citation mappings for grounded responses
  elapsedTime?: string; // "3m 0s" format
}

export interface EventSource {
  eventId: string;
  type: EventType;
  date: string;
  title: string;
}

// API request/response types
export interface ChatRequest {
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ChatResponse {
  response: string;
  sources: EventSource[];
  tokensUsed: number;
  // Extended metadata for activity timeline
  reasoning?: ReasoningTrace;
  toolCalls?: ToolCall[];
  webSearchResults?: WebSearchResult[];
  elapsedTime?: string;
}

// Settings update types
export interface AISettingsUpdate {
  provider?: AIProvider;
  model?: AIModel;
  temperature?: number;
  apiKey?: string; // Only sent when updating, never returned
}

// Query intent types for RAG
export type QueryIntent =
  | 'trend'
  | 'comparison'
  | 'correlation'
  | 'summary'
  | 'specific'
  | 'general';

export interface QueryAnalysis {
  intent: QueryIntent;
  keywords: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  eventTypes?: EventType[];
  entities: string[];
  confidence: number;
}

// AI Provider interface for adapters
export interface AIProviderAdapter {
  name: AIProvider;
  complete(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: AICompletionOptions
  ): Promise<AICompletionResponse>;
  validateApiKey(apiKey: string): Promise<boolean>;
}

export interface AICompletionOptions {
  model: AIModel;
  temperature?: number;
  maxTokens?: number;
}

export interface AICompletionResponse {
  content: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  finishReason: 'stop' | 'length' | 'error';
}

// Error types
export interface AIError {
  code: 'NO_CONFIG' | 'INVALID_KEY' | 'RATE_LIMIT' | 'NETWORK' | 'PROVIDER' | 'UNKNOWN';
  message: string;
  retryable: boolean;
}
