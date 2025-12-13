import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type {
  Conversation,
  ConversationRow,
  MessageRow,
  MessageMetadata,
  CreateConversationInput,
  UpdateConversationInput,
} from '@/types/conversations';
import type {
  ChatMessage,
  AIProvider,
  AIModel,
  OpenAIReasoningEffort,
  GeminiThinkingLevel,
} from '@/types/ai';

// Helper to get authenticated user ID
async function getAuthenticatedUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  return user.id;
}

// Convert database row to Conversation
function rowToConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    provider: row.provider as AIProvider | null,
    model: row.model as AIModel | null,
    reasoningEffort: row.reasoning_effort as OpenAIReasoningEffort | null,
    thinkingLevel: row.thinking_level as GeminiThinkingLevel | null,
    agenticMode: row.agentic_mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert database row to ChatMessage
function rowToMessage(row: MessageRow): ChatMessage {
  const metadata = row.metadata || {};
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    timestamp: new Date(row.created_at),
    sources: metadata.sources,
    reasoning: metadata.reasoning,
    toolCalls: metadata.toolCalls,
    webSearchResults: metadata.webSearchResults,
    citations: metadata.citations,
    elapsedTime: metadata.elapsedTime,
    // Include full metadata for details modal
    metadata: row.metadata || undefined,
  };
}

// Get all conversations for the current user
export async function getConversations(): Promise<Conversation[]> {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch conversations', error);
    throw new Error(`Failed to fetch conversations: ${error.message}`);
  }

  return (data as ConversationRow[]).map(rowToConversation);
}

// Get a single conversation with all its messages
export async function getConversation(
  id: string
): Promise<{ conversation: Conversation; messages: ChatMessage[] } | null> {
  const userId = await getAuthenticatedUserId();

  // Fetch conversation (with user_id check for defense-in-depth)
  const { data: convData, error: convError } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (convError) {
    if (convError.code === 'PGRST116') return null; // Not found
    logger.error('Failed to fetch conversation', convError);
    throw new Error(`Failed to fetch conversation: ${convError.message}`);
  }

  // Fetch messages
  const { data: msgData, error: msgError } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  if (msgError) {
    logger.error('Failed to fetch messages', msgError);
    throw new Error(`Failed to fetch messages: ${msgError.message}`);
  }

  return {
    conversation: rowToConversation(convData as ConversationRow),
    messages: (msgData as MessageRow[]).map(rowToMessage),
  };
}

// Create a new conversation
export async function createConversation(
  input?: CreateConversationInput
): Promise<Conversation> {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({
      user_id: userId,
      title: input?.title || 'New Conversation',
      provider: input?.provider ?? null,
      model: input?.model ?? null,
      reasoning_effort: input?.reasoningEffort ?? null,
      thinking_level: input?.thinkingLevel ?? null,
      agentic_mode: input?.agenticMode ?? null,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create conversation', error);
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return rowToConversation(data as ConversationRow);
}

// Update a conversation (e.g., rename)
export async function updateConversation(
  id: string,
  input: UpdateConversationInput
): Promise<Conversation> {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('ai_conversations')
    .update({ title: input.title })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update conversation', error);
    throw new Error(`Failed to update conversation: ${error.message}`);
  }

  return rowToConversation(data as ConversationRow);
}

// Delete a conversation (cascades to messages)
export async function deleteConversation(id: string): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from('ai_conversations')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.error('Failed to delete conversation', error);
    throw new Error(`Failed to delete conversation: ${error.message}`);
  }
}

// Delete a message from a conversation
export async function deleteMessage(
  conversationId: string,
  messageId: string
): Promise<void> {
  const { error } = await supabase
    .from('ai_messages')
    .delete()
    .eq('id', messageId)
    .eq('conversation_id', conversationId);

  if (error) {
    logger.error('Failed to delete message', error);
    throw new Error(`Failed to delete message: ${error.message}`);
  }
}

// Delete all messages after a given message (inclusive)
// Used when editing a user message to remove all subsequent messages
export async function deleteMessagesAfter(
  conversationId: string,
  afterTimestamp: string
): Promise<void> {
  const { error } = await supabase
    .from('ai_messages')
    .delete()
    .eq('conversation_id', conversationId)
    .gte('created_at', afterTimestamp);

  if (error) {
    logger.error('Failed to delete messages', error);
    throw new Error(`Failed to delete messages: ${error.message}`);
  }
}

// Update a message content
export async function updateMessage(
  conversationId: string,
  messageId: string,
  content: string
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('ai_messages')
    .update({ content })
    .eq('id', messageId)
    .eq('conversation_id', conversationId)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update message', error);
    throw new Error(`Failed to update message: ${error.message}`);
  }

  return rowToMessage(data as MessageRow);
}

// Add a message to a conversation
export async function addMessage(
  conversationId: string,
  message: Omit<ChatMessage, 'id' | 'timestamp'>
): Promise<ChatMessage> {
  // Build metadata from ChatMessage fields
  const metadata: MessageMetadata = {};
  if (message.sources?.length) metadata.sources = message.sources;
  if (message.reasoning) metadata.reasoning = message.reasoning;
  if (message.toolCalls?.length) metadata.toolCalls = message.toolCalls;
  if (message.webSearchResults?.length) metadata.webSearchResults = message.webSearchResults;
  if (message.citations?.length) metadata.citations = message.citations;
  if (message.elapsedTime) metadata.elapsedTime = message.elapsedTime;
  // Include message details for info modal (from message.metadata if provided)
  if (message.metadata?.model) metadata.model = message.metadata.model;
  if (message.metadata?.provider) metadata.provider = message.metadata.provider;
  if (message.metadata?.tokensUsed) metadata.tokensUsed = message.metadata.tokensUsed;
  if (message.metadata?.reasoningEffort) metadata.reasoningEffort = message.metadata.reasoningEffort;
  if (message.metadata?.thinkingLevel) metadata.thinkingLevel = message.metadata.thinkingLevel;
  if (message.metadata?.elapsedMs) metadata.elapsedMs = message.metadata.elapsedMs;

  const { data, error } = await supabase
    .from('ai_messages')
    .insert({
      conversation_id: conversationId,
      role: message.role,
      content: message.content,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to add message', error);
    throw new Error(`Failed to add message: ${error.message}`);
  }

  // Also update conversation's updated_at timestamp
  await supabase
    .from('ai_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return rowToMessage(data as MessageRow);
}
