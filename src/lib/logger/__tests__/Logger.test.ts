import { describe, it, expect, beforeEach } from 'vitest';
import { Logger } from '../Logger';
import { MockTransport } from './testUtils';
import { LogLevel } from '@shared/logger/types';

describe('Logger', () => {
  let logger: Logger;
  let transport: MockTransport;

  beforeEach(() => {
    transport = new MockTransport();
    logger = new Logger({ minLevel: LogLevel.DEBUG });
    logger.addTransport(transport);
  });

  it('logs messages with correct level', () => {
    logger.info('test message');
    expect(transport.getLastEntry()?.levelName).toBe('INFO');
    expect(transport.getLastEntry()?.message).toBe('test message');
  });

  it('respects minLevel', () => {
    const warnLogger = new Logger({ minLevel: LogLevel.WARN });
    warnLogger.addTransport(transport);
    transport.clear();

    warnLogger.debug('should not appear');
    warnLogger.info('should not appear');
    expect(transport.entries).toHaveLength(0);

    warnLogger.warn('should appear');
    expect(transport.entries).toHaveLength(1);
  });

  it('creates child with context', () => {
    const child = logger.child('TestContext');
    child.info('child message');
    expect(transport.getLastEntry()?.context).toBe('TestContext');
  });

  it('formats errors correctly', () => {
    const error = new Error('test error');
    logger.error('failed', error);
    expect(transport.getLastEntry()?.error?.message).toBe('test error');
    expect(transport.getLastEntry()?.error?.stack).toBeDefined();
  });

  it('includes correlation IDs', () => {
    logger.setSessionId('sess-123');
    logger.setOperationId('op-456');
    logger.info('test');
    expect(transport.getLastEntry()?.sessionId).toBe('sess-123');
    expect(transport.getLastEntry()?.operationId).toBe('op-456');
  });
});
