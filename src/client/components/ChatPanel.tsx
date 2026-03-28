import { useState, useRef, useEffect, useCallback } from 'react';
import { useConnection } from '../context/ConnectionContext';
import { useApi } from '../hooks/useApi';
import type { RawExchange } from '../types/index';
import TaskThread from './TaskThread';
import MessageInput from './MessageInput';
import ResponseComposer from './ResponseComposer';
import DirectionIndicator from './DirectionIndicator';
import JsonDrawer from './JsonDrawer';
import ReconnectBanner from './ReconnectBanner';
import AuthErrorBanner from './AuthErrorBanner';

export default function ChatPanel() {
  const { state, dispatch } = useConnection();
  const api = useApi();

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRequest, setDrawerRequest] = useState<unknown>(null);
  const [drawerResponse, setDrawerResponse] = useState<unknown>(null);

  // Auto-scroll state
  const messagesRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  // Send error state
  const [sendError, setSendError] = useState<string | null>(null);

  // Auto-scroll when tasks change
  useEffect(() => {
    if (!userScrolledUp.current && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [state.tasks]);

  const handleScroll = useCallback(() => {
    const el = messagesRef.current;
    if (!el) return;
    // User is "scrolled up" if not near the bottom (50px threshold)
    userScrolledUp.current = el.scrollTop + el.clientHeight < el.scrollHeight - 50;
  }, []);

  // Track which task A is replying to (input-required tasks only)
  const [replyingToTaskId, setReplyingToTaskId] = useState<string | null>(null);
  const replyingToTask = replyingToTaskId ? state.tasks.get(replyingToTaskId) : null;
  const replyInfo = replyingToTask && replyingToTask.status === 'input-required' && replyingToTask.remoteTaskId
    ? { taskId: replyingToTask.remoteTaskId, contextId: replyingToTaskId!, lastMessage: replyingToTask.messages[replyingToTask.messages.length - 1]?.text || '' }
    : null;

  async function handleSend(text: string) {
    setSendError(null);
    // If replying to an input-required task, pass the remote taskId and group contextId
    const result = await api.sendMessage(text, replyInfo?.taskId, replyInfo?.contextId);
    if (result.ok) setReplyingToTaskId(null);
    if (result.ok && result.contextId) {
      dispatch({
        type: 'MESSAGE_SENT',
        contextId: result.contextId,
        message: {
          id: result.messageId || crypto.randomUUID(),
          role: 'user',
          text,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      setSendError(result.error || 'Message failed to send. The remote agent may be unavailable.');
    }
  }

  function handleViewRaw(exchange: RawExchange) {
    setDrawerRequest(exchange.request ?? null);
    setDrawerResponse(exchange.response ?? null);
    setDrawerOpen(true);
  }

  function handleRetry() {
    dispatch({ type: 'SSE_RECONNECTING' });
  }

  // Determine the selected task (if any)
  const selectedTask = state.selectedTaskId ? state.tasks.get(state.selectedTaskId) : null;
  const isViewingIncoming = selectedTask?.direction === 'incoming';

  // Determine tasks to show: if a specific task is selected, show only that one; otherwise show all outgoing
  const tasksToShow = selectedTask
    ? [selectedTask]
    : Array.from(state.tasks.values()).filter(t => t.direction === 'outgoing');

  const isConnected = state.status === 'connected';
  const terminalStates = new Set(['completed', 'failed', 'canceled']);
  const showResponseComposer = isViewingIncoming && selectedTask != null && !terminalStates.has(selectedTask.status);

  // Agent name for direction indicator
  const agentName = state.agentCard?.name || 'Remote Agent';

  return (
    <>
      <div className="flex-1 flex flex-col min-w-0">
        {/* Reconnect banner */}
        <ReconnectBanner status={state.sseStatus} onRetry={handleRetry} />

        {/* Auth error banner */}
        {state.authError && (
          <AuthErrorBanner
            message={state.authError}
            onDismiss={() => dispatch({ type: 'CLEAR_AUTH_ERROR' })}
          />
        )}

        {/* Direction indicator for selected task */}
        {selectedTask && (
          <div className="px-6 pt-3 pb-1 border-b border-bd">
            <DirectionIndicator
              direction={selectedTask.direction}
              agentName={selectedTask.direction === 'incoming' ? (selectedTask.senderName || 'Remote Agent') : agentName}
            />
          </div>
        )}

        {/* Message area */}
        <div
          ref={messagesRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6"
        >
          {tasksToShow.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                {state.status === 'disconnected' || state.status === 'error' ? (
                  <>
                    <h3 className="text-lg font-semibold text-fg-muted">No agent connected</h3>
                    <p className="mt-2 text-sm text-fg-muted">
                      Enter a remote agent URL in the connection panel to get started.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-fg-muted">No messages yet</h3>
                    <p className="mt-2 text-sm text-fg-muted">
                      Connect to a remote agent and send your first message to start testing.
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {tasksToShow.map((task) => (
                <TaskThread
                  key={task.id}
                  task={task}
                  onViewRaw={handleViewRaw}
                  onSelectReply={task.status === 'input-required' ? (id) => setReplyingToTaskId(id) : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Send error */}
        {sendError && (
          <div className="px-4 py-2 text-sm text-red-400 bg-red-500/10 border-t border-red-500/20">
            {sendError}
          </div>
        )}

        {/* Bottom input: ResponseComposer for incoming tasks, MessageInput for outgoing */}
        {showResponseComposer ? (
          <ResponseComposer taskId={selectedTask!.id} contextId={state.selectedTaskId!} onReply={() => {}} />
        ) : (
          <MessageInput
            onSend={handleSend}
            disabled={!isConnected}
            replyingTo={replyInfo}
            onClearReply={() => setReplyingToTaskId(null)}
          />
        )}
      </div>

      {/* JSON Drawer */}
      <JsonDrawer
        open={drawerOpen}
        request={drawerRequest}
        response={drawerResponse}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
