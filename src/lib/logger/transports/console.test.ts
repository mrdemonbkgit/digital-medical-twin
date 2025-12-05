import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsoleTransport } from './console';
import { LogLevel } from '@shared/logger/types';
import type { LogEntry } from '@shared/logger/types';

describe('ConsoleTransport', () => {
  let transport: ConsoleTransport;
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  const createEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
    timestamp: '2024-01-01T00:00:00.000Z',
    level: LogLevel.INFO,
    levelName: 'INFO',
    message: 'Test message',
    environment: 'development',
    source: 'frontend',
    ...overrides,
  });

  beforeEach(() => {
    transport = new ConsoleTransport();
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('name', () => {
    it('has correct name', () => {
      expect(transport.name).toBe('console');
    });
  });

  describe('production environment', () => {
    it('logs JSON string in production', () => {
      const entry = createEntry({ environment: 'production' });

      transport.log(entry);

      expect(consoleSpy.log).toHaveBeenCalledWith(JSON.stringify(entry));
    });
  });

  describe('development environment', () => {
    it('logs colorized output for INFO level', () => {
      transport.log(createEntry({ level: LogLevel.INFO, levelName: 'INFO' }));

      expect(consoleSpy.log).toHaveBeenCalled();
      const call = consoleSpy.log.mock.calls[0][0] as string;
      expect(call).toContain('INFO');
      expect(call).toContain('Test message');
    });

    it('logs colorized output for DEBUG level', () => {
      transport.log(createEntry({ level: LogLevel.DEBUG, levelName: 'DEBUG' }));

      expect(consoleSpy.log).toHaveBeenCalled();
      const call = consoleSpy.log.mock.calls[0][0] as string;
      expect(call).toContain('DEBUG');
    });

    it('uses console.warn for WARN level', () => {
      transport.log(createEntry({ level: LogLevel.WARN, levelName: 'WARN' }));

      expect(consoleSpy.warn).toHaveBeenCalled();
      const call = consoleSpy.warn.mock.calls[0][0] as string;
      expect(call).toContain('WARN');
    });

    it('uses console.error for ERROR level', () => {
      transport.log(createEntry({ level: LogLevel.ERROR, levelName: 'ERROR' }));

      expect(consoleSpy.error).toHaveBeenCalled();
      const call = consoleSpy.error.mock.calls[0][0] as string;
      expect(call).toContain('ERROR');
    });

    it('includes context in prefix', () => {
      transport.log(createEntry({ context: 'TestContext' }));

      expect(consoleSpy.log).toHaveBeenCalled();
      const call = consoleSpy.log.mock.calls[0][0] as string;
      expect(call).toContain('[TestContext]');
    });

    it('excludes prefix when no context', () => {
      transport.log(createEntry({ context: undefined }));

      expect(consoleSpy.log).toHaveBeenCalled();
      const call = consoleSpy.log.mock.calls[0][0] as string;
      // Should not contain context prefix like [ContextName]
      expect(call).not.toMatch(/\[[\w]+\]/);
    });

    it('includes data in log', () => {
      transport.log(createEntry({ data: { key: 'value' } }));

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.any(String),
        { key: 'value' }
      );
    });

    it('logs error stack when present', () => {
      transport.log(
        createEntry({
          level: LogLevel.ERROR,
          levelName: 'ERROR',
          error: {
            name: 'Error',
            message: 'Test error',
            stack: 'Error: Test error\n  at test.ts:1:1',
          },
        })
      );

      // First call is the main log, second is the stack
      expect(consoleSpy.error).toHaveBeenCalledTimes(2);
      expect(consoleSpy.error).toHaveBeenLastCalledWith('Error: Test error\n  at test.ts:1:1');
    });

    it('does not log stack when error has no stack', () => {
      transport.log(
        createEntry({
          level: LogLevel.ERROR,
          levelName: 'ERROR',
          error: {
            name: 'Error',
            message: 'Test error',
          },
        })
      );

      // Only one call for the main log
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('color codes', () => {
    it('uses cyan for DEBUG', () => {
      transport.log(createEntry({ level: LogLevel.DEBUG, levelName: 'DEBUG' }));

      const call = consoleSpy.log.mock.calls[0][0] as string;
      expect(call).toContain('\x1b[36m'); // cyan
    });

    it('uses green for INFO', () => {
      transport.log(createEntry({ level: LogLevel.INFO, levelName: 'INFO' }));

      const call = consoleSpy.log.mock.calls[0][0] as string;
      expect(call).toContain('\x1b[32m'); // green
    });

    it('uses yellow for WARN', () => {
      transport.log(createEntry({ level: LogLevel.WARN, levelName: 'WARN' }));

      const call = consoleSpy.warn.mock.calls[0][0] as string;
      expect(call).toContain('\x1b[33m'); // yellow
    });

    it('uses red for ERROR', () => {
      transport.log(createEntry({ level: LogLevel.ERROR, levelName: 'ERROR' }));

      const call = consoleSpy.error.mock.calls[0][0] as string;
      expect(call).toContain('\x1b[31m'); // red
    });
  });
});
