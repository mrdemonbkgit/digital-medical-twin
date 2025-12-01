// Track startup time from the very beginning
const STARTUP_TIME = Date.now();
const STARTUP_LOG_FILE = './logs/startup.log';

// Ensure logs directory exists and clear previous startup log
import { mkdirSync, writeFileSync, appendFileSync as appendFile, readdirSync, statSync, existsSync } from 'fs';
try {
  mkdirSync('./logs', { recursive: true });
  writeFileSync(STARTUP_LOG_FILE, `=== API Server Startup - ${new Date().toISOString()} ===\n`);
} catch {}

const startupLog = (msg: string, data?: Record<string, unknown>) => {
  const elapsed = Date.now() - STARTUP_TIME;
  const timestamp = new Date().toISOString();
  const dataStr = data ? ' ' + JSON.stringify(data) : '';
  const logLine = `[+${elapsed}ms] ${msg}${dataStr}`;

  // Log to console
  console.log(`[DEV] ${logLine}`);

  // Log to file
  try {
    appendFile(STARTUP_LOG_FILE, `${timestamp} ${logLine}\n`);
  } catch {}
};

startupLog('Loading modules...');

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { join, relative } from 'path';
import chokidar from 'chokidar';
import { pathToFileURL } from 'url';

startupLog('Core modules loaded');

// Import logger for error reporting to Sentry and file
let logger: { error: (msg: string, err?: unknown, data?: Record<string, unknown>) => void } | null = null;

// Store logger instance for adding Sentry later
let loggerInstance: InstanceType<typeof import('../api-compiled/lib/logger/Logger.js').Logger> | null = null;

async function initLogger() {
  startupLog('Initializing logger (fast mode)...');
  try {
    // Step 1: Import Logger class
    const { Logger } = await import('../api-compiled/lib/logger/Logger.js');

    // Step 2: Import Console transport
    const { ConsoleTransport } = await import('../api-compiled/lib/logger/transports/console.js');

    // Step 3: Import File transport
    const { FileTransport } = await import('../api-compiled/lib/logger/transports/file.js');

    // Create logger instance with fast transports only
    loggerInstance = new Logger();
    loggerInstance.addTransport(new ConsoleTransport());
    loggerInstance.addTransport(new FileTransport({ maxFiles: 0 }));

    logger = loggerInstance;
    startupLog('Logger initialized (console + file)', { sentry: 'deferred' });
  } catch (err) {
    startupLog('Logger not available: ' + (err instanceof Error ? err.message : String(err)));
  }
}

// Load Sentry in background after server is ready
async function initSentryDeferred() {
  if (!process.env.SENTRY_DSN || !loggerInstance) return;

  startupLog('Loading Sentry in background...');
  const bgStart = Date.now();

  try {
    // Load Sentry SDK (the slow part)
    const { initSentry } = await import('../api-compiled/lib/sentry.js');
    initSentry();

    // Add Sentry transport to existing logger
    const { SentryTransport } = await import('../api-compiled/lib/logger/transports/sentry.js');
    loggerInstance.addTransport(new SentryTransport());

    const loadTime = Date.now() - bgStart;
    startupLog(`Sentry ready (loaded in background)`, { loadTimeMs: loadTime });
  } catch (err) {
    startupLog('Sentry failed to load: ' + (err instanceof Error ? err.message : String(err)));
  }
}

const app = express();
const PORT = parseInt(process.env.DEV_API_PORT || '3001', 10);
const API_DIR = join(process.cwd(), 'api-compiled');

// Match Vercel's body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Route handler cache for hot-reload
const routeHandlers = new Map<string, (req: Request, res: Response) => Promise<unknown>>();

// Discover routes recursively
function discoverRoutes(dir: string, base = ''): string[] {
  if (!existsSync(dir)) {
    console.error(`[DEV] API directory not found: ${dir}`);
    console.error('[DEV] Run "npm run build:api" first to compile API handlers');
    process.exit(1);
  }

  const routes: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const routePath = join(base, entry);
    if (statSync(fullPath).isDirectory()) {
      // Skip lib directories - they contain shared utilities, not routes
      if (entry !== 'lib') {
        routes.push(...discoverRoutes(fullPath, routePath));
      }
    } else if (entry.endsWith('.js')) {
      routes.push(routePath.replace(/\.js$/, '').replace(/\\/g, '/'));
    }
  }
  return routes;
}

// Load handler with cache-busting for hot reload
async function loadHandler(routePath: string): Promise<(req: Request, res: Response) => Promise<unknown>> {
  const filePath = join(API_DIR, `${routePath}.js`);
  // Add timestamp to bust Node's module cache for hot reload
  const fileUrl = pathToFileURL(filePath).href + `?t=${Date.now()}`;
  const module = await import(fileUrl);
  return module.default;
}

