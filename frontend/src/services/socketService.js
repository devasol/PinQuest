import { io } from 'socket.io-client';
import { API_BASE_URL } from '../utils/config';

let socket;

const connectSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  // Extract the base URL from the API_BASE_URL (remove /api/v1)
  const apiBaseUrl = API_BASE_URL;
  // Handle different URL formats properly
  let SOCKET_URL;
  if (apiBaseUrl.includes('/api/v1')) {
    SOCKET_URL = apiBaseUrl.replace('/api/v1', '');
  } else if (apiBaseUrl.includes('/api')) {
    SOCKET_URL = apiBaseUrl.replace('/api', '');
  } else {
    // If URL doesn't match expected format, just remove the last path segment
    SOCKET_URL = apiBaseUrl.split('/').slice(0, -1).join('/');
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