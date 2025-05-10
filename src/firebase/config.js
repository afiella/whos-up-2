import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration //
const firebaseConfig = {
    apiKey: "AIzaSyDVFT58TjZYb9j9QN6395XlRiYI7ltYWZM",
    authDomain: "whos-up-react.firebaseapp.com",
    projectId: "whos-up-react",
    storageBucket: "whos-up-react.firebasestorage.app",
    messagingSenderId: "62340094431",
    appId: "1:62340094431:web:025a9ee260308bc8674c6a",
    measurementId: "G-GVN0VB5TNY"
  };
  
  // Initialize Firebase //
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  export { db };