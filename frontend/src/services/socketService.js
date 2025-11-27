import { io } from 'socket.io-client';

let socket;

const connectSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
  const SOCKET_URL = API_BASE_URL.replace('/api/v1', '');

  socket = io(SOCKET_URL, {
    auth: {
      token: token,
    },
    transports: ['websocket', 'polling'],
  });

  return socket;
};

const getSocket = () => {
  return socket;
};

const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export { connectSocket, getSocket, disconnectSocket };