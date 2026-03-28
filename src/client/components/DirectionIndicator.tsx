import { ArrowLeft, ArrowRight } from 'lucide-react';

interface DirectionIndicatorProps {
  direction: 'incoming' | 'outgoing';
  agentName: string;
}

export default function DirectionIndicator({ direction, agentName }: DirectionIndicatorProps) {
  return (
    <div className="flex items-center gap-1 text-xs text-slate-500">
      {direction === 'incoming' ? (
        <>
          <ArrowLeft size={12} />
          <span>Incoming from {agentName}</span>
        </>
      ) : (
        <>
          <ArrowRight size={12} />
          <span>Outgoing to {agentName}</span>
        </>
      )}
    </div>
  );
}
