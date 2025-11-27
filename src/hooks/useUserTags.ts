import { useState, useEffect } from 'react';
import { getUserTags } from '@/api/events';

export function useUserTags() {
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTags() {
      try {
        setIsLoading(true);
        const userTags = await getUserTags();
        setTags(userTags);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tags');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTags();
  }, []);

  return { tags, isLoading, error };
}
