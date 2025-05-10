// src/pages/protected/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, onSnapshot, doc } from 'firebase/firestore';

export default function AdminDashboard() {
  const { moderator, logout } = useAuth();
  const navigate = useNavigate();
  
  // State for all rooms data
  const [roomsData, setRoomsData] = useState({
    bh: { queue: [], busyPlayers: [], outOfRotationPlayers: [] },
    '59': { queue: [], busyPlayers: [], outOfRotationPlayers: [] },
    ashland: { queue: [], busyPlayers: [], outOfRotationPlayers: [] }
  });
  
  const [loading, setLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState('bh');
  
  // Listen to all rooms in real-time
  useEffect(() => {
    if (!moderator?.isAdmin) {
      navigate('/');
      return;
    }

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
  }, [moderator, navigate]);
  
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
  
  const playerSection = css`
    margin-bottom: 1rem;
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
  
  const detailView = css`
    background-color: white;
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  `;
  
  const detailHeader = css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  `;
  
  const detailTitle = css`
    font-family: 'Lilita One', cursive;
    font-size: 2rem;
    color: #a47148;
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
  
  // Helper function to get room display name
  const getRoomDisplayName = (roomId) => {
    switch (roomId) {
      case 'bh': return 'BH Room';
      case '59': return '59 Room';
      case 'ashland': return 'Ashland Room';
      default: return roomId;
    }
  };
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  // Clear a specific room's queue
  const clearRoomQueue = async (roomId) => {
    if (window.confirm(`Are you sure you want to clear the queue for ${getRoomDisplayName(roomId)}?`)) {
      // Implementation would go here - you'd need to add this to your Firebase functions
      console.log(`Clearing queue for ${roomId}`);
    }
  };
  
  // Navigate to specific room
  const navigateToRoom = (roomId) => {
    navigate(`/${roomId}`, { 
      state: { 
        name: moderator.displayName || moderator.username,
        shiftEnd: '8:00 PM',
        shiftType: 'admin'
      } 
    });
  };
  
  if (loading) {
    return (
      <div className={container}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Loading dashboard...
        </div>
      </div>
    );
  }
  
  return (
    <div className={container}>
      <div className={header}>
        <h1 className={title}>Admin Command Center</h1>
        <div className={buttonGroup}>
          <button className={secondaryButton} onClick={() => navigate('/mod-dashboard')}>
            Moderator View
          </button>
          <button className={button} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      
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
      
      {/* Detailed View for Selected Room */}
      <div className={detailView}>
        <div className={detailHeader}>
          <div className={detailTitle}>
            {getRoomDisplayName(activeRoom)} - Detailed View
          </div>
          <button 
            className={button}
            onClick={() => navigateToRoom(activeRoom)}
          >
            Enter This Room
          </button>
        </div>
        
        <div className={playerSection}>
          <div className={sectionTitle}>Queue ({roomsData[activeRoom].queue.length})</div>
          {roomsData[activeRoom].queue.length > 0 ? (
            roomsData[activeRoom].queue.map((player, index) => (
              <div key={player} className={playerItem}>
                <span className={queuePosition}>{index + 1}</span>
                {player}
              </div>
            ))
          ) : (
            <div className={emptyState}>Queue is empty</div>
          )}
        </div>
        
        <div className={playerSection}>
          <div className={sectionTitle}>Busy with Customer ({roomsData[activeRoom].busyPlayers.length})</div>
          {roomsData[activeRoom].busyPlayers.length > 0 ? (
            roomsData[activeRoom].busyPlayers.map((player) => (
              <div key={player} className={playerItem}>
                🟡 {player}
              </div>
            ))
          ) : (
            <div className={emptyState}>No one is busy</div>
          )}
        </div>
        
        <div className={playerSection}>
          <div className={sectionTitle}>Out of Rotation ({roomsData[activeRoom].outOfRotationPlayers.length})</div>
          {roomsData[activeRoom].outOfRotationPlayers.length > 0 ? (
            roomsData[activeRoom].outOfRotationPlayers.map((player) => (
              <div key={player} className={playerItem}>
                ⭕ {player}
              </div>
            ))
          ) : (
            <div className={emptyState}>No one out of rotation</div>
          )}
        </div>
      </div>
    </div>
  );
}