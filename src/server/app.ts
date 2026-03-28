import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import express from 'express';
import { A2AExpressApp } from '@a2a-js/sdk/server/express';
import {
  DefaultRequestHandler,
  InMemoryTaskStore,
} from '@a2a-js/sdk/server';
import { buildAgentCard } from './agent-card.js';
import { createAppState } from './state.js';
import { UIBridgeExecutor } from './executor.js';
import { createReplyRouter } from './reply-handler.js';
import { A2AClientManager } from './a2a-client.js';
import { SSEBridge } from './sse-bridge.js';
import { createApiRouter } from './api-routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(opts: { port: number; name: string; description: string }) {
  const state = createAppState();
  const agentCard = buildAgentCard(opts);
  const taskStore = new InMemoryTaskStore();
  const executor = new UIBridgeExecutor(state);
  const requestHandler = new DefaultRequestHandler(agentCard, taskStore, executor);
  const a2aApp = new A2AExpressApp(requestHandler);

  const app = express();

  // 1. JSON body parsing for all routes
  app.use(express.json());

  // 2. A2A SDK routes (JSON-RPC at POST /, agent card at /.well-known/agent-card.json)
  a2aApp.setupRoutes(app, '');

  // 3. Reply router (existing /api/pending, /api/reply)
  app.use(createReplyRouter(state));

  // 4. API router (new /api/connect, /api/send, /api/events, /api/task/:id, /api/disconnect)
  const clientManager = new A2AClientManager();
  const sseBridge = new SSEBridge();
  app.use(createApiRouter(clientManager, sseBridge));

  // 5. Static file serving + SPA fallback (production only)
  const clientDistPath = path.join(__dirname, '../../dist/client');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  return app;
}
