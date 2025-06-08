import React from 'react';
import { Navigate } from 'react-router-dom';

const UserProtectedWrapper = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user || user.role !== 'user') {
    return <Navigate to="/" />;
  }

  return children;
};

export default UserProtectedWrapper;
