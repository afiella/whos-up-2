// src/pages/admin/PlayerManagement.jsx
import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { db } from '../../firebase/config';
import { doc, onSnapshot, updateDoc, arrayRemove, getDoc, arrayUnion } from 'firebase/firestore';
import BackButton from '../../components/ui/BackButton';

export default function PlayerManagement() {
  const [rooms, setRooms] = useState({
    bh: { queue: [], outOfRotationPlayers: [], busyPlayers: [] },
    '59': { queue: [], busyPlayers: [], outOfRotationPlayers: [] },
    ashland: { queue: [], busyPlayers: [], outOfRotationPlayers: [] }
  });
  const [selectedRoom, setSelectedRoom] = useState('bh');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  
  // Add player form states
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRoom, setNewPlayerRoom] = useState('');
  const [newPlayerStatus, setNewPlayerStatus] = useState('queue');
  
  // Collapse states for sections
  const [addPlayerCollapsed, setAddPlayerCollapsed] = useState(true);
  const [queueCollapsed, setQueueCollapsed] = useState(false);
  const [outOfRotationCollapsed, setOutOfRotationCollapsed] = useState(false);
  const [appointmentCollapsed, setAppointmentCollapsed] = useState(false);

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
  
  // Add a player to a room
  const handleAddPlayer = async (e) => {
    e.preventDefault();
    
    if (!newPlayerName || !newPlayerRoom || !newPlayerStatus) {
      setActionMessage('Please fill all fields');
      setMessageType('error');
      return;
    }
    
    try {
      const roomRef = doc(db, 'rooms', newPlayerRoom);
      const roomData = await getDoc(roomRef);
      
      if (!roomData.exists()) {
        setActionMessage(`Room ${newPlayerRoom} does not exist`);
        setMessageType('error');
        return;
      }
      
      // Get current room data
      const currentData = roomData.data();
      
      // Handle different statuses
      switch (newPlayerStatus) {
        case 'queue':
          // Check if player is already in queue (case insensitive)
          if (currentData.queue?.some(name => name.toLowerCase() === newPlayerName.toLowerCase())) {
            setActionMessage(`${newPlayerName} is already in the queue`);
            setMessageType('error');
            return;
          }
          
          // Add to queue and remove from other arrays
          await updateDoc(roomRef, {
            queue: arrayUnion(newPlayerName),
            outOfRotationPlayers: arrayRemove(...(currentData.outOfRotationPlayers || [])
              .filter(name => name.toLowerCase() === newPlayerName.toLowerCase())),
            busyPlayers: arrayRemove(...(currentData.busyPlayers || [])
              .filter(item => 
                typeof item === 'object' 
                  ? item.name.toLowerCase() === newPlayerName.toLowerCase() 
                  : item.toLowerCase() === newPlayerName.toLowerCase()
              ))
          });
          break;
          
        case 'outOfRotation':
          // Check if player is already out of rotation (case insensitive)
          if (currentData.outOfRotationPlayers?.some(name => name.toLowerCase() === newPlayerName.toLowerCase())) {
            setActionMessage(`${newPlayerName} is already out of rotation`);
            setMessageType('error');
            return;
          }
          
          // Add to out of rotation and remove from other arrays
          await updateDoc(roomRef, {
            outOfRotationPlayers: arrayUnion(newPlayerName),
            queue: arrayRemove(...(currentData.queue || [])
              .filter(name => name.toLowerCase() === newPlayerName.toLowerCase())),
            busyPlayers: arrayRemove(...(currentData.busyPlayers || [])
              .filter(item => 
                typeof item === 'object' 
                  ? item.name.toLowerCase() === newPlayerName.toLowerCase() 
                  : item.toLowerCase() === newPlayerName.toLowerCase()
              ))
          });
          break;
          
        case 'appointment':
          // Check if player is already on appointment (case insensitive)
          if (currentData.busyPlayers?.some(item => 
            typeof item === 'object' 
              ? item.name.toLowerCase() === newPlayerName.toLowerCase() 
              : item.toLowerCase() === newPlayerName.toLowerCase()
          )) {
            setActionMessage(`${newPlayerName} is already on appointment`);
            setMessageType('error');
            return;
          }
          
          // Get current timestamp
          const now = new Date();
          const timestamp = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          });
          
          // Create appointment object
          const appointmentData = {
            name: newPlayerName,
            timestamp: timestamp
          };
          
          // Add to appointment and remove from other arrays
          await updateDoc(roomRef, {
            busyPlayers: arrayUnion(appointmentData),
            queue: arrayRemove(...(currentData.queue || [])
              .filter(name => name.toLowerCase() === newPlayerName.toLowerCase())),
            outOfRotationPlayers: arrayRemove(...(currentData.outOfRotationPlayers || [])
              .filter(name => name.toLowerCase() === newPlayerName.toLowerCase()))
          });
          break;
          
        default:
          setActionMessage('Invalid status');
          setMessageType('error');
          return;
      }
      
      // Add activity log
      const historyEntry = {
        action: newPlayerStatus === 'queue' ? 'joinedQueue' : 
                newPlayerStatus === 'outOfRotation' ? 'wentOutOfRotation' : 'wentOnAppointment',
        player: newPlayerName,
        timestamp: new Date().toISOString(),
        displayTime: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        details: {
          actionBy: 'Admin',
          manuallyAdded: true
        }
      };
      
      await updateDoc(roomRef, {
        history: arrayUnion(historyEntry)
      });
      
      setActionMessage(`Added ${newPlayerName} to ${newPlayerRoom} as ${newPlayerStatus}`);
      setMessageType('success');
      
      // Clear form
      setNewPlayerName('');
      setAddPlayerCollapsed(true);
      
    } catch (error) {
      console.error('Error adding player:', error);
      setActionMessage(`Error: ${error.message}`);
      setMessageType('error');
    }
  };

  // Helper function to get player name from player data (string or object)
  const getPlayerName = (playerData) => {
    return typeof playerData === 'object' ? playerData.name : playerData;
  };
  
  const roomDisplayNames = {
    'bh': 'BH Room',
    '59': '59 Room',
    'ashland': 'Ashland Room'
  };

  // Styling - Mobile Optimized
  const container = css`
    background-color: white;
    border-radius: 1rem;
    padding: 1rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  `;
  
  const header = css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  `;
  
  const title = css`
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 1.25rem;
    color: #4b3b2b;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `;
  
  const roomTabs = css`
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    -webkit-overflow-scrolling: touch;
  `;
  
  const roomTab = css`
    padding: 0.5rem 0.75rem;
    border-radius: 1rem;
    cursor: pointer;
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    white-space: nowrap;
    transition: all 0.2s;
    
    &.active {
      background-color: #d67b7b;
      color: white;
    }
    
    &:hover:not(.active) {
      background-color: #f6dfdf;
    }
  `;
  
  const sectionHeader = css`
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 1rem;
    color: #4b3b2b;
    padding: 0.75rem;
    background-color: #f9f9f9;
    border-radius: 0.75rem;
    margin-bottom: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;
  `;
  
  const clearButton = css`
    background-color: #b71c1c;
    color: white;
    border: none;
    border-radius: 1rem;
    padding: 0.5rem 0.75rem;
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
    margin-bottom: 1rem;
  `;
  
  const playerItem = css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background-color: #f6f6f6;
    border-radius: 0.75rem;
    font-family: Poppins, sans-serif;
    font-size: 0.9rem;
  `;
  
  const actionButton = css`
    background-color: #d67b7b;
    color: white;
    border: none;
    border-radius: 1rem;
    padding: 0.5rem 0.75rem;
    font-family: Poppins, sans-serif;
    font-size: 0.75rem;
    cursor: pointer;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background-color: #c56c6c;
    }
  `;
  
  const messageDisplay = css`
    padding: 0.75rem;
    border-radius: 0.75rem;
    margin-bottom: 1rem;
    font-family: Poppins, sans-serif;
    text-align: center;
    
    &.success {
      background-color: #e0f2e9;
      color: #2e7d32;
    }
    
    &.error {
      background-color: #f9e0e0;
      color: #c62828;
    }
  `;
  
  const collapsibleSection = css`
    margin-bottom: 1rem;
    border-radius: 0.75rem;
    overflow: hidden;
    background-color: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  `;
  
  const sectionContent = css`
    padding: 0.75rem;
  `;
  
  const addPlayerButton = css`
    background-color: #8d9e78;
    color: white;
    border: none;
    border-radius: 1rem;
    padding: 0.75rem;
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    cursor: pointer;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    
    &:hover {
      background-color: #768a62;
    }
  `;
  
  const form = css`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  `;
  
  const formGroup = css`
    width: 100%;
  `;
  
  const label = css`
    display: block;
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    color: #4b3b2b;
    margin-bottom: 0.25rem;
  `;
  
  const input = css`
    width: 100%;
    padding: 0.75rem;
    border-radius: 0.75rem;
    border: 1px solid #eacdca;
    font-family: Poppins, sans-serif;
    font-size: 1rem;
    outline: none;
    box-sizing: border-box;
    
    &:focus {
      border-color: #d67b7b;
    }
  `;
  
  const button = css`
    background-color: #d67b7b;
    color: white;
    border: none;
    border-radius: 1rem;
    padding: 0.75rem;
    font-family: Poppins, sans-serif;
    font-size: 1rem;
    cursor: pointer;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background-color: #c56c6c;
    }
  `;
  
  const badgeCount = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: #d67b7b;
    color: white;
    border-radius: 1rem;
    padding: 0.125rem 0.5rem;
    font-size: 0.75rem;
    min-width: 1.5rem;
    min-height: 1.5rem;
  `;
  
  const emptyState = css`
    text-align: center;
    padding: 1rem;
    color: #8b8b8b;
    font-style: italic;
    font-size: 0.875rem;
  `;
  
  const timestampBadge = css`
    font-size: 0.75rem;
    background-color: #9c27b0;
    color: white;
    padding: 0.125rem 0.5rem;
    border-radius: 1rem;
    margin-left: 0.5rem;
  `;

  if (loading) {
    return (
      <div className={container}>
        <div className={header}>
          <h2 className={title}>
            <span role="img" aria-label="Players">👥</span> Player Management
          </h2>
          <BackButton label="Back" />
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading player data...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={container}>
        <div className={header}>
          <h2 className={title}>
            <span role="img" aria-label="Players">👥</span> Player Management
          </h2>
          <BackButton label="Back" />
        </div>
        <div style={{ color: '#d67b7b', textAlign: 'center', padding: '1rem' }}>{error}</div>
      </div>
    );
  }
  
  const currentRoom = rooms[selectedRoom] || { queue: [], outOfRotationPlayers: [], busyPlayers: [] };
  
  return (
    <div style={{ 
      padding: '1rem', 
      backgroundColor: '#fff8f0',
      minHeight: '100vh',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      <div className={container}>
        <div className={header}>
          <h2 className={title}>
            <span role="img" aria-label="Players">👥</span> Player Management
          </h2>
          <BackButton label="Back" />
        </div>
        
        {actionMessage && (
          <div className={`${messageDisplay} ${messageType}`}>
            {actionMessage}
          </div>
        )}
        
        {/* Add New Player Button */}
        <button 
          className={addPlayerButton}
          onClick={() => setAddPlayerCollapsed(!addPlayerCollapsed)}
        >
          <span role="img" aria-label="Add">➕</span>
          {addPlayerCollapsed ? 'Add New Player' : 'Hide Form'}
        </button>
        
        {/* Add Player Form (Collapsible) */}
        {!addPlayerCollapsed && (
          <div className={form} style={{ marginBottom: '1rem' }}>
            <div className={formGroup}>
              <label className={label}>Player Name</label>
              <input
                type="text"
                className={input}
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter player name"
                required
              />
            </div>
            
            <div className={formGroup}>
              <label className={label}>Room</label>
              <select
                className={input}
                value={newPlayerRoom}
                onChange={(e) => setNewPlayerRoom(e.target.value)}
                required
              >
                <option value="">Select a room</option>
                <option value="bh">BH Room</option>
                <option value="59">59 Room</option>
                <option value="ashland">Ashland Room</option>
              </select>
            </div>
            
            <div className={formGroup}>
              <label className={label}>Status</label>
              <select
                className={input}
                value={newPlayerStatus}
                onChange={(e) => setNewPlayerStatus(e.target.value)}
                required
              >
                <option value="queue">In Queue</option>
                <option value="outOfRotation">Out of Rotation</option>
                <option value="appointment">On Appointment</option>
              </select>
            </div>
            
            <button 
              type="button"
              className={button}
              onClick={handleAddPlayer}
            >
              Add Player
            </button>
          </div>
        )}
        
        {/* Room Tabs */}
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
        
        {/* Quick Stats */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '1rem',
          padding: '0.5rem',
          backgroundColor: '#f6dfdf',
          borderRadius: '0.75rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
              {currentRoom.queue?.length || 0}
            </div>
            <div style={{ fontSize: '0.75rem' }}>Queue</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
              {currentRoom.outOfRotationPlayers?.length || 0}
            </div>
            <div style={{ fontSize: '0.75rem' }}>Out</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
              {currentRoom.busyPlayers?.length || 0}
            </div>
            <div style={{ fontSize: '0.75rem' }}>Appt</div>
          </div>
          <button 
            className={clearButton}
            style={{ alignSelf: 'center' }}
            onClick={() => handleClearRoom(selectedRoom)}
          >
            Clear All
          </button>
        </div>
        
        {/* Queue Section (Collapsible) */}
        <div className={collapsibleSection}>
          <div 
            className={sectionHeader}
            onClick={() => setQueueCollapsed(!queueCollapsed)}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span>{queueCollapsed ? '▶' : '▼'}</span>
              <span style={{ marginLeft: '0.5rem' }}>Queue</span>
              <div className={badgeCount} style={{ marginLeft: '0.5rem' }}>
                {currentRoom.queue?.length || 0}
              </div>
            </div>
          </div>
          
          {!queueCollapsed && (
            <div className={sectionContent}>
              {currentRoom.queue?.length > 0 ? (
                <div className={playerList}>
                  {currentRoom.queue.map((player, index) => (
                    <div key={`queue-${player}-${index}`} className={playerItem}>
                      <div>
                        <span style={{ 
                          fontWeight: '600', 
                          marginRight: '0.5rem',
                          backgroundColor: '#d67b7b',
                          color: 'white',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem'
                        }}>#{index + 1}</span>
                        {player}
                      </div>
                      <button 
                        className={actionButton}
                        onClick={() => handleRemoveFromQueue(selectedRoom, player)}
                      >
                        <span role="img" aria-label="Remove">❌</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={emptyState}>
                  No players in queue
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Out of Rotation Section (Collapsible) */}
        <div className={collapsibleSection}>
          <div 
            className={sectionHeader}
            onClick={() => setOutOfRotationCollapsed(!outOfRotationCollapsed)}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span>{outOfRotationCollapsed ? '▶' : '▼'}</span>
              <span style={{ marginLeft: '0.5rem' }}>Out of Rotation</span>
              <div className={badgeCount} style={{ marginLeft: '0.5rem' }}>
                {currentRoom.outOfRotationPlayers?.length || 0}
              </div>
            </div>
          </div>
          
          {!outOfRotationCollapsed && (
            <div className={sectionContent}>
              {currentRoom.outOfRotationPlayers?.length > 0 ? (
                <div className={playerList}>
                  {currentRoom.outOfRotationPlayers.map((player, index) => (
                    <div key={`out-${player}-${index}`} className={playerItem}>
                      <div>{player}</div>
                      <button 
                        className={actionButton}
                        onClick={() => handleRemoveFromOutOfRotation(selectedRoom, player)}
                      >
                        <span role="img" aria-label="Remove">❌</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={emptyState}>
                  No players out of rotation
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* On Appointment Section (Collapsible) */}
        <div className={collapsibleSection}>
          <div 
            className={sectionHeader}
            onClick={() => setAppointmentCollapsed(!appointmentCollapsed)}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span>{appointmentCollapsed ? '▶' : '▼'}</span>
              <span style={{ marginLeft: '0.5rem' }}>On Appointment</span>
              <div className={badgeCount} style={{ marginLeft: '0.5rem' }}>
                {currentRoom.busyPlayers?.length || 0}
              </div>
            </div>
          </div>
          
          {!appointmentCollapsed && (
            <div className={sectionContent}>
              {currentRoom.busyPlayers?.length > 0 ? (
                <div className={playerList}>
                  {currentRoom.busyPlayers.map((playerData, index) => {
                    const playerName = getPlayerName(playerData);
                    const timestamp = typeof playerData === 'object' ? playerData.timestamp : null;
                    
                    return (
                      <div key={`busy-${playerName}-${index}`} className={playerItem}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span>{playerName}</span>
                          {timestamp && (
                            <span className={timestampBadge}>{timestamp}</span>
                          )}
                        </div>
                        <button 
                          className={actionButton}
                          onClick={() => handleRemoveFromAppointment(selectedRoom, playerData)}
                        >
                          <span role="img" aria-label="Remove">❌</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={emptyState}>
                  No players on appointment
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}