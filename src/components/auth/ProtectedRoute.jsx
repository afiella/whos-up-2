// src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
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
  
  // Not authenticated at all
  if (!isAuthenticated || !moderator) {
    return <Navigate to="/mod-login" />;
  }
  
  // Route requires admin but user is not admin
  if (adminOnly && !moderator.isAdmin) {
    return <Navigate to="/mod-dashboard" />;
  }
  
  // All checks passed
  return children;
}