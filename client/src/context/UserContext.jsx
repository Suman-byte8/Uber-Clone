import React, { createContext, useContext, useState, useEffect } from 'react';
import { SocketProvider } from './SocketContext';

// Create a context for user and captain IDs
const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [captainId, setCaptainId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const login = (userData, token, role) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setIsAuthenticated(true);
    
    if (role === 'user') {
      setUserId(userData._id || userData.id);
      localStorage.setItem('userId', userData._id || userData.id);
    } else if (role === 'captain') {
      setCaptainId(userData._id || userData.id);
      localStorage.setItem('captainId', userData._id || userData.id);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('captainId');
    setUser(null);
    setUserId(null);
    setCaptainId(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    // Check for stored authentication data
    const storedUserId = localStorage.getItem('userId');
    const storedCaptainId = localStorage.getItem('captainId');
    const token = localStorage.getItem('token');

    if (token) {
      setIsAuthenticated(true);
      if (storedUserId) {
        setUserId(storedUserId);
      }
      if (storedCaptainId) {
        setCaptainId(storedCaptainId);
      }
    }
    setLoading(false);
  }, []);

  const value = {
    user,
    userId,
    captainId,
    isAuthenticated,
    loading,
    login,
    logout,
    setUser,
    setUserId,
    setCaptainId
  };

  return (
    <UserContext.Provider value={value}>
      <SocketProvider>
        {children}
      </SocketProvider>
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
