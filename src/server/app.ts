import express from 'express';
import { A2AExpressApp } from '@a2a-js/sdk/server/express';
import {
  DefaultRequestHandler,
  InMemoryTaskStore,
} from '@a2a-js/sdk/server';
import type {
  AgentExecutor,
  ExecutionEventBus,
  RequestContext,
} from '@a2a-js/sdk/server';
import type { TaskStatusUpdateEvent } from '@a2a-js/sdk';
import { buildAgentCard } from './agent-card.js';
import { createAppState } from './state.js';

export function createApp(opts: { port: number; name: string; description: string }) {
  const state = createAppState();
  const agentCard = buildAgentCard(opts);
  const taskStore = new InMemoryTaskStore();

  // Placeholder executor: sets task to input-required immediately.
  // Full UIBridgeExecutor will be extracted to its own file in Plan 02.
  const executor: AgentExecutor = {
    async execute(ctx: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
      const event: TaskStatusUpdateEvent = {
        kind: 'status-update',
        taskId: ctx.taskId,
        contextId: ctx.contextId,
        status: {
          state: 'input-required',
          message: ctx.userMessage,
          timestamp: new Date().toISOString(),
        },
        final: false,
      };
      eventBus.publish(event);

      // Store pending task for later human response
      state.pendingTasks.set(ctx.taskId, { eventBus, ctx });
    },

    async cancelTask(taskId: string, eventBus: ExecutionEventBus): Promise<void> {
      state.pendingTasks.delete(taskId);
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
    },
  };

  const requestHandler = new DefaultRequestHandler(agentCard, taskStore, executor);
  const a2aApp = new A2AExpressApp(requestHandler);

  return a2aApp.setupRoutes(express(), '');
}
