// src/components/admin/AdminControlsPanel.jsx
import React, { useState } from 'react';
import { css } from '@emotion/css';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function AdminControlsPanel({ roomId, roomData, onClose }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [targetStatus, setTargetStatus] = useState('queue');
  const [targetRoom, setTargetRoom] = useState(roomId);
  const [actionMessage, setActionMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  
  // Get all players from all statuses
  const allPlayers = [
    ...(roomData.queue || []).map(player => ({ name: player, status: 'queue' })),
    ...(roomData.outOfRotationPlayers || []).map(player => ({ name: player, status: 'outOfRotation' })),
    ...(roomData.busyPlayers || []).map(player => {
      const playerName = typeof player === 'object' ? player.name : player;
      return { name: playerName, status: 'appointment', timestamp: typeof player === 'object' ? player.timestamp : null };
    })
  ];
  
  // Handle player selection
  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
  };
  
  // Handle moving player to different status or room
  const handleMovePlayer = async () => {
    if (!selectedPlayer) {
      setActionMessage('Please select a player first');
      setMessageType('error');
      return;
    }
    
    try {
      // Get source room reference
      const sourceRoomRef = doc(db, 'rooms', roomId);
      const sourceRoomData = await getDoc(sourceRoomRef);
      
      if (!sourceRoomData.exists()) {
        setActionMessage('Source room not found');
        setMessageType('error');
        return;
      }
      
      // Get current data from source room
      const currentData = sourceRoomData.data();
      
      // Remove player from current status in source room
      await updateDoc(sourceRoomRef, {
        queue: arrayRemove(...(currentData.queue || [])
          .filter(name => name.toLowerCase() === selectedPlayer.name.toLowerCase())),
        outOfRotationPlayers: arrayRemove(...(currentData.outOfRotationPlayers || [])
          .filter(name => name.toLowerCase() === selectedPlayer.name.toLowerCase())),
        busyPlayers: arrayRemove(...(currentData.busyPlayers || [])
          .filter(item => 
            typeof item === 'object' 
              ? item.name.toLowerCase() === selectedPlayer.name.toLowerCase()
              : item.toLowerCase() === selectedPlayer.name.toLowerCase()
          ))
      });
      
      // If moving to a different room
      if (targetRoom !== roomId) {
        // Get target room reference
        const targetRoomRef = doc(db, 'rooms', targetRoom);
        const targetRoomData = await getDoc(targetRoomRef);
        
        if (!targetRoomData.exists()) {
          setActionMessage('Target room not found');
          setMessageType('error');
          return;
        }
        
        // Add player to target room with selected status
        if (targetStatus === 'queue') {
          await updateDoc(targetRoomRef, {
            queue: arrayUnion(selectedPlayer.name)
          });
        } else if (targetStatus === 'outOfRotation') {
          await updateDoc(targetRoomRef, {
            outOfRotationPlayers: arrayUnion(selectedPlayer.name)
          });
        } else if (targetStatus === 'appointment') {
          // Create appointment object with timestamp
          const now = new Date();
          const timestamp = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          });
          
          const appointmentData = {
            name: selectedPlayer.name,
            timestamp: timestamp
          };
          
          await updateDoc(targetRoomRef, {
            busyPlayers: arrayUnion(appointmentData)
          });
        }
        
        // Add to history in both source and target rooms
        const historyEntry = {
          action: 'adminMoved',
          player: selectedPlayer.name,
          timestamp: new Date().toISOString(),
          displayTime: new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          details: {
            fromRoom: roomId,
            toRoom: targetRoom,
            fromStatus: selectedPlayer.status,
            toStatus: targetStatus,
            actionBy: 'Admin'
          }
        };
        
        await updateDoc(sourceRoomRef, {
          history: arrayUnion(historyEntry)
        });
        
        await updateDoc(targetRoomRef, {
          history: arrayUnion(historyEntry)
        });
        
        setActionMessage(`Moved ${selectedPlayer.name} from ${roomId} to ${targetRoom} as ${targetStatus}`);
      } else {
        // Moving within the same room
        // Add player to selected status in same room
        if (targetStatus === 'queue') {
          await updateDoc(sourceRoomRef, {
            queue: arrayUnion(selectedPlayer.name)
          });
        } else if (targetStatus === 'outOfRotation') {
          await updateDoc(sourceRoomRef, {
            outOfRotationPlayers: arrayUnion(selectedPlayer.name)
          });
        } else if (targetStatus === 'appointment') {
          // Create appointment object with timestamp
          const now = new Date();
          const timestamp = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          });
          
          const appointmentData = {
            name: selectedPlayer.name,
            timestamp: timestamp
          };
          
          await updateDoc(sourceRoomRef, {
            busyPlayers: arrayUnion(appointmentData)
          });
        }
        
        // Add to history
        const historyEntry = {
          action: targetStatus === 'queue' ? 'joinedQueue' : 
                 targetStatus === 'outOfRotation' ? 'wentOutOfRotation' : 'wentOnAppointment',
          player: selectedPlayer.name,
          timestamp: new Date().toISOString(),
          displayTime: new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          details: {
            actionBy: 'Admin',
            fromStatus: selectedPlayer.status
          }
        };
        
        await updateDoc(sourceRoomRef, {
          history: arrayUnion(historyEntry)
        });
        
        setActionMessage(`Changed ${selectedPlayer.name} status to ${targetStatus}`);
      }
      
      setMessageType('success');
      setSelectedPlayer(null);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setActionMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Error moving player:', error);
      setActionMessage(`Error: ${error.message}`);
      setMessageType('error');
    }
  };
  
  // Handle reordering the queue
  const handleMoveInQueue = async (playerId, direction) => {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnapshot = await getDoc(roomRef);
      
      if (roomSnapshot.exists()) {
        const currentQueue = [...roomSnapshot.data().queue];
        const playerIndex = currentQueue.findIndex(name => 
          name.toLowerCase() === playerId.toLowerCase()
        );
        
        if (playerIndex === -1) {
          setActionMessage('Player not found in queue');
          setMessageType('error');
          return;
        }
        
        // Calculate new index based on direction
        let newIndex;
        if (direction === 'up') {
          newIndex = Math.max(0, playerIndex - 1);
        } else {
          newIndex = Math.min(currentQueue.length - 1, playerIndex + 1);
        }
        
        // If already at the top/bottom, do nothing
        if (newIndex === playerIndex) {
          return;
        }
        
        // Remove from current position
        const player = currentQueue[playerIndex];
        currentQueue.splice(playerIndex, 1);
        // Insert at new position
        currentQueue.splice(newIndex, 0, player);
        
        // Update the queue
        await updateDoc(roomRef, {
          queue: currentQueue
        });
        
        // Add to history
        const historyEntry = {
          action: 'reorderedQueue',
          player: 'Admin',
          timestamp: new Date().toISOString(),
          displayTime: new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          details: {
            movedPlayer: player,
            fromPosition: playerIndex + 1,
            toPosition: newIndex + 1
          }
        };
        
        await updateDoc(roomRef, {
          history: arrayUnion(historyEntry)
        });
        
        setActionMessage(`Moved ${player} ${direction} in queue`);
        setMessageType('success');
        
        setTimeout(() => {
          setActionMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error reordering queue:', error);
      setActionMessage(`Error: ${error.message}`);
      setMessageType('error');
    }
  };
  
  // Styling
  const panel = css`
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 400px;
    background-color: white;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    overflow-y: auto;
    z-index: 1000;
    
    @media (max-width: 480px) {
      max-width: 100%;
    }
  `;
  
  const header = css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 1rem;
  `;
  
  const title = css`
    font-family: 'Lilita One', cursive;
    color: #a47148;
    font-size: 1.5rem;
    margin: 0;
  `;
  
  const closeButton = css`
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #4b3b2b;
  `;
  
  const section = css`
    margin-bottom: 1.5rem;
  `;
  
  const sectionTitle = css`
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 1rem;
    color: #4b3b2b;
    margin-bottom: 1rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid #eee;
  `;
  
  const playerList = css`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
    max-height: 200px;
    overflow-y: auto;
  `;
  
  const playerItem = css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background-color: #f6f6f6;
    border-radius: 0.5rem;
    font-family: Poppins, sans-serif;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background-color: #eacdca;
    }
    
    &.selected {
      background-color: #d67b7b;
      color: white;
    }
  `;
  
  const statusBadge = css`
    display: inline-block;
    padding: 0.2rem 0.5rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    
    &.queue {
      background-color: #8d9e78;
      color: white;
    }
    
    &.outOfRotation {
      background-color: #a47148;
      color: white;
    }
    
    &.appointment {
      background-color: #9c27b0;
      color: white;
    }
  `;
  
  const formGroup = css`
    margin-bottom: 1rem;
  `;
  
  const label = css`
    display: block;
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    color: #4b3b2b;
    margin-bottom: 0.5rem;
  `;
  
  const select = css`
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
  
  const button = css`
    background-color: #d67b7b;
    color: white;
    border: none;
    border-radius: 1.5rem;
    padding: 0.75rem 1.5rem;
    font-family: Poppins, sans-serif;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    width: 100%;
    
    &:hover {
      background-color: #c56c6c;
    }
    
    &:disabled {
      background-color: #d3a7a7;
      cursor: not-allowed;
    }
  `;
  
  const queueControls = css`
    display: flex;
    gap: 0.5rem;
  `;
  
  const queueControlButton = css`
    background-color: #8d9e78;
    color: white;
    border: none;
    border-radius: 0.25rem;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #768a62;
    }
  `;
  
  const messageDisplay = css`
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-top: 1rem;
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
  
  // Group players by status for better organization
  const playersByStatus = {
    queue: allPlayers.filter(player => player.status === 'queue'),
    appointment: allPlayers.filter(player => player.status === 'appointment'),
    outOfRotation: allPlayers.filter(player => player.status === 'outOfRotation')
  };
  
  return (
    <div className={panel}>
      <div className={header}>
        <h2 className={title}>Admin Controls</h2>
        <button className={closeButton} onClick={onClose}>×</button>
      </div>
      
      {actionMessage && (
        <div className={`${messageDisplay} ${messageType}`}>
          {actionMessage}
        </div>
      )}
      
      {/* Queue Management Section */}
      <div className={section}>
        <div className={sectionTitle}>Queue Management</div>
        
        {roomData.queue?.length > 0 ? (
          <div className={playerList}>
            {roomData.queue.map((player, index) => (
              <div key={`queue-${player}-${index}`} className={playerItem}>
                <div>
                  <span style={{ fontWeight: '600', marginRight: '0.5rem' }}>#{index + 1}</span>
                  {player}
                </div>
                <div className={queueControls}>
                  <button 
                    className={queueControlButton}
                    onClick={() => handleMoveInQueue(player, 'up')}
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button 
                    className={queueControlButton}
                    onClick={() => handleMoveInQueue(player, 'down')}
                    disabled={index === roomData.queue.length - 1}
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#8b8b8b', fontStyle: 'italic' }}>
            No players in queue
          </div>
        )}
      </div>
      
      {/* Player Management Section */}
      <div className={section}>
        <div className={sectionTitle}>Player Management</div>
        
        <div className={playerList}>
          {Object.entries(playersByStatus).map(([status, players]) => 
            players.length > 0 && (
              <React.Fragment key={status}>
                <div style={{ fontWeight: '600', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                  {status === 'queue' ? 'In Queue' : 
                   status === 'appointment' ? 'On Appointment' : 'Out of Rotation'}
                </div>
                {players.map((player, index) => (
                  <div 
                    key={`${status}-${player.name}-${index}`} 
                    className={`${playerItem} ${selectedPlayer?.name === player.name ? 'selected' : ''}`}
                    onClick={() => handleSelectPlayer(player)}
                  >
                    <div>{player.name}</div>
                    <div className={`${statusBadge} ${status}`}>
                      {status === 'queue' ? 'Queue' : 
                       status === 'appointment' ? 'Appt' : 'Out'}
                    </div>
                  </div>
                ))}
              </React.Fragment>
            )
          )}
          
          {allPlayers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#8b8b8b', fontStyle: 'italic' }}>
              No players in room
            </div>
          )}
        </div>
        
        {selectedPlayer && (
          <div>
            <div className={formGroup}>
              <div className={label}>Selected Player: {selectedPlayer.name}</div>
              <div className={label}>Current Status: {
                selectedPlayer.status === 'queue' ? 'In Queue' : 
                selectedPlayer.status === 'appointment' ? 'On Appointment' : 'Out of Rotation'
              }</div>
            </div>
            
            <div className={formGroup}>
              <label className={label}>Move To:</label>
              <select 
                className={select}
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
              >
                <option value="queue">Queue</option>
                <option value="appointment">Appointment</option>
                <option value="outOfRotation">Out of Rotation</option>
              </select>
            </div>
            
            <div className={formGroup}>
              <label className={label}>Target Room:</label>
              <select 
                className={select}
                value={targetRoom}
                onChange={(e) => setTargetRoom(e.target.value)}
              >
                <option value={roomId}>Current Room ({roomId})</option>
                {roomId !== 'bh' && <option value="bh">BH Room</option>}
                {roomId !== '59' && <option value="59">59 Room</option>}
                {roomId !== 'ashland' && <option value="ashland">Ashland Room</option>}
              </select>
            </div>
            
            <button 
              className={button}
              onClick={handleMovePlayer}
            >
              Move Player
            </button>
          </div>
        )}
      </div>
    </div>
  );
}