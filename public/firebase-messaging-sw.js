// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDVFT58TjZYb9j9QN6395XlRiYI7ltYWZM",
  authDomain: "whos-up-react.firebaseapp.com",
  projectId: "whos-up-react",
  storageBucket: "whos-up-react.firebasestorage.app",
  messagingSenderId: "62340094431",
  appId: "1:62340094431:web:025a9ee260308bc8674c6a",
  measurementId: "G-GVN0VB5TNY"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png'
  };
  
  self.registration.showNotification(notificationTitle, notificationOptions);
});