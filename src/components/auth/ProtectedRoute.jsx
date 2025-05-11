// src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, moderator } = useAuth();
  
  // Not logged in at all
  if (!isAuthenticated) {
    return <Navigate to="/mod-login" replace />;
  }
  
  // Admin-only route but user is not admin
  if (adminOnly && !moderator?.isAdmin) {
    return <Navigate to="/mod-dashboard" replace />;
  }
  
  // User has proper access
  return children;
}