import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from 'react';
import { nanoid } from 'nanoid';
import { logger } from '@/lib/logger';

interface CorrelationContextValue {
  sessionId: string;
  currentOperationId: string | null;
  startOperation: (name: string) => string;
  endOperation: () => void;
}

const CorrelationContext = createContext<CorrelationContextValue | null>(null);

export function CorrelationProvider({ children }: { children: ReactNode }) {
  const [sessionId] = useState(() => `sess-${nanoid(8)}`);
  const [operationId, setOperationId] = useState<string | null>(null);

  // Set session ID on logger when provider mounts
  useEffect(() => {
    logger.setSessionId(sessionId);
  }, [sessionId]);

  // Update operation ID on logger when it changes
  useEffect(() => {
    if (operationId) {
      logger.setOperationId(operationId);
    }
  }, [operationId]);

  const startOperation = useCallback((name: string) => {
    const opId = `${name}-${nanoid(6)}`;
    setOperationId(opId);
    return opId;
  }, []);

  const endOperation = useCallback(() => {
    setOperationId(null);
  }, []);

  const value = useMemo(
    () => ({
      sessionId,
      currentOperationId: operationId,
      startOperation,
      endOperation,
    }),
    [sessionId, operationId, startOperation, endOperation]
  );

  return <CorrelationContext.Provider value={value}>{children}</CorrelationContext.Provider>;
}

export function useCorrelation() {
  const ctx = useContext(CorrelationContext);
  if (!ctx) throw new Error('useCorrelation must be used within CorrelationProvider');
  return ctx;
}
