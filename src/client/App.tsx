import { useCallback } from 'react';
import { ConnectionProvider, useConnection } from './context/ConnectionContext';
import { useSSE } from './hooks/useSSE';
import ConnectionPanel from './components/ConnectionPanel';
import ChatPanel from './components/ChatPanel';
import type { SSEStatus, TaskEventPayload } from './types/index';

function AppContent() {
  const { dispatch } = useConnection();

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

  useSSE('/api/events', handleSSEEvent, handleSSEStatus);

  return (
    <div className="flex h-screen bg-white">
      <ConnectionPanel />
      <div className="flex-1 flex flex-col min-w-0">
        <ChatPanel />
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
