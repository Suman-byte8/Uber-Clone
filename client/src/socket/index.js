import { io } from 'socket.io-client';
import * as events from './events';

/**
 * Socket.io client configuration
 * 
 * This module creates and exports a singleton socket instance
 * to be used throughout the application. This ensures we maintain
 * only one connection to the server.
 */

// Get the base URL from environment variables or use a default
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8000';

// Create a singleton socket instance
let socket;

/**
 * Initialize the socket connection
 * @param {Object} options - Additional options for socket connection
 * @returns {Object} The socket instance
 */
export const initializeSocket = (options = {}) => {
  if (!socket) {
    socket = io(BASE_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      ...options
    });

    // Set up basic connection event handlers
    socket.on(events.CONNECT, () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on(events.DISCONNECT, (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }
  
  return socket;
};

/**
 * Get the socket instance. Initializes it if not already done.
 * @returns {Object} The socket instance
 */
export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

/**
 * Disconnect the socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket
};
