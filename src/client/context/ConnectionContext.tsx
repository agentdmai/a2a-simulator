import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { ConnectionState, ConnectionAction, TaskData } from '../types/index';

const initialState: ConnectionState = {
  status: 'disconnected',
  sseStatus: 'connected',
  agentCard: null,
  remoteUrl: '',
  tasks: new Map(),
  error: null,
};

function connectionReducer(state: ConnectionState, action: ConnectionAction): ConnectionState {
  switch (action.type) {
    case 'CONNECTING':
      return { ...state, status: 'connecting', remoteUrl: action.url, error: null };
    case 'CONNECTED':
      return { ...state, status: 'connected', agentCard: action.agentCard, error: null };
    case 'DISCONNECTED':
      return { ...state, status: 'disconnected', agentCard: null, remoteUrl: '', error: null };
    case 'ERROR':
      return { ...state, status: 'error', error: action.error };
    case 'MESSAGE_SENT': {
      const tasks = new Map(state.tasks);
      const existing = tasks.get(action.contextId);
      if (existing) {
        tasks.set(action.contextId, { ...existing, messages: [...existing.messages, action.message] });
      } else {
        const newTask: TaskData = {
          id: action.contextId,
          contextId: action.contextId,
          status: 'submitted',
          messages: [action.message],
          rawExchanges: [],
        };
        tasks.set(action.contextId, newTask);
      }
      return { ...state, tasks };
    }
    case 'TASK_EVENT': {
      const tasks = new Map(state.tasks);
      const { contextId, kind, ...rest } = action.payload;
      const existing = tasks.get(contextId);
      if (existing) {
        const updated = { ...existing };
        if (kind === 'status-update' && rest.status && typeof rest.status === 'object') {
          const statusObj = rest.status as { state?: string; message?: unknown };
          if (statusObj.state) updated.status = statusObj.state as TaskData['status'];

          if (statusObj.state === 'working') {
            // Extract message text if present
            const msg = statusObj.message && typeof statusObj.message === 'object'
              ? statusObj.message as { role?: string; parts?: Array<{ text?: string }>; messageId?: string }
              : null;
            const newText = msg?.role === 'agent' && msg.parts?.[0]?.text ? msg.parts[0].text : '';

            // Find existing streaming message to update in-place
            const streamingIdx = updated.messages.findIndex(m => m.isStreaming === true);
            if (streamingIdx >= 0) {
              // Update existing streaming message text
              updated.messages = updated.messages.map((m, i) =>
                i === streamingIdx ? { ...m, text: newText || m.text } : m
              );
            } else {
              // Add new streaming message
              updated.messages = [...updated.messages, {
                id: msg?.messageId || crypto.randomUUID(),
                role: 'agent' as const,
                text: newText,
                timestamp: new Date().toISOString(),
                isStreaming: true,
              }];
            }
          } else if (statusObj.state === 'completed' || statusObj.state === 'failed') {
            // Clear isStreaming on all messages and add final message text if present
            const msg = statusObj.message && typeof statusObj.message === 'object'
              ? statusObj.message as { role?: string; parts?: Array<{ text?: string }>; messageId?: string }
              : null;
            const finalText = msg?.role === 'agent' && msg.parts?.[0]?.text ? msg.parts[0].text : null;

            // Update streaming messages: set isStreaming false and update text if we have final text
            const streamingIdx = updated.messages.findIndex(m => m.isStreaming === true);
            if (streamingIdx >= 0) {
              updated.messages = updated.messages.map((m, i) =>
                i === streamingIdx
                  ? { ...m, isStreaming: false, text: finalText || m.text }
                  : m
              );
            } else if (finalText) {
              // No streaming message existed, add the final message
              updated.messages = [...updated.messages, {
                id: msg?.messageId || crypto.randomUUID(),
                role: 'agent' as const,
                text: finalText,
                timestamp: new Date().toISOString(),
              }];
            }
          } else {
            // Other states: add message if present (original behavior)
            if (statusObj.message && typeof statusObj.message === 'object') {
              const msg = statusObj.message as { role?: string; parts?: Array<{ text?: string }>; messageId?: string };
              if (msg.role === 'agent' && msg.parts?.[0]?.text) {
                updated.messages = [...updated.messages, {
                  id: msg.messageId || crypto.randomUUID(),
                  role: 'agent',
                  text: msg.parts[0].text,
                  timestamp: new Date().toISOString(),
                }];
              }
            }
          }
        }
        tasks.set(contextId, updated);
      } else {
        // New task from SSE event
        tasks.set(contextId, {
          id: contextId,
          contextId,
          status: 'submitted',
          messages: [],
          rawExchanges: [],
        });
      }
      return { ...state, tasks };
    }
    case 'SSE_RECONNECTING':
      return { ...state, sseStatus: 'reconnecting' };
    case 'SSE_RECONNECTED':
      return { ...state, sseStatus: 'connected' };
    case 'SSE_FAILED':
      return { ...state, sseStatus: 'failed' };
    default:
      return state;
  }
}

const ConnectionContext = createContext<{ state: ConnectionState; dispatch: Dispatch<ConnectionAction> } | null>(null);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(connectionReducer, initialState);
  return (
    <ConnectionContext.Provider value={{ state, dispatch }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error('useConnection must be used within ConnectionProvider');
  return ctx;
}
