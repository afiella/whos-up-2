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
        <div style={{ textAlign: 'center' }}>
          <div>Loading...</div>
          {adminOnly && <div style={{ marginTop: '0.5rem', fontSize: '1rem' }}>Verifying admin access...</div>}
        </div>
      </div>
    );
  }
  
  // Not authenticated at all - redirect to staff login
  if (!isAuthenticated || !moderator) {
    return <Navigate to="/staff-login" state={{ from: location }} replace />;
  }
  
  // Check if this is an admin-only route and user is not admin
  if (adminOnly && !moderator.isAdmin) {
    return <Navigate to="/mod-dashboard" state={{ from: location }} replace />;
  }
  
  // User is authenticated and has proper permissions
  return children;
}