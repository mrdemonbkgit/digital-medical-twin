import { Logger } from './Logger';
import { ConsoleTransport } from './transports/console';
import { SentryTransport } from './transports/sentry';

export const logger = new Logger();
logger.addTransport(new ConsoleTransport());

// Add Sentry transport if DSN is configured
if (import.meta.env.VITE_SENTRY_DSN) {
  logger.addTransport(new SentryTransport());
}

export { Logger } from './Logger';
export { ConsoleTransport } from './transports/console';
export { SentryTransport } from './transports/sentry';
