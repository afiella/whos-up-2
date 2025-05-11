// src/pages/protected/ModeratorDashboard.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAuth } from '../../context/AuthContext';
import AdminBadge from '../../components/ui/AdminBadge';
import ModeratorBadge from '../../components/ui/ModeratorBadge';

export default function ModeratorDashboard() {
  const { moderator, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect admins to admin dashboard
  useEffect(() => {
    if (isAuthenticated && moderator?.isAdmin) {
      navigate('/admin-dashboard', { replace: true });
    }
  }, [isAuthenticated, moderator, navigate]);

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
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `;

  const text = css`
    font-family: Poppins, sans-serif;
    color: #4b3b2b;
    line-height: 1.6;
  `;

  const actionCard = css`
    background-color: white;
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
  `;

  const buttonGroup = css`
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  `;

  const roomBadge = css`
    display: inline-block;
    background-color: #d67b7b;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.875rem;
    font-family: Poppins, sans-serif;
    font-weight: 600;
    margin-left: 0.5rem;
  `;

  const infoGrid = css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  `;

  const infoItem = css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: Poppins, sans-serif;
    color: #4b3b2b;
  `;

  const infoLabel = css`
    font-weight: 600;
  `;

  // Helper function to get room display name
  const getRoomDisplayName = (roomId) => {
    switch (roomId) {
      case 'bh': return 'BH';
      case '59': return '59';
      case 'ashland': return 'Ashland';
      default: return roomId;
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const navigateToRoom = (roomId) => {
    navigate(`/${roomId}`, {
      state: {
        name: moderator.displayName || moderator.username,
        shiftEnd: '8:00 PM',
        shiftType: 'moderator'
      }
    });
  };

  // Don't render anything if not a moderator
  if (!moderator || !moderator.isModerator || moderator.isAdmin) {
    return null;
  }

  return (
    <div className={container}>
      <div className={header}>
        <h1 className={title}>Moderator Dashboard</h1>
        <button className={button} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Welcome Card */}
      <div className={card}>
        <div className={cardTitle}>
          Welcome, {moderator.displayName || moderator.username}!
          <ModeratorBadge />
        </div>
        
        <div className={infoGrid}>
          <div className={infoItem}>
            <span className={infoLabel}>Role:</span>
            <span>Moderator</span>
          </div>
          
          <div className={infoItem}>
            <span className={infoLabel}>Username:</span>
            <span>{moderator.username}</span>
          </div>
          
          {moderator.assignedRoom && (
            <div className={infoItem}>
              <span className={infoLabel}>Assigned Room:</span>
              <span className={roomBadge}>
                {getRoomDisplayName(moderator.assignedRoom)}
              </span>
            </div>
          )}
        </div>
        
        <p className={text} style={{ marginTop: '1rem' }}>
          You are a moderator for the {getRoomDisplayName(moderator.assignedRoom)} room. You can manage the queue and assist players.
        </p>
      </div>

      {/* Quick Actions */}
      <div className={card}>
        <div className={cardTitle}>Quick Actions</div>
        
        {moderator.assignedRoom && (
          <div>
            <p className={text} style={{ marginBottom: '1rem' }}>
              Access your assigned room to manage the queue:
            </p>
            <button 
              className={button}
              onClick={() => navigateToRoom(moderator.assignedRoom)}
            >
              Enter {getRoomDisplayName(moderator.assignedRoom)} Room
            </button>
          </div>
        )}
      </div>

      {/* Instructions Card */}
      <div className={card}>
        <div className={cardTitle}>How to Use</div>
        
        <div className={text}>
          <h3 style={{ marginBottom: '0.5rem', color: '#4b3b2b' }}>As a Moderator:</h3>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Enter your assigned room to manage the queue</li>
            <li>Use drag-and-drop to reorder players in the queue</li>
            <li>Your username appears with a Moderator badge</li>
            <li>Help players with queue management and issues</li>
            <li>You can join the queue yourself if needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}