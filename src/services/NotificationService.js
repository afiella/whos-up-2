// src/services/NotificationService.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

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
const messaging = getMessaging(app);
const db = getFirestore(app);

// Collection name for player tokens
const PLAYER_TOKENS_COLLECTION = 'playerTokens';

// Function to request notification permission and get token
export const requestNotificationPermission = async (playerName, roomId) => {
  try {
    // Check if notification permission is granted
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }
    
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }
    
    console.log('Notification permission granted');
    
    // We'll just store this in local storage for now
    localStorage.setItem('notificationsEnabled', 'true');
    
    return true;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
};

// Set up foreground message listener
export const setupForegroundMessageListener = (callback) => {
  // Simple listener for demonstration purposes
  console.log('Notification listener set up');
  
  // This is normally where we'd set up the Firebase onMessage handler,
  // but for simplicity we'll just register it for the notification
  // but the actual notification will be triggered by our queue position check
};

// Function to show notification manually (used directly in RoomPage)
export const showLocalNotification = (title, body) => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return;
  }
  
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: '/logo192.png'
    });
  } else {
    console.log('Notification permission not granted');
    // Try to request permission again for next time
    Notification.requestPermission();
  }
};