import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';
import chokidar from 'chokidar';
import { pathToFileURL } from 'url';

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
  const routes = discoverRoutes(API_DIR);
  console.log(`[DEV] Found ${routes.length} API routes`);

  for (const route of routes) {
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
            console.error(`[DEV] Handler error for /api/${route}:`, err);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Internal server error' });
            }
          }
        }
      });
      console.log(`[DEV] Registered: /api/${route}`);
    } catch (err) {
      console.error(`[DEV] Failed to load handler for /api/${route}:`, err);
    }
  }
}

// Watch for changes
function setupWatcher() {
  const watcher = chokidar.watch(API_DIR, {
    ignored: [/node_modules/, /\.map$/, /\.d\.ts$/],
    ignoreInitial: true,
    // Use polling on WSL2 for better cross-filesystem support
    usePolling: process.env.WSL_DISTRO_NAME !== undefined,
    interval: 1000,
  });

  watcher.on('change', async (filePath) => {
    // Skip lib changes - they need a full restart
    if (filePath.includes('/lib/') || filePath.includes('\\lib\\')) {
      console.log(`[DEV] Lib file changed: ${filePath}`);
      console.log('[DEV] Restart dev server to pick up lib changes');
      return;
    }

    const relPath = relative(API_DIR, filePath);
    const routePath = relPath.replace(/\.js$/, '').replace(/\\/g, '/');

    if (routeHandlers.has(routePath)) {
      console.log(`[DEV] Reloading: /api/${routePath}`);
      try {
        routeHandlers.set(routePath, await loadHandler(routePath));
        console.log(`[DEV] Reloaded: /api/${routePath}`);
      } catch (err) {
        console.error(`[DEV] Failed to reload /api/${routePath}:`, err);
      }
    }
  });

  watcher.on('add', (filePath) => {
    console.log(`[DEV] New file detected: ${filePath}`);
    console.log('[DEV] Restart dev server to register new routes');
  });

  console.log('[DEV] Watching for API changes...');
}

// Start
async function start() {
  console.log('[DEV] Starting API dev server...');
  console.log(`[DEV] API directory: ${API_DIR}`);

  await setupRoutes();
  setupWatcher();

  // 404 for unmatched API routes (registered AFTER routes are set up)
  app.use('/api/{*path}', (req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[DEV] Unhandled error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.listen(PORT, () => {
    console.log(`[DEV] API server running at http://localhost:${PORT}`);
    console.log('[DEV] Ready for requests!');
  });
}

start().catch((err) => {
  console.error('[DEV] Failed to start server:', err);
  process.exit(1);
});
