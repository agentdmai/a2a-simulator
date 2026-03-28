import type { Response } from 'express';
import type { StreamEventData } from './a2a-client.js';

interface SSEClient {
  id: string;
  res: Response;
}

export class SSEBridge {
  private clients: SSEClient[] = [];
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Send heartbeat every 30s to detect dead connections
    this.heartbeatInterval = setInterval(() => {
      this.broadcast('heartbeat', { ts: Date.now() });
    }, 30_000);
  }

  addClient(res: Response): string {
    const id = crypto.randomUUID();
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write(`event: connected\ndata: ${JSON.stringify({ id })}\n\n`);
    this.clients.push({ id, res });
    res.on('close', () => {
      this.clients = this.clients.filter(c => c.id !== id);
    });
    return id;
  }

  broadcast(event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      client.res.write(payload);
    }
  }

  async relayStream(contextId: string, stream: AsyncGenerator<StreamEventData>, rawRequest?: unknown): Promise<void> {
    try {
      let isFirst = true;
      for await (const event of stream) {
        if (isFirst) {
          this.broadcast('task-event', { contextId, rawRequest, rawResponse: event, ...event });
          isFirst = false;
        } else {
          this.broadcast('task-event', { contextId, rawResponse: event, ...event });
        }
      }
    } catch (err) {
      this.broadcast('stream-error', { contextId, error: (err as Error).message });
    }
  }

  get clientCount(): number { return this.clients.length; }

  destroy(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.clients = [];
  }
}
