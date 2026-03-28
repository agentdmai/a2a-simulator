import { X } from 'lucide-react';

interface ArtifactChipProps {
  name: string;
  onRemove: () => void;
}

export default function ArtifactChip({ name, onRemove }: ArtifactChipProps) {
  return (
    <span className="inline-flex items-center gap-1 bg-bg-alt text-fg px-2 py-1 rounded text-sm">
      {name}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${name}`}
        className="text-fg-muted hover:text-fg"
      >
        <X size={14} />
      </button>
    </span>
  );
}
