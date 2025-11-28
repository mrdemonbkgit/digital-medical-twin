import { LogTransport, LogEntry } from '@shared/logger/types';

export class MockTransport implements LogTransport {
  name = 'mock';
  entries: LogEntry[] = [];

  log(entry: LogEntry): void {
    this.entries.push(entry);
  }

  clear(): void {
    this.entries = [];
  }

  getLastEntry(): LogEntry | undefined {
    return this.entries[this.entries.length - 1];
  }
}
