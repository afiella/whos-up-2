// src/firebase/initializeFirestore.js
import { db } from './config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

async function initializeRooms() {
  try {
    // Check if BH Room exists
    const bhDoc = await getDoc(doc(db, 'rooms', 'bh'));
    if (!bhDoc.exists()) {
      // Create the BH Room with empty arrays
      await setDoc(doc(db, 'rooms', 'bh'), {
        queue: [],
        history: [],  // This will store our history entries
        busyPlayers: [], // Repurposed for appointment players
        outOfRotationPlayers: []
      });
    }
    
    // Check if 59 Room exists
    const room59Doc = await getDoc(doc(db, 'rooms', '59'));
    if (!room59Doc.exists()) {
      await setDoc(doc(db, 'rooms', '59'), {
        queue: [],
        history: [],  // This will store our history entries
        busyPlayers: [], // Repurposed for appointment players
        outOfRotationPlayers: []
      });
    }
    
    // Check if Ashland Room exists
    const ashlandDoc = await getDoc(doc(db, 'rooms', 'ashland'));
    if (!ashlandDoc.exists()) {
      await setDoc(doc(db, 'rooms', 'ashland'), {
        queue: [],
        history: [],  // This will store our history entries
        busyPlayers: [], // Repurposed for appointment players
        outOfRotationPlayers: []
      });
    }
    
    console.log("Rooms initialized successfully with empty queues");
  } catch (error) {
    console.error("Error initializing rooms:", error);
  }
}

export { initializeRooms };