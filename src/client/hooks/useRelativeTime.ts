import { useState, useEffect } from 'react';

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function useRelativeTime(iso: string): string {
  const [text, setText] = useState(() => formatRelative(iso));
  useEffect(() => {
    const interval = setInterval(() => setText(formatRelative(iso)), 30_000);
    return () => clearInterval(interval);
  }, [iso]);
  return text;
}
