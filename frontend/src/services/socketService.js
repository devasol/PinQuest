import { io } from 'socket.io-client';

let socket;

const connectSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  // Extract the base URL from the API_BASE_URL (remove /api/v1)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
  // Handle different URL formats properly
  let SOCKET_URL;
  if (API_BASE_URL.includes('/api/v1')) {
    SOCKET_URL = API_BASE_URL.replace('/api/v1', '');
  } else if (API_BASE_URL.includes('/api')) {
    SOCKET_URL = API_BASE_URL.replace('/api', '');
  } else {
    // If URL doesn't match expected format, just remove the last path segment
    SOCKET_URL = API_BASE_URL.split('/').slice(0, -1).join('/');
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: token,
    },
    transports: ['websocket', 'polling'],
    // Add timeout and reconnection options
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
    // Add extra headers if needed
    extraHeaders: {
      'Authorization': `Bearer ${token}`
    }
  });

  // Add error handling for socket connection
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('connect_timeout', () => {
    console.error('Socket connection timeout');
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