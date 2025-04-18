import React, { createContext, useContext, useState, useEffect } from 'react';

// Create a context for user and captain IDs
const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [captainId, setCaptainId] = useState(localStorage.getItem('captainId'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  const login = (token, id, role) => {
    localStorage.setItem('token', token);
    if (role === 'user') {
      localStorage.setItem('userId', id);
      setUserId(id);
    } else {
      localStorage.setItem('captainId', id);
      setCaptainId(id);
    }
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('captainId');
    setUserId(null);
    setCaptainId(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    // Check token on mount
    const token = localStorage.getItem('token');
    if (!token) {
      logout();
    }
  }, []);

  return (
    <UserContext.Provider value={{
      userId,
      captainId,
      isAuthenticated,
      login,
      logout,
    }}>
      {children}
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
