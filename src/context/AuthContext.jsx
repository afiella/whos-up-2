// src/context/AuthContext.jsx
import React, { createContext, useState, useContext } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVFT58TjZYb9j9QN6395XlRiYI7ltYWZM",
  authDomain: "whos-up-react.firebaseapp.com",
  projectId: "whos-up-react",
  storageBucket: "whos-up-react.firebasestorage.app",
  messagingSenderId: "62340094431",
  appId: "1:62340094431:web:025a9ee260308bc8674c6a",
  measurementId: "G-GVN0VB5TNY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Create the auth context
export const AuthContext = createContext();

// Admin password - hardcoded
const ADMIN_PASSWORD = 'afiella';

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [moderator, setModerator] = useState(null);
  const [loading, setLoading] = useState(false);

  // Simple admin login - just check password
  const adminLogin = (password) => {
    if (password === ADMIN_PASSWORD) {
      const adminData = {
        username: 'admin',
        displayName: 'Administrator',
        isAdmin: true,
        isModerator: true
      };
      
      setIsAuthenticated(true);
      setModerator(adminData);
      return true;
    }
    return false;
  };

  // Simple moderator login
  const login = async (username, password) => {
    try {
      setLoading(true);
      
      // Check moderators collection in Firestore
      const moderatorsRef = collection(db, 'moderators');
      const q = query(moderatorsRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return false;
      }
      
      const moderatorDoc = querySnapshot.docs[0];
      const moderatorData = moderatorDoc.data();
      
      // Simple password check
      if (moderatorData.password === password) {
        setIsAuthenticated(true);
        setModerator({
          username: moderatorData.username,
          displayName: moderatorData.displayName,
          isAdmin: false,
          isModerator: true,
          assignedRoom: moderatorData.assignedRoom
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setIsAuthenticated(false);
    setModerator(null);
  };

  // Register moderator
  const registerModerator = async (newModerator) => {
    try {
      if (!moderator?.isAdmin) {
        return { success: false, message: 'Only admins can add moderators' };
      }
      
      const newModId = `mod_${Date.now()}`;
      await setDoc(doc(db, 'moderators', newModId), {
        username: newModerator.username,
        displayName: newModerator.displayName,
        email: newModerator.email,
        password: newModerator.password,
        assignedRoom: newModerator.assignedRoom,
        createdAt: new Date().toISOString()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: 'An error occurred' };
    }
  };

  // Fetch moderators
  const fetchModerators = async () => {
    try {
      if (!moderator?.isAdmin) return [];
      
      const moderatorsList = [{
        id: 'admin',
        username: 'admin',
        displayName: 'Administrator',
        isAdmin: true
      }];
      
      const querySnapshot = await getDocs(collection(db, 'moderators'));
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        moderatorsList.push({
          id: doc.id,
          username: data.username,
          displayName: data.displayName,
          isAdmin: false,
          assignedRoom: data.assignedRoom
        });
      });
      
      return moderatorsList;
    } catch (error) {
      console.error('Fetch error:', error);
      return [];
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      moderator,
      login,
      adminLogin,
      logout,
      registerModerator,
      fetchModerators,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}