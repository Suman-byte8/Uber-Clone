import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useUserContext } from './UserContext';
import jwt_decode from 'jwt-decode';

const AuthWrapper = ({ children, requiredRole }) => {
  const navigate = useNavigate();
  const { userId, captainId, logout } = useUserContext();
  
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        logout();
        return;
      }

      try {
        const decodedToken = jwt_decode(token);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp < currentTime) {
          // Token has expired
          logout();
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('captainId');
          navigate(requiredRole === 'user' ? '/user-login' : '/captain-login');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        logout();
      }
    };

    // Check immediately and then every minute
    checkAuth();
    const interval = setInterval(checkAuth, 60000);

    return () => clearInterval(interval);
  }, [logout, navigate, requiredRole]);

  if (!localStorage.getItem('token')) {
    return <Navigate to={requiredRole === 'user' ? '/user-login' : '/captain-login'} />;
  }

  if (requiredRole === 'user' && !userId) {
    return <Navigate to="/user-login" />;
  }

  if (requiredRole === 'captain' && !captainId) {
    return <Navigate to="/captain-login" />;
  }

  return children;
};

export default AuthWrapper; 