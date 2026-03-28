interface AuthToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function AuthToggle({ enabled, onToggle }: AuthToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-fg-muted">Require Authentication</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onToggle(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-brand' : 'bg-neutral-400 dark:bg-neutral-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
