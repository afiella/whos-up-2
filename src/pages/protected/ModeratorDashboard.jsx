// src/pages/protected/ModeratorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAuth } from '../../context/AuthContext';

export default function ModeratorDashboard() {
  const { moderator, logout, registerModerator, fetchModerators } = useAuth();
  const navigate = useNavigate();
  
  // For adding new moderators (admin only)
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  
  // List of moderators (admin only)
  const [moderators, setModerators] = useState([]);

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
    
    // Create new moderator object using the same email for all moderators
    const newModerator = {
      username: newUsername,
      password: newPassword,
      displayName: newDisplayName,
      email: 'ellabellosei@gmail.com', // Same email for all moderators
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
      
      // Refresh the moderator list
      const fetchedModerators = await fetchModerators();
      setModerators(fetchedModerators);
    } else {
      setMessage(result.message);
      setMessageType('error');
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
            : 'You are logged in as a moderator. You can join the game with a special badge.'}
        </p>
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