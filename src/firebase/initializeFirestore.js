// src/firebase/initializeFirestore.js
import { db } from './config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

async function initializeRooms() {
  try {
    // Check if BH Room exists
    const bhDoc = await getDoc(doc(db, 'rooms', 'bh'));
    if (!bhDoc.exists()) {
      // Create the BH Room with an empty queue and busyPlayers array
      await setDoc(doc(db, 'rooms', 'bh'), {
        queue: [],
        history: [],
        busyPlayers: [],
        outOfRotationPlayers: [],
        appointmentPlayers: []
      });
    }
    
    // Check if 59 Room exists
    const room59Doc = await getDoc(doc(db, 'rooms', '59'));
    if (!room59Doc.exists()) {
      // Create the 59 Room with an empty queue and busyPlayers array
      await setDoc(doc(db, 'rooms', '59'), {
        queue: [],
        history: [],
        busyPlayers: [],
        outOfRotationPlayers: [],
        appointmentPlayers: []
      });
    }
    
    // Check if Ashland Room exists
    const ashlandDoc = await getDoc(doc(db, 'rooms', 'ashland'));
    if (!ashlandDoc.exists()) {
      // Create the Ashland Room with an empty queue and busyPlayers array
      await setDoc(doc(db, 'rooms', 'ashland'), {
        queue: [],
        history: [],
        busyPlayers: [],
        outOfRotationPlayers: [],
        appointmentPlayers: []
      });
    }
    
    console.log("Rooms initialized successfully with empty queues");
  } catch (error) {
    console.error("Error initializing rooms:", error);
  }
}

export { initializeRooms };