import * as Sentry from '@sentry/react';
import { logger } from '@/lib/logger';

interface ErrorFallbackProps {
  error: unknown;
  resetError: () => void;
}

function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-theme-secondary">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold text-danger mb-4">Something went wrong</h1>
        <p className="text-theme-secondary mb-6">{errorMessage}</p>
        <button
          onClick={resetError}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

interface SentryErrorBoundaryProps {
  children: React.ReactNode;
}

export function SentryErrorBoundary({ children }: SentryErrorBoundaryProps) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback error={error} resetError={resetError} />
      )}
      onError={(error, componentStack) => {
        logger.error('React Error Boundary caught unhandled error', error as Error, { componentStack });
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
