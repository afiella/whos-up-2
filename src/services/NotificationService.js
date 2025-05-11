// src/services/NotificationService.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { collection, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

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
    
    try {
      // Get FCM token
      const currentToken = await getToken(messaging, {
        vapidKey: 'BJ2ZCGgAO2qpLxYx_cQpQ4WKd8h8rqFWOWMtRxs_AuX6VjhubAxZnGkZFffB-nfjUXDMlw5vP8D96tQ4YQ0-tA8' // Replace with your VAPID key
      });
      
      if (currentToken) {
        console.log('Token obtained:', currentToken);
        
        // Save token to Firestore with player name and room ID
        await saveTokenToFirestore(currentToken, playerName, roomId);
        return true;
      } else {
        console.log('No registration token available');
        return false;
      }
    } catch (error) {
      console.error('An error occurred while retrieving token:', error);
      return false;
    }
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
};

// Save token to Firestore
const saveTokenToFirestore = async (token, playerName, roomId) => {
  try {
    const playerTokenRef = doc(db, PLAYER_TOKENS_COLLECTION, playerName);
    
    // Check if document already exists
    const docSnap = await getDoc(playerTokenRef);
    
    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(playerTokenRef, {
        token: token,
        roomId: roomId,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create new document
      await setDoc(playerTokenRef, {
        token: token,
        playerName: playerName,
        roomId: roomId,
        createdAt: new Date().toISOString()
      });
    }
    
    console.log('Token saved to Firestore for player:', playerName);
  } catch (error) {
    console.error('Error saving token to Firestore:', error);
  }
};

// Set up foreground message listener
export const setupForegroundMessageListener = (callback) => {
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
};

// Function to show notification manually (for testing)
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
  }
};