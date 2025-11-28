import { LogLevel, LogEntry, LogTransport, LoggerConfig } from './types.js';

export class Logger {
  private transports: LogTransport[] = [];
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      minLevel: this.parseLogLevel(process.env.LOG_LEVEL) ?? LogLevel.DEBUG,
      ...config,
    };
  }

  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  child(context: string): Logger {
    const child = new Logger({ ...this.config, context });
    child.transports = this.transports;
    return child;
  }

  setSessionId(id: string): void {
    this.config.sessionId = id;
  }

  setOperationId(id: string): void {
    this.config.operationId = id;
  }

  setUserId(id: string): void {
    this.config.userId = id;
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, undefined, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, undefined, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, undefined, data);
  }

  error(message: string, error?: unknown, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, error, data);
  }

  private log(
    level: LogLevel,
    message: string,
    error?: unknown,
    data?: Record<string, unknown>
  ): void {
    if (level < this.config.minLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      levelName: LogLevel[level] as LogEntry['levelName'],
      message,
      context: this.config.context,
      sessionId: this.config.sessionId,
      operationId: this.config.operationId,
      userId: this.config.userId,
      data,
      error: error ? this.formatError(error) : undefined,
      environment: process.env.NODE_ENV || 'development',
      source: 'backend',
    };

    this.transports.forEach((t) => t.log(entry));
  }

  private formatError(error: unknown): LogEntry['error'] {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    return { name: 'Error', message: String(error) };
  }

  private parseLogLevel(level?: string): LogLevel | undefined {
    if (!level) return undefined;
    const map: Record<string, LogLevel> = {
      debug: LogLevel.DEBUG,
      info: LogLevel.INFO,
      warn: LogLevel.WARN,
      error: LogLevel.ERROR,
    };
    return map[level.toLowerCase()];
  }
}
