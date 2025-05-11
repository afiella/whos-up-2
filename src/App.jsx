// src/App.jsx
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/public/LandingPage';
import RoomSelectPage from './pages/public/RoomSelectPage';
import AdminLoginPage from './pages/public/AdminLoginPage';
import ModeratorLoginPage from './pages/public/ModeratorLoginPage';
import ModeratorDashboard from './pages/protected/ModeratorDashboard';
import AdminDashboard from './pages/protected/AdminDashboard';
import BHPage from './pages/rooms/BHPage';
import FiftyNinePage from './pages/rooms/FiftyNinePage';
import AshlandPage from './pages/rooms/AshlandPage';
import { AuthProvider } from './context/AuthContext';
import { initializeRooms } from './firebase/initializeFirestore';
import ProtectedRoute from './components/auth/ProtectedRoute';

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
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/mod-login" element={<ModeratorLoginPage />} />
          
          {/* Protected routes */}
          <Route 
            path="/mod-dashboard" 
            element={
              <ProtectedRoute>
                <ModeratorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Room routes */}
          <Route path="/bh" element={<BHPage />} />
          <Route path="/59" element={<FiftyNinePage />} />
          <Route path="/ashland" element={<AshlandPage />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}