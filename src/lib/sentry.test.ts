import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Sentry before importing
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })),
}));

import * as Sentry from '@sentry/react';
import { initSentry } from './sentry';

describe('sentry', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore env
    Object.assign(import.meta.env, originalEnv);
  });

  describe('initSentry', () => {
    it('does not initialize when DSN is not set', () => {
      // @ts-expect-error - mocking env
      import.meta.env.VITE_SENTRY_DSN = '';

      initSentry();

      expect(Sentry.init).not.toHaveBeenCalled();
    });

    it('initializes Sentry when DSN is set', () => {
      // @ts-expect-error - mocking env
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';
      // @ts-expect-error - mocking env
      import.meta.env.MODE = 'development';
      // @ts-expect-error - mocking env
      import.meta.env.PROD = false;

      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://test@sentry.io/123',
          environment: 'development',
        })
      );
    });

    it('uses lower sample rate in production', () => {
      // @ts-expect-error - mocking env
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';
      // @ts-expect-error - mocking env
      import.meta.env.PROD = true;

      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          tracesSampleRate: 0.1,
        })
      );
    });

    it('uses full sample rate in development', () => {
      // @ts-expect-error - mocking env
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';
      // @ts-expect-error - mocking env
      import.meta.env.PROD = false;

      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          tracesSampleRate: 1.0,
        })
      );
    });

    it('includes browserTracingIntegration', () => {
      // @ts-expect-error - mocking env
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';

      initSentry();

      expect(Sentry.browserTracingIntegration).toHaveBeenCalled();
      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          integrations: expect.arrayContaining([{ name: 'BrowserTracing' }]),
        })
      );
    });

    it('includes beforeSend hook', () => {
      // @ts-expect-error - mocking env
      import.meta.env.VITE_SENTRY_DSN = 'https://test@sentry.io/123';

      initSentry();

      const initCall = vi.mocked(Sentry.init).mock.calls[0][0];
      expect(initCall?.beforeSend).toBeDefined();

      // Test that beforeSend returns the event
      const mockEvent = { message: 'test' };
      const result = initCall?.beforeSend?.(mockEvent as Sentry.ErrorEvent, {});
      expect(result).toBe(mockEvent);
    });
  });

  describe('exports', () => {
    it('re-exports Sentry', async () => {
      const module = await import('./sentry');
      expect(module.Sentry).toBeDefined();
    });
  });
});
