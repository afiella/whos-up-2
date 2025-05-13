// src/utils/roomUtils.js
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Clears all players and data from a room
 * @param {string} roomId - The ID of the room to clear
 * @param {boolean} keepHistory - Whether to keep the history (default: false)
 * @returns {Promise<boolean>} - Success status
 */
export const clearRoom = async (roomId, keepHistory = false) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    
    // Prepare the update object
    const updateData = {
      queue: [],
      outOfRotationPlayers: [],
      busyPlayers: []
    };
    
    // Clear history if not keeping it
    if (!keepHistory) {
      updateData.history = [];
    }
    
    // Update the room
    await updateDoc(roomRef, updateData);
    
    console.log(`Room ${roomId} cleared successfully`);
    return true;
  } catch (error) {
    console.error(`Error clearing room ${roomId}:`, error);
    return false;
  }
};