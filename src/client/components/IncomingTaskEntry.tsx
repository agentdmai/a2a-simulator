import type { TaskData } from '../types/index';
import StatusBadge from './StatusBadge';

interface IncomingTaskEntryProps {
  task: TaskData;
  selected: boolean;
  onClick: () => void;
}

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function IncomingTaskEntry({ task, selected, onClick }: IncomingTaskEntryProps) {
  const shortId = task.id.slice(0, 8);
  const timestamp = task.messages[0]?.timestamp || new Date().toISOString();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left py-2 px-4 flex items-center gap-2 hover:bg-bg-alt ${
        selected ? 'bg-brand/10 border-l-[3px] border-brand' : 'border-l-[3px] border-transparent'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-fg truncate">
            {task.senderName || 'Unknown'}
          </span>
          <StatusBadge status={task.status} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-mono text-xs text-fg-muted">{shortId}</span>
          <span className="text-xs text-fg-muted">{timeAgo(timestamp)}</span>
        </div>
      </div>
    </button>
  );
}
