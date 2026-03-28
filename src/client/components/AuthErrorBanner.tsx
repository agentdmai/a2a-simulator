import { X } from 'lucide-react';

interface AuthErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export default function AuthErrorBanner({ message, onDismiss }: AuthErrorBannerProps) {
  return (
    <div className="mx-4 mt-2 flex items-center justify-between gap-2 px-4 py-3 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-md text-sm">
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Close"
        className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300 shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}
