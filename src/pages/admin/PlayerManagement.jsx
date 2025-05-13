// src/pages/admin/PlayerManagement.jsx
import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { db } from '../../firebase/config';
import { doc, onSnapshot, updateDoc, arrayRemove, getDoc } from 'firebase/firestore';

export default function PlayerManagement() {
  const [rooms, setRooms] = useState({
    bh: { queue: [], outOfRotationPlayers: [], busyPlayers: [] },
    '59': { queue: [], outOfRotationPlayers: [], busyPlayers: [] },
    ashland: { queue: [], outOfRotationPlayers: [], busyPlayers: [] }
  });
  const [selectedRoom, setSelectedRoom] = useState('bh');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  
  // Fetch room data
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const roomsData = {};
        
        // Fetch data for each room
        for (const roomId of ['bh', '59', 'ashland']) {
          const roomDoc = await getDoc(doc(db, 'rooms', roomId));
          if (roomDoc.exists()) {
            roomsData[roomId] = roomDoc.data();
          } else {
            roomsData[roomId] = { queue: [], outOfRotationPlayers: [], busyPlayers: [] };
          }
        }
        
        setRooms(roomsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching room data:", error);
        setError("Failed to load room data");
        setLoading(false);
      }
    };
    
    fetchRoomData();
    
    // Set up real-time updates for each room
    const unsubscribes = [];
    
    for (const roomId of ['bh', '59', 'ashland']) {
      const roomRef = doc(db, 'rooms', roomId);
      const unsubscribe = onSnapshot(roomRef, (doc) => {
        if (doc.exists()) {
          setRooms(prev => ({
            ...prev,
            [roomId]: doc.data()
          }));
        }
      });
      
      unsubscribes.push(unsubscribe);
    }
    
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);
  
  // Handle player removal from a queue
  const handleRemoveFromQueue = async (roomId, playerName) => {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        queue: arrayRemove(playerName)
      });
      
      setActionMessage(`Removed ${playerName} from ${roomId} queue`);
      setMessageType('success');
      
      setTimeout(() => {
        setActionMessage('');
      }, 3000);
    } catch (error) {
      console.error("Error removing player from queue:", error);
      setActionMessage(`Error removing player: ${error.message}`);
      setMessageType('error');
    }
  };
  
  // Handle player removal from out of rotation
  const handleRemoveFromOutOfRotation = async (roomId, playerName) => {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        outOfRotationPlayers: arrayRemove(playerName)
      });
      
      setActionMessage(`Removed ${playerName} from ${roomId} out of rotation`);
      setMessageType('success');
      
      setTimeout(() => {
        setActionMessage('');
      }, 3000);
    } catch (error) {
      console.error("Error removing player from out of rotation:", error);
      setActionMessage(`Error removing player: ${error.message}`);
      setMessageType('error');
    }
  };
  
  // Handle player removal from busy (appointment) list
  const handleRemoveFromAppointment = async (roomId, playerData) => {
    try {
      // Get current busyPlayers
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnapshot = await getDoc(roomRef);
      
      if (roomSnapshot.exists()) {
        const currentBusyPlayers = roomSnapshot.data().busyPlayers || [];
        let playerName;
        
        // Handle both string and object formats
        if (typeof playerData === 'object') {
          playerName = playerData.name;
        } else {
          playerName = playerData;
        }
        
        // Filter out the player to remove
        const updatedBusyPlayers = currentBusyPlayers.filter(item => {
          if (typeof item === 'object') {
            return item.name !== playerName;
          }
          return item !== playerName;
        });
        
        // Update with new array
        await updateDoc(roomRef, {
          busyPlayers: updatedBusyPlayers
        });
        
        setActionMessage(`Removed ${playerName} from ${roomId} appointments`);
        setMessageType('success');
        
        setTimeout(() => {
          setActionMessage('');
        }, 3000);
      } else {
        throw new Error("Room not found");
      }
    } catch (error) {
      console.error("Error removing player from appointment:", error);
      setActionMessage(`Error removing player: ${error.message}`);
      setMessageType('error');
    }
  };
  
  // Handle clearing a room entirely
  const handleClearRoom = async (roomId) => {
    if (window.confirm(`Are you sure you want to clear all players from ${roomDisplayNames[roomId]}?`)) {
      try {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
          queue: [],
          outOfRotationPlayers: [],
          busyPlayers: []
        });
        
        setActionMessage(`Cleared all players from ${roomDisplayNames[roomId]}`);
        setMessageType('success');
        
        setTimeout(() => {
          setActionMessage('');
        }, 3000);
      } catch (error) {
        console.error("Error clearing room:", error);
        setActionMessage(`Error clearing room: ${error.message}`);
        setMessageType('error');
      }
    }
  };
  
  // Styling
  const container = css`
    background-color: white;
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  `;
  
  const title = css`
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 1.25rem;
    color: #4b3b2b;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `;
  
  const roomTabs = css`
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
  `;
  
  const roomTab = css`
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-family: Poppins, sans-serif;
    transition: all 0.2s;
    
    &.active {
      background-color: #d67b7b;
      color: white;
    }
    
    &:hover:not(.active) {
      background-color: #f6dfdf;
    }
  `;
  
  const sectionTitle = css`
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 1rem;
    color: #4b3b2b;
    margin: 1.5rem 0 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  
  const clearButton = css`
    background-color: #b71c1c;
    color: white;
    border: none;
    border-radius: 0.5rem;
    padding: 0.25rem 0.75rem;
    font-family: Poppins, sans-serif;
    font-size: 0.75rem;
    cursor: pointer;
    
    &:hover {
      background-color: #8e0000;
    }
  `;
  
  const playerList = css`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  `;
  
  const playerItem = css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background-color: #f6f6f6;
    border-radius: 0.5rem;
    font-family: Poppins, sans-serif;
  `;
  
  const actionButton = css`
    background-color: #d67b7b;
    color: white;
    border: none;
    border-radius: 0.5rem;
    padding: 0.25rem 0.75rem;
    font-family: Poppins, sans-serif;
    font-size: 0.75rem;
    cursor: pointer;
    
    &:hover {
      background-color: #c56c6c;
    }
  `;
  
  const messageDisplay = css`
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-family: Poppins, sans-serif;
    
    &.success {
      background-color: #e0f2e9;
      color: #2e7d32;
    }
    
    &.error {
      background-color: #f9e0e0;
      color: #c62828;
    }
  `;
  
  // Helper function to get player name from player data (string or object)
  const getPlayerName = (playerData) => {
    return typeof playerData === 'object' ? playerData.name : playerData;
  };
  
  const roomDisplayNames = {
    'bh': 'BH Room',
    '59': '59 Room',
    'ashland': 'Ashland Room'
  };
  
  if (loading) {
    return (
      <div className={container}>
        <h2 className={title}>
          <span role="img" aria-label="Players">👥</span> Player Management
        </h2>
        <div>Loading player data...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={container}>
        <h2 className={title}>
          <span role="img" aria-label="Players">👥</span> Player Management
        </h2>
        <div style={{ color: '#d67b7b' }}>{error}</div>
      </div>
    );
  }
  
  const currentRoom = rooms[selectedRoom] || { queue: [], outOfRotationPlayers: [], busyPlayers: [] };
  
  return (
    <div className={container}>
      <h2 className={title}>
        <span role="img" aria-label="Players">👥</span> Player Management
      </h2>
      
      {actionMessage && (
        <div className={`${messageDisplay} ${messageType}`}>
          {actionMessage}
        </div>
      )}
      
      <div className={roomTabs}>
        {Object.keys(rooms).map(roomId => (
          <div 
            key={roomId} 
            className={`${roomTab} ${selectedRoom === roomId ? 'active' : ''}`}
            onClick={() => setSelectedRoom(roomId)}
          >
            {roomDisplayNames[roomId] || roomId}
          </div>
        ))}
      </div>
      
      <div>
        <div className={sectionTitle}>
          <span>Queue ({currentRoom.queue?.length || 0})</span>
          <button 
            className={clearButton}
            onClick={() => handleClearRoom(selectedRoom)}
          >
            Clear All Players
          </button>
        </div>
        
        <div className={playerList}>
          {currentRoom.queue?.length > 0 ? (
            currentRoom.queue.map((player, index) => (
              <div key={`queue-${player}-${index}`} className={playerItem}>
                <div>
                  <span style={{ fontWeight: '600', marginRight: '0.5rem' }}>#{index + 1}</span>
                  {player}
                </div>
                <button 
                  className={actionButton}
                  onClick={() => handleRemoveFromQueue(selectedRoom, player)}
                >
                  Remove from Queue
                </button>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#8b8b8b', fontStyle: 'italic' }}>
              No players in queue
            </div>
          )}
        </div>
        
        <div className={sectionTitle}>
          <span>Out of Rotation ({currentRoom.outOfRotationPlayers?.length || 0})</span>
        </div>
        
        <div className={playerList}>
          {currentRoom.outOfRotationPlayers?.length > 0 ? (
            currentRoom.outOfRotationPlayers.map((player, index) => (
              <div key={`out-${player}-${index}`} className={playerItem}>
                <div>{player}</div>
                <button 
                  className={actionButton}
                  onClick={() => handleRemoveFromOutOfRotation(selectedRoom, player)}
                >
                  Remove from Out
                </button>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#8b8b8b', fontStyle: 'italic' }}>
              No players out of rotation
            </div>
          )}
        </div>
        
        <div className={sectionTitle}>
          <span>On Appointment ({currentRoom.busyPlayers?.length || 0})</span>
        </div>
        
        <div className={playerList}>
          {currentRoom.busyPlayers?.length > 0 ? (
            currentRoom.busyPlayers.map((playerData, index) => {
              const playerName = getPlayerName(playerData);
              const timestamp = typeof playerData === 'object' ? playerData.timestamp : null;
              
              return (
                <div key={`busy-${playerName}-${index}`} className={playerItem}>
                  <div>
                    {playerName}
                    {timestamp && (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: '#9c27b0', 
                        marginLeft: '0.5rem',
                        fontWeight: '600'
                      }}>
                        Since {timestamp}
                      </span>
                    )}
                  </div>
                  <button 
                    className={actionButton}
                    onClick={() => handleRemoveFromAppointment(selectedRoom, playerData)}
                  >
                    Remove from Appointment
                  </button>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#8b8b8b', fontStyle: 'italic' }}>
              No players on appointment
            </div>
          )}
        </div>
      </div>
    </div>
  );
}