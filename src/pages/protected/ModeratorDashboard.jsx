// src/pages/protected/ModeratorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export default function ModeratorDashboard() {
  const { moderator, logout, registerModerator, fetchModerators } = useAuth();
  const navigate = useNavigate();
  
  // For adding new moderators (admin only)
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  
  // List of moderators (admin only)
  const [moderators, setModerators] = useState([]);

  // For manually adding players to rooms
  const [playerName, setPlayerName] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [addPlayerMessage, setAddPlayerMessage] = useState('');
  const [addPlayerMessageType, setAddPlayerMessageType] = useState('');

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

  // Load moderators from Firebase (admin only)
  useEffect(() => {
    const loadModerators = async () => {
      if (moderator?.isAdmin) {
        const fetchedModerators = await fetchModerators();
        setModerators(fetchedModerators);
      }
    };
    
    if (moderator?.isAdmin) {
      loadModerators();
    }
  }, [moderator, fetchModerators]);

  const container = css`
    min-height: 100vh;
    background-color: #fff8f0;
    padding: 2rem;
    box-sizing: border-box;
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

  const button = css`
    background-color: #d67b7b;
    color: white;
    border: none;
    border-radius: 1.5rem;
    padding: 0.5rem 1.25rem;
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #c56c6c;
    }
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

  const form = css`
    display: flex;
    flex-direction: column;
    gap: 1rem;
  `;

  const formRow = css`
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  `;

  const formGroup = css`
    flex: 1;
    min-width: 200px;
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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleAddModerator = async (e) => {
    e.preventDefault();
    
    if (!newUsername || !newPassword || !newDisplayName || !newEmail) {
      setMessage('All fields are required');
      setMessageType('error');
      return;
    }
    
    // Create new moderator object
    const newModerator = {
      username: newUsername,
      password: newPassword,
      displayName: newDisplayName,
      email: newEmail,
      isModerator: true
    };
    
    const result = await registerModerator(newModerator);
    
    if (result.success) {
      setMessage('Moderator added successfully!');
      setMessageType('success');
      
      // Clear form fields
      setNewUsername('');
      setNewPassword('');
      setNewDisplayName('');
      setNewEmail('');
      
      // Refresh the moderator list
      const fetchedModerators = await fetchModerators();
      setModerators(fetchedModerators);
    } else {
      setMessage(result.message);
      setMessageType('error');
    }
  };

  const handleAddPlayerToRoom = async (e) => {
    e.preventDefault();
    
    if (!playerName || !selectedRoom || !selectedShift) {
      setAddPlayerMessage('All fields are required');
      setAddPlayerMessageType('error');
      return;
    }

    try {
      // Create or update the manuallyAddedPlayers document
      const manualPlayersRef = doc(db, 'manuallyAddedPlayers', 'players');
      const manualPlayersDoc = await getDoc(manualPlayersRef);
      
      const shift = shifts[selectedRoom].find(s => s.value === selectedShift);
      const playerData = {
        name: playerName,
        room: selectedRoom,
        shiftEnd: shift.endTime,
        shiftType: shift.value,
        addedBy: moderator.displayName || moderator.username,
        addedAt: new Date().toISOString()
      };

      if (manualPlayersDoc.exists()) {
        // Update existing document
        await updateDoc(manualPlayersRef, {
          [playerName.toLowerCase()]: playerData
        });
      } else {
        // Create new document
        await setDoc(manualPlayersRef, {
          [playerName.toLowerCase()]: playerData
        });
      }

      setAddPlayerMessage(`${playerName} has been added to ${selectedRoom.toUpperCase()} room`);
      setAddPlayerMessageType('success');
      
      // Clear form
      setPlayerName('');
      setSelectedRoom('');
      setSelectedShift('');
    } catch (error) {
      console.error('Error adding player:', error);
      setAddPlayerMessage('Failed to add player');
      setAddPlayerMessageType('error');
    }
  };

  return (
    <div className={container}>
      <div className={header}>
        <h1 className={title}>
          {moderator?.isAdmin ? 'Admin Dashboard' : 'Moderator Dashboard'}
        </h1>
        <button className={button} onClick={handleLogout}>
          Logout
        </button>
      </div>
      
      <div className={card}>
        <div className={cardTitle}>
          Welcome, {moderator?.displayName || moderator?.username}!
        </div>
        <p>
          {moderator?.isAdmin 
            ? 'You are logged in as an admin. You can manage moderators and access all features.'
            : 'You are logged in as a moderator. You can manually add players to rooms.'}
        </p>
      </div>

      {/* Section to manually add players to rooms */}
      <div className={card}>
        <div className={cardTitle}>Manually Add Player to Room</div>
        
        <form className={form} onSubmit={handleAddPlayerToRoom}>
          <div className={formRow}>
            <div className={formGroup}>
              <label className={label}>Player Name</label>
              <input
                type="text"
                className={input}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter player name"
              />
            </div>
            
            <div className={formGroup}>
              <label className={label}>Room</label>
              <select
                className={select}
                value={selectedRoom}
                onChange={(e) => {
                  setSelectedRoom(e.target.value);
                  setSelectedShift(''); // Reset shift when room changes
                }}
              >
                <option value="">Select a room</option>
                <option value="bh">BH</option>
                <option value="59">59</option>
                <option value="ashland">Ashland</option>
              </select>
            </div>
          </div>
          
          {selectedRoom && (
            <div className={formGroup}>
              <label className={label}>Shift</label>
              <select
                className={select}
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
              >
                <option value="">Select a shift</option>
                {shifts[selectedRoom].map(shift => (
                  <option key={shift.value} value={shift.value}>
                    {shift.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <button type="submit" className={button}>
            Add Player to Room
          </button>
        </form>
        
        {addPlayerMessage && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            backgroundColor: addPlayerMessageType === 'success' ? '#e0f2e9' : '#f9e0e0',
            color: addPlayerMessageType === 'success' ? '#2e7d32' : '#c62828',
            fontFamily: 'Poppins, sans-serif'
          }}>
            {addPlayerMessage}
          </div>
        )}
      </div>
      
      {/* Admin-only section to add new moderators */}
      {moderator?.isAdmin && (
        <div className={card}>
          <div className={cardTitle}>Add New Moderator</div>
          
          <form className={form} onSubmit={handleAddModerator}>
            <div className={formRow}>
              <div className={formGroup}>
                <label className={label}>Username</label>
                <input
                  type="text"
                  className={input}
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </div>
              
              <div className={formGroup}>
                <label className={label}>Password</label>
                <input
                  type="password"
                  className={input}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
            </div>
            
            <div className={formRow}>
              <div className={formGroup}>
                <label className={label}>Display Name</label>
                <input
                  type="text"
                  className={input}
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Enter display name"
                />
              </div>
              
              <div className={formGroup}>
                <label className={label}>Email</label>
                <input
                  type="email"
                  className={input}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </div>
            </div>
            
            <button type="submit" className={button}>
              Add Moderator
            </button>
          </form>
          
          {message && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              backgroundColor: messageType === 'success' ? '#e0f2e9' : '#f9e0e0',
              color: messageType === 'success' ? '#2e7d32' : '#c62828',
              fontFamily: 'Poppins, sans-serif'
            }}>
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}