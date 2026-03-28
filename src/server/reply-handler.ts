import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { TaskStatusUpdateEvent } from '@a2a-js/sdk';
import type { AppState } from './state.js';

export function createReplyRouter(state: AppState): Router {
  const router = Router();

  // List all pending tasks awaiting human response
  router.get('/api/pending', (_req, res) => {
    const pending = Array.from(state.pendingTasks.entries()).map(([taskId, { ctx }]) => ({
      taskId,
      message: ctx.userMessage,
    }));
    res.json(pending);
  });

  // Reply to a pending task
  router.post('/api/reply', (req, res) => {
    const { taskId, text } = req.body as { taskId: string; text: string };

    if (!taskId || !text) {
      res.status(400).json({ error: 'taskId and text are required' });
      return;
    }

    const pending = state.pendingTasks.get(taskId);
    if (!pending) {
      res.status(404).json({ error: 'No pending task with that ID' });
      return;
    }

    const { eventBus, ctx } = pending;

    // Publish completed status with agent's response message
    const event: TaskStatusUpdateEvent = {
      kind: 'status-update',
      taskId,
      contextId: ctx.contextId,
      status: {
        state: 'completed',
        message: {
          kind: 'message',
          messageId: uuidv4(),
          role: 'agent',
          parts: [{ kind: 'text', text }],
        },
        timestamp: new Date().toISOString(),
      },
      final: true,
    };
    eventBus.publish(event);

    // Remove from pending
    state.pendingTasks.delete(taskId);

    res.json({ ok: true, taskId });
  });

  return router;
}
