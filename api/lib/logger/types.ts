/**
 * Backend logger types (duplicated from shared/logger/types.ts for Vercel compatibility)
 * Vercel serverless functions can't resolve cross-directory imports outside api/
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  context?: string;
  sessionId?: string;
  operationId?: string;
  userId?: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    type?: string;
  };
  environment: string;
  source: 'frontend' | 'backend';
}

export interface LogTransport {
  name: string;
  log(entry: LogEntry): void;
}

export interface LoggerConfig {
  minLevel: LogLevel;
  context?: string;
  sessionId?: string;
  operationId?: string;
  userId?: string;
}
