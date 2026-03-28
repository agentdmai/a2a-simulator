import { X } from 'lucide-react';

interface AuthErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export default function AuthErrorBanner({ message, onDismiss }: AuthErrorBannerProps) {
  return (
    <div className="mx-4 mt-2 flex items-center justify-between gap-2 px-4 py-3 bg-red-50 text-red-800 border border-red-200 rounded-md text-sm">
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Close"
        className="p-1 text-red-400 hover:text-red-600 shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}
