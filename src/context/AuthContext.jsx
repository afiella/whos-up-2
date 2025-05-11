// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where
} from 'firebase/firestore';

// Firebase configuration - Your Firebase project details
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
const auth = getAuth(app);
const db = getFirestore(app);

// Create the auth context
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  // State to track if user is authenticated as moderator/admin
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // State to store moderator info
  const [moderator, setModerator] = useState(null);
  // Loading state for Firebase operations
  const [loading, setLoading] = useState(true);

  // Debug state changes
  useEffect(() => {
    console.log('AuthContext State Update:', {
      isAuthenticated,
      moderator,
      loading
    });
  }, [isAuthenticated, moderator, loading]);

  // Check for existing authentication on initial load
  useEffect(() => {
    console.log("Setting up auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed. User:", user ? user.email : 'null');
      
      if (user) {
        console.log("User is signed in:", user.email);
        try {
          // First check if user is the admin
          console.log("Checking admin collection...");
          const adminDoc = await getDoc(doc(db, 'admin', 'admin'));
          
          if (adminDoc.exists()) {
            console.log("Admin document found");
            const adminData = adminDoc.data();
            console.log("Admin data:", adminData);
            
            // Check if this user is the admin
            if (adminData.email === user.email) {
              console.log("User is admin - setting states");
              
              const adminUser = {
                uid: user.uid,
                email: user.email,
                username: adminData.username || 'admin',
                displayName: adminData.displayName || 'Admin',
                isAdmin: true,
                isModerator: true,
                assignedRoom: null
              };
              
              setModerator(adminUser);
              setIsAuthenticated(true);
              setLoading(false);
              
              console.log("Admin state set:", adminUser);
              return; // Exit early if admin
            }
          }
          
          console.log("Not admin, checking moderators collection...");
          // Check if user is in the moderators collection
          const moderatorsRef = collection(db, 'moderators');
          const q = query(moderatorsRef, where('email', '==', user.email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            console.log("Moderator document found");
            const moderatorDoc = querySnapshot.docs[0];
            const moderatorData = moderatorDoc.data();
            
            const moderatorUser = {
              uid: user.uid,
              email: user.email,
              username: moderatorData.username,
              displayName: moderatorData.displayName,
              isAdmin: moderatorData.isAdmin || false,
              isModerator: true,
              assignedRoom: moderatorData.assignedRoom || null
            };
            
            setModerator(moderatorUser);
            setIsAuthenticated(true);
            console.log("Moderator state set:", moderatorUser);
          } else {
            console.log("User not found in moderators collection");
            // User exists in Authentication but not in Firestore
            await signOut(auth);
            setIsAuthenticated(false);
            setModerator(null);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          setIsAuthenticated(false);
          setModerator(null);
        }
      } else {
        console.log("No user is signed in");
        setIsAuthenticated(false);
        setModerator(null);
      }
      
      console.log("Setting loading to false");
      setLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // ADMIN LOGIN function - separate from moderator login
  const adminLogin = async (password) => {
    try {
      console.log('adminLogin: Starting...');
      setLoading(true);
      
      // Get admin document from Firestore
      const adminDoc = await getDoc(doc(db, 'admin', 'admin'));
      
      if (!adminDoc.exists()) {
        console.log('adminLogin: Admin document not found');
        setLoading(false);
        return false;
      }
      
      const adminData = adminDoc.data();
      const adminEmail = adminData.email;
      
      console.log('adminLogin: Admin document found:', adminData);
      console.log('adminLogin: Using email:', adminEmail);
      
      if (!adminEmail) {
        console.log('adminLogin: Admin email not found in document');
        setLoading(false);
        return false;
      }
      
      // Attempt to sign in with admin credentials
      try {
        console.log('adminLogin: Attempting Firebase sign in...');
        const userCredential = await signInWithEmailAndPassword(auth, adminEmail, password);
        console.log('adminLogin: Sign in successful!', userCredential.user.email);
        
        // The onAuthStateChanged listener will handle setting the state
        // Just return true here
        return true;
      } catch (signInError) {
        console.error('adminLogin: Sign-in error:', signInError.code, signInError.message);
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('adminLogin: Unexpected error:', error);
      setLoading(false);
      return false;
    }
  };

  // MODERATOR LOGIN function - separate from admin login
  const login = async (username, password) => {
    try {
      setLoading(true);
      console.log('Attempting moderator login with username:', username);
      
      // Check moderators collection
      const moderatorsRef = collection(db, 'moderators');
      const q = query(moderatorsRef, where('username', '==', username));
      console.log('Querying moderators collection for username:', username);
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('No moderator found with this username');
        setLoading(false);
        return false;
      }
      
      // Get the user's email from the Firestore document
      const moderatorDoc = querySnapshot.docs[0];
      const moderatorData = moderatorDoc.data();
      const email = moderatorData.email;
      
      console.log('Moderator found with email:', email);
      
      if (!email) {
        console.log('Email not found for moderator');
        setLoading(false);
        return false;
      }
      
      // Now sign in with email and password
      try {
        console.log('Signing in with email and password...');
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Moderator login successful!');
        
        // The onAuthStateChanged listener will handle setting the state
        return true;
      } catch (signInError) {
        console.error('Moderator sign-in error:', signInError.code, signInError.message);
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      console.log('Logging out...');
      await signOut(auth);
      console.log('Logout successful');
      // Explicitly clear state
      setIsAuthenticated(false);
      setModerator(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Register a new moderator with room assignment
  const registerModerator = async (newModerator) => {
    try {
      setLoading(true);
      console.log('Registering new moderator:', newModerator.username);
      
      // Check if current user is admin
      if (!moderator?.isAdmin) {
        console.log('Only admins can add moderators');
        return { success: false, message: 'Only admins can add moderators' };
      }
      
      // Check if username already exists
      console.log('Checking if username already exists:', newModerator.username);
      const moderatorsRef = collection(db, 'moderators');
      const q = query(moderatorsRef, where('username', '==', newModerator.username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        console.log('Username already exists');
        return { success: false, message: 'Username already exists' };
      }
      
      // Check if email already exists
      const emailQuery = query(moderatorsRef, where('email', '==', newModerator.email));
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        console.log('Email already exists');
        return { success: false, message: 'Email already exists' };
      }
      
      // Create the user in Firebase Authentication
      try {
        console.log('Creating user in Firebase Authentication:', newModerator.email);
        // Create the user with email and password
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          newModerator.email,
          newModerator.password
        );
        
        const uid = userCredential.user.uid;
        console.log('User created with UID:', uid);
        
        // Store moderator in Firestore with room assignment
        console.log('Storing moderator in Firestore...');
        await setDoc(doc(db, 'moderators', uid), {
          username: newModerator.username,
          displayName: newModerator.displayName,
          email: newModerator.email,
          isModerator: true,
          isAdmin: false,
          assignedRoom: newModerator.assignedRoom, // Add room assignment
          createdAt: new Date().toISOString()
        });
        
        console.log('Moderator registered successfully');
        return { success: true };
      } catch (authError) {
        console.error('Firebase Auth error:', authError);
        return {
          success: false,
          message: authError.message || 'Failed to create user account'
        };
      }
    } catch (error) {
      console.error('Register moderator error:', error);
      return { success: false, message: 'An error occurred' };
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch all moderators (admin only)
  const fetchModerators = async () => {
    try {
      setLoading(true);
      console.log('Fetching moderators...');
      
      // Check if current user is admin
      if (!moderator?.isAdmin) {
        console.log('Only admins can fetch moderators');
        return [];
      }
      
      const moderatorsList = [];
      
      // Get admin user
      console.log('Getting admin from Firestore...');
      const adminDoc = await getDoc(doc(db, 'admin', 'admin'));
      if (adminDoc.exists()) {
        const data = adminDoc.data();
        console.log('Admin found:', data.username);
        moderatorsList.push({
          id: 'admin',
          username: data.username,
          displayName: data.displayName,
          email: data.email,
          isModerator: data.isModerator,
          isAdmin: true,
          assignedRoom: null // Admin has access to all rooms
        });
      }
      
      // Get all moderators
      console.log('Getting moderators from Firestore...');
      const moderatorsRef = collection(db, 'moderators');
      const querySnapshot = await getDocs(moderatorsRef);
      
      console.log('Found', querySnapshot.size, 'moderators');
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Exclude sensitive information like passwords
        moderatorsList.push({
          id: doc.id,
          username: data.username,
          displayName: data.displayName,
          email: data.email,
          isModerator: data.isModerator,
          isAdmin: data.isAdmin || false,
          assignedRoom: data.assignedRoom || null
        });
      });
      
      console.log('Returning', moderatorsList.length, 'moderators (including admin)');
      return moderatorsList;
    } catch (error) {
      console.error('Fetch moderators error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  console.log('AuthContext render, current state:', { isAuthenticated, moderator, loading });

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      moderator,
      login,       // For moderator login
      adminLogin,  // For admin login
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