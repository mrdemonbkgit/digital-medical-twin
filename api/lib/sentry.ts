import * as Sentry from '@sentry/node';

let initialized = false;

export function initSentry() {
  if (initialized || !process.env.SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV || 'development',
    tracesSampleRate: process.env.VERCEL_ENV === 'production' ? 0.1 : 1.0,
  });

  initialized = true;
}

export { Sentry };
