import { appendFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, statSync, renameSync } from 'fs';
import { join } from 'path';
import { LogTransport, LogEntry } from '../types.js';

export interface FileTransportOptions {
  logDir?: string;
  maxFileSize?: number; // bytes, default 10MB
  filename?: string;
  maxFiles?: number; // max number of rotated files to keep, default 30 (unlimited if 0)
}

export class FileTransport implements LogTransport {
  name = 'file';
  private logDir: string;
  private filename: string;
  private maxFileSize: number;
  private maxFiles: number;

  constructor(options: FileTransportOptions = {}) {
    this.logDir = options.logDir || join(process.cwd(), 'logs');
    this.filename = options.filename || 'api.log';
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles ?? 30; // Keep 30 rotated files by default (0 = unlimited)

    // Ensure log directory exists
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(entry: LogEntry): void {
    try {
      const logPath = this.getLogPath();
      const line = this.formatEntry(entry);

      // Rotate if needed
      this.rotateIfNeeded(logPath);

      // Append to file
      appendFileSync(logPath, line + '\n', 'utf8');
    } catch (err) {
      // Don't throw - just print to console as fallback
      console.error('[FileTransport] Failed to write log:', err);
    }
  }

  private getLogPath(): string {
    return join(this.logDir, this.filename);
  }

  private getDateSuffix(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private formatEntry(entry: LogEntry): string {
    const levelColors: Record<string, string> = {
      DEBUG: 'DEBUG',
      INFO: 'INFO ',
      WARN: 'WARN ',
      ERROR: 'ERROR',
    };

    const parts = [
      entry.timestamp,
      levelColors[entry.levelName] || entry.levelName,
      entry.context ? `[${entry.context}]` : '',
      entry.message,
    ].filter(Boolean);

    let line = parts.join(' ');

    // Add data if present
    if (entry.data && Object.keys(entry.data).length > 0) {
      line += ' ' + JSON.stringify(entry.data);
    }

    // Add error details for errors
    if (entry.error) {
      line += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        line += `\n  Stack: ${entry.error.stack.split('\n').slice(1, 5).join('\n        ')}`;
      }
    }

    return line;
  }

  private rotateIfNeeded(logPath: string): void {
    try {
      if (!existsSync(logPath)) return;

      const stats = statSync(logPath);
      if (stats.size >= this.maxFileSize) {
        // Rotate current log file (preserved with timestamp)
        const rotatedPath = logPath.replace('.log', `-${this.getDateSuffix()}-${Date.now()}.log`);
        renameSync(logPath, rotatedPath);
        console.log(`[FileTransport] Rotated log file to ${rotatedPath}`);

        // Cleanup old files if maxFiles is set
        this.cleanupOldFiles();
      }
    } catch (err) {
      // Ignore rotation errors
    }
  }

  private cleanupOldFiles(): void {
    if (this.maxFiles === 0) return; // 0 means unlimited

    try {
      const baseName = this.filename.replace('.log', '');
      const files = readdirSync(this.logDir)
        .filter(f => f.startsWith(baseName) && f.endsWith('.log') && f !== this.filename)
        .map(f => ({
          name: f,
          path: join(this.logDir, f),
          mtime: statSync(join(this.logDir, f)).mtime.getTime(),
        }))
        .sort((a, b) => b.mtime - a.mtime); // Newest first

      // Delete files beyond maxFiles limit
      if (files.length > this.maxFiles) {
        const toDelete = files.slice(this.maxFiles);
        for (const file of toDelete) {
          unlinkSync(file.path);
          console.log(`[FileTransport] Deleted old log file: ${file.name}`);
        }
      }
    } catch (err) {
      // Ignore cleanup errors
    }
  }
}
