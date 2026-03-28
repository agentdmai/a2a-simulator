import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { TaskStatusUpdateEvent, TaskArtifactUpdateEvent } from '@a2a-js/sdk';
import type { AppState } from './state.js';
import type { SSEBridge } from './sse-bridge.js';

interface ReplyArtifact {
  name: string;
  mimeType: string;
  content: string;
}

interface ReplyBody {
  taskId: string;
  text: string;
  state: 'working' | 'input-required' | 'completed' | 'failed';
  artifacts?: ReplyArtifact[];
}

export function createReplyRouter(state: AppState, sseBridge: SSEBridge): Router {
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
    const { taskId, text, state: selectedState, artifacts } = req.body as ReplyBody;

    if (!taskId || !text) {
      res.status(400).json({ error: 'taskId and text are required' });
      return;
    }

    if (!selectedState) {
      res.status(400).json({ error: 'state is required' });
      return;
    }

    const pending = state.pendingTasks.get(taskId);
    if (!pending) {
      res.status(404).json({ error: 'No pending task with that ID' });
      return;
    }

    const { eventBus, ctx } = pending;

    // Publish artifact events BEFORE status update
    if (artifacts && artifacts.length > 0) {
      for (const artifact of artifacts) {
        const artifactEvent: TaskArtifactUpdateEvent = {
          kind: 'artifact-update',
          taskId,
          contextId: ctx.contextId,
          artifact: {
            artifactId: uuidv4(),
            name: artifact.name,
            parts: [{ kind: 'text', text: artifact.content }],
          },
          lastChunk: true,
        };
        eventBus.publish(artifactEvent);
      }
    }

    // Determine if this is a terminal state
    const isTerminal = selectedState === 'completed' || selectedState === 'failed';

    // Publish status update with agent's response message
    const event: TaskStatusUpdateEvent = {
      kind: 'status-update',
      taskId,
      contextId: ctx.contextId,
      status: {
        state: selectedState,
        message: {
          kind: 'message',
          messageId: uuidv4(),
          role: 'agent',
          parts: [{ kind: 'text', text }],
        },
        timestamp: new Date().toISOString(),
      },
      final: isTerminal,
    };
    eventBus.publish(event);

    // Only remove from pending for terminal states
    if (isTerminal) {
      state.pendingTasks.delete(taskId);
    }

    // Broadcast reply confirmation to browser SSE clients (include text so B's UI shows its own replies)
    sseBridge.broadcast('reply-sent', { taskId, contextId: ctx.contextId, state: selectedState, text });

    res.json({ ok: true, taskId });
  });

  return router;
}
