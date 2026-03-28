import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { TaskData, RawExchange } from '../types/index';
import { useConnection } from '../context/ConnectionContext';
import MessageBubble from './MessageBubble';
import StatusBadge from './StatusBadge';
import CancelTaskButton from './CancelTaskButton';
import ResubscribeButton from './ResubscribeButton';

interface TaskThreadProps {
  task: TaskData;
  onViewRaw: (exchange: RawExchange) => void;
  onSelectReply?: (taskId: string) => void;
}

const terminalStates = new Set(['completed', 'failed', 'canceled']);

export default function TaskThread({ task, onViewRaw, onSelectReply }: TaskThreadProps) {
  const [expanded, setExpanded] = useState(true);
  const { dispatch } = useConnection();

  const shortId = task.id.slice(0, 8);
  const isOutgoing = task.direction === 'outgoing' || !task.direction;
  const isTerminal = terminalStates.has(task.status);

  function handleCancel() {
    dispatch({ type: 'TASK_CANCELED', contextId: task.contextId });
  }

  return (
    <div className="border-b border-bd pb-4 mb-4">
      {/* Thread header */}
      <div className="flex items-center gap-2 py-1 px-2 -mx-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 flex-1 text-left hover:bg-bg-alt rounded"
        >
          <ChevronDown
            size={16}
            className={`text-fg-muted transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`}
          />
          <span className="font-mono text-xs text-fg-muted" title={task.id}>
            {shortId}
          </span>
          <StatusBadge status={task.status} />
        </button>

        {/* Action buttons for outgoing tasks */}
        {isOutgoing && !isTerminal && (
          <div className="flex items-center gap-2">
            {task.status === 'working' && (
              <ResubscribeButton taskId={task.id} onResubscribe={() => {}} />
            )}
            <CancelTaskButton taskId={task.id} onCancel={handleCancel} />
          </div>
        )}
      </div>

      {/* Messages */}
      {expanded && (
        <div className="flex flex-col gap-2 mt-2">
          {task.messages.map((message, index) => {
            const exchange = task.rawExchanges[index];
            const canReply = onSelectReply && task.status === 'input-required' && message.role === 'agent';
            return (
              <div
                key={message.id}
                onClick={canReply ? () => onSelectReply(task.id) : undefined}
                className={canReply ? 'cursor-pointer hover:bg-bg-alt rounded-lg -mx-1 px-1 transition-colors' : ''}
                title={canReply ? 'Click to reply to this task' : undefined}
              >
                <MessageBubble
                  message={message}
                  direction={message.role === 'user' ? 'outgoing' : 'incoming'}
                  onViewRaw={exchange ? () => onViewRaw(exchange) : undefined}
                />
              </div>
            );
          })}

          {/* Display artifacts if present */}
          {task.artifacts && task.artifacts.length > 0 && (
            <div className="space-y-1 mt-2">
              {task.artifacts.map((artifact) => (
                <div key={artifact.artifactId} className="bg-bg-alt border border-bd rounded p-2">
                  <div className="text-xs font-medium text-fg-muted">{artifact.name || 'Artifact'}</div>
                  <pre className="text-xs text-fg mt-1 whitespace-pre-wrap font-mono">{artifact.content}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
