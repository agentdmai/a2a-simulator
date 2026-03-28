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
    <div className="mx-4 mt-2 px-4 py-3 bg-brand/10 text-brand border border-brand/20 rounded-md text-sm">
      {message}
    </div>
  );
}
