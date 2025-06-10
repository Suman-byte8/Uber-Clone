import React, { createContext, useContext, useState, useEffect } from 'react';
import { SocketProvider } from './SocketContext';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [captainId, setCaptainId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null); // Add role state

  useEffect(() => {
    // Check for stored authentication data on mount
    const loadStoredAuth = () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const storedUserId = localStorage.getItem('userId');
        const storedCaptainId = localStorage.getItem('captainId');
        const storedRole = localStorage.getItem('userRole');
        const token = localStorage.getItem('token');

        if (token && (storedUser || storedUserId || storedCaptainId)) {
          setUser(storedUser);
          setUserId(storedUserId);
          setCaptainId(storedCaptainId);
          setUserRole(storedRole);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error loading stored auth:', error);
        // Clear potentially corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        localStorage.removeItem('captainId');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
      } finally {
        setLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const login = (userData, token, role) => {
    try {
      // Store all auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userRole', role);
      
      if (role === 'user') {
        localStorage.setItem('userId', userData._id || userData.id);
        setUserId(userData._id || userData.id);
      } else if (role === 'captain') {
        localStorage.setItem('captainId', userData._id || userData.id);
        setCaptainId(userData._id || userData.id);
      }

      setUser(userData);
      setUserRole(role);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const logout = () => {
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('captainId');
    localStorage.removeItem('userRole');
    
    // Reset state
    setUser(null);
    setUserId(null);
    setCaptainId(null);
    setUserRole(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    userId,
    captainId,
    isAuthenticated,
    loading,
    userRole, // Include role in context
    login,
    logout,
    setUser,
    setUserId,
    setCaptainId
  };

  return (
    <UserContext.Provider value={value}>
      <SocketProvider>
        {!loading && children}
      </SocketProvider>
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
