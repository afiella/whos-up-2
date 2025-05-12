// src/components/room/RoomPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { db } from '../../firebase/config';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import ModeratorBadge from '../ui/ModeratorBadge';
import QueueDisplay from './QueueDisplay';
import ModeratorQueueControl from './ModeratorQueueControl';
import AdminBadge from '../ui/AdminBadge';
import ActivityHistory from './ActivityHistory';

export default function RoomPage({ roomId, roomName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { moderator } = useAuth();
  
  // Get player info from navigation state
  const playerName = location.state?.name;
  const shiftEnd = location.state?.shiftEnd;
  const shiftType = location.state?.shiftType;
  
  // State for room data
  const [queue, setQueue] = useState([]);
  const [busyPlayers, setBusyPlayers] = useState([]); // Repurposed for appointment players
  const [outOfRotationPlayers, setOutOfRotationPlayers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerStatus, setPlayerStatus] = useState('waiting'); // 'inQueue', 'onAppointment', 'outOfRotation', 'waiting'
  const [queuePosition, setQueuePosition] = useState(-1);
  
  // Check if current time has passed shift end time
  useEffect(() => {
    const checkShiftEnd = () => {
      if (!shiftEnd) return;
      
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      });
      
      // Parse shift end time (e.g., "3:00 PM" -> comparable format)
      const shiftEndTime = new Date();
      const [time, period] = shiftEnd.split(' ');
      const [hours, minutes] = time.split(':');
      let hour = parseInt(hours);
      
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      shiftEndTime.setHours(hour, parseInt(minutes), 0);
      
      // If current time is past shift end, kick player out
      if (now > shiftEndTime) {
        handleLeaveGame();
        alert(`Your shift has ended at ${shiftEnd}. You have been removed from the game.`);
        navigate('/');
      }
    };
    
    // Check immediately
    checkShiftEnd();
    
    // Check every minute
    const interval = setInterval(checkShiftEnd, 60000);
    
    return () => clearInterval(interval);
  }, [shiftEnd, navigate]);
  
  // Initialize room and listen for updates
  useEffect(() => {
    if (!roomId || !playerName) {
      navigate('/');
      return;
    }
    
    const roomRef = doc(db, 'rooms', roomId);
    
    // First check if room exists and create if needed
    const initRoom = async () => {
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) {
        await updateDoc(roomRef, {
          queue: [],
          outOfRotationPlayers: [],
          busyPlayers: [], // Repurposed for appointment players
          history: [], // Activity history
          lastUpdated: serverTimestamp()
        });
      }
    };
    
    initRoom();
    
    // Listen for room updates
    const unsubscribe = onSnapshot(roomRef, (doc) => {
      const data = doc.data();
      if (data) {
        const newQueue = data.queue || [];
        
        // Determine player's current status before updating the queue
        const oldPosition = queuePosition;
        
        // Update state with new data
        setQueue(newQueue);
        setOutOfRotationPlayers(data.outOfRotationPlayers || []);
        setHistory(data.history || []);
        
        // Update busyPlayers (appointments) - now storing objects with name and timestamp
        const appointmentData = data.busyPlayers || [];
        setBusyPlayers(appointmentData);
        
        // Check player's position in queue and their status
        if (newQueue.includes(playerName)) {
          const newPosition = newQueue.indexOf(playerName);
          setPlayerStatus('inQueue');
          setQueuePosition(newPosition);
          
          // Notify if player is now first in queue
          if (newPosition === 0 && oldPosition > 0) {
            console.log("User is now first in queue");
          }
        } else if (appointmentData.some(item => typeof item === 'object' ? item.name === playerName : item === playerName)) {
          setPlayerStatus('onAppointment');
          setQueuePosition(-1);
        } else if (data.outOfRotationPlayers?.includes(playerName)) {
          setPlayerStatus('outOfRotation');
          setQueuePosition(-1);
        } else {
          setPlayerStatus('waiting');
          setQueuePosition(-1);
        }
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [roomId, playerName, navigate, roomName, queuePosition]);
  
  // Function to add a history entry
const addHistoryEntry = async (action, player = playerName, details = null) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    
    // First get the current history array
    const roomData = await getDoc(roomRef);
    const currentHistory = roomData.data()?.history || [];
    
    // Create the new history entry with a client-side timestamp instead of serverTimestamp
    const now = new Date();
    const historyEntry = {
      action,
      player,
      timestamp: now.toISOString(), // Use ISO string format for consistency
      displayTime: now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      details
    };
    
    // Add the new entry to the history array
    const updatedHistory = [...currentHistory, historyEntry];
    
    // Update the history array in Firestore
    await updateDoc(roomRef, {
      history: updatedHistory
    });
    
    console.log(`Added history entry: ${action} by ${player}`);
  } catch (error) {
    console.error("Error adding history entry:", error);
  }
};
  


  // Handle joining the queue
  const handleJoinQueue = async () => {
    const roomRef = doc(db, 'rooms', roomId);
    
    // Determine if player is coming back from appointment
    const wasOnAppointment = busyPlayers.some(item => 
      typeof item === 'object' ? item.name === playerName : item === playerName
    );
    
    // Update status in Firestore
    await updateDoc(roomRef, {
      queue: arrayUnion(playerName),
      outOfRotationPlayers: arrayRemove(playerName),
      busyPlayers: arrayRemove(...busyPlayers.filter(item => 
        typeof item === 'object' ? item.name === playerName : item === playerName
      ))
    });
    
    // Add appropriate history entry
    if (wasOnAppointment) {
      addHistoryEntry('returnedFromAppointment');
    } else {
      addHistoryEntry('joinedQueue');
    }
  };
  
  // Handle going out of rotation
  const handleOutOfRotation = async () => {
    const roomRef = doc(db, 'rooms', roomId);
    
    // Update status in Firestore
    await updateDoc(roomRef, {
      outOfRotationPlayers: arrayUnion(playerName),
      queue: arrayRemove(playerName),
      busyPlayers: arrayRemove(...busyPlayers.filter(item => 
        typeof item === 'object' ? item.name === playerName : item === playerName
      ))
    });
    
    // Add history entry
    addHistoryEntry('wentOutOfRotation');
  };

  // Handle going on appointment
  const handleOnAppointment = async () => {
    const roomRef = doc(db, 'rooms', roomId);
    
    // Get current timestamp in format: "3:45 PM"
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    
    // Create the appointment object with name and timestamp
    const appointmentData = {
      name: playerName,
      timestamp: timestamp
    };
    
    // First remove any existing appointment for this player (if upgrading from string to object format)
    const currentBusyPlayers = (await getDoc(roomRef)).data()?.busyPlayers || [];
    const updatedBusyPlayers = currentBusyPlayers.filter(item => 
      typeof item === 'object' ? item.name !== playerName : item !== playerName
    );
    
    // Remove from queue and outOfRotation if present, then add the new appointment data
    await updateDoc(roomRef, {
      busyPlayers: [...updatedBusyPlayers, appointmentData],
      queue: arrayRemove(playerName),
      outOfRotationPlayers: arrayRemove(playerName)
    });
    
    // Add history entry with timestamp details
    addHistoryEntry('wentOnAppointment', playerName, { timestamp });
  };

  // Resets the history at 8:01pm
const resetHistoryAtEndOfDay = async () => {
  try {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Check if it's 8:01pm (20 hours, 1 minute in 24-hour format)
    if (hours === 20 && minutes >= 1 && minutes < 6) {
      console.log("It's 8:01pm - resetting history");
      
      // First archive current history if it exists and has entries
      if (history.length > 0) {
        await saveHistoryToArchive();
      }
      
      // Then clear history
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        history: []
      });
      
      console.log("History has been reset for the next day");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error resetting history:", error);
    return false;
  }
};

  // Handle skipping turn but staying in queue
  const handleSkipTurn = async () => {
    const roomRef = doc(db, 'rooms', roomId);
    const roomData = await getDoc(roomRef);
    
    if (roomData.exists()) {
      const currentQueue = roomData.data().queue || [];
      
      // Only proceed if player is in queue
      if (currentQueue.includes(playerName)) {
        // Remove player from current position
        const newQueue = currentQueue.filter(name => name !== playerName);
        // Add player to the end of queue
        newQueue.push(playerName);
        
        // Update queue in Firestore
        await updateDoc(roomRef, {
          queue: newQueue
        });
        
        // Add history entry
        addHistoryEntry('skippedTurn');
      }
    }
  };
  
  // Handle leaving the game completely
  const handleLeaveGame = async () => {
    const roomRef = doc(db, 'rooms', roomId);
    
    // Update Firestore to remove player from all arrays
    await updateDoc(roomRef, {
      queue: arrayRemove(playerName),
      outOfRotationPlayers: arrayRemove(playerName),
      busyPlayers: arrayRemove(...busyPlayers.filter(item => 
        typeof item === 'object' ? item.name === playerName : item === playerName
      ))
    });
    
    // Add history entry
    addHistoryEntry('leftGame');
  };

  // Handle queue reordering (moderator only)
  const handleQueueReorder = async (newQueue) => {
    if (!moderator) return; // Only moderators can reorder
    
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      queue: newQueue
    });
    
    // Add history entry for moderator action
    addHistoryEntry('reorderedQueue', moderator.displayName || moderator.username);
  };

  // Helper functions to identify admins and moderators
  const isAdmin = (name) => {
    return moderator?.isAdmin && name === moderator.displayName;
  };
  
  const isModerator = (name) => {
    return moderator && !moderator.isAdmin && name === moderator.displayName;
  };

  // Helper function to check if a player is on appointment
  const isOnAppointment = (name) => {
    return busyPlayers.some(item => typeof item === 'object' ? item.name === name : item === name);
  };
  
  // Helper function to get appointment timestamp for a player
  const getAppointmentTime = (name) => {
    const appointmentItem = busyPlayers.find(item => 
      typeof item === 'object' ? item.name === name : item === name
    );
    return appointmentItem && typeof appointmentItem === 'object' ? appointmentItem.timestamp : null;
  };
  
  // Export history to a format that can be copied to Google Docs
