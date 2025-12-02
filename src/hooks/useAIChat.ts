import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import {
  getConversation,
  createConversation,
  addMessage,
} from '@/api/conversations';
import type { ChatMessage } from '@/types/ai';
import type { ConversationSettings } from '@/types/conversations';

interface UseAIChatOptions {
  conversationId?: string | null;
  currentSettings?: ConversationSettings | null;
  onConversationCreated?: (id: string) => void;
  onMessageSent?: () => void;
  onSettingsLoaded?: (settings: ConversationSettings) => void;
}

interface UseAIChatReturn {
  conversationId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  conversationSettings: ConversationSettings | null;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  loadConversation: (id: string) => Promise<void>;
  startNewConversation: () => void;
}

async function getAuthToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  return session.access_token;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useAIChat(options: UseAIChatOptions = {}): UseAIChatReturn {
  const [conversationId, setConversationId] = useState<string | null>(
    options.conversationId || null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationSettings, setConversationSettings] = useState<ConversationSettings | null>(null);

  // Load conversation if ID provided
  const loadConversation = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getConversation(id);
      if (result) {
        setConversationId(id);
        setMessages(result.messages);

        // Extract and set conversation settings
        const settings: ConversationSettings = {
          provider: result.conversation.provider,
          model: result.conversation.model,
          reasoningEffort: result.conversation.reasoningEffort,
          thinkingLevel: result.conversation.thinkingLevel,
        };
        setConversationSettings(settings);

        // Notify page to apply these settings
        options.onSettingsLoaded?.(settings);
      } else {
        // Conversation not found or no access - reset state so user can start fresh
        setError('Conversation not found');
        setConversationId(null);
        setMessages([]);
        setConversationSettings(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load conversation';
      logger.error('Failed to load conversation', err instanceof Error ? err : undefined);
      setError(message);
      // Reset state on error so user can start fresh
      setConversationId(null);
      setMessages([]);
      setConversationSettings(null);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  // Load on mount if conversationId provided in options
  // Skip if we already have this conversation loaded (e.g., we just created it)
  useEffect(() => {
    if (options.conversationId && options.conversationId !== conversationId) {
      loadConversation(options.conversationId);
    }
  }, [options.conversationId, conversationId, loadConversation]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setError(null);
      setIsLoading(true);

      // Create conversation if needed
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        try {
          // Use first 50 chars of message as title
          const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
          const conversation = await createConversation({
            title,
            // Save current AI settings with the conversation
            provider: options.currentSettings?.provider,
            model: options.currentSettings?.model,
            reasoningEffort: options.currentSettings?.reasoningEffort,
            thinkingLevel: options.currentSettings?.thinkingLevel,
          });
          currentConversationId = conversation.id;
          setConversationId(currentConversationId);
          setConversationSettings(options.currentSettings || null);
          options.onConversationCreated?.(currentConversationId);
        } catch (err) {
          logger.error('Failed to create conversation', err instanceof Error ? err : undefined);
          setError('Failed to start conversation');
          setIsLoading(false);
          return;
        }
      }

      // Add user message immediately (optimistic)
      const tempUserMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, tempUserMessage]);

      try {
        // Save user message to database
        const savedUserMessage = await addMessage(currentConversationId, {
          role: 'user',
          content: content.trim(),
        });

        // Update optimistic message with real ID
        setMessages((prev) =>
          prev.map((m) => (m.id === tempUserMessage.id ? savedUserMessage : m))
        );

        // Notify that a message was sent (for sidebar refresh, etc.)
        // Do this right after user message is saved, not after AI responds
        options.onMessageSent?.();

        const token = await getAuthToken();

        // Build history from previous messages (exclude the one we just added)
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content.trim(),
            history,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to get AI response');
        }

        const data = await response.json();

        // Save assistant message to database
        const savedAssistantMessage = await addMessage(currentConversationId, {
          role: 'assistant',
          content: data.content,
          sources: data.sources?.length > 0 ? data.sources : undefined,
          reasoning: data.reasoning,
          toolCalls: data.toolCalls,
          webSearchResults: data.webSearchResults,
          citations: data.citations,
          elapsedTime: data.elapsedTime,
        });

        setMessages((prev) => [...prev, savedAssistantMessage]);
      } catch (err) {
        logger.error('Failed to send chat message', err instanceof Error ? err : undefined);
        const message = err instanceof Error ? err.message : 'Failed to send message';
        setError(message);

        // Remove the optimistic user message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
      } finally {
        setIsLoading(false);
      }
    },
    [messages, conversationId, options]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setConversationSettings(null);
    setError(null);
  }, []);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setConversationSettings(null);
    setError(null);
  }, []);

  return {
    conversationId,
    messages,
    isLoading,
    error,
    conversationSettings,
    sendMessage,
    clearChat,
    loadConversation,
    startNewConversation,
  };
}
