// src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, moderator, loading } = useAuth();
  const location = useLocation();
  
  // Show loading while checking auth state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#fff8f0',
        fontFamily: 'Poppins, sans-serif',
        fontSize: '1.25rem',
        color: '#a47148'
      }}>
        Loading...
      </div>
    );
  }
  
  // Not authenticated at all - redirect to staff login
  if (!isAuthenticated || !moderator) {
    return <Navigate to="/staff-login" state={{ from: location }} replace />;
  }
  
  // Admin trying to access moderator dashboard - redirect to admin dashboard
  if (moderator.isAdmin && location.pathname === '/mod-dashboard') {
    return <Navigate to="/admin-dashboard" replace />;
  }
  
  // Non-admin trying to access admin dashboard - redirect to moderator dashboard
  if (!moderator.isAdmin && adminOnly) {
    return <Navigate to="/mod-dashboard" replace />;
  }
  
  // User is authenticated and has proper permissions
  return children;
}