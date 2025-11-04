import { io } from 'socket.io-client';

let socketInstance;

export const getSocket = () => {
  if (!socketInstance) {
    const url = import.meta.env.VITE_SOCKET_URL || undefined;
    socketInstance = io(url, {
      withCredentials: true,
      autoConnect: true
    });
  }
  return socketInstance;
};
