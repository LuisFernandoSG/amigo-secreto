import { useEffect } from 'react';
import { getSocket } from '../services/socket.js';

export const useRealtimeGroup = (code, onEvent) => {
  useEffect(() => {
    if (!code) return undefined;
    const socket = getSocket();
    const handler = (message) => {
      if (typeof onEvent === 'function' && message) {
        onEvent(message);
      }
    };

    socket.emit('groups:join', { code });
    socket.on('group:event', handler);

    return () => {
      socket.emit('groups:leave', { code });
      socket.off('group:event', handler);
    };
  }, [code, onEvent]);
};