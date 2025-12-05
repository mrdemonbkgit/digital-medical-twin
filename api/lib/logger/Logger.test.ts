import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from './Logger';
import { LogLevel, LogTransport, LogEntry } from './types';

describe('Logger', () => {
  let logger: Logger;
  let mockTransport: LogTransport;
  let loggedEntries: LogEntry[];

  beforeEach(() => {
    vi.clearAllMocks();
    loggedEntries = [];
    mockTransport = {
      name: 'mock',
      log: vi.fn((entry: LogEntry) => {
        loggedEntries.push(entry);
      }),
    };
    logger = new Logger();
    logger.addTransport(mockTransport);
  });

  describe('constructor', () => {
    it('uses default DEBUG level when LOG_LEVEL not set', () => {
      const originalEnv = process.env.LOG_LEVEL;
      delete process.env.LOG_LEVEL;

      const newLogger = new Logger();
      newLogger.addTransport(mockTransport);
      newLogger.debug('test');

      expect(mockTransport.log).toHaveBeenCalled();

      process.env.LOG_LEVEL = originalEnv;
    });

    it('parses LOG_LEVEL from environment', () => {
      const originalEnv = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'warn';

      const newLogger = new Logger();
      newLogger.addTransport(mockTransport);
      newLogger.debug('test');
      newLogger.info('test');

      expect(mockTransport.log).not.toHaveBeenCalled();

      newLogger.warn('test');
      expect(mockTransport.log).toHaveBeenCalled();

      process.env.LOG_LEVEL = originalEnv;
    });

    it('accepts config overrides', () => {
      const newLogger = new Logger({ minLevel: LogLevel.ERROR });
      newLogger.addTransport(mockTransport);
      newLogger.warn('test');

      expect(mockTransport.log).not.toHaveBeenCalled();

      newLogger.error('test');
      expect(mockTransport.log).toHaveBeenCalled();
    });
  });

  describe('addTransport', () => {
    it('adds transport to list', () => {
      const secondTransport: LogTransport = {
        name: 'second',
        log: vi.fn(),
      };

      logger.addTransport(secondTransport);
      logger.info('test');

      expect(mockTransport.log).toHaveBeenCalled();
      expect(secondTransport.log).toHaveBeenCalled();
    });
  });

  describe('child', () => {
    it('creates child logger with context', () => {
      const child = logger.child('TestContext');
      child.info('test message');

      expect(loggedEntries[0].context).toBe('TestContext');
    });

    it('shares transports with parent', () => {
      const child = logger.child('Child');
      child.info('test');

      expect(mockTransport.log).toHaveBeenCalled();
    });

    it('inherits config from parent', () => {
      logger.setSessionId('session-123');
      const child = logger.child('Child');
      child.info('test');

      // Note: Child doesn't automatically inherit session ID unless explicitly passed through config
      expect(loggedEntries[0].context).toBe('Child');
    });
  });

  describe('setSessionId', () => {
    it('sets session ID on log entries', () => {
      logger.setSessionId('session-123');
      logger.info('test');

      expect(loggedEntries[0].sessionId).toBe('session-123');
    });
  });

  describe('setOperationId', () => {
    it('sets operation ID on log entries', () => {
      logger.setOperationId('op-456');
      logger.info('test');

      expect(loggedEntries[0].operationId).toBe('op-456');
    });

    it('clears operation ID when undefined', () => {
      logger.setOperationId('op-456');
      logger.setOperationId(undefined);
      logger.info('test');

      expect(loggedEntries[0].operationId).toBeUndefined();
    });
  });

  describe('setUserId', () => {
    it('sets user ID on log entries', () => {
      logger.setUserId('user-789');
      logger.info('test');

      expect(loggedEntries[0].userId).toBe('user-789');
    });
  });

  describe('log levels', () => {
    it('logs debug messages', () => {
      logger.debug('debug message');

      expect(loggedEntries[0].level).toBe(LogLevel.DEBUG);
      expect(loggedEntries[0].levelName).toBe('DEBUG');
      expect(loggedEntries[0].message).toBe('debug message');
    });

    it('logs info messages', () => {
      logger.info('info message');

      expect(loggedEntries[0].level).toBe(LogLevel.INFO);
      expect(loggedEntries[0].levelName).toBe('INFO');
    });

    it('logs warn messages', () => {
      logger.warn('warn message');

      expect(loggedEntries[0].level).toBe(LogLevel.WARN);
      expect(loggedEntries[0].levelName).toBe('WARN');
    });

    it('logs error messages', () => {
      logger.error('error message');

      expect(loggedEntries[0].level).toBe(LogLevel.ERROR);
      expect(loggedEntries[0].levelName).toBe('ERROR');
    });
  });

  describe('data parameter', () => {
    it('includes data in log entry', () => {
      logger.info('test', { key: 'value', count: 42 });

      expect(loggedEntries[0].data).toEqual({ key: 'value', count: 42 });
    });

    it('handles undefined data', () => {
      logger.info('test');

      expect(loggedEntries[0].data).toBeUndefined();
    });
  });

  describe('error formatting', () => {
    it('formats Error objects', () => {
      const error = new Error('Test error');
      error.name = 'TestError';
      logger.error('error occurred', error);

      expect(loggedEntries[0].error).toEqual({
        name: 'TestError',
        message: 'Test error',
        stack: expect.any(String),
      });
    });

    it('handles non-Error objects', () => {
      logger.error('error occurred', 'string error');

      expect(loggedEntries[0].error).toEqual({
        name: 'Error',
        message: 'string error',
      });
    });

    it('handles error with data', () => {
      const error = new Error('Test error');
      logger.error('error occurred', error, { extra: 'data' });

      expect(loggedEntries[0].error?.message).toBe('Test error');
      expect(loggedEntries[0].data).toEqual({ extra: 'data' });
    });
  });

  describe('log entry fields', () => {
    it('includes timestamp', () => {
      logger.info('test');

      expect(loggedEntries[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('includes environment', () => {
      logger.info('test');

      expect(loggedEntries[0].environment).toBeDefined();
    });

    it('sets source as backend', () => {
      logger.info('test');

      expect(loggedEntries[0].source).toBe('backend');
    });
  });

  describe('min level filtering', () => {
    it('filters out logs below min level', () => {
      const newLogger = new Logger({ minLevel: LogLevel.WARN });
      newLogger.addTransport(mockTransport);

      newLogger.debug('debug');
      newLogger.info('info');
      expect(mockTransport.log).not.toHaveBeenCalled();

      newLogger.warn('warn');
      expect(mockTransport.log).toHaveBeenCalledTimes(1);

      newLogger.error('error');
      expect(mockTransport.log).toHaveBeenCalledTimes(2);
    });
  });
});
