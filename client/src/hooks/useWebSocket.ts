import { useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketMessage } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8001/ws/live';

export function useWebSocket() {
  const [status, setStatus] = useState<'CONNECTING' | 'LIVE' | 'DISCONNECTED'>('CONNECTING');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    setStatus('CONNECTING');
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      setStatus('LIVE');
    };

    ws.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
      } catch (e) {
        console.error('Failed to parse WebSocket message', e);
      }
    };

    ws.current.onclose = () => {
      setStatus('DISCONNECTED');
      setTimeout(connect, 3000); // Reconnect after 3s
    };

    ws.current.onerror = () => {
      setStatus('DISCONNECTED');
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      ws.current?.close();
    };
  }, [connect]);

  return { status, lastMessage };
}
