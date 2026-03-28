import type { SSEStatus } from '../types/index';

interface Props {
  status: SSEStatus;
  onRetry: () => void;
}

export default function ReconnectBanner({ status, onRetry }: Props) {
  if (status === 'connected') return null;

  if (status === 'reconnecting') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-sm text-amber-600 dark:text-amber-400">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        Reconnecting...
      </div>
    );
  }

  // status === 'failed'
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-sm text-red-600 dark:text-red-400">
      <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
      Connection lost.{' '}
      <button
        onClick={onRetry}
        className="underline font-medium hover:opacity-80"
      >
        Reconnect
      </button>
    </div>
  );
}