// Setup routes
async function setupRoutes() {
  startupLog('Discovering API routes...');
  const routes = discoverRoutes(API_DIR);
  startupLog(`Found ${routes.length} route(s)`);

  let loadedCount = 0;
  let failedCount = 0;

  for (const route of routes) {
    const routeStart = Date.now();
    try {
      const handler = await loadHandler(route);
      routeHandlers.set(route, handler);

      // Register route handler
      app.all(`/api/${route}`, async (req: Request, res: Response) => {
        const currentHandler = routeHandlers.get(route);
        if (currentHandler) {
          try {
            await currentHandler(req, res);
          } catch (err) {
            // Log to console, file, and Sentry
            const errorMsg = `Handler error for /api/${route}`;
            console.error(`[DEV] ${errorMsg}:`, err);
            if (logger) {
              logger.error(errorMsg, err, { route, method: req.method, url: req.url });
            }
            if (!res.headersSent) {
              res.status(500).json({ error: 'Internal server error' });
            }
          }
        }
      });
      const loadTime = Date.now() - routeStart;
      startupLog(`✓ /api/${route}`, { loadTimeMs: loadTime });
      loadedCount++;
    } catch (err) {
      console.error(`[DEV]   ✗ /api/${route} - Failed to load:`, err);
      failedCount++;
    }
  }

  startupLog(`Routes ready`, { loaded: loadedCount, failed: failedCount });
}

// Watch for changes
function setupWatcher() {
  startupLog('Setting up file watcher...');
  const isWSL = process.env.WSL_DISTRO_NAME !== undefined;

  const watcher = chokidar.watch(API_DIR, {
    ignored: [/node_modules/, /\.map$/, /\.d\.ts$/],
    ignoreInitial: true,
    // Use polling on WSL2 for better cross-filesystem support
    usePolling: isWSL,
    interval: 1000,
  });

  watcher.on('change', async (filePath) => {
    // Skip lib changes - they need a full restart
    if (filePath.includes('/lib/') || filePath.includes('\\lib\\')) {
      console.log(`[DEV] 📁 Lib file changed: ${filePath}`);
      console.log('[DEV]    Restart dev server to pick up lib changes');
      return;
    }

    const relPath = relative(API_DIR, filePath);
    const routePath = relPath.replace(/\.js$/, '').replace(/\\/g, '/');

    if (routeHandlers.has(routePath)) {
      console.log(`[DEV] 🔄 Reloading: /api/${routePath}`);
      try {
        routeHandlers.set(routePath, await loadHandler(routePath));
        console.log(`[DEV]    ✓ Reloaded successfully`);
      } catch (err) {
        console.error(`[DEV]    ✗ Failed to reload:`, err);
      }
    }
  });

  watcher.on('add', (filePath) => {
    console.log(`[DEV] 📄 New file detected: ${filePath}`);
    console.log('[DEV]    Restart dev server to register new routes');
  });

  startupLog('File watcher ready', { path: API_DIR, polling: isWSL });
}

// Check environment configuration
function checkEnvConfig() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const googleKey = process.env.GOOGLE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const sentryDsn = process.env.SENTRY_DSN;
  const logLevel = process.env.LOG_LEVEL || 'debug';

  startupLog('Environment check', {
    SUPABASE_URL: !!supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: !!supabaseServiceKey,
    GOOGLE_API_KEY: !!googleKey,
    OPENAI_API_KEY: !!openaiKey,
    SENTRY_DSN: !!sentryDsn,
    LOG_LEVEL: logLevel,
  });

  // Warnings for critical missing config
  if (!supabaseUrl || !supabaseServiceKey) {
    startupLog('⚠️ WARNING: Supabase not fully configured - API calls will fail!');
  }
  if (!googleKey) {
    startupLog('⚠️ WARNING: GOOGLE_API_KEY missing - PDF extraction will fail!');
  }
}

// Start
async function start() {
  startupLog('═══════════════════════════════════════');
  startupLog('Digital Medical Twin - API Server');
  startupLog('═══════════════════════════════════════');
  startupLog('Starting...', {
    apiDir: API_DIR,
    nodeVersion: process.version,
    env: process.env.NODE_ENV || 'development',
  });

  // Check environment variables
  checkEnvConfig();

  // Initialize logger for Sentry and file logging
  await initLogger();

  await setupRoutes();

  setupWatcher();

  // 404 for unmatched API routes (registered AFTER routes are set up)
  app.use('/api/{*path}', (req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    // Log to console, file, and Sentry
    console.error('[DEV] Unhandled error:', err);
    if (logger) {
      logger.error('Unhandled server error', err, { method: req.method, url: req.url });
    }
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  startupLog('Starting HTTP server...');
  app.listen(PORT, () => {
    const totalTime = Date.now() - STARTUP_TIME;
    startupLog(`Listening on port ${PORT}`);
    startupLog('═══════════════════════════════════════');
    startupLog(`🚀 API server ready at http://localhost:${PORT}`);
    startupLog(`Total startup time: ${totalTime}ms`);
    startupLog('═══════════════════════════════════════');

    // Load Sentry in background (non-blocking)
    if (process.env.SENTRY_DSN) {
      setImmediate(() => {
        initSentryDeferred();
      });
    }
  });
}

start().catch((err) => {
  console.error('[DEV] Failed to start server:', err);
  process.exit(1);
});
