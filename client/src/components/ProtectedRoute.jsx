import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, userId, captainId } = useUserContext();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if the user has the required role
  if (requiredRole === 'user' && !userId) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'captain' && !captainId) {
    return <Navigate to="/captain/login" replace />;
  }

  return children;
};

export default ProtectedRoute; 