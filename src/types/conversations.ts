import type {
  AIProvider,
  AIModel,
  OpenAIReasoningEffort,
  GeminiThinkingLevel,
  MessageMetadata,
} from './ai';

export type { MessageMetadata };

// Database row types (snake_case from Supabase)
export interface ConversationRow {
  id: string;
  user_id: string;
  title: string;
  provider: string | null;
  model: string | null;
  reasoning_effort: string | null;
  thinking_level: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: MessageMetadata | null;
  created_at: string;
}

// MessageMetadata is imported from './ai' and re-exported

// Frontend types (camelCase)
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  provider: AIProvider | null;
  model: AIModel | null;
  reasoningEffort: OpenAIReasoningEffort | null;
  thinkingLevel: GeminiThinkingLevel | null;
  createdAt: string;
  updatedAt: string;
}

// Settings subset for conversation
export interface ConversationSettings {
  provider: AIProvider | null;
  model: AIModel | null;
  reasoningEffort: OpenAIReasoningEffort | null;
  thinkingLevel: GeminiThinkingLevel | null;
}

// API input types
export interface CreateConversationInput {
  title?: string;
  provider?: AIProvider | null;
  model?: AIModel | null;
  reasoningEffort?: OpenAIReasoningEffort | null;
  thinkingLevel?: GeminiThinkingLevel | null;
}

export interface UpdateConversationInput {
  title: string;
}
