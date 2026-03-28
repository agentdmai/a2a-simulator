import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { TaskData, RawExchange } from '../types/index';
import MessageBubble from './MessageBubble';
import StatusBadge from './StatusBadge';

interface TaskThreadProps {
  task: TaskData;
  onViewRaw: (exchange: RawExchange) => void;
}

export default function TaskThread({ task, onViewRaw }: TaskThreadProps) {
  const [expanded, setExpanded] = useState(true);

  const shortId = task.id.slice(0, 8);

  return (
    <div className="border-b border-slate-100 pb-4 mb-4">
      {/* Thread header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left py-1 hover:bg-slate-50 rounded px-2 -mx-2"
      >
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`}
        />
        <span className="font-mono text-xs text-slate-500" title={task.id}>
          {shortId}
        </span>
        <StatusBadge status={task.status} />
      </button>

      {/* Messages */}
      {expanded && (
        <div className="flex flex-col gap-2 mt-2">
          {task.messages.map((message, index) => {
            const exchange = task.rawExchanges[index];
            return (
              <MessageBubble
                key={message.id}
                message={message}
                direction={message.role === 'user' ? 'outgoing' : 'incoming'}
                onViewRaw={exchange ? () => onViewRaw(exchange) : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
