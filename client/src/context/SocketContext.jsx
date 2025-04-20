import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import io from 'socket.io-client';

// 1. Create the Context
const SocketContext = createContext(null);

// 2. Create a Custom Hook for easy access
export const useSocket = () => {
  const socket = useContext(SocketContext);
  // Optional: Add a check if used outside the provider
  if (socket === undefined) {
      throw new Error('useSocket must be used within a SocketProvider');
  }
  return socket;
};

// 3. Create the Provider Component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Retrieve the token from storage (adjust key if needed)
  const token = localStorage.getItem("token");
  const serverUrl = import.meta.env.VITE_BASE_URL; // Your backend URL from .env

  useEffect(() => {
    // Only attempt connection if a token exists and server URL is defined
    if (token && serverUrl) {
      console.log("SocketProvider: Attempting to connect with token...");

      // Create the socket instance with authentication
      const newSocket = io(serverUrl, {
        // Send token for authentication middleware on the server
        auth: {
          token: token
        },
        // Optional: Configure reconnection behavior
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // --- Event Listeners ---

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setSocket(newSocket); // Store the connected socket instance
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        // Handle potential cleanup or state updates on disconnect
        setSocket(null);
        setIsConnected(false);
        // If the disconnect was due to server shutting down, reconnection might be attempted based on options
      });

      newSocket.on('connect_error', (err) => {
        // This is crucial for debugging authentication issues
        console.error('Socket connection error:', err.message);
        // Handle specific errors, e.g., invalid token
        if (err.message.includes("Authentication error")) {
            // Optional: Clear token, redirect to login, show error message
            console.error("Authentication failed. Please log in again.");
            // localStorage.removeItem("token"); // Example action
        }
        setSocket(null); // Ensure socket state is null on error
        setIsConnected(false);
      });

      // --- Optional: Listen for custom server events globally if needed ---
      // newSocket.on('some_global_event', (data) => {
      //   console.log('Received global event:', data);
      // });

      // --- Cleanup Function ---
      // This runs when the component unmounts or dependencies change
      return () => {
        console.log('SocketProvider: Cleaning up socket connection.');
        newSocket.off('connect'); // Remove specific listeners
        newSocket.off('disconnect');
        newSocket.off('connect_error');
        // newSocket.off('some_global_event');
        newSocket.disconnect(); // Disconnect the socket
        setSocket(null);
        setIsConnected(false);
      };

    } else {
      // Handle case where there's no token or server URL
      if (!token) console.log("SocketProvider: No token found, skipping connection.");
      if (!serverUrl) console.error("SocketProvider: VITE_BASE_URL is not defined in .env file.");

      // Ensure any previous socket is disconnected if token disappears (logout)
      if (socket) {
        console.log("SocketProvider: Disconnecting existing socket due to missing token.");
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, serverUrl]); // Re-run effect if token or serverUrl changes

  // Memoize the context value to prevent unnecessary re-renders of consumers
  // Only provide the socket instance itself
  const contextValue = useMemo(() => socket, [socket]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
