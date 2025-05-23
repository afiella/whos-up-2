// src/components/game/GameRoomBase.jsx
import React, { useState } from 'react';
import { css } from '@emotion/css';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export default function GameRoomBase({ children, roomId, roomName }) {
  const { moderator } = useAuth();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [adminMessageType, setAdminMessageType] = useState('');

  // Define shifts for each room
  const shifts = {
    '59': [
      { value: 'double', label: 'Double (9:30 AM - 8:00 PM)', endTime: '8:00 PM' },
      { value: 'opening', label: 'Opening (9:30 AM - 3:00 PM)', endTime: '3:00 PM' },
      { value: 'close', label: 'Close (3:00 PM - 8:00 PM)', endTime: '8:00 PM' }
    ],
    'bh': [
      { value: 'double', label: 'Double (8:30 AM - 8:00 PM)', endTime: '8:00 PM' },
      { value: 'opening', label: 'Opening (8:30 AM - 3:00 PM)', endTime: '3:00 PM' },
      { value: 'close', label: 'Close (3:00 PM - 8:00 PM)', endTime: '8:00 PM' },
      { value: 'afternoon', label: 'Afternoon (8:30 AM - 5:00 PM)', endTime: '5:00 PM' }
    ],
    'ashland': [
      { value: 'double', label: 'Double (9:30 AM - 8:00 PM)', endTime: '8:00 PM' },
      { value: 'opening', label: 'Opening (9:30 AM - 3:00 PM)', endTime: '3:00 PM' },
      { value: 'close', label: 'Close (3:00 PM - 8:00 PM)', endTime: '8:00 PM' }
    ]
  };

  const adminPanel = css`
    position: fixed;
    top: 1rem;
    right: 1rem;
    background-color: #f6dfdf;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    max-width: 400px;
    width: 90%;
  `;

  const adminToggle = css`
    position: fixed;
    top: 1rem;
    right: 1rem;
    background-color: #a47148;
    color: white;
    border: none;
    border-radius: 1rem;
    padding: 0.5rem 1rem;
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    cursor: pointer;
    z-index: 999;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    &:hover {
      background-color: #8b5d3a;
    }
  `;

  const form = css`
    display: flex;
    flex-direction: column;
    gap: 1rem;
  `;

  const input = css`
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: 1px solid #eacdca;
    font-family: Poppins, sans-serif;
    font-size: 1rem;
    outline: none;
    
    &:focus {
      border-color: #d67b7b;
    }
  `;

  const select = css`
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: 1px solid #eacdca;
    font-family: Poppins, sans-serif;
    font-size: 1rem;
    outline: none;
    cursor: pointer;
    
    &:focus {
      border-color: #d67b7b;
    }
  `;

  const button = css`
    background-color: #d67b7b;
    color: white;
    border: none;
    border-radius: 1rem;
    padding: 0.75rem 1.5rem;
    font-family: Poppins, sans-serif;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #c56c6c;
    }
  `;

  const closeButton = css`
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #4b3b2b;
    
    &:hover {
      color: #d67b7b;
    }
  `;

  const panelTitle = css`
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 1.125rem;
    color: #4b3b2b;
    margin-bottom: 1rem;
  `;

  const label = css`
    display: block;
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    color: #4b3b2b;
    margin-bottom: 0.5rem;
  `;

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    
    if (!playerName || !selectedShift) {
      setAdminMessage('All fields are required');
      setAdminMessageType('error');
      return;
    }

    try {
      // Create or update the manuallyAddedPlayers document
      const manualPlayersRef = doc(db, 'manuallyAddedPlayers', 'players');
      const manualPlayersDoc = await getDoc(manualPlayersRef);
      
      const shift = shifts[roomId].find(s => s.value === selectedShift);
      const playerData = {
        name: playerName,
        room: roomId,
        shiftEnd: shift.endTime,
        shiftType: shift.value,
        addedBy: moderator.displayName || moderator.username,
        addedAt: new Date().toISOString()
      };

      if (manualPlayersDoc.exists()) {
        await updateDoc(manualPlayersRef, {
          [playerName.toLowerCase()]: playerData
        });
      } else {
        await setDoc(manualPlayersRef, {
          [playerName.toLowerCase()]: playerData
        });
      }

      // Also add player directly to the room queue
      const roomRef = doc(db, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (roomDoc.exists()) {
        const roomData = roomDoc.data();
        const newPlayer = {
          name: playerName,
          joinedAt: new Date().toISOString(),
          shiftEnd: shift.endTime,
          shiftType: shift.value,
          isPlaying: false,
          wasManuallyAdded: true,
          addedBy: moderator.displayName || moderator.username
        };
        
        const updatedQueue = [...(roomData.queue || []), newPlayer];
        await updateDoc(roomRef, { queue: updatedQueue });
      }

      setAdminMessage(`${playerName} has been added to the queue`);
      setAdminMessageType('success');
      
      // Clear form
      setPlayerName('');
      setSelectedShift('');
    } catch (error) {
      console.error('Error adding player:', error);
      setAdminMessage('Failed to add player');
      setAdminMessageType('error');
    }
  };

  return (
    <>
      {moderator?.isAdmin && (
        <>
          <button 
            className={adminToggle} 
            onClick={() => setShowAdminPanel(!showAdminPanel)}
          >
            <span>👤</span> Admin Controls
          </button>
          
          {showAdminPanel && (
            <div className={adminPanel}>
              <button 
                className={closeButton} 
                onClick={() => setShowAdminPanel(false)}
              >
                ×
              </button>
              
              <div className={panelTitle}>Add Player to {roomName}</div>
              
              <form className={form} onSubmit={handleAddPlayer}>
                <div>
                  <label className={label}>Player Name</label>
                  <input
                    type="text"
                    className={input}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter player name"
                  />
                </div>
                
                <div>
                  <label className={label}>Shift</label>
                  <select
                    className={select}
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value)}
                  >
                    <option value="">Select a shift</option>
                    {shifts[roomId].map(shift => (
                      <option key={shift.value} value={shift.value}>
                        {shift.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button type="submit" className={button}>
                  Add Player
                </button>
              </form>
              
              {adminMessage && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: adminMessageType === 'success' ? '#e0f2e9' : '#f9e0e0',
                  color: adminMessageType === 'success' ? '#2e7d32' : '#c62828',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.875rem'
                }}>
                  {adminMessage}
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      {children}
    </>
  );
}