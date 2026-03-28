import { useCallback } from 'react';
import { ConnectionProvider, useConnection } from './context/ConnectionContext';
import { useSSE } from './hooks/useSSE';
import ConnectionPanel from './components/ConnectionPanel';
import ReconnectBanner from './components/ReconnectBanner';
import type { SSEStatus, TaskEventPayload } from './types/index';

function AppContent() {
  const { state, dispatch } = useConnection();

  const handleSSEEvent = useCallback((event: string, data: unknown) => {
    if (event === 'task-event') {
      dispatch({ type: 'TASK_EVENT', payload: data as TaskEventPayload });
    }
  }, [dispatch]);

  const handleSSEStatus = useCallback((status: SSEStatus) => {
    if (status === 'reconnecting') dispatch({ type: 'SSE_RECONNECTING' });
    else if (status === 'connected') dispatch({ type: 'SSE_RECONNECTED' });
    else if (status === 'failed') dispatch({ type: 'SSE_FAILED' });
  }, [dispatch]);

  const handleRetry = useCallback(() => {
    // Force reconnect by dispatching reconnecting state
    // The useSSE hook handles actual reconnection via its backoff logic
    dispatch({ type: 'SSE_RECONNECTING' });
  }, [dispatch]);

  useSSE('/api/events', handleSSEEvent, handleSSEStatus);

  return (
    <div className="flex h-screen bg-white">
      <ConnectionPanel />
      <div className="flex-1 flex flex-col">
        <ReconnectBanner status={state.sseStatus} onRetry={handleRetry} />
        <h2 className="p-6 text-lg font-semibold text-slate-900 border-b border-slate-200">Chat</h2>
        <div className="flex-1 flex items-center justify-center p-6">
          {state.status === 'connected' ? (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-400">No messages yet</h3>
              <p className="mt-2 text-sm text-slate-400">
                Connect to a remote agent and send your first message to start testing.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-400">No agent connected</h3>
              <p className="mt-2 text-sm text-slate-400">
                Enter a remote agent URL in the connection panel to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ConnectionProvider>
      <AppContent />
    </ConnectionProvider>
  );
}
