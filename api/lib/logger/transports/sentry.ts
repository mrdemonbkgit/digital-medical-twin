import * as Sentry from '@sentry/node';
import { LogTransport, LogEntry, LogLevel } from '../types.js';

export class SentryTransport implements LogTransport {
  name = 'sentry';

  log(entry: LogEntry): void {
    // Set correlation tags
    if (entry.sessionId) Sentry.setTag('session_id', entry.sessionId);
    if (entry.operationId) Sentry.setTag('operation_id', entry.operationId);
    if (entry.userId) Sentry.setUser({ id: entry.userId });

    // Capture errors and warnings
    if (entry.level >= LogLevel.WARN) {
      if (entry.error) {
        const error = new Error(entry.error.message);
        error.name = entry.error.name;
        error.stack = entry.error.stack;
        Sentry.captureException(error, {
          extra: entry.data,
          tags: { context: entry.context },
          level: entry.level === LogLevel.ERROR ? 'error' : 'warning',
        });
      } else {
        Sentry.captureMessage(entry.message, {
          level: entry.level === LogLevel.ERROR ? 'error' : 'warning',
          extra: entry.data,
          tags: { context: entry.context },
        });
      }
    }

    // Always add breadcrumb
    Sentry.addBreadcrumb({
      category: entry.context || 'api',
      message: entry.message,
      level: this.mapLevel(entry.level),
      data: entry.data,
    });
  }

  private mapLevel(level: LogLevel): Sentry.SeverityLevel {
    switch (level) {
      case LogLevel.DEBUG:
        return 'debug';
      case LogLevel.INFO:
        return 'info';
      case LogLevel.WARN:
        return 'warning';
      case LogLevel.ERROR:
        return 'error';
    }
  }
}
