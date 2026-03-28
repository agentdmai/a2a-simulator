import type { ConnectionStatus as ConnectionStatusType } from '../types/index';

const statusConfig: Record<ConnectionStatusType, { color: string; pulse: boolean; label: string }> = {
  disconnected: { color: 'bg-neutral-400', pulse: false, label: 'Not connected' },
  connecting: { color: 'bg-amber-500', pulse: true, label: 'Connecting...' },
  connected: { color: 'bg-brand', pulse: false, label: 'Connected' },
  reconnecting: { color: 'bg-amber-500', pulse: true, label: 'Reconnecting...' },
  error: { color: 'bg-red-500', pulse: false, label: 'Connection failed' },
};

interface Props {
  status: ConnectionStatusType;
}

export default function ConnectionStatus({ status }: Props) {
  const config = statusConfig[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`}
      />
      <span className="text-xs text-fg-muted">{config.label}</span>
    </span>
  );
}
