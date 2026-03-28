interface AuthToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function AuthToggle({ enabled, onToggle }: AuthToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-700">Require Authentication</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onToggle(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-slate-300'
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
