// src/App.jsx
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/public/LandingPage';
import RoomSelectPage from './pages/public/RoomSelectPage';
import ModeratorLoginPage from './pages/public/ModeratorLoginPage';
import AdminLoginPage from './pages/public/AdminLoginPage';
import ModeratorDashboard from './pages/protected/ModeratorDashboard';
import { AuthProvider } from './context/AuthContext';
import { initializeRooms } from './firebase/initializeFirestore';
import AdminDashboard from './pages/protected/AdminDashboard';

export default function App() {
  // Initialize Firestore collections on app start
  useEffect(() => {
    initializeRooms();
  }, []);

  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/select" element={<RoomSelectPage />} />
          <Route path="/mod-login" element={<ModeratorLoginPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          
          {/* Protected routes */}
          <Route path="/mod-dashboard" element={<ModeratorDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}