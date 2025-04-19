import React from 'react';
import { Navigate } from 'react-router-dom';

const CaptainProtectedWrapper = ({ children }) => {
  const token = localStorage.getItem('token');
  const captainId = localStorage.getItem('captainId');

  if (!token || !captainId) {
    return <Navigate to="/captain-login" />;
  }

  return children;
};

export default CaptainProtectedWrapper;