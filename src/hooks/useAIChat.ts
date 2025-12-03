import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import {
  getConversation,
  createConversation,
  addMessage,
} from '@/api/conversations';
import type { ChatMessage } from '@/types/ai';
import type { ConversationSettings } from '@/types/conversations';

// SSE Event types matching backend
interface SSEEvent {
  type: 'tool_call_start' | 'tool_call_result' | 'content_chunk' | 'complete' | 'error';
  data: unknown;
}

interface ToolCallStartData {
  id: string;
  name: string;
  args?: Record<string, unknown>;
}

interface ToolCallResultData {
  id: string;
  name: string;
  status: 'completed' | 'failed';
  resultLength?: number;
}

// Streaming status exposed to components
export interface StreamingStatus {
  active: boolean;
  currentTool: string | null;
  toolCallCount: number;
}

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
  streamingStatus: StreamingStatus;
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

/**
 * Read SSE stream and yield events as they arrive
 */
async function* readSSEStream(response: Response): AsyncGenerator<SSEEvent> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by double newlines
      const events = buffer.split('\n\n');
      buffer = events.pop() || ''; // Keep incomplete event in buffer

      for (const eventStr of events) {
        if (!eventStr.trim()) continue;

        // Parse SSE format: "data: {...}"
        const dataMatch = eventStr.match(/^data:\s*(.+)$/m);
        if (dataMatch) {
          try {
            const event = JSON.parse(dataMatch[1]) as SSEEvent;
            yield event;
          } catch (parseError) {
            logger.warn('Failed to parse SSE event', { eventStr, parseError });
          }
        }
      }
    }

    // Handle any remaining data in buffer
    if (buffer.trim()) {
      const dataMatch = buffer.match(/^data:\s*(.+)$/m);
      if (dataMatch) {
        try {
          const event = JSON.parse(dataMatch[1]) as SSEEvent;
          yield event;
        } catch {
          // Ignore incomplete final event
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function useAIChat(options: UseAIChatOptions = {}): UseAIChatReturn {
  const [conversationId, setConversationId] = useState<string | null>(
    options.conversationId || null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationSettings, setConversationSettings] = useState<ConversationSettings | null>(null);
  const [streamingStatus, setStreamingStatus] = useState<StreamingStatus>({
    active: false,
    currentTool: null,
    toolCallCount: 0,
  });

  // Ref to skip auto-loading when intentionally starting a new conversation
  const skipNextLoadRef = useRef(false);

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
          agenticMode: result.conversation.agenticMode ?? undefined,
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
  // Also skip if we're intentionally starting a new conversation (skipNextLoadRef)
  useEffect(() => {
    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false;
      return;
    }
    if (options.conversationId && options.conversationId !== conversationId) {
      loadConversation(options.conversationId);
    }
  }, [options.conversationId, conversationId, loadConversation]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setError(null);
      setIsLoading(true);
      // Set streaming status immediately so user sees "Analyzing..." right away
      setStreamingStatus({ active: true, currentTool: null, toolCallCount: 0 });

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
            agenticMode: options.currentSettings?.agenticMode,
          });
          currentConversationId = conversation.id;
          setConversationId(currentConversationId);
          setConversationSettings(options.currentSettings || null);
          options.onConversationCreated?.(currentConversationId);
        } catch (err) {
          logger.error('Failed to create conversation', err instanceof Error ? err : undefined);
          setError('Failed to start conversation');
          setIsLoading(false);
          setStreamingStatus({ active: false, currentTool: null, toolCallCount: 0 });
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

        // Use SSE streaming for real-time tool execution status
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({
            message: content.trim(),
            history,
            conversationId: currentConversationId,
          }),
        });

        if (!response.ok) {
          // Non-SSE error response
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get AI response');
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: any = null;
        let toolCallCount = 0;

        // Consume SSE stream
        for await (const event of readSSEStream(response)) {
          switch (event.type) {
            case 'tool_call_start': {
              const toolData = event.data as ToolCallStartData;
              toolCallCount++;
              setStreamingStatus({
                active: true,
                currentTool: toolData.name,
                toolCallCount,
              });
              break;
            }
            case 'tool_call_result': {
              const resultData = event.data as ToolCallResultData;
              // Tool completed, waiting for next tool or final response
              setStreamingStatus((prev) => ({
                ...prev,
                currentTool: null, // Clear current tool, may get another
              }));
              logger.debug('Tool completed', { name: resultData.name, status: resultData.status });
              break;
            }
            case 'complete':
              // Final response with all data
              data = event.data;
              setStreamingStatus({ active: false, currentTool: null, toolCallCount: 0 });
              break;
            case 'error': {
              const errorData = event.data as { message: string };
              setStreamingStatus({ active: false, currentTool: null, toolCallCount: 0 });
              throw new Error(errorData.message || 'AI request failed');
            }
          }
        }

        // Ensure streaming is marked as complete
        setStreamingStatus({ active: false, currentTool: null, toolCallCount: 0 });

        if (!data) {
          throw new Error('No response received from AI');
        }

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
          // Include metadata for details modal
          metadata: data.metadata,
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
    // Set flag to prevent useEffect from reloading old conversation
    // due to race condition with URL update
    skipNextLoadRef.current = true;
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
    streamingStatus,
    sendMessage,
    clearChat,
    loadConversation,
    startNewConversation,
  };
}
