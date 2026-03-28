import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { MessageSendParams } from '@a2a-js/sdk';
import type { A2AClientManager } from './a2a-client.js';
import type { SSEBridge } from './sse-bridge.js';
import type { AppState } from './state.js';

export function createApiRouter(clientManager: A2AClientManager, sseBridge: SSEBridge, state: AppState): Router {
  const router = Router();

  // Get current agent card
  router.get('/api/agent-card', (_req, res) => {
    res.json(state.agentCard);
  });

  // Update agent card in-place
  router.put('/api/agent-card', (req, res) => {
    const { name, description, skills } = req.body as {
      name?: string;
      description?: string;
      skills?: Array<{ id?: string; name: string; description: string; tags?: string[] }>;
    };
    if (name !== undefined) state.agentCard.name = name;
    if (description !== undefined) state.agentCard.description = description;
    if (skills !== undefined) {
      state.agentCard.skills = skills.map((s) => ({
        id: s.id || s.name.toLowerCase().replace(/\s+/g, '-'),
        name: s.name,
        description: s.description,
        tags: s.tags || [],
        inputModes: ['text/plain'] as string[],
        outputModes: ['text/plain'] as string[],
      }));
    }
    res.json({ ok: true, agentCard: state.agentCard });
  });

  // Update auth configuration
  router.put('/api/auth-config', (req, res) => {
    const { enabled, token } = req.body as { enabled: boolean; token?: string };
    if (enabled && token) {
      state.authToken = token;
      (state.agentCard as any).securitySchemes = { bearerAuth: { type: 'http', scheme: 'bearer' } };
      (state.agentCard as any).security = [{ bearerAuth: [] }];
    } else {
      state.authToken = null;
      delete (state.agentCard as any).securitySchemes;
      delete (state.agentCard as any).security;
    }
    res.json({ ok: true });
  });

  // Connect to remote agent
  router.post('/api/connect', async (req, res) => {
    try {
      const { url, authToken } = req.body as { url: string; authToken?: string };
      if (!url) { res.status(400).json({ error: 'url is required' }); return; }
      const agentCard = await clientManager.connect(url, authToken);
      sseBridge.broadcast('connection-status', { status: 'connected', agentCard });
      res.json({ ok: true, agentCard });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // Disconnect from remote agent
  router.post('/api/disconnect', (_req, res) => {
    clientManager.disconnect();
    sseBridge.broadcast('connection-status', { status: 'disconnected' });
    res.json({ ok: true });
  });

  // Send message (streaming) to connected agent
  router.post('/api/send', async (req, res) => {
    try {
      const { text, taskId: existingTaskId, groupContextId } = req.body as { text: string; taskId?: string; groupContextId?: string };
      if (!text) { res.status(400).json({ error: 'text is required' }); return; }
      if (!clientManager.isConnected) { res.status(400).json({ error: 'Not connected to any agent' }); return; }

      const messageId = uuidv4();
      const contextId = uuidv4();
      const params: MessageSendParams = {
        message: {
          kind: 'message',
          messageId,
          role: 'user',
          parts: [{ kind: 'text', text }],
          // For follow-ups, only send taskId — omit contextId so the remote SDK
          // uses the existing task's contextId instead of creating a new task
          ...(existingTaskId
            ? { taskId: existingTaskId }
            : { contextId }),
        },
      };
      // Use the original contextId for SSE grouping when replying to a task
      const sseContextId = groupContextId || contextId;
      // Capture raw request for JSON-RPC exchange view
      const rawRequest = JSON.parse(JSON.stringify(params));
      // Return task reference immediately so UI can correlate SSE events
      res.json({ ok: true, messageId, contextId: sseContextId });
      // Stream in background, relay via SSE bridge
      const stream = clientManager.sendStreaming(params);
      sseBridge.relayStream(sseContextId, stream, rawRequest).catch((err) => {
        console.error('Stream relay error:', err);
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Get task by ID
  router.get('/api/task/:id', async (req, res) => {
    try {
      if (!clientManager.isConnected) { res.status(400).json({ error: 'Not connected' }); return; }
      const task = await clientManager.getTask({ id: req.params.id });
      res.json(task);
    } catch (err) {
      res.status(404).json({ error: (err as Error).message });
    }
  });

  // Cancel outgoing task
  router.post('/api/task/:id/cancel', async (req, res) => {
    try {
      if (!clientManager.isConnected) { res.status(400).json({ error: 'Not connected' }); return; }
      const task = await clientManager.cancelTask({ id: req.params.id });
      res.json(task);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // Resubscribe to task stream
  router.post('/api/task/:id/resubscribe', async (req, res) => {
    try {
      if (!clientManager.isConnected) { res.status(400).json({ error: 'Not connected' }); return; }
      res.json({ ok: true });
      const stream = clientManager.resubscribeTask({ id: req.params.id });
      sseBridge.relayStream(req.params.id, stream).catch(console.error);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // SSE endpoint for browser clients
  router.get('/api/events', (req, res) => {
    sseBridge.addClient(res);
  });

  return router;
}
