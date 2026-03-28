import type {
  AgentExecutor,
  ExecutionEventBus,
  RequestContext,
} from '@a2a-js/sdk/server';
import type { Task, TaskStatusUpdateEvent } from '@a2a-js/sdk';
import type { AppState } from './state.js';

export class UIBridgeExecutor implements AgentExecutor {
  constructor(private state: AppState) {}

  async execute(ctx: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    const taskId = ctx.taskId;
    const contextId = ctx.contextId;

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
      history: [ctx.userMessage],
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

    // Store event bus reference for later reply
    this.state.pendingTasks.set(taskId, { eventBus, ctx });
    console.log(`Task ${taskId} awaiting human response`);
  }

  async cancelTask(taskId: string, eventBus: ExecutionEventBus): Promise<void> {
    this.state.pendingTasks.delete(taskId);
    const event: TaskStatusUpdateEvent = {
      kind: 'status-update',
      taskId,
      contextId: '',
      status: {
        state: 'canceled',
        timestamp: new Date().toISOString(),
      },
      final: true,
    };
    eventBus.publish(event);
  }
}
