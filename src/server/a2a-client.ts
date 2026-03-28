import { ClientFactory } from '@a2a-js/sdk/client';
import type { Client } from '@a2a-js/sdk/client';
import type { AgentCard, Message, Task, TaskStatusUpdateEvent, TaskArtifactUpdateEvent, MessageSendParams, TaskQueryParams } from '@a2a-js/sdk';

/** Union of all event types yielded by sendMessageStream */
export type StreamEventData = Message | Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent;

export class A2AClientManager {
  private client: Client | null = null;
  private card: AgentCard | null = null;

  async connect(baseUrl: string): Promise<AgentCard> {
    const factory = new ClientFactory();
    this.client = await factory.createFromUrl(baseUrl);
    this.card = await this.client.getAgentCard();
    return this.card;
  }

  get agentCard(): AgentCard | null { return this.card; }
  get isConnected(): boolean { return this.client !== null; }

  async *sendStreaming(params: MessageSendParams, signal?: AbortSignal): AsyncGenerator<StreamEventData> {
    if (!this.client) throw new Error('Not connected to any agent');
    yield* this.client.sendMessageStream(params, { signal });
  }

  async getTask(params: TaskQueryParams): Promise<Task> {
    if (!this.client) throw new Error('Not connected to any agent');
    return this.client.getTask(params);
  }

  disconnect(): void {
    this.client = null;
    this.card = null;
  }
}
