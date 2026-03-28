import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { A2AExpressApp } from '@a2a-js/sdk/server/express';
import {
  DefaultRequestHandler,
  InMemoryTaskStore,
} from '@a2a-js/sdk/server';
import { buildAgentCard } from './agent-card.js';
import { createAppState } from './state.js';
import type { AppState } from './state.js';
import { UIBridgeExecutor } from './executor.js';
import { createReplyRouter } from './reply-handler.js';
import { A2AClientManager } from './a2a-client.js';
import { SSEBridge } from './sse-bridge.js';
import { createApiRouter } from './api-routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createAuthMiddleware(state: AppState) {
  return (req: Request, res: Response, next: NextFunction) => {
    // No auth configured — pass through
    if (!state.authToken) return next();
    // Never block internal API routes
    if (req.path.startsWith('/api/')) return next();
    // Skip static files and SPA fallback (GET that isn't well-known)
    if (req.method === 'GET' && !req.path.startsWith('/.well-known')) return next();
    const auth = req.headers.authorization;
    if (!auth || auth !== `Bearer ${state.authToken}`) {
      res.status(401).json({ error: 'Authentication rejected: invalid or missing bearer token.' });
      return;
    }
    next();
  };
}

export function createApp(opts: { port: number; name: string; description: string }) {
  const agentCard = buildAgentCard(opts);
  const state = createAppState(agentCard);
  const taskStore = new InMemoryTaskStore();
  const sseBridge = new SSEBridge();
  const executor = new UIBridgeExecutor(state, sseBridge);
  const requestHandler = new DefaultRequestHandler(agentCard, taskStore, executor);
  const a2aApp = new A2AExpressApp(requestHandler);

  const app = express();

  // 1. JSON body parsing for all routes
  app.use(express.json());

  // 2. Auth middleware — protects A2A protocol routes but not /api/* or static files
  app.use(createAuthMiddleware(state));

  // 3. A2A SDK routes (JSON-RPC at POST /, agent card at /.well-known/agent-card.json)
  a2aApp.setupRoutes(app, '');

  // 4. Reply router (existing /api/pending, /api/reply)
  app.use(createReplyRouter(state, sseBridge));

  // 5. API router (new /api/connect, /api/send, /api/events, /api/task/:id, /api/disconnect)
  const clientManager = new A2AClientManager();
  app.use(createApiRouter(clientManager, sseBridge, state));

  // 6. Static file serving + SPA fallback (production only)
  const clientDistPath = path.join(__dirname, '../../dist/client');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('{*path}', (_req, res) => {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  return app;
}
