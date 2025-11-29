import { Logger } from './Logger.js';
import { ConsoleTransport } from './transports/console.js';
import { SentryTransport } from './transports/sentry.js';
import { initSentry } from '../sentry.js';

// Initialize Sentry before adding transport
initSentry();

export const logger = new Logger();
logger.addTransport(new ConsoleTransport());

// Add Sentry transport if DSN is configured
if (process.env.SENTRY_DSN) {
  logger.addTransport(new SentryTransport());
}

export { Logger } from './Logger.js';
export { ConsoleTransport } from './transports/console.js';
export { SentryTransport } from './transports/sentry.js';
