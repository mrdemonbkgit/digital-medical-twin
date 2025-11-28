import { LogTransport, LogEntry, LogLevel } from '@shared/logger/types';

export class ConsoleTransport implements LogTransport {
  name = 'console';

  log(entry: LogEntry): void {
    const isDev = entry.environment === 'development';

    if (isDev) {
      this.logColorized(entry);
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  private logColorized(entry: LogEntry): void {
    const colors = {
      DEBUG: '\x1b[36m', // cyan
      INFO: '\x1b[32m', // green
      WARN: '\x1b[33m', // yellow
      ERROR: '\x1b[31m', // red
    };
    const reset = '\x1b[0m';
    const color = colors[entry.levelName];
    const prefix = entry.context ? `[${entry.context}]` : '';

    const method =
      entry.level === LogLevel.ERROR
        ? console.error
        : entry.level === LogLevel.WARN
          ? console.warn
          : console.log;

    method(`${color}${entry.levelName}${reset} ${prefix} ${entry.message}`, entry.data ?? '');

    if (entry.error?.stack) {
      console.error(entry.error.stack);
    }
  }
}
