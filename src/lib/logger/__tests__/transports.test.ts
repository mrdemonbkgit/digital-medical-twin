import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
  setTag: vi.fn(),
  setUser: vi.fn(),
}));

import * as Sentry from '@sentry/react';
import { SentryTransport } from '../transports/sentry';
import { LogLevel, LogEntry } from '@shared/logger/types';

function createEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    level: LogLevel.INFO,
    levelName: 'INFO',
    message: 'test message',
    timestamp: new Date().toISOString(),
    environment: 'test',
    source: 'frontend',
    ...overrides,
  };
}

describe('SentryTransport', () => {
  let transport: SentryTransport;

  beforeEach(() => {
    vi.clearAllMocks();
    transport = new SentryTransport();
  });

  it('captures ERROR to Sentry', () => {
    transport.log(createEntry({ level: LogLevel.ERROR, levelName: 'ERROR' }));
    expect(Sentry.captureMessage).toHaveBeenCalled();
  });

  it('captures WARN to Sentry', () => {
    transport.log(createEntry({ level: LogLevel.WARN, levelName: 'WARN' }));
    expect(Sentry.captureMessage).toHaveBeenCalled();
  });

  it('does not capture INFO/DEBUG to Sentry', () => {
    transport.log(createEntry({ level: LogLevel.INFO, levelName: 'INFO' }));
    transport.log(createEntry({ level: LogLevel.DEBUG, levelName: 'DEBUG' }));
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('adds breadcrumbs for all levels', () => {
    transport.log(createEntry({ level: LogLevel.DEBUG, levelName: 'DEBUG' }));
    expect(Sentry.addBreadcrumb).toHaveBeenCalled();
  });

  it('sets correlation ID tags', () => {
    transport.log(
      createEntry({
        sessionId: 'sess-123',
        operationId: 'op-456',
      })
    );
    expect(Sentry.setTag).toHaveBeenCalledWith('session_id', 'sess-123');
    expect(Sentry.setTag).toHaveBeenCalledWith('operation_id', 'op-456');
  });

  it('sets user when userId is present', () => {
    transport.log(createEntry({ userId: 'user-789' }));
    expect(Sentry.setUser).toHaveBeenCalledWith({ id: 'user-789' });
  });

  it('captures exception when error is present', () => {
    transport.log(
      createEntry({
        level: LogLevel.ERROR,
        levelName: 'ERROR',
        error: {
          name: 'TestError',
          message: 'test error message',
          stack: 'Error: test\n  at test.ts:1:1',
        },
      })
    );
    expect(Sentry.captureException).toHaveBeenCalled();
  });

  it('includes extra data in Sentry capture', () => {
    transport.log(
      createEntry({
        level: LogLevel.ERROR,
        levelName: 'ERROR',
        data: { key: 'value' },
      })
    );
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        extra: { key: 'value' },
      })
    );
  });

  it('includes context as tag in Sentry capture', () => {
    transport.log(
      createEntry({
        level: LogLevel.ERROR,
        levelName: 'ERROR',
        context: 'TestContext',
      })
    );
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        tags: { context: 'TestContext' },
      })
    );
  });
});
