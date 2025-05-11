// src/components/auth/AdminRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminRoute({ children }) {
  const { isAuthenticated, moderator, loading } = useAuth();
  
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
  
  // Not authenticated at all - go to admin login
  if (!isAuthenticated || !moderator) {
    return <Navigate to="/admin-login" />;
  }
  
  // Authenticated but not admin - don't allow access
  if (!moderator.isAdmin) {
    return <Navigate to="/mod-dashboard" />;
  }
  
  // Is admin - allow access
  return children;
}