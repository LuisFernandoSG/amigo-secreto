import { Server } from 'socket.io';
import { CLIENT_ORIGIN } from '../config/env.js';

let ioInstance;

const getRoomName = (code) => `group:${String(code).toUpperCase()}`;

export const initRealtime = (server) => {
  const origins = CLIENT_ORIGIN === '*' ? '*' : CLIENT_ORIGIN.split(',').map((origin) => origin.trim());
  const allowCredentials = origins !== '*';

  ioInstance = new Server(server, {
    cors: {
      origin: origins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: allowCredentials
    }
  });

  ioInstance.on('connection', (socket) => {
    socket.on('groups:join', ({ code }) => {
      if (!code) return;
      socket.join(getRoomName(code));
    });

    socket.on('groups:leave', ({ code }) => {
      if (!code) return;
      socket.leave(getRoomName(code));
    });
  });

  return ioInstance;
};

export const broadcastGroupEvent = (code, event, payload = {}) => {
  if (!ioInstance) return;
  ioInstance.to(getRoomName(code)).emit('group:event', {
    event,
    payload,
    emittedAt: new Date().toISOString()
  });
};