const handleExportHistory = (historyData) => {
  // Format the history data for export
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  let exportText = `# Activity Log for ${roomName} - ${today}\n\n`;
  
  // Group by date
  const groupedHistory = {};
  historyData.forEach(entry => {
    // Get the display time
    let timeString = entry.displayTime;
    if (!timeString && entry.timestamp) {
      if (typeof entry.timestamp === 'string') {
        const date = new Date(entry.timestamp);
        timeString = date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } else if (entry.timestamp.toDate) {
        timeString = entry.timestamp.toDate().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
    }
    
    if (!timeString) {
      timeString = 'Unknown time';
    }
    
    if (!groupedHistory[timeString]) {
      groupedHistory[timeString] = [];
    }
    
    let actionText = '';
    switch (entry.action) {
      case 'joinedQueue':
        actionText = `${entry.player} joined the queue`;
        break;
      case 'leftQueue':
        actionText = `${entry.player} left the queue`;
        break;
      case 'skippedTurn':
        actionText = `${entry.player} skipped their turn`;
        break;
      case 'wentOnAppointment':
        actionText = `${entry.player} went on appointment`;
        break;
      case 'returnedFromAppointment':
        actionText = `${entry.player} returned from appointment`;
        break;
      case 'wentOutOfRotation':
        actionText = `${entry.player} went out of rotation`;
        break;
      case 'leftGame':
        actionText = `${entry.player} left the game`;
        break;
      case 'reorderedQueue':
        actionText = `${entry.player} reordered the queue`;
        break;
      default:
        actionText = `${entry.player} performed an action`;
    }
    
    groupedHistory[timeString].push(actionText);
  });
  
  // Format the export
  Object.keys(groupedHistory).sort().forEach(timeString => {
    exportText += `## ${timeString}\n`;
    groupedHistory[timeString].forEach(action => {
      exportText += `- ${action}\n`;
    });
    exportText += '\n';
  });
  
  // Create a "downloadable" text
  const blob = new Blob([exportText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${roomName.replace(/\s+/g, '-')}_Activity_Log_${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

// Function to save history to historical records collection
const saveHistoryToArchive = async () => {
  try {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Create a unique ID for today's record
    const recordId = `${roomId}_${dateString}`;
    
    // Reference to the historical_records collection
    const historyRef = doc(db, 'historical_records', recordId);
    
    // Check if a record for today already exists
    const existingRecord = await getDoc(historyRef);
    
    if (existingRecord.exists()) {
      // Update existing record
      await updateDoc(historyRef, {
        history: history,
        lastUpdated: new Date().toISOString(),
        roomName: roomName,
        shiftEnd: shiftEnd
      });
    } else {
      // Create new record
      await setDoc(historyRef, {
        roomId: roomId,
        date: dateString,
        roomName: roomName,
        history: history,
        shiftEnd: shiftEnd,
        createdAt: new Date().toISOString()
      });
    }
    
    console.log(`History archived for ${roomName} on ${dateString}`);
    return true;
  } catch (error) {
    console.error("Error saving history to archive:", error);
    return false;
  }
};

// Then, update the shift end check function:
useEffect(() => {
  const checkShiftEnd = () => {
    if (!shiftEnd) return;
    
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
    
    // Parse shift end time (e.g., "3:00 PM" -> comparable format)
    const shiftEndTime = new Date();
    const [time, period] = shiftEnd.split(' ');
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours);
    
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    shiftEndTime.setHours(hour, parseInt(minutes), 0);
    
    // If current time is past shift end, save history and then remove player
    if (now > shiftEndTime) {
      // Save history before leaving
      saveHistoryToArchive().then(() => {
        handleLeaveGame();
        alert(`Your shift has ended at ${shiftEnd}. You have been removed from the game. Today's history has been archived.`);
        navigate('/');
      });
    }
  };
  
  // Check immediately
  checkShiftEnd();
  
  // Check every minute
  const interval = setInterval(checkShiftEnd, 60000);
  
  return () => clearInterval(interval);
}, [shiftEnd, navigate, history]);

// this is for the history restting at 8:01pm
useEffect(() => {
  // Check once on component mount
  resetHistoryAtEndOfDay();
  
  // Then check every 5 minutes
  const interval = setInterval(() => {
    resetHistoryAtEndOfDay();
  }, 5 * 60 * 1000); // 5 minutes in milliseconds
  
  return () => clearInterval(interval);
}, []);

  // Styling
  const container = css`
    min-height: 100vh;
    background-color: #fff8f0;
    padding: 2rem;
    padding-bottom: 6rem; /* Add space for fixed buttons */
    box-sizing: border-box;
    position: relative; /* For positioning the fixed buttons */
  `;
  
  const header = css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  `;
  
  const title = css`
    font-size: clamp(1.5rem, 6vw, 2.5rem);
    font-family: 'Lilita One', cursive;
    color: #a47148;
  `;
  
  const infoBar = css`
    display: flex;
    align-items: center;
    gap: 1rem;
  `;
  
  const playerInfo = css`
    display: flex;
    gap: 1rem;
    align-items: center;
    font-family: Poppins, sans-serif;
    color: #4b3b2b;
  `;
  
  const card = css`
    background-color: #f6dfdf;
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  `;
  
  const cardTitle = css`
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 1.25rem;
    color: #4b3b2b;
    margin-bottom: 1rem;
  `;
  
  const playerList = css`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  `;
  
  const playerItem = css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background-color: white;
    border-radius: 0.5rem;
    font-family: Poppins, sans-serif;
    
    .position {
      font-weight: 600;
      color: #a47148;
      margin-right: 0.5rem;
    }
  `;
  
  // New style for the appointment banner
  const appointmentBanner = css`
    display: inline-flex;
    align-items: center;
    background-color: #9c27b0; /* Bright purple color */
    color: white;
    font-family: Poppins, sans-serif;
    font-size: 0.75rem;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    margin-left: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    
    .appointment-time {
      font-size: 0.625rem;
      margin-left: 0.25rem;
      opacity: 0.9;
    }
  `;
  
  const buttonGroup = css`
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #fff8f0;
    padding: 1rem;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    justify-content: center;
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
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    
    &:hover {
      background-color: #c56c6c;
    }
    
    &:disabled {
      background-color: #d3a7a7;
      cursor: not-allowed;
    }
    
    &.secondary {
      background-color: #8d9e78;
      
      &:hover {
        background-color: #768a62;
      }
    }
    
    &.tertiary {
      background-color: #a47148;
      
      &:hover {
        background-color: #8a5d3b;
      }
    }

    &.danger {
      background-color: #b71c1c;
      
      &:hover {
        background-color: #8e0000;
      }
    }
    
    &.appointment {
      background-color: #9c27b0; /* Bright purple color */
      
      &:hover {
        background-color: #7b1fa2;
      }
    }
  `;

  // New style for the leave button in the header
  const leaveButton = css`
    background-color: #b71c1c;
    color: white;
    border: none;
    border-radius: 1rem;
    padding: 0.5rem 1rem;
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background-color 0.2s;
    margin-left: 1rem;
    
    &:hover {
      background-color: #8e0000;
    }
  `;
  
  if (loading) {
    return (
      <div className={container}>
        <div>Loading...</div>
      </div>
    );
  }
  
  return (
    <div className={container}>
      <div className={header}>
        <h1 className={title}>{roomName}</h1>
        <div className={infoBar}>
          <div className={playerInfo}>
            <span>Playing as: {playerName}</span>
            <span>Shift ends: {shiftEnd}</span>
            {moderator && <ModeratorBadge />}
          </div>
          {/* Leave button moved to header */}
          <button
            className={leaveButton}
            onClick={() => {
              if (window.confirm('Are you sure you want to leave the game?')) {
                handleLeaveGame();
                navigate('/');
              }
            }}
          >
            Leave Game
          </button>
        </div>
      </div>
    
      {/* Queue Display */}
      <div className={card}>
        <div className={cardTitle}>Current Queue</div>
        <QueueDisplay 
          queue={queue}
          currentPlayer={playerName}
          isModerator={isModerator}
          isAdmin={isAdmin}
          isOnAppointment={isOnAppointment}
          getAppointmentTime={getAppointmentTime}
        />
      </div>

      {/* Moderator Queue Control */}
      {moderator && queue.length > 0 && (
        <div className={card}>
          <ModeratorQueueControl
            queue={queue}
            currentPlayer={playerName}
            isModerator={isModerator}
            isAdmin={isAdmin}
            isOnAppointment={isOnAppointment}
            getAppointmentTime={getAppointmentTime}
            onReorder={handleQueueReorder}
          />
        </div>
      )}
      
      {/* Out of Rotation Players */}
      <div className={card}>
        <div className={cardTitle}>Out of Rotation ({outOfRotationPlayers.length})</div>
        {outOfRotationPlayers.length > 0 ? (
          <div className={playerList}>
            {outOfRotationPlayers.map((player) => (
              <div key={player} className={playerItem}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {player}
                  {player === playerName && ' (You)'}
                  {isAdmin(player) && <AdminBadge />}
                  {isModerator(player) && <ModeratorBadge />}
                  {isOnAppointment(player) && (
                    <div className={appointmentBanner}>
                      ON APPOINTMENT
                      <span className="appointment-time">
                        {getAppointmentTime(player)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>No one is out of rotation</div>
        )}
      </div>
      
      {/* On Appointment Players */}
      <div className={card}>
        <div className={cardTitle}>On Appointment ({busyPlayers.length})</div>
        {busyPlayers.length > 0 ? (
          <div className={playerList}>
            {busyPlayers.map((playerData) => {
              const playerName = typeof playerData === 'object' ? playerData.name : playerData;
              const timestamp = typeof playerData === 'object' ? playerData.timestamp : null;
              
              return (
                <div key={playerName} className={playerItem}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {playerName}
                    {playerName === playerName && ' (You)'}
                    {isAdmin(playerName) && <AdminBadge />}
                    {isModerator(playerName) && <ModeratorBadge />}
                    <div className={appointmentBanner}>
                      ON APPOINTMENT
                      <span className="appointment-time">
                        {timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>No one is on appointment</div>
        )}
      </div>
      
      {/* Activity History */}
<div className={card}>
  <div className={cardTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span>Activity History</span>
    {/* Add manual archive button for admins/moderators */}
    {moderator && (
      <button
        className={`${button} secondary`}
        onClick={async () => {
          const success = await saveHistoryToArchive();
          if (success) {
            alert('Current history has been archived successfully!');
          } else {
            alert('Failed to archive history. Please try again.');
          }
        }}
        style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}
      >
        <span role="img" aria-label="Archive">📁</span> Archive History
      </button>
    )}
  </div>
  <ActivityHistory 
    history={history} 
    isAdmin={!!moderator} 
    onExport={handleExportHistory} 
  />
</div>
      
      {/* Action Buttons - At bottom of screen (without the Leave button) */}
      <div className={buttonGroup}>
        <button
          className={button}
          onClick={handleJoinQueue}
          disabled={playerStatus === 'inQueue'}
        >
          Join Rotation
        </button>
        <button
          className={`${button} secondary`}
          onClick={handleSkipTurn}
          disabled={playerStatus !== 'inQueue'}
        >
          Skip Me
        </button>
        <button
          className={`${button} tertiary`}
          onClick={handleOutOfRotation}
          disabled={playerStatus === 'outOfRotation'}
        >
          Out
        </button>
        {/* New Appointment Button with Calendar Icon */}
        <button
          className={`${button} appointment`}
          onClick={handleOnAppointment}
          disabled={playerStatus === 'onAppointment'}
        >
          <span role="img" aria-label="Calendar">📅</span> Appointment
        </button>
      </div>
    </div>
  );
}