import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext'; // Adjust path as necessary

const PrivateRoute = ({ element, isProtected = true }) => {
  const { isAuthenticated } = useAuth(); // Assume this returns true if authenticated

  // Redirect to login if trying to access a protected route without being authenticated
  if (isProtected && !isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Redirect to dashboard if authenticated and trying to access login
  if (!isProtected && isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return element; // Render the component if checks pass
};

export default PrivateRoute;
