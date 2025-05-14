import io from 'socket.io-client';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:8000';
    socket = io(baseUrl);
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};