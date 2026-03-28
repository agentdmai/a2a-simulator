import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { MessageSendParams } from '@a2a-js/sdk';
import type { A2AClientManager } from './a2a-client.js';
import type { SSEBridge } from './sse-bridge.js';

export function createApiRouter(clientManager: A2AClientManager, sseBridge: SSEBridge): Router {
  const router = Router();

  // Connect to remote agent
  router.post('/api/connect', async (req, res) => {
    try {
      const { url } = req.body as { url: string };
      if (!url) { res.status(400).json({ error: 'url is required' }); return; }
      const agentCard = await clientManager.connect(url);
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
      const { text } = req.body as { text: string };
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
          contextId,
        },
      };
      // Capture raw request for JSON-RPC exchange view
      const rawRequest = JSON.parse(JSON.stringify(params));
      // Return task reference immediately so UI can correlate SSE events
      res.json({ ok: true, messageId, contextId });
      // Stream in background, relay via SSE bridge
      const stream = clientManager.sendStreaming(params);
      sseBridge.relayStream(contextId, stream, rawRequest).catch((err) => {
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
