import type { SSEStatus } from '../types/index';

interface Props {
  status: SSEStatus;
  onRetry: () => void;
}

export default function ReconnectBanner({ status, onRetry }: Props) {
  if (status === 'connected') return null;

  if (status === 'reconnecting') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-sm text-amber-800">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        Reconnecting...
      </div>
    );
  }

  // status === 'failed'
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-200 text-sm text-red-800">
      <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
      Connection lost.{' '}
      <button
        onClick={onRetry}
        className="underline font-medium hover:text-red-900"
      >
        Reconnect
      </button>
    </div>
  );
}
