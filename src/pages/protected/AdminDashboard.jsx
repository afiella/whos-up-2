// src/pages/protected/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, onSnapshot, updateDoc, arrayRemove, getDoc, deleteDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const { moderator, logout, registerModerator, fetchModerators } = useAuth();
  const navigate = useNavigate();
  
  // State for all rooms data
  const [roomsData, setRoomsData] = useState({
    bh: { queue: [], busyPlayers: [], outOfRotationPlayers: [] },
    '59': { queue: [], busyPlayers: [], outOfRotationPlayers: [] },
    ashland: { queue: [], busyPlayers: [], outOfRotationPlayers: [] }
  });
  
  // For adding new moderators (admin only)
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  
  // List of moderators (admin only)
  const [moderators, setModerators] = useState([]);
  const [loading, setLoading] = useState(true);

  // Moderator management
  const [showModeratorDetails, setShowModeratorDetails] = useState(false);
  const [selectedModerator, setSelectedModerator] = useState(null);
  const [moderatorDetails, setModeratorDetails] = useState(null);

  // Load rooms data
  useEffect(() => {
    const fetchRoomsData = async () => {
      try {
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
        
        setRoomsData(roomsData);
      } catch (error) {
        console.error("Error fetching rooms data:", error);
      }
    };
    
    fetchRoomsData();
    
    // Set up real-time updates for each room
    const unsubscribes = [];
    
    for (const roomId of ['bh', '59', 'ashland']) {
      const roomRef = doc(db, 'rooms', roomId);
      const unsubscribe = onSnapshot(roomRef, (doc) => {
        if (doc.exists()) {
          setRoomsData(prev => ({
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

  // Load moderators from Firebase (admin only)
  useEffect(() => {
    const loadModerators = async () => {
      if (moderator?.isAdmin) {
        const fetchedModerators = await fetchModerators();
        setModerators(fetchedModerators);
      }
      setLoading(false);
    };
    
    if (moderator?.isAdmin) {
      loadModerators();
    } else {
      setLoading(false);
    }
  }, [moderator, fetchModerators]);

  // Fetch moderator details
  const fetchModeratorDetails = async (moderatorId) => {
    try {
      if (moderatorId === 'admin') {
        // For admin user, just display hardcoded credentials
        setModeratorDetails({
          username: 'admin',
          displayName: 'Ella',
          password: 'afiella', // This is from the hardcoded ADMIN_PASSWORD in AuthContext
          isAdmin: true
        });
        return;
      }
      
      const moderatorDoc = await getDoc(doc(db, 'moderators', moderatorId));
      if (moderatorDoc.exists()) {
        setModeratorDetails(moderatorDoc.data());
      } else {
        setMessage('Moderator details not found');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error fetching moderator details:', error);
      setMessage('Error loading moderator details');
      setMessageType('error');
    }
  };

  // Remove moderator
  const handleRemoveModerator = async (moderatorId) => {
    if (moderatorId === 'admin') {
      setMessage('Cannot remove the admin account');
      setMessageType('error');
      return;
    }
    
    if (window.confirm(`Are you sure you want to remove ${selectedModerator.displayName}? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'moderators', moderatorId));
        
        // Refresh the moderator list
        const fetchedModerators = await fetchModerators();
        setModerators(fetchedModerators);
        
        setMessage(`${selectedModerator.displayName} has been removed`);
        setMessageType('success');
        setShowModeratorDetails(false);
      } catch (error) {
        console.error('Error removing moderator:', error);
        setMessage('Error removing moderator');
        setMessageType('error');
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleAddModerator = async (e) => {
    e.preventDefault();
    
    if (!newUsername || !newPassword || !newDisplayName) {
      setMessage('All fields are required');
      setMessageType('error');
      return;
    }
    
    // Create new moderator object
    const newModerator = {
      username: newUsername,
      password: newPassword,
      displayName: newDisplayName,
      email: `${newUsername}@whosup.com`, // Generate an email
      isModerator: true
    };
    
    const result = await registerModerator(newModerator);
    
    if (result.success) {
      setMessage(`${newDisplayName} added successfully!`);
      setMessageType('success');
      
      // Clear form fields
      setNewUsername('');
      setNewPassword('');
      setNewDisplayName('');
      
      // Refresh the moderator list
      const fetchedModerators = await fetchModerators();
      setModerators(fetchedModerators);
    } else {
      setMessage(result.message);
      setMessageType('error');
    }
  };

  // Handle clearing a room
  const handleClearRoom = async (roomId) => {
    if (window.confirm(`Are you sure you want to clear all players from ${roomDisplayNames[roomId]}?`)) {
      try {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
          queue: [],
          outOfRotationPlayers: [],
          busyPlayers: []
        });
        
        setMessage(`Cleared all players from ${roomDisplayNames[roomId]}`);
        setMessageType('success');
        
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } catch (error) {
        console.error("Error clearing room:", error);
        setMessage(`Error clearing room: ${error.message}`);
        setMessageType('error');
      }
    }
  };

  // Styling
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

  const navigationBar = css`
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1rem;
    background-color: white;
    border-radius: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  `;

  const navButton = css`
    background-color: #f6dfdf;
    color: #4b3b2b;
    border: none;
    border-radius: 1rem;
    padding: 0.5rem 1.25rem;
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    &:hover {
      background-color: #d67b7b;
      color: white;
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

  const overviewGrid = css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  `;
  
  const roomCard = css`
    background-color: white;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  `;
  
  const roomTitle = css`
    font-family: 'Lilita One', cursive;
    font-size: 1.5rem;
    color: #a47148;
    margin-bottom: 1rem;
    text-align: center;
  `;
  
  const statsSection = css`
    display: flex;
    justify-content: space-around;
    margin-bottom: 1rem;
    text-align: center;
  `;
  
  const statItem = css`
    font-family: Poppins, sans-serif;
  `;
  
  const statNumber = css`
    font-size: 1.5rem;
    font-weight: 600;
    color: #d67b7b;
    display: block;
  `;
  
  const statLabel = css`
    font-size: 0.875rem;
    color: #6b6b6b;
  `;

  const actionButton = css`
    background-color: #8d9e78;
    color: white;
    border: none;
    border-radius: 0.75rem;
    padding: 0.5rem 1rem;
    font-family: Poppins, sans-serif;
    font-size: 0.75rem;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #768a62;
    }
    
    &.danger {
      background-color: #b71c1c;
      
      &:hover {
        background-color: #8e0000;
      }
    }
  `;

  const quickActions = css`
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 1rem;
  `;

  const roomDisplayNames = {
    'bh': 'BH Room',
    '59': '59 Room',
    'ashland': 'Ashland Room'
  };

  if (loading) {
    return (
      <div className={container}>
        <div>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className={container}>
      <div className={header}>
        <h1 className={title}>Admin Command Center</h1>
        <button className={button} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Admin Navigation Bar */}
      <div className={navigationBar}>
        <button 
          className={navButton}
          onClick={() => navigate('/admin/players')}
        >
          <span role="img" aria-label="Players">👥</span> Manage Players
        </button>
        
        <button 
          className={navButton}
          onClick={() => navigate('/admin/history')}
        >
          <span role="img" aria-label="History">📚</span> History Archive
        </button>
        
        <button 
          className={navButton}
          onClick={() => navigate('/admin/settings')}
        >
          <span role="img" aria-label="Settings">⚙️</span> Settings
        </button>
      </div>

      {/* Display success/error messages */}
      {message && (
        <div className={`${messageDisplay} ${messageType}`}>
          {message}
        </div>
      )}
      
      {/* Welcome Card */}
      <div className={card}>
        <div className={cardTitle}>
          Welcome, {moderator?.displayName || moderator?.username}!
        </div>
        <p>
          You are logged in as an admin. You can manage moderators, rooms, and access all features.
        </p>
      </div>
      
      {/* Moderator Management Section */}
      <div className={card}>
        <div className={cardTitle}>Manage Moderators</div>
        
        {moderators.length > 0 ? (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #eee' }}>Username</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #eee' }}>Display Name</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #eee' }}>Role</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #eee' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {moderators.map((mod) => (
                  <tr key={mod.id}>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{mod.username}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{mod.displayName}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                      {mod.isAdmin ? (
                        <span style={{ 
                          backgroundColor: '#d67b7b', 
                          color: 'white', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem'
                        }}>
                          Admin
                        </span>
                      ) : (
                        <span style={{ 
                          backgroundColor: '#a47148', 
                          color: 'white', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem'
                        }}>
                          Moderator
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                      <button 
                        className={button}
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                        onClick={() => {
                          setSelectedModerator(mod);
                          fetchModeratorDetails(mod.id);
                          setShowModeratorDetails(true);
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Moderator Details Modal */}
            {showModeratorDetails && selectedModerator && moderatorDetails && (
              <div 
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1000
                }}
              >
                <div 
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '1rem',
                    padding: '2rem',
                    width: '100%',
                    maxWidth: '500px',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <h3 style={{ 
                    fontFamily: 'Poppins, sans-serif', 
                    color: '#4b3b2b',
                    marginTop: 0,
                    borderBottom: '1px solid #eee',
                    paddingBottom: '0.5rem'
                  }}>
                    {selectedModerator.displayName} Details
                  </h3>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Username:</strong> {moderatorDetails.username}
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Display Name:</strong> {moderatorDetails.displayName}
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Password:</strong> {moderatorDetails.password}
                  </div>
                  
                  {moderatorDetails.email && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong>Email:</strong> {moderatorDetails.email}
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Role:</strong> {selectedModerator.isAdmin ? 'Admin' : 'Moderator'}
                  </div>
                  
                  {moderatorDetails.assignedRoom && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong>Assigned Room:</strong> {moderatorDetails.assignedRoom}
                    </div>
                  )}
                  
                  {moderatorDetails.createdAt && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong>Created:</strong> {new Date(moderatorDetails.createdAt).toLocaleString()}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                    {!selectedModerator.isAdmin && (
                      <button 
                        className={button}
                        style={{ backgroundColor: '#d67b7b' }}
                        onClick={() => handleRemoveModerator(selectedModerator.id)}
                      >
                        Remove Moderator
                      </button>
                    )}
                    <button 
                      className={button}
                      style={{ backgroundColor: '#8d9e78' }}
                      onClick={() => setShowModeratorDetails(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>No moderators found</div>
        )}
      </div>
      
      {/* Room Overview */}
      <div className={cardTitle} style={{ marginTop: '2rem' }}>Rooms Overview</div>
      <div className={overviewGrid}>
        {Object.entries(roomsData).map(([roomId, data]) => (
          <div key={roomId} className={roomCard}>
            <div className={roomTitle}>
              {roomDisplayNames[roomId] || roomId}
            </div>
            
            <div className={statsSection}>
              <div className={statItem}>
                <span className={statNumber}>{data.queue ? data.queue.length : 0}</span>
                <span className={statLabel}>In Queue</span>
              </div>
              <div className={statItem}>
                <span className={statNumber}>{data.busyPlayers ? data.busyPlayers.length : 0}</span>
                <span className={statLabel}>On Appointment</span>
              </div>
              <div className={statItem}>
                <span className={statNumber}>{data.outOfRotationPlayers ? data.outOfRotationPlayers.length : 0}</span>
                <span className={statLabel}>Out</span>
              </div>
            </div>
            
            <div className={quickActions}>
              <button 
                className={actionButton}
                onClick={() => navigate(`/${roomId}`, {
                  state: {
                    name: moderator.displayName,
                    shiftEnd: '8:00 PM',
                    shiftType: 'admin'
                  }
                })}
              >
                Enter Room
              </button>
              <button 
                className={`${actionButton} danger`}
                onClick={() => handleClearRoom(roomId)}
              >
                Clear Room
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Admin-only section to add new moderators */}
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
          
          <button type="submit" className={button}>
            Add Moderator
          </button>
        </form>
        
        {/* Message is displayed at the top of the page now */}
      </div>
    </div>
  );
}