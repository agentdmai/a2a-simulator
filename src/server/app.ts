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

export function createApp(opts: { port: number; name: string; description: string }) {
  const state = createAppState();
  const agentCard = buildAgentCard(opts);
  const taskStore = new InMemoryTaskStore();
  const executor = new UIBridgeExecutor(state);
  const requestHandler = new DefaultRequestHandler(agentCard, taskStore, executor);
  const a2aApp = new A2AExpressApp(requestHandler);

  const app = a2aApp.setupRoutes(express(), '');

  // JSON body parsing for reply endpoints
  app.use(express.json());

  // Mount reply and pending task routes
  app.use(createReplyRouter(state));

  return app;
}
