# Logging System

> Last Updated: 2025-11-28

## Summary

Structured logging system with log levels, correlation IDs for request tracing, and Sentry integration for production error tracking.

## Keywords

`logging` `logger` `debug` `error` `sentry` `correlation` `tracing` `monitoring`

## Table of Contents

- [Architecture](#architecture)
- [Log Levels](#log-levels)
- [Logger API](#logger-api)
- [Correlation IDs](#correlation-ids)
- [Environment Configuration](#environment-configuration)
- [Migration Guide](#migration-guide)

---

## Architecture

```
Frontend                              Backend (API)
────────                              ─────────────
CorrelationContext                    withLogger HOF
       │                                    │
       ▼                                    ▼
Logger.child('Upload')                Logger.child('Extraction')
       │                                    │
       ├── ConsoleTransport                 ├── ConsoleTransport
       └── SentryTransport                  └── SentryTransport

              ─────── X-Session-ID ───────►
              ─────── X-Operation-ID ─────►
```

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Logger (Frontend) | `src/lib/logger/Logger.ts` | Core logging class |
| Logger (Backend) | `api/lib/logger/Logger.ts` | Core logging class for API |
| ConsoleTransport | `*/lib/logger/transports/console.ts` | Console output (colorized dev, JSON prod) |
| SentryTransport | `*/lib/logger/transports/sentry.ts` | Error tracking to Sentry |
| CorrelationContext | `src/context/CorrelationContext.tsx` | Request tracing IDs |
| useApiClient | `src/lib/api.ts` | API client with correlation headers |
| withLogger | `api/lib/logger/withLogger.ts` | API handler wrapper |

### Types

**Frontend**: Types are in `shared/logger/types.ts`, imported via path alias:
```typescript
import { LogLevel, LogEntry, LogTransport } from '@shared/logger/types';
```

**Backend (API)**: Types are duplicated in `api/lib/logger/types.ts` due to Vercel serverless module resolution constraints (cannot import from outside `api/` directory):
```typescript
import { LogLevel, LogEntry, LogTransport } from './types.js';
```

> **Note**: API imports use `.js` extensions for ESM compatibility.

---

## Log Levels

| Level | Value | When to Use | Production |
|-------|-------|-------------|------------|
| DEBUG | 0 | Detailed debugging info, variable values | Filtered out |
| INFO | 1 | Normal operations, state changes | Shown |
| WARN | 2 | Recoverable issues, deprecations | Shown + Sentry |
| ERROR | 3 | Failures requiring attention | Shown + Sentry |

### Environment Defaults

| Environment | Default Level |
|-------------|---------------|
| Development | DEBUG |
| Production | INFO |
| Test | WARN |

---

## Logger API

### Basic Usage

```typescript
import { logger } from '@/lib/logger';

// Create scoped logger for your component/module
const log = logger.child('MyComponent');

// Log at different levels
log.debug('Detailed debugging info', { someData: value });
log.info('Operation completed', { result: 'success' });
log.warn('Deprecated method called', { method: 'oldMethod' });
log.error('Operation failed', error, { context: 'additional info' });
```

### In React Components

```typescript
import { logger } from '@/lib/logger';

function MyComponent() {
  const log = logger.child('MyComponent');

  const handleClick = () => {
    log.info('Button clicked');
    // ... logic
  };

  return <button onClick={handleClick}>Click</button>;
}
```

### In Custom Hooks

```typescript
import { logger } from '@/lib/logger';

const log = logger.child('useMyHook');

export function useMyHook() {
  const doSomething = useCallback(async () => {
    log.info('Starting operation');
    try {
      // ... async operation
      log.info('Operation complete');
    } catch (err) {
      log.error('Operation failed', err);
      throw err;
    }
  }, []);

  return { doSomething };
}
```

### In API Handlers

```typescript
import { withLogger } from '../lib/logger/withLogger';

async function handler(req: VercelRequest, res: VercelResponse) {
  // Logger is attached to request by withLogger
  const log = (req as any).log.child('MyEndpoint');

  log.info('Request received', { method: req.method });

  try {
    // ... handle request
    log.info('Request complete', { status: 200 });
  } catch (err) {
    log.error('Request failed', err);
    res.status(500).json({ error: 'Internal error' });
  }
}

export default withLogger(handler);
```

---

## Correlation IDs

Two-level correlation for request tracing:

| ID Type | Scope | Example | Purpose |
|---------|-------|---------|---------|
| Session ID | Per app mount | `sess-a1b2c3d4` | Identify user session |
| Operation ID | Per user action | `pdf-extract-x1y2z3` | Trace specific flow |

### Using Correlation IDs

```typescript
import { useCorrelation } from '@/context/CorrelationContext';
import { useApiClient } from '@/lib/api';

function MyComponent() {
  const { startOperation, endOperation } = useCorrelation();
  const api = useApiClient();

  const handleExtract = async () => {
    // Start operation - all logs tagged with this ID
    startOperation('pdf-extract');

    try {
      // API calls automatically include correlation headers
      await api.fetch('/api/ai/extract-lab-results', {
        method: 'POST',
        body: JSON.stringify({ storagePath }),
      });
    } finally {
      // Always end operation
      endOperation();
    }
  };
}
```

### Headers

The API client automatically adds:
- `X-Session-ID`: Always present
- `X-Operation-ID`: Present when inside `startOperation()`/`endOperation()`

Backend echoes these in response headers for debugging.

---

## Environment Configuration

### Environment Variables

| Variable | Environment | Description |
|----------|-------------|-------------|
| `VITE_LOG_LEVEL` | Frontend | Log level: `debug`, `info`, `warn`, `error` |
| `LOG_LEVEL` | Backend | Log level for API routes |
| `VITE_SENTRY_DSN` | Frontend | Sentry project DSN |
| `SENTRY_DSN` | Backend | Sentry project DSN |
| `SENTRY_AUTH_TOKEN` | Build | For source map uploads |

### .env.example

```env
# Logging
VITE_LOG_LEVEL=debug
LOG_LEVEL=info

# Sentry (optional)
VITE_SENTRY_DSN=
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

---

## Migration Guide

### Before (console.log)

```typescript
console.log('[Extraction] Starting PDF extraction');
console.log('[Extraction] Biomarkers found:', biomarkers.length);
console.error('[Extraction] Failed:', error);
```

### After (structured logger)

```typescript
import { logger } from '@/lib/logger';

const log = logger.child('Extraction');

log.info('Starting PDF extraction');
log.info('Biomarkers found', { count: biomarkers.length });
log.error('Extraction failed', error);
```

### Benefits

1. **Structured data**: `{ count: 5 }` instead of string interpolation
2. **Log levels**: Filter DEBUG in production
3. **Context**: All logs tagged with `[Extraction]`
4. **Correlation**: Trace requests across frontend/backend
5. **Sentry integration**: Errors automatically captured
6. **Consistent format**: JSON in production for log aggregation

---

## Related Documents

- /docs/development/CODING_STANDARDS.md — General coding conventions
- /docs/architecture/AI_INTEGRATION.md — AI API error handling
- /docs/features/DATA_TRACKING.md — PDF extraction logging
