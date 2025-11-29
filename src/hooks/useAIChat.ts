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

      // === TIMING DEBUG ===
      const t0 = performance.now();
      console.log('[CHAT TIMING] t0: User send initiated');

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
        const t_auth = performance.now();
        const token = await getAuthToken();
        console.log(`[CHAT TIMING] Auth token retrieved: ${(performance.now() - t_auth).toFixed(0)}ms`);

        // Build history from previous messages (exclude the one we just added)
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const t1 = performance.now();
        console.log(`[CHAT TIMING] t1: Before fetch (prep: ${(t1 - t0).toFixed(0)}ms)`);

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

        const t2 = performance.now();
        console.log(`[CHAT TIMING] t2: Fetch complete (network: ${(t2 - t1).toFixed(0)}ms)`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to get AI response');
        }

        const data = await response.json();

        const t3 = performance.now();
        console.log(`[CHAT TIMING] t3: JSON parsed (parse: ${(t3 - t2).toFixed(0)}ms)`);

        // Log backend timings if available
        if (data._timings) {
          console.log('[CHAT TIMING] Backend breakdown:', data._timings);
          // Calculate network overhead (frontend fetch time - backend total)
          const networkOverhead = (t2 - t1) - data._timings.total;
          console.log(`[CHAT TIMING] Network/proxy overhead: ${networkOverhead.toFixed(0)}ms`);
        }

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

        const t4 = performance.now();
        console.log(`[CHAT TIMING] t4: State updated (total: ${(t4 - t0).toFixed(0)}ms)`);
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
