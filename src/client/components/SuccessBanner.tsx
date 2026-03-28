import { useState, useEffect } from 'react';

interface SuccessBannerProps {
  message: string;
  onDismiss?: () => void;
}

export default function SuccessBanner({ message, onDismiss }: SuccessBannerProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!visible) return null;

  return (
    <div className="mx-4 mt-2 px-4 py-3 bg-green-50 text-green-800 border border-green-200 rounded-md text-sm">
      {message}
    </div>
  );
}
