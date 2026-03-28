import { useEffect, useRef } from 'react';
import type { SSEStatus } from '../types/index';

type SSEEventHandler = (event: string, data: unknown) => void;
type SSEStatusHandler = (status: SSEStatus) => void;

export function useSSE(url: string, onEvent: SSEEventHandler, onStatus?: SSEStatusHandler) {
  const onEventRef = useRef(onEvent);
  const onStatusRef = useRef(onStatus);
  onEventRef.current = onEvent;
  onStatusRef.current = onStatus;

  useEffect(() => {
    let es: EventSource | null = null;
    let retryCount = 0;
    const maxRetries = 5;
    const backoff = [1000, 2000, 4000]; // Per CONTEXT.md locked decision
    let destroyed = false;

    function connect() {
      if (destroyed) return;
      es = new EventSource(url);

      es.addEventListener('connected', () => {
        retryCount = 0;
        onStatusRef.current?.('connected');
      });

      es.addEventListener('task-event', (e) => {
        retryCount = 0;
        onEventRef.current('task-event', JSON.parse(e.data));
      });

      es.addEventListener('connection-status', (e) => {
        onEventRef.current('connection-status', JSON.parse(e.data));
      });

      es.addEventListener('stream-error', (e) => {
        onEventRef.current('stream-error', JSON.parse(e.data));
      });

      es.addEventListener('incoming-task', (e) => {
        onEventRef.current('incoming-task', JSON.parse(e.data));
      });

      es.addEventListener('task-canceled', (e) => {
        onEventRef.current('task-canceled', JSON.parse(e.data));
      });

      es.addEventListener('reply-sent', (e) => {
        onEventRef.current('reply-sent', JSON.parse(e.data));
      });

      es.onerror = () => {
        es?.close();
        if (destroyed) return;
        if (retryCount < maxRetries) {
          const delay = backoff[Math.min(retryCount, backoff.length - 1)];
          retryCount++;
          onStatusRef.current?.('reconnecting');
          setTimeout(connect, delay);
        } else {
          onStatusRef.current?.('failed');
        }
      };
    }

    connect();
    return () => {
      destroyed = true;
      es?.close();
    };
  }, [url]);
}
