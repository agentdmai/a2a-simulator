import { useState, useEffect } from 'react';

interface SuccessBannerProps {
  message: string;
}

export default function SuccessBanner({ message }: SuccessBannerProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!visible) return null;

  return (
    <div className="mx-4 mt-2 px-4 py-3 bg-green-50 text-green-800 border border-green-200 rounded-md text-sm">
      {message}
    </div>
  );
}
