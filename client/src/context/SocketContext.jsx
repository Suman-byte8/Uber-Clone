import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const socket = useContext(SocketContext);
  if (socket === undefined) {
      throw new Error('useSocket must be used within a SocketProvider');
  }
  return socket;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const serverUrl = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem("token");
      setToken(newToken);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!token || !serverUrl) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(serverUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setSocket(newSocket);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setSocket(null);
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [token, serverUrl]);

  const contextValue = useMemo(() => socket, [socket]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
