import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, RefreshCw, Copy, Check, MessageSquarePlus, Wifi, Clock } from 'lucide-react';

// Parse error message to determine error type
function parseErrorType(error: string): 'rate_limit' | 'network' | 'timeout' | 'context' | 'server' {
  const lowerError = error.toLowerCase();

  if (lowerError.includes('rate') || lowerError.includes('too many') || lowerError.includes('429')) {
    return 'rate_limit';
  }
  if (lowerError.includes('network') || lowerError.includes('connection') || lowerError.includes('offline')) {
    return 'network';
  }
  if (lowerError.includes('timeout') || lowerError.includes('took too long') || lowerError.includes('timed out')) {
    return 'timeout';
  }
  if (lowerError.includes('context') || lowerError.includes('too long') || lowerError.includes('max tokens')) {
    return 'context';
  }
  return 'server';
}

// Get user-friendly message for error type
function getErrorMessage(type: ReturnType<typeof parseErrorType>): { title: string; description: string } {
  switch (type) {
    case 'rate_limit':
      return {
        title: 'Too many requests',
        description: 'You\'ve sent too many messages. Please wait a moment before trying again.',
      };
    case 'network':
      return {
        title: 'Connection problem',
        description: 'Unable to connect to the server. Please check your internet connection.',
      };
    case 'timeout':
      return {
        title: 'Request timed out',
        description: 'The server took too long to respond. Please try again.',
      };
    case 'context':
      return {
        title: 'Conversation too long',
        description: 'This conversation has too many messages. Please start a new conversation.',
      };
    default:
      return {
        title: 'Something went wrong',
        description: 'An unexpected error occurred. Please try again.',
      };
  }
}

interface ErrorRecoveryProps {
  error: string;
  onRetry: () => void;
  onNewConversation: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

export function ErrorRecovery({
  error,
  onRetry,
  onNewConversation,
  onDismiss,
  isLoading = false,
}: ErrorRecoveryProps) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const errorType = parseErrorType(error);
  const { title, description } = getErrorMessage(errorType);

  // Auto-countdown for rate limit errors
  useEffect(() => {
    if (errorType === 'rate_limit') {
      // Start 30 second countdown
      setCountdown(30);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [errorType, error]);

  const handleCopyError = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(error);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error:', err);
    }
  }, [error]);

  const handleRetry = () => {
    onDismiss();
    onRetry();
  };

  return (
    <div className="mx-4 mb-4 bg-danger-muted rounded-lg border border-danger/20 overflow-hidden">
      {/* Error header */}
      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0 w-10 h-10 bg-danger/10 rounded-full flex items-center justify-center">
          {errorType === 'network' ? (
            <Wifi className="h-5 w-5 text-danger" />
          ) : errorType === 'timeout' ? (
            <Clock className="h-5 w-5 text-danger" />
          ) : (
            <AlertCircle className="h-5 w-5 text-danger" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-danger">{title}</h3>
          <p className="text-sm text-danger/80 mt-0.5">{description}</p>
          {/* Show original error in smaller text for debugging */}
          <p className="text-xs text-danger/60 mt-2 truncate" title={error}>
            Error: {error}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3 bg-danger/5 border-t border-danger/10">
        {/* Primary action based on error type */}
        {errorType === 'context' ? (
          <button
            onClick={onNewConversation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-accent rounded-md hover:opacity-90 transition-opacity"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New conversation
          </button>
        ) : (
          <button
            onClick={handleRetry}
            disabled={isLoading || (errorType === 'rate_limit' && countdown !== null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-accent rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {errorType === 'rate_limit' && countdown !== null
              ? `Retry in ${countdown}s`
              : isLoading
                ? 'Retrying...'
                : 'Retry'}
          </button>
        )}

        {/* Copy error button */}
        <button
          onClick={handleCopyError}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-danger bg-transparent border border-danger/30 rounded-md hover:bg-danger/10 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy error
            </>
          )}
        </button>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="ml-auto text-sm text-danger/70 hover:text-danger transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
