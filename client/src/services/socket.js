import { io } from 'socket.io-client';

let socketInstance;

export const getSocket = () => {
  if (!socketInstance) {
    const apiBase = import.meta.env.VITE_API_BASE_URL;
    const derivedFromApi = apiBase ? apiBase.replace(/\/?api\/?$/, '') : null;
    const url = import.meta.env.VITE_SOCKET_URL || derivedFromApi || undefined;
    socketInstance = io(url, {
      withCredentials: true,
      autoConnect: true
    });
  }
  return socketInstance;
};