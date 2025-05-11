// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Cloud Function that triggers when a room document changes
 * Sends push notifications when players move to the first position in queue
 */
exports.queuePositionNotifications = functions.firestore
  .document('rooms/{roomId}')
  .onUpdate(async (change, context) => {
    const roomId = context.params.roomId;
    
    // Get data before and after update
    const dataAfter = change.after.data();
    const dataBefore = change.before.data();
    
    // Get queues before and after
    const queueBefore = dataBefore.queue || [];
    const queueAfter = dataAfter.queue || [];
    
    // If queues are the same, no need to continue
    if (JSON.stringify(queueBefore) === JSON.stringify(queueAfter)) {
      return null;
    }
    
    // Function to determine who's moved to first position
    const getNewFirstPosition = () => {
      // If both queues are empty, no one moved to first
      if (queueBefore.length === 0 && queueAfter.length === 0) {
        return null;
      }
      
      // If the after queue is empty, no one is in first position
      if (queueAfter.length === 0) {
        return null;
      }
      
      // Get first player in new queue
      const firstPlayerAfter = queueAfter[0];
      
      // If there was no queue before or the first player changed
      if (queueBefore.length === 0 || queueBefore[0] !== firstPlayerAfter) {
        return firstPlayerAfter;
      }
      
      return null;
    };
    
    // Get player who moved to first position (if any)
    const playerToNotify = getNewFirstPosition();
    
    // If no player to notify, exit
    if (!playerToNotify) {
      return null;
    }
    
    try {
      // Get player's FCM token from playerTokens collection
      const playerTokenDoc = await admin.firestore()
        .collection('playerTokens')
        .doc(playerToNotify)
        .get();
      
      if (!playerTokenDoc.exists) {
        console.log(`No token found for player: ${playerToNotify}`);
        return null;
      }
      
      const playerData = playerTokenDoc.data();
      const token = playerData.token;
      
      // Get room name for notification
      let roomName = roomId;
      if (roomId === 'bh') roomName = 'BH Room';
      else if (roomId === '59') roomName = '59 Room';
      else if (roomId === 'ashland') roomName = 'Ashland Room';
      
      // Create notification message
      const message = {
        token: token,
        notification: {
          title: "You're Up Next!",
          body: `It's your turn in the ${roomName} queue!`
        },
        data: {
          roomId: roomId,
          click_action: 'FLUTTER_NOTIFICATION_CLICK' // For Flutter apps
        },
        // Android specific configuration
        android: {
          notification: {
            icon: 'stock_ticker_update',
            color: '#d67b7b',
            priority: 'high',
            sound: 'default'
          }
        },
        // iOS specific configuration
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        },
        // Set high priority for all platforms
        webpush: {
          notification: {
            icon: '/logo192.png',
            badge: '/logo192.png'
          }
        }
      };
      
      // Send message
      const response = await admin.messaging().send(message);
      console.log(`Successfully sent notification to ${playerToNotify}:`, response);
      
      return response;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  });

/**
 * HTTP function for sending test notifications (for development)
 */
exports.sendTestNotification = functions.https.onCall(async (data, context) => {
  const { playerName, roomId } = data;
  
  if (!playerName) {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'Player name is required'
    );
  }
  
  try {
    // Get player's FCM token
    const playerTokenDoc = await admin.firestore()
      .collection('playerTokens')
      .doc(playerName)
      .get();
    
    if (!playerTokenDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        `No token found for player: ${playerName}`
      );
    }
    
    const playerData = playerTokenDoc.data();
    const token = playerData.token;
    
    // Get room name
    let roomName = roomId || 'test';
    if (roomId === 'bh') roomName = 'BH Room';
    else if (roomId === '59') roomName = '59 Room';
    else if (roomId === 'ashland') roomName = 'Ashland Room';
    
    // Create notification message
    const message = {
      token: token,
      notification: {
        title: "Test Notification",
        body: `This is a test notification for ${roomName}`
      }
    };
    
    // Send message
    const response = await admin.messaging().send(message);
    console.log(`Test notification sent to ${playerName}:`, response);
    
    return { success: true, message: 'Notification sent' };
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});