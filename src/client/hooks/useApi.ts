import type { AgentCardInfo } from '../types/index';

const API_BASE = '';  // Same origin, proxied in dev

export function useApi() {
  async function connect(url: string, authToken?: string): Promise<{ ok: boolean; agentCard?: AgentCardInfo; error?: string }> {
    const res = await fetch(`${API_BASE}/api/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, authToken: authToken || undefined }),
    });
    return res.json();
  }

  async function disconnect(): Promise<void> {
    await fetch(`${API_BASE}/api/disconnect`, { method: 'POST' });
  }

  async function sendMessage(text: string, taskId?: string, groupContextId?: string): Promise<{ ok: boolean; messageId?: string; contextId?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/api/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, taskId: taskId || undefined, groupContextId: groupContextId || undefined }),
    });
    return res.json();
  }

  async function getTask(id: string): Promise<unknown> {
    const res = await fetch(`${API_BASE}/api/task/${id}`);
    return res.json();
  }

  async function getAgentCard(): Promise<AgentCardInfo> {
    const res = await fetch(`${API_BASE}/api/agent-card`);
    return res.json();
  }

  async function updateAgentCard(data: { name?: string; description?: string; skills?: Array<{ name: string; description: string }> }): Promise<{ ok: boolean; agentCard?: AgentCardInfo }> {
    const res = await fetch(`${API_BASE}/api/agent-card`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  async function updateAuthConfig(data: { enabled: boolean; token?: string }): Promise<{ ok: boolean }> {
    const res = await fetch(`${API_BASE}/api/auth-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  return { connect, disconnect, sendMessage, getTask, getAgentCard, updateAgentCard, updateAuthConfig };
}
