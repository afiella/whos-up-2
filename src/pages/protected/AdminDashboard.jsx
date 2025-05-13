// src/pages/protected/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { onSnapshot, doc, updateDoc } from 'firebase/firestore';
import HistoryArchive from '../admin/HistoryArchive';
import AdminNav from '../admin/AdminNav';


export default function AdminDashboard() {
  const { moderator, logout, registerModerator, fetchModerators } = useAuth();
  const navigate = useNavigate();
  
  // State for all rooms data
  const [roomsData, setRoomsData] = useState({
    bh: { queue: [], busyPlayers: [], outOfRotationPlayers: [] },
    '59': { queue: [], busyPlayers: [], outOfRotationPlayers: [] },
    ashland: { queue: [], busyPlayers: [], outOfRotationPlayers: [] }
  });
  
  const [loading, setLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState('bh');
  
  // Moderator creation states
  const [showModeratorForm, setShowModeratorForm] = useState(false);
  const [newModeratorData, setNewModeratorData] = useState({
    username: '',
    password: '',
    displayName: '',
    assignedRoom: 'bh'
  });
  const [moderatorMessage, setModeratorMessage] = useState('');
  const [moderatorMessageType, setModeratorMessageType] = useState('');
  
  // List of all moderators
  const [allModerators, setAllModerators] = useState([]);
  
  // Listen to all rooms in real-time
  useEffect(() => {
    const unsubscribes = [];
    
    // Subscribe to each room
    ['bh', '59', 'ashland'].forEach(roomId => {
      const roomRef = doc(db, 'rooms', roomId);
      const unsubscribe = onSnapshot(roomRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setRoomsData(prev => ({
            ...prev,
            [roomId]: {
              queue: data.queue || [],
              busyPlayers: data.busyPlayers || [],
              outOfRotationPlayers: data.outOfRotationPlayers || []
            }
          }));
        }
      });
      unsubscribes.push(unsubscribe);
    });
    
    setLoading(false);
    
    // Cleanup subscriptions
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);
  
  // Load all moderators - only once when component mounts
  useEffect(() => {
    const loadModerators = async () => {
      const moderatorsList = await fetchModerators();
      setAllModerators(moderatorsList);
    };
    loadModerators();
  }, []); // Empty dependency array - only run once
  
  // Styles
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
    flex-wrap: wrap;
    gap: 1rem;
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
  
  const buttonGroup = css`
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  `;
  
  const secondaryButton = css`
    background-color: #8d9e78;
    color: white;
    border: none;
    border-radius: 1.5rem;
    padding: 0.5rem 1.25rem;
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #768a62;
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
    cursor: pointer;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
    }
    
    &.active {
      border: 3px solid #d67b7b;
    }
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
  
  const playerList = css`
    margin-top: 1rem;
  `;
  
  const sectionTitle = css`
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 0.875rem;
    color: #4b3b2b;
    margin-bottom: 0.5rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid #eacdca;
  `;
  
  const playerItem = css`
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    padding: 0.25rem 0;
    color: #4b3b2b;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `;
  
  const queuePosition = css`
    display: inline-block;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: #d67b7b;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 20px;
    text-align: center;
  `;
  
  const emptyState = css`
    text-align: center;
    color: #6b6b6b;
    font-style: italic;
    font-family: Poppins, sans-serif;
    padding: 0.5rem 0;
  `;
  
  const quickActions = css`
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1rem;
  `;
  
  const actionButton = css`
    background-color: #f6b93b;
    color: white;
    border: none;
    border-radius: 1rem;
    padding: 0.5rem 1rem;
    font-family: Poppins, sans-serif;
    font-size: 0.75rem;
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #e59f23;
    }
  `;
  
  // Moderator management styles
  const moderatorSection = css`
    background-color: white;
    border-radius: 1rem;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  `;
  
  const form = css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  `;
  
  const formGroup = css`
    display: flex;
    flex-direction: column;
  `;
  
  const label = css`
    font-family: Poppins, sans-serif;
    font-size: 0.875rem;
    color: #4b3b2b;
    margin-bottom: 0.25rem;
  `;
  
  const input = css`
    padding: 0.5rem;
    border: 1px solid #eacdca;
    border-radius: 0.5rem;
    font-family: Poppins, sans-serif;
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: #d67b7b;
    }
  `;
  
  const select = css`
    padding: 0.5rem;
    border: 1px solid #eacdca;
    border-radius: 0.5rem;
    font-family: Poppins, sans-serif;
    font-size: 1rem;
    background-color: white;
    cursor: pointer;
    
    &:focus {
      outline: none;
      border-color: #d67b7b;
    }
  `;
  
  const moderatorList = css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  `;
  
  const moderatorCard = css`
    background-color: #f6dfdf;
    padding: 1rem;
    border-radius: 0.5rem;
    font-family: Poppins, sans-serif;
  `;
  
  const moderatorName = css`
    font-weight: 600;
    color: #4b3b2b;
    margin-bottom: 0.25rem;
  `;
  
  const moderatorInfo = css`
    font-size: 0.875rem;
    color: #6b6b6b;
  `;
  
  const badge = css`
    display: inline-block;
    background-color: #d67b7b;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    margin-top: 0.5rem;
  `;
  
  // Helper function to get room display name
  const getRoomDisplayName = (roomId) => {
    switch (roomId) {
      case 'bh': return 'BH Room';
      case '59': return '59 Room';
      case 'ashland': return 'Ashland Room';
      default: return roomId;
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  // Clear a specific room's queue
  const clearRoomQueue = async (roomId) => {
    if (window.confirm(`Are you sure you want to clear the queue for ${getRoomDisplayName(roomId)}?`)) {
      try {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
          queue: []
        });
      } catch (error) {
        console.error('Error clearing queue:', error);
      }
    }
  };
  
  // Navigate to specific room
  const navigateToRoom = (roomId) => {
    navigate(`/${roomId}`, { 
      state: { 
        name: 'Ella',
        shiftEnd: '8:00 PM',
        shiftType: 'admin'
      } 
    });
  };
  
  // Handle moderator form submission
  const handleAddModerator = async (e) => {
    e.preventDefault();
    
    if (!newModeratorData.username || !newModeratorData.password || 
        !newModeratorData.displayName || !newModeratorData.assignedRoom) {
      setModeratorMessage('All fields are required');
      setModeratorMessageType('error');
      return;
    }
    
    try {
      const uniqueEmail = `${newModeratorData.username}@whosup-${newModeratorData.assignedRoom}.com`;
      
      const result = await registerModerator({
        ...newModeratorData,
        email: uniqueEmail,
        isModerator: true
      });
      
      if (result.success) {
        setModeratorMessage(`${newModeratorData.displayName} added successfully!`);
        setModeratorMessageType('success');
        
        // Reset form
        setNewModeratorData({
          username: '',
          password: '',
          displayName: '',
          assignedRoom: 'bh'
        });
        
        // Refresh moderator list
        const updatedModerators = await fetchModerators();
        setAllModerators(updatedModerators);
      } else {
        setModeratorMessage(result.message);
        setModeratorMessageType('error');
      }
    } catch (error) {
      setModeratorMessage('Error adding moderator');
      setModeratorMessageType('error');
    }
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
        <div className={buttonGroup}>
        <button 
      className={button} // or whatever your button style is
      onClick={() => navigate('/admin/players')}
      style={{ 
        marginRight: '1rem',
        backgroundColor: '#8d9e78', // Use a different color to make it stand out
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}
    >
      <span role="img" aria-label="Players">👥</span> Manage Players
    </button>
    <div 
  style={{ 
    display: 'flex', 
    flexWrap: 'wrap', 
    gap: '1rem', 
    marginBottom: '2rem',
    padding: '1rem',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
  }}
>
  <button 
    className={button} // Use whatever your button style is named
    onClick={() => navigate('/admin/players')}
    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
  >
    <span role="img" aria-label="Players">👥</span> Manage Players
  </button>
  
  <button 
    className={button}
    onClick={() => navigate('/admin/history')}
    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
  >
    <span role="img" aria-label="History">📚</span> History Archive
  </button>
  
  <button 
    className={button}
    onClick={() => navigate('/admin/settings')}
    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
  >
    <span role="img" aria-label="Settings">⚙️</span> Settings
  </button>
</div>

          <button 
            className={secondaryButton} 
            onClick={() => setShowModeratorForm(!showModeratorForm)}
          >
            {showModeratorForm ? 'Hide Moderator Form' : 'Add Moderator'}
          </button>
          <button className={button} onClick={handleLogout}>
            Logout
          </button>
        </div>
        
      </div>
      <div style={{ 
  display: 'flex', 
  flexWrap: 'wrap', 
  gap: '1rem', 
  marginBottom: '2rem'
}}>

</div>
      
      {/* Moderator Management Section */}
      {showModeratorForm && (
        <div className={moderatorSection}>
          <h2 className={sectionTitle} style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Add New Moderator
          </h2>
          
          <form className={form} onSubmit={handleAddModerator}>
            <div className={formGroup}>
              <label className={label}>Username</label>
              <input
                type="text"
                className={input}
                value={newModeratorData.username}
                onChange={(e) => setNewModeratorData(prev => ({
                  ...prev,
                  username: e.target.value
                }))}
                placeholder="Enter username"
              />
            </div>
            
            <div className={formGroup}>
              <label className={label}>Password</label>
              <input
                type="password"
                className={input}
                value={newModeratorData.password}
                onChange={(e) => setNewModeratorData(prev => ({
                  ...prev,
                  password: e.target.value
                }))}
                placeholder="Enter password"
              />
            </div>
            
            <div className={formGroup}>
              <label className={label}>Display Name</label>
              <input
                type="text"
                className={input}
                value={newModeratorData.displayName}
                onChange={(e) => setNewModeratorData(prev => ({
                  ...prev,
                  displayName: e.target.value
                }))}
                placeholder="Enter display name"
              />
            </div>
            
            <div className={formGroup}>
              <label className={label}>Assigned Room</label>
              <select
                className={select}
                value={newModeratorData.assignedRoom}
                onChange={(e) => setNewModeratorData(prev => ({
                  ...prev,
                  assignedRoom: e.target.value
                }))}
              >
                <option value="bh">BH Room</option>
                <option value="59">59 Room</option>
                <option value="ashland">Ashland Room</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              className={button} 
              style={{ gridColumn: 'span 4', marginTop: '1rem' }}
            >
              Add Moderator
            </button>
          </form>
          
          {moderatorMessage && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              backgroundColor: moderatorMessageType === 'success' ? '#e0f2e9' : '#f9e0e0',
              color: moderatorMessageType === 'success' ? '#2e7d32' : '#c62828',
              fontFamily: 'Poppins, sans-serif'
            }}>
              {moderatorMessage}
            </div>
          )}
          
          <h3 style={{ 
            marginTop: '2rem', 
            marginBottom: '1rem', 
            fontFamily: 'Poppins, sans-serif',
            color: '#4b3b2b' 
          }}>
            Current Moderators
          </h3>
          
          <div className={moderatorList}>
            {allModerators.map((mod) => (
              <div key={mod.id} className={moderatorCard}>
                <div className={moderatorName}>{mod.displayName}</div>
                <div className={moderatorInfo}>Username: {mod.username}</div>
                <div className={moderatorInfo}>Role: {mod.isAdmin ? 'Admin' : 'Moderator'}</div>
                {mod.assignedRoom && (
                  <div className={badge}>
                    {getRoomDisplayName(mod.assignedRoom)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Overview Grid - All Rooms */}
      <div className={overviewGrid}>
        {Object.entries(roomsData).map(([roomId, data]) => (
          <div 
            key={roomId} 
            className={`${roomCard} ${activeRoom === roomId ? 'active' : ''}`}
            onClick={() => setActiveRoom(roomId)}
          >
            <div className={roomTitle}>{getRoomDisplayName(roomId)}</div>
            
            <div className={statsSection}>
              <div className={statItem}>
                <span className={statNumber}>{data.queue.length}</span>
                <span className={statLabel}>In Queue</span>
              </div>
              <div className={statItem}>
                <span className={statNumber}>{data.busyPlayers.length}</span>
                <span className={statLabel}>Busy</span>
              </div>
              <div className={statItem}>
                <span className={statNumber}>{data.outOfRotationPlayers.length}</span>
                <span className={statLabel}>Out</span>
              </div>
            </div>
            
            {/* Quick preview of queue */}
            <div className={playerList}>
              <div className={sectionTitle}>Current Queue</div>
              {data.queue.length > 0 ? (
                data.queue.slice(0, 3).map((player, index) => (
                  <div key={player} className={playerItem}>
                    <span className={queuePosition}>{index + 1}</span>
                    {player}
                  </div>
                ))
              ) : (
                <div className={emptyState}>No one in queue</div>
              )}
              {data.queue.length > 3 && (
                <div className={emptyState}>
                  ...and {data.queue.length - 3} more
                </div>
              )}
            </div>
            
            <div className={quickActions}>
              <button 
                className={actionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToRoom(roomId);
                }}
              >
                Enter Room
              </button>
              <button 
                className={actionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  clearRoomQueue(roomId);
                }}
              >
                Clear Queue
              </button>
            </div>
          </div>
        ))}
      </div>
      <HistoryArchive />
      <AdminNav />
    </div>
  );
}