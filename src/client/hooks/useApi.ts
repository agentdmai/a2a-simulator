import type { AgentCardInfo } from '../types/index';

const API_BASE = '';  // Same origin, proxied in dev

export function useApi() {
  async function connect(url: string): Promise<{ ok: boolean; agentCard?: AgentCardInfo; error?: string }> {
    const res = await fetch(`${API_BASE}/api/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return res.json();
  }

  async function disconnect(): Promise<void> {
    await fetch(`${API_BASE}/api/disconnect`, { method: 'POST' });
  }

  async function sendMessage(text: string): Promise<{ ok: boolean; messageId?: string; contextId?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/api/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
  }

  async function getTask(id: string): Promise<unknown> {
    const res = await fetch(`${API_BASE}/api/task/${id}`);
    return res.json();
  }

  return { connect, disconnect, sendMessage, getTask };
}
