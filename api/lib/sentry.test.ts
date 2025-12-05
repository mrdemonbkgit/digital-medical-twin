import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Sentry before importing
vi.mock('@sentry/node', () => ({
  init: vi.fn(),
}));

import * as Sentry from '@sentry/node';

describe('sentry', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Reset environment
    delete process.env.SENTRY_DSN;
    delete process.env.VERCEL_ENV;
  });

  afterEach(() => {
    // Restore env
    process.env = { ...originalEnv };
  });

  describe('initSentry', () => {
    it('does not initialize when DSN is not set', async () => {
      delete process.env.SENTRY_DSN;

      const { initSentry } = await import('./sentry');
      initSentry();

      expect(Sentry.init).not.toHaveBeenCalled();
    });

    it('initializes Sentry when DSN is set', async () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.VERCEL_ENV = 'preview';

      const { initSentry } = await import('./sentry');
      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://test@sentry.io/123',
          environment: 'preview',
        })
      );
    });

    it('uses development as default environment', async () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      delete process.env.VERCEL_ENV;

      const { initSentry } = await import('./sentry');
      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: 'development',
        })
      );
    });

    it('uses lower sample rate in production', async () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.VERCEL_ENV = 'production';

      const { initSentry } = await import('./sentry');
      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          tracesSampleRate: 0.1,
        })
      );
    });

    it('uses full sample rate in non-production', async () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.VERCEL_ENV = 'preview';

      const { initSentry } = await import('./sentry');
      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          tracesSampleRate: 1.0,
        })
      );
    });

    it('only initializes once', async () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      const { initSentry } = await import('./sentry');
      initSentry();
      initSentry();
      initSentry();

      expect(Sentry.init).toHaveBeenCalledTimes(1);
    });
  });

  describe('exports', () => {
    it('re-exports Sentry', async () => {
      const module = await import('./sentry');
      expect(module.Sentry).toBeDefined();
    });
  });
});
