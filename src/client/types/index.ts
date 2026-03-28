// Connection states matching UI-SPEC connection status indicator
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

// SSE states for reconnect tracking
export type SSEStatus = 'connected' | 'reconnecting' | 'failed';

// Task status matching A2A protocol states
export type TaskState = 'submitted' | 'working' | 'input-required' | 'completed' | 'failed';

// Agent card shape (mirrors @a2a-js/sdk AgentCard relevant fields)
export interface AgentCardInfo {
  name: string;
  description: string;
  url: string;
  skills: Array<{ id: string; name: string; description: string; tags?: string[] }>;
  capabilities: { streaming: boolean; pushNotifications: boolean; stateTransitionHistory: boolean };
}

// Message for chat display
export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: string; // ISO string
  isStreaming?: boolean;
}

// Task data for task-grouped threads
export interface TaskData {
  id: string;
  contextId: string;
  status: TaskState;
  messages: ChatMessage[];
  rawExchanges: RawExchange[];
}

// Raw JSON-RPC exchange for the drawer
export interface RawExchange {
  id: string;
  request?: unknown;
  response?: unknown;
  timestamp: string;
}

// SSE event payloads from server
export interface TaskEventPayload {
  contextId: string;
  kind: 'status-update' | 'artifact-update' | 'message' | 'task';
  rawRequest?: unknown;
  rawResponse?: unknown;
  [key: string]: unknown;
}

// Connection state for useReducer
export interface ConnectionState {
  status: ConnectionStatus;
  sseStatus: SSEStatus;
  agentCard: AgentCardInfo | null;
  remoteUrl: string;
  tasks: Map<string, TaskData>;
  error: string | null;
}

// Actions for ConnectionContext reducer
export type ConnectionAction =
  | { type: 'CONNECTING'; url: string }
  | { type: 'CONNECTED'; agentCard: AgentCardInfo }
  | { type: 'DISCONNECTED' }
  | { type: 'ERROR'; error: string }
  | { type: 'TASK_EVENT'; payload: TaskEventPayload }
  | { type: 'MESSAGE_SENT'; contextId: string; message: ChatMessage }
  | { type: 'SSE_RECONNECTING' }
  | { type: 'SSE_RECONNECTED' }
  | { type: 'SSE_FAILED' };
