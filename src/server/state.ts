import type { ExecutionEventBus, RequestContext } from '@a2a-js/sdk/server';

export interface PendingTask {
  eventBus: ExecutionEventBus;
  ctx: RequestContext;
}

export interface AppState {
  pendingTasks: Map<string, PendingTask>;
}

export function createAppState(): AppState {
  return { pendingTasks: new Map() };
}
