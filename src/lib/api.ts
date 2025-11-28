import { useMemo } from 'react';
import { useCorrelation } from '@/context/CorrelationContext';

export function useApiClient() {
  const { sessionId, currentOperationId } = useCorrelation();

  return useMemo(
    () => ({
      fetch: async (url: string, options: RequestInit = {}) => {
        const headers: Record<string, string> = {
          ...(options.headers as Record<string, string>),
          'X-Session-ID': sessionId,
        };
        if (currentOperationId) {
          headers['X-Operation-ID'] = currentOperationId;
        }
        return fetch(url, { ...options, headers });
      },
    }),
    [sessionId, currentOperationId]
  );
}

/**
 * Get correlation headers for use with fetch or other HTTP clients.
 * For use outside of React components.
 */
export function getCorrelationHeaders(
  sessionId: string,
  operationId?: string | null
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Session-ID': sessionId,
  };
  if (operationId) {
    headers['X-Operation-ID'] = operationId;
  }
  return headers;
}
