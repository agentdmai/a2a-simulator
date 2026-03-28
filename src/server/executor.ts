import type {
  AgentExecutor,
  ExecutionEventBus,
  RequestContext,
} from '@a2a-js/sdk/server';
import type { Task, TaskStatusUpdateEvent } from '@a2a-js/sdk';
import type { AppState } from './state.js';
import type { SSEBridge } from './sse-bridge.js';

export class UIBridgeExecutor implements AgentExecutor {
  constructor(private state: AppState, private sseBridge: SSEBridge) {}

  async execute(ctx: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    const taskId = ctx.taskId;

    // Detect follow-up: ctx.task exists when SDK loaded an existing task from store
    const isFollowUp = ctx.task != null;

    // For follow-ups, preserve the original task's contextId so SSE events
    // stay grouped under the same task in the browser UI
    const contextId = isFollowUp ? ctx.task!.contextId : ctx.contextId;

    // Publish task object first so the SDK's ResultManager registers it
    const task: Task = {
      id: taskId,
      contextId,
      kind: 'task',
      status: {
        state: 'input-required',
        message: ctx.userMessage,
        timestamp: new Date().toISOString(),
      },
      history: isFollowUp ? [...(ctx.task!.history || []), ctx.userMessage] : [ctx.userMessage],
    };
    eventBus.publish(task);

    // Then publish status-update event for input-required state
    const event: TaskStatusUpdateEvent = {
      kind: 'status-update',
      taskId,
      contextId,
      status: {
        state: 'input-required',
        message: ctx.userMessage,
        timestamp: new Date().toISOString(),
      },
      final: false, // Not terminal -- waiting for human input
    };
    eventBus.publish(event);

    // Update event bus reference (same taskId on follow-up)
    this.state.pendingTasks.set(taskId, { eventBus, ctx });
    console.log(`Task ${taskId} ${isFollowUp ? '(follow-up)' : '(new)'} awaiting human response`);

    // Broadcast incoming task/message to browser SSE clients
    // Use contextId as the grouping key so B's UI appends to the existing thread
    this.sseBridge.broadcast('incoming-task', {
      taskId,
      contextId,
      message: ctx.userMessage,
      status: 'input-required',
      timestamp: new Date().toISOString(),
      isFollowUp,
    });
  }

  async cancelTask(taskId: string, eventBus: ExecutionEventBus): Promise<void> {
    const pending = this.state.pendingTasks.get(taskId);
    const contextId = pending?.ctx.contextId || '';
    this.state.pendingTasks.delete(taskId);
    const event: TaskStatusUpdateEvent = {
      kind: 'status-update',
      taskId,
      contextId,
      status: {
        state: 'canceled',
        timestamp: new Date().toISOString(),
      },
      final: true,
    };
    eventBus.publish(event);

    // Broadcast cancellation to browser SSE clients
    this.sseBridge.broadcast('task-canceled', { taskId, contextId });
  }
}
