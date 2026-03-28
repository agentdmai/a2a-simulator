import { X } from 'lucide-react';

interface ArtifactChipProps {
  name: string;
  onRemove: () => void;
}

export default function ArtifactChip({ name, onRemove }: ArtifactChipProps) {
  return (
    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded text-sm">
      {name}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${name}`}
        className="text-slate-400 hover:text-slate-600"
      >
        <X size={14} />
      </button>
    </span>
  );
}
