import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { ConnectionState, ConnectionAction, TaskData, ArtifactData } from '../types/index';

const initialState: ConnectionState = {
  status: 'disconnected',
  sseStatus: 'connected',
  agentCard: null,
  remoteUrl: '',
  tasks: new Map(),
  error: null,
  selectedTaskId: null,
  authError: null,
  ownAgentCard: null,
};

function connectionReducer(state: ConnectionState, action: ConnectionAction): ConnectionState {
  switch (action.type) {
    case 'CONNECTING':
      return { ...state, status: 'connecting', remoteUrl: action.url, error: null };
    case 'CONNECTED':
      return { ...state, status: 'connected', agentCard: action.agentCard, error: null, authError: null };
    case 'DISCONNECTED':
      return { ...state, status: 'disconnected', agentCard: null, remoteUrl: '', error: null };
    case 'ERROR': {
      const isAuthError = /401|auth/i.test(action.error);
      return {
        ...state,
        status: 'error',
        error: action.error,
        authError: isAuthError ? 'Authentication failed. Check your auth token and try reconnecting.' : state.authError,
      };
    }
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
          direction: 'outgoing',
        };
        tasks.set(action.contextId, newTask);
      }
      return { ...state, tasks };
    }
    case 'INCOMING_TASK': {
      const tasks = new Map(state.tasks);
      const { taskId, contextId, message, status, timestamp } = action.payload;

      // Extract sender name and message text from the A2A message
      const msg = message && typeof message === 'object'
        ? message as { role?: string; parts?: Array<{ text?: string }>; messageId?: string }
        : null;
      const senderText = msg?.parts?.[0]?.text || '';
      const senderName = 'Remote Agent';

      const chatMessage = {
        id: msg?.messageId || crypto.randomUUID(),
        role: 'user' as const, // Remote agent acting as user (sender)
        text: senderText,
        timestamp,
      };

      const key = contextId || taskId;
      const existing = tasks.get(key);

      if (existing) {
        // Follow-up message on existing task — append message and update status/taskId
        const updated = {
          ...existing,
          id: taskId, // Update to latest taskId (SDK may assign new ones)
          status: (status as TaskData['status']) || 'input-required',
          messages: senderText ? [...existing.messages, chatMessage] : existing.messages,
        };
        tasks.set(key, updated);
      } else {
        // New incoming task
        const newTask: TaskData = {
          id: taskId,
          contextId: key,
          status: (status as TaskData['status']) || 'input-required',
          messages: senderText ? [chatMessage] : [],
          rawExchanges: [],
          direction: 'incoming',
          senderName,
        };
        tasks.set(key, newTask);
      }
      return { ...state, tasks };
    }
    case 'TASK_CANCELED': {
      const tasks = new Map(state.tasks);
      const existing = tasks.get(action.contextId);
      if (existing) {
        tasks.set(action.contextId, { ...existing, status: 'canceled' });
      }
      return { ...state, tasks };
    }
    case 'SELECT_TASK':
      return { ...state, selectedTaskId: action.contextId };
    case 'TASK_EVENT': {
      const tasks = new Map(state.tasks);
      const { contextId, kind, ...rest } = action.payload;
      const existing = tasks.get(contextId);
      if (existing) {
        const updated = { ...existing };
        // Capture remote agent's taskId for reply support
        // status-update events have taskId; task events have id
        const remoteId = (rest.taskId as string) || (kind === 'task' && rest.id ? (rest.id as string) : null);
        if (remoteId) {
          updated.remoteTaskId = remoteId;
        }

        if (kind === 'artifact-update') {
          // Extract artifact data and append to task's artifacts array
          const artifact = rest.artifact as { artifactId?: string; name?: string; parts?: Array<{ text?: string }> } | undefined;
          if (artifact) {
            const artifactData: ArtifactData = {
              artifactId: artifact.artifactId || crypto.randomUUID(),
              name: artifact.name,
              content: artifact.parts?.[0]?.text || '',
            };
            updated.artifacts = [...(updated.artifacts || []), artifactData];
          }
        } else if (kind === 'status-update' && rest.status && typeof rest.status === 'object') {
          const statusObj = rest.status as { state?: string; message?: unknown };
          if (statusObj.state) updated.status = statusObj.state as TaskData['status'];

          if (statusObj.state === 'working') {
            // Extract message text if present
            const msg = statusObj.message && typeof statusObj.message === 'object'
              ? statusObj.message as { role?: string; parts?: Array<{ text?: string }>; messageId?: string }
              : null;
            const newText = msg?.role === 'agent' && msg.parts?.[0]?.text ? msg.parts[0].text : '';

            // Find existing streaming message — finalize it before adding new one
            const streamingIdx = updated.messages.findIndex(m => m.isStreaming === true);
            if (streamingIdx >= 0) {
              // Finalize previous streaming message, then append new one
              updated.messages = updated.messages.map((m, i) =>
                i === streamingIdx ? { ...m, isStreaming: false } : m
              );
              updated.messages = [...updated.messages, {
                id: msg?.messageId || crypto.randomUUID(),
                role: 'agent' as const,
                text: newText,
                timestamp: new Date().toISOString(),
                isStreaming: true,
                taskState: 'working' as const,
              }];
            } else {
              // Add new streaming message
              updated.messages = [...updated.messages, {
                id: msg?.messageId || crypto.randomUUID(),
                role: 'agent' as const,
                text: newText,
                timestamp: new Date().toISOString(),
                isStreaming: true,
                taskState: 'working' as const,
              }];
            }
          } else if (statusObj.state === 'completed' || statusObj.state === 'failed') {
            // Extract message text — try multiple shapes since SDK may transform it
            const msg = statusObj.message && typeof statusObj.message === 'object'
              ? statusObj.message as { role?: string; parts?: Array<{ kind?: string; text?: string }>; messageId?: string; kind?: string }
              : null;
            const finalText = msg?.parts?.[0]?.text || null;

            // Clear isStreaming on all messages and add final message if present
            const streamingIdx = updated.messages.findIndex(m => m.isStreaming === true);
            if (streamingIdx >= 0) {
              updated.messages = updated.messages.map((m, i) =>
                i === streamingIdx
                  ? { ...m, isStreaming: false, text: finalText || m.text, taskState: statusObj.state as TaskData['status'] }
                  : m
              );
            } else if (finalText) {
              // No streaming message existed, add the final message
              // Deduplicate by text+state: SDK sends multiple events for terminal states
              // with different messageIds, so messageId alone isn't reliable
              const isDuplicate = updated.messages.some(m => m.text === finalText && m.taskState === statusObj.state);
              if (!isDuplicate) {
                updated.messages = [...updated.messages, {
                  id: msg?.messageId || crypto.randomUUID(),
                  role: 'agent' as const,
                  text: finalText,
                  timestamp: new Date().toISOString(),
                  taskState: statusObj.state as TaskData['status'],
                }];
              }
            }
          } else {
            // Other states (input-required, etc.): add agent messages only
            // Skip user messages — they're echoes of what A already sent
            if (statusObj.message && typeof statusObj.message === 'object') {
              const msg = statusObj.message as { role?: string; parts?: Array<{ kind?: string; text?: string }>; messageId?: string };
              const msgText = msg.parts?.[0]?.text;
              if (msgText && msg.role === 'agent') {
                const isDuplicate = updated.messages.some(m => m.text === msgText && m.taskState === statusObj.state);
                if (!isDuplicate) {
                  updated.messages = [...updated.messages, {
                    id: msg.messageId || crypto.randomUUID(),
                    role: 'agent' as const,
                    text: msgText,
                    timestamp: new Date().toISOString(),
                    taskState: statusObj.state as TaskData['status'],
                  }];
                }
              }
            }
          }
        }
        // Populate rawExchanges from SSE event raw data
        if (action.payload.rawRequest || action.payload.rawResponse) {
          updated.rawExchanges = [...updated.rawExchanges, {
            id: crypto.randomUUID(),
            request: action.payload.rawRequest ?? undefined,
            response: action.payload.rawResponse ?? undefined,
            timestamp: new Date().toISOString(),
          }];
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
          direction: 'outgoing',
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
    case 'AUTH_ERROR':
      return { ...state, authError: action.error };
    case 'CLEAR_AUTH_ERROR':
      return { ...state, authError: null };
    case 'OWN_AGENT_CARD_LOADED':
      return { ...state, ownAgentCard: action.card };
    case 'REPLY_SENT': {
      const tasks = new Map(state.tasks);
      const existing = tasks.get(action.contextId);
      if (existing) {
        const replyMessage = {
          id: crypto.randomUUID(),
          role: 'agent' as const,
          text: action.text,
          timestamp: new Date().toISOString(),
          taskState: action.state,
        };
        tasks.set(action.contextId, {
          ...existing,
          status: action.state,
          messages: [...existing.messages, replyMessage],
        });
      }
      return { ...state, tasks };
    }
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
