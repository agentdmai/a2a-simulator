import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface ResubscribeButtonProps {
  taskId: string;
  onResubscribe: () => void;
}

export default function ResubscribeButton({ taskId, onResubscribe }: ResubscribeButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/task/${taskId}/resubscribe`, { method: 'POST' });
      if (res.ok) {
        onResubscribe();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
    >
      <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
      Resubscribe
    </button>
  );
}
