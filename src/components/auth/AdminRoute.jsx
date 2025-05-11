// src/components/auth/AdminRoute.jsx
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminRoute({ children }) {
  const { isAuthenticated, moderator, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (!loading) {
      // Add a small delay to prevent flickering
      const timeout = setTimeout(() => {
        setIsReady(true);
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [loading]);
  
  // Show loading while checking auth state
  if (!isReady || loading) {
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
        <div>
          <div style={{ marginBottom: '1rem' }}>Loading...</div>
          <div style={{ fontSize: '2rem', textAlign: 'center' }}>👑</div>
        </div>
      </div>
    );
  }
  
  // Not authenticated at all - go to admin login
  if (!isAuthenticated || !moderator) {
    return <Navigate to="/admin-login" replace />;
  }
  
  // Authenticated but not admin - go to moderator dashboard
  if (!moderator.isAdmin) {
    return <Navigate to="/mod-dashboard" replace />;
  }
  
  // Is admin - render children
  return children;
}