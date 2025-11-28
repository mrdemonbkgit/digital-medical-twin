/**
 * Shared logger types used by both frontend and backend.
 * Import from '@shared/logger/types'
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  /** ISO 8601 timestamp */
  timestamp: string;

  /** Numeric log level */
  level: LogLevel;

  /** String representation of log level */
  levelName: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

  /** Log message */
  message: string;

  /** Logger context (e.g., 'Extraction', 'Upload') */
  context?: string;

  /** Session ID for user session tracking */
  sessionId?: string;

  /** Operation ID for specific flow tracing */
  operationId?: string;

  /** Authenticated user ID */
  userId?: string;

  /** Additional structured data */
  data?: Record<string, unknown>;

  /** Error details if logging an error */
  error?: {
    name: string;
    message: string;
    stack?: string;
    /** Error type from errorHandler.ts classification */
    type?: string;
  };

  /** Environment: 'development', 'production', 'test' */
  environment: string;

  /** Source: 'frontend' or 'backend' */
  source: 'frontend' | 'backend';
}

export interface LogTransport {
  /** Transport name for identification */
  name: string;

  /** Process a log entry */
  log(entry: LogEntry): void;
}

export interface LoggerConfig {
  /** Minimum log level to output */
  minLevel: LogLevel;

  /** Default context for this logger instance */
  context?: string;

  /** Session ID to include in all logs */
  sessionId?: string;

  /** Operation ID to include in all logs */
  operationId?: string;

  /** User ID to include in all logs */
  userId?: string;
}
