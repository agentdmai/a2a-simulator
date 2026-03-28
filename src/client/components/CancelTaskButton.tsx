import { useState } from 'react';

interface CancelTaskButtonProps {
  taskId: string;
  onCancel: () => void;
}

export default function CancelTaskButton({ taskId, onCancel }: CancelTaskButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [canceling, setCanceling] = useState(false);

  async function handleConfirm() {
    setCanceling(true);
    try {
      const res = await fetch(`/api/task/${taskId}/cancel`, { method: 'POST' });
      if (res.ok) {
        onCancel();
      }
    } finally {
      setCanceling(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1 text-xs">
        <span className="text-slate-600">Cancel this task?</span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={canceling}
          className="text-red-600 hover:text-red-700 font-medium"
        >
          Yes, cancel
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-slate-500 hover:text-slate-700"
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-xs text-red-600 hover:text-red-700"
    >
      Cancel
    </button>
  );
}
