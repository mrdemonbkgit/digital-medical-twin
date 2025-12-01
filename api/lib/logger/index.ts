import { Logger } from './Logger.js';
import { ConsoleTransport } from './transports/console.js';
import { FileTransport } from './transports/file.js';

// Determine environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
const eagerSentry = process.env.EAGER_SENTRY === 'true';
const hasSentryDsn = !!process.env.SENTRY_DSN;

// Create logger with basic transports
export const logger = new Logger();
logger.addTransport(new ConsoleTransport());

// Add file transport (skip in Vercel production - no persistent filesystem)
if (!process.env.VERCEL) {
  logger.addTransport(new FileTransport({ maxFiles: 0 }));
}

// Sentry loading strategy:
// - Production (Vercel): Load SYNCHRONOUSLY with top-level await to catch all errors
// - Development: Load DEFERRED to speed up startup
if (hasSentryDsn && (isProduction || eagerSentry)) {
  // Production: Load Sentry synchronously (top-level await)
  // This ensures Sentry is ready before any request handler runs
  const { initSentry } = await import('../sentry.js');
  initSentry();
  const { SentryTransport } = await import('./transports/sentry.js');
  logger.addTransport(new SentryTransport());
} else if (hasSentryDsn) {
  // Development: Load Sentry in background after 100ms
  setTimeout(async () => {
    try {
      const { initSentry } = await import('../sentry.js');
      initSentry();
      const { SentryTransport } = await import('./transports/sentry.js');
      logger.addTransport(new SentryTransport());
      console.log('[Logger] Sentry loaded (deferred)');
    } catch (err) {
      console.warn('[Logger] Failed to load Sentry:', err);
    }
  }, 100);
}

export { Logger } from './Logger.js';
export { ConsoleTransport } from './transports/console.js';
export { FileTransport } from './transports/file.js';
// Note: SentryTransport is loaded dynamically to avoid slow startup
// Use: const { SentryTransport } = await import('./transports/sentry.js');
