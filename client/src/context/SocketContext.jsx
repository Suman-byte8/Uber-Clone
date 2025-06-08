import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context.socket;
};

export const useSocketActions = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocketActions must be used within a SocketProvider');
  }
  return {
    isConnected: context.isConnected,
    reconnecting: context.reconnecting,
    forceReconnectSocket: context.forceReconnectSocket,
    connect: context.connect
  };
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const serverUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:8000';

  const connect = (token) => {
    if (!token) {
      console.warn("Cannot connect socket: No token provided");
      return;
    }

    // Clean the token
    const cleanToken = token.replace('Bearer ', '').trim();

    if (socket?.connected) {
      console.log("Socket already connected");
      return socket;
    }

    console.log("Initializing socket connection with token...");
    
    const newSocket = io(serverUrl, {
      auth: { 
        token: cleanToken // Send clean token without Bearer prefix
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      extraHeaders: {
        Authorization: `Bearer ${cleanToken}`
      }
    });

    newSocket.on("connect", () => {
      console.log("Socket connected successfully:", newSocket.id);
      setIsConnected(true);
      setReconnecting(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
      setReconnecting(false);
      
      if (error.message.includes('Authentication error')) {
        console.log("Authentication failed, removing invalid token");
        localStorage.removeItem('token');
        // Optionally redirect to login
        window.location.href = '/user-login';
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    });

    setSocket(newSocket);
    return newSocket;
  };

  // Auto-connect when token is available
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log("No token available for socket connection");
      return;
    }

    // Clean the token
    const cleanToken = token.replace('Bearer ', '').trim();

    if (!socket) {
      console.log("Initiating socket connection with stored token");
      connect(cleanToken);
    }
    
    return () => {
      if (socket) {
        console.log("Cleaning up socket connection");
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, []);

  const forceReconnectSocket = async () => {
    if (reconnecting) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error("No authentication token available");
    }

    setReconnecting(true);
    
    try {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }

      const newSocket = connect(token);
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket reconnection timeout'));
        }, 5000);

        newSocket.once("connect", () => {
          clearTimeout(timeout);
          setIsConnected(true);
          resolve();
        });

        newSocket.once("connect_error", (error) => {
          clearTimeout(timeout);
          setIsConnected(false);
          reject(error);
        });
      });
    } catch (error) {
      console.error("Force reconnect failed:", error);
      throw error;
    } finally {
      setReconnecting(false);
    }
  };

  const contextValue = useMemo(() => ({
    socket,
    isConnected,
    reconnecting,
    forceReconnectSocket,
    connect
  }), [socket, isConnected, reconnecting]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
