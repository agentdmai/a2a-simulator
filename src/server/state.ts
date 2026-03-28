import type { ExecutionEventBus, RequestContext } from '@a2a-js/sdk/server';
import type { AgentCard } from '@a2a-js/sdk';

export interface PendingTask {
  eventBus: ExecutionEventBus;
  ctx: RequestContext;
}

export interface AppState {
  pendingTasks: Map<string, PendingTask>;
  agentCard: AgentCard;
  authToken: string | null;
}

export function createAppState(agentCard: AgentCard): AppState {
  return { pendingTasks: new Map(), agentCard, authToken: null };
}
