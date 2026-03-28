import { useState, useRef, useEffect, useCallback } from 'react';
import { useConnection } from '../context/ConnectionContext';
import { useApi } from '../hooks/useApi';
import type { RawExchange } from '../types/index';
import TaskThread from './TaskThread';
import MessageInput from './MessageInput';
import JsonDrawer from './JsonDrawer';
import ReconnectBanner from './ReconnectBanner';

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

  async function handleSend(text: string) {
    setSendError(null);
    const result = await api.sendMessage(text);
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

  const tasksArray = Array.from(state.tasks.values());
  const isConnected = state.status === 'connected';

  return (
    <>
      <div className="flex-1 flex flex-col min-w-0">
        {/* Reconnect banner */}
        <ReconnectBanner status={state.sseStatus} onRetry={handleRetry} />

        {/* Message area */}
        <div
          ref={messagesRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6"
        >
          {tasksArray.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                {state.status === 'disconnected' || state.status === 'error' ? (
                  <>
                    <h3 className="text-lg font-semibold text-slate-400">No agent connected</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Enter a remote agent URL in the connection panel to get started.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-slate-400">No messages yet</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Connect to a remote agent and send your first message to start testing.
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {tasksArray.map((task) => (
                <TaskThread key={task.id} task={task} onViewRaw={handleViewRaw} />
              ))}
            </div>
          )}
        </div>

        {/* Send error */}
        {sendError && (
          <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-t border-red-100">
            {sendError}
          </div>
        )}

        {/* Message input */}
        <MessageInput onSend={handleSend} disabled={!isConnected} />
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
