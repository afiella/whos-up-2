// src/components/room/RoomPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { db } from '../../firebase/config';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, serverTimestamp, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import ModeratorBadge from '../ui/ModeratorBadge';
import QueueDisplay from './QueueDisplay';
import ModeratorQueueControl from './ModeratorQueueControl';
import AdminBadge from '../ui/AdminBadge';

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
  const [outOfRotationPlayers, setOutOfRotationPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerStatus, setPlayerStatus] = useState('waiting'); // 'inQueue', 'outOfRotation', 'waiting'
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
          lastUpdated: serverTimestamp()
        });
      }
    };
    
    initRoom();
    
    // Listen for room updates
    const unsubscribe = onSnapshot(roomRef, (doc) => {
      const data = doc.data();
      if (data) {
        setQueue(data.queue || []);
        setOutOfRotationPlayers(data.outOfRotationPlayers || []);
        
        // Determine player's current status
        if (data.queue?.includes(playerName)) {
          setPlayerStatus('inQueue');
          setQueuePosition(data.queue.indexOf(playerName));
        } else if (data.outOfRotationPlayers?.includes(playerName)) {
          setPlayerStatus('outOfRotation');
        } else {
          setPlayerStatus('waiting');
        }
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [roomId, playerName, navigate]);
  
  // Handle joining the queue
  const handleJoinQueue = async () => {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      queue: arrayUnion(playerName),
      outOfRotationPlayers: arrayRemove(playerName)
    });
  };
  
  // Handle going out of rotation
  const handleOutOfRotation = async () => {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      outOfRotationPlayers: arrayUnion(playerName),
      queue: arrayRemove(playerName)
    });
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
      }
    }
  };
  
  // Handle leaving the game completely
  const handleLeaveGame = async () => {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      queue: arrayRemove(playerName),
      outOfRotationPlayers: arrayRemove(playerName)
    });
  };

  // Handle queue reordering (moderator only)
  const handleQueueReorder = async (newQueue) => {
    if (!moderator) return; // Only moderators can reorder
    
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      queue: newQueue
    });
  };

  // Helper functions to identify admins and moderators
  const isAdmin = (name) => {
    return moderator?.isAdmin && name === moderator.displayName;
  };
  
  const isModerator = (name) => {
    return moderator && !moderator.isAdmin && name === moderator.displayName;
  };

  
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
          <span>Playing as: {playerName}</span>
          <span>Shift ends: {shiftEnd}</span>
          {moderator && <ModeratorBadge />}
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
                <div>
                  {player}
                  {player === playerName && ' (You)'}
                  {isAdmin(player) && <AdminBadge />}
                  {isModerator(player) && <ModeratorBadge />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>No one is out of rotation</div>
        )}
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
        <button
          className={`${button} danger`}
          onClick={() => {
            if (window.confirm('Are you sure you want to leave the game?')) {
              handleLeaveGame();
              navigate('/');
            }
          }}
        >
          Leave
        </button>
      </div>
    </div>
  );
}