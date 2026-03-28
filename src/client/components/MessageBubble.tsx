import type { ChatMessage } from '../types/index';
import { useRelativeTime } from '../hooks/useRelativeTime';
import StreamingIndicator from './StreamingIndicator';
import StatusBadge from './StatusBadge';

interface MessageBubbleProps {
  message: ChatMessage;
  direction: 'incoming' | 'outgoing';
  onViewRaw?: () => void;
}

export default function MessageBubble({ message, direction, onViewRaw }: MessageBubbleProps) {
  const relativeTime = useRelativeTime(message.timestamp);

  const isOutgoing = direction === 'outgoing';
  const bubbleClasses = isOutgoing
    ? 'ml-auto bg-blue-600 text-white rounded-2xl rounded-br-sm'
    : 'mr-auto bg-slate-100 text-slate-900 rounded-2xl rounded-bl-sm';

  const timeClasses = isOutgoing
    ? 'text-blue-200'
    : 'text-slate-400';

  return (
    <div className={`max-w-[70%] px-4 py-2 ${bubbleClasses}`}>
      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
      {message.isStreaming && <StreamingIndicator />}
      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs ${timeClasses}`}
            title={message.timestamp}
          >
            {relativeTime}
          </span>
          {message.taskState && <StatusBadge status={message.taskState} />}
        </div>
        {onViewRaw && (
          <button
            type="button"
            onClick={onViewRaw}
            className={`text-xs underline opacity-60 hover:opacity-100 ${isOutgoing ? 'text-blue-200' : 'text-slate-500'}`}
          >
            View raw
          </button>
        )}
      </div>
    </div>
  );
}
