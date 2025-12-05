import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SentryTransport } from './sentry';
import * as Sentry from '@sentry/react';
import { LogLevel } from '@shared/logger/types';
import type { LogEntry } from '@shared/logger/types';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  setTag: vi.fn(),
  setUser: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

describe('SentryTransport', () => {
  let transport: SentryTransport;

  const createEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
    timestamp: '2024-01-01T00:00:00.000Z',
    level: LogLevel.INFO,
    levelName: 'INFO',
    message: 'Test message',
    environment: 'test',
    source: 'frontend',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    transport = new SentryTransport();
  });

  describe('name', () => {
    it('has correct name', () => {
      expect(transport.name).toBe('sentry');
    });
  });

  describe('correlation tags', () => {
    it('sets session ID tag when present', () => {
      transport.log(createEntry({ sessionId: 'session-123' }));

      expect(Sentry.setTag).toHaveBeenCalledWith('session_id', 'session-123');
    });

    it('sets operation ID tag when present', () => {
      transport.log(createEntry({ operationId: 'op-456' }));

      expect(Sentry.setTag).toHaveBeenCalledWith('operation_id', 'op-456');
    });

    it('sets user when userId present', () => {
      transport.log(createEntry({ userId: 'user-789' }));

      expect(Sentry.setUser).toHaveBeenCalledWith({ id: 'user-789' });
    });

    it('does not set tags when not present', () => {
      transport.log(createEntry());

      expect(Sentry.setTag).not.toHaveBeenCalled();
      expect(Sentry.setUser).not.toHaveBeenCalled();
    });
  });

  describe('error capture', () => {
    it('captures exception for ERROR level with error object', () => {
      const entry = createEntry({
        level: LogLevel.ERROR,
        levelName: 'ERROR',
        error: {
          name: 'TestError',
          message: 'Test error message',
          stack: 'Error: Test\n  at test.ts:1:1',
        },
        data: { extra: 'data' },
        context: 'TestContext',
      });

      transport.log(entry);

      expect(Sentry.captureException).toHaveBeenCalled();
      const call = vi.mocked(Sentry.captureException).mock.calls[0];
      expect(call[0]).toBeInstanceOf(Error);
      expect((call[0] as Error).message).toBe('Test error message');
      expect(call[1]).toEqual({
        extra: { extra: 'data' },
        tags: { context: 'TestContext' },
        level: 'error',
      });
    });

    it('captures message for WARN level without error object', () => {
      const entry = createEntry({
        level: LogLevel.WARN,
        levelName: 'WARN',
        message: 'Warning message',
        context: 'WarnContext',
      });

      transport.log(entry);

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Warning message', {
        level: 'warning',
        extra: undefined,
        tags: { context: 'WarnContext' },
      });
    });

    it('captures exception for WARN level with error object', () => {
      const entry = createEntry({
        level: LogLevel.WARN,
        levelName: 'WARN',
        error: {
          name: 'WarnError',
          message: 'Warning error',
        },
      });

      transport.log(entry);

      expect(Sentry.captureException).toHaveBeenCalled();
      const call = vi.mocked(Sentry.captureException).mock.calls[0];
      expect(call[1]?.level).toBe('warning');
    });

    it('does not capture for INFO level', () => {
      transport.log(createEntry({ level: LogLevel.INFO, levelName: 'INFO' }));

      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });

    it('does not capture for DEBUG level', () => {
      transport.log(createEntry({ level: LogLevel.DEBUG, levelName: 'DEBUG' }));

      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });
  });

  describe('breadcrumbs', () => {
    it('always adds breadcrumb', () => {
      transport.log(createEntry({ message: 'Test breadcrumb', context: 'TestCtx' }));

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'TestCtx',
        message: 'Test breadcrumb',
        level: 'info',
        data: undefined,
      });
    });

    it('uses "app" as default category', () => {
      transport.log(createEntry({ context: undefined }));

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'app' })
      );
    });

    it('maps DEBUG level to debug', () => {
      transport.log(createEntry({ level: LogLevel.DEBUG, levelName: 'DEBUG' }));

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'debug' })
      );
    });

    it('maps WARN level to warning', () => {
      transport.log(createEntry({ level: LogLevel.WARN, levelName: 'WARN' }));

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'warning' })
      );
    });

    it('maps ERROR level to error', () => {
      transport.log(createEntry({ level: LogLevel.ERROR, levelName: 'ERROR' }));

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'error' })
      );
    });

    it('includes data in breadcrumb', () => {
      transport.log(createEntry({ data: { key: 'value' } }));

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({ data: { key: 'value' } })
      );
    });
  });
});
