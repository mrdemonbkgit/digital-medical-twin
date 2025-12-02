import { useState, useEffect, useCallback } from 'react';
import {
  getConversations,
  createConversation,
  deleteConversation,
  updateConversation,
} from '@/api/conversations';
import { logger } from '@/lib/logger';
import type { Conversation } from '@/types/conversations';

interface UseConversationsReturn {
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  createNew: (title?: string) => Promise<Conversation>;
  remove: (id: string) => Promise<void>;
  rename: (id: string, title: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch conversations';
      logger.error('Failed to fetch conversations', err instanceof Error ? err : undefined);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createNew = useCallback(async (title?: string) => {
    const conversation = await createConversation({ title });
    setConversations((prev) => [conversation, ...prev]);
    return conversation;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const rename = useCallback(async (id: string, title: string) => {
    const updated = await updateConversation(id, { title });
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? updated : c))
    );
  }, []);

  return {
    conversations,
    isLoading,
    error,
    createNew,
    remove,
    rename,
    refetch: fetchConversations,
  };
}
