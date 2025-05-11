// src/firebase/setupAdmin.js
import { db } from './config';
import { doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Run this script once to set up your admin user
async function setupAdmin() {
  try {
    const auth = getAuth();
    
    // Admin credentials
    const adminUsername = 'admin';
    const adminPassword = 'afiella'; // Change this to your desired admin password
    const adminEmail = 'admin@whosup.com'; // A unique email for the admin
    
    // First, create the user in Firebase Authentication
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        adminEmail, 
        adminPassword
      );
      console.log('Admin user created in Firebase Auth:', userCredential.user.uid);
    } catch (authError) {
      if (authError.code === 'auth/email-already-in-use') {
        console.log('Admin user already exists in Auth');
      } else {
        throw authError;
      }
    }
    
    // Create the admin document in Firestore
    const adminData = {
      username: adminUsername,
      displayName: 'Administrator',
      email: adminEmail,
      isAdmin: true,
      isModerator: true,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'admin', 'admin'), adminData);
    console.log('Admin document created successfully!');
    
    console.log('\nAdmin credentials:');
    console.log('Username:', adminUsername);
    console.log('Password:', adminPassword);
    console.log('Email:', adminEmail);
    
  } catch (error) {
    console.error('Error setting up admin:', error);
  }
}

// Run the setup
setupAdmin();