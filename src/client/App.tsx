import { useCallback, useState } from 'react';
import { ConnectionProvider, useConnection } from './context/ConnectionContext';
import { useSSE } from './hooks/useSSE';
import LeftPanelTabs from './components/LeftPanelTabs';
import ConnectionPanel from './components/ConnectionPanel';
import IncomingTaskList from './components/IncomingTaskList';
import ChatPanel from './components/ChatPanel';
import AgentCardEditorDrawer from './components/AgentCardEditorDrawer';
import SuccessBanner from './components/SuccessBanner';
import type { SSEStatus, TaskEventPayload, IncomingTaskPayload } from './types/index';

function AppContent() {
  const { state, dispatch } = useConnection();
  const [activeTab, setActiveTab] = useState<'connection' | 'incoming'>('connection');
  const [editorOpen, setEditorOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSSEEvent = useCallback((event: string, data: unknown) => {
    if (event === 'task-event') {
      dispatch({ type: 'TASK_EVENT', payload: data as TaskEventPayload });
    } else if (event === 'incoming-task') {
      dispatch({ type: 'INCOMING_TASK', payload: data as IncomingTaskPayload });
    } else if (event === 'task-canceled') {
      const payload = data as { taskId: string };
      // Find contextId for this taskId
      for (const [contextId, task] of state.tasks) {
        if (task.id === payload.taskId) {
          dispatch({ type: 'TASK_CANCELED', contextId });
          break;
        }
      }
    }
  }, [dispatch, state.tasks]);

  const handleSSEStatus = useCallback((status: SSEStatus) => {
    if (status === 'reconnecting') dispatch({ type: 'SSE_RECONNECTING' });
    else if (status === 'connected') dispatch({ type: 'SSE_RECONNECTED' });
    else if (status === 'failed') dispatch({ type: 'SSE_FAILED' });
  }, [dispatch]);

  useSSE('/api/events', handleSSEEvent, handleSSEStatus);

  // Count incoming tasks with input-required status for the badge
  const incomingTasks = Array.from(state.tasks.values()).filter(t => t.direction === 'incoming');
  const incomingCount = incomingTasks.filter(t => t.status === 'input-required').length;

  function handleSelectTask(contextId: string) {
    dispatch({ type: 'SELECT_TASK', contextId });
  }

  return (
    <div className="flex h-screen bg-white">
      <LeftPanelTabs activeTab={activeTab} onTabChange={setActiveTab} incomingCount={incomingCount}>
        {activeTab === 'connection' ? (
          <ConnectionPanel onOpenEditor={() => setEditorOpen(true)} />
        ) : (
          <IncomingTaskList
            tasks={incomingTasks}
            selectedTaskId={state.selectedTaskId}
            onSelect={handleSelectTask}
          />
        )}
      </LeftPanelTabs>
      <div className="flex-1 flex flex-col min-w-0">
        {successMessage && <SuccessBanner message={successMessage} />}
        <ChatPanel />
      </div>
      <AgentCardEditorDrawer
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
      />
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
