import type {
  EventSource,
  ReasoningTrace,
  ToolCall,
  WebSearchResult,
  InlineCitation,
} from './ai';

// Database row types (snake_case from Supabase)
export interface ConversationRow {
  id: string;
  user_id: string;
  title: string;
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

// Metadata stored in JSONB column
export interface MessageMetadata {
  sources?: EventSource[];
  reasoning?: ReasoningTrace;
  toolCalls?: ToolCall[];
  webSearchResults?: WebSearchResult[];
  citations?: InlineCitation[];
  elapsedTime?: string;
}

// Frontend types (camelCase)
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

// API input types
export interface CreateConversationInput {
  title?: string;
}

export interface UpdateConversationInput {
  title: string;
}
