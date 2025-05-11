// src/pages/protected/ModeratorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAuth } from '../../context/AuthContext';
import AdminBadge from '../../components/ui/AdminBadge';
import ModeratorBadge from '../../components/ui/ModeratorBadge';

export default function ModeratorDashboard() {
  const { moderator, logout } = useAuth();
  const navigate = useNavigate();

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

  const badge = css`
    display: inline-block;
    background-color: #a47148;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.875rem;
    font-family: Poppins, sans-serif;
    font-weight: 600;
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
    navigate('/');
  };

  const navigateToRoom = (roomId) => {
    navigate(`/${roomId}`, {
      state: {
        name: moderator.displayName || moderator.username,
        shiftEnd: '8:00 PM',
        shiftType: moderator.isAdmin ? 'admin' : 'moderator'
      }
    });
  };

  if (!moderator) {
    navigate('/mod-login');
    return null;
  }

  return (
    <div className={container}>
      <div className={header}>
        <h1 className={title}>
          {moderator.isAdmin ? 'Admin Dashboard' : 'Moderator Dashboard'}
        </h1>
        <div className={buttonGroup}>
          {moderator.isAdmin && (
            <button className={secondaryButton} onClick={() => navigate('/admin-dashboard')}>
              Admin Command Center
            </button>
          )}
          <button className={button} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Welcome Card */}
      <div className={card}>
        <div className={cardTitle}>
          Welcome, {moderator.displayName || moderator.username}!
          {moderator.isAdmin ? <AdminBadge /> : <ModeratorBadge />}
        </div>
        
        <div className={infoGrid}>
          <div className={infoItem}>
            <span className={infoLabel}>Role:</span>
            <span>{moderator.isAdmin ? 'Administrator' : 'Moderator'}</span>
          </div>
          
          <div className={infoItem}>
            <span className={infoLabel}>Username:</span>
            <span>{moderator.username}</span>
          </div>
          
          {moderator.assignedRoom && !moderator.isAdmin && (
            <div className={infoItem}>
              <span className={infoLabel}>Assigned Room:</span>
              <span className={roomBadge}>
                {getRoomDisplayName(moderator.assignedRoom)}
              </span>
            </div>
          )}
        </div>
        
        <p className={text} style={{ marginTop: '1rem' }}>
          {moderator.isAdmin 
            ? 'You have full administrative access to all rooms and can manage moderators.'
            : `You are a moderator for the ${getRoomDisplayName(moderator.assignedRoom)} room. You can manage the queue and assist players.`}
        </p>
      </div>

      {/* Quick Actions */}
      <div className={card}>
        <div className={cardTitle}>Quick Actions</div>
        
        {moderator.isAdmin ? (
          // Admin Quick Actions
          <div>
            <p className={text} style={{ marginBottom: '1rem' }}>
              Access any room or manage the entire system:
            </p>
            <div className={buttonGroup}>
              <button className={button} onClick={() => navigateToRoom('bh')}>
                Enter BH Room
              </button>
              <button className={button} onClick={() => navigateToRoom('59')}>
                Enter 59 Room
              </button>
              <button className={button} onClick={() => navigateToRoom('ashland')}>
                Enter Ashland Room
              </button>
              <button className={secondaryButton} onClick={() => navigate('/admin-dashboard')}>
                View All Rooms
              </button>
            </div>
          </div>
        ) : (
          // Moderator Quick Actions
          moderator.assignedRoom && (
            <div>
              <p className={text} style={{ marginBottom: '1rem' }}>
                Access your assigned room to manage the queue:
              </p>
              <button 
                className={button}
                onClick={() => navigateToRoom(moderator.assignedRoom)}
                style={{ marginRight: '1rem' }}
              >
                Enter {getRoomDisplayName(moderator.assignedRoom)} Room
              </button>
            </div>
          )
        )}
      </div>

      {/* Instructions Card */}
      <div className={card}>
        <div className={cardTitle}>How to Use</div>
        
        {moderator.isAdmin ? (
          <div className={text}>
            <h3 style={{ marginBottom: '0.5rem', color: '#4b3b2b' }}>As an Administrator:</h3>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Access the Admin Command Center to see all rooms at once</li>
              <li>Add new moderators and assign them to specific rooms</li>
              <li>Clear queues or manage players in any room</li>
              <li>Enter any room to help with queue management</li>
              <li>Your username appears with a special Admin badge</li>
            </ul>
          </div>
        ) : (
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
        )}
      </div>

      {/* Status Card */}
      <div className={card}>
        <div className={cardTitle}>Your Status</div>
        <div className={infoGrid}>
          <div className={actionCard}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                {moderator.isAdmin ? '👑' : '🛡️'}
              </div>
              <div style={{ fontWeight: '600', color: '#4b3b2b' }}>
                {moderator.isAdmin ? 'Administrator' : 'Room Moderator'}
              </div>
              {!moderator.isAdmin && moderator.assignedRoom && (
                <div style={{ marginTop: '0.5rem' }}>
                  <span className={roomBadge}>
                    {getRoomDisplayName(moderator.assignedRoom)} Room
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className={actionCard}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                {moderator.isAdmin ? '🏢' : '🚪'}
              </div>
              <div style={{ fontWeight: '600', color: '#4b3b2b' }}>
                {moderator.isAdmin ? 'All Rooms Access' : 'Single Room Access'}
              </div>
              <div style={{ marginTop: '0.5rem', color: '#6b6b6b' }}>
                {moderator.isAdmin 
                  ? 'Can manage all rooms' 
                  : `Can manage ${getRoomDisplayName(moderator.assignedRoom)}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}