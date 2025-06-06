// src/components/room/RoomPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { db } from '../../firebase/config';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, serverTimestamp, getDoc, setDoc, collection } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import ModeratorBadge from '../ui/ModeratorBadge';
import QueueDisplay from './QueueDisplay';
import AdminBadge from '../ui/AdminBadge';
import ActivityHistory from './ActivityHistory';
import AdminControlsPanel from '../admin/AdminControlsPanel';

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
  
  // State for admin panel
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  // State for ghost player modal
  const [showGhostPlayerModal, setShowGhostPlayerModal] = useState(false);
  const [ghostPlayerName, setGhostPlayerName] = useState('');
  const [ghostPlayerShift, setGhostPlayerShift] = useState('');
  const [ghostPlayerMessage, setGhostPlayerMessage] = useState('');
  const [ghostPlayerMessageType, setGhostPlayerMessageType] = useState('');
  
  // Color themes for different rooms
  const roomThemes = {
    'bh': {
      primary: '#FF7900', // Orange color like Claude's upvote button
      secondary: '#FFF0E6', // Light peach/orange
      background: '#FFF8F2', // Very light cream/peach background
      button: '#FF9840', // Lighter orange button
      buttonHover: '#E86F00', // Darker orange on hover
      secondaryButton: '#6BB58E', // Complementary teal/green
      secondaryButtonHover: '#5A9A77', // Darker teal/green on hover
      appointmentColor: '#9C4EDD', // Purple for appointments
      appointmentHover: '#8536C8', // Darker purple on hover
    },
    '59': {
      primary: '#0A3463', // Navy blue
      secondary: '#D6E4F0', // Light blue
      background: '#F0F5FA', // Very light blue background
      button: '#275D8C', // Medium blue button
      buttonHover: '#1C4A78', // Darker blue button hover
      secondaryButton: '#5C8BAE', // Lighter blue secondary button
      secondaryButtonHover: '#4A7A9E', // Secondary button hover
      appointmentColor: '#5762D5', // Blue-purple for appointments
      appointmentHover: '#4251C4', // Darker blue-purple on hover
    },
    'ashland': {
      primary: '#477547', // Forest green primary
      secondary: '#E5F0E5', // Light green background
      background: '#F5FAF5', // Very light green background
      button: '#629562', // Medium green button
      buttonHover: '#4F784F', // Darker green on hover
      secondaryButton: '#9C7C38', // Complementary gold/tan
      secondaryButtonHover: '#866A30', // Darker gold/tan on hover
      appointmentColor: '#7B558C', // Purple-ish for appointments
      appointmentHover: '#674779', // Darker purple on hover
    }
  };
  
  // Get the current room's theme, defaulting to BH theme if not found
  const theme = roomThemes[roomId] || roomThemes['bh'];
  
  // Define shifts based on room and day
  const getShiftsForRoom = () => {
    const today = new Date().getDay(); // 0 is Sunday
    const isSunday = today === 0;
    
    const shifts = {
      '59': isSunday ? [
        { value: 'sunday', label: 'Sunday (11:30 AM - 6:00 PM)', endTime: '6:00 PM' }
      ] : [
        { value: 'double', label: 'Double (9:30 AM - 8:00 PM)', endTime: '8:00 PM' },
        { value: 'opening', label: 'Opening (9:30 AM - 3:00 PM)', endTime: '3:00 PM' },
        { value: 'close', label: 'Close (3:00 PM - 8:00 PM)', endTime: '8:00 PM' }
      ],
      'bh': isSunday ? [
        { value: 'sunday', label: 'Sunday (11:30 AM - 6:00 PM)', endTime: '6:00 PM' }
      ] : [
        { value: 'double', label: 'Double (8:30 AM - 8:00 PM)', endTime: '8:00 PM' },
        { value: 'opening', label: 'Opening (8:30 AM - 3:00 PM)', endTime: '3:00 PM' },
        { value: 'close', label: 'Close (3:00 PM - 8:00 PM)', endTime: '8:00 PM' },
        { value: 'afternoon', label: 'Afternoon (8:30 AM - 5:00 PM)', endTime: '5:00 PM' }
      ],
      'ashland': isSunday ? [
        { value: 'sunday', label: 'Sunday (11:30 AM - 6:00 PM)', endTime: '6:00 PM' }
      ] : [
        { value: 'double', label: 'Double (9:30 AM - 8:00 PM)', endTime: '8:00 PM' },
        { value: 'opening', label: 'Opening (9:30 AM - 3:00 PM)', endTime: '3:00 PM' },
        { value: 'close', label: 'Close (3:00 PM - 8:00 PM)', endTime: '8:00 PM' }
      ]
    };
    
    return shifts[roomId] || [];
  };
  
  // Handle adding a ghost player
  const handleAddGhostPlayer = async (e) => {
    e.preventDefault();
    
    if (!ghostPlayerName || !ghostPlayerShift) {
      setGhostPlayerMessage('Please enter player name and select a shift');
      setGhostPlayerMessageType('error');
      return;
    }
    
    try {
      // Find the shift details
      const shifts = getShiftsForRoom();
      const shift = shifts.find(s => s.value === ghostPlayerShift);
      
      if (!shift) {
        setGhostPlayerMessage('Invalid shift selected');
        setGhostPlayerMessageType('error');
        return;
      }
      
      // Add to manuallyAddedPlayers collection
      const manualPlayersRef = doc(db, 'manuallyAddedPlayers', 'players');
      const manualPlayersDoc = await getDoc(manualPlayersRef);
      
      const playerData = {
        name: ghostPlayerName,
        room: roomId,
        shiftEnd: shift.endTime,
        shiftType: shift.value,
        addedBy: moderator?.displayName || moderator?.username || playerName,
        addedAt: new Date().toISOString(),
        isGhostPlayer: true
      };
      
      if (manualPlayersDoc.exists()) {
        await updateDoc(manualPlayersRef, {
          [ghostPlayerName.toLowerCase()]: playerData
        });
      } else {
        await setDoc(manualPlayersRef, {
          [ghostPlayerName.toLowerCase()]: playerData
        });
      }
      
      // Add to room queue immediately
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        queue: arrayUnion(ghostPlayerName)
      });
      
      // Add history entry
      const historyEntry = {
        action: 'joinedQueue',
        player: ghostPlayerName,
        timestamp: new Date().toISOString(),
        displayTime: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        details: {
          actionBy: moderator?.displayName || moderator?.username || playerName,
          isGhostPlayer: true
        }
      };
      
      await updateDoc(roomRef, {
        history: arrayUnion(historyEntry)
      });
      
      setGhostPlayerMessage(`${ghostPlayerName} has been added to the queue`);
      setGhostPlayerMessageType('success');
      
      // Clear form after short delay
      setTimeout(() => {
        setGhostPlayerName('');
        setGhostPlayerShift('');
        setShowGhostPlayerModal(false);
        setGhostPlayerMessage('');
      }, 2000);
      
    } catch (error) {
      console.error('Error adding ghost player:', error);
      setGhostPlayerMessage('Failed to add ghost player');
      setGhostPlayerMessageType('error');
    }
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

  // Function for admins to save and clear history
  const saveAndClearHistory = async () => {
    try {
      // First, save history to archive
      const archiveSuccess = await saveHistoryToArchive();
      
      if (archiveSuccess) {
        // Then clear the history in the current room
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
          history: []
        });
        
        // Show confirmation to user
        alert('Activity history has been archived and cleared successfully.');
      } else {
        alert('Failed to archive history. History was not cleared.');
      }
    } catch (error) {
      console.error('Error saving and clearing history:', error);
      alert('An error occurred while trying to archive and clear history.');
    }
  };
  
  // Function to reset history at end of day (8:01pm)
  const resetHistoryAtEndOfDay = async () => {
    try {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // Check if it's 8:01pm (20 hours, 1 minute in 24-hour format)
      if (hours === 20 && minutes >= 1 && minutes < 6) {
        console.log("It's 8:01pm - resetting room data");
        
        // First archive current history if it exists and has entries
        if (history.length > 0) {
          await saveHistoryToArchive();
        }
        
        // Then clear ALL room data, not just history
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
          history: [],
          queue: [],
          outOfRotationPlayers: [],
          busyPlayers: []
        });
        
        console.log("Room has been completely reset for the next day");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error resetting room:", error);
      return false;
    }
  };
  
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
  
  // Add useEffect for checking and resetting history at 8:01pm
  useEffect(() => {
    // Create an async function inside useEffect
    const checkAndResetHistory = async () => {
      try {
        await resetHistoryAtEndOfDay();
      } catch (error) {
        console.error("Error checking history reset:", error);
      }
    };
    
    // Call it immediately
    checkAndResetHistory();
    
    // Set up interval with the async function
    const interval = setInterval(() => {
      checkAndResetHistory();
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(interval);
  }, []);
  
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
        
        // Check player's position in queue and status (CASE INSENSITIVE)
        // Check if player is in queue (case insensitive)
        const queueIndex = newQueue.findIndex(
          name => name.toLowerCase() === playerName.toLowerCase()
        );
        
        if (queueIndex !== -1) {
          setPlayerStatus('inQueue');
          setQueuePosition(queueIndex);
          
          // Notify if player is now first in queue
          if (queueIndex === 0 && oldPosition > 0) {
            console.log("User is now first in queue");
          }
        } 
        // Check if player is on appointment (case insensitive)
        else if (appointmentData.some(item => 
          typeof item === 'object' 
            ? item.name.toLowerCase() === playerName.toLowerCase() 
            : item.toLowerCase() === playerName.toLowerCase()
        )) {
          setPlayerStatus('onAppointment');
          setQueuePosition(-1);
        } 
        // Check if player is out of rotation (case insensitive)
        else if (data.outOfRotationPlayers?.some(
          name => name.toLowerCase() === playerName.toLowerCase()
        )) {
          setPlayerStatus('outOfRotation');
          setQueuePosition(-1);
        } 
        else {
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
      // Check if player name is valid
      if (!player || player === 'undefined') {
        console.error("Attempted to add history entry with invalid player name");
        return;
      }
      
      const roomRef = doc(db, 'rooms', roomId);
      const historyEntry = {
        action,
        player,
        timestamp: new Date().toISOString(), // Use ISO string format
        displayTime: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        details
      };
      
      await updateDoc(roomRef, {
        history: arrayUnion(historyEntry)
      });
      
      console.log(`Added history entry: ${action} by ${player}`);
    } catch (error) {
      console.error("Error adding history entry:", error);
    }
  };
  
  // Handle joining the queue
  const handleJoinQueue = async () => {
    const roomRef = doc(db, 'rooms', roomId);
    
    // Determine if player is coming back from appointment (case insensitive)
    const wasOnAppointment = busyPlayers.some(item => 
      typeof item === 'object' 
        ? item.name.toLowerCase() === playerName.toLowerCase() 
        : item.toLowerCase() === playerName.toLowerCase()
    );
    
    // Update status in Firestore
    const roomData = await getDoc(roomRef);
    const currentData = roomData.data();
    
    // Case insensitive check for removing
    await updateDoc(roomRef, {
      queue: arrayUnion(playerName),
      outOfRotationPlayers: arrayRemove(...(currentData.outOfRotationPlayers || [])
        .filter(name => name.toLowerCase() === playerName.toLowerCase())),
      busyPlayers: arrayRemove(...(currentData.busyPlayers || [])
        .filter(item => 
          typeof item === 'object' 
            ? item.name.toLowerCase() === playerName.toLowerCase() 
            : item.toLowerCase() === playerName.toLowerCase()
        ))
    });
    
    // Add appropriate history entry
    if (wasOnAppointment) {
      addHistoryEntry('returnedFromAppointment', playerName);
    } else {
      addHistoryEntry('joinedQueue', playerName);
    }
  };
  
  // Handle going out of rotation
  const handleOutOfRotation = async () => {
    const roomRef = doc(db, 'rooms', roomId);
    
    // Update status in Firestore - case insensitive
    const roomData = await getDoc(roomRef);
    const currentData = roomData.data();
    
    await updateDoc(roomRef, {
      outOfRotationPlayers: arrayUnion(playerName),
      queue: arrayRemove(...(currentData.queue || [])
        .filter(name => name.toLowerCase() === playerName.toLowerCase())),
      busyPlayers: arrayRemove(...(currentData.busyPlayers || [])
        .filter(item => 
          typeof item === 'object' 
            ? item.name.toLowerCase() === playerName.toLowerCase() 
            : item.toLowerCase() === playerName.toLowerCase()
        ))
    });
    
    // Add history entry
    addHistoryEntry('wentOutOfRotation', playerName);
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
    
    // First remove any existing appointment for this player (case insensitive)
    const roomData = await getDoc(roomRef);
    const currentData = roomData.data();
    
    // Update status in Firestore - case insensitive
    await updateDoc(roomRef, {
      busyPlayers: arrayUnion(appointmentData),
      queue: arrayRemove(...(currentData.queue || [])
        .filter(name => name.toLowerCase() === playerName.toLowerCase())),
      outOfRotationPlayers: arrayRemove(...(currentData.outOfRotationPlayers || [])
        .filter(name => name.toLowerCase() === playerName.toLowerCase()))
    });
    
    // Add history entry with timestamp details
    addHistoryEntry('wentOnAppointment', playerName, { timestamp });
  };

  // Handle skipping turn but staying in queue
  const handleSkipTurn = async () => {
    const roomRef = doc(db, 'rooms', roomId);
    const roomData = await getDoc(roomRef);
    
    if (roomData.exists()) {
      const currentQueue = roomData.data().queue || [];
      
      // Only proceed if player is in queue (case insensitive)
      const playerIndex = currentQueue.findIndex(
        name => name.toLowerCase() === playerName.toLowerCase()
      );
      
      if (playerIndex !== -1) {
        // Remove player from current position
        const newQueue = currentQueue.filter(name => 
          name.toLowerCase() !== playerName.toLowerCase()
        );
        
        // Add player to the end of queue - use the actual player name from queue to preserve case
        newQueue.push(currentQueue[playerIndex]);
        
        // Update queue in Firestore
        await updateDoc(roomRef, {
          queue: newQueue
        });
        
        // Add history entry
        addHistoryEntry('skippedTurn', playerName);
      }
    }
  };
  
  // Handle leaving the game completely
  const handleLeaveGame = async () => {
    const roomRef = doc(db, 'rooms', roomId);
    const roomData = await getDoc(roomRef);
    const currentData = roomData.data();
    
    // Update Firestore to remove player from all arrays (case insensitive)
    await updateDoc(roomRef, {
      queue: arrayRemove(...(currentData.queue || [])
        .filter(name => name.toLowerCase() === playerName.toLowerCase())),
      outOfRotationPlayers: arrayRemove(...(currentData.outOfRotationPlayers || [])
        .filter(name => name.toLowerCase() === playerName.toLowerCase())),
      busyPlayers: arrayRemove(...(currentData.busyPlayers || [])
        .filter(item => 
          typeof item === 'object' 
            ? item.name.toLowerCase() === playerName.toLowerCase() 
            : item.toLowerCase() === playerName.toLowerCase()
        ))
    });
    
    // Add history entry
    addHistoryEntry('leftGame', playerName);
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

  // Move a player to appointment status (for moderator use)
  const handleMoveToAppointment = async (playerName) => {
    try {
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
      
      // First get current data to handle case-insensitive operations
      const roomData = await getDoc(roomRef);
      const currentData = roomData.data();
      
      // Update status in Firestore - case insensitive
      await updateDoc(roomRef, {
        busyPlayers: arrayUnion(appointmentData),
        queue: arrayRemove(...(currentData.queue || [])
          .filter(name => name.toLowerCase() === playerName.toLowerCase())),
        outOfRotationPlayers: arrayRemove(...(currentData.outOfRotationPlayers || [])
          .filter(name => name.toLowerCase() === playerName.toLowerCase()))
      });
      
      // Add history entry with timestamp details and moderator action
      addHistoryEntry('wentOnAppointment', playerName, { 
        timestamp,
        actionBy: moderator?.displayName || playerName
      });
    } catch (error) {
      console.error('Error moving player to appointment:', error);
    }
  };

  // Move a player to queue (for moderator use)
  const handleMoveToQueue = async (playerName) => {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      
      // Determine if player is coming back from appointment (case insensitive)
      const wasOnAppointment = busyPlayers.some(item => 
        typeof item === 'object' 
          ? item.name.toLowerCase() === playerName.toLowerCase() 
          : item.toLowerCase() === playerName.toLowerCase()
      );
      
      // Get current data for case-insensitive operations
      const roomData = await getDoc(roomRef);
      const currentData = roomData.data();
      
      // Update status in Firestore - case insensitive
      await updateDoc(roomRef, {
        queue: arrayUnion(playerName),
        outOfRotationPlayers: arrayRemove(...(currentData.outOfRotationPlayers || [])
          .filter(name => name.toLowerCase() === playerName.toLowerCase())),
        busyPlayers: arrayRemove(...(currentData.busyPlayers || [])
          .filter(item => 
            typeof item === 'object' 
              ? item.name.toLowerCase() === playerName.toLowerCase() 
              : item.toLowerCase() === playerName.toLowerCase()
          ))
      });
      
      // Add appropriate history entry
      if (wasOnAppointment) {
        addHistoryEntry('returnedFromAppointment', playerName, {
          actionBy: moderator?.displayName || playerName
        });
      } else {
        addHistoryEntry('joinedQueue', playerName, {
          actionBy: moderator?.displayName || playerName
        });
      }
    } catch (error) {
      console.error('Error moving player to queue:', error);
    }
  };

  // Move a player to out of rotation (for moderator use)
  const handleMoveToOutOfRotation = async (playerName) => {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      
      // Get current data for case-insensitive operations
      const roomData = await getDoc(roomRef);
      const currentData = roomData.data();
      
      // Update status in Firestore - case insensitive
      await updateDoc(roomRef, {
        outOfRotationPlayers: arrayUnion(playerName),
        queue: arrayRemove(...(currentData.queue || [])
          .filter(name => name.toLowerCase() === playerName.toLowerCase())),
        busyPlayers: arrayRemove(...(currentData.busyPlayers || [])
          .filter(item => 
            typeof item === 'object' 
              ? item.name.toLowerCase() === playerName.toLowerCase() 
              : item.toLowerCase() === playerName.toLowerCase()
          ))
      });
      
      // Add history entry
      addHistoryEntry('wentOutOfRotation', playerName, {
        actionBy: moderator?.displayName || playerName
      });
    } catch (error) {
      console.error('Error moving player to out of rotation:', error);
    }
  };

  // Remove a player from the game completely (for moderator use)
  const handleRemovePlayer = async (playerName) => {
    try {
      if (window.confirm(`Are you sure you want to remove ${playerName} from the game?`)) {
        const roomRef = doc(db, 'rooms', roomId);
        
        // Get current data for case-insensitive operations
        const roomData = await getDoc(roomRef);
        const currentData = roomData.data();
        
        // Update Firestore to remove player from all arrays - case insensitive
        await updateDoc(roomRef, {
          queue: arrayRemove(...(currentData.queue || [])
            .filter(name => name.toLowerCase() === playerName.toLowerCase())),
          outOfRotationPlayers: arrayRemove(...(currentData.outOfRotationPlayers || [])
            .filter(name => name.toLowerCase() === playerName.toLowerCase())),
          busyPlayers: arrayRemove(...(currentData.busyPlayers || [])
            .filter(item => 
              typeof item === 'object' 
                ? item.name.toLowerCase() === playerName.toLowerCase() 
                : item.toLowerCase() === playerName.toLowerCase()
            ))
        });
        
        // Add history entry
        addHistoryEntry('leftGame', playerName, {
          actionBy: moderator?.displayName || playerName
        });
      }
    } catch (error) {
      console.error('Error removing player from game:', error);
    }
  };

  // Helper functions to identify admins and moderators
  const isAdmin = (name) => {
    return moderator?.isAdmin && name.toLowerCase() === moderator.displayName.toLowerCase();
  };
  
  const isModerator = (name) => {
    return moderator && !moderator.isAdmin && name.toLowerCase() === moderator.displayName.toLowerCase();
  };

  // Helper function to check if a player is on appointment
  const isOnAppointment = (name) => {
    return busyPlayers.some(item => 
      typeof item === 'object' 
        ? item.name.toLowerCase() === name.toLowerCase() 
        : item.toLowerCase() === name.toLowerCase()
    );
  };
  
  // Helper function to get appointment timestamp for a player
  const getAppointmentTime = (name) => {
    const appointmentItem = busyPlayers.find(item => 
      typeof item === 'object' 
        ? item.name.toLowerCase() === name.toLowerCase() 
        : item.toLowerCase() === name.toLowerCase()
    );
    return appointmentItem && typeof appointmentItem === 'object' ? appointmentItem.timestamp : null;
  };
  
  // Styling
  const container = css`
    min-height: 100vh;
    background-color: ${theme.background};
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
    color: ${theme.primary};
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
    background-color: ${theme.secondary};
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  `;
  
  const cardTitle = css`
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 1.25rem;
    color: ${theme.primary};
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
      color: ${theme.primary};
      margin-right: 0.5rem;
    }
  `;
  
  // New style for the appointment banner
  const appointmentBanner = css`
    display: inline-flex;
    align-items: center;
    background-color: ${theme.appointmentColor}; /* Room-themed color */
    color: white;
    font-family: Poppins, sans-serif;
    font-size: 0.75rem;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    margin-left: 0.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    
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
    background-color: ${theme.background};
    padding: 1rem;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    justify-content: center;
    z-index: 100;
  `;
  
  const button = css`
    background-color: ${theme.button};
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
      background-color: ${theme.buttonHover};
    }
    
    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    &.secondary {
      background-color: ${theme.secondaryButton};
      
      &:hover {
        background-color: ${theme.secondaryButtonHover};
      }
    }
    
    &.tertiary {
      background-color: ${theme.primary};
      
      &:hover {
        background-color: ${theme.buttonHover};
      }
    }

    &.danger {
      background-color: #b71c1c;
      
      &:hover {
        background-color: #8e0000;
      }
    }
    
    &.appointment {
      background-color: ${theme.appointmentColor};
      
      &:hover {
        background-color: ${theme.appointmentHover};
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
  
  // Style for the admin controls button
  const adminButton = css`
    background-color: ${theme.primary};
    color: white;
    border: none;
    border-radius: 1rem;
    padding: 0.5rem 1rem;
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    margin-right: 0.5rem;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: ${theme.buttonHover};
    }
  `;
  
  // Style for ghost player button
  const ghostPlayerButton = css`
    background-color: #9c27b0;
    color: white;
    border: none;
    border-radius: 1rem;
    padding: 0.5rem 1rem;
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;  
    cursor: pointer;
    margin-right: 0.5rem;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #7b1fa2;
    }
  `;
  
  // Modal styling
  const modalOverlay = css`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;
  
  const modalContent = css`
    background-color: white;
    border-radius: 1rem;
    padding: 2rem;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  `;
  
  const modalTitle = css`
    font-family: 'Lilita One', cursive;
    color: ${theme.primary};
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    text-align: center;
  `;
  
  const form = css`
    display: flex;
    flex-direction: column;
    gap: 1rem;
  `;
  
  const label = css`
    display: block;
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    color: #4b3b2b;
    margin-bottom: 0.5rem;
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
      border-color: ${theme.primary};
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
      border-color: ${theme.primary};
    }
  `;
  
  const messageDisplay = css`
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-top: 1rem;
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
  
  const modalButtons = css`
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  `;
  
  const modalButton = css`
    flex: 1;
    padding: 0.75rem;
    border: none;
    border-radius: 0.75rem;
    font-family: Poppins, sans-serif;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &.primary {
      background-color: ${theme.button};
      color: white;
      
      &:hover {
        background-color: ${theme.buttonHover};
      }
    }
    
    &.secondary {
      background-color: #e0e0e0;
      color: #4b3b2b;
      
      &:hover {
        background-color: #d0d0d0;
      }
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
          
          {/* Admin/Mod Controls Buttons */}
          {(moderator?.isAdmin || moderator?.isModerator) && (
            <>
              <button
                className={ghostPlayerButton}
                onClick={() => setShowGhostPlayerModal(true)}
              >
                <span role="img" aria-label="Ghost">👻</span> Add Ghost Player
              </button>
              
              {moderator?.isAdmin && (
                <>
                  <button
                    className={adminButton}
                    onClick={() => setShowAdminPanel(true)}
                  >
                    <span role="img" aria-label="Admin">👑</span> Admin Controls
                  </button>
                  
                  <button
                    className={adminButton}
                    style={{ backgroundColor: '#0a3463' }} // Dark blue for contrast
                    onClick={() => navigate('/admin-dashboard')}
                  >
                    <span role="img" aria-label="Dashboard">📊</span> Dashboard
                  </button>
                </>
              )}
            </>
          )}
          
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
    
      {/* Queue Display with new player management props */}
      <QueueDisplay 
        queue={queue}
        currentPlayer={playerName}
        isModerator={isModerator}
        isAdmin={isAdmin}
        isOnAppointment={isOnAppointment}
        getAppointmentTime={getAppointmentTime}
        onSaveAndClearHistory={saveAndClearHistory}
        history={history}
        // New props for player management
        onMoveToAppointment={handleMoveToAppointment}
        onMoveToQueue={handleMoveToQueue}
        onMoveToOutOfRotation={handleMoveToOutOfRotation}
        onRemovePlayer={handleRemovePlayer}
      />

      {/* Out of Rotation Players */}
      <div className={card}>
        <div className={cardTitle}>Out of Rotation ({outOfRotationPlayers.length})</div>
        {outOfRotationPlayers.length > 0 ? (
          <div className={playerList}>
            {outOfRotationPlayers.map((player) => (
              <div key={player} className={playerItem}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {player}
                  {player.toLowerCase() === playerName.toLowerCase() && ' (You)'}
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
              const playersName = typeof playerData === 'object' ? playerData.name : playerData;
              const timestamp = typeof playerData === 'object' ? playerData.timestamp : null;
              
              return (
                <div key={playersName} className={playerItem}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {playersName}
                    {playersName.toLowerCase() === playerName.toLowerCase() && ' (You)'}
                    {isAdmin(playersName) && <AdminBadge />}
                    {isModerator(playersName) && <ModeratorBadge />}
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
      
      {/* Action Buttons - At bottom of screen */}
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
        {/* Appointment Button with Calendar Icon */}
        <button
          className={`${button} appointment`}
          onClick={handleOnAppointment}
          disabled={playerStatus === 'onAppointment'}
        >
          <span role="img" aria-label="Calendar">📅</span> Appointment
        </button>
      </div>
      
      {/* Ghost Player Modal */}
      {showGhostPlayerModal && (
        <div className={modalOverlay} onClick={() => setShowGhostPlayerModal(false)}>
          <div className={modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={modalTitle}>Add Ghost Player</h2>
            
            <form className={form} onSubmit={handleAddGhostPlayer}>
              <div>
                <label className={label}>Player Name</label>
                <input
                  type="text"
                  className={input}
                  value={ghostPlayerName}
                  onChange={(e) => setGhostPlayerName(e.target.value)}
                  placeholder="Enter player name"
                  autoFocus
                />
              </div>
              
              <div>
                <label className={label}>Shift</label>
                <select
                  className={select}
                  value={ghostPlayerShift}
                  onChange={(e) => setGhostPlayerShift(e.target.value)}
                >
                  <option value="">Select a shift</option>
                  {getShiftsForRoom().map(shift => (
                    <option key={shift.value} value={shift.value}>
                      {shift.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {ghostPlayerMessage && (
                <div className={`${messageDisplay} ${ghostPlayerMessageType}`}>
                  {ghostPlayerMessage}
                </div>
              )}
              
              <div className={modalButtons}>
                <button
                  type="submit"
                  className={`${modalButton} primary`}
                >
                  Add to Queue
                </button>
                <button
                  type="button"
                  className={`${modalButton} secondary`}
                  onClick={() => setShowGhostPlayerModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Admin Controls Panel */}
      {moderator?.isAdmin && showAdminPanel && (
        <AdminControlsPanel
          roomId={roomId}
          roomData={{
            queue,
            outOfRotationPlayers,
            busyPlayers
          }}
          onClose={() => setShowAdminPanel(false)}
        />
      )}
    </div>
  );
}