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
    ? 'ml-auto bg-primary text-primary-fg rounded-2xl rounded-br-sm'
    : 'mr-auto bg-bg-alt text-fg rounded-2xl rounded-bl-sm';

  const timeClasses = isOutgoing
    ? 'text-brand-light'
    : 'text-fg-muted';

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
            className={`text-xs underline opacity-60 hover:opacity-100 ${isOutgoing ? 'text-brand-light' : 'text-fg-muted'}`}
          >
            View raw
          </button>
        )}
      </div>
    </div>
  );
}
