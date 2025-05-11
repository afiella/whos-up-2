// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';

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

// Simple password for admin (you can change this)
const ADMIN_PASSWORD = 'afiella';

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [moderator, setModerator] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const savedAuth = localStorage.getItem('whosUpAuth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        setIsAuthenticated(true);
        setModerator(authData);
      } catch (error) {
        console.error('Error parsing saved auth:', error);
        localStorage.removeItem('whosUpAuth');
      }
    }
  }, []);

  // Simple admin login - just check password
  const adminLogin = async (password) => {
    try {
      setLoading(true);
      
      // Simple password check
      if (password === afiella) {
        const adminData = {
          username: 'admin',
          displayName: 'Administrator',
          email: 'admin@whosup.com',
          isAdmin: true,
          isModerator: true,
          assignedRoom: null
        };
        
        // Save to state and localStorage
        setIsAuthenticated(true);
        setModerator(adminData);
        localStorage.setItem('whosUpAuth', JSON.stringify(adminData));
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Admin login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Simple moderator login - check username/password in Firestore
  const login = async (username, password) => {
    try {
      setLoading(true);
      
      // Check moderators collection
      const moderatorsRef = collection(db, 'moderators');
      const q = query(moderatorsRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return false;
      }
      
      const moderatorDoc = querySnapshot.docs[0];
      const moderatorData = moderatorDoc.data();
      
      // Simple password check (stored in plain text - not secure for production!)
      if (moderatorData.password === password) {
        const userData = {
          username: moderatorData.username,
          displayName: moderatorData.displayName,
          email: moderatorData.email,
          isAdmin: false,
          isModerator: true,
          assignedRoom: moderatorData.assignedRoom
        };
        
        setIsAuthenticated(true);
        setModerator(userData);
        localStorage.setItem('whosUpAuth', JSON.stringify(userData));
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setIsAuthenticated(false);
    setModerator(null);
    localStorage.removeItem('whosUpAuth');
  };

  // Register a new moderator (simplified)
  const registerModerator = async (newModerator) => {
    try {
      setLoading(true);
      
      if (!moderator?.isAdmin) {
        return { success: false, message: 'Only admins can add moderators' };
      }
      
      // Check if username already exists
      const moderatorsRef = collection(db, 'moderators');
      const q = query(moderatorsRef, where('username', '==', newModerator.username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return { success: false, message: 'Username already exists' };
      }
      
      // Create new moderator document (storing password in plain text - not secure!)
      const newModId = `mod_${Date.now()}`;
      await setDoc(doc(db, 'moderators', newModId), {
        username: newModerator.username,
        displayName: newModerator.displayName,
        email: newModerator.email,
        password: newModerator.password, // Not secure - just for simplicity
        isModerator: true,
        isAdmin: false,
        assignedRoom: newModerator.assignedRoom,
        createdAt: new Date().toISOString()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Register moderator error:', error);
      return { success: false, message: 'An error occurred' };
    } finally {
      setLoading(false);
    }
  };

  // Fetch all moderators (admin only)
  const fetchModerators = async () => {
    try {
      setLoading(true);
      
      if (!moderator?.isAdmin) {
        return [];
      }
      
      const moderatorsList = [];
      
      // Add admin to the list
      moderatorsList.push({
        id: 'admin',
        username: 'admin',
        displayName: 'Administrator',
        email: 'admin@whosup.com',
        isAdmin: true,
        assignedRoom: null
      });
      
      // Get all moderators
      const moderatorsRef = collection(db, 'moderators');
      const querySnapshot = await getDocs(moderatorsRef);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        moderatorsList.push({
          id: doc.id,
          username: data.username,
          displayName: data.displayName,
          email: data.email,
          isAdmin: false,
          isModerator: true,
          assignedRoom: data.assignedRoom
        });
      });
      
      return moderatorsList;
    } catch (error) {
      console.error('Fetch moderators error:', error);
      return [];
    } finally {
      setLoading(false);
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

// Hook for easy context usage
export function useAuth() {
  return React.useContext(AuthContext);
}