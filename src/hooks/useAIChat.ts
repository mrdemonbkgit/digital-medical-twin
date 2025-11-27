import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ChatMessage } from '@/types/ai';

interface UseAIChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
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

export function useAIChat(): UseAIChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setError(null);
      setIsLoading(true);

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
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

        // Add assistant message with sources and activity metadata from API
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
          sources: data.sources?.length > 0 ? data.sources : undefined,
          // Extended metadata for activity timeline
          reasoning: data.reasoning,
          toolCalls: data.toolCalls,
          webSearchResults: data.webSearchResults,
          citations: data.citations,
          elapsedTime: data.elapsedTime,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send message';
        setError(message);

        // Remove the user message if the request failed
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
}